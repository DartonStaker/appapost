# How to Restart Ollama with CORS Enabled on Windows

## Step 1: Set the Environment Variable (if not already done)

Run this in PowerShell (as Administrator or regular user):
```powershell
[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')
```

## Step 2: Close Ollama Completely

**Option A: Using Task Manager**
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Look for "Ollama" in the process list
3. Right-click → "End Task" or "End Process Tree"

**Option B: Using PowerShell**
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*ollama*"} | Stop-Process -Force
```

## Step 3: Verify Ollama is Closed

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*ollama*"}
```
Should return nothing if Ollama is closed.

## Step 4: Restart Ollama

**Option A: Start Menu**
- Open Start Menu
- Search for "Ollama"
- Click to launch

**Option B: Command Line**
```powershell
Start-Process "ollama"
```

## Step 5: Verify CORS is Enabled

Wait a few seconds for Ollama to start, then check:
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method HEAD
$response.Headers['Access-Control-Allow-Origin']
```

You should see `*` or the header should exist.

## Alternative: Set Environment Variable for Current Session

If the above doesn't work, you can set it for the current PowerShell session and start Ollama from there:

```powershell
$env:OLLAMA_ORIGINS = "*"
Start-Process "ollama"
```

## Troubleshooting

**If CORS still doesn't work:**

1. **Check if Ollama is running as a service:**
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*ollama*"}
   ```

2. **If it's a service, restart the service:**
   ```powershell
   Restart-Service ollama
   ```
   (You may need to set the environment variable at the system level)

3. **Check Ollama logs:**
   - Look in `%USERPROFILE%\.ollama\logs\` for any errors

4. **Manual start with environment variable:**
   ```powershell
   $env:OLLAMA_ORIGINS = "*"
   & "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"
   ```

