const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Keep track of running processes
const processes = new Map();

// Endpoint to list directory contents
app.get('/api/files', (req, res) => {
    const targetPath = req.query.path || process.cwd();

    try {
        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ error: 'Path does not exist' });
        }

        const stats = fs.statSync(targetPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory' });
        }

        const files = fs.readdirSync(targetPath);
        const result = files.map(file => {
            const filePath = path.join(targetPath, file);
            const fileStats = fs.statSync(filePath);
            return {
                name: file,
                path: filePath,
                isDirectory: fileStats.isDirectory(),
                size: fileStats.size,
                mtime: fileStats.mtime
            };
        });

        res.json({
            currentPath: targetPath,
            files: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get file content
app.get('/api/file', (req, res) => {
    const filePath = req.query.path;
    if (!filePath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File does not exist' });
        }

        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is a directory, not a file' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ content, path: filePath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to save file content
app.post('/api/file', (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    try {
        fs.writeFileSync(filePath, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Terminal/Process Management
app.post('/api/run', (req, res) => {
    const { command, args, cwd } = req.body;
    const processId = Date.now().toString();

    const child = spawn(command, args, {
        cwd: cwd || process.cwd(),
        shell: true,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    const output = [];
    processes.set(processId, { child, output, status: 'running' });

    child.stdout.on('data', (data) => {
        output.push({ type: 'stdout', data: data.toString(), time: Date.now() });
    });

    child.stderr.on('data', (data) => {
        output.push({ type: 'stderr', data: data.toString(), time: Date.now() });
    });

    child.on('close', (code) => {
        const proc = processes.get(processId);
        if (proc) {
            proc.status = 'closed';
            proc.exitCode = code;
        }
    });

    res.json({ processId });
});

app.get('/api/output/:processId', (req, res) => {
    const { processId } = req.params;
    const proc = processes.get(processId);

    if (!proc) {
        return res.status(404).json({ error: 'Process not found' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send existing output
    proc.output.forEach(item => {
        res.write(`data: ${JSON.stringify(item)}\n\n`);
    });

    // Function to handle new data
    const onData = (type, data) => {
        res.write(`data: ${JSON.stringify({ type, data, time: Date.now() })}\n\n`);
    };

    const stdoutListener = (data) => onData('stdout', data.toString());
    const stderrListener = (data) => onData('stderr', data.toString());
    const closeListener = (code) => {
        res.write(`data: ${JSON.stringify({ type: 'status', data: 'closed', exitCode: code })}\n\n`);
        res.end();
    };

    proc.child.stdout.on('data', stdoutListener);
    proc.child.stderr.on('data', stderrListener);
    proc.child.on('close', closeListener);

    res.on('close', () => {
        proc.child.stdout.removeListener('data', stdoutListener);
        proc.child.stderr.removeListener('data', stderrListener);
        proc.child.removeListener('close', closeListener);
    });
});

app.post('/api/stop/:processId', (req, res) => {
    const { processId } = req.params;
    const proc = processes.get(processId);

    if (proc && proc.child) {
        proc.child.kill();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Process not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
