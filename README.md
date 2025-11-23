# AppaPost

**Your Apparely posts, on autopilot.**

AppaPost is a production-ready social media automation manager built exclusively for Apparely (www.apparely.co.za), a proudly South African custom apparel brand. When new products or blog posts are published on apparely.co.za, AppaPost automatically generates brand-perfect social media content and posts it across all major platforms.

## 🚀 Features

- **AI-Powered Content Generation**: Uses local Ollama (free, unlimited) with qwen3-vl:2b model, with fallback to Grok/OpenAI for cloud deployment
- **Multi-Platform Posting**: Automatically posts to Instagram, Facebook, X/Twitter, LinkedIn, TikTok, and Pinterest
- **Smart Scheduling**: Beautiful drag-and-drop calendar interface for scheduling posts
- **Approval Workflow**: Preview, edit, and approve posts before they go live
- **Brand Voice Customization**: Configure brand guidelines and default hashtags
- **Webhook Integration**: Receives content from Apparely store automatically
- **Engagement Tracking**: Monitor likes, comments, and shares across platforms
- **Dark Mode**: Beautiful dark/light theme support

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Vercel Postgres (Drizzle ORM)
- **Authentication**: NextAuth.js (Google + Email)
- **AI**: Ollama (local, free) → xAI Grok API → OpenAI GPT-4o-mini fallback
- **Queue**: BullMQ with Upstash Redis (optional)
- **Social APIs**: Meta Graph API, Twitter API v2, LinkedIn API, TikTok API, Pinterest API
- **Deployment**: Vercel (optimized)

## 📦 One-Command Setup

```bash
npm install
```

## 🔑 Getting API Keys

### 1. Database (Supabase)

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (URI format)
5. Add to `.env` as `DATABASE_URL`

See `SUPABASE_SETUP.md` for detailed instructions!

### 2. NextAuth

Generate a secret:
```bash
openssl rand -base64 32
```

Add to `.env` as `NEXTAUTH_SECRET`

### 3. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

### 4. Ollama (Local AI - Recommended for Development)

**Free, unlimited, runs locally on your machine!**

1. Install Ollama from https://ollama.com/download
2. Pull the model: `ollama pull qwen3-vl:2b`
3. Add to `.env.local`:
   ```env
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=qwen3-vl:2b
   ```

See `OLLAMA_SETUP.md` for detailed instructions!

**Note**: For production/Vercel deployment, use cloud AI services (Together AI, Groq, or Hugging Face) - see `ENV_TEMPLATE.md`

### 5. xAI Grok API (Cloud Fallback)

1. Go to [xAI Console](https://console.x.ai/)
2. Create an API key
3. Add to `.env` as `GROK_API_KEY`

### 6. OpenAI (Cloud Fallback)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add to `.env` as `OPENAI_API_KEY`

### 7. Social Media APIs

#### Instagram & Facebook (Meta Graph API)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display and Facebook Login products
4. Get App ID and App Secret
5. Generate access tokens for your accounts

#### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Get API Key, API Secret, Access Token, and Access Token Secret
4. Add to `.env`

#### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Request access to Marketing API
4. Generate access tokens

#### TikTok

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Get Client Key and Client Secret
4. Generate access tokens

#### Pinterest

1. Go to [Pinterest Developers](https://developers.pinterest.com/)
2. Create a new app
3. Get App ID and App Secret
4. Generate access tokens

### 8. Redis (Optional, for Queue)

#### Option A: Upstash Redis (Recommended)

1. Go to [Upstash](https://upstash.com/)
2. Create a Redis database
3. Copy REST URL and Token to `.env`

#### Option B: Vercel KV

1. In Vercel Dashboard, go to Storage
2. Create KV database
3. Environment variables are automatically added

## 🔗 Setting Up Webhooks

### For WordPress (WooCommerce)

1. Install a webhook plugin or use WordPress REST API
2. Add webhook URL: `https://your-domain.vercel.app/api/webhook/apparely`
3. Set webhook secret in `.env` as `WEBHOOK_SECRET`
4. Configure to send POST requests with this payload:

```json
{
  "title": "Product Name",
  "excerpt": "Product description",
  "content": "Full product content",
  "imageUrl": "https://apparely.co.za/image.jpg",
  "productUrl": "https://apparely.co.za/product/slug",
  "tags": ["tag1", "tag2"],
  "type": "product"
}
```

### For Shopify

1. Go to Settings → Notifications
2. Create a new webhook
3. Event: Product creation/update
4. Format: JSON
5. URL: `https://your-domain.vercel.app/api/webhook/apparely`
6. Include webhook secret in headers: `x-webhook-secret`

### For Custom Integration

Send POST request to `/api/webhook/apparely` with:

- Headers: `Content-Type: application/json`, `x-webhook-secret: YOUR_SECRET`
- Body: JSON payload as shown above

## 🗄️ Database Setup (Supabase)

1. **Set up Supabase** (see `SUPABASE_SETUP.md` for details):
   - Create project at https://supabase.com/
   - Get connection string from Settings → Database
   - Add to `.env.local` as `DATABASE_URL`

2. **Run migrations**:
```bash
npm run db:push
```

Or generate migrations:
```bash
npm run db:generate
npm run db:migrate
```

3. **Open Drizzle Studio** (optional):
```bash
npm run db:studio
```

## 🚀 Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/appapost)

### Option 2: Manual Deploy

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository
5. Add all environment variables from `.env.example`
6. Deploy!

### Post-Deployment

1. Update `NEXTAUTH_URL` to your production URL
2. Update OAuth redirect URIs in Google Cloud Console
3. Update webhook URLs in your Apparely store
4. Run database migrations if needed

## 📱 Usage

1. **Sign In**: Use Google OAuth or Email
2. **Connect Accounts**: Go to Settings → Connect your social media accounts
3. **Configure Brand**: Set your brand voice and default hashtags
4. **Set Up Webhook**: Add webhook URL to your Apparely store
5. **Automate**: New products/blog posts will automatically generate content and queue for posting
6. **Review & Post**: Go to Posts → Review generated content → Post to All or select platforms

## 🎨 Customization

### Brand Voice

Edit `lib/ai/generate.ts` to customize the brand prompt:

```typescript
const BRAND_PROMPT = `Your custom brand voice here...`
```

### Default Hashtags

Update in Settings or modify `lib/ai/generate.ts`:

```typescript
const defaultHashtags = ["#YourHashtag", "#AnotherHashtag"]
```

### Color Palette

Edit `tailwind.config.ts` to customize colors:

```typescript
primary: {
  DEFAULT: "hsl(16, 100%, 66%)", // Coral
  // ...
}
```

## 🐛 Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct (Supabase connection string)
- Check Supabase project is active
- Ensure database password is correct in connection string
- Try using connection pooling URL for better performance

### Authentication Not Working

- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Verify OAuth redirect URIs are correct

### AI Generation Failing

- Check `XAI_API_KEY` or `OPENAI_API_KEY` is set
- Verify API keys are valid and have credits
- Check API rate limits

### Social Media Posting Failing

- Verify access tokens are valid and not expired
- Check API permissions/scopes
- Review platform-specific requirements (e.g., Instagram requires business account)

## 📄 License

Built exclusively for Apparely (www.apparely.co.za)

## 🤝 Support

For issues or questions, contact the Apparely team.

---

**Made with ❤️ for Apparely - Proudly South African**



<!-- Last deployment trigger: 2025-11-23 22:51:38 -->
