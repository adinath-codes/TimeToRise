# Archestra AI Integration - Complete

## Overview
Your TimeToRise application is now **FULLY** integrated with Archestra AI running on http://localhost:3000

## What's Integrated

### 1. Orchestra Designer (Main UI)
- ✅ Dynamic node discovery from Archestra
- ✅ MCP servers from Archestra registry
- ✅ AI agents from Archestra
- ✅ Auto-refresh every 10 seconds
- ✅ Connection status indicator
- ✅ Auto-save to Archestra
- ✅ Topology deployment

### 2. Dev IDE - Code Generation
- ✅ **Copilot powered by Archestra AI**
- ✅ Real-time code generation
- ✅ Python MCP code generation
- ✅ Fallback to local generation
- ✅ Auto-creates Copilot agent in Archestra

### 3. Dev IDE - File Explorer
- ✅ Auto-discovers generated node files
- ✅ Syncs with studio folder
- ✅ Auto-refresh every 3 seconds

## Backend Integration (server.js)

### Archestra Endpoints Connected:
1. **GET /api/mcp/servers** - Fetches MCP servers from Archestra registry
2. **GET /api/agents** - Fetches AI agents from Archestra
3. **POST /api/agents** - Creates/updates agents in Archestra
4. **POST /api/mcp/servers/:id/start** - Starts MCP servers via Archestra
5. **POST /api/agents/:id/chat** - Chat with Archestra agents
6. **GET /api/gateway/status** - Get Archestra gateway status

### Your Backend Endpoints:
- **GET /api/orchestra/nodes** - Returns dynamic nodes from Archestra (MCP + Agents)
- **POST /api/orchestra/save** - Saves topology locally AND deploys to Archestra
- **GET /api/orchestra/load** - Loads saved topology
- **GET /api/mcp/discover** - Discovers MCP servers from Archestra
- **POST /api/mcp/run** - Runs MCP server via Archestra
- **POST /api/agents/chat** - Proxy to Archestra agent chat
- **GET /api/gateway/status** - Proxy to Archestra gateway status

## Frontend Integration (App.jsx)

### Dynamic Features:
1. **Node Discovery** - Fetches nodes from Archestra every 10 seconds
2. **Auto-save** - Saves topology to Archestra every 3 seconds after changes
3. **Load Topology** - Loads saved topology on startup
4. **Connection Status** - Shows Archestra connection status in header
5. **Modal Registry** - Displays Archestra nodes in the "+" modal

### What's Dynamic Now:
- ✅ MCP Servers (from Archestra registry)
- ✅ AI Agents (from Archestra agents)
- ✅ Archestra Gateway node
- ✅ Connection status indicator
- ✅ Node count display
- ✅ Auto-refresh every 10s

### What's Still Static (Fallback):
- AVAILABLE_TOOLS - Used only if Archestra is offline
- TOOL_CONFIGS - Configuration forms for nodes
- COLUMNS - UI styling configuration
- ICON_MAP - Icon mappings

## How It Works

### 1. On Startup:
```
Frontend → GET /api/orchestra/nodes → Backend → Archestra
                                                    ↓
Frontend ← Dynamic Nodes ← Backend ← MCP Servers + Agents
```

### 2. Adding a Node:
```
User clicks "+" → Modal shows Archestra nodes → User selects → Node added to canvas
```

### 3. Saving Topology:
```
User makes changes → Auto-save (3s delay) → Backend saves locally + deploys to Archestra
                                                    ↓
                                            Creates agents with connected MCP tools
```

### 4. Archestra Deployment:
When you save, the backend:
- Saves manifest.json locally
- Finds all "provider" nodes (agents)
- Finds connected MCP servers
- Creates/updates agents in Archestra with those tools

## How Code Generation Works

### In the Dev IDE Copilot:
1. User types: "Create a tool to fetch weather data"
2. Frontend sends request to `/api/agents/chat` with agentId='copilot'
3. Backend checks if Copilot agent exists in Archestra
4. If not, creates it with system prompt for code generation
5. Sends message to Archestra agent
6. Archestra AI generates Python MCP code
7. Response sent back to frontend
8. User can insert code into editor

### Fallback:
If Archestra is offline, uses local pattern-based generation.

## Testing the Full Integration

### 1. Start Archestra:
```bash
docker run -p 3000:3000 archestra/platform
```

### 2. Start Your Backend:
```bash
node server.js
```

### 3. Start Your Frontend:
```bash
npm run dev
```

### 4. Check Connection:
- Look at the header - should show "Archestra Connected"
- Click "+" button - should show nodes from Archestra
- Add nodes and save - should deploy to Archestra

## Archestra API Endpoints Used

### MCP Servers:
- `GET /api/mcp/servers` - List all MCP servers
- `POST /api/mcp/servers/:id/start` - Start a server

### Agents:
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create/update agent
- `POST /api/agents/:id/chat` - Chat with agent

### Gateway:
- `GET /api/gateway/status` - Get gateway status

## What Happens When You Save

1. **Local Save**: Topology saved to `archestra_manifest.json`
2. **Archestra Deployment**:
   - Finds all provider nodes (agents)
   - Finds connected MCP nodes
   - Creates agent in Archestra with config:
     ```json
     {
       "name": "Agent Name",
       "description": "Agent Description",
       "tools": ["mcp-server-1", "mcp-server-2"],
       "systemPrompt": "You are a helpful AI assistant."
     }
     ```

## Connection Status Indicator

Top right corner shows:
- 🟢 "Archestra Connected" + node count (when connected)
- 🔴 "Archestra Offline" (when disconnected)

## Auto-Refresh

- Nodes refresh every 10 seconds
- Auto-save triggers 3 seconds after changes
- Topology loads on startup

## Next Steps

1. Make sure Archestra is running on port 3000
2. Install MCP servers in Archestra UI
3. Create agents in Archestra UI
4. They'll appear automatically in your app!

## Troubleshooting

### "Archestra Offline" showing:
- Check if Archestra is running: `curl http://localhost:3000/api/mcp/servers`
- Check backend logs for connection errors

### Nodes not appearing:
- Check Archestra has MCP servers installed
- Check browser console for fetch errors
- Verify backend is proxying correctly

### Save not working:
- Check backend logs for Archestra API errors
- Verify agent creation endpoint is working
- Check manifest.json is being created
