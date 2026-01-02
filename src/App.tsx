import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { AddExpense } from './components/AddExpense';
import { Analytics } from './components/Analytics';
import { SearchFilter } from './components/SearchFilter';
import { SettingsProfile } from './components/SettingsProfile';
import { Home, PlusCircle, BarChart3, Search, Settings } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: number;
}

export interface Budget {
  monthly: number;
  categories: { [key: string]: number };
}

// 全局状态管理
export const AppContext = React.createContext<{
  transactions: Transaction[];
  budget: Budget;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (budget: Budget) => void;
  exportData: () => void;
}>({
  transactions: [],
  budget: { monthly: 5000, categories: {} },
  addTransaction: () => {},
  updateTransaction: () => {},
  deleteTransaction: () => {},
  updateBudget: () => {},
  exportData: () => {},
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'analytics' | 'search' | 'settings'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget>({ monthly: 5000, categories: {} });

  // 从localStorage加载数据
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    const savedBudget = localStorage.getItem('budget');
    
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (e) {
        console.error('加载交易数据失败:', e);
      }
    }
    
    if (savedBudget) {
      try {
        setBudget(JSON.parse(savedBudget));
      } catch (e) {
        console.error('加载预算数据失败:', e);
      }
    }
  }, []);

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budget', JSON.stringify(budget));
  }, [budget]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateBudget = (newBudget: Budget) => {
    setBudget(newBudget);
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ transactions, budget }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `记账本数据_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const contextValue = {
    transactions,
    budget,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateBudget,
    exportData,
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'add':
        return <AddExpense onBack={() => setActiveTab('home')} />;
      case 'analytics':
        return <Analytics />;
      case 'search':
        return <SearchFilter />;
      case 'settings':
        return <SettingsProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* 手机框架 */}
        <div className="flex justify-center items-center min-h-screen p-4">
          <div className="relative">
            {/* 手机外壳 */}
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
              {/* 屏幕 */}
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative flex flex-col">
                {/* 状态栏 */}
                <div className="h-11 bg-white flex items-center justify-between px-8 text-black text-sm font-medium relative z-10 flex-shrink-0">
                  <span>9:41</span>
                  <div className="w-6 h-3 bg-black rounded-sm"></div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-3 border border-black rounded-sm">
                      <div className="w-4 h-1 bg-black rounded-full mt-1 ml-0.5"></div>
                    </div>
                  </div>
                </div>
                
                {/* 内容区域 */}
                <div className="flex-1 overflow-hidden">
                  {renderContent()}
                </div>
                
                {/* 底部导航栏 */}
                <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-lg">
                  <div className="flex justify-around items-center h-20 pb-2">
                    <button
                      onClick={() => setActiveTab('home')}
                      className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
                        activeTab === 'home'
                          ? 'text-primary bg-primary/10'
                          : 'text-slate-400'
                      }`}
                    >
                      <Home className="h-6 w-6" />
                      <span className="text-xs">首页</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
                        activeTab === 'analytics'
                          ? 'text-primary bg-primary/10'
                          : 'text-slate-400'
                      }`}
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-xs">统计</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('add')}
                      className="flex flex-col items-center -mt-8"
                    >
                      <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200">
                        <PlusCircle className="h-8 w-8 text-white" />
                      </div>
                      <span className="text-xs text-slate-400 mt-1">记账</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
                        activeTab === 'search'
                          ? 'text-primary bg-primary/10'
                          : 'text-slate-400'
                      }`}
                    >
                      <Search className="h-6 w-6" />
                      <span className="text-xs">查询</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
                        activeTab === 'settings'
                          ? 'text-primary bg-primary/10'
                          : 'text-slate-400'
                      }`}
                    >
                      <Settings className="h-6 w-6" />
                      <span className="text-xs">设置</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Toaster position="top-center" />
      </div>
    </AppContext.Provider>
  );
}
