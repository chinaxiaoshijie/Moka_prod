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
  AutoComplete,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { interviewService } from '../../services/interview';
import { candidateService } from '../../services/candidate';
import { positionService } from '../../services/position';
import { userService } from '../../services/user';
import { Interview, Candidate, Position } from '../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface InterviewFormProps {
  interview?: Interview | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  interview,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [candidateOptions, setCandidateOptions] = useState<Candidate[]>([]);
  const [candidateSearching, setCandidateSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [positionOptions, setPositionOptions] = useState<Position[]>([]);
  const [positionLoading, setPositionLoading] = useState(false);
  const [interviewerOptions, setInterviewerOptions] = useState<any[]>([]);
  const [interviewerLoading, setInterviewerLoading] = useState(false);

  const isEdit = !!interview;

  // 初始化表单数据
  useEffect(() => {
    if (interview) {
      form.setFieldsValue({
        ...interview,
        scheduled_time: dayjs(interview.scheduled_time),
      });
    }
  }, [interview, form]);

  // 加载职位列表
  const loadPositions = async () => {
    try {
      setPositionLoading(true);
      const response = await positionService.getPositions({
        active_only: true,
        pageSize: 100,
      });

      if (response.success) {
        setPositionOptions(response.data);
      }
    } catch (error: any) {
      console.error('加载职位列表失败:', error);
    } finally {
      setPositionLoading(false);
    }
  };

  // 加载面试官列表
  const loadInterviewers = async () => {
    try {
      setInterviewerLoading(true);
      const response = await userService.getInterviewers();

      if (response.success) {
        setInterviewerOptions(response.data);
      }
    } catch (error: any) {
      console.error('加载面试官列表失败:', error);
    } finally {
      setInterviewerLoading(false);
    }
  };

  // 初始化加载职位和面试官
  useEffect(() => {
    loadPositions();
    loadInterviewers();
  }, []);

  // 搜索候选人
  const searchCandidates = async (searchText: string) => {
    if (!searchText) {
      setCandidateOptions([]);
      return;
    }

    try {
      setCandidateSearching(true);
      const response = await candidateService.getCandidates({
        search: searchText,
        pageSize: 20,
        status: 'new,screening,interviewing', // 只显示可面试的候选人
      });

      if (response.success) {
        setCandidateOptions(response.data);
      }
    } catch (error: any) {
      console.error('搜索候选人失败:', error);
    } finally {
      setCandidateSearching(false);
    }
  };

  // 选择候选人
  const handleCandidateSelect = (candidateId: number) => {
    const candidate = candidateOptions.find(c => c.id === candidateId);
    setSelectedCandidate(candidate || null);
  };

  // 检查面试官可用性
  const checkInterviewerAvailability = async (interviewerId: number, date: string) => {
    try {
      const response = await interviewService.getInterviewerAvailability(interviewerId, date);
      if (response.success && response.data.length > 0) {
        message.warning('该面试官在当天已有其他面试安排，请注意时间冲突');
      }
    } catch (error) {
      console.error('检查面试官可用性失败:', error);
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const data = {
        ...values,
        scheduled_time: values.scheduled_time.toISOString(),
      };

      let response;
      if (isEdit) {
        response = await interviewService.updateInterview(interview!.id, data);
      } else {
        response = await interviewService.createInterview(data);
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

  // 预设时间选项
  const timePresets = [
    { label: '今天 09:00', value: dayjs().hour(9).minute(0) },
    { label: '今天 14:00', value: dayjs().hour(14).minute(0) },
    { label: '明天 09:00', value: dayjs().add(1, 'day').hour(9).minute(0) },
    { label: '明天 14:00', value: dayjs().add(1, 'day').hour(14).minute(0) },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        duration: 60,
        interview_type: 'video',
        interview_round: 1,
      }}
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="candidate_id"
              label="候选人"
              rules={[{ required: true, message: '请选择候选人' }]}
            >
              <Select
                showSearch
                placeholder="搜索候选人姓名或邮箱"
                loading={candidateSearching}
                onSearch={searchCandidates}
                onSelect={handleCandidateSelect}
                notFoundContent={candidateSearching ? '搜索中...' : '未找到候选人'}
                filterOption={false}
              >
                {candidateOptions.map(candidate => (
                  <Option key={candidate.id} value={candidate.id}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{candidate.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {candidate.email} | {candidate.current_position || '暂无职位'}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="position_id"
              label="职位"
              rules={[{ required: true, message: '请选择职位' }]}
            >
              <Select
                placeholder="请选择职位"
                loading={positionLoading}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {positionOptions.map(position => (
                  <Option key={position.id} value={position.id}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{position.title}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {position.department} · {position.level === 'junior' ? '初级' : position.level === 'middle' ? '中级' : position.level === 'senior' ? '高级' : position.level === 'expert' ? '专家' : '管理'}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="interviewer_id"
              label="面试官"
              rules={[{ required: true, message: '请选择面试官' }]}
            >
              <Select
                placeholder="请选择面试官"
                loading={interviewerLoading}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onChange={(value, option: any) => {
                  // 自动填入面试官姓名
                  const interviewer = interviewerOptions.find(i => i.id === value);
                  if (interviewer) {
                    form.setFieldValue('interviewer_name', interviewer.username);
                  }
                }}
              >
                {interviewerOptions.map(interviewer => (
                  <Option key={interviewer.id} value={interviewer.id}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{interviewer.username}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {interviewer.email} {interviewer.department ? `· ${interviewer.department}` : ''}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="interviewer_name"
              label="面试官姓名"
              rules={[{ required: true, message: '面试官姓名自动填入' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="选择面试官后自动填入"
                disabled
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="面试安排" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="scheduled_time"
              label="面试时间"
              rules={[{ required: true, message: '请选择面试时间' }]}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="选择面试时间"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                presets={timePresets}
                onChange={(date) => {
                  if (date) {
                    const interviewerId = form.getFieldValue('interviewer_id');
                    if (interviewerId) {
                      checkInterviewerAvailability(interviewerId, date.format('YYYY-MM-DD'));
                    }
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="duration"
              label="面试时长（分钟）"
              rules={[{ required: true, message: '请输入面试时长' }]}
            >
              <InputNumber
                min={15}
                max={240}
                step={15}
                style={{ width: '100%' }}
                placeholder="面试时长"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="interview_type"
              label="面试类型"
              rules={[{ required: true, message: '请选择面试类型' }]}
            >
              <Select>
                <Option value="phone">电话面试</Option>
                <Option value="video">视频面试</Option>
                <Option value="onsite">现场面试</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="interview_round"
              label="面试轮次"
              rules={[{ required: true, message: '请选择面试轮次' }]}
            >
              <Select>
                <Option value={1}>第1轮（初试）</Option>
                <Option value={2}>第2轮（复试）</Option>
                <Option value={3}>第3轮（终试）</Option>
                <Option value={4}>第4轮（高管面）</Option>
                <Option value={5}>第5轮（其他）</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="status"
              label="面试状态"
              initialValue="scheduled"
            >
              <Select>
                <Option value="scheduled">已安排</Option>
                <Option value="in_progress">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
                <Option value="no_show">缺席</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="location"
          label="面试地点"
          tooltip="现场面试请填写具体地址，视频面试可留空"
        >
          <Input placeholder="面试地点或会议室" />
        </Form.Item>

        <Form.Item
          name="meeting_link"
          label="会议链接"
          tooltip="视频面试时请提供会议链接"
        >
          <Input placeholder="腾讯会议、钉钉等会议链接" />
        </Form.Item>

        <Form.Item
          name="notes"
          label="备注"
        >
          <TextArea
            rows={3}
            placeholder="面试备注、特殊要求等"
          />
        </Form.Item>
      </Card>

      {/* 候选人信息预览 */}
      {selectedCandidate && (
        <Card title="候选人信息" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <strong>姓名：</strong>{selectedCandidate.name}
            </Col>
            <Col span={8}>
              <strong>邮箱：</strong>{selectedCandidate.email || '-'}
            </Col>
            <Col span={8}>
              <strong>电话：</strong>{selectedCandidate.phone || '-'}
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={8}>
              <strong>当前公司：</strong>{selectedCandidate.current_company || '-'}
            </Col>
            <Col span={8}>
              <strong>当前职位：</strong>{selectedCandidate.current_position || '-'}
            </Col>
            <Col span={8}>
              <strong>工作年限：</strong>{selectedCandidate.experience_years ? `${selectedCandidate.experience_years}年` : '-'}
            </Col>
          </Row>
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

export default InterviewForm;