import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Calendar, Edit, Trash2, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';

const categoryIcons: { [key: string]: string } = {
  '餐饮': '🍽️',
  '交通': '🚗',
  '购物': '🛍️',
  '娱乐': '🎬',
  '医疗': '🏥',
  '教育': '📚',
  '住房': '🏠',
  '通讯': '📱',
  '工资': '💼',
  '投资': '💰',
  '其他': '📝',
};

const categoryColors: { [key: string]: string } = {
  '餐饮': '#FF6B6B',
  '交通': '#4ECDC4',
  '购物': '#96CEB4',
  '娱乐': '#FFEAA7',
  '医疗': '#74B9FF',
  '教育': '#A29BFE',
  '住房': '#FD79A8',
  '通讯': '#FDCB6E',
  '工资': '#00B894',
  '投资': '#00CEC9',
  '其他': '#B2BEC3',
};

export function Dashboard() {
  const { transactions, budget, deleteTransaction } = useContext(AppContext);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 获取当前月份的交易
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  // 计算本月收入和支出
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = monthlyIncome - monthlyExpense;
  const budgetProgress = budget.monthly > 0 ? (monthlyExpense / budget.monthly) * 100 : 0;
  const remainingBudget = budget.monthly - monthlyExpense;

  // 按类别统计支出
  const expenseByCategory: { [key: string]: number } = {};
  monthlyTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const categoryData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || '#B2BEC3',
    percentage: monthlyExpense > 0 ? ((value / monthlyExpense) * 100).toFixed(1) : '0',
  }));

  // 最近交易（最多显示5条）
  const recentTransactions = transactions.slice(0, 5);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success('删除成功');
    setDeleteId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6 pb-24">
        {/* 头部问候 */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl">你好！👋</h1>
            <p className="text-muted-foreground">记录每一笔收支</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* 本月汇总卡片 */}
        <Card className="bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-primary-foreground/80 text-sm">本月结余</p>
                <p className={`text-4xl ${netAmount >= 0 ? 'text-primary-foreground' : 'text-red-200'}`}>
                  ¥{netAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-primary-foreground/70 text-xs mb-1">收入</p>
                  <p className="text-xl text-green-200">
                    +¥{monthlyIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-xs mb-1">支出</p>
                  <p className="text-xl text-red-200">
                    -¥{monthlyExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 预算进度 */}
        {budget.monthly > 0 && (
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">本月预算</p>
                  <p className="text-xl">¥{budget.monthly.toLocaleString('zh-CN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">剩余</p>
                  <p className={`text-xl ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ¥{remainingBudget.toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <Progress 
                value={Math.min(budgetProgress, 100)} 
                className={`h-3 ${budgetProgress > 100 ? 'bg-red-100' : 'bg-primary/20'}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>已使用 {budgetProgress.toFixed(1)}%</span>
                {budgetProgress > 90 && budgetProgress <= 100 && (
                  <span className="text-orange-600">⚠️ 预算即将用完</span>
                )}
                {budgetProgress > 100 && (
                  <span className="text-red-600">⚠️ 预算已超支</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 支出分类统计 */}
        {categoryData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>支出分类</span>
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  {currentYear}年{currentMonth + 1}月
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-36 h-36 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                  {categoryData.map((category) => (
                    <div key={category.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs">{categoryIcons[category.name]} {category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">¥{category.value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{category.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 最近交易 */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近交易</CardTitle>
              {transactions.length > 5 && (
                <Button variant="ghost" size="sm" className="text-primary">
                  查看全部
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>还没有交易记录</p>
                <p className="text-sm mt-2">点击下方 "+" 按钮开始记账</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 active:bg-muted/40 transition-colors duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                    {categoryIcons[transaction.category] || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {transaction.category}
                      </Badge>
                      <span className="text-xs">{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toFixed(2)}
                    </p>
                    <div className="flex gap-1 mt-1 justify-end">
                      <AlertDialog open={deleteId === transaction.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={() => setDeleteId(transaction.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除这笔交易记录吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 快速统计 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">总交易数</p>
              <p className="text-lg text-green-600">{monthlyTransactions.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">日均支出</p>
              <p className="text-lg text-blue-600">
                ¥{(monthlyExpense / new Date().getDate()).toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
