# AfuDesk

![TypeScript](https://img.shields.io/badge/TypeScript-90.6%25-3178C6?logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-5.7%25-F7DF1E?logo=javascript&logoColor=black)
![PLpgSQL](https://img.shields.io/badge/PLpgSQL-2.2%25-336791?logo=postgresql&logoColor=white)
![Other](https://img.shields.io/badge/Other-1.5%25-lightgrey)

AfuDesk is a professional **live chat SaaS platform** that allows website owners to add a real-time support chat widget to their websites.

The platform provides an **embeddable chat widget**, a **dashboard for replying to visitors**, and **email notifications for new messages**.

AfuDesk is built using a **TypeScript-first architecture** and uses **Supabase** for realtime data synchronization and storage.

---

## Overview

AfuDesk enables website owners to communicate directly with visitors through a live chat widget embedded on their website.

Visitors send messages through the widget and website owners respond through the AfuDesk dashboard.

All chat sessions, messages, and website data are stored and fetched directly from Supabase.

No mock or placeholder data should be used in the application.

---

## Features

### Live Chat Widget
- Floating chat widget
- Mobile responsive
- Real-time visitor messaging
- Visitor message input field
- Offline form for collecting visitor name and email
- Customizable widget color
- Greeting message support
- Easy script installation

### Dashboard
- Secure login system
- Manage multiple websites
- View active conversations
- Reply to visitors in real time
- Chat status management (open / closed)
- View visitor details
- Conversation history

### Email Notifications
- Email alerts when visitors send messages
- Message preview included
- Direct link to dashboard conversation
- Replies handled only through the dashboard

---

## Tech Stack

**Frontend**
TypeScript

**Widget**
JavaScript

**Backend**
TypeScript

**Database**
Supabase (PostgreSQL)

**Database Functions**
PLpgSQL

**Email System**
Supabase Functions with SendGrid or Mailgun

---

## Database Structure

### Users
Stores website owner accounts.

Fields:
- id
- email
- password_hash
- created_at

### Websites
Stores websites added by users.

Fields:
- id
- owner_id
- domain
- widget_color
- created_at

### Chats
Represents visitor chat sessions.

Fields:
- id
- website_id
- visitor_name
- visitor_email
- status
- started_at

### Messages
Stores individual chat messages.

Fields:
- id
- chat_id
- sender
- message
- created_at

All application data must be fetched directly from Supabase.

---

## Chat Widget Installation

Embed the AfuDesk widget on your website using the script below:

```html
<script src="https://AFUDESK_DOMAIN/widget.js?site_id=UNIQUE_SITE_ID" async></script>

The widget automatically connects to the correct website using the "site_id".

---

Real-Time Messaging

AfuDesk uses Supabase realtime subscriptions.

Message flow:

1. Visitor sends message from widget
2. Message stored in Supabase
3. Dashboard receives update instantly
4. Website owner replies from dashboard

---

Project Goals

AfuDesk is designed to be:

- lightweight
- scalable
- realtime
- simple to integrate
- multi-tenant ready

---

License

MIT License

---

Author

Created by Abdul (AM Kaweesi)
Founder of AfuChat
