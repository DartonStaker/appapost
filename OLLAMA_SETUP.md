# Ollama Setup Guide

## Quick Setup

### 1. Install Ollama

Download and install Ollama from: https://ollama.com/download

- **Windows**: Download the installer and run it
- **macOS**: Download the app or use Homebrew: `brew install ollama`
- **Linux**: Run `curl -fsSL https://ollama.com/install.sh | sh`

### 2. Pull the Model

Open your terminal and run:

```bash
ollama pull qwen3-vl:2b
```

This will download the `qwen3-vl:2b` model (approximately 2GB). The first time you run this, it may take a few minutes depending on your internet connection.

**Alternative models you can try:**
- `llama3.2` - Fast and efficient (smaller)
- `llama3.2:3b` - Slightly larger, better quality
- `mistral` - Good balance of speed and quality
- `qwen2.5:7b` - Higher quality (larger file)

### 3. Add to `.env.local`

Add these lines to your `.env.local` file:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3-vl:2b
```

**Note**: If you're running Ollama on a different machine or port, update `OLLAMA_URL` accordingly.

### 4. Start Ollama (if not running automatically)

Ollama should start automatically after installation. If it doesn't:

- **Windows**: Look for "Ollama" in your Start menu and launch it
- **macOS**: Open the Ollama app from Applications
- **Linux**: Run `ollama serve` in a terminal

### 5. Restart Your Dev Server

```bash
npm run dev
```

## How It Works

The app will now:
1. **First try Ollama** (local, free, unlimited) - If available, it uses your local model
2. **Fallback to Grok** (xAI) - If Ollama isn't available and `GROK_API_KEY` is set
3. **Fallback to OpenAI** - If neither Ollama nor Grok are available, but `OPENAI_API_KEY` is set

## Testing

To verify Ollama is working:

1. Make sure Ollama is running (check system tray or run `ollama list` in terminal)
2. Create a new post in the dashboard
3. Click "Generate" - You should see content generated using your local model
4. Check the browser console - You should see "Ollama not available" warnings only if Ollama isn't running

## Troubleshooting

### "Ollama not available" error

- **Check if Ollama is running**: Open terminal and run `ollama list`. If it errors, Ollama isn't running.
- **Check the URL**: Make sure `OLLAMA_URL` in `.env.local` matches where Ollama is running (default: `http://localhost:11434`)
- **Check the model**: Run `ollama list` to see if `qwen3-vl:2b` is installed. If not, run `ollama pull qwen3-vl:2b`

### Slow generation

- The `qwen3-vl:2b` model is optimized for speed. If you want better quality, try a larger model like `qwen2.5:7b` (but it will be slower)
- Make sure you have enough RAM (2GB+ recommended for qwen3-vl:2b)

### Model not found

- Run `ollama pull qwen3-vl:2b` to download the model
- Check the model name in `.env.local` matches exactly (case-sensitive)

## Production Deployment

**Important**: Ollama runs locally on your machine. For Vercel deployment, you'll need to:

1. Use a cloud AI service (Together AI, Groq, or Hugging Face) - See `ENV_TEMPLATE.md`
2. Or host Ollama on a server and update `OLLAMA_URL` to point to that server
3. Or use Modal.com to host Ollama ($30/month free credits)

For local development, Ollama is perfect and completely free! 🎉

