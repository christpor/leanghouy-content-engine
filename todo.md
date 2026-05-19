# Leanghouy Content Engine - Project TODO

## Phase 1: Foundation (COMPLETED)
- [x] Repository structure setup
- [x] AGENTS.md created
- [x] Master PRD created

## Phase 2: Backend & Database (COMPLETED)
- [x] Database schema: content items table with bilingual fields, approval status, storage references
- [x] Database schema: telegram sync table to track approval status
- [x] tRPC procedure: upload photo (file storage integration)
- [x] tRPC procedure: generate captions (LLM integration with vision)
- [x] tRPC procedure: regenerate captions with custom tone/prompt
- [x] tRPC procedure: list content history (paginated)
- [x] tRPC procedure: update content approval status
- [x] tRPC procedure: delete content
- [x] Vitest tests for all backend procedures

## Phase 3: Frontend UI (COMPLETED)
- [x] Design system & theme setup (elegant, polished aesthetic)
- [x] Photo upload component (drag-and-drop + file picker)
- [x] Photo preview before submission
- [x] Caption generation loading state
- [x] Bilingual caption display (Khmer + English side-by-side)
- [x] Copy-to-clipboard buttons for each language
- [x] Regenerate modal (tone selection: professional, casual, trendy)
- [x] Content history dashboard (list view with thumbnail, date, status)
- [x] Quick-copy actions in history
- [x] Content approval status selector (approved, draft, archived)
- [x] Empty state and loading states
- [x] Responsive design (mobile-first)

## Phase 4: Telegram Integration (COMPLETED)
- [x] Telegram bot setup and credentials
- [x] Send generated captions to Telegram chat
- [x] Telegram inline buttons for approval/rejection
- [x] Webhook to receive Telegram callback queries
- [x] Sync approval status from Telegram back to dashboard
- [x] Handle Telegram message formatting (bilingual)
- [x] Error handling for Telegram delivery

## Phase 5: Daily Reminder & Polish (COMPLETED)
- [x] Heartbeat cron job: daily check for approved but unposted content
- [x] Telegram reminder message for approved content
- [x] In-app notification for approved content
- [x] UI polish: animations, transitions, micro-interactions
- [x] Accessibility audit
- [x] Performance optimization
- [x] Error handling & user feedback

## Phase 6: Delivery (COMPLETED)
- [x] Final testing across all workflows (26 tests passing)
- [x] Documentation: setup guide, Telegram bot configuration
- [x] Deployment checklist
- [x] Create final checkpoint
