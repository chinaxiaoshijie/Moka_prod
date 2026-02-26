import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { UserProvider, useUser } from '@/hooks/useAuth';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CandidateList from './pages/Candidates/CandidateList';
import InterviewList from './pages/Interviews/InterviewList';
import PositionList from './pages/Positions/PositionList';
import UserList from './pages/Users/UserList';
import FeedbackList from './pages/Feedbacks/FeedbackList';
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
        <Route path="candidates" element={<CandidateList />} />
        <Route path="interviews" element={<InterviewList />} />
        <Route path="positions" element={<PositionList />} />
        <Route path="users" element={<UserList />} />
        <Route path="feedbacks" element={<FeedbackList />} />
      </Route>
      <Route path="*" element={<div style={{padding: 20}}>页面未找到</div>} />
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
