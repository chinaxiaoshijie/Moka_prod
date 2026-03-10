// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'hr' | 'interviewer';
  department?: string;
  status: 'active' | 'inactive' | 'deleted';
  avatar?: string;
  phone?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// 登录响应类型
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: string;
  };
  timestamp: string;
}

// 登录请求类型
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求类型
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'hr' | 'interviewer';
  department?: string;
}

// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

// 候选人类型
export interface Candidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  education?: 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctor' | 'other';
  school?: string;
  major?: string;
  experience_years?: number;
  current_company?: string;
  current_position?: string;
  current_salary?: number;
  expected_salary?: number;
  skills?: string;
  resume_url?: string;
  source: 'boss' | 'lagou' | 'zhilian' | 'internal' | 'referral' | 'manual' | 'other';
  status: 'new' | 'screening' | 'interviewing' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// 职位类型
export interface Position {
  id: number;
  title: string;
  department: string;
  level: 'junior' | 'middle' | 'senior' | 'expert' | 'manager';
  type: 'fulltime' | 'parttime' | 'intern' | 'contract';
  location?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  requirements?: string;
  benefits?: string;
  status: 'active' | 'paused' | 'closed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  headcount: number;
  created_at: string;
  updated_at: string;
}

// 面试类型
export interface Interview {
  id: number;
  candidate_id: number;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  candidate_status?: string;
  position_id: number;
  position_title?: string;
  interviewer_id: number;
  interviewer_name: string;
  scheduled_time: string;
  duration: number;
  location?: string;
  meeting_link?: string;
  interview_type: 'phone' | 'video' | 'onsite';
  interview_round: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  feedback?: string;
  score?: number;
  result?: 'pass' | 'fail' | 'pending';
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// 面试反馈类型
export interface InterviewFeedback {
  id: number;
  interview_id: number;
  interviewer_id: number;
  overall_rating: 'very_unsatisfied' | 'unsatisfied' | 'neutral' | 'satisfied' | 'very_satisfied';
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  cultural_fit_score?: number;
  overall_score?: number;
  strengths?: string;
  weaknesses?: string;
  improvement_suggestions?: string;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  comments?: string;
  is_submitted: boolean;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}