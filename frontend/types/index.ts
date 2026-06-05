// ═══════════════════════════════════════════════════════════════
// FILE: types/index.ts
// PURPOSE: All TypeScript type definitions in one place.
//          TypeScript types = contracts that define what shape
//          your data must have. Catches bugs at compile time.
// ═══════════════════════════════════════════════════════════════

export interface User {
  id:         string;
  email:      string;
  full_name:  string | null;
  role:       'user' | 'admin';
  avatar_url: string | null;
  created_at: string;
}

export interface AuthState {
  user:        User | null;
  token:       string | null;
  isLoading:   boolean;
  isAuthenticated: boolean;
  login:       (email: string, password: string) => Promise<void>;
  register:    (email: string, password: string, fullName: string) => Promise<void>;
  logout:      () => void;
}

export interface SidebarState {
  isOpen:         boolean;
  isMobileOpen:   boolean;
  isCollapsed:    boolean;
  toggle:         () => void;
  toggleMobile:   () => void;
  toggleCollapse: () => void;
  closeMobile:    () => void;
}

// ── Chat Types ──────────────────────────────────────────────────
export interface ChatMessage {
  id:         string;
  role:       'user' | 'assistant';
  content:    string;
  sources?:   RAGSource[];
  created_at: string;
}

export interface ChatSession {
  id:         string;
  title:      string;
  created_at: string;
}

export interface RAGSource {
  title:       string;
  source_type: string;
  source_url?: string;
  similarity:  number;
}

// ── Phishing Types ──────────────────────────────────────────────
export interface PhishingIndicator {
  category:    string;
  description: string;
  severity:    'low' | 'medium' | 'high' | 'critical';
}

export interface PhishingResult {
  risk_level:          'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score:          number;
  is_phishing:         boolean;
  indicators:          PhishingIndicator[];
  legitimate_signals:  string[];
  verdict:             string;
  recommended_actions: string[];
  educational_tip:     string;
}

// ── Password Types ──────────────────────────────────────────────
export interface PasswordResult {
  strength:            string;
  score:               number;
  zxcvbn_score:        number;
  crack_time_display:  string;
  length:              number;
  has_uppercase:       boolean;
  has_lowercase:       boolean;
  has_numbers:         boolean;
  has_symbols:         boolean;
  has_common_patterns: boolean;
  what_is_good:        string[];
  what_needs_work:     string[];
  suggestions:         string[];
  security_tip:        string;
}

// ── Quiz Types ──────────────────────────────────────────────────
export interface QuizOption {
  key:   string;
  value: string;
}

export interface QuizQuestion {
  id:          number;
  question:    string;
  options:     QuizOption[];
  correct:     string;
  explanation: string;
  category?:   string;
}

export interface QuizData {
  topic:           string;
  difficulty:      string;
  total_questions: number;
  questions:       QuizQuestion[];
}

// ── Knowledge Base Types ────────────────────────────────────────
export interface KnowledgeSource {
  id:          string;
  title:       string;
  source_type: 'pdf' | 'docx' | 'txt' | 'md' | 'url' | 'youtube';
  source_url?: string;
  chunk_count: number;
  is_indexed:  boolean;
  created_at:  string;
}

// ── Navigation ──────────────────────────────────────────────────
export interface NavItem {
  label:    string;
  href:     string;
  icon:     React.ComponentType<{ className?: string }>;
  badge?:   string;
  adminOnly?: boolean;
}
