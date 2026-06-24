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
  Progress,
  Divider,
  Timeline
} from 'antd';
import {
  EditOutlined,
  BankOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Position } from '../../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface PositionDetailProps {
  position: Position;
  onEdit: () => void;
}

const PositionDetail: React.FC<PositionDetailProps> = ({
  position,
  onEdit
}) => {
  // 状态映射
  const statusMap = {
    active: { text: '招聘中', color: 'green' },
    paused: { text: '暂停', color: 'orange' },
    closed: { text: '已关闭', color: 'red' },
    draft: { text: '草稿', color: 'gray' },
  };

  // 级别映射
  const levelMap = {
    junior: '初级',
    middle: '中级',
    senior: '高级',
    expert: '专家',
    manager: '管理',
  };

  // 类型映射
  const typeMap = {
    fulltime: '全职',
    parttime: '兼职',
    intern: '实习',
    contract: '合同',
  };

  // 优先级映射
  const priorityMap = {
    low: { text: '低', color: 'default' },
    medium: { text: '中', color: 'blue' },
    high: { text: '高', color: 'orange' },
    urgent: { text: '紧急', color: 'red' },
  };

  const statusInfo = statusMap[position.status as keyof typeof statusMap];
  const levelText = levelMap[position.level as keyof typeof levelMap];
  const typeText = typeMap[position.type as keyof typeof typeMap];
  const priorityInfo = priorityMap[position.priority as keyof typeof priorityMap];

  // 获取薪资范围显示
  const getSalaryRange = () => {
    if (!position.salary_min && !position.salary_max) return '面议';
    if (position.salary_min && position.salary_max) {
      return `${position.salary_min}K-${position.salary_max}K/月`;
    }
    return position.salary_min ? `${position.salary_min}K+/月` : `${position.salary_max}K以下/月`;
  };

  // 获取进度状态
  const getProgressStatus = () => {
    const rate = position.completion_rate || 0;
    if (rate === 100) return 'success';
    if (rate > 80) return 'active';
    if (rate > 50) return 'normal';
    return 'exception';
  };

  return (
    <div>
      {/* 头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {position.title}
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              <Text type="secondary">
                <BankOutlined /> {position.department}
              </Text>
              <Text type="secondary">
                <UserOutlined /> {levelText} · {typeText}
              </Text>
              {position.location && (
                <Text type="secondary">
                  <EnvironmentOutlined /> {position.location}
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              编辑
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* 基本信息 */}
        <Col xs={24} lg={12}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="职位标题">
                {position.title}
              </Descriptions.Item>
              <Descriptions.Item label="所属部门">
                {position.department}
              </Descriptions.Item>
              <Descriptions.Item label="职位级别">
                {levelText}
              </Descriptions.Item>
              <Descriptions.Item label="职位类型">
                {typeText}
              </Descriptions.Item>
              <Descriptions.Item label="工作地点">
                {position.location || '不限'}
              </Descriptions.Item>
              <Descriptions.Item label="薪资范围">
                {getSalaryRange()}
              </Descriptions.Item>
              <Descriptions.Item label="招聘人数">
                {position.headcount}人
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {position.created_by_name || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 状态信息 */}
        <Col xs={24} lg={12}>
          <Card title="状态信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前状态">
                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityInfo.color}>{priorityInfo.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="招聘进度">
                <div>
                  <Progress
                    percent={position.completion_rate || 0}
                    status={getProgressStatus()}
                    size="small"
                  />
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    已入职 {position.headcount_filled || 0} 人，剩余 {(position.headcount || 0) - (position.headcount_filled || 0)} 人
                  </Text>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="面试数量">
                {position.interview_count || 0} 次
              </Descriptions.Item>
              <Descriptions.Item label="成功入职">
                {position.hired_count || 0} 人
              </Descriptions.Item>
              <Descriptions.Item label="过期时间">
                {position.expire_date ? (
                  <Space>
                    {dayjs(position.expire_date).format('YYYY-MM-DD')}
                    {dayjs(position.expire_date).isBefore(dayjs()) && (
                      <Tag color="red" icon={<ExclamationCircleOutlined />}>
                        已过期
                      </Tag>
                    )}
                  </Space>
                ) : '无限期'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 职位描述 */}
      {position.description && (
        <Card title="职位描述" style={{ marginBottom: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {position.description}
          </Paragraph>
        </Card>
      )}

      {/* 任职要求 */}
      {position.requirements && (
        <Card title="任职要求" style={{ marginBottom: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {position.requirements}
          </Paragraph>
        </Card>
      )}

      {/* 技能要求 */}
      {position.skills_required && (
        <Card title="技能要求" style={{ marginBottom: 16 }}>
          <Space wrap>
            {position.skills_required.split(',').map((skill, index) => (
              <Tag key={index} color="blue">
                {skill.trim()}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 福利待遇 */}
      {position.benefits && (
        <Card title="福利待遇" style={{ marginBottom: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {position.benefits}
          </Paragraph>
        </Card>
      )}

      {/* 时间信息 */}
      <Card title="时间信息">
        <Timeline>
          <Timeline.Item>
            <Text strong>创建时间：</Text>
            {dayjs(position.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Timeline.Item>
          <Timeline.Item>
            <Text strong>更新时间：</Text>
            {dayjs(position.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Timeline.Item>
          {position.expire_date && (
            <Timeline.Item
              color={dayjs(position.expire_date).isBefore(dayjs()) ? 'red' : 'blue'}
            >
              <Text strong>过期时间：</Text>
              {dayjs(position.expire_date).format('YYYY-MM-DD')}
              {dayjs(position.expire_date).isBefore(dayjs()) && (
                <Tag color="red" style={{ marginLeft: 8 }}>已过期</Tag>
              )}
            </Timeline.Item>
          )}
          {position.completion_rate === 100 && (
            <Timeline.Item color="green">
              <Text strong>招聘完成</Text>
            </Timeline.Item>
          )}
        </Timeline>
      </Card>
    </div>
  );
};

export default PositionDetail;