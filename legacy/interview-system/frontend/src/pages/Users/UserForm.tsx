import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  message,
  Card,
} from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { userService } from '../../services/user';
import { User } from '../../types';
import { useUser } from '../../hooks/useAuth';

const { Option } = Select;

interface UserFormProps {
  user?: User | null;
  departments: Array<{ department: string; count: number }>;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  departments,
  onSuccess,
  onCancel,
}) => {
  const { state: authState } = useUser();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = !!user;
  const isAdmin = authState.user?.role === 'admin';
  const isSelf = user?.id === authState.user?.id;

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        status: user.status,
      });
    }
  }, [user, form]);

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      let response;
      if (isEdit) {
        response = await userService.updateUser(user!.id, values);
      } else {
        response = await userService.createUser(values);
      }

      if (response.success) {
        message.success(isEdit ? '更新成功' : '创建成功');
        onSuccess();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证邮箱格式
  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入邮箱'));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('请输入有效的邮箱地址'));
    }
    return Promise.resolve();
  };

  // 验证密码强度
  const validatePassword = (_: any, value: string) => {
    if (!value && !isEdit) {
      return Promise.reject(new Error('请输入密码'));
    }
    if (value && value.length < 8) {
      return Promise.reject(new Error('密码至少8个字符'));
    }
    if (value && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(value)) {
      return Promise.reject(new Error('密码必须包含至少一个字母和一个数字'));
    }
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        role: 'interviewer',
        status: 'active',
      }}
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 30, message: '用户名最多30个字符' },
                { pattern: /^[A-Za-z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[{ validator: validateEmail }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱地址"
                disabled={!isAdmin && isEdit && !isSelf}
              />
            </Form.Item>
          </Col>
        </Row>

        {!isEdit && (
          <Form.Item
            name="password"
            label="密码"
            rules={[{ validator: validatePassword }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码（至少8个字符，包含字母和数字）"
            />
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select
                placeholder="请选择角色"
                disabled={!isAdmin}
              >
                <Option value="admin">管理员</Option>
                <Option value="hr">HR</Option>
                <Option value="interviewer">面试官</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="department"
              label="部门"
            >
              <Select
                placeholder="请选择或输入部门"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {departments.map(dept => (
                  <Option key={dept.department} value={dept.department}>
                    {dept.department}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="phone"
              label="联系电话"
              rules={[
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入有效的手机号码'
                }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="请输入联系电话"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {isAdmin && isEdit && (
        <Card title="状态管理" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="status"
            label="用户状态"
            rules={[{ required: true, message: '请选择用户状态' }]}
          >
            <Select
              placeholder="请选择用户状态"
              disabled={isSelf}
            >
              <Option value="active">活跃</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Card>
      )}

      <div style={{ textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          取消
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {isEdit ? '更新' : '创建'}
        </Button>
      </div>
    </Form>
  );
};

export default UserForm;