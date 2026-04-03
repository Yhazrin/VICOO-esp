/**
 * 售后服务管理页面 (AfterSales Page)
 * 
 * 功能说明：
 * - 展示所有售后工单列表（退货、换货、维修）
 * - 支持按状态筛选（待审核、已通过、已拒绝、已完成）
 * - 提供分页浏览功能
 * - 显示工单详细信息（订单ID、用户ID、原因、申请时间等）
 * 
 * 使用场景：
 * 管理员查看和处理用户提交的售后申请
 */

// 导入 React 状态管理钩子
import { useState } from 'react';

// 导入 React Query 数据请求钩子，用于异步数据获取和缓存
import { useQuery } from '@tanstack/react-query';

// 导入国际化翻译钩子
import { useTranslation } from 'react-i18next';

// 导入数据表格组件，用于展示售后工单列表
import DataTable from '../components/ui/DataTable';

// 导入表格列定义类型
import type { Column } from '../components/ui/DataTable';

// 导入分页组件
import Pagination from '../components/ui/Pagination';

// 导入状态标签组件，用于显示工单状态的彩色标签
import StatusBadge from '../components/ui/StatusBadge';

// 导入 API 请求函数，用于获取售后数据
import { fetchAfterSales } from '../services/api';

// 导入日期处理库，用于格式化时间显示
import dayjs from 'dayjs';

/**
 * 售后工单数据接口定义
 */
interface AfterSales {
  id: number;           // 工单唯一标识符
  order_id: number;     // 关联的订单 ID
  user_id: number;      // 提交工单的用户 ID
  type: string;         // 售后类型：return(退货)、exchange(换货)、repair(维修)
  reason: string;       // 售后原因描述
  status: string;       // 工单状态：pending(待审核)、approved(已通过)、rejected(已拒绝)、completed(已完成)
  created_at: string;   // 工单创建时间（ISO 格式字符串）
}

export default function AfterSalesPage() {
  // 获取翻译函数
  const { t } = useTranslation();
  
  // 当前页码状态，默认第 1 页
  const [page, setPage] = useState(1);
  
  // 当前筛选的状态值，空字符串表示不筛选
  const [statusFilter, setStatusFilter] = useState('');

  /**
   * 使用 React Query 获取售后数据
   * queryKey：查询键，包含页码和状态筛选条件，任一变化都会触发重新请求
   * queryFn：实际的数据获取函数
   */
  const { data, isLoading } = useQuery({
    queryKey: ['after-sales', page, statusFilter],
    queryFn: () => fetchAfterSales({ page, pageSize: 10, status: statusFilter || undefined }),
  });

  // 从响应数据中提取工单列表，若无数据则返回空数组
  const items: AfterSales[] = data?.data ?? [];
  
  // 提取总记录数，用于计算分页
  const total = data?.total ?? 0;

  /**
   * 售后类型标签转换函数
   * 将英文类型代码转换为对应的国际化文本
   * @param v - 类型代码（return/exchange/repair）
   * @returns 对应的中英文翻译文本
   */
  const getTypeLabel = (v: string) => {
    // 定义类型映射表，使用翻译函数获取对应语言文本
    const map: Record<string, string> = { 
      return: t('afterSales.typeReturn'),    // "退货"
      exchange: t('afterSales.typeExchange'), // "换货"
      repair: t('afterSales.typeRepair')      // "维修"
    };
    return map[v] || v; // 若未找到匹配则返回原值
  };

  /**
   * 表格列定义配置
   * 定义每列的字段名、标题、宽度及自定义渲染逻辑
   */
  const columns: Column<AfterSales>[] = [
    { key: 'id', title: 'ID', width: 80 },  // 工单 ID 列
    
    // 关联订单 ID 列
    { key: 'order_id', title: t('afterSales.colOrderId'), width: 120 },
    
    // 用户 ID 列
    { key: 'user_id', title: t('afterSales.colUserId'), width: 120 },
    
    // 售后类型列，使用 getTypeLabel 函数转换为可读文本
    { key: 'type', title: t('afterSales.colType'), width: 100, render: (v) => getTypeLabel(v) },
    
    // 售后原因列，限制最大显示长度为 40 字符，超出部分截断并添加省略号
    { key: 'reason', title: t('afterSales.colReason'), width: 200, render: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-') },
    
    // 工单状态列，使用 StatusBadge 组件渲染彩色状态标签
    { key: 'status', title: t('afterSales.colStatus'), width: 120, render: (v) => <StatusBadge status={v} /> },
    
    // 申请时间列，使用 dayjs 格式化为"YYYY-MM-DD HH:mm"格式
    { key: 'created_at', title: t('afterSales.colApplyTime'), width: 180, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      {/* 页面标题区域 */}
      <div style={{ marginBottom: 20 }}>
        {/* 主标题："售后服务管理" */}
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-serif)' }}>
          {t('afterSales.title')}
        </h1>
        {/* 副标题描述文字 */}
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {t('afterSales.description')}
        </p>
      </div>

      {/* 筛选器区域 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {/* 状态下拉选择框 */}
        <select
          value={statusFilter}                          // 绑定当前选中的状态值
          onChange={(e) => setStatusFilter(e.target.value)} // 选择变化时更新筛选条件并触发数据刷新
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',          // 圆角边框
            border: '1px solid var(--color-ink)',       // 墨色边框
            background: 'var(--color-paper)',           // 米白色背景
            fontSize: '13px',
            fontFamily: 'var(--font-mono)'              // 等宽字体
          }}
        >
          {/* 默认选项：全部状态 */}
          <option value="">{t('afterSales.filterAllStatuses')}</option>
          {/* 各状态选项 */}
          <option value="pending">{t('afterSales.statusPending')}</option>      // 待审核
          <option value="approved">{t('afterSales.statusApproved')}</option>    // 已通过
          <option value="rejected">{t('afterSales.statusRejected')}</option>    // 已拒绝
          <option value="completed">{t('afterSales.statusCompleted')}</option>  // 已完成
        </select>
      </div>

      {/* 
        数据表格组件
        - columns：列定义配置
        - data：工单数据数组
        - loading：加载状态指示
        - rowKey="id"：指定每行的唯一标识字段为 id（必需属性）
      */}
      <DataTable columns={columns} data={items} loading={isLoading} rowKey="id" />

      {/* 分页组件容器 */}
      <div style={{ marginTop: 24 }}>
        <Pagination
          page={page}                                  // 当前页码
          totalPages={Math.ceil(total / 10)}           // 总页数（根据总数和每页条数动态计算）
          pageSize={10}                                // 每页显示条数
          total={total}                                // 总记录数
          onPageChange={setPage}                        // 页码切换回调函数
        />
      </div>
    </div>
  );
}
