# Archestra AI Setup Guide

## Current Status:
✅ Backend running on port 3001
✅ Archestra detected on port 3000
⚠️ Archestra requires authentication

## Setup Steps:

### 1. Login to Archestra

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `password`

**Steps:**
1. Open http://localhost:3000 in browser
2. Login with credentials above
3. You're in!

### 2. Get Archestra API Key

**Using Archestra UI:**
1. After login, go to Settings → API Keys
2. Click "Create New API Key"
3. Give it a name (e.g., "TimeToRise")
4. Copy the generated key
5. Save it securely

### 3. Configure Your Backend

**Option A: Environment Variable (Recommended)**
```bash
# Windows CMD
set ARCHESTRA_API_KEY=your-key-here
node server.js

# Windows PowerShell
$env:ARCHESTRA_API_KEY="your-key-here"
node server.js

# Linux/Mac
export ARCHESTRA_API_KEY=your-key-here
node server.js
```

**Option B: .env File**
Create `.env` file in project root:
```
ARCHESTRA_API_KEY=your-key-here
```

Then install dotenv:
```bash
npm install dotenv
```

Add to top of server.js:
```javascript
import 'dotenv/config';
```

### 3. Verify Connection

```bash
# Test backend can reach Archestra
curl http://localhost:3001/api/orchestra/nodes
```

Should return nodes from Archestra (not empty array).

### 4. Start Frontend

```bash
npm run dev
```

Open http://localhost:5173 and check:
- Header shows "Archestra Connected" (green)
- Click "+" shows nodes from Archestra
- Node count > 0

## Alternative: Run Without Authentication

If Archestra supports unauthenticated mode:

```bash
docker run -p 3000:3000 \
  -e ARCHESTRA_AUTH_DISABLED=true \
  archestra/platform
```

## Troubleshooting

### "Unauthenticated" Error
- Get API key from Archestra UI
- Set ARCHESTRA_API_KEY environment variable
- Restart backend

### "Connection Refused"
- Check Archestra is running: `curl http://localhost:3000`
- Check port 3000 is not blocked by firewall

### "No Nodes Available"
- Log into Archestra UI: http://localhost:3000
- Install MCP servers from registry
- Create agents
- Wait 10 seconds for auto-refresh

### Still Showing Static Nodes?
- Clear browser cache
- Check browser console for errors
- Verify backend logs show Archestra connection

## Quick Test Without Archestra

To test the app without Archestra:
1. Backend will show "Archestra Offline"
2. UI will show helpful message
3. Copilot falls back to local generation
4. Everything still works, just without dynamic nodes

## Next Steps

Once connected:
1. Install MCP servers in Archestra
2. Create agents in Archestra
3. They appear automatically in your app!
4. Design topology in Orchestra Designer
5. Save to deploy to Archestra
