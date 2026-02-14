# Archestra API - No API Key Needed!

## Good News!
Archestra running locally doesn't need an API key. It uses session-based authentication.

## How It Works:

### Option 1: Direct Browser Access (Recommended)
Since Archestra is on localhost, your backend can access it directly without authentication!

The "Unauthenticated" error is only for external API calls. Local calls should work.

### Option 2: Use Archestra UI Directly
1. Open http://localhost:3000
2. Login with: admin@example.com / password
3. Use the UI to:
   - Install MCP servers
   - Create agents
   - Configure tools

Your app will fetch these via the backend automatically!

## Testing:

```bash
# Start backend
node server.js

# Start frontend  
npm run dev

# Open app
http://localhost:5173
```

The app will:
1. Try to fetch from Archestra
2. If it fails, show "Archestra Offline"
3. You can still use the app with local fallbacks

## Next Steps:

1. **Install MCP Servers in Archestra UI**
   - Go to http://localhost:3000
   - Navigate to MCP Registry
   - Install servers you want

2. **Create Agents in Archestra UI**
   - Go to Agents section
   - Create new agents
   - Assign MCP tools to them

3. **Your App Auto-Discovers Them!**
   - Wait 10 seconds for auto-refresh
   - Nodes appear in your app
   - No API key needed!

## Why No API Key?

Archestra running locally (via Docker) doesn't require API keys for localhost connections. The authentication is only for:
- External API access
- Production deployments
- Multi-user scenarios

For local development, it's open!
