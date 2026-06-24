import api from './api';

export interface FeedbackTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  questions: TemplateQuestion[];
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateQuestion {
  id: number;
  template_id: number;
  question_text: string;
  question_type: 'text' | 'rating' | 'boolean' | 'multiple_choice';
  options?: string;
  weight: number;
  order: number;
}

export interface TemplateFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  is_active?: boolean;
}

export const templateService = {
  // 获取反馈模板列表
  getTemplates: (params: TemplateFilters = {}) => {
    return api.get('/feedbacks/templates', { params });
  },

  // 获取单个模板
  getTemplate: (id: number) => {
    return api.get(`/feedbacks/templates/${id}`);
  },

  // 创建模板
  createTemplate: (data: Partial<FeedbackTemplate>) => {
    return api.post('/feedbacks/templates', data);
  },

  // 更新模板
  updateTemplate: (id: number, data: Partial<FeedbackTemplate>) => {
    return api.put(`/feedbacks/templates/${id}`, data);
  },

  // 删除模板
  deleteTemplate: (id: number) => {
    return api.delete(`/feedbacks/templates/${id}`);
  },

  // 批量删除模板
  batchDeleteTemplates: (ids: number[]) => {
    return api.delete('/feedbacks/templates/batch', { data: { ids } });
  },
};