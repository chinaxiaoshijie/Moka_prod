import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, Select, Spin, message, Typography, Space, Tag } from 'antd';
import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { interviewService } from '../../services/interview';
import { userService } from '../../services/user';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  status: string;
  type: string;
  round: number;
  interviewer: string;
}

const InterviewCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedInterviewer, setSelectedInterviewer] = useState<number | undefined>();
  const [interviewerOptions, setInterviewerOptions] = useState<any[]>([]);

  // 状态映射
  const statusMap = {
    scheduled: { text: '已安排', color: 'blue' },
    in_progress: { text: '进行中', color: 'orange' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' },
    no_show: { text: '缺席', color: 'gray' },
  };

  // 加载日历数据
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
      const endDate = selectedDate.endOf('month').format('YYYY-MM-DD');

      const response = await interviewService.getCalendarData({
        interviewer_id: selectedInterviewer,
        start_date: startDate,
        end_date: endDate,
      });

      if (response.success) {
        setEvents(response.data);
      }
    } catch (error: any) {
      message.error('加载日历数据失败');
      console.error('Load calendar data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载面试官列表
  const loadInterviewers = async () => {
    try {
      const response = await userService.getInterviewers();
      if (response.success) {
        setInterviewerOptions(response.data);
      }
    } catch (error: any) {
      console.error('加载面试官列表失败:', error);
    }
  };

  useEffect(() => {
    loadCalendarData();
    loadInterviewers();
  }, [selectedDate, selectedInterviewer]);

  // 获取指定日期的面试
  const getInterviewsForDate = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return events.filter(event => {
      const eventDate = dayjs(event.start).format('YYYY-MM-DD');
      return eventDate === dateStr;
    });
  };

  // 渲染日期单元格
  const dateCellRender = (date: Dayjs) => {
    const interviews = getInterviewsForDate(date);

    if (interviews.length === 0) {
      return null;
    }

    return (
      <div style={{ fontSize: 12 }}>
        {interviews.slice(0, 2).map((interview, index) => {
          const status = interview.status as keyof typeof statusMap;
          const statusInfo = statusMap[status];

          return (
            <div key={interview.id} style={{ marginBottom: 2 }}>
              <Badge
                color={statusInfo.color}
                text={
                  <span style={{ fontSize: 11 }}>
                    {dayjs(interview.start).format('HH:mm')} {interview.title.length > 8 ? interview.title.substring(0, 8) + '...' : interview.title}
                  </span>
                }
              />
            </div>
          );
        })}
        {interviews.length > 2 && (
          <div style={{ color: '#666', fontSize: 11 }}>
            +{interviews.length - 2} 更多...
          </div>
        )}
      </div>
    );
  };

  // 渲染月份单元格（用于年视图）
  const monthCellRender = (date: Dayjs) => {
    const monthInterviews = events.filter(event => {
      return dayjs(event.start).isSame(date, 'month');
    });

    if (monthInterviews.length === 0) {
      return null;
    }

    return (
      <div style={{ fontSize: 12, textAlign: 'center' }}>
        <Badge count={monthInterviews.length} style={{ backgroundColor: '#52c41a' }} />
      </div>
    );
  };

  // 日期选择处理
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);

    // 显示当天的面试详情
    const dayInterviews = getInterviewsForDate(date);
    if (dayInterviews.length > 0) {
      console.log('Selected date interviews:', dayInterviews);
      // 这里可以显示一个侧边栏或模态框显示当天面试详情
    }
  };

  // 面试官筛选处理
  const handleInterviewerChange = (value: number | undefined) => {
    setSelectedInterviewer(value);
  };

  return (
    <div>
      {/* 控制栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>筛选条件：</Text>
          <Select
            placeholder="选择面试官"
            allowClear
            style={{ width: 200 }}
            onChange={handleInterviewerChange}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {interviewerOptions.map(interviewer => (
              <Option key={interviewer.id} value={interviewer.id}>
                {interviewer.username}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* 日历组件 */}
      <Spin spinning={loading}>
        <Calendar
          value={selectedDate}
          onSelect={handleDateSelect}
          onPanelChange={(date) => setSelectedDate(date)}
          dateCellRender={dateCellRender}
          monthCellRender={monthCellRender}
        />
      </Spin>

      {/* 图例 */}
      <Card size="small" style={{ marginTop: 16 }}>
        <Text strong>状态图例：</Text>
        <Space style={{ marginLeft: 16 }}>
          {Object.entries(statusMap).map(([key, value]) => (
            <Tag key={key} color={value.color}>
              {value.text}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 当天面试详情 */}
      {(() => {
        const todayInterviews = getInterviewsForDate(selectedDate);
        if (todayInterviews.length === 0) {
          return null;
        }

        return (
          <Card
            size="small"
            style={{ marginTop: 16 }}
            title={
              <Space>
                <CalendarOutlined />
                {selectedDate.format('YYYY年MM月DD日')} 的面试安排
              </Space>
            }
          >
            {todayInterviews.map(interview => {
              const status = interview.status as keyof typeof statusMap;
              const statusInfo = statusMap[status];

              return (
                <Card.Grid key={interview.id} style={{ width: '50%' }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Text strong>{interview.title}</Text>
                      <Tag color={statusInfo.color} style={{ marginLeft: 8 }}>
                        {statusInfo.text}
                      </Tag>
                    </div>
                    <div>
                      <Text type="secondary">
                        <CalendarOutlined /> {dayjs(interview.start).format('HH:mm')} - {dayjs(interview.end).format('HH:mm')}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        <UserOutlined /> {interview.interviewer}
                      </Text>
                      <span style={{ marginLeft: 16, fontSize: 12, color: '#666' }}>
                        第{interview.round}轮
                      </span>
                    </div>
                  </Space>
                </Card.Grid>
              );
            })}
          </Card>
        );
      })()}
    </div>
  );
};

export default InterviewCalendar;