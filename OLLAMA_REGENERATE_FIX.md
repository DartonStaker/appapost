# Ollama Integration & Regenerate Button Fix

## How Ollama is Staged/Configured

### 1. Environment Variables
Ollama is configured via environment variables in `.env.local`:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3-vl:2b
```

**Default Values** (if not set):
- `OLLAMA_URL` defaults to `http://localhost:11434`
- `OLLAMA_MODEL` defaults to `qwen3-vl:2b`

### 2. AI Service Priority Chain
The app tries AI services in this order:

1. **Ollama (Local, Free, Unlimited)** ✅ First choice
   - Connects to `http://localhost:11434/api/chat`
   - Uses the specified model (default: `qwen3-vl:2b`)
   - 30-second timeout
   - If unavailable, falls through to next service

2. **Grok (xAI)** - Fallback #1
   - Requires `GROK_API_KEY` environment variable
   - Uses `grok-beta` model

3. **OpenAI GPT-4o-mini** - Fallback #2
   - Requires `OPENAI_API_KEY` environment variable
   - Uses `gpt-4o-mini` model

### 3. Code Location
The Ollama integration is in `lib/ai.ts`:

```typescript
// Try Ollama first (local, free, unlimited)
try {
  const response = await axios.post(
    `${OLLAMA_URL}/api/chat`,
    {
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: 2000,
      },
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    }
  )
  // ... handle response
} catch (error) {
  // Fall through to cloud providers
}
```

### 4. Logging
The app now logs which AI service is being used:
- `[AI] Attempting Ollama at http://localhost:11434 with model qwen3-vl:2b`
- `[AI] ✅ Successfully generated content using Ollama (X chars)`
- `[AI] ⚠️ Ollama not available, falling back to cloud AI`

## Regenerate Button Fix

### Previous Issue
The "Regenerate" button wasn't working because:
1. Old variants weren't being deleted before generating new ones
2. The `upsert` with `UNIQUE(post_id, platform)` constraint was causing conflicts
3. Selected variants weren't being cleared, causing confusion

### Fix Applied

#### 1. Delete Old Variants First
```typescript
// Delete existing variants for this post (to allow regeneration)
const { error: deleteError } = await supabase
  .from("post_variants")
  .delete()
  .eq("post_id", post_id)
```

#### 2. Store Variants as Arrays
Since the schema has `UNIQUE(post_id, platform)`, we store all variants for a platform as a JSON array:

```typescript
// Store all variants for this platform as an array in variant_json
variantInserts.push({
  post_id: post_id,
  platform,
  variant_json: platformVariants, // Array of variants
  is_selected: false,
})
```

#### 3. Clear UI State on Regenerate
```typescript
const handleGenerate = async () => {
  setGenerating(true)
  // Clear selected variants when regenerating
  setSelectedVariants({})
  setEditedVariants({})
  // ... generate new variants
}
```

#### 4. Handle Both Array and Single Object Formats
The GET route now handles both old (single object) and new (array) formats:

```typescript
// Handle both array (new format) and single object (old format)
if (Array.isArray(v.variant_json)) {
  grouped[v.platform].push(...v.variant_json)
} else {
  grouped[v.platform].push(v.variant_json)
}
```

## Testing the Regenerate Button

1. **Create a post** with title, excerpt, and image URL
2. **Click "Generate & Post"** button
3. **Click "Generate Variants"** - This creates initial variants
4. **Select some variants** and edit them
5. **Click "Regenerate"** - This should:
   - Clear all selected variants
   - Delete old variants from database
   - Generate fresh variants using Ollama (or fallback)
   - Show new variants in the UI
   - Display a success message with AI service used

## Verifying Ollama is Working

### Check Console Logs
When you click "Generate" or "Regenerate", check your browser console and server logs:

**Success:**
```
[AI] Attempting Ollama at http://localhost:11434 with model qwen3-vl:2b
[AI] ✅ Successfully generated content using Ollama (1234 chars)
```

**Fallback:**
```
[AI] Attempting Ollama at http://localhost:11434 with model qwen3-vl:2b
[AI] ⚠️ Ollama not available (connect ECONNREFUSED), falling back to cloud AI
```

### Check Success Toast
The success message will show which AI service was used:
- `Generated 18 variants across 6 platforms using Ollama (local)`
- `Generated 18 variants across 6 platforms using Grok (xAI)`
- `Generated 18 variants across 6 platforms using OpenAI`

## Troubleshooting

### Regenerate Button Still Not Working?

1. **Check browser console** for errors
2. **Check server logs** for API errors
3. **Verify Ollama is running**: `ollama list` in terminal
4. **Check environment variables** in `.env.local`
5. **Verify database connection** - Check Supabase dashboard

### Ollama Not Connecting?

1. **Is Ollama running?**
   ```bash
   ollama list
   ```

2. **Is the model installed?**
   ```bash
   ollama pull qwen3-vl:2b
   ```

3. **Check the URL** in `.env.local`:
   ```env
   OLLAMA_URL=http://localhost:11434
   ```

4. **Test Ollama directly:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

## Summary

- ✅ Ollama is configured via `OLLAMA_URL` and `OLLAMA_MODEL` env vars
- ✅ Ollama is tried first, with automatic fallback to Grok/OpenAI
- ✅ Regenerate button now properly deletes old variants and generates fresh ones
- ✅ UI state is cleared on regenerate
- ✅ Success messages show which AI service was used
- ✅ Console logging helps debug AI service selection

