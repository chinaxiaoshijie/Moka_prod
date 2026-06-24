import React from 'react';
import { Descriptions, Tag, Button, Space, Typography, Card, Row, Col } from 'antd';
import { EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Candidate } from '../../types';

const { Title, Text } = Typography;

interface CandidateDetailProps {
  candidate: Candidate;
  onEdit: () => void;
}

const CandidateDetail: React.FC<CandidateDetailProps> = ({ candidate, onEdit }) => {
  // 状态映射
  const statusMap = {
    new: { text: '新候选人', color: 'blue' },
    screening: { text: '筛选中', color: 'orange' },
    interviewing: { text: '面试中', color: 'purple' },
    offer: { text: '待入职', color: 'cyan' },
    hired: { text: '已入职', color: 'green' },
    rejected: { text: '已拒绝', color: 'red' },
    withdrawn: { text: '已撤回', color: 'gray' },
  };

  // 来源映射
  const sourceMap = {
    boss: 'BOSS直聘',
    lagou: '拉勾网',
    zhilian: '智联招聘',
    internal: '内推',
    referral: '推荐',
    manual: '手动录入',
    other: '其他',
  };

  // 学历映射
  const educationMap = {
    high_school: '高中',
    associate: '大专',
    bachelor: '本科',
    master: '硕士',
    doctor: '博士',
    other: '其他',
  };

  // 性别映射
  const genderMap = {
    male: '男',
    female: '女',
    other: '其他',
  };

  const statusInfo = statusMap[candidate.status as keyof typeof statusMap];

  return (
    <div>
      {/* 头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {candidate.name}
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              {candidate.email && (
                <Text type="secondary">
                  <MailOutlined /> {candidate.email}
                </Text>
              )}
              {candidate.phone && (
                <Text type="secondary">
                  <PhoneOutlined /> {candidate.phone}
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

      {/* 详细信息 */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="性别">
                {candidate.gender ? genderMap[candidate.gender as keyof typeof genderMap] : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="年龄">
                {candidate.age ? `${candidate.age}岁` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="学历">
                {candidate.education ? educationMap[candidate.education as keyof typeof educationMap] : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="毕业院校">
                {candidate.school || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="专业">
                {candidate.major || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="工作年限">
                {candidate.experience_years ? `${candidate.experience_years}年` : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="工作信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前公司">
                {candidate.current_company || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="当前职位">
                {candidate.current_position || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="当前薪资">
                {candidate.current_salary ? `${candidate.current_salary}K/月` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期望薪资">
                {candidate.expected_salary ? `${candidate.expected_salary}K/月` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="简历来源">
                {sourceMap[candidate.source as keyof typeof sourceMap] || candidate.source}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 技能描述 */}
      {candidate.skills && (
        <Card title="技能描述" style={{ marginBottom: 16 }}>
          <Text>{candidate.skills}</Text>
        </Card>
      )}

      {/* 标签 */}
      {candidate.tags && candidate.tags.length > 0 && (
        <Card title="标签" style={{ marginBottom: 16 }}>
          <Space wrap>
            {candidate.tags.map((tag, index) => (
              <Tag key={index} color="blue">{tag}</Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 备注 */}
      {candidate.notes && (
        <Card title="备注">
          <Text>{candidate.notes}</Text>
        </Card>
      )}

      {/* 创建信息 */}
      <Card title="创建信息" style={{ marginTop: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="创建时间">
            {new Date(candidate.created_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(candidate.updated_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default CandidateDetail;