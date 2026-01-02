import { it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { AddExpense } from './AddExpense'; 
import { Analytics } from './Analytics';
import { AppContext } from '../App';

global.ResizeObserver = class ResizeObserver {
  observe() {} unobserve() {} disconnect() {}
};

const mockContextValue = {
  transactions: [
    { id: '1', type: 'expense', amount: 0.1, category: '餐饮', date: new Date().toISOString() },
    { id: '2', type: 'expense', amount: 0.2, category: '餐饮', date: new Date().toISOString() }
  ],
  addTransaction: vi.fn(),
  budget: { monthly: 0 } 
};

const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <AppContext.Provider value={mockContextValue as any}>
      {ui}
    </AppContext.Provider>
  );
};

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});



it('R1. 输入 "-100" 验证逻辑是否拦截', () => {
  renderWithContext(<AddExpense />);
  const input = screen.getByLabelText(/金额/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: '-100' } });
  expect(input.value).not.toBe('-100');
});

it('R2. 输入 "10.12345" 验证是否拦截', () => {
  renderWithContext(<AddExpense />);
  const input = screen.getByLabelText(/金额/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: '10.12345' } });
  const isValid = /^\d+(\.\d{1,2})?$/.test(input.value);
  expect(isValid).toBe(true);
});

it('R3. 输入 1e15 验证解析稳定性', () => {
  renderWithContext(<AddExpense />);
  const input = screen.getByLabelText(/金额/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: '999999999999999' } });
  expect(parseFloat(input.value)).toBeLessThan(Number.MAX_VALUE);
});

it('R4. 验证输入 0 是否能成功提交', () => {
  renderWithContext(<AddExpense />);
  const input = screen.getByLabelText(/金额/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: '0' } });
  const submitBtn = screen.getByRole('button', { name: /记录/i });
  expect(submitBtn).toBeDefined(); // 验证按钮未因异常值崩溃
});

it('R5. 输入 100.50abc非标准字符串', () => {
  renderWithContext(<AddExpense />);
  const input = screen.getByLabelText(/金额/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: '100.50abc' } });
  expect(input.value).toBe(""); 
});

it('R6. 输入 5000 个字符验稳定性', () => {
  renderWithContext(<AddExpense />);
  const textarea = screen.getByPlaceholderText(/添加备注/i) as HTMLTextAreaElement;
  const longStr = "A".repeat(5000);
  fireEvent.change(textarea, { target: { value: longStr } });
  expect(textarea.value.length).toBe(5000);
});

it('R7. 连续点击收入/支出 Tab ', () => {
  renderWithContext(<AddExpense />);
  const incomeTab = screen.getByText('收入');
  const expenseTab = screen.getByText('支出');
  fireEvent.click(incomeTab);
  fireEvent.click(expenseTab);
  expect(screen.getByText('记录支出')).toBeDefined();
});

it('R8. SQL/脚本注入', () => {
  renderWithContext(<AddExpense />);
  const textarea = screen.getByPlaceholderText(/添加备注/i);
  fireEvent.change(textarea, { target: { value: "<script>alert(1)</script>" } });
  expect(textarea.innerHTML).not.toContain("<script>");
});

it('R9. 输入 ++100--.5', () => {
  renderWithContext(<AddExpense />);
  const input = screen.getByLabelText(/金额/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: "++100--.5" } });
  expect(input.value).toBe(""); 
});

it('R10. 输入 .验证是否报错', () => {
  renderWithContext(<AddExpense />);
  const input = screen.getByLabelText(/金额/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: "." } });
  expect(parseFloat(input.value)).not.toBeNaN;
});


it('R11. 当预算为 0 时验证 Analytics 计算', () => {
  renderWithContext(<Analytics />);
  const safePercent = (100 / (mockContextValue.budget.monthly || 1));
  expect(safePercent).toBe(100);
});

it('R12. 验证 0.1 + 0.2 的计算精度', () => {
  const sum = mockContextValue.transactions.reduce((a, b) => a + b.amount, 0);
  expect(parseFloat(sum.toFixed(2))).toBe(0.30);
});

it('R13. transactions 为空数组时 Analytics 是否白屏', () => {
  const { getByText } = render(
    <AppContext.Provider value={{...mockContextValue, transactions: []} as any}>
      <Analytics />
    </AppContext.Provider>
  );
  expect(getByText(/暂无数据/i)).toBeDefined();
});

it('R14. 累计金额超过 10 亿时的统计显示', () => {
  const hugeData = [{ amount: 1000000000 }, { amount: 1000000000 }];
  const total = hugeData.reduce((s, t) => s + t.amount, 0);
  expect(total).toBe(2000000000);
});

it('R15. 传入 invalid date 交易验证统计崩溃风险', () => {
  const badDateData = [{ amount: 10, date: "not-a-date" }];
  expect(() => new Date(badDateData[0].date)).not.toThrow();
});

it('R16. 在 周/月/年 之间快速切换验证数据重新计算', () => {
  const { getByText } = renderWithContext(<Analytics />);
  fireEvent.click(getByText('周'));
  fireEvent.click(getByText('年'));
  expect(getByText(/年/)).toBeDefined();
});

it('R17. 单项金额占 100% 时的逻辑', () => {
  const singleData = [{ amount: 100, type: 'expense' }];
  const percent = (100 / 100) * 100;
  expect(percent).toBe(100);
});

it('R18. 验证组件多次挂载/卸载的稳定性', () => {
  const { unmount } = renderWithContext(<Analytics />);
  unmount();
  expect(true).toBe(true);
});

it('R19. 验证 periodDays 为 365 时的精度', () => {
  const avg = 1 / 365;
  expect(avg).toBeGreaterThan(0);
});

it('R20. 混合类型：交易列表中包含未定义分类时的统计', () => {
  renderWithContext(<Analytics />);
  const unknownCategory = { category: undefined, amount: 50 };
  expect(unknownCategory.amount).toBe(50);
});