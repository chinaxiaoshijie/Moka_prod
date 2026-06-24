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
  Avatar,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  MailOutlined,
  PhoneOutlined,
  RiseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { candidateService } from '../../services/candidate';
import { Candidate } from '../../types';
import CandidateForm from './CandidateForm';
import CandidateDetail from './CandidateDetail';
import './CandidateList.css';

const { Search } = Input;
const { Option } = Select;

const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    education: '',
    search: '',
  });

  // 模态框状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [editMode, setEditMode] = useState(false);

  // 状态映射
  const statusMap = {
    new: { text: '新候选人', color: 'blue', icon: '🆕' },
    screening: { text: '筛选中', color: 'orange', icon: '🔍' },
    interviewing: { text: '面试中', color: 'purple', icon: '💼' },
    offer: { text: '待入职', color: 'cyan', icon: '📋' },
    hired: { text: '已入职', color: 'green', icon: '✅' },
    rejected: { text: '已拒绝', color: 'red', icon: '❌' },
    withdrawn: { text: '已撤回', color: 'gray', icon: '🔙' },
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

  // 加载候选人列表
  const loadCandidates = async (params = {}) => {
    try {
      setLoading(true);
      const response = await candidateService.getCandidates({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      });

      if (response.success) {
        setCandidates(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          current: response.pagination.current,
        }));
      }
    } catch (error: any) {
      message.error(error.message || '获取候选人列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const response = await candidateService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error: any) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadCandidates();
    loadStatistics();
  }, []);

  // 搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    loadCandidates({ search: value, page: 1 });
  };

  // 筛选
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadCandidates({ ...newFilters, page: 1 });
  };

  // 分页变化
  const handleTableChange = (paginationInfo: any) => {
    const newPagination = {
      ...pagination,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    };
    setPagination(newPagination);
    loadCandidates({
      page: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });
  };

  // 新建候选人
  const handleCreate = () => {
    setCurrentCandidate(null);
    setEditMode(false);
    setFormModalVisible(true);
  };

  // 编辑候选人
  const handleEdit = (candidate: Candidate) => {
    setCurrentCandidate(candidate);
    setEditMode(true);
    setFormModalVisible(true);
  };

  // 查看详情
  const handleDetail = (candidate: Candidate) => {
    setCurrentCandidate(candidate);
    setDetailModalVisible(true);
  };

  // 删除候选人
  const handleDelete = async (id: number) => {
    try {
      const response = await candidateService.deleteCandidate(id);
      if (response.success) {
        message.success('删除成功');
        loadCandidates();
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormModalVisible(false);
    loadCandidates();
    loadStatistics();
  };

  // 表格列定义
  const columns: ColumnsType<Candidate> = [
    {
      title: '候选人',
      key: 'candidate',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <div className="candidate-cell">
          <Avatar size={40} className="candidate-avatar">
            {record.name?.[0] || '?'}
          </Avatar>
          <div className="candidate-info">
            <div className="candidate-name">{record.name}</div>
            <div className="candidate-contact">
              {record.email && (
                <div className="contact-item">
                  <MailOutlined /> {record.email}
                </div>
              )}
              {record.phone && (
                <div className="contact-item">
                  <PhoneOutlined /> {record.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return (
          <Tag color={statusInfo.color} className="status-tag">
            <span className="status-icon">{statusInfo.icon}</span>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source) => (
        <Tag color="geekblue">{sourceMap[source as keyof typeof sourceMap] || source}</Tag>
      ),
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      render: (education) => (
        <span className="education-badge">
          {education ? educationMap[education as keyof typeof educationMap] : '-'}
        </span>
      ),
    },
    {
      title: '工作年限',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 110,
      render: (years) => (
        <span className="experience-badge">
          {years ? `${years}年` : '-'}
        </span>
      ),
    },
    {
      title: '当前公司',
      dataIndex: 'current_company',
      key: 'current_company',
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (company) => (
        <Tooltip title={company}>
          <span className="company-text">{company || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (date) => (
        <span className="date-text">
          {new Date(date).toLocaleDateString('zh-CN')}
        </span>
      ),
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
            title="确定要删除这个候选人吗？"
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
    <div className="candidates-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="page-title">
          <TeamOutlined className="page-icon" />
          <h2>候选人管理</h2>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          className="create-candidate-btn"
        >
          新建候选人
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={12} sm={12} lg={6}>
          <Card className="stat-card stat-card-blue">
            <div className="stat-content">
              <div className="stat-icon stat-icon-blue">
                <TeamOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{statistics.total_candidates || 0}</div>
                <div className="stat-label">候选人总数</div>
                <div className="stat-trend">
                  <RiseOutlined />
                  <span>较上月 +8%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="stat-card stat-card-green">
            <div className="stat-content">
              <div className="stat-icon stat-icon-green">
                <UserAddOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{statistics.new_this_week || 0}</div>
                <div className="stat-label">本周新增</div>
                <div className="stat-trend">
                  <RiseOutlined />
                  <span>较上周 +15%</span>
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
                <div className="stat-value">{statistics.interviewing_candidates || 0}</div>
                <div className="stat-label">面试中</div>
                <div className="stat-trend">
                  <ClockCircleOutlined />
                  <span>待面试 {statistics.pending_interviews || 0}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <div className="stat-content">
              <div className="stat-icon stat-icon-purple">
                <CheckCircleOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{statistics.hired_candidates || 0}</div>
                <div className="stat-label">已入职</div>
                <div className="stat-trend">
                  <RiseOutlined />
                  <span>入职率 85%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主表格卡片 */}
      <Card className="candidates-table-card" bordered={false}>
        {/* 筛选栏 */}
        <div className="filter-bar">
          <div className="filter-section">
            <div className="filter-item filter-search">
              <Search
                placeholder="搜索候选人姓名、邮箱、电话..."
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
                placeholder="筛选来源"
                allowClear
                suffixIcon={<FilterOutlined />}
                onChange={(value) => handleFilterChange('source', value || '')}
              >
                {Object.entries(sourceMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <Table
          className="candidates-table"
          columns={columns}
          dataSource={candidates}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              <span className="pagination-info">
                显示 {range[0]}-{range[1]} 条，共 {total} 条候选人
              </span>,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 候选人表单模态框 */}
      <Modal
        title={null}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
        className="candidate-modal"
        closeIcon={<span className="modal-close-icon">✕</span>}
      >
        <div className="modal-header">
          <div className="modal-title">
            <UserAddOutlined />
            <span>{editMode ? '编辑候选人' : '新建候选人'}</span>
          </div>
        </div>
        <CandidateForm
          candidate={currentCandidate}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormModalVisible(false)}
        />
      </Modal>

      {/* 候选人详情模态框 */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
        className="candidate-modal"
        closeIcon={<span className="modal-close-icon">✕</span>}
      >
        <div className="modal-header">
          <div className="modal-title">
            <TeamOutlined />
            <span>候选人详情</span>
          </div>
        </div>
        {currentCandidate && (
          <CandidateDetail
            candidate={currentCandidate}
            onEdit={() => {
              setDetailModalVisible(false);
              handleEdit(currentCandidate);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default CandidateList;
