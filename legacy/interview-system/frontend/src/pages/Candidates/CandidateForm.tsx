import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  InputNumber,
  Upload,
  message,
  Card,
  Divider,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { candidateService } from '../../services/candidate';
import { Candidate } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

interface CandidateFormProps {
  candidate?: Candidate | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CandidateForm: React.FC<CandidateFormProps> = ({
  candidate,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const isEdit = !!candidate;

  // 初始化表单数据
  React.useEffect(() => {
    if (candidate) {
      form.setFieldsValue(candidate);
    }
  }, [candidate, form]);

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const data = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
      };

      let response;
      if (isEdit) {
        response = await candidateService.updateCandidate(candidate!.id, data);
      } else {
        response = await candidateService.createCandidate(data);
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

  // 重复检查
  const handleDuplicateCheck = async () => {
    const { name, email, phone } = form.getFieldsValue(['name', 'email', 'phone']);

    if (!name && !email && !phone) {
      message.warning('请至少填写姓名、邮箱或手机号');
      return;
    }

    try {
      const response = await candidateService.checkDuplicates({ name, email, phone });

      if (response.success) {
        if (response.data.hasDuplicates) {
          const duplicates = response.data.duplicates
            .filter(d => !candidate || d.id !== candidate.id); // 排除当前编辑的候选人

          if (duplicates.length > 0) {
            message.warning(
              `发现 ${duplicates.length} 个重复候选人：${duplicates.map(d => d.name).join(', ')}`
            );
          } else {
            message.success('未发现重复候选人');
          }
        } else {
          message.success('未发现重复候选人');
        }
      }
    } catch (error: any) {
      message.error(error.message || '重复检查失败');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        source: 'manual',
        status: 'new',
      }}
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入候选人姓名" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="gender" label="性别">
              <Select placeholder="请选择性别">
                <Option value="male">男</Option>
                <Option value="female">女</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱地址" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              ]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="age" label="年龄">
              <InputNumber
                min={16}
                max={70}
                style={{ width: '100%' }}
                placeholder="年龄"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="education" label="学历">
              <Select placeholder="请选择学历">
                <Option value="high_school">高中</Option>
                <Option value="associate">大专</Option>
                <Option value="bachelor">本科</Option>
                <Option value="master">硕士</Option>
                <Option value="doctor">博士</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="experience_years" label="工作年限">
              <InputNumber
                min={0}
                max={50}
                style={{ width: '100%' }}
                placeholder="年"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="school" label="毕业院校">
              <Input placeholder="请输入毕业院校" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="major" label="专业">
              <Input placeholder="请输入专业" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="工作信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="current_company" label="当前公司">
              <Input placeholder="请输入当前公司" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="current_position" label="当前职位">
              <Input placeholder="请输入当前职位" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="current_salary" label="当前薪资（月薪/K）">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="当前薪资"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="expected_salary" label="期望薪资（月薪/K）">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="期望薪资"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="skills" label="技能描述">
          <TextArea
            rows={3}
            placeholder="请输入候选人的技能描述"
          />
        </Form.Item>
      </Card>

      <Card title="其他信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="source" label="简历来源">
              <Select>
                <Option value="boss">BOSS直聘</Option>
                <Option value="lagou">拉勾网</Option>
                <Option value="zhilian">智联招聘</Option>
                <Option value="internal">内推</Option>
                <Option value="referral">推荐</Option>
                <Option value="manual">手动录入</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="status" label="状态">
              <Select>
                <Option value="new">新候选人</Option>
                <Option value="screening">筛选中</Option>
                <Option value="interviewing">面试中</Option>
                <Option value="offer">待入职</Option>
                <Option value="hired">已入职</Option>
                <Option value="rejected">已拒绝</Option>
                <Option value="withdrawn">已撤回</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '32px' }}>
              <Button onClick={handleDuplicateCheck}>
                重复检查
              </Button>
            </div>
          </Col>
        </Row>

        <Form.Item name="notes" label="备注">
          <TextArea
            rows={3}
            placeholder="请输入备注信息"
          />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Input placeholder="多个标签用逗号分隔" />
        </Form.Item>
      </Card>

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

export default CandidateForm;