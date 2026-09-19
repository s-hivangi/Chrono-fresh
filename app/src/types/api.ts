/** TypeScript interfaces matching the backend /api/v1/ response schemas */

export interface ProductOut {
  product_id: number;
  produce_type: string;
  variety?: string | null;
  storage_type?: string | null;
  status: string;           // 'active' | 'completed'
  outcome?: string | null;  // 'consumed' | 'discarded' | null
  display_name?: string | null;
  date_added?: string | null;
  completed_at?: string | null;
  latest_stage?: string | null;
  latest_days_remaining?: number | null;
  latest_days_display?: string | null;
  latest_thumbnail_url?: string | null;
}

export interface PredictionOut {
  prediction_id: number;
  image_id: number;
  freshness_stage: string;
  days_remaining: number;
  days_remaining_display: string;
  confidence: number;
  advice: string;
  refrigeration_trigger: boolean;
  fifo_priority: string;
  action_type: string;
  predicted_at?: string | null;
}

export interface ImageHistoryOut {
  image_id: number;
  product_id: number;
  produce_type?: string | null;
  display_name?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  capture_date: string;
  original_filename?: string | null;
  batch_id?: string | null;
  batch_mode?: string | null;
  processing_status: string;
  error_message?: string | null;
  prediction?: PredictionOut | null;
}

export interface AnalyzeResult {
  analysis_token: string;
  produce_type: string;
  freshness_stage: string;
  days_remaining: number;
  days_remaining_display: string;
  confidence: number;
  advice: string;
  refrigeration_trigger: boolean;
  fifo_priority: string;
  action_type: string;
}

export interface MetaOut {
  produce_types: string[];
  freshness_stages: string[];
  storage_options: string[];
  use_real_model: boolean;
}

export interface DashboardV1Stats {
  active_count: number;
  use_soon_count: number;
  fresh_count: number;
  spoiled_count: number;
}

export interface DashboardV1Out {
  stats: DashboardV1Stats;
  use_first: ProductOut[];
  recent_scans: ImageHistoryOut[];
  all_active: ProductOut[];
}

export interface AnalyticsOut {
  total_scans: number;
  active_count: number;
  completed_count: number;
  consumed_count: number;
  discarded_count: number;
  freshness_distribution: Record<string, number>;
  scans_over_time: { date: string; count: number }[];
  outcome_distribution: Record<string, number>;
}
