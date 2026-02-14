import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const ARCHESTRA_URL = 'http://localhost:3000';
const ARCHESTRA_API_KEY = 'archestra_3e51cb91a735badab482f282c4386e3d';

app.use(cors());
app.use(express.json());

// Archestra API helper with API key authentication
const archestraFetch = async (endpoint, options = {}) => {
    const url = `${ARCHESTRA_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARCHESTRA_API_KEY}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Archestra API error: ${response.statusText} - ${error}`);
    }
    return response.json();
};

// Get MCP servers from Archestra
app.get('/api/mcp/discover', async (req, res) => {
    try {
        const data = await archestraFetch('/api/mcp/servers');
        const servers = data.servers || [];
        res.json({ success: true, servers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get nodes from Archestra (MCP servers + Agents)
app.get('/api/orchestra/nodes', async (req, res) => {
    try {
        const [mcpData, agentsData] = await Promise.all([
            archestraFetch('/api/mcp/servers').catch(err => {
                console.log('MCP fetch failed:', err.message);
                return { servers: [] };
            }),
            archestraFetch('/api/agents').catch(err => {
                console.log('Agents fetch failed:', err.message);
                return { agents: [] };
            })
        ]);

        const nodes = [];
        
        (mcpData.servers || []).forEach(server => {
            nodes.push({
                id: server.id,
                category: 'mcp',
                label: server.name,
                sublabel: server.description || 'MCP Server',
                icon: 'db',
                toolId: server.id
            });
        });

        (agentsData.agents || []).forEach(agent => {
            nodes.push({
                id: agent.id,
                category: 'provider',
                label: agent.name,
                sublabel: agent.description || 'AI Agent',
                icon: 'net',
                toolId: agent.id
            });
        });

        if (nodes.length === 0) {
            console.log('No nodes from Archestra. Use Archestra UI at http://localhost:3000 to add MCP servers and agents.');
            return res.json({ 
                success: false, 
                standardNodes: [],
                message: 'No nodes available. Install MCP servers and create agents in Archestra UI (http://localhost:3000)' 
            });
        }

        console.log(`Found ${nodes.length} nodes from Archestra`);
        res.json({ success: true, standardNodes: nodes });
    } catch (error) {
        console.error('Archestra connection error:', error.message);
        res.json({ 
            success: false, 
            standardNodes: [],
            message: 'Archestra not available. Start it with: docker run -p 3000:3000 archestra/platform' 
        });
    }
});

// Save topology and deploy to Archestra
app.post('/api/orchestra/save', async (req, res) => {
    const { nodes, edges } = req.body;
    try {
        const manifest = {
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            topology: { nodes, edges }
        };
        
        fs.writeFileSync(
            path.join(process.cwd(), 'archestra_manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        const agentNodes = nodes.filter(n => n.data?.category === 'provider');
        
        for (const node of agentNodes) {
            const connectedMCP = edges
                .filter(e => e.target === node.id)
                .map(e => nodes.find(n => n.id === e.source))
                .filter(n => n?.data?.category === 'mcp');

            const agentConfig = {
                name: node.data.customName || node.data.label,
                description: node.data.sublabel || '',
                tools: connectedMCP.map(mcp => mcp.data.toolId),
                systemPrompt: node.data.config?.systemPrompt || 'You are a helpful AI assistant.',
                ...(node.data.config || {})
            };

            await archestraFetch('/api/agents', {
                method: 'POST',
                body: JSON.stringify(agentConfig)
            }).catch(err => console.error('Agent creation failed:', err));
        }

        res.json({ success: true, message: 'Topology deployed to Archestra' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Load saved topology
app.get('/api/orchestra/load', (req, res) => {
    const manifestPath = path.join(process.cwd(), 'archestra_manifest.json');
    try {
        if (fs.existsSync(manifestPath)) {
            const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            res.json({ success: true, ...data.topology });
        } else {
            res.json({ success: false, message: 'No manifest found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start MCP server via Archestra
app.post('/api/mcp/run', async (req, res) => {
    const { serverId } = req.body;
    try {
        await archestraFetch(`/api/mcp/servers/${serverId}/start`, { method: 'POST' });
        res.json({ success: true, message: `MCP Server ${serverId} started` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat with Archestra agent
app.post('/api/agents/chat', async (req, res) => {
    const { agentId, message, conversationId } = req.body;
    try {
        let targetAgentId = agentId;
        if (agentId === 'copilot') {
            try {
                const agentsResp = await archestraFetch('/api/agents');
                const copilotAgent = agentsResp.agents?.find(a => a.name === 'Copilot');
                if (copilotAgent) {
                    targetAgentId = copilotAgent.id;
                } else {
                    const newAgent = await archestraFetch('/api/agents', {
                        method: 'POST',
                        body: JSON.stringify({
                            name: 'Copilot',
                            description: 'Code generation assistant',
                            systemPrompt: 'You are a Python MCP code generation assistant. Generate clean, working Python code with MCP decorators. Always wrap code in ```python blocks.'
                        })
                    });
                    targetAgentId = newAgent.id;
                }
            } catch (e) {
                console.error('Failed to setup copilot agent:', e);
            }
        }
        
        const response = await archestraFetch(`/api/agents/${targetAgentId}/chat`, {
            method: 'POST',
            body: JSON.stringify({ message, conversationId })
        });
        res.json({ success: true, ...response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Archestra gateway status
app.get('/api/gateway/status', async (req, res) => {
    try {
        const status = await archestraFetch('/api/gateway/status');
        res.json({ success: true, ...status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// File system endpoints
app.get('/api/fs/list', (req, res) => {
    const listFiles = (dir) => {
        const results = [];
        const items = fs.readdirSync(dir);
        for (const item of items) {
            if (item === 'node_modules' || item.startsWith('.')) continue;
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            const isDirectory = stats.isDirectory();
            results.push({
                name: item,
                path: '/' + fullPath.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, ''),
                kind: isDirectory ? 'directory' : 'file',
                children: isDirectory ? listFiles(fullPath) : undefined
            });
        }
        return results;
    };

    try {
        const files = listFiles(process.cwd());
        res.json({ success: true, files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/fs/read', (req, res) => {
    const { path: filePath } = req.query;
    try {
        const fullPath = path.join(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/fs/write', (req, res) => {
    const { path: filePath, content } = req.body;
    try {
        const fullPath = path.join(process.cwd(), filePath);
        fs.writeFileSync(fullPath, content, 'utf8');
        res.json({ success: true, message: 'File written successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, async () => {
    console.log(`TimeToRise server running on port ${PORT}`);
    console.log(`Archestra integration: ${ARCHESTRA_URL}`);
    
    // Test connection
    setTimeout(async () => {
        try {
            const response = await fetch(`${ARCHESTRA_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Archestra connected:', data.name || 'Connected');
            } else {
                console.log('⚠️  Archestra responded with:', response.status);
            }
        } catch (err) {
            console.log('❌ Archestra not responding. Start with: docker run -p 3000:3000 archestra/platform');
        }
    }, 1000);
});