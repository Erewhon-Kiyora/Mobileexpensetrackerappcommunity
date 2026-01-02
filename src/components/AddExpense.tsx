import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarIcon, ArrowLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from "sonner";

const expenseCategories = [
  { id: '餐饮', name: '餐饮', icon: '🍽️' },
  { id: '交通', name: '交通', icon: '🚗' },
  { id: '购物', name: '购物', icon: '🛍️' },
  { id: '娱乐', name: '娱乐', icon: '🎬' },
  { id: '医疗', name: '医疗', icon: '🏥' },
  { id: '教育', name: '教育', icon: '📚' },
  { id: '住房', name: '住房', icon: '🏠' },
  { id: '通讯', name: '通讯', icon: '📱' },
  { id: '其他', name: '其他', icon: '📝' },
];

const incomeCategories = [
  { id: '工资', name: '工资', icon: '💼' },
  { id: '奖金', name: '奖金', icon: '🎁' },
  { id: '投资', name: '投资', icon: '💰' },
  { id: '兼职', name: '兼职', icon: '💻' },
  { id: '其他', name: '其他', icon: '📝' },
];

const paymentMethods = [
  { id: '现金', name: '现金', icon: '💵' },
  { id: '微信', name: '微信', icon: '💬' },
  { id: '支付宝', name: '支付宝', icon: '🅰️' },
  { id: '银行卡', name: '银行卡', icon: '💳' },
  { id: '信用卡', name: '信用卡', icon: '💳' },
];

interface AddExpenseProps {
  onBack?: () => void;
}

