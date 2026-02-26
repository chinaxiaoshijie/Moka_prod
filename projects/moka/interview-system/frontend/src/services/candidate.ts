import api from './api';
import { Candidate, ApiResponse, PaginatedResponse } from '../types';

// 候选人管理API
export const candidateService = {
  // 获取候选人列表
  async getCandidates(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    source?: string;
    education?: string;
    experience_years?: number;
    search?: string;
  }): Promise<PaginatedResponse<Candidate>> {
    return api.get('/candidates', { params });
  },

  // 获取单个候选人
  async getCandidate(id: number): Promise<ApiResponse<Candidate>> {
    return api.get(`/api/candidates/${id}`);
  },

  // 创建候选人
  async createCandidate(data: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    return api.post('/candidates', data);
  },

  // 更新候选人
  async updateCandidate(id: number, data: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    return api.put(`/api/candidates/${id}`, data);
  },

  // 删除候选人
  async deleteCandidate(id: number): Promise<ApiResponse> {
    return api.delete(`/api/candidates/${id}`);
  },

  // 搜索候选人
  async searchCandidates(searchTerm: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Candidate[]>> {
    return api.get('/candidates/search', {
      params: { q: searchTerm, ...params }
    });
  },

  // 获取候选人统计
  async getStatistics(): Promise<ApiResponse<{
    total_candidates: number;
    new_candidates: number;
    screening_candidates: number;
    interviewing_candidates: number;
    offer_candidates: number;
    hired_candidates: number;
    rejected_candidates: number;
    new_this_week: number;
    new_this_month: number;
  }>> {
    return api.get('/candidates/statistics');
  },

  // 重复检查
  async checkDuplicates(data: {
    email?: string;
    phone?: string;
    name?: string;
  }): Promise<ApiResponse<{
    hasDuplicates: boolean;
    duplicates: Candidate[];
  }>> {
    return api.post('/candidates/duplicate-check', data);
  },

  // 上传简历
  async uploadResume(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('resume', file);

    return api.post('/candidates/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};