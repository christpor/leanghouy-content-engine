# Leanghouy AI Content Engine

An elegant, AI-powered social media content management system designed for hair salons. Generate bilingual (Khmer + English) captions, manage approvals via Telegram, and track content performance — all from one unified dashboard.

---

## Overview

The Leanghouy Content Engine simplifies social media content creation for salon owners. Upload a photo, let AI generate professional captions in both Khmer and English, approve via Telegram, and manage your content library with ease.

**Built for:** Hair salon owners and social media managers  
**Key benefit:** Save 2-3 hours per week on caption writing  
**Languages:** Khmer, English

---

## Core Features

### 1. Photo Upload & Preview
- Drag-and-drop interface for easy photo uploads
- Instant preview before submission
- Support for JPG, PNG, WebP formats
- Automatic image optimization

### 2. AI Caption Generation
- Vision-based LLM analyzes your photos
- Generates bilingual captions (Khmer + English)
- Includes relevant hashtags for each language
- Three tone options: Professional, Casual, Trendy

### 3. Bilingual Content Display
- Side-by-side Khmer and English captions
- One-click copy-to-clipboard for each language
- Regenerate with different tones or custom prompts
- Real-time preview

### 4. Content Approval Workflow
- Mark content as Draft, Approved, Posted, or Archived
- Telegram integration for mobile approvals
- One-tap approve/reject from Telegram
- Status syncs instantly to dashboard

### 5. Content History Dashboard
- View all generated content in chronological order
- Filter by approval status
- Quick-copy buttons for fast sharing
- Thumbnail previews
- Delete old content

### 6. Telegram Integration
- Send captions directly to Telegram
- Inline approval buttons (Approve, Reject, Regenerate)
- Real-time sync between Telegram and dashboard
- Daily reminders for approved but unposted content

### 7. Daily Reminder Job
- Automatic daily check for approved content
- Telegram notification reminder
- In-app notification badge
- Customizable reminder time

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Express 4, tRPC 11, Node.js |
| **Database** | MySQL with Drizzle ORM |
| **Authentication** | Manus OAuth |
| **AI/LLM** | Built-in vision-based LLM |
| **File Storage** | S3-compatible storage |
| **Messaging** | Telegram Bot API |
| **Testing** | Vitest |
| **Deployment** | Manus (managed hosting) + Netlify (frontend) |

---

## Quick Start

### Prerequisites
- Node.js 22+ and pnpm
- MySQL database (or use Manus-provided database)
- Telegram bot token (for approval workflow)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/christpor/leanghouy-content-engine.git
cd leanghouy-content-engine
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Run database migrations:**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

5. **Start development server:**
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

---

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Manus APIs
BUILT_IN_FORGE_API_URL=https://forge.manus.ai
BUILT_IN_FORGE_API_KEY=your_api_key

# Authentication
JWT_SECRET=your_jwt_secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im

# OAuth App
VITE_APP_ID=your_app_id
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.ai

# Owner Info
OWNER_NAME=your_name
OWNER_OPEN_ID=your_open_id

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Analytics
VITE_ANALYTICS_ENDPOINT=https://manus-analytics.com
VITE_ANALYTICS_WEBSITE_ID=your_analytics_id

# App Config
VITE_APP_TITLE=Leanghouy AI Content Engine
VITE_APP_LOGO=https://your-logo-url.png
```

See `.env.example` for a complete template.

---

## Project Structure

```
leanghouy-content-engine/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities and helpers
│   └── public/               # Static assets
├── server/                    # Express backend
│   ├── routers/              # tRPC procedure definitions
│   ├── services/             # Business logic (Telegram, etc.)
│   ├── webhooks/             # Webhook handlers
│   ├── scheduled/            # Cron job handlers
│   └── _core/                # Framework plumbing
├── drizzle/                  # Database schema & migrations
├── shared/                   # Shared types and constants
└── package.json              # Dependencies
```

---

## Development Workflow

### Running Tests
```bash
pnpm test
```

All 26 tests should pass:
- 7 content management tests
- 7 upload tests
- 7 Telegram integration tests
- 5 authentication tests

### Building for Production
```bash
pnpm build
```

### Code Quality
```bash
pnpm format    # Format code with Prettier
pnpm check     # Type check with TypeScript
```

---

## Deployment

### Option 1: Manus (Recommended)
The app is pre-configured for Manus hosting:
1. Click "Publish" in Manus Management UI
2. Configure Telegram webhook
3. Set up daily reminder cron job

### Option 2: Netlify + Custom Backend
1. Push code to GitHub (already done ✓)
2. Connect GitHub repo to Netlify
3. Deploy backend separately (Express server)
4. Configure environment variables in Netlify

---

## API Documentation

### tRPC Procedures

#### Content Management
- `content.list()` - Get all content items (paginated)
- `content.getById(id)` - Get single content item
- `content.uploadAndGenerate(file, customPrompt?)` - Upload photo and generate captions
- `content.regenerate(id, tone)` - Regenerate captions with different tone
- `content.updateStatus(id, status)` - Update approval status
- `content.delete(id)` - Delete content item

#### Telegram Integration
- `telegram.sendToChat(contentId)` - Send caption to Telegram
- `telegram.sendReminder()` - Send daily reminder
- `telegram.updateMessage(messageId, status)` - Update Telegram message

#### Authentication
- `auth.me()` - Get current user
- `auth.logout()` - Log out user

---

## Telegram Setup

### Create a Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create new bot: `/newbot`
3. Copy the bot token
4. Add token to `.env.local` as `TELEGRAM_BOT_TOKEN`

### Get Your Chat ID
1. Message your bot
2. Visit: `https://api.telegram.org/bot{TOKEN}/getUpdates`
3. Find your chat ID in the response
4. Add to `.env.local` as `TELEGRAM_CHAT_ID`

### Set Webhook
```bash
curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -d url=https://your-app-domain.com/api/webhooks/telegram
```

---

## Features in Detail

### Photo Upload
- Drag-and-drop or click to browse
- Real-time preview
- File size validation (max 10MB)
- Automatic format detection

### Caption Generation
The AI analyzes your photo and generates:
- **Khmer caption** - Culturally appropriate, engaging
- **English caption** - Professional, SEO-friendly
- **Hashtags** - Relevant for each language
- **Tone options** - Professional, Casual, or Trendy

### Approval Workflow
1. Generate caption → Save as Draft
2. Review in dashboard
3. Send to Telegram for mobile approval
4. Approve via Telegram button → Status updates instantly
5. Copy caption and post to social media
6. Mark as Posted

### Content History
- Filter by status (Draft, Approved, Posted, Archived)
- Sort by date (newest first)
- Quick-copy buttons for Khmer and English
- Delete old content
- Thumbnail previews

---

## Security

- **Authentication:** Manus OAuth (owner-only access)
- **Secrets:** Stored in environment variables, never in code
- **Database:** Encrypted connection, automatic backups
- **File Storage:** S3-compatible, secure signed URLs
- **Telegram:** Webhook signature verification

---

## Performance

- **Page load:** < 2 seconds
- **Caption generation:** 5-10 seconds (AI processing)
- **Telegram sync:** Real-time (< 1 second)
- **Database queries:** Optimized with indexes

---

## Troubleshooting

### Captions not generating?
- Check LLM API key in environment variables
- Verify photo is clear and well-lit
- Try regenerating with different tone

### Telegram not receiving messages?
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check `TELEGRAM_CHAT_ID` is valid
- Ensure webhook is registered

### Database connection error?
- Verify `DATABASE_URL` in `.env.local`
- Check database is running
- Confirm credentials are correct

---

## Support & Feedback

For issues, feature requests, or feedback:
- Create an issue on GitHub
- Contact the development team

---

## License

MIT License — See LICENSE file for details

---

## Changelog

### Version 1.0.0 (May 2026)
- ✅ Initial release
- ✅ Photo upload with AI caption generation
- ✅ Bilingual (Khmer + English) support
- ✅ Telegram approval workflow
- ✅ Content management dashboard
- ✅ Daily reminder cron job
- ✅ 26 passing tests
- ✅ Production-ready

---

**Built with ❤️ for Leanghouy Barber & Salon**

*An elegant solution for social media content creation.*
