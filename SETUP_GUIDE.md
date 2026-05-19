# Leanghouy Content Engine — Setup & Deployment Guide

## Overview

The **Leanghouy Content Engine** is an elegant, AI-powered social media content management system designed exclusively for the Leanghouy Barber & Salon owner. It enables rapid creation of bilingual (Khmer + English) social media captions from uploaded photos, with integrated Telegram approval workflows and daily reminders.

### Key Features

- **AI Caption Generation**: Upload photos and auto-generate bilingual captions using vision-based LLM analysis
- **Bilingual Support**: Automatic generation in both Khmer and English with hashtags
- **Tone Variations**: Professional, casual, or trendy caption styles
- **Telegram Approval Workflow**: Send captions to Telegram for one-tap approval with inline buttons
- **Content Dashboard**: Track all generated content with approval status and history
- **Daily Reminders**: Automatic reminders for approved but unposted content
- **Owner-Only Access**: Secure authentication ensures only the salon owner can access

---

## Prerequisites

Before deploying, ensure you have:

1. **Manus Account**: Active Manus project with database and OAuth configured
2. **Telegram Bot**: Created via BotFather (@BotFather on Telegram)
3. **Telegram Chat ID**: Your personal Telegram chat ID for receiving approvals
4. **Environment Variables**: All required secrets configured

---

## Step 1: Telegram Bot Setup

### 1.1 Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/start` and follow the prompts
3. Send `/newbot` to create a new bot
4. Choose a name (e.g., "Leanghouy Content Bot")
5. Choose a username (e.g., "leanghouy_content_bot")
6. BotFather will provide your **Bot Token** (save this securely)

### 1.2 Get Your Chat ID

1. Message your new bot with any text
2. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":<YOUR_CHAT_ID>}` in the response
4. Save your **Chat ID**

### 1.3 Set Webhook (After Deployment)

After deploying the application, set the Telegram webhook to receive approval callbacks:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://<YOUR_DEPLOYED_URL>/api/webhooks/telegram"
```

Replace:
- `<YOUR_BOT_TOKEN>` with your bot token from step 1.1
- `<YOUR_DEPLOYED_URL>` with your deployed Manus application URL

---

## Step 2: Environment Configuration

### 2.1 Required Secrets

Configure these environment variables in your Manus project:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID | `987654321` |

These are automatically injected by the Manus platform. No manual `.env` file needed.

### 2.2 Verify Configuration

The application will validate Telegram credentials on startup. If either is missing, the Telegram features will be disabled with an error message.

---

## Step 3: Database Schema

The application uses the following database tables:

### `contentItems`
Stores uploaded photos and generated captions.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INT | Primary key |
| `userId` | INT | Owner reference |
| `photoStorageKey` | VARCHAR | S3 storage reference |
| `photoUrl` | TEXT | Public photo URL |
| `captionKhmer` | TEXT | Khmer caption |
| `captionEnglish` | TEXT | English caption |
| `hashtagsKhmer` | TEXT | Khmer hashtags |
| `hashtagsEnglish` | TEXT | English hashtags |
| `generationTone` | VARCHAR | professional/casual/trendy |
| `status` | ENUM | draft/approved/posted/archived |
| `telegramMessageId` | VARCHAR | Telegram message ID |
| `telegramChatId` | VARCHAR | Telegram chat ID |
| `createdAt` | TIMESTAMP | Creation time |
| `updatedAt` | TIMESTAMP | Last update |
| `postedAt` | TIMESTAMP | When posted (nullable) |

### `telegramSyncLog`
Tracks approval actions from Telegram to keep dashboard in sync.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INT | Primary key |
| `contentItemId` | INT | Content reference |
| `telegramUserId` | VARCHAR | Telegram user ID |
| `telegramMessageId` | VARCHAR | Telegram message ID |
| `action` | ENUM | approved/rejected/viewed |
| `newStatus` | VARCHAR | Status after action |
| `createdAt` | TIMESTAMP | Action timestamp |

---

## Step 4: Deployment

### 4.1 Create Checkpoint

Before deploying, create a checkpoint to save your current state:

```bash
# In the Manus UI, click "Publish" button
# This creates a checkpoint and prepares for deployment
```

### 4.2 Deploy to Production

1. Click the **Publish** button in the Manus Management UI
2. Wait for the deployment to complete
3. Your app will be available at `https://<project-name>.manus.space`

### 4.3 Set Telegram Webhook

After deployment, register your webhook with Telegram:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://<YOUR_DEPLOYED_URL>/api/webhooks/telegram"
```

---

## Step 5: Create Daily Reminder Cron Job

The application includes a daily reminder that checks for approved but unposted content.

### 5.1 Create the Cron Job

After deployment, create the daily reminder cron job:

```bash
manus-heartbeat create \
  --name "leanghouy-daily-reminder" \
  --cron "0 0 9 * * *" \
  --path "/api/scheduled/dailyReminder" \
  --description "Daily reminder for approved content"
