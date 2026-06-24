import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  message,
  Tooltip,
  Popconfirm,
  DatePicker,
  Avatar,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  StarFilled,
  CalendarTwoTone
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { interviewService } from '../../services/interview';
import { Interview } from '../../types';
import InterviewForm from './InterviewForm';
import InterviewDetail from './InterviewDetail';
import InterviewCalendar from './InterviewCalendar';
import dayjs from 'dayjs';
import './InterviewList.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const InterviewList: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    interview_type: '',
    interviewer_id: '',
    candidate_id: '',
    position_id: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  // 模态框状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [editMode, setEditMode] = useState(false);

  // 状态映射
  const statusMap = {
    scheduled: { text: '已安排', color: 'blue', icon: '📅' },
    in_progress: { text: '进行中', color: 'orange', icon: '⏳' },
    completed: { text: '已完成', color: 'green', icon: '✅' },
    cancelled: { text: '已取消', color: 'red', icon: '❌' },
    no_show: { text: '缺席', color: 'gray', icon: '🚫' },
  };

  // 面试类型映射
  const typeMap = {
    phone: { text: '电话面试', icon: <PhoneOutlined />, color: '#52c41a' },
    video: { text: '视频面试', icon: <VideoCameraOutlined />, color: '#1890ff' },
    onsite: { text: '现场面试', icon: <EnvironmentOutlined />, color: '#fa8c16' },
  };

  // 加载面试列表
  const loadInterviews = async (params = {}) => {
    try {
      setLoading(true);
      const response = await interviewService.getInterviews({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      });

      if (response.success) {
        setInterviews(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          current: response.pagination.current,
        }));
      }
    } catch (error: any) {
      message.error(error.message || '获取面试列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const response = await interviewService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error: any) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadInterviews();
    loadStatistics();
  }, []);

  // 搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    loadInterviews({ search: value, page: 1 });
  };

  // 筛选
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadInterviews({ ...newFilters, page: 1 });
  };

  // 日期范围筛选
  const handleDateRangeChange = (dates: any) => {
    const newFilters = {
      ...filters,
      date_from: dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '',
      date_to: dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '',
    };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadInterviews({ ...newFilters, page: 1 });
  };

  // 分页变化
  const handleTableChange = (paginationInfo: any) => {
    const newPagination = {
      ...pagination,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    };
    setPagination(newPagination);
    loadInterviews({
      page: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });
  };

  // 新建面试
  const handleCreate = () => {
    setCurrentInterview(null);
    setEditMode(false);
    setFormModalVisible(true);
  };

  // 编辑面试
  const handleEdit = (interview: Interview) => {
    setCurrentInterview(interview);
    setEditMode(true);
    setFormModalVisible(true);
  };

  // 查看详情
  const handleDetail = (interview: Interview) => {
    setCurrentInterview(interview);
    setDetailModalVisible(true);
  };

  // 删除面试
  const handleDelete = async (id: number) => {
    try {
      const response = await interviewService.deleteInterview(id);
      if (response.success) {
        message.success('删除成功');
        loadInterviews();
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 更新面试状态
  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await interviewService.updateStatus(id, { status } as any);
      if (response.success) {
        message.success('状态更新成功');
        loadInterviews();
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormModalVisible(false);
    loadInterviews();
    loadStatistics();
  };

  // 判断是否即将开始（30分钟内）
  const isUpcoming = (scheduledTime: string) => {
    const now = dayjs();
    const interviewTime = dayjs(scheduledTime);
    const diff = interviewTime.diff(now, 'minute');
    return diff >= 0 && diff <= 30;
  };

  // 表格列定义
  const columns: ColumnsType<Interview> = [
    {
      title: '候选人',
      key: 'candidate',
      width: 160,
      fixed: 'left',
      render: (_, record) => (
        <div className="interview-candidate">
          <Avatar size={36} className="candidate-avatar">
            {record.candidate_name?.[0] || '?'}
          </Avatar>
          <div className="candidate-details">
            <div className="candidate-name">{record.candidate_name}</div>
            <div className="position-title">{record.position_title}</div>
          </div>
        </div>
      ),
    },
    {
      title: '面试官',
      dataIndex: 'interviewer_name',
      key: 'interviewer_name',
      width: 100,
      render: (name) => (
        <span className="interviewer-name">{name}</span>
      ),
    },
    {
      title: '面试时间',
      key: 'scheduled_time',
      width: 140,
      render: (_, record) => (
        <div className="interview-time">
          <div className="time-main">
            {dayjs(record.scheduled_time).format('MM-DD HH:mm')}
          </div>
          <div className="time-duration">
            <ClockCircleOutlined /> {record.duration}分钟
          </div>
        </div>
      ),
    },
    {
      title: '轮次',
      dataIndex: 'interview_round',
      key: 'interview_round',
      width: 90,
      render: (round) => (
        <span className="round-badge">第{round}轮</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'interview_type',
      key: 'interview_type',
      width: 110,
      render: (type) => {
        const typeInfo = typeMap[type as keyof typeof typeMap];
        return (
          <Tag
            color={typeInfo.color}
            className="type-tag"
            icon={typeInfo.icon}
          >
            {typeInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status, record) => {
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return (
          <div className="status-wrapper">
            {isUpcoming(record.scheduled_time) && status === 'scheduled' && (
              <Badge status="processing" />
            )}
            <Select
              value={status}
              className="status-select"
              size="small"
              onChange={(value) => handleStatusChange(record.id, value)}
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  <span className="status-option">
                    <span className="status-icon">{value.icon}</span>
                    {value.text}
                  </span>
                </Option>
              ))}
            </Select>
          </div>
        );
      },
    },
    {
      title: '地点',
      key: 'location',
      width: 120,
      ellipsis: { showTitle: false },
      render: (_, record) => (
        <Tooltip title={record.location || record.meeting_link || '-'}>
          <span className="location-text">
            {record.location || (record.meeting_link ? '在线会议' : '-')}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score) => (
        <span className={`score-badge ${score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'}`}>
          {score ? (
            <><StarFilled /> {score}分</>
          ) : '-'}
        </span>
      ),
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (result) => {
        if (!result) return '-';
        const resultMap = {
          pass: { text: '通过', color: 'success', icon: '✓' },
          fail: { text: '未通过', color: 'error', icon: '✗' },
          pending: { text: '待定', color: 'warning', icon: '…' },
        };
        const info = resultMap[result as keyof typeof resultMap];
        return <Tag color={info.color} className="result-tag">{info.icon} {info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              className="action-btn action-btn-view"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              className="action-btn action-btn-edit"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个面试吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                className="action-btn action-btn-delete"
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="interviews-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="page-title">
          <CalendarTwoTone className="page-icon" twoToneColor="#667eea" />
          <h2>面试管理</h2>
        </div>
        <Space size="middle">
          <Button
            size="large"
            icon={<CalendarOutlined />}
            onClick={() => setCalendarModalVisible(true)}
            className="calendar-btn"
          >
            日历视图
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="create-interview-btn"
          >
            新建面试
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={12} sm={12} lg={6}>
          <Card className="stat-card stat-card-blue">
            <div className="stat-content">
              <div className="stat-icon stat-icon-blue">
                <CalendarOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{statistics.total_interviews || 0}</div>
                <div className="stat-label">面试总数</div>
                <div className="stat-trend">
                  <RiseOutlined />
                  <span>本月 +{statistics.this_month_interviews || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="stat-card stat-card-orange">
            <div className="stat-content">
              <div className="stat-icon stat-icon-orange">
                <ClockCircleOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{statistics.today_interviews || 0}</div>
                <div className="stat-label">今日面试</div>
                <div className="stat-trend">
                  <ClockCircleOutlined />
                  <span>待开始 {statistics.pending_today || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="stat-card stat-card-green">
            <div className="stat-content">
              <div className="stat-icon stat-icon-green">
                <CheckCircleOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{statistics.completed_interviews || 0}</div>
                <div className="stat-label">已完成</div>
                <div className="stat-trend">
                  <RiseOutlined />
                  <span>完成率 {statistics.completion_rate || 0}%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <div className="stat-content">
              <div className="stat-icon stat-icon-purple">
                <StarFilled />
              </div>
              <div className="stat-info">
                <div className="stat-value">{(statistics.average_score || 0).toFixed(1)}</div>
                <div className="stat-label">平均评分</div>
                <div className="stat-trend">
                  <RiseOutlined />
                  <span>优秀率 {statistics.excellent_rate || 0}%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主表格卡片 */}
      <Card className="interviews-table-card" bordered={false}>
        {/* 筛选栏 */}
        <div className="filter-bar">
          <div className="filter-section">
            <div className="filter-item filter-search">
              <Search
                placeholder="搜索候选人、面试官..."
                onSearch={handleSearch}
                allowClear
                prefix={<SearchOutlined />}
              />
            </div>
            <div className="filter-item">
              <Select
                placeholder="筛选状态"
                allowClear
                suffixIcon={<FilterOutlined />}
                onChange={(value) => handleFilterChange('status', value || '')}
              >
                {Object.entries(statusMap).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <span className="filter-option">{value.icon} {value.text}</span>
                  </Option>
                ))}
              </Select>
            </div>
            <div className="filter-item">
              <Select
                placeholder="筛选类型"
                allowClear
                suffixIcon={<FilterOutlined />}
                onChange={(value) => handleFilterChange('interview_type', value || '')}
              >
                {Object.entries(typeMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value.icon} {value.text}</Option>
                ))}
              </Select>
            </div>
            <div className="filter-item filter-date">
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                onChange={handleDateRangeChange}
              />
            </div>
          </div>
        </div>

        {/* 表格 */}
        <Table
          className="interviews-table"
          columns={columns}
          dataSource={interviews}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              <span className="pagination-info">
                显示 {range[0]}-{range[1]} 条，共 {total} 条面试
              </span>,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          rowClassName={(record) => {
            if (isUpcoming(record.scheduled_time) && record.status === 'scheduled') {
              return 'upcoming-interview';
            }
            return '';
          }}
        />
      </Card>

      {/* 面试表单模态框 */}
      <Modal
        title={null}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
        className="interview-modal"
        closeIcon={<span className="modal-close-icon">✕</span>}
      >
        <div className="modal-header">
          <div className="modal-title">
            <PlusOutlined />
            <span>{editMode ? '编辑面试' : '新建面试'}</span>
          </div>
        </div>
        <InterviewForm
          interview={currentInterview}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormModalVisible(false)}
        />
      </Modal>

      {/* 面试详情模态框 */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
        className="interview-modal"
        closeIcon={<span className="modal-close-icon">✕</span>}
      >
        <div className="modal-header">
          <div className="modal-title">
            <EyeOutlined />
            <span>面试详情</span>
          </div>
        </div>
        {currentInterview && (
          <InterviewDetail
            interview={currentInterview}
            onEdit={() => {
              setDetailModalVisible(false);
              handleEdit(currentInterview);
            }}
            onFeedback={(feedback) => {
              console.log('Feedback submitted:', feedback);
              setDetailModalVisible(false);
              loadInterviews();
              loadStatistics();
            }}
          />
        )}
      </Modal>

      {/* 日历视图模态框 */}
      <Modal
        title={null}
        open={calendarModalVisible}
        onCancel={() => setCalendarModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
        className="calendar-modal"
        closeIcon={<span className="modal-close-icon">✕</span>}
      >
        <div className="modal-header">
          <div className="modal-title">
            <CalendarOutlined />
            <span>面试日历</span>
          </div>
        </div>
        <InterviewCalendar />
      </Modal>
    </div>
  );
};

export default InterviewList;
