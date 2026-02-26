import api from './api';
import { Position, ApiResponse, PaginatedResponse } from '../types';

// 职位管理API
export const positionService = {
  // 获取职位列表
  async getPositions(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    department?: string;
    level?: string;
    type?: string;
    priority?: string;
    location?: string;
    search?: string;
    expired_only?: boolean;
    active_only?: boolean;
  }): Promise<PaginatedResponse<Position>> {
    return api.get('/positions', { params });
  },

  // 获取单个职位
  async getPosition(id: number): Promise<ApiResponse<Position>> {
    return api.get(`/api/positions/${id}`);
  },

  // 创建职位
  async createPosition(data: Partial<Position>): Promise<ApiResponse<Position>> {
    return api.post('/positions', data);
  },

  // 更新职位
  async updatePosition(id: number, data: Partial<Position>): Promise<ApiResponse<Position>> {
    return api.put(`/api/positions/${id}`, data);
  },

  // 删除职位
  async deletePosition(id: number): Promise<ApiResponse> {
    return api.delete(`/api/positions/${id}`);
  },

  // 搜索职位
  async searchPositions(searchTerm: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Position[]>> {
    return api.get('/positions/search', {
      params: { q: searchTerm, ...params }
    });
  },

  // 获取职位统计
  async getStatistics(): Promise<ApiResponse<{
    total_positions: number;
    active_positions: number;
    paused_positions: number;
    closed_positions: number;
    draft_positions: number;
    urgent_positions: number;
    new_this_week: number;
    expired_positions: number;
    total_headcount: number;
    total_filled: number;
    avg_salary: number;
  }>> {
    return api.get('/positions/statistics');
  },

  // 获取部门统计
  async getDepartmentStatistics(): Promise<ApiResponse<Array<{
    department: string;
    position_count: number;
    active_count: number;
    total_headcount: number;
    filled_headcount: number;
  }>>> {
    return api.get('/positions/departments');
  },

  // 更新职位状态
  async updateStatus(id: number, data: {
    status: 'active' | 'paused' | 'closed' | 'draft';
    reason?: string;
  }): Promise<ApiResponse<Position>> {
    return api.post(`/api/positions/${id}/status`, data);
  },

  // 更新职位招聘进度
  async updateProgress(id: number): Promise<ApiResponse<Position>> {
    return api.post(`/api/positions/${id}/progress`);
  },

  // 批量更新招聘进度
  async batchUpdateProgress(positionIds: number[]): Promise<ApiResponse<Position[]>> {
    return api.post('/positions/batch-update-progress', {
      position_ids: positionIds
    });
  }
};