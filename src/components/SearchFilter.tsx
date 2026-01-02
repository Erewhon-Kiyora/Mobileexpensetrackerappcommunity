import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, CalendarIcon, Filter, X, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const allCategories = [
  '餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '通讯', 
  '工资', '奖金', '投资', '兼职', '其他'
];

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
  '奖金': '🎁',
  '投资': '💰',
  '兼职': '💻',
  '其他': '📝',
};

export function SearchFilter() {
  const { transactions } = useContext(AppContext);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // 筛选交易
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 文本搜索
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchText = 
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          (t.notes && t.notes.toLowerCase().includes(searchLower));
        if (!matchText) return false;
      }

      // 类型筛选
      if (selectedType !== 'all' && t.type !== selectedType) {
        return false;
      }

      // 分类筛选
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }

      // 日期范围筛选
      const transactionDate = new Date(t.date);
      if (startDate && transactionDate < startDate) {
        return false;
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (transactionDate > endOfDay) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchText, selectedType, selectedCategory, startDate, endDate]);

  // 计算统计
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 清除筛选条件
  const clearFilters = () => {
    setSearchText('');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasFilters = searchText || selectedType !== 'all' || selectedCategory !== 'all' || startDate || endDate;

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

  // 快捷时间选择
  const setQuickDateRange = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    const start = new Date();
    
    switch (range) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        setStartDate(start);
        setEndDate(today);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        setStartDate(start);
        setEndDate(today);
        break;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6 pb-24">
        {/* 头部 */}
        <div className="pt-2">
          <h1 className="text-2xl">查询筛选</h1>
          <p className="text-muted-foreground">搜索和筛选交易记录</p>
        </div>

        {/* 搜索框 */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="搜索描述、分类或备注..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 h-12 text-base border-2 focus:border-primary"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 筛选条件 */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                筛选条件
              </CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  清除
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 类型选择 */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">类型</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                  className="h-10"
                >
                  全部
                </Button>
                <Button
                  variant={selectedType === 'income' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('income')}
                  className="h-10"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  收入
                </Button>
                <Button
                  variant={selectedType === 'expense' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('expense')}
                  className="h-10"
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  支出
                </Button>
              </div>
            </div>

            {/* 分类选择 */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">分类</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 border-2">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryIcons[cat]} {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 快捷时间选择 */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">快捷时间</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange('today')}
                  className="h-10"
                >
                  今天
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange('week')}
                  className="h-10"
                >
                  最近7天
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange('month')}
                  className="h-10"
                >
                  最近30天
                </Button>
              </div>
            </div>

            {/* 日期范围 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">开始日期</label>
                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 justify-start text-left border-2"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-sm">
                        {startDate ? format(startDate, 'M月d日', { locale: zhCN }) : '选择日期'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setIsStartDateOpen(false);
                      }}
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">结束日期</label>
                <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 justify-start text-left border-2"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-sm">
                        {endDate ? format(endDate, 'M月d日', { locale: zhCN }) : '选择日期'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setIsEndDateOpen(false);
                      }}
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 搜索结果统计 */}
        <Card className="shadow-md bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">找到 {filteredTransactions.length} 条记录</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">收入</p>
                    <p className="text-base text-green-600">+¥{totalIncome.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">支出</p>
                    <p className="text-base text-red-600">-¥{totalExpense.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 搜索结果列表 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>搜索结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>没有找到匹配的记录</p>
                <p className="text-sm mt-2">试试调整筛选条件</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
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
                    {transaction.notes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        备注: {transaction.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toFixed(2)}
                    </p>
                    {transaction.paymentMethod && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.paymentMethod}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
