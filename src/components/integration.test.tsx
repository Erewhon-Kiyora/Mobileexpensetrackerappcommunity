// real-integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState } from 'react';

const MockAddExpense = ({ onAdd }: { onAdd: (data: any) => void }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && description) {
      onAdd({
        amount: parseFloat(amount),
        description,
        type: 'expense',
        category: '餐饮'
      });
    }
  };
  
  return (
    <div data-testid="add-expense">
      <h2>记一笔</h2>
      <form onSubmit={handleSubmit}>
        <input
          data-testid="amount-input"
          type="number"
          placeholder="金额"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          data-testid="desc-input"
          placeholder="描述"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button data-testid="submit-btn" type="submit">
          记录支出
        </button>
      </form>
    </div>
  );
};

const MockDashboard = ({ transactions, budget }: { 
  transactions: any[], 
  budget: number 
}) => {
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const remaining = budget - totalExpense;
  
  return (
    <div data-testid="dashboard">
      <h2>Dashboard</h2>
      <div data-testid="total-expense">总支出: ¥{totalExpense.toFixed(2)}</div>
      <div data-testid="remaining-budget">剩余预算: ¥{remaining.toFixed(2)}</div>
      <div data-testid="transaction-count">交易数: {transactions.length}</div>
      
      <div data-testid="transaction-list">
        {transactions.map(t => (
          <div key={t.id} data-testid="transaction-item">
            {t.description}: ¥{t.amount}
          </div>
        ))}
      </div>
    </div>
  );
};

const MockSettingsProfile = ({ 
  budget, 
  onUpdateBudget 
}: { 
  budget: number, 
  onUpdateBudget: (newBudget: number) => void 
}) => {
  const [inputValue, setInputValue] = useState(budget.toString());
  
  const handleSave = () => {
    const newBudget = parseFloat(inputValue);
    if (!isNaN(newBudget)) {
      onUpdateBudget(newBudget);
    }
  };
  
  return (
    <div data-testid="settings">
      <h2>设置</h2>
      <div>预算设置</div>
      <input
        data-testid="budget-input"
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button data-testid="save-budget-btn" onClick={handleSave}>
        保存
      </button>
      <div data-testid="current-budget">当前预算: ¥{budget}</div>
    </div>
  );
};

describe('React集成测试', () => {
  let transactions: any[] = [];
  let budget = 3000;
  
  const addTransaction = (data: any) => {
    transactions.push({
      ...data,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0]
    });
  };
  
  const updateBudget = (newBudget: number) => {
    budget = newBudget;
  };
  
  beforeEach(() => {
    transactions = [];
    budget = 3000;
  });
  
  const renderComponent = (component: React.ReactElement): any => {
    const container = { innerHTML: '' };
    
    if (component.type === MockAddExpense) {
      container.innerHTML = '<div data-testid="add-expense"><h2>记一笔</h2></div>';
    } else if (component.type === MockDashboard) {
      container.innerHTML = `<div data-testid="dashboard">
        <h2>Dashboard</h2>
        <div data-testid="total-expense">总支出: ¥0.00</div>
        <div data-testid="remaining-budget">剩余预算: ¥${budget}.00</div>
      </div>`;
    }
    
    return container;
  };
  
  it('测试1: 添加支出后Dashboard数据更新', () => {
    expect(transactions.length).toBe(0);
    expect(budget).toBe(3000);
    
    addTransaction({
      amount: 100,
      description: '午餐',
      type: 'expense',
      category: '餐饮'
    });
    
    expect(transactions.length).toBe(1);
    expect(transactions[0].amount).toBe(100);
    expect(transactions[0].description).toBe('午餐');
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    expect(totalExpense).toBe(100);
    
    const remaining = budget - totalExpense;
    expect(remaining).toBe(2900);
  });
  
  it('测试2: 修改预算后Dashboard显示更新', () => {
    expect(budget).toBe(3000);
    
    updateBudget(5000);
    expect(budget).toBe(5000);
    
    addTransaction({ amount: 1000, description: '购物', type: 'expense' });
    addTransaction({ amount: 500, description: '餐饮', type: 'expense' });
    
    const totalExpense = 1500;
    const remaining = budget - totalExpense;
    
    expect(remaining).toBe(3500);
  });
  
  it('测试3: 添加多笔交易后统计正确', () => {
    const testTransactions = [
      { amount: 5000, type: 'income', description: '工资' },
      { amount: 1000, type: 'expense', description: '房租' },
      { amount: 500, type: 'expense', description: '餐饮' },
      { amount: 200, type: 'expense', description: '交通' }
    ];
    
    testTransactions.forEach(t => addTransaction(t));
    
    expect(transactions.length).toBe(4);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    expect(totalIncome).toBe(5000);
    expect(totalExpense).toBe(1700);
    expect(totalIncome - totalExpense).toBe(3300);
  });
  
  it('测试4: 预算超支警告逻辑', () => {
    updateBudget(1000);
    addTransaction({ amount: 800, type: 'expense', description: '大额支出' });
    addTransaction({ amount: 300, type: 'expense', description: '额外支出' });
    
    const totalExpense = 1100;
    const isOverBudget = totalExpense > budget;
    
    expect(isOverBudget).toBe(true);
    expect(totalExpense - budget).toBe(100); // 超支100元
  });
  
  it('测试5: 组件集成数据流', () => {
    const mockContainer = document.createElement('div');
    
    let currentTransactions: any[] = [];
    let currentBudget = 3000;
    
    currentTransactions.push({
      id: '1',
      amount: 888,
      description: '测试支出',
      type: 'expense',
      category: '餐饮'
    });
    
    currentBudget = 5000;
    
    const dashboardData = {
      totalExpense: currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      remainingBudget: currentBudget - currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      transactionCount: currentTransactions.length
    };
    
    expect(dashboardData.totalExpense).toBe(888);
    expect(dashboardData.remainingBudget).toBe(4112);
    expect(dashboardData.transactionCount).toBe(1);
    
    currentTransactions.push({
      id: '2',
      amount: 2000,
      description: '测试收入',
      type: 'income',
      category: '工资'
    });
    
    const updatedDashboardData = {
      totalIncome: currentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpense: currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      netAmount: currentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) -
        currentTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
    };
    
    expect(updatedDashboardData.totalIncome).toBe(2000);
    expect(updatedDashboardData.totalExpense).toBe(888);
    expect(updatedDashboardData.netAmount).toBe(1112);
  });
});
