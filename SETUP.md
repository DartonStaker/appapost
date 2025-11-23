# AppaPost Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Create `.env.local` file
   - Add `DATABASE_URL` from Supabase (see `SUPABASE_SETUP.md`)
   - Add `NEXTAUTH_SECRET` and other keys (see README.md for details)

3. **Set Up Database (Supabase)**
   - Follow instructions in `SUPABASE_SETUP.md`
   - Run: `npm run db:push`

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Important Notes

### NextAuth Configuration

The current setup uses JWT strategy with manual user creation. For production, you may want to:

1. Use a proper adapter like `@auth/drizzle-adapter` (if available)
2. Or implement a full custom adapter following NextAuth's adapter interface
3. Or use a different auth solution like Clerk or Supabase Auth

### Database Schema

The schema includes all necessary tables:
- `users` - User accounts
- `accounts` - OAuth account connections
- `sessions` - User sessions
- `social_accounts` - Connected social media accounts
- `posts` - Content posts
- `post_variations` - AI-generated variations per platform
- `scheduled_posts` - Scheduled/posted content
- `templates` - Custom AI prompt templates
- `brand_settings` - Brand configuration

### Social Media API Setup

Each platform requires different setup:

1. **Instagram/Facebook**: Requires Meta Business Account and App Review
2. **Twitter**: Requires Developer Account and API v2 access
3. **LinkedIn**: Requires Marketing API access
4. **TikTok**: Requires Business Account and API access
5. **Pinterest**: Requires Business Account and API access

See README.md for detailed setup instructions for each platform.

### Webhook Configuration

The webhook endpoint is: `/api/webhook/apparely`

Expected payload:
```json
{
  "title": "Product Name",
  "excerpt": "Description",
  "content": "Full content",
  "imageUrl": "https://...",
  "productUrl": "https://...",
  "tags": ["tag1", "tag2"],
  "type": "product" // or "blog"
}
```

Headers:
- `Content-Type: application/json`
- `x-webhook-secret: YOUR_SECRET` (optional, for security)

### Queue System (Optional)

The queue system is set up but optional. To enable:

1. Set up Upstash Redis (recommended) or Vercel KV
2. Add `REDIS_URL` or `UPSTASH_REDIS_REST_URL` to `.env.local`
3. The queue will automatically be used for async posting

### Troubleshooting

**Database Connection Issues**
- Verify `DATABASE_URL` is correct (Supabase connection string)
- Check Supabase project is active
- Verify database password is correct in connection string
- Run `npm run db:push` to sync schema
- Try using connection pooling URL for better performance

**Authentication Not Working**
- Verify `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)
- Check `NEXTAUTH_URL` matches your domain
- Verify OAuth redirect URIs are correct

**AI Generation Failing**
- Check API keys are valid
- Verify you have credits/quota
- Check rate limits

**Social Media Posting Failing**
- Verify access tokens are valid and not expired
- Check API permissions/scopes
- Review platform-specific requirements

## Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations run
- [ ] OAuth redirect URIs updated
- [ ] Webhook URLs updated in Apparely store
- [ ] Social media accounts connected
- [ ] Brand settings configured
- [ ] Test webhook with sample payload
- [ ] Test posting to at least one platform

