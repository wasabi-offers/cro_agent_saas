# CRO Agent SaaS

AI-powered Conversion Rate Optimization Agent that connects to Microsoft Clarity, Crazy Egg, and Google Analytics to provide actionable A/B testing suggestions.

## Features

- **Dashboard**: Real-time overview of sessions, conversions, revenue, and bounce rate
- **Analytics**: Detailed page performance, traffic sources, and device breakdown
- **A/B Tests**: AI-generated test suggestions based on your analytics data
- **Heatmaps**: Click, scroll, and mouse movement visualization
- **Funnels**: Conversion funnel analysis with drop-off identification
- **Data Sources**: Connect and manage Clarity, Crazy Egg, and GA integrations

## Tech Stack

- **Framework**: Next.js 15
- **UI**: React 19, Tailwind CSS
- **AI**: Anthropic Claude API
- **Database**: Supabase
- **Icons**: Lucide React

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/wasabi-offers/cro_agent_saas.git
cd cro_agent_saas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── analytics/            # Analytics page
│   ├── ab-tests/             # A/B Tests suggestions
│   ├── heatmaps/             # Heatmap visualization
│   ├── funnels/              # Conversion funnels
│   ├── data-sources/         # Integration management
│   └── api/                  # API routes
├── components/
│   ├── Header.tsx
│   └── Sidebar.tsx
└── lib/
    ├── supabase.ts           # Supabase client
    └── mock-data.ts          # Mock data for development
```

## API Routes

- `POST /api/sync-data` - Sync data from external sources
- `POST /api/generate-tests` - Generate A/B test suggestions
- `POST /api/cro-insights` - Get CRO insights from AI

## License

MIT

