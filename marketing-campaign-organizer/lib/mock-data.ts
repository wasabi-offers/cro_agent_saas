import { Campaign, CampaignCopy, CampaignReview, CampaignAnalytics } from './supabase';

// Mock data per demo senza Supabase configurato
export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Lancio Prodotto Estate 2026',
    description: 'Campagna email per il lancio della nuova collezione estiva',
    channel: 'email',
    status: 'in_editing',
    target_audience: 'Clienti attivi ultimi 6 mesi, età 25-45',
    objectives: 'Generare 500 conversioni, CTR > 8%',
    kpis: { target_ctr: 8, target_conversions: 500, target_revenue: 25000 },
    launch_date: '2026-05-15T09:00:00Z',
    end_date: '2026-06-15T23:59:59Z',
    created_by: 'Mario Rossi',
    created_at: '2026-01-05T10:00:00Z',
    updated_at: '2026-01-10T14:30:00Z',
    metadata: {}
  },
  {
    id: '2',
    title: 'Social Ads - Brand Awareness',
    description: 'Campagna Facebook/Instagram per aumentare awareness',
    channel: 'social',
    status: 'in_review',
    target_audience: 'Lookalike audience basata su clienti migliori',
    objectives: 'Raggiungere 100K impressions, engagement rate > 5%',
    kpis: { target_impressions: 100000, target_engagement: 5 },
    launch_date: '2026-01-20T00:00:00Z',
    end_date: '2026-02-20T23:59:59Z',
    created_by: 'Laura Bianchi',
    created_at: '2026-01-08T11:00:00Z',
    updated_at: '2026-01-10T16:00:00Z',
    metadata: {}
  },
  {
    id: '3',
    title: 'Google Ads - Black Friday',
    description: 'Campagna search ads per Black Friday',
    channel: 'ads',
    status: 'approved',
    target_audience: 'Utenti in ricerca di offerte, intento alto',
    objectives: 'ROI > 300%, budget €5000',
    kpis: { target_roi: 300, budget: 5000 },
    launch_date: '2026-11-20T00:00:00Z',
    end_date: '2026-11-30T23:59:59Z',
    created_by: 'Giuseppe Verdi',
    created_at: '2025-12-15T09:00:00Z',
    updated_at: '2026-01-09T10:00:00Z',
    metadata: {}
  },
  {
    id: '4',
    title: 'Newsletter Mensile - Gennaio',
    description: 'Newsletter informativa con contenuti del mese',
    channel: 'email',
    status: 'launched',
    target_audience: 'Tutti gli iscritti newsletter',
    objectives: 'Open rate > 25%, CTR > 3%',
    kpis: { target_open_rate: 25, target_ctr: 3 },
    launch_date: '2026-01-05T08:00:00Z',
    end_date: '2026-01-05T08:00:00Z',
    created_by: 'Anna Romano',
    created_at: '2026-01-02T14:00:00Z',
    updated_at: '2026-01-05T08:05:00Z',
    metadata: {}
  },
  {
    id: '5',
    title: 'SMS Promozionale - Saldi',
    description: 'SMS per annunciare inizio saldi invernali',
    channel: 'sms',
    status: 'analyzing',
    target_audience: 'Clienti VIP con consenso SMS',
    objectives: 'Conversion rate > 15%',
    kpis: { target_conversion_rate: 15 },
    launch_date: '2026-01-07T10:00:00Z',
    end_date: '2026-01-07T10:00:00Z',
    created_by: 'Francesco Russo',
    created_at: '2026-01-04T16:00:00Z',
    updated_at: '2026-01-08T12:00:00Z',
    metadata: {}
  }
];

export const mockCampaignCopy: Record<string, CampaignCopy[]> = {
  '1': [
    {
      id: 'c1',
      campaign_id: '1',
      version: 2,
      copy_type: 'subject_line',
      content: '🌞 Scopri la Collezione Estate 2026 - Offerta Esclusiva Inside',
      language: 'it',
      tone_of_voice: 'friendly',
      is_current: true,
      ai_generated: true,
      ai_prompt: 'Crea una subject line accattivante per email estate con emoji',
      created_by: 'AI Assistant',
      created_at: '2026-01-10T14:30:00Z',
      updated_at: '2026-01-10T14:30:00Z',
      metadata: {}
    },
    {
      id: 'c2',
      campaign_id: '1',
      version: 1,
      copy_type: 'body',
      content: `Ciao {nome},

L'estate sta arrivando e abbiamo una sorpresa speciale per te!

Scopri la nostra nuova collezione estiva con colori vivaci e tessuti leggeri, perfetti per le tue giornate al sole.

✨ Offerta Esclusiva per te: 20% di sconto sui primi ordini
🚚 Spedizione gratuita sopra i €50
💯 Garanzia soddisfatti o rimborsati

Clicca qui per esplorare la collezione →

A presto,
Il Team`,
      language: 'it',
      tone_of_voice: 'friendly',
      is_current: true,
      ai_generated: false,
      ai_prompt: null,
      created_by: 'Mario Rossi',
      created_at: '2026-01-09T11:00:00Z',
      updated_at: '2026-01-09T11:00:00Z',
      metadata: {}
    }
  ],
  '2': [
    {
      id: 'c3',
      campaign_id: '2',
      version: 1,
      copy_type: 'headline',
      content: 'Scopri il tuo stile unico con la nostra collezione 2026',
      language: 'it',
      tone_of_voice: 'professional',
      is_current: true,
      ai_generated: true,
      ai_prompt: 'Headline per social ads brand awareness moda',
      created_by: 'AI Assistant',
      created_at: '2026-01-08T15:00:00Z',
      updated_at: '2026-01-08T15:00:00Z',
      metadata: {}
    }
  ]
};

export const mockReviews: CampaignReview[] = [
  {
    id: 'r1',
    campaign_id: '1',
    copy_id: 'c1',
    reviewer_name: 'Laura Bianchi',
    reviewer_email: 'laura@example.com',
    review_type: 'feedback',
    status: 'changes_requested',
    comments: 'Subject line troppo lunga, riduci a max 50 caratteri. Emoji va bene ma considera alternative.',
    inline_comments: [],
    rating: 3,
    created_at: '2026-01-10T15:00:00Z',
    updated_at: '2026-01-10T15:00:00Z'
  },
  {
    id: 'r2',
    campaign_id: '2',
    copy_id: 'c3',
    reviewer_name: 'Giuseppe Verdi',
    reviewer_email: 'giuseppe@example.com',
    review_type: 'approval',
    status: 'approved',
    comments: 'Perfetto! Procedi con il lancio.',
    inline_comments: [],
    rating: 5,
    created_at: '2026-01-09T17:00:00Z',
    updated_at: '2026-01-09T17:00:00Z'
  }
];

export const mockAnalytics: Record<string, CampaignAnalytics[]> = {
  '4': [
    {
      id: 'a1',
      campaign_id: '4',
      metric_date: '2026-01-05',
      impressions: 12500,
      clicks: 425,
      conversions: 38,
      ctr: 3.4,
      conversion_rate: 8.94,
      engagement_rate: 12.5,
      revenue: 3420,
      cost: 150,
      roi: 2180,
      custom_metrics: {},
      created_at: '2026-01-06T10:00:00Z',
      updated_at: '2026-01-06T10:00:00Z'
    }
  ],
  '5': [
    {
      id: 'a2',
      campaign_id: '5',
      metric_date: '2026-01-07',
      impressions: 2500,
      clicks: 0,
      conversions: 420,
      ctr: 0,
      conversion_rate: 16.8,
      engagement_rate: 16.8,
      revenue: 12600,
      cost: 250,
      roi: 4940,
      custom_metrics: { sms_delivered: 2500, sms_clicked: 420 },
      created_at: '2026-01-08T09:00:00Z',
      updated_at: '2026-01-08T09:00:00Z'
    }
  ]
};
