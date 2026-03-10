import api from './api';

export interface FeedbackFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  overall_rating?: string;
  recommendation?: string;
  interviewer_id?: number | string;
  date_from?: string;
  date_to?: string;
}

export interface FeedbackData {
  interview_id: number;
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  cultural_fit_score?: number;
  leadership_score?: number;
  creativity_score?: number;
  strengths: string;
  weaknesses: string;
  technical_assessment: string;
  behavioral_assessment: string;
  improvement_suggestions?: string;
  additional_notes?: string;
  overall_rating: 'excellent' | 'good' | 'average' | 'poor';
  overall_score?: number;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  confidence_level?: number;
}

export const feedbackService = {
  // 获取反馈列表
  getFeedbacks: (params: FeedbackFilters = {}) => {
    return api.get('/feedbacks', { params });
  },

  // 获取反馈详情
  getFeedback: (id: number) => {
    return api.get(`/feedbacks/${id}`);
  },

  // 创建反馈
  createFeedback: (data: FeedbackData) => {
    return api.post('/feedbacks', data);
  },

  // 更新反馈
  updateFeedback: (id: number, data: Partial<FeedbackData>) => {
    return api.put(`/feedbacks/${id}`, data);
  },

  // 删除反馈
  deleteFeedback: (id: number) => {
    return api.delete(`/feedbacks/${id}`);
  },

  // 提交反馈
  submitFeedback: (id: number) => {
    return api.patch(`/feedbacks/${id}/submit`);
  },

  // 审阅反馈
  reviewFeedback: (id: number, reviewData: { reviewed_by: number; reviewed_at: string }) => {
    return api.patch(`/feedbacks/${id}/review`, reviewData);
  },

  // 获取反馈统计
  getStatistics: (params: { date_from?: string; date_to?: string } = {}) => {
    return api.get('/feedbacks/statistics', { params });
  },

  // 获取反馈模板
  getTemplates: () => {
    return api.get('/feedbacks/templates');
  },

  // 根据面试ID获取反馈
  getFeedbackByInterview: (interviewId: number) => {
    return api.get(`/feedbacks/interview/${interviewId}`);
  },

  // 批量删除反馈
  batchDeleteFeedbacks: (ids: number[]) => {
    return api.delete('/feedbacks/batch', { data: { ids } });
  },

  // 导出反馈数据
  exportFeedbacks: (params: FeedbackFilters = {}) => {
    return api.get('/feedbacks/export', {
      params,
      responseType: 'blob'
    });
  }
};