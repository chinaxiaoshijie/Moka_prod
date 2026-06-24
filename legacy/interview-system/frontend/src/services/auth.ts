import api from './api';
import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse, User } from '../types';

// 认证相关API
export const authService = {
  // 登录
  async login(data: LoginRequest): Promise<LoginResponse> {
    return api.post('/auth/login', data);
  },

  // 注册
  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return api.post('/auth/register', data);
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get('/auth/me');
  },

  // 刷新token
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    return api.post('/auth/refresh', { refreshToken });
  },

  // 登出
  async logout(): Promise<ApiResponse> {
    return api.post('/auth/logout');
  },

  // 修改密码
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return api.put('/auth/change-password', data);
  },

  // 更新个人信息
  async updateProfile(data: { username?: string; department?: string }): Promise<ApiResponse<User>> {
    return api.put('/auth/profile', data);
  },

  // 验证token
  async verifyToken(): Promise<ApiResponse<{ valid: boolean; user: User }>> {
    return api.get('/auth/verify');
  }
};

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
  }) {
    return api.get('/users', { params });
  },

  // 获取单个用户
  async getUser(id: number): Promise<ApiResponse<User>> {
    return api.get(`/users/${id}`);
  },

  // 创建用户
  async createUser(data: RegisterRequest): Promise<ApiResponse<User>> {
    return api.post('/users', data);
  },

  // 更新用户
  async updateUser(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    return api.put(`/users/${id}`, data);
  },

  // 删除用户
  async deleteUser(id: number): Promise<ApiResponse> {
    return api.delete(`/users/${id}`);
  },

  // 获取面试官列表
  async getInterviewers(department?: string) {
    return api.get('/users/interviewers', { params: { department } });
  },

  // 获取部门列表
  async getDepartments() {
    return api.get('/users/departments');
  },

  // 获取用户统计
  async getStatistics() {
    return api.get('/users/statistics');
  }
};