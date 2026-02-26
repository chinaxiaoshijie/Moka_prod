import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Alert
} from 'antd';
import { LockOutlined, UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { userService } from '../../services/user';
import { User } from '../../types';

const { Text } = Typography;

interface PasswordResetModalProps {
  visible: boolean;
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  visible,
  user,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 重置密码
  const handleResetPassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await userService.resetPassword(user.id, values.newPassword);

      if (response.success) {
        message.success('密码重置成功');
        form.resetFields();
        onSuccess();
      }
    } catch (error: any) {
      message.error(error.message || '密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证密码强度
  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入新密码'));
    }
    if (value.length < 8) {
      return Promise.reject(new Error('密码至少8个字符'));
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(value)) {
      return Promise.reject(new Error('密码必须包含至少一个字母和一个数字'));
    }
    return Promise.resolve();
  };

  // 验证确认密码
  const validateConfirmPassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请确认新密码'));
    }
    const newPassword = form.getFieldValue('newPassword');
    if (value !== newPassword) {
      return Promise.reject(new Error('两次输入的密码不一致'));
    }
    return Promise.resolve();
  };

  // 生成随机密码
  const generateRandomPassword = () => {
    const length = 12;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*#?&";
    let password = "";

    // 确保包含至少一个字母、一个数字和一个特殊字符
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "@$!%*#?&"[Math.floor(Math.random() * 8)];

    // 填充剩余字符
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // 打乱字符顺序
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  // 使用随机密码
  const handleUseRandomPassword = () => {
    const randomPassword = generateRandomPassword();
    form.setFieldsValue({
      newPassword: randomPassword,
      confirmPassword: randomPassword,
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <LockOutlined />
          重置用户密码
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="注意事项"
          description="重置密码后，用户需要使用新密码登录。请确保将新密码安全地告知用户。"
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
        />
      </div>

      {user && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
          <Space>
            <UserOutlined />
            <Text strong>目标用户：</Text>
            <Text>{user.username}</Text>
            <Text type="secondary">({user.email})</Text>
          </Space>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleResetPassword}
      >
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[{ validator: validatePassword }]}
          help="密码必须至少8个字符，包含字母和数字"
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新密码"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          rules={[{ validator: validateConfirmPassword }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入新密码"
          />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            onClick={handleUseRandomPassword}
            style={{ width: '100%' }}
          >
            生成随机密码
          </Button>
        </div>

        <div style={{ textAlign: 'right' }}>
          <Button onClick={handleCancel} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            重置密码
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PasswordResetModal;