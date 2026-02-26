import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  InputNumber,
  Rate,
  Card,
  message,
  Divider,
  Space,
  Tag,
  AutoComplete,
  Slider,
  Typography,
  Alert,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  StarOutlined,
  BulbOutlined,
  TeamOutlined,
  CommentOutlined,
  ToolOutlined,
  SaveOutlined,
  SendOutlined
} from '@ant-design/icons';
import { feedbackService } from '../../services/feedback';
import { templateService } from '../../services/template';
import { interviewService } from '../../services/interview';
import { useUser } from '../../hooks/useAuth';
import type { Feedback, FeedbackTemplate } from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface FeedbackFormProps {
  feedback?: Feedback | null;
  interview?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  feedback,
  interview,
  onSuccess,
  onCancel,
}) => {
  const { user } = useUser();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FeedbackTemplate | null>(null);
  const [interviewOptions, setInterviewOptions] = useState<any[]>([]);

  const isEdit = !!feedback;

  // 评分维度配置
  const scoreDimensions = [
    {
      key: 'technical_score',
      label: '技术能力',
      icon: <ToolOutlined />,
      description: '编程技能、技术深度、解决问题能力',
    },
    {
      key: 'communication_score',
      label: '沟通表达',
      icon: <CommentOutlined />,
      description: '表达清晰度、逻辑思维、倾听能力',
    },
    {
      key: 'problem_solving_score',
      label: '解决问题',
      icon: <BulbOutlined />,
      description: '分析问题、创新思维、执行能力',
    },
    {
      key: 'cultural_fit_score',
      label: '文化匹配',
      icon: <TeamOutlined />,
      description: '价值观契合、团队协作、学习意愿',
    },
    {
      key: 'leadership_score',
      label: '领导力',
      icon: <UserOutlined />,
      description: '影响力、决策能力、团队管理',
    },
    {
      key: 'creativity_score',
      label: '创新能力',
      icon: <StarOutlined />,
      description: '创新思维、适应性、持续改进',
    },
  ];

  // 初始化表单数据
  useEffect(() => {
    if (feedback) {
      form.setFieldsValue({
        ...feedback,
        overall_score: feedback.overall_score || calculateAverageScore(feedback),
      });
    } else if (interview) {
      form.setFieldsValue({
        interview_id: interview.id,
        candidate_id: interview.candidate_id,
        position_id: interview.position_id,
        interviewer_id: user?.id,
      });
    }
  }, [feedback, interview, form, user]);

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      const response = await templateService.getTemplates({
        status: 'active',
        pageSize: 100,
      });
      if (response.success) {
        setTemplates(response.data.templates);
      }
    } catch (error: any) {
      console.error('加载模板列表失败:', error);
    }
  };

  // 加载面试列表（新建时）
  const loadInterviews = async () => {
    if (isEdit || interview) return;

    try {
      const response = await interviewService.getInterviews({
        status: 'completed',
        interviewer_id: user?.id,
        pageSize: 50,
      });
      if (response.success) {
        setInterviewOptions(response.data.interviews);
      }
    } catch (error: any) {
      console.error('加载面试列表失败:', error);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadInterviews();
  }, []);

  // 计算平均分
  const calculateAverageScore = (values: any) => {
    const scores = [
      values.technical_score,
      values.communication_score,
      values.problem_solving_score,
      values.cultural_fit_score,
      values.leadership_score,
      values.creativity_score,
    ].filter(score => score !== null && score !== undefined && score > 0);

    if (scores.length === 0) return null;
    return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;
  };

  // 应用模板
  const handleApplyTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);

      // 应用模板的评分标准和说明
      const templateFields: any = {};

      // 如果模板有默认权重，可以在这里应用
      // 这里主要是应用评分指导和标准

      form.setFieldsValue(templateFields);
      message.success('已应用模板');
    }
  };

  // 表单值变化处理
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // 自动计算综合得分
    const avgScore = calculateAverageScore(allValues);
    if (avgScore !== null && avgScore !== allValues.overall_score) {
      form.setFieldValue('overall_score', avgScore);
    }

    // 根据综合得分自动建议总体评级
    if (avgScore !== null) {
      let suggestedRating = '';
      if (avgScore >= 9) suggestedRating = 'excellent';
      else if (avgScore >= 7) suggestedRating = 'good';
      else if (avgScore >= 5) suggestedRating = 'average';
      else suggestedRating = 'poor';

      if (!allValues.overall_rating) {
        form.setFieldValue('overall_rating', suggestedRating);
      }
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const data = {
        ...values,
        overall_score: values.overall_score || calculateAverageScore(values),
      };

      let response;
      if (isEdit) {
        response = await feedbackService.updateFeedback(feedback!.id, data);
      } else {
        response = await feedbackService.createFeedback(data);
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

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue();
      await handleSubmit({ ...values, status: 'draft' });
    } catch (error) {
      console.error('保存草稿失败:', error);
    }
  };

  // 提交反馈
  const handleSubmitFeedback = async () => {
    try {
      const values = form.getFieldsValue();
      await handleSubmit({ ...values, status: 'submitted' });
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={handleValuesChange}
      initialValues={{
        confidence_level: 3,
        status: 'draft',
      }}
    >
      {/* 模板选择 */}
      {!isEdit && templates.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={12}>
              <Form.Item label="选择评估模板" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="选择模板快速填入评估标准"
                  onChange={handleApplyTemplate}
                  allowClear
                >
                  {templates.map(template => (
                    <Option key={template.id} value={template.id}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{template.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {template.position_level} · {template.template_type}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {selectedTemplate && (
              <Col span={12}>
                <Alert
                  message={`已选择模板: ${selectedTemplate.name}`}
                  type="info"
                  size="small"
                  closable
                  onClose={() => setSelectedTemplate(null)}
                />
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* 基本信息 */}
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {!isEdit && !interview && (
            <Col xs={24} sm={12}>
              <Form.Item
                name="interview_id"
                label="关联面试"
                rules={[{ required: true, message: '请选择面试' }]}
              >
                <Select
                  placeholder="请选择面试"
                  showSearch
                  filterOption={(input, option) =>
                    option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {interviewOptions.map(interview => (
                    <Option key={interview.id} value={interview.id}>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {interview.candidate_name} - {interview.position_title}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          第{interview.interview_round}轮 · {interview.scheduled_time}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}

          <Col xs={24} sm={12}>
            <Form.Item
              name="template_id"
              label="评估模板"
              tooltip="选择适合的评估模板"
            >
              <Select placeholder="选择模板（可选）" allowClear>
                {templates.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 多维度评分 */}
      <Card title="多维度评分" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 24]}>
          {scoreDimensions.map(dimension => (
            <Col xs={24} sm={12} md={8} key={dimension.key}>
              <Form.Item
                name={dimension.key}
                label={
                  <Space>
                    {dimension.icon}
                    <span>{dimension.label}</span>
                    <Tooltip title={dimension.description}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        (?)</Text>
                    </Tooltip>
                  </Space>
                }
              >
                <div>
                  <Rate count={10} style={{ fontSize: 16 }} />
                  <Form.Item
                    name={dimension.key}
                    noStyle
                    rules={[{ type: 'number', min: 1, max: 10, message: '请选择1-10分' }]}
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="1-10分"
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
          ))}
        </Row>

        {/* 综合得分显示 */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Form.Item
              name="overall_score"
              label="综合得分"
              tooltip="系统根据各维度评分自动计算"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={10}
                precision={1}
                disabled
                formatter={value => `${value} 分`}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="confidence_level"
              label="评估信心度"
              rules={[{ required: true, message: '请选择信心度' }]}
            >
              <Slider
                marks={{
                  1: '不确定',
                  3: '一般',
                  5: '非常确定'
                }}
                min={1}
                max={5}
                step={1}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 详细评估 */}
      <Card title="详细评估" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="strengths"
              label="优势亮点"
              rules={[{ required: true, message: '请填写候选人的优势亮点' }]}
            >
              <TextArea
                rows={4}
                placeholder="描述候选人在面试中表现出的优势和亮点..."
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="weaknesses"
              label="待改进之处"
              rules={[{ required: true, message: '请填写候选人的待改进之处' }]}
            >
              <TextArea
                rows={4}
                placeholder="描述候选人需要改进的方面..."
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="technical_assessment"
              label="技术评估"
              tooltip="针对技术能力的详细评估"
            >
              <TextArea
                rows={3}
                placeholder="技术深度、编程能力、解决问题的技术方案..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="behavioral_assessment"
              label="行为评估"
              tooltip="针对软技能和行为表现的评估"
            >
              <TextArea
                rows={3}
                placeholder="沟通能力、团队合作、学习能力、抗压能力..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="improvement_suggestions"
          label="改进建议"
          tooltip="为候选人提供的发展建议"
        >
          <TextArea
            rows={3}
            placeholder="针对候选人的能力短板，提供具体的改进建议..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="additional_notes"
          label="其他备注"
        >
          <TextArea
            rows={3}
            placeholder="其他需要说明的情况..."
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Card>

      {/* 总体评估 */}
      <Card title="总体评估" size="small" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="overall_rating"
              label="总体评级"
              rules={[{ required: true, message: '请选择总体评级' }]}
            >
              <Select placeholder="请选择总体评级">
                <Option value="excellent">
                  <Tag color="green">优秀</Tag>
                  <span style={{ marginLeft: 8 }}>超出期望，表现卓越</span>
                </Option>
                <Option value="good">
                  <Tag color="blue">良好</Tag>
                  <span style={{ marginLeft: 8 }}>符合期望，表现不错</span>
                </Option>
                <Option value="average">
                  <Tag color="orange">一般</Tag>
                  <span style={{ marginLeft: 8 }}>基本符合，尚有提升空间</span>
                </Option>
                <Option value="poor">
                  <Tag color="red">较差</Tag>
                  <span style={{ marginLeft: 8 }}>未达到期望</span>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="recommendation"
              label="录用建议"
              rules={[{ required: true, message: '请选择录用建议' }]}
            >
              <Select placeholder="请选择录用建议">
                <Option value="strong_hire">
                  <Tag color="green">强烈推荐</Tag>
                  <span style={{ marginLeft: 8 }}>优秀候选人，强烈推荐录用</span>
                </Option>
                <Option value="hire">
                  <Tag color="blue">推荐录用</Tag>
                  <span style={{ marginLeft: 8 }}>合适候选人，推荐录用</span>
                </Option>
                <Option value="no_hire">
                  <Tag color="orange">不推荐</Tag>
                  <span style={{ marginLeft: 8 }}>不符合要求，不推荐录用</span>
                </Option>
                <Option value="strong_no_hire">
                  <Tag color="red">强烈不推荐</Tag>
                  <span style={{ marginLeft: 8 }}>明显不符合，强烈不推荐</span>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            loading={loading}
          >
            保存草稿
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitFeedback}
            loading={loading}
          >
            {isEdit ? '更新并提交' : '提交反馈'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default FeedbackForm;