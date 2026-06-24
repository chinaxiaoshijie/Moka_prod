import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';
import { message } from 'antd';

// 用户状态类型
interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Action类型
type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_USER'; payload: User };

// 初始状态
const initialState: UserState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
};

// Reducer
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Context类型
interface UserContextType {
  state: UserState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
  }) => Promise<void>;
  updateProfile: (data: { username?: string; department?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

// 创建Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider组件
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // 检查用户认证状态
  const checkAuth = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      dispatch({ type: 'CLEAR_USER' });
      return;
    }

    try {
      // 验证token有效性
      const response = await authService.verifyToken();
      if (response.success && response.data.valid) {
        dispatch({
          type: 'SET_USER',
          payload: {
            user: response.data.user,
            token,
          },
        });
      } else {
        // Token无效，清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'CLEAR_USER' });
      }
    } catch (error) {
      // Token验证失败，清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  // 登录
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.login({ email, password });

      if (response.success) {
        const { user, token, refreshToken } = response.data;

        // 保存到本地存储
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('refreshToken', refreshToken);

        dispatch({
          type: 'SET_USER',
          payload: { user, token },
        });

        message.success('登录成功！');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      message.error(error.message || '登录失败');
      throw error;
    }
  };

  // 注册
  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.register(userData);

      if (response.success) {
        const { user, token } = response.data;

        // 保存到本地存储
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: 'SET_USER',
          payload: { user, token },
        });

        message.success('注册成功！');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      message.error(error.message || '注册失败');
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // 即使API调用失败也要清除本地状态
    } finally {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');

      dispatch({ type: 'CLEAR_USER' });
      message.success('已退出登录');
    }
  };

  // 更新个人信息
  const updateProfile = async (data: { username?: string; department?: string }) => {
    try {
      const response = await authService.updateProfile(data);

      if (response.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data });

        // 更新本地存储
        localStorage.setItem('user', JSON.stringify(response.data));

        message.success('个人信息更新成功！');
      }
    } catch (error: any) {
      message.error(error.message || '更新失败');
      throw error;
    }
  };

  // 修改密码
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        message.success('密码修改成功！');
      }
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
      throw error;
    }
  };

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  const value: UserContextType = {
    state,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    checkAuth,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Hook：使用用户上下文
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};