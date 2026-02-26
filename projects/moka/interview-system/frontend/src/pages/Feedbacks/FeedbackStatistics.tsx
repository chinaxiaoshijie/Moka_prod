import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Divider,
  Typography,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  HeartOutlined,
  StarOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Statistics {
  total_feedbacks: number;
  strong_hire_count: number;
  hire_count: number;
  no_hire_count: number;
  strong_no_hire_count: number;
  excellent_count: number;
  good_count: number;
  average_count: number;
  poor_count: number;
  avg_overall_score: number;
  avg_confidence_level: number;
}

interface FeedbackStatisticsProps {
  statistics: Statistics;
}

const FeedbackStatistics: React.FC<FeedbackStatisticsProps> = ({ statistics }) => {
  // 计算推荐相关统计
  const totalRecommendations = statistics.strong_hire_count + statistics.hire_count +
                               statistics.no_hire_count + statistics.strong_no_hire_count;
  const positiveRecommendations = statistics.strong_hire_count + statistics.hire_count;
  const negativeRecommendations = statistics.no_hire_count + statistics.strong_no_hire_count;

  const positiveRate = totalRecommendations > 0 ? (positiveRecommendations / totalRecommendations) * 100 : 0;

  // 计算评级相关统计
  const totalRatings = statistics.excellent_count + statistics.good_count +
                       statistics.average_count + statistics.poor_count;
  const highQualityRatings = statistics.excellent_count + statistics.good_count;

  const highQualityRate = totalRatings > 0 ? (highQualityRatings / totalRatings) * 100 : 0;

  // 推荐结果数据
  const recommendationData = [
    {
      label: '强烈推荐',
      count: statistics.strong_hire_count,
      color: '#52c41a',
      icon: '🎯',
    },
    {
      label: '推荐录用',
      count: statistics.hire_count,
      color: '#1890ff',
      icon: '✅',
    },
    {
      label: '不推荐',
      count: statistics.no_hire_count,
      color: '#fa8c16',
      icon: '❌',
    },
    {
      label: '强烈不推荐',
      count: statistics.strong_no_hire_count,
      color: '#ff4d4f',
      icon: '🚫',
    },
  ];

  // 评级数据
  const ratingData = [
    {
      label: '优秀',
      count: statistics.excellent_count,
      color: '#52c41a',
    },
    {
      label: '良好',
      count: statistics.good_count,
      color: '#1890ff',
    },
    {
      label: '一般',
      count: statistics.average_count,
      color: '#fa8c16',
    },
    {
      label: '较差',
      count: statistics.poor_count,
      color: '#ff4d4f',
    },
  ];

  return (
    <div>
      {/* 总览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总反馈数"
              value={statistics.total_feedbacks}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={statistics.avg_overall_score}
              precision={1}
              prefix={<StarOutlined />}
              suffix="/ 10"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="推荐录用率"
              value={positiveRate}
              precision={1}
              suffix="%"
              prefix={positiveRate >= 50 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ color: positiveRate >= 50 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="评估信心度"
              value={statistics.avg_confidence_level}
              precision={1}
              prefix={<ThunderboltOutlined />}
              suffix="/ 5"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 推荐结果分布 */}
      <Card title={<><TeamOutlined /> 推荐结果分布</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {recommendationData.map((item) => {
            const percentage = totalRecommendations > 0 ? (item.count / totalRecommendations) * 100 : 0;
            return (
              <Col xs={12} sm={6} key={item.label}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>
                    {item.icon}
                  </div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {item.label}
                  </Text>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: item.color }}>
                      {item.count}
                    </Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      ({percentage.toFixed(1)}%)
                    </Text>
                  </div>
                  <Progress
                    percent={percentage}
                    showInfo={false}
                    strokeColor={item.color}
                    size="small"
                  />
                </Card>
              </Col>
            );
          })}
        </Row>

        <Divider />

        <Row gutter={16} style={{ textAlign: 'center' }}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="推荐录用"
                value={positiveRecommendations}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix={`/ ${totalRecommendations}`}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="不推荐"
                value={negativeRecommendations}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
                suffix={`/ ${totalRecommendations}`}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 评级分布 */}
      <Card title={<><TrophyOutlined /> 评级分布</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {ratingData.map((item) => {
            const percentage = totalRatings > 0 ? (item.count / totalRatings) * 100 : 0;
            return (
              <Col xs={12} sm={6} key={item.label}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {item.label}
                  </Text>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: item.color }}>
                      {item.count}
                    </Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      ({percentage.toFixed(1)}%)
                    </Text>
                  </div>
                  <Progress
                    percent={percentage}
                    showInfo={false}
                    strokeColor={item.color}
                    size="small"
                  />
                </Card>
              </Col>
            );
          })}
        </Row>

        <Divider />

        <Row gutter={16} style={{ textAlign: 'center' }}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="高质量评级"
                value={highQualityRatings}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix={`/ ${totalRatings}`}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                优秀 + 良好
              </Text>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="高质量率"
                value={highQualityRate}
                precision={1}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ color: highQualityRate >= 70 ? '#52c41a' : '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 质量指标 */}
      <Card title={<><HeartOutlined /> 质量指标</>}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>推荐录用质量</Text>
              <Progress
                percent={positiveRate}
                strokeColor={positiveRate >= 70 ? '#52c41a' : positiveRate >= 40 ? '#fa8c16' : '#ff4d4f'}
                format={percent => `${percent?.toFixed(1)}%`}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {positiveRate >= 70 ? '质量优秀' : positiveRate >= 40 ? '质量良好' : '需要改进'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>评估信心度</Text>
              <Progress
                percent={(statistics.avg_confidence_level / 5) * 100}
                strokeColor={statistics.avg_confidence_level >= 4 ? '#52c41a' : statistics.avg_confidence_level >= 3 ? '#fa8c16' : '#ff4d4f'}
                format={() => `${statistics.avg_confidence_level.toFixed(1)}/5`}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {statistics.avg_confidence_level >= 4 ? '信心充足' : statistics.avg_confidence_level >= 3 ? '信心一般' : '信心不足'}
              </Text>
            </div>
          </Col>
        </Row>

        {/* 质量评价 */}
        <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 6 }}>
          <Title level={5}>质量评价</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            {positiveRate >= 70 && (
              <Tag color="green">
                <CheckCircleOutlined /> 推荐录用率良好，候选人质量较高
              </Tag>
            )}
            {statistics.avg_overall_score >= 7 && (
              <Tag color="blue">
                <StarOutlined /> 平均评分优秀，面试官评价积极
              </Tag>
            )}
            {statistics.avg_confidence_level >= 4 && (
              <Tag color="purple">
                <ThunderboltOutlined /> 评估信心度高，面试官判断准确
              </Tag>
            )}
            {positiveRate < 40 && (
              <Tag color="orange">
                <CloseCircleOutlined /> 推荐录用率较低，需关注候选人质量
              </Tag>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackStatistics;