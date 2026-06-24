import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  message,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tooltip,
  Statistic,
  Avatar,
  Typography,
  Drawer,
  Divider,
  Progress,
  Rate,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarChartOutlined,
  FilterOutlined,
  SendOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined
} from '@ant-design/icons';
import { feedbackService } from '../../services/feedback';
import { useUser } from '../../hooks/useAuth';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import FeedbackForm from './FeedbackForm';
import FeedbackDetail from './FeedbackDetail';
import FeedbackStatistics from './FeedbackStatistics';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface Feedback {
  id: number;
  interview_id: number;
  interviewer_id: number;
  interviewer_name: string;
  candidate_id: number;
  candidate_name: string;
  position_id: number;
  position_title: string;
  interview_round: number;
  template_id: number | null;
  technical_score: number | null;
  communication_score: number | null;
  problem_solving_score: number | null;
  cultural_fit_score: number | null;
  leadership_score: number | null;
  creativity_score: number | null;
  strengths: string;
  weaknesses: string;
  technical_assessment: string;
  behavioral_assessment: string;
  improvement_suggestions: string;
  additional_notes: string;
  overall_rating: 'excellent' | 'good' | 'average' | 'poor';
  overall_score: number | null;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  confidence_level: number | null;
  status: 'draft' | 'submitted' | 'reviewed';
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: number | null;
  created_at: string;
  updated_at: string;
}

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

const FeedbackList: React.FC = () => {
  const { user } = useUser();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    overall_rating: '',
    recommendation: '',
    date_range: null as any,
    interviewer_id: user?.isAdmin || user?.isHR ? '' : user?.id,
  });

  // 模态框状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  // 状态映射
  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    submitted: { text: '已提交', color: 'blue' },
    reviewed: { text: '已审阅', color: 'green' },
  };

  const ratingMap = {
    excellent: { text: '优秀', color: 'green' },
    good: { text: '良好', color: 'blue' },
    average: { text: '一般', color: 'orange' },
    poor: { text: '较差', color: 'red' },
  };

  const recommendationMap = {
    strong_hire: { text: '强烈推荐', color: 'green' },
    hire: { text: '推荐录用', color: 'blue' },
    no_hire: { text: '不推荐', color: 'orange' },
    strong_no_hire: { text: '强烈不推荐', color: 'red' },
  };

  // 加载反馈列表
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      };

      if (filters.date_range && filters.date_range.length === 2) {
        params.date_from = filters.date_range[0].format('YYYY-MM-DD');
        params.date_to = filters.date_range[1].format('YYYY-MM-DD');
      }

      delete params.date_range;

      const response = await feedbackService.getFeedbacks(params);
      if (response.success) {
        setFeedbacks(response.data.feedbacks);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      }
    } catch (error: any) {
      message.error('加载反馈列表失败');
      console.error('Load feedbacks error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const params: any = {};
      if (filters.date_range && filters.date_range.length === 2) {
        params.date_from = filters.date_range[0].format('YYYY-MM-DD');
        params.date_to = filters.date_range[1].format('YYYY-MM-DD');
      }

      const response = await feedbackService.getStatistics(params);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error: any) {
      message.error('加载统计数据失败');
      console.error('Load statistics error:', error);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [pagination.current, pagination.pageSize, filters]);

  // 处理表格变化
  const handleTableChange = (pag: any) => {
    setPagination(prev => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }));
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 筛选处理
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      overall_rating: '',
      recommendation: '',
      date_range: null,
      interviewer_id: user?.isAdmin || user?.isHR ? '' : user?.id,
    });
  };

  // 查看详情
  const handleViewDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setDetailDrawerVisible(true);
  };

  // 编辑反馈
  const handleEdit = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setFormModalVisible(true);
  };

  // 删除反馈
  const handleDelete = (feedback: Feedback) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条反馈吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await feedbackService.deleteFeedback(feedback.id);
          if (response.success) {
            message.success('删除成功');
            loadFeedbacks();
          }
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  // 提交反馈
  const handleSubmit = (feedback: Feedback) => {
    Modal.confirm({
      title: '确认提交',
      content: '提交后将无法修改反馈内容，确定要提交吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await feedbackService.submitFeedback(feedback.id);
          if (response.success) {
            message.success('提交成功');
            loadFeedbacks();
          }
        } catch (error: any) {
          message.error(error.message || '提交失败');
        }
      },
    });
  };

  // 显示统计
  const handleShowStatistics = () => {
    loadStatistics();
    setStatisticsModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Feedback> = [
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name',
      width: 120,
      render: (text) => (
        <div>
          <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
          {text}
        </div>
      ),
    },
    {
      title: '职位',
      dataIndex: 'position_title',
      key: 'position_title',
      width: 150,
      ellipsis: true,
    },
    {
      title: '面试官',
      dataIndex: 'interviewer_name',
      key: 'interviewer_name',
      width: 120,
    },
    {
      title: '轮次',
      dataIndex: 'interview_round',
      key: 'interview_round',
      width: 80,
      render: (round) => `第${round}轮`,
    },
    {
      title: '综合评分',
      key: 'overall_score',
      width: 120,
      render: (record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.overall_score ? record.overall_score.toFixed(1) : '-'}
          </div>
          {record.overall_rating && (
            <Tag color={ratingMap[record.overall_rating].color} size="small">
              {ratingMap[record.overall_rating].text}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '推荐结果',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 120,
      render: (recommendation) => {
        if (!recommendation) return '-';
        const info = recommendationMap[recommendation as keyof typeof recommendationMap];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status as keyof typeof statusMap];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record) => {
        const canEdit = user?.isAdmin || record.interviewer_id === user?.id;
        const canDelete = user?.isAdmin;
        const canSubmit = record.status === 'draft' && record.interviewer_id === user?.id;

        return (
          <Space size="small">
            <Tooltip title="查看详情">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            {canEdit && record.status !== 'submitted' && (
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            )}
            {canSubmit && (
              <Tooltip title="提交反馈">
                <Button
                  type="text"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={() => handleSubmit(record)}
                  style={{ color: '#1890ff' }}
                />
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                  danger
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="搜索候选人或职位"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="状态"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="draft">草稿</Option>
              <Option value="submitted">已提交</Option>
              <Option value="reviewed">已审阅</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="评级"
              value={filters.overall_rating}
              onChange={(value) => handleFilterChange('overall_rating', value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="excellent">优秀</Option>
              <Option value="good">良好</Option>
              <Option value="average">一般</Option>
              <Option value="poor">较差</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <RangePicker
              value={filters.date_range}
              onChange={(dates) => handleFilterChange('date_range', dates)}
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={handleResetFilters}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={handleShowStatistics}
              >
                统计
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={feedbacks}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* 反馈表单模态框 */}
      <Modal
        title={selectedFeedback ? '编辑反馈' : '新建反馈'}
        open={formModalVisible}
        onCancel={() => {
          setFormModalVisible(false);
          setSelectedFeedback(null);
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <FeedbackForm
          feedback={selectedFeedback}
          onSuccess={() => {
            setFormModalVisible(false);
            setSelectedFeedback(null);
            loadFeedbacks();
          }}
          onCancel={() => {
            setFormModalVisible(false);
            setSelectedFeedback(null);
          }}
        />
      </Modal>

      {/* 反馈详情抽屉 */}
      <Drawer
        title="反馈详情"
        placement="right"
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedFeedback(null);
        }}
        width={720}
        destroyOnClose
      >
        {selectedFeedback && (
          <FeedbackDetail
            feedback={selectedFeedback}
            onEdit={() => {
              setDetailDrawerVisible(false);
              handleEdit(selectedFeedback);
            }}
          />
        )}
      </Drawer>

      {/* 统计模态框 */}
      <Modal
        title="反馈统计"
        open={statisticsModalVisible}
        onCancel={() => setStatisticsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {statistics && <FeedbackStatistics statistics={statistics} />}
      </Modal>
    </div>
  );
};

export default FeedbackList;