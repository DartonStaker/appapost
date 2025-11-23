# Fix: Ollama Status Shows "AI Offline" on Vercel

## Problem
When accessing your app on `appapost.vercel.app`, the status indicator shows "AI Offline" even though Ollama is running on `localhost:11434`.

## Root Cause
Browsers block cross-origin requests for security. When your app runs on Vercel (different origin), it can't directly check `localhost:11434` unless Ollama has CORS (Cross-Origin Resource Sharing) enabled.

## Solution: Enable CORS on Ollama

### Option 1: Set OLLAMA_ORIGINS Environment Variable (Recommended)

**Windows:**
1. Open PowerShell as Administrator
2. Set the environment variable:
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ```
3. Restart Ollama

**Or set it permanently:**
```powershell
[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
```

**macOS/Linux:**
```bash
export OLLAMA_ORIGINS="*"
```

Or add to `~/.bashrc` or `~/.zshrc`:
```bash
echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc
source ~/.bashrc
```

**Restart Ollama:**
- **Windows**: Restart the Ollama service or app
- **macOS**: Restart the Ollama app
- **Linux**: `sudo systemctl restart ollama`

### Option 2: Allow Specific Origins (More Secure)

Instead of `*`, you can allow only your Vercel domain:
```bash
export OLLAMA_ORIGINS="https://appapost.vercel.app,http://localhost:3000"
```

### Option 3: Use Localhost for Development

If you're only developing locally:
- Access your app at `http://localhost:3000` instead of `appapost.vercel.app`
- Same-origin requests don't require CORS

## Verify CORS is Enabled

1. Restart Ollama
2. Check if CORS headers are present:
   ```bash
   curl -I http://localhost:11434/api/tags
   ```
   You should see `Access-Control-Allow-Origin` header in the response

3. Refresh your Vercel app - the status should now show "Local AI Active"

## Alternative: Use a Public Ollama Instance

If you want Ollama to work from anywhere:
1. Set up Ollama on a server with a public IP
2. Update `OLLAMA_URL` in your `.env.local` to point to that server
3. Make sure the server allows connections from your Vercel app

## Notes

- Enabling CORS with `*` allows any website to access your Ollama instance
- For production, use specific origins or a public Ollama instance
- The status check will work on `localhost:3000` without CORS (same origin)

