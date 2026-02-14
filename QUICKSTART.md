# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Login to Archestra
```
URL: http://localhost:3000
Email: admin@example.com
Password: password
```

### Step 2: Get API Key
1. Go to Settings → API Keys
2. Create new key named "TimeToRise"
3. Copy the key

### Step 3: Set Environment Variable
```bash
# Windows CMD
set ARCHESTRA_API_KEY=your-copied-key
node server.js

# Windows PowerShell
$env:ARCHESTRA_API_KEY="your-copied-key"
node server.js
```

### Step 4: Start Frontend
```bash
npm run dev
```

### Step 5: Test It!
1. Open http://localhost:5173
2. Check header shows "Archestra Connected" ✅
3. Click "+" button
4. See nodes from Archestra!

## 🎯 What to Do Next

### Install MCP Servers in Archestra:
1. Go to http://localhost:3000
2. Navigate to MCP Registry
3. Install servers (e.g., playwright-mcp, filesystem-mcp)
4. Wait 10 seconds
5. They appear in your app automatically!

### Create Agents in Archestra:
1. Go to Agents section
2. Create new agent
3. Give it tools (MCP servers)
4. Add system prompt
5. It appears in your app as a provider node!

### Design Your Architecture:
1. In your app, click "+" to add nodes
2. Connect MCP servers → Agents → Clients
3. Double-click nodes to configure
4. Save (auto-saves every 3 seconds)
5. Topology deploys to Archestra!

### Test Code Generation:
1. Go to Dev-IDE tab
2. Click Terminal → Copilot tab
3. Type: "Create a tool to fetch weather data"
4. Watch Archestra AI generate code!
5. Click Insert to add to editor

## 🔧 Troubleshooting

**"Archestra Offline" showing?**
- Check Archestra is running on port 3000
- Verify API key is set correctly
- Restart backend after setting API key

**No nodes appearing?**
- Install MCP servers in Archestra UI first
- Create agents in Archestra UI
- Wait 10 seconds for auto-refresh

**Code generation not working?**
- Check Copilot agent exists in Archestra
- Backend auto-creates it on first use
- Check browser console for errors

## 📚 Documentation

- `ARCHESTRA_SETUP.md` - Detailed setup instructions
- `ARCHESTRA_INTEGRATION.md` - How integration works
- `TESTING.md` - Testing guide
- `studio/README.md` - About generated files

## ✨ You're All Set!

Everything is now connected to Archestra AI.
All nodes, agents, and code generation are dynamic!
