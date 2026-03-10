import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Statistic, Row, Col, Spin, message } from 'antd';
import { BankOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { positionService } from '../../services/position';

interface DepartmentStat {
  department: string;
  position_count: number;
  active_count: number;
  total_headcount: number;
  filled_headcount: number;
}

const DepartmentStatistics: React.FC = () => {
  const [data, setData] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载部门统计数据
  const loadDepartmentStats = async () => {
    try {
      setLoading(true);
      const response = await positionService.getDepartmentStatistics();
      if (response.success) {
        setData(response.data);
      }
    } catch (error: any) {
      message.error(error.message || '加载部门统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartmentStats();
  }, []);

  // 计算总计数据
  const totalStats = data.reduce(
    (acc, item) => ({
      position_count: acc.position_count + item.position_count,
      active_count: acc.active_count + item.active_count,
      total_headcount: acc.total_headcount + item.total_headcount,
      filled_headcount: acc.filled_headcount + item.filled_headcount,
    }),
    { position_count: 0, active_count: 0, total_headcount: 0, filled_headcount: 0 }
  );

  // 计算完成率
  const getCompletionRate = (filled: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((filled / total) * 100);
  };

  // 表格列定义
  const columns: ColumnsType<DepartmentStat> = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      fixed: 'left',
    },
    {
      title: '职位数量',
      dataIndex: 'position_count',
      key: 'position_count',
      width: 100,
      sorter: (a, b) => a.position_count - b.position_count,
    },
    {
      title: '招聘中',
      dataIndex: 'active_count',
      key: 'active_count',
      width: 100,
      sorter: (a, b) => a.active_count - b.active_count,
    },
    {
      title: '总需求人数',
      dataIndex: 'total_headcount',
      key: 'total_headcount',
      width: 120,
      sorter: (a, b) => a.total_headcount - b.total_headcount,
    },
    {
      title: '已入职人数',
      dataIndex: 'filled_headcount',
      key: 'filled_headcount',
      width: 120,
      sorter: (a, b) => a.filled_headcount - b.filled_headcount,
    },
    {
      title: '完成率',
      key: 'completion_rate',
      width: 150,
      render: (_, record) => {
        const rate = getCompletionRate(record.filled_headcount, record.total_headcount);
        return (
          <Progress
            percent={rate}
            size="small"
            status={rate === 100 ? 'success' : rate > 50 ? 'active' : 'normal'}
          />
        );
      },
      sorter: (a, b) => {
        const rateA = getCompletionRate(a.filled_headcount, a.total_headcount);
        const rateB = getCompletionRate(b.filled_headcount, b.total_headcount);
        return rateA - rateB;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总职位数"
              value={totalStats.position_count}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="招聘中"
              value={totalStats.active_count}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="需求人数"
              value={totalStats.total_headcount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已入职"
              value={totalStats.filled_headcount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 部门详情表格 */}
      <Card title="部门详细统计">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="department"
          pagination={false}
          scroll={{ x: 700 }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                <Table.Summary.Cell index={0}>
                  <strong>总计</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{totalStats.position_count}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{totalStats.active_count}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>{totalStats.total_headcount}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <strong>{totalStats.filled_headcount}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Progress
                    percent={getCompletionRate(totalStats.filled_headcount, totalStats.total_headcount)}
                    size="small"
                    status="active"
                  />
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </Spin>
  );
};

export default DepartmentStatistics;