import React from 'react';
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Avatar,
  Timeline,
  Badge
} from 'antd';
import {
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { User } from '../../types';
import { useUser } from '../../hooks/useAuth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface UserDetailProps {
  user: User;
  onEdit: () => void;
}

const UserDetail: React.FC<UserDetailProps> = ({
  user,
  onEdit
}) => {
  const { state: authState } = useUser();

  // 角色映射
  const roleMap = {
    admin: { text: '管理员', color: 'red' },
    hr: { text: 'HR', color: 'orange' },
    interviewer: { text: '面试官', color: 'blue' },
  };

  // 状态映射
  const statusMap = {
    active: { text: '活跃', color: 'green' },
    inactive: { text: '禁用', color: 'gray' },
    deleted: { text: '已删除', color: 'red' },
  };

  const roleInfo = roleMap[user.role as keyof typeof roleMap];
  const statusInfo = statusMap[user.status as keyof typeof statusMap];

  const isAdmin = authState.user?.role === 'admin';
  const isSelf = user.id === authState.user?.id;
  const canEdit = isAdmin || isSelf;

  // 计算账户年龄
  const getAccountAge = () => {
    const created = dayjs(user.created_at);
    const now = dayjs();
    const diffInDays = now.diff(created, 'day');

    if (diffInDays < 30) {
      return `${diffInDays} 天`;
    } else if (diffInDays < 365) {
      return `${Math.floor(diffInDays / 30)} 个月`;
    } else {
      return `${Math.floor(diffInDays / 365)} 年`;
    }
  };

  // 计算最后登录状态
  const getLastLoginStatus = () => {
    if (!user.last_login) return { text: '从未登录', color: 'default' };

    const lastLogin = dayjs(user.last_login);
    const now = dayjs();
    const diffInHours = now.diff(lastLogin, 'hour');

    if (diffInHours < 1) {
      return { text: '在线', color: 'green' };
    } else if (diffInHours < 24) {
      return { text: '今天活跃', color: 'blue' };
    } else if (diffInHours < 168) {
      return { text: '本周活跃', color: 'orange' };
    } else {
      return { text: '长时间未登录', color: 'red' };
    }
  };

  const lastLoginStatus = getLastLoginStatus();

  return (
    <div>
      {/* 头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Avatar
                size={80}
                src={user.avatar}
                icon={<UserOutlined />}
                style={{ backgroundColor: statusInfo.color === 'green' ? '#87d068' : '#ccc' }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {user.username}
                </Title>
                <Space style={{ marginTop: 8 }}>
                  <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
                  <Badge color={statusInfo.color} text={statusInfo.text} />
                  <Tag color={lastLoginStatus.color}>{lastLoginStatus.text}</Tag>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <Text type="secondary">
                      <MailOutlined /> {user.email}
                    </Text>
                    {user.department && (
                      <Text type="secondary">
                        <TeamOutlined /> {user.department}
                      </Text>
                    )}
                  </Space>
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            {canEdit && (
              <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
                编辑
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* 基本信息 */}
        <Col xs={24} lg={12}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="用户名">
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱地址">
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="用户角色">
                <Space>
                  <SafetyCertificateOutlined />
                  <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="所属部门">
                {user.department || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {user.phone ? (
                  <Space>
                    <PhoneOutlined />
                    {user.phone}
                  </Space>
                ) : '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="账户状态">
                <Badge color={statusInfo.color} text={statusInfo.text} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 活动信息 */}
        <Col xs={24} lg={12}>
          <Card title="活动信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="账户年龄">
                <Space>
                  <CalendarOutlined />
                  {getAccountAge()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {user.last_login ? (
                  <div>
                    <div>{dayjs(user.last_login).format('YYYY-MM-DD HH:mm:ss')}</div>
                    <Tag color={lastLoginStatus.color} style={{ marginTop: 4 }}>
                      {lastLoginStatus.text}
                    </Tag>
                  </div>
                ) : (
                  <Text type="secondary">从未登录</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(user.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 权限信息 */}
      <Card title="权限信息" style={{ marginBottom: 16 }}>
        <div>
          <Text strong>角色权限：</Text>
          <div style={{ marginTop: 8 }}>
            {user.role === 'admin' && (
              <div>
                <Tag color="red">系统管理员</Tag>
                <Text type="secondary">拥有系统所有权限，包括用户管理、系统配置等</Text>
              </div>
            )}
            {user.role === 'hr' && (
              <div>
                <Tag color="orange">HR专员</Tag>
                <Text type="secondary">拥有候选人管理、面试安排、职位发布等权限</Text>
              </div>
            )}
            {user.role === 'interviewer' && (
              <div>
                <Tag color="blue">面试官</Tag>
                <Text type="secondary">拥有面试记录、反馈提交、候选人查看等权限</Text>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 时间线 */}
      <Card title="账户时间线">
        <Timeline>
          <Timeline.Item color="green">
            <Text strong>账户创建：</Text>
            {dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Timeline.Item>

          {user.last_login && (
            <Timeline.Item color="blue">
              <Text strong>最后登录：</Text>
              {dayjs(user.last_login).format('YYYY-MM-DD HH:mm:ss')}
            </Timeline.Item>
          )}

          {user.updated_at !== user.created_at && (
            <Timeline.Item>
              <Text strong>信息更新：</Text>
              {dayjs(user.updated_at).format('YYYY-MM-DD HH:mm:ss')}
            </Timeline.Item>
          )}

          {user.status === 'inactive' && (
            <Timeline.Item color="orange">
              <Text strong>账户已禁用</Text>
            </Timeline.Item>
          )}

          {user.status === 'deleted' && (
            <Timeline.Item color="red">
              <Text strong>账户已删除</Text>
            </Timeline.Item>
          )}
        </Timeline>
      </Card>
    </div>
  );
};

export default UserDetail;