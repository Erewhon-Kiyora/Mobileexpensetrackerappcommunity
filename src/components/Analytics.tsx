import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

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

export function Analytics() {
  const { transactions } = useContext(AppContext);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // 获取时间范围内的交易
  const getFilteredTransactions = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return transactions.filter(t => new Date(t.date) >= startDate);
  };

  const filteredTransactions = getFilteredTransactions();

  // 计算总收入和总支出
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpense;

  // 按分类统计
  const expenseByCategory: { [key: string]: number } = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const categoryPieData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: categoryColors[name] || '#B2BEC3',
    }))
    .sort((a, b) => b.value - a.value);

  // 按日期统计（最近7天、30天或12个月）
  const getDailyData = () => {
    const dataMap: { [key: string]: { date: string; income: number; expense: number } } = {};
    const now = new Date();
    
    let days = 7;
    let format = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
    
    if (period === 'month') {
      days = 30;
    } else if (period === 'year') {
      days = 365;
      format = (date: Date) => `${date.getFullYear()}/${date.getMonth() + 1}`;
    }
    
    // 初始化日期
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dataMap[key] = {
        date: format(date),
        income: 0,
        expense: 0,
      };
    }
    
    // 填充数据
    filteredTransactions.forEach(t => {
      const key = t.date;
      if (dataMap[key]) {
        if (t.type === 'income') {
          dataMap[key].income += t.amount;
        } else {
          dataMap[key].expense += t.amount;
        }
      }
    });
    
    return Object.values(dataMap);
  };

  const dailyData = getDailyData();

  // 月度趋势（仅年度视图）
  const getMonthlyData = () => {
    if (period !== 'year') return [];
    
    const monthlyMap: { [key: string]: { month: string; income: number; expense: number } } = {};
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = {
        month: `${date.getMonth() + 1}月`,
        income: 0,
        expense: 0,
      };
    }
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        if (t.type === 'income') {
          monthlyMap[key].income += t.amount;
        } else {
          monthlyMap[key].expense += t.amount;
        }
      }
    });
    
    return Object.values(monthlyMap);
  };

  const monthlyData = period === 'year' ? getMonthlyData() : dailyData;

  // 获取时间段标签
  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return '最近7天';
      case 'month':
        return '最近30天';
      case 'year':
        return '最近12个月';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="text-sm font-medium mb-2">{payload[0].payload.date || payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'income' ? '收入' : '支出'}: ¥{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6 pb-24">
        {/* 头部 */}
        <div className="pt-2">
          <h1 className="text-2xl">数据分析</h1>
          <p className="text-muted-foreground">了解你的收支趋势</p>
        </div>

        {/* 时间段选择 */}
        <Card className="shadow-md">
          <CardContent className="p-2">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="week" className="text-base">周</TabsTrigger>
                <TabsTrigger value="month" className="text-base">月</TabsTrigger>
                <TabsTrigger value="year" className="text-base">年</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* 汇总卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">收入</p>
              <p className="text-base text-green-600">¥{totalIncome.toFixed(0)}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">支出</p>
              <p className="text-base text-red-600">¥{totalExpense.toFixed(0)}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">结余</p>
              <p className={`text-base ${netAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ¥{netAmount.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 收支趋势图 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>收支趋势</span>
              <Badge variant="secondary" className="text-xs px-3 py-1">
                {getPeriodLabel()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey={period === 'year' ? 'month' : 'date'} 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => value === 'income' ? '收入' : '支出'}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#00B894" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#FF6B6B" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 支出分类饼图 */}
        {categoryPieData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>支出分布</span>
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  {getPeriodLabel()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `¥${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* 分类列表 */}
              <div className="space-y-2">
                {categoryPieData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">¥{category.value.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((category.value / totalExpense) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 支出柱状图 */}
        {categoryPieData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>分类支出对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryPieData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any) => `¥${value.toFixed(2)}`}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 智能分析 */}
        {filteredTransactions.length > 0 && (
          <Card className="shadow-md bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 智能分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalExpense > totalIncome && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm text-red-600">
                    ⚠️ {getPeriodLabel()}支出超过收入 ¥{(totalExpense - totalIncome).toFixed(2)}
                  </p>
                </div>
              )}
              
              {categoryPieData.length > 0 && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm text-blue-600">
                    📊 {getPeriodLabel()}最大支出是「{categoryPieData[0].name}」，
                    共 ¥{categoryPieData[0].value.toFixed(2)}
                  </p>
                </div>
              )}
              
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm text-green-600">
                  💰 {getPeriodLabel()}平均每日支出 ¥
                  {(totalExpense / (period === 'week' ? 7 : period === 'month' ? 30 : 365)).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredTransactions.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-muted-foreground">暂无数据</p>
              <p className="text-sm text-muted-foreground mt-2">
                开始记账后就能看到统计分析了
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
