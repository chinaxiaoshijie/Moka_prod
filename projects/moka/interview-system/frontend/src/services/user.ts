import api from './api';
import { User, ApiResponse, PaginatedResponse } from '../types';

// 用户管理API
export const userService = {
  // 获取用户列表
  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    role?: string;
    department?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    return api.get('/users', { params });
  },

  // 获取单个用户
  async getUser(id: number): Promise<ApiResponse<User>> {
    return api.get(`/users/${id}`);
  },

  // 创建用户
  async createUser(data: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'hr' | 'interviewer';
    department?: string;
  }): Promise<ApiResponse<User>> {
    return api.post('/users', data);
  },

  // 更新用户
  async updateUser(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    return api.put(`/users/${id}`, data);
  },

  // 删除用户（软删除）
  async deleteUser(id: number): Promise<ApiResponse> {
    return api.delete(`/users/${id}`);
  },

  // 获取用户统计
  async getStatistics(): Promise<ApiResponse<{
    total_users: number;
    active_users: number;
    admin_count: number;
    hr_count: number;
    interviewer_count: number;
    active_last_30_days: number;
  }>> {
    return api.get('/users/statistics');
  },

  // 获取部门列表
  async getDepartments(): Promise<ApiResponse<Array<{
    department: string;
    count: number;
  }>>> {
    return api.get('/users/departments');
  },

  // 获取面试官列表
  async getInterviewers(department?: string): Promise<ApiResponse<Array<{
    id: number;
    username: string;
    email: string;
    department: string;
  }>>> {
    return api.get('/users/interviewers', {
      params: { department }
    });
  },

  // 更新用户状态
  async updateUserStatus(id: number, status: 'active' | 'inactive' | 'deleted'): Promise<ApiResponse<User>> {
    return api.put(`/users/${id}/status`, { status });
  },

  // 重置用户密码
  async resetPassword(id: number, newPassword: string): Promise<ApiResponse> {
    return api.put(`/users/${id}/reset-password`, { newPassword });
  },

  // 激活用户
  async activateUser(id: number): Promise<ApiResponse<User>> {
    return api.post(`/users/${id}/activate`);
  },

  // 禁用用户
  async deactivateUser(id: number): Promise<ApiResponse<User>> {
    return api.post(`/users/${id}/deactivate`);
  }
};