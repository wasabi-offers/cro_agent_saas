# Microsoft Clarity Setup

## Overview

Microsoft Clarity is integrated into the CRO Agent tool to track user behavior and interactions on the dashboard itself.

## Setup Instructions

### 1. Create a Clarity Project

1. Go to [Microsoft Clarity](https://clarity.microsoft.com)
2. Sign in with your Microsoft account
3. Click "Add new project"
4. Enter your project details
5. Copy your **Project ID** (it looks like: `abc123def456`)

### 2. Configure Environment Variable

Add your Clarity Project ID to `.env.local`:

```bash
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_project_id_here
```

Replace `your_project_id_here` with your actual Clarity Project ID.

### 3. Verify Installation

1. Restart your Next.js development server
2. Visit your app in the browser
3. Open browser DevTools → Network tab
4. Look for requests to `clarity.ms` - this confirms the script is loaded
5. Visit your Clarity dashboard - you should see sessions appearing

### 4. Check Data Sources Page

1. Go to `/data-sources` in your app
2. Microsoft Clarity should show as **Connected** if the Project ID is configured
3. If disconnected, verify your `.env.local` file has the correct variable

## Features

- **Automatic Tracking**: Clarity automatically tracks:
  - Session recordings
  - Heatmaps (click, scroll, move)
  - User behavior patterns
  - Page performance
  - Rage clicks and dead clicks

- **Privacy Compliant**: Clarity automatically masks sensitive information

## Important Notes

- Clarity tracking only works when `NEXT_PUBLIC_CLARITY_PROJECT_ID` is set
- The script loads automatically on all pages
- Clarity does **not** provide a public API to fetch metrics programmatically
- Session data is only viewable in the Clarity dashboard at clarity.microsoft.com

## Viewing Your Data

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com)
2. Select your project
3. View:
   - **Dashboard**: Overview of sessions, users, and engagement
   - **Recordings**: Watch individual user sessions
   - **Heatmaps**: See where users click, scroll, and move
   - **Insights**: Get AI-powered recommendations

## Troubleshooting

### Clarity shows as "Disconnected"

- Check that `.env.local` has `NEXT_PUBLIC_CLARITY_PROJECT_ID` set
- Verify the variable starts with `NEXT_PUBLIC_`
- Restart your dev server after adding the variable

### No data in Clarity dashboard

- Wait a few minutes for data to appear
- Ensure you're visiting the app in a real browser (not in iframe/incognito)
- Check browser console for errors
- Verify the Project ID is correct

## Security

- Never commit your Project ID to version control if it's sensitive
- The example `.env.example` has it commented out by default
- Project IDs are meant to be public (they appear in your HTML), but keep them private if you prefer
