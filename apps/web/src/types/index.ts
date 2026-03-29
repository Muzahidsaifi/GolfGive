// ============================================================
// GOLF CHARITY PLATFORM — Global Types
// ============================================================

// ---------- User & Auth ----------

export type UserRole = 'subscriber' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  handicap?: number
  created_at: string
  updated_at: string
}

// ---------- Subscription ----------

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
export type SubscriptionPlan = 'monthly' | 'yearly'

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  charity_percentage: number     // Min 10, user can increase
  created_at: string
  updated_at: string
}

// ---------- Golf Scores ----------

export interface GolfScore {
  id: string
  user_id: string
  score: number           // 1–45 Stableford
  played_at: string       // Date the round was played
  created_at: string
  updated_at: string
}

// Rolling 5 latest scores per user
export type UserScores = GolfScore[]  // max 5 items

// ---------- Charity ----------

export interface Charity {
  id: string
  name: string
  slug: string
  description: string
  logo_url?: string
  banner_url?: string
  website_url?: string
  is_featured: boolean
  is_active: boolean
  total_raised: number
  events: CharityEvent[]
  created_at: string
  updated_at: string
}

export interface CharityEvent {
  id: string
  charity_id: string
  title: string
  description: string
  event_date: string
  location?: string
  image_url?: string
  created_at: string
}

export interface UserCharity {
  user_id: string
  charity_id: string
  charity: Charity
  contribution_percentage: number
}

// ---------- Draw ----------

export type DrawStatus = 'upcoming' | 'simulation' | 'published' | 'archived'
export type DrawLogic = 'random' | 'algorithmic'

export interface Draw {
  id: string
  month: string           // e.g. "2025-06"
  title: string           // e.g. "June 2025 Draw"
  status: DrawStatus
  logic: DrawLogic
  winning_numbers: number[]   // 5 numbers
  jackpot_amount: number
  four_match_amount: number
  three_match_amount: number
  total_pool: number
  participant_count: number
  rolled_over_from?: string   // Draw ID if jackpot rolled over
  jackpot_rolled_to?: string  // Draw ID if jackpot rolls forward
  published_at?: string
  draw_date: string
  created_at: string
  updated_at: string
}

export type MatchType = '5-match' | '4-match' | '3-match' | 'no-match'

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  scores_snapshot: number[]   // User's 5 scores at time of draw
  match_type: MatchType
  prize_amount: number
  created_at: string
}

// ---------- Winner & Verification ----------

export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type PaymentStatus = 'pending' | 'paid'

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  draw_entry_id: string
  match_type: MatchType
  prize_amount: number
  verification_status: VerificationStatus
  payment_status: PaymentStatus
  proof_url?: string
  admin_notes?: string
  verified_at?: string
  paid_at?: string
  created_at: string
  updated_at: string
  // Joined
  profile?: Profile
  draw?: Draw
}

// ---------- Prize Pool ----------

export interface PrizePool {
  draw_id: string
  total_pool: number
  jackpot_pool: number       // 40%
  four_match_pool: number    // 35%
  three_match_pool: number   // 25%
  jackpot_rollover: number   // Accumulated from previous draws
}

// ---------- Analytics / Reports ----------

export interface PlatformStats {
  total_users: number
  active_subscribers: number
  total_charity_contributed: number
  total_prize_pool_all_time: number
  draws_completed: number
  total_winners: number
  charity_breakdown: { charity_id: string; charity_name: string; total: number }[]
}

// ---------- API Response ----------

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// ---------- Form Types ----------

export interface ScoreEntryForm {
  score: number
  played_at: string
}

export interface SubscribeForm {
  plan: SubscriptionPlan
  charity_id: string
  charity_percentage: number
}

export interface RegisterForm {
  full_name: string
  email: string
  password: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface DrawConfigForm {
  logic: DrawLogic
  draw_date: string
  title: string
}