export function AddExpense({ onBack }: AddExpenseProps) {
  const { addTransaction } = useContext(AppContext);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleAmountChange = (value: string) => {
    // 拦截负数：如果包含负号，保持当前值不变（不更新）
    if (value.includes('-')) {
      // 不更新状态，保持原值，这样输入框的值不会变成负数
      return;
    }
    
    // 处理空值
    if (value === '') {
      setAmount('');
      return;
    }
    
    // 处理单独的小数点
    if (value === '.') {
      setAmount('.');
      return;
    }
    
    // 验证并限制为最多2位小数
    // 匹配：整数 或 整数.小数（最多2位）
    const validPattern = /^\d+(\.\d{0,2})?$/;
    
    if (validPattern.test(value)) {
      // 值完全符合格式，直接设置
      setAmount(value);
    } else {
      // 尝试提取有效部分（最多2位小数）
      // 例如：10.12345 -> 10.12
      const match = value.match(/^(\d+)(\.\d{0,2})?/);
      if (match && match[0]) {
        setAmount(match[0]);
      } else {
        // 如果完全不匹配有效格式，不更新值（保持原值）
        // 这样可以防止无效字符被输入
        return;
      }
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    
    // AI智能分类建议
    const lowerValue = value.toLowerCase();
    let suggestion: string | null = null;
    
    if (type === 'expense') {
      if (lowerValue.includes('咖啡') || lowerValue.includes('餐') || lowerValue.includes('吃') || lowerValue.includes('饭')) {
        suggestion = '餐饮';
      } else if (lowerValue.includes('打车') || lowerValue.includes('地铁') || lowerValue.includes('公交') || lowerValue.includes('加油')) {
        suggestion = '交通';
      } else if (lowerValue.includes('买') || lowerValue.includes('购') || lowerValue.includes('衣服') || lowerValue.includes('鞋')) {
        suggestion = '购物';
      } else if (lowerValue.includes('电影') || lowerValue.includes('游戏') || lowerValue.includes('娱乐')) {
        suggestion = '娱乐';
      } else if (lowerValue.includes('药') || lowerValue.includes('医院') || lowerValue.includes('看病')) {
        suggestion = '医疗';
      } else if (lowerValue.includes('房租') || lowerValue.includes('水电') || lowerValue.includes('物业')) {
        suggestion = '住房';
      } else if (lowerValue.includes('话费') || lowerValue.includes('流量') || lowerValue.includes('宽带')) {
        suggestion = '通讯';
      }
    } else {
      if (lowerValue.includes('工资') || lowerValue.includes('薪水')) {
        suggestion = '工资';
      } else if (lowerValue.includes('奖金') || lowerValue.includes('年终奖')) {
        suggestion = '奖金';
      } else if (lowerValue.includes('投资') || lowerValue.includes('理财') || lowerValue.includes('股票')) {
        suggestion = '投资';
      } else if (lowerValue.includes('兼职') || lowerValue.includes('外快')) {
        suggestion = '兼职';
      }
    }
    
    setAiSuggestion(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !selectedCategory) {
      toast.error('请填写必填项');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('请输入有效金额');
      return;
    }

    addTransaction({
      amount: amountNum,
      description,
      category: selectedCategory,
      type,
      date: date.toISOString().split('T')[0],
      paymentMethod,
      notes,
    });

    toast.success(type === 'expense' ? '支出记录成功！' : '收入记录成功！');
    
    // 重置表单
    setAmount('');
    setDescription('');
    setSelectedCategory('');
    setPaymentMethod('');
    setNotes('');
    setAiSuggestion(null);
    setDate(new Date());
    
    if (onBack) {
      onBack();
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType as 'expense' | 'income');
    setSelectedCategory('');
    setAiSuggestion(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6 pb-24">
        {/* 头部 */}
        <div className="flex items-center gap-4 pt-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl">记一笔</h1>
        </div>

        {/* 收入/支出切换 */}
        <Card className="shadow-md">
          <CardContent className="p-2">
            <Tabs value={type} onValueChange={handleTypeChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="expense" className="text-base">支出</TabsTrigger>
                <TabsTrigger value="income" className="text-base">收入</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 金额输入 */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <Label htmlFor="amount" className="text-lg mb-4 block">
                金额 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-3xl text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-12 text-3xl h-16 text-center border-2 focus:border-primary"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* 描述 */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <Label htmlFor="description" className="text-lg mb-4 block">
                描述 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                placeholder={type === 'expense' ? '今天花在了什么地方？' : '收入来源是什么？'}
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="h-12 text-base border-2 focus:border-primary"
                required
              />
              {aiSuggestion && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-blue-800">智能建议</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    这看起来是「{aiSuggestion}」类型
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCategory(aiSuggestion)}
                    className="text-blue-700 border-blue-300 active:scale-95 transition-all duration-200"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    应用建议
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 分类选择 */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <Label className="text-lg mb-4 block">
                分类 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-200 active:scale-95 ${
                      selectedCategory === category.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="text-xs">{category.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 日期和支付方式 */}
          <div className="space-y-4">
            <Card className="shadow-md">
              <CardContent className="p-6">
                <Label className="text-lg mb-4 block">日期</Label>
                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 justify-start text-left border-2 active:scale-95 transition-all duration-200"
                    >
                      <CalendarIcon className="mr-3 h-5 w-5" />
                      <span className="text-base">
                        {format(date, 'yyyy年M月d日', { locale: zhCN })}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setDate(selectedDate);
                          setIsDateOpen(false);
                        }
                      }}
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="p-6">
                <Label className="text-lg mb-4 block">支付方式</Label>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200 active:scale-95 ${
                        paymentMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="text-xl mb-1">{method.icon}</div>
                      <div className="text-xs">{method.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 备注 */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <Label htmlFor="notes" className="text-lg mb-4 block">备注（可选）</Label>
              <Textarea
                id="notes"
                placeholder="添加备注信息..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="text-base border-2 focus:border-primary"
              />
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className={`w-full h-14 text-lg rounded-xl shadow-lg active:scale-95 transition-all duration-200 ${
                type === 'expense' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {type === 'expense' ? '记录支出' : '记录收入'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