```

This will:
- Run every day at 9:00 AM UTC (6-field format: sec min hour dom mon dow)
- Check for approved but unposted content
- Send a Telegram reminder if configured
- Send an in-app notification to the owner

### 5.2 Manage the Cron Job

View all scheduled jobs:
```bash
manus-heartbeat list
```

Update the cron expression:
```bash
manus-heartbeat update --task-uid <TASK_UID> --cron "0 8 * * *"
```

Pause the job:
```bash
manus-heartbeat update --task-uid <TASK_UID> --enable false
```

Delete the job:
```bash
manus-heartbeat delete --task-uid <TASK_UID>
```

---

## Step 6: First-Time Usage

### 6.1 Login

1. Navigate to your deployed application URL
2. Click "Get Started" or "Login"
3. Authenticate with your Manus OAuth credentials
4. You'll be redirected to the Content Engine dashboard

### 6.2 Create Your First Caption

1. Click the **Create** tab
2. Upload a photo (drag-and-drop or file picker)
3. Preview the photo
4. Click "Generate Captions"
5. Wait for AI to generate bilingual captions
6. Review the Khmer and English versions
7. Copy captions to clipboard or regenerate with different tone

### 6.3 Send to Telegram for Approval

1. After generating captions, click "Send to Telegram"
2. The caption will appear in your Telegram chat with approval buttons
3. Click ✅ Approve, ❌ Reject, or 🔄 Regenerate in Telegram
4. The dashboard will automatically sync the approval status
5. Approved content appears in the History tab

### 6.4 Track Content History

1. Click the **History** tab
2. View all generated content with thumbnails and status
3. Filter by status (Draft, Approved, Posted, Archived)
4. Quick-copy captions directly from the list
5. Update status or delete content as needed

---

## API Endpoints

### tRPC Procedures

All API calls are made via tRPC at `/api/trpc`.

#### Content Management

- `content.list` — List all content items (paginated)
- `content.getById` — Get a single content item
- `content.generateCaptions` — Generate captions from uploaded photo
- `content.regenerate` — Regenerate captions with different tone
- `content.updateStatus` — Change approval status
- `content.delete` — Delete a content item

#### File Upload

- `upload.photo` — Upload a photo file

#### Telegram Integration

- `telegram.sendForApproval` — Send captions to Telegram
- `telegram.sendReminder` — Send reminder notification
- `telegram.updateMessage` — Update Telegram message after regeneration

### Scheduled Endpoints

- `POST /api/scheduled/dailyReminder` — Daily reminder handler (cron-triggered)

### Webhooks

- `POST /api/webhooks/telegram` — Receive Telegram callback queries

---

## Troubleshooting

### Telegram Messages Not Sending

**Problem**: Captions don't appear in Telegram chat.

**Solutions**:
1. Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are correctly set
2. Check that the bot has permission to send messages in the chat
3. Ensure the webhook is correctly registered: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
4. Check server logs for Telegram API errors

### Approval Status Not Syncing

**Problem**: Telegram approvals don't update the dashboard.

**Solutions**:
1. Verify the webhook is registered correctly
2. Check that the webhook URL is publicly accessible
3. Manually refresh the dashboard (F5) to see latest status
4. Check server logs for webhook handler errors

### Captions Not Generating

**Problem**: "Failed to generate captions" error.

**Solutions**:
1. Verify the photo uploaded successfully
2. Check that the LLM service is available
3. Ensure the photo is a valid image format (JPG, PNG, etc.)
4. Check server logs for LLM API errors
5. Try regenerating with a different tone

### Daily Reminder Not Firing

**Problem**: No reminder notifications received.

**Solutions**:
1. Verify the cron job is enabled: `manus-heartbeat list`
2. Check execution history: `manus-heartbeat logs --task-uid <TASK_UID>`
3. Verify Telegram credentials are set
4. Check that there is approved but unposted content
5. Review server logs for scheduled handler errors

---

## Performance & Limits

### File Upload

- **Max file size**: 50 MB
- **Supported formats**: JPG, PNG, GIF, WebP
- **Recommended size**: 1-5 MB for faster processing

### Content History

- **Default pagination**: 50 items per page
- **Storage**: Unlimited (stored in S3)
- **Retention**: Permanent (unless manually deleted)

### Telegram

- **Message rate limit**: 30 messages per second (Telegram API limit)
- **Callback timeout**: 2 minutes per request
- **Retry policy**: Up to 3 retries with exponential backoff

---

## Security

### Authentication

- All endpoints require Manus OAuth authentication
- Only the salon owner (admin role) can access the application
- Session cookies are secure and HTTP-only

### Data Protection

- Photos are stored in S3 with secure access controls
- Captions and metadata are encrypted in the database
- Telegram credentials are stored as environment variables (never in code)
- No data is logged or shared with third parties

### Webhook Security

- Telegram webhooks verify the origin of requests
- Only requests from Telegram's IP ranges are accepted
- Callback data is validated before updating content status

---

## Support & Maintenance

### Monitoring

Monitor application health via:
- Manus Dashboard: View deployment status and logs
- Server logs: Check `/api/scheduled/dailyReminder` execution history
- Telegram: Monitor message delivery and callback responses

### Backups

- Database: Automatically backed up by Manus platform
- Photos: Stored in S3 with redundancy
- Configuration: Stored as environment variables

### Updates

To update the application:
1. Make code changes in the sandbox
2. Test locally with `pnpm dev`
3. Create a checkpoint
4. Deploy via the Publish button

---

## Contact & Support

For issues or feature requests:
- Check the troubleshooting section above
- Review server logs in the Manus Dashboard
- Contact Manus support at https://help.manus.im

---

## Version History

- **v1.0.0** (2026-05-19): Initial release
  - Photo upload with preview
  - AI caption generation (Khmer + English)
  - Telegram approval workflow
  - Content history dashboard
  - Daily reminder cron job
