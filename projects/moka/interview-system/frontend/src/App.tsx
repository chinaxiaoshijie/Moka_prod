import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { UserProvider, useUser } from '@/hooks/useAuth';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CandidateList from './pages/Candidates/CandidateList';
import CandidateDetail from './pages/Candidates/CandidateDetail';
import InterviewList from './pages/Interviews/InterviewList';
import InterviewDetail from './pages/Interviews/InterviewDetail';
import InterviewCalendar from './pages/Interviews/InterviewCalendar';
import PositionList from './pages/Positions/PositionList';
import PositionDetail from './pages/Positions/PositionDetail';
import UserList from './pages/Users/UserList';
import UserDetail from './pages/Users/UserDetail';
import FeedbackList from './pages/Feedbacks/FeedbackList';
import FeedbackDetail from './pages/Feedbacks/FeedbackDetail';
import './App.css';

// 路由保护组件
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useUser();

  if (state.loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      加载中...
    </div>;
  }

  return state.isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// 公开路由组件
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useUser();

  if (state.loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      加载中...
    </div>;
  }

  return state.isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* 候选人管理路由 */}
        <Route path="candidates" element={<CandidateList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />

        {/* 面试管理路由 */}
        <Route path="interviews" element={<InterviewList />} />
        <Route path="interviews/:id" element={<InterviewDetail />} />
        <Route path="interviews/calendar" element={<InterviewCalendar />} />

        {/* 职位管理路由 */}
        <Route path="positions" element={<PositionList />} />
        <Route path="positions/:id" element={<PositionDetail />} />

        {/* 用户管理路由 */}
        <Route path="users" element={<UserList />} />
        <Route path="users/:id" element={<UserDetail />} />

        {/* 反馈管理路由 */}
        <Route path="feedbacks" element={<FeedbackList />} />
        <Route path="feedbacks/:id" element={<FeedbackDetail />} />
      </Route>

      {/* 404 页面 */}
      <Route path="*" element={<div style={{padding: 20, textAlign: 'center'}}>
        <div style={{fontSize: 72, marginBottom: 20}}>🔍</div>
        <h2>页面未找到</h2>
        <p style={{color: '#999'}}>您访问的页面不存在</p>
        <Button type="primary" onClick={() => window.history.back()}>
          返回上一页
        </Button>
      </div>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </ConfigProvider>
  );
};

export default App;
