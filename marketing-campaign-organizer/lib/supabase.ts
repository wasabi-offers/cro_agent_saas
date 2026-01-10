import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  channel: 'email' | 'social' | 'ads' | 'sms' | 'other';
  status: 'draft' | 'in_editing' | 'in_review' | 'approved' | 'launched' | 'analyzing' | 'completed';
  target_audience: string | null;
  objectives: string | null;
  kpis: any;
  launch_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface CampaignCopy {
  id: string;
  campaign_id: string;
  version: number;
  copy_type: 'headline' | 'body' | 'cta' | 'subject_line' | 'description' | 'other';
  content: string;
  language: string;
  tone_of_voice: string | null;
  is_current: boolean;
  ai_generated: boolean;
  ai_prompt: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface CampaignReview {
  id: string;
  campaign_id: string;
  copy_id: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  review_type: 'feedback' | 'approval' | 'rejection';
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: string | null;
  inline_comments: any;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  metric_date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number | null;
  conversion_rate: number | null;
  engagement_rate: number | null;
  revenue: number | null;
  cost: number | null;
  roi: number | null;
  custom_metrics: any;
  created_at: string;
  updated_at: string;
}
