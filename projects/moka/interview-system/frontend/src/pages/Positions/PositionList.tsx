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
  Progress,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  BankOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { positionService } from '../../services/position';
import { Position } from '../../types';
import PositionForm from './PositionForm';
import PositionDetail from './PositionDetail';
import DepartmentStatistics from './DepartmentStatistics';

const { Search } = Input;
const { Option } = Select;

const PositionList: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    level: '',
    type: '',
    priority: '',
    location: '',
    search: '',
    expired_only: false,
    active_only: false,
  });

  // 模态框状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [departmentStatsVisible, setDepartmentStatsVisible] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [editMode, setEditMode] = useState(false);

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

  // 加载职位列表
  const loadPositions = async (params = {}) => {
    try {
      setLoading(true);
      const response = await positionService.getPositions({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      });

      if (response.success) {
        setPositions(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          current: response.pagination.current,
        }));
      }
    } catch (error: any) {
      message.error(error.message || '获取职位列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const response = await positionService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error: any) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadPositions();
    loadStatistics();
  }, []);

  // 搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    loadPositions({ search: value, page: 1 });
  };

  // 筛选
  const handleFilterChange = (key: string, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadPositions({ ...newFilters, page: 1 });
  };

  // 分页变化
  const handleTableChange = (paginationInfo: any) => {
    const newPagination = {
      ...pagination,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    };
    setPagination(newPagination);
    loadPositions({
      page: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });
  };

  // 新建职位
  const handleCreate = () => {
    setCurrentPosition(null);
    setEditMode(false);
    setFormModalVisible(true);
  };

  // 编辑职位
  const handleEdit = (position: Position) => {
    setCurrentPosition(position);
    setEditMode(true);
    setFormModalVisible(true);
  };

  // 查看详情
  const handleDetail = (position: Position) => {
    setCurrentPosition(position);
    setDetailModalVisible(true);
  };

  // 删除职位
  const handleDelete = async (id: number) => {
    try {
      const response = await positionService.deletePosition(id);
      if (response.success) {
        message.success('删除成功');
        loadPositions();
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 更新职位状态
  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await positionService.updateStatus(id, { status } as any);
      if (response.success) {
        message.success('状态更新成功');
        loadPositions();
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  // 更新招聘进度
  const handleUpdateProgress = async (id: number) => {
    try {
      const response = await positionService.updateProgress(id);
      if (response.success) {
        message.success('进度更新成功');
        loadPositions();
      }
    } catch (error: any) {
      message.error(error.message || '进度更新失败');
    }
  };

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormModalVisible(false);
    loadPositions();
    loadStatistics();
  };

  // 表格列定义
  const columns: ColumnsType<Position> = [
    {
      title: '职位信息',
      key: 'position_info',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{record.title}</div>
          <Space size="small">
            <Tag color="blue">{record.department}</Tag>
            <Tag>{levelMap[record.level as keyof typeof levelMap]}</Tag>
          </Space>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => typeMap[type as keyof typeof typeMap] || type,
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: (location) => (
        <Tooltip title={location || '不限'}>
          {location || '不限'}
        </Tooltip>
      ),
    },
    {
      title: '薪资范围',
      key: 'salary',
      width: 120,
      render: (_, record) => {
        if (!record.salary_min && !record.salary_max) return '-';
        if (record.salary_min && record.salary_max) {
          return `${record.salary_min}K-${record.salary_max}K`;
        }
        return record.salary_min ? `${record.salary_min}K+` : `${record.salary_max}K以下`;
      },
    },
    {
      title: '招聘进度',
      key: 'progress',
      width: 120,
      render: (_, record) => (
        <div>
          <Progress
            percent={record.completion_rate || 0}
            size="small"
            status={record.completion_rate === 100 ? 'success' : 'active'}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {record.headcount_filled || 0}/{record.headcount}人
          </div>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => {
        const info = priorityMap[priority as keyof typeof priorityMap];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return (
          <Select
            value={status}
            style={{ width: '100%' }}
            size="small"
            onChange={(value) => handleStatusChange(record.id, value)}
          >
            {Object.entries(statusMap).map(([key, value]) => (
              <Option key={key} value={key}>
                <Tag color={value.color}>{value.text}</Tag>
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: '面试数',
      dataIndex: 'interview_count',
      key: 'interview_count',
      width: 80,
      render: (count) => (
        <Badge count={count || 0} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="更新进度">
            <Button
              type="text"
              size="small"
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleUpdateProgress(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个职位吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="职位总数"
              value={statistics.total_positions || 0}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="招聘中"
              value={statistics.active_positions || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="紧急职位"
              value={statistics.urgent_positions || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均薪资"
              value={statistics.avg_salary || 0}
              precision={0}
              suffix="K"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主表格卡片 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={6}>
              <Search
                placeholder="搜索职位标题、部门..."
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={3}>
              <Select
                placeholder="状态"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('status', value || '')}
              >
                {Object.entries(statusMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value.text}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={3}>
              <Select
                placeholder="级别"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('level', value || '')}
              >
                {Object.entries(levelMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={3}>
              <Select
                placeholder="类型"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('type', value || '')}
              >
                {Object.entries(typeMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={3}>
              <Select
                placeholder="优先级"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('priority', value || '')}
              >
                {Object.entries(priorityMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value.text}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  新建职位
                </Button>
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => setDepartmentStatsVisible(true)}
                >
                  部门统计
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type={filters.active_only ? 'primary' : 'default'}
              size="small"
              onClick={() => handleFilterChange('active_only', !filters.active_only)}
            >
              仅显示招聘中
            </Button>
            <Button
              type={filters.expired_only ? 'primary' : 'default'}
              size="small"
              onClick={() => handleFilterChange('expired_only', !filters.expired_only)}
            >
              仅显示过期
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={positions}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 职位表单模态框 */}
      <Modal
        title={editMode ? '编辑职位' : '新建职位'}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <PositionForm
          position={currentPosition}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormModalVisible(false)}
        />
      </Modal>

      {/* 职位详情模态框 */}
      <Modal
        title="职位详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {currentPosition && (
          <PositionDetail
            position={currentPosition}
            onEdit={() => {
              setDetailModalVisible(false);
              handleEdit(currentPosition);
            }}
          />
        )}
      </Modal>

      {/* 部门统计模态框 */}
      <Modal
        title="部门统计"
        open={departmentStatsVisible}
        onCancel={() => setDepartmentStatsVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <DepartmentStatistics />
      </Modal>
    </div>
  );
};

export default PositionList;