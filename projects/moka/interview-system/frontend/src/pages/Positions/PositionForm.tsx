import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  InputNumber,
  DatePicker,
  message,
  Card,
  Divider,
} from 'antd';
import { positionService } from '../../services/position';
import { Position } from '../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface PositionFormProps {
  position?: Position | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PositionForm: React.FC<PositionFormProps> = ({
  position,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = !!position;

  // 初始化表单数据
  useEffect(() => {
    if (position) {
      form.setFieldsValue({
        ...position,
        expire_date: position.expire_date ? dayjs(position.expire_date) : null,
      });
    }
  }, [position, form]);

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const data = {
        ...values,
        expire_date: values.expire_date ? values.expire_date.toISOString() : null,
      };

      let response;
      if (isEdit) {
        response = await positionService.updatePosition(position!.id, data);
      } else {
        response = await positionService.createPosition(data);
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

  // 薪资范围验证
  const validateSalaryRange = (_: any, value: number) => {
    const salaryMin = form.getFieldValue('salary_min');
    const salaryMax = form.getFieldValue('salary_max');

    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return Promise.reject(new Error('最低薪资不能大于最高薪资'));
    }
    return Promise.resolve();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        level: 'middle',
        type: 'fulltime',
        status: 'draft',
        priority: 'medium',
        headcount: 1,
      }}
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="title"
              label="职位标题"
              rules={[
                { required: true, message: '请输入职位标题' },
                { max: 200, message: '职位标题最多200个字符' }
              ]}
            >
              <Input placeholder="请输入职位标题" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="department"
              label="所属部门"
              rules={[
                { required: true, message: '请输入所属部门' },
                { max: 100, message: '部门名称最多100个字符' }
              ]}
            >
              <Input placeholder="请输入所属部门" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="level"
              label="职位级别"
              rules={[{ required: true, message: '请选择职位级别' }]}
            >
              <Select placeholder="请选择职位级别">
                <Option value="junior">初级</Option>
                <Option value="middle">中级</Option>
                <Option value="senior">高级</Option>
                <Option value="expert">专家</Option>
                <Option value="manager">管理</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="type"
              label="职位类型"
              rules={[{ required: true, message: '请选择职位类型' }]}
            >
              <Select placeholder="请选择职位类型">
                <Option value="fulltime">全职</Option>
                <Option value="parttime">兼职</Option>
                <Option value="intern">实习</Option>
                <Option value="contract">合同</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="location"
              label="工作地点"
            >
              <Input placeholder="请输入工作地点" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="salary_min"
              label="最低薪资（K/月）"
              rules={[{ validator: validateSalaryRange }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="最低薪资"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="salary_max"
              label="最高薪资（K/月）"
              rules={[{ validator: validateSalaryRange }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="最高薪资"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="headcount"
              label="招聘人数"
              rules={[
                { required: true, message: '请输入招聘人数' },
                { min: 1, message: '招聘人数不能小于1' },
                { max: 100, message: '招聘人数不能超过100' }
              ]}
            >
              <InputNumber
                min={1}
                max={100}
                style={{ width: '100%' }}
                placeholder="招聘人数"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="职位详情" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="description"
          label="职位描述"
          rules={[{ max: 5000, message: '职位描述最多5000个字符' }]}
        >
          <TextArea
            rows={4}
            placeholder="请详细描述职位职责、工作内容等..."
          />
        </Form.Item>

        <Form.Item
          name="requirements"
          label="任职要求"
          rules={[{ max: 5000, message: '任职要求最多5000个字符' }]}
        >
          <TextArea
            rows={4}
            placeholder="请详细描述任职要求、技能要求等..."
          />
        </Form.Item>

        <Form.Item
          name="skills_required"
          label="技能要求"
          rules={[{ max: 1000, message: '技能要求最多1000个字符' }]}
        >
          <TextArea
            rows={3}
            placeholder="请列出主要技能要求，用逗号分隔"
          />
        </Form.Item>

        <Form.Item
          name="benefits"
          label="福利待遇"
          rules={[{ max: 2000, message: '福利待遇最多2000个字符' }]}
        >
          <TextArea
            rows={3}
            placeholder="请描述公司福利待遇..."
          />
        </Form.Item>
      </Card>

      <Card title="管理设置" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="status"
              label="职位状态"
            >
              <Select>
                <Option value="draft">草稿</Option>
                <Option value="active">招聘中</Option>
                <Option value="paused">暂停</Option>
                <Option value="closed">已关闭</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="priority"
              label="优先级"
            >
              <Select>
                <Option value="low">低</Option>
                <Option value="medium">中</Option>
                <Option value="high">高</Option>
                <Option value="urgent">紧急</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="expire_date"
              label="过期时间"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="选择过期时间"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Divider />

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

export default PositionForm;