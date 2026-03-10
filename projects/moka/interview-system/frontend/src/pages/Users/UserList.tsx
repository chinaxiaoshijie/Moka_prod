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
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  KeyOutlined,
  StopOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userService } from '../../services/user';
import { User } from '../../types';
import UserForm from './UserForm';
import UserDetail from './UserDetail';
import PasswordResetModal from './PasswordResetModal';
import { useUser } from '../../hooks/useAuth';

const { Search } = Input;
const { Option } = Select;

const UserList: React.FC = () => {
  const { state: authState } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    status: '',
    search: '',
  });

  // 模态框状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [passwordResetVisible, setPasswordResetVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);

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

  // 检查权限
  const isAdmin = authState.user?.role === 'admin';
  const isAdminOrHR = isAdmin || authState.user?.role === 'hr';

  // 加载用户列表
  const loadUsers = async (params = {}) => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      });

      if (response.success) {
        setUsers(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          current: response.pagination.current,
        }));
      }
    } catch (error: any) {
      message.error(error.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const response = await userService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error: any) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 加载部门列表
  const loadDepartments = async () => {
    try {
      const response = await userService.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error: any) {
      console.error('获取部门列表失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    if (isAdminOrHR) {
      loadUsers();
      loadStatistics();
      loadDepartments();
    }
  }, [isAdminOrHR]);

  // 搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    loadUsers({ search: value, page: 1 });
  };

  // 筛选
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadUsers({ ...newFilters, page: 1 });
  };

  // 分页变化
  const handleTableChange = (paginationInfo: any) => {
    const newPagination = {
      ...pagination,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    };
    setPagination(newPagination);
    loadUsers({
      page: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });
  };

  // 新建用户
  const handleCreate = () => {
    setCurrentUser(null);
    setEditMode(false);
    setFormModalVisible(true);
  };

  // 编辑用户
  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setEditMode(true);
    setFormModalVisible(true);
  };

  // 查看详情
  const handleDetail = (user: User) => {
    setCurrentUser(user);
    setDetailModalVisible(true);
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      const response = await userService.deleteUser(id);
      if (response.success) {
        message.success('删除成功');
        loadUsers();
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 激活/禁用用户
  const handleStatusToggle = async (user: User, newStatus: 'active' | 'inactive') => {
    try {
      const response = newStatus === 'active'
        ? await userService.activateUser(user.id)
        : await userService.deactivateUser(user.id);

      if (response.success) {
        message.success(newStatus === 'active' ? '激活成功' : '禁用成功');
        loadUsers();
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 重置密码
  const handleResetPassword = (user: User) => {
    setCurrentUser(user);
    setPasswordResetVisible(true);
  };

  // 表单提交成功
  const handleFormSuccess = () => {
    setFormModalVisible(false);
    loadUsers();
    loadStatistics();
  };

  // 密码重置成功
  const handlePasswordResetSuccess = () => {
    setPasswordResetVisible(false);
    message.success('密码重置成功');
  };

  // 权限检查组件
  if (!isAdminOrHR) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
        <h3>权限不足</h3>
        <p>只有管理员和HR可以访问用户管理功能</p>
      </div>
    );
  }

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'user_info',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: record.status === 'active' ? '#87d068' : '#ccc' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.username}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => {
        const roleInfo = roleMap[role as keyof typeof roleMap];
        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      },
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      ellipsis: true,
      render: (department) => department || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone) => phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return <Badge color={statusInfo.color} text={statusInfo.text} />;
      },
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 120,
      render: (lastLogin) => {
        if (!lastLogin) return '-';
        const date = new Date(lastLogin);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600);

        if (diffInHours < 24) {
          return <Tag color="green">最近</Tag>;
        } else if (diffInHours < 168) {
          return <Tag color="orange">本周</Tag>;
        } else {
          return date.toLocaleDateString('zh-CN');
        }
      },
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
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const isSelf = record.id === authState.user?.id;

        return (
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
                disabled={!isAdmin && !isSelf}
              />
            </Tooltip>
            {isAdmin && (
              <Tooltip title="重置密码">
                <Button
                  type="text"
                  size="small"
                  icon={<KeyOutlined />}
                  onClick={() => handleResetPassword(record)}
                  disabled={isSelf}
                />
              </Tooltip>
            )}
            {isAdmin && (
              <Tooltip title={record.status === 'active' ? '禁用' : '激活'}>
                <Button
                  type="text"
                  size="small"
                  icon={record.status === 'active' ? <StopOutlined /> : <PlayCircleOutlined />}
                  onClick={() => handleStatusToggle(record, record.status === 'active' ? 'inactive' : 'active')}
                  disabled={isSelf}
                />
              </Tooltip>
            )}
            {isAdmin && (
              <Popconfirm
                title="确定要删除这个用户吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
                disabled={isSelf}
              >
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    disabled={isSelf}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={statistics.total_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={statistics.active_users || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="面试官数量"
              value={statistics.interviewer_count || 0}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="30天内活跃"
              value={statistics.active_last_30_days || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
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
                placeholder="搜索用户名、邮箱..."
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Select
                placeholder="角色"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('role', value || '')}
              >
                {Object.entries(roleMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value.text}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={4}>
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
            <Col xs={12} sm={4}>
              <Select
                placeholder="部门"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('department', value || '')}
              >
                {departments.map(dept => (
                  <Option key={dept.department} value={dept.department}>
                    {dept.department} ({dept.count})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6}>
              {isAdmin && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  新建用户
                </Button>
              )}
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={users}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 用户表单模态框 */}
      <Modal
        title={editMode ? '编辑用户' : '新建用户'}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <UserForm
          user={currentUser}
          departments={departments}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormModalVisible(false)}
        />
      </Modal>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        {currentUser && (
          <UserDetail
            user={currentUser}
            onEdit={() => {
              setDetailModalVisible(false);
              handleEdit(currentUser);
            }}
          />
        )}
      </Modal>

      {/* 密码重置模态框 */}
      {isAdmin && (
        <PasswordResetModal
          visible={passwordResetVisible}
          user={currentUser}
          onSuccess={handlePasswordResetSuccess}
          onCancel={() => setPasswordResetVisible(false)}
        />
      )}
    </div>
  );
};

export default UserList;