import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, RocketOutlined, SafetyOutlined, ThunderboltOutlined, TeamOutlined, LineChartOutlined } from '@ant-design/icons';
import { useUser } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      await login(values.email, values.password);
      message.success('登录成功！欢迎回来！');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查您的账号和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 装饰性背景元素 */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* 左侧宣传区 */}
      <div className="login-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <RocketOutlined />
          </div>
          <Title level={1} className="hero-title">
            面试管理系统
          </Title>
          <Text className="hero-subtitle">
            专业的招聘流程管理平台
          </Text>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <SafetyOutlined />
              </div>
              <div className="feature-text">
                <strong>安全可靠</strong>
                <p>企业级数据保护</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <ThunderboltOutlined />
              </div>
              <div className="feature-text">
                <strong>高效便捷</strong>
                <p>简化招聘流程</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <TeamOutlined />
              </div>
              <div className="feature-text">
                <strong>团队协作</strong>
                <p>提升面试效率</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <LineChartOutlined />
              </div>
              <div className="feature-text">
                <strong>数据驱动</strong>
                <p>科学决策分析</p>
              </div>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">企业用户</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50万+</div>
              <div className="stat-label">面试记录</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">满意度</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="login-form-section">
        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <div className="login-icon">
              <UserOutlined />
            </div>
            <div>
              <Title level={3} style={{ marginBottom: 4 }}>
                欢迎回来
              </Title>
              <Text type="secondary">请登录您的账号以继续</Text>
            </div>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
            className="login-form"
          >
            <Form.Item
              label="邮箱地址"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址!' },
                { type: 'email', message: '请输入有效的邮箱地址!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱地址"
                autoComplete="email"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" className="forgot-link">
                忘记密码？
              </Link>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="login-button"
                block
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>

            <div className="login-footer">
              <Text type="secondary">
                还没有账号？
              </Text>
              {' '}
              <Link to="/register" className="register-link">
                立即注册
              </Link>
            </div>
          </Form>

          <div className="login-divider">
            <div className="divider-line"></div>
            <Text type="secondary">演示账号</Text>
            <div className="divider-line"></div>
          </div>

          <div className="demo-credentials">
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              默认管理员账号
            </Text>
            <div className="credential-box">
              <Text code style={{ color: '#1890ff' }}>admin@company.com</Text>
            </div>
            <div className="credential-box">
              <Text code style={{ color: '#1890ff' }}>admin123</Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;