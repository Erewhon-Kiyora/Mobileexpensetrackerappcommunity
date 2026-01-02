import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Download, Upload, Trash2, DollarSign, Bell, Moon, Database, FileText, Settings as SettingsIcon } from 'lucide-react';
import { toast } from "sonner";

export function SettingsProfile() {
  const { transactions, budget, updateBudget, exportData } = useContext(AppContext);
  const [monthlyBudget, setMonthlyBudget] = useState(budget.monthly.toString());
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveBudget = () => {
    const newBudget = parseFloat(monthlyBudget);
    if (isNaN(newBudget) || newBudget < 0) {
      toast.error('请输入有效的预算金额');
      return;
    }
    
    updateBudget({
      ...budget,
      monthly: newBudget,
    });
    
    toast.success('预算设置已保存');
  };

  const handleExportJSON = () => {
    exportData();
    toast.success('数据已导出为 JSON 文件');
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('没有数据可以导出');
      return;
    }

    // 生成CSV内容
    const headers = ['日期', '类型', '分类', '描述', '金额', '支付方式', '备注'];
    const rows = transactions.map(t => [
      t.date,
      t.type === 'income' ? '收入' : '支出',
      t.category,
      t.description,
      t.amount.toFixed(2),
      t.paymentMethod || '',
      t.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 添加 BOM 以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `记账本数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('数据已导出为 CSV 文件');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.transactions && Array.isArray(data.transactions)) {
          localStorage.setItem('transactions', JSON.stringify(data.transactions));
          
          if (data.budget) {
            localStorage.setItem('budget', JSON.stringify(data.budget));
          }
          
          toast.success('数据导入成功，请刷新页面');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          toast.error('导入文件格式错误');
        }
      } catch (error) {
        toast.error('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    localStorage.removeItem('transactions');
    localStorage.removeItem('budget');
    toast.success('所有数据已清除，请刷新页面');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleBackupToCloud = () => {
    // 模拟云端备份
    const dataStr = JSON.stringify({ transactions, budget }, null, 2);
    localStorage.setItem('cloudBackup', dataStr);
    localStorage.setItem('cloudBackupTime', new Date().toISOString());
    toast.success('数据已备份到云端（本地存储）');
  };

  const handleRestoreFromCloud = () => {
    const backup = localStorage.getItem('cloudBackup');
    const backupTime = localStorage.getItem('cloudBackupTime');
    
    if (!backup) {
      toast.error('没有找到云端备份');
      return;
    }

    try {
      const data = JSON.parse(backup);
      localStorage.setItem('transactions', JSON.stringify(data.transactions));
      localStorage.setItem('budget', JSON.stringify(data.budget));
      
      const time = backupTime ? new Date(backupTime).toLocaleString('zh-CN') : '未知时间';
      toast.success(`已从云端恢复数据（备份时间：${time}），请刷新页面`);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('恢复失败，备份数据可能已损坏');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6 pb-24">
        {/* 头部 */}
        <div className="pt-2">
          <h1 className="text-2xl">设置</h1>
          <p className="text-muted-foreground">管理你的记账本</p>
        </div>

        {/* 预算设置 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              预算设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="monthlyBudget" className="text-base mb-3 block">
                月度预算（元）
              </Label>
              <div className="flex gap-3">
                <Input
                  id="monthlyBudget"
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="h-12 text-base border-2 focus:border-primary flex-1"
                />
                <Button 
                  onClick={handleSaveBudget}
                  className="h-12 px-6"
                >
                  保存
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 设置月度预算后，当支出接近或超过预算时，系统会在首页显示提醒
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 数据导出 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              数据导出
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              导出你的记账数据，方便备份或进一步分析
            </p>
            
            <Button 
              onClick={handleExportJSON}
              variant="outline"
              className="w-full h-12 justify-start"
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">导出为 JSON</p>
                <p className="text-xs text-muted-foreground">完整数据，可用于导入</p>
              </div>
            </Button>
            
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              className="w-full h-12 justify-start"
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">导出为 CSV</p>
                <p className="text-xs text-muted-foreground">适用于 Excel 分析</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* 数据导入 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              数据导入
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              从之前导出的 JSON 文件恢复数据
            </p>
            
            <label htmlFor="import-file">
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
              <Button 
                variant="outline"
                className="w-full h-12 justify-start"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <Upload className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">导入 JSON 文件</p>
                  <p className="text-xs text-muted-foreground">选择之前导出的文件</p>
                </div>
              </Button>
            </label>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                ⚠️ 导入数据会覆盖当前所有数据，请先导出备份
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 云端备份 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              数据备份（可选）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              将数据备份到云端，防止数据丢失
            </p>
            
            <Button 
              onClick={handleBackupToCloud}
              variant="outline"
              className="w-full h-12 justify-start"
            >
              <Upload className="h-5 w-5 mr-3 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">备份到云端</p>
                <p className="text-xs text-muted-foreground">保存当前数据</p>
              </div>
            </Button>
            
            <Button 
              onClick={handleRestoreFromCloud}
              variant="outline"
              className="w-full h-12 justify-start"
            >
              <Download className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <p className="font-medium">从云端恢复</p>
                <p className="text-xs text-muted-foreground">恢复备份的数据</p>
              </div>
            </Button>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 当前使用浏览器本地存储模拟云端备份功能
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 应用设置 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              应用设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">预算提醒</p>
                  <p className="text-sm text-muted-foreground">超出预算时通知</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">深色模式</p>
                  <p className="text-sm text-muted-foreground">保护眼睛</p>
                </div>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* 数据统计 */}
        <Card className="shadow-md bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">总交易数</p>
                <p className="text-2xl text-purple-600">{transactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">数据大小</p>
                <p className="text-2xl text-purple-600">
                  {(JSON.stringify(transactions).length / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 危险操作 */}
        <Card className="shadow-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              危险操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="w-full h-12"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  清除所有数据
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认清除所有数据？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将永久删除所有交易记录和设置，无法恢复。请确保已导出备份。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                    确认清除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <p className="text-sm text-muted-foreground mt-3 text-center">
              ⚠️ 清除后数据无法恢复
            </p>
          </CardContent>
        </Card>

        {/* 关于 */}
        <Card className="shadow-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg mb-2">📱 记账本 APP</p>
            <p className="text-sm text-muted-foreground">版本 1.0.0</p>
            <p className="text-xs text-muted-foreground mt-4">
              一个简单、实用的个人记账应用
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
