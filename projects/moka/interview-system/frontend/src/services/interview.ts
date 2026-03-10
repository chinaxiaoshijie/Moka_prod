import api from './api';
import { Interview, ApiResponse, PaginatedResponse } from '../types';

// 面试管理API
export const interviewService = {
  // 获取面试列表
  async getInterviews(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    interviewer_id?: number;
    candidate_id?: number;
    position_id?: number;
    interview_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<PaginatedResponse<Interview>> {
    return api.get('/interviews', { params });
  },

  // 获取单个面试
  async getInterview(id: number): Promise<ApiResponse<Interview>> {
    return api.get(`/api/interviews/${id}`);
  },

  // 创建面试
  async createInterview(data: Partial<Interview>): Promise<ApiResponse<Interview>> {
    return api.post('/interviews', data);
  },

  // 更新面试
  async updateInterview(id: number, data: Partial<Interview>): Promise<ApiResponse<Interview>> {
    return api.put(`/api/interviews/${id}`, data);
  },

  // 删除面试
  async deleteInterview(id: number): Promise<ApiResponse> {
    return api.delete(`/api/interviews/${id}`);
  },

  // 获取面试统计
  async getStatistics(): Promise<ApiResponse<{
    total_interviews: number;
    scheduled_interviews: number;
    in_progress_interviews: number;
    completed_interviews: number;
    cancelled_interviews: number;
    no_show_interviews: number;
    today_interviews: number;
    this_week_interviews: number;
    passed_interviews: number;
    average_score: number;
  }>> {
    return api.get('/interviews/statistics');
  },

  // 获取日历数据
  async getCalendarData(params?: {
    interviewer_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Array<{
    id: number;
    title: string;
    start: string;
    end: string;
    status: string;
    type: string;
    round: number;
    interviewer: string;
  }>>> {
    return api.get('/interviews/calendar', { params });
  },

  // 获取面试官可用时间
  async getInterviewerAvailability(interviewerId: number, date: string): Promise<ApiResponse<Array<{
    scheduled_time: string;
    duration: number;
  }>>> {
    return api.get(`/api/interviews/availability/${interviewerId}/${date}`);
  },

  // 提交面试反馈
  async submitFeedback(id: number, data: {
    feedback: string;
    score: number;
    result: 'pass' | 'fail' | 'pending';
  }): Promise<ApiResponse<Interview>> {
    return api.post(`/api/interviews/${id}/feedback`, data);
  },

  // 更新面试状态
  async updateStatus(id: number, data: {
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
  }): Promise<ApiResponse<Interview>> {
    return api.post(`/api/interviews/${id}/status`, data);
  },

  // 批量创建面试
  async batchCreateInterviews(data: {
    interviews: Partial<Interview>[];
  }): Promise<ApiResponse<Interview[]>> {
    return api.post('/interviews/batch-create', data);
  }
};