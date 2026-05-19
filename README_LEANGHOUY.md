# Leanghouy Content Engine

An elegant, AI-powered social media content management system for the Leanghouy Barber & Salon. Generate bilingual (Khmer + English) captions from photos, manage approvals via Telegram, and automate daily reminders.

## ✨ Features

- **📸 Photo Upload** - Drag-and-drop interface with instant preview
- **🤖 AI Caption Generation** - Vision-based LLM generates bilingual captions automatically
- **🌐 Bilingual Support** - Khmer and English captions with hashtags, displayed side-by-side
- **🎨 Tone Variations** - Professional, casual, or trendy caption styles
- **📱 Telegram Approval** - Send captions to Telegram with one-tap approval buttons
- **📊 Content Dashboard** - Track all generated content with approval status and history
- **🔔 Daily Reminders** - Automatic notifications for approved but unposted content
- **🔒 Owner-Only Access** - Secure authentication ensures only the salon owner can access

## 🚀 Quick Start

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete setup instructions.

## 📋 Usage

### Create Content
1. Click the **Create** tab
2. Upload a photo (drag-and-drop or file picker)
3. Click "Generate Captions"
4. Review bilingual captions
5. Copy to clipboard or regenerate with different tone

### Send for Approval
1. Click "Send to Telegram"
2. Approve in your Telegram chat with one tap
3. Dashboard automatically syncs status

### Manage Content
1. Click the **History** tab
2. View all generated content with status
3. Quick-copy captions or update status

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Database**: MySQL with Drizzle ORM
- **AI**: Built-in LLM with vision capabilities
- **Storage**: S3 (Manus built-in)
- **Messaging**: Telegram Bot API
- **Scheduling**: Manus Heartbeat (cron jobs)

## 🧪 Testing

```bash
pnpm test
```

## 📚 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup and deployment guide
- [AGENTS.md](./AGENTS.md) - AI agent guidelines
- [PRD](./prd/master-prd.md) - Product requirements

---

**Version**: 1.0.0 | **Status**: Production Ready
