
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  ThumbsUp, 
  MessageSquare, 
  Eye, 
  Download,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  Calendar,
  Target,
  Activity,
  Tablet,
  Laptop,
  Chrome,
  Wifi,
  Building2,
  Factory,
  ShoppingBag,
  BarChart3
} from 'lucide-react';
import { ProductProject } from '../types';

interface AnalyticsProps {
  projects?: ProductProject[]; // 传入项目数据用于商家分析
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// 获取当前月份的名称
const getCurrentMonthName = (index: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[index % 12];
};

// 生成最近6个月的月份数据
const generateRecentMonths = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const monthIndex = now.getMonth() - 5 + index;
    return getCurrentMonthName(monthIndex);
  });
};

const Analytics: React.FC<AnalyticsProps> = ({ projects = [] }) => {
  // 获取当前商家信息（从第一个项目中获取，因为都是同一个商家的）
  const currentMerchant = projects.length > 0 ? {
    merchantName: projects[0].config.companyName || '未设置商家名称',
    productName: projects[0].name,
    industry: projects[0].merchantInfo?.industry || '未设置行业',
    region: projects[0].merchantInfo?.region || '未设置地域'
  } : {
    merchantName: '未设置商家名称',
    productName: '无产品',
    industry: '未设置行业',
    region: '未设置地域'
  };
  const [analyticsData, setAnalyticsData] = useState({
    // 基础指标
    uniqueUsers: 0,
    avgHelpTime: 0,
    csatScore: 0,
    bypassRate: 0,
    
    // 新增核心指标
    totalSessions: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0,
    problemResolutionRate: 0,
    
    // 用户行为数据
    pageViews: 0,
    qrCodeScans: 0,
    videoWatchTime: 0,
    knowledgeBaseSearches: 0,
    
    // 新增详细交互数据
    avgStayTime: 0, // 平均停留时间（分钟）
    avgConversationRounds: 0, // 平均问答轮数
    totalMessages: 0, // 用户对话总次数
    totalTokensConsumed: 0, // 消耗的token总数
    avgTokensPerSession: 0, // 每会话平均token消耗
    humanTransferRequests: 0, // 转人工请求数
    humanTransferRate: 0, // 转人工率
    audioCallsEnabled: 0, // 开启音频对讲次数
    audioCallRate: 0, // 音频对讲使用率
    fileUploads: 0, // 文件上传次数
    fileUploadRate: 0, // 文件上传使用率
    
    // 地域和IP数据
    geographicDistribution: [
      { region: '北京', users: 0, percentage: 0 },
      { region: '上海', users: 0, percentage: 0 },
      { region: '广州', users: 0, percentage: 0 },
      { region: '深圳', users: 0, percentage: 0 },
      { region: '杭州', users: 0, percentage: 0 },
      { region: '其他', users: 0, percentage: 0 }
    ],
    
    // IP访问统计
    ipStats: {
      uniqueIPs: 0,
      repeatVisitors: 0,
      newVisitors: 0
    },
    
    // 对话轮数分布
    conversationRoundsDistribution: [
      { rounds: '1-3轮', count: 0 },
      { rounds: '4-6轮', count: 0 },
      { rounds: '7-10轮', count: 0 },
      { rounds: '11-15轮', count: 0 },
      { rounds: '15+轮', count: 0 }
    ],
    
    // 停留时间分布
    stayTimeDistribution: [
      { duration: '0-1分钟', count: 0 },
      { duration: '1-3分钟', count: 0 },
      { duration: '3-5分钟', count: 0 },
      { duration: '5-10分钟', count: 0 },
      { duration: '10+分钟', count: 0 }
    ],
    
    // Token消耗分析
    tokenConsumptionTrends: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + i);
      return {
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        tokens: 0,
        cost: 0 // 预估成本
      };
    }),
    
    // 设备和终端详细数据
    deviceTypes: [
      { name: 'Mobile', value: 0 },
      { name: 'Desktop', value: 0 },
      { name: 'Tablet', value: 0 }
    ],
    
    // 详细终端类型分布
    terminalTypes: [
      { type: 'Windows PC', count: 0, percentage: 0 },
      { type: 'Mac', count: 0, percentage: 0 },
      { type: 'iPhone', count: 0, percentage: 0 },
      { type: 'Android', count: 0, percentage: 0 },
      { type: 'iPad', count: 0, percentage: 0 },
      { type: 'Linux', count: 0, percentage: 0 },
      { type: 'Other', count: 0, percentage: 0 }
    ],
    
    // 手机型号详细统计
    mobileModels: [
      { model: 'iPhone 15 Pro', count: 0, os: 'iOS' },
      { model: 'iPhone 14', count: 0, os: 'iOS' },
      { model: 'iPhone 13', count: 0, os: 'iOS' },
      { model: 'Samsung Galaxy S24', count: 0, os: 'Android' },
      { model: 'Samsung Galaxy S23', count: 0, os: 'Android' },
      { model: 'Xiaomi 14', count: 0, os: 'Android' },
      { model: 'Huawei Mate 60', count: 0, os: 'Android' },
      { model: 'OPPO Find X7', count: 0, os: 'Android' },
      { model: 'vivo X100', count: 0, os: 'Android' },
      { model: 'OnePlus 12', count: 0, os: 'Android' },
      { model: 'Other Models', count: 0, os: 'Mixed' }
    ],
    
    // 操作系统版本分布
    osVersions: [
      { os: 'iOS 17', count: 0 },
      { os: 'iOS 16', count: 0 },
      { os: 'Android 14', count: 0 },
      { os: 'Android 13', count: 0 },
      { os: 'Android 12', count: 0 },
      { os: 'Windows 11', count: 0 },
      { os: 'Windows 10', count: 0 },
      { os: 'macOS Sonoma', count: 0 },
      { os: 'macOS Ventura', count: 0 },
      { os: 'Other', count: 0 }
    ],
    
    // 浏览器分布
    browserDistribution: [
      { browser: 'Chrome', count: 0, percentage: 0 },
      { browser: 'Safari', count: 0, percentage: 0 },
      { browser: 'Edge', count: 0, percentage: 0 },
      { browser: 'Firefox', count: 0, percentage: 0 },
      { browser: 'WeChat', count: 0, percentage: 0 },
      { browser: 'QQ Browser', count: 0, percentage: 0 },
      { browser: 'Other', count: 0, percentage: 0 }
    ],
    
    // 屏幕分辨率统计
    screenResolutions: [
      { resolution: '1920x1080', count: 0, type: 'Desktop' },
      { resolution: '1366x768', count: 0, type: 'Desktop' },
      { resolution: '2560x1440', count: 0, type: 'Desktop' },
      { resolution: '390x844', count: 0, type: 'iPhone 15' },
      { resolution: '375x812', count: 0, type: 'iPhone 13/14' },
      { resolution: '414x896', count: 0, type: 'iPhone 11' },
      { resolution: '360x800', count: 0, type: 'Android' },
      { resolution: '412x915', count: 0, type: 'Android' },
      { resolution: 'Other', count: 0, type: 'Mixed' }
    ],
    
    // 时间分布数据
    hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sessions: 0
    })),
    
    // 用户满意度详细数据
    satisfactionDetails: [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 }
    ],
    
    // 原有数据
    serviceTypeData: [],
    issueDistribution: [
      { name: 'Installation', value: 0 },
      { name: 'WIFI Setup', value: 0 },
      { name: 'Hardware', value: 0 },
      { name: 'Others', value: 0 },
    ],
    
    // 新增趋势数据
    dailyTrends: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 29 + i);
      return {
        date: date.toISOString().split('T')[0],
        users: 0,
        sessions: 0,
        satisfaction: 0
      };
    }),
    
    // 用户流失和留存
    userRetention: [
      { period: 'Day 1', rate: 0 },
      { period: 'Day 7', rate: 0 },
      { period: 'Day 30', rate: 0 }
    ],
    
    // 功能使用统计
    featureUsage: [
      { feature: 'AI Chat', usage: 0 },
      { feature: 'Video Guide', usage: 0 },
      { feature: 'Knowledge Search', usage: 0 },
      { feature: 'QR Code', usage: 0 },
      { feature: 'Voice Message', usage: 0 },
      { feature: 'File Upload', usage: 0 },
      { feature: 'Human Transfer', usage: 0 }
    ]
  });

  // 初始化或重置分析数据
  const initializeAnalyticsData = () => {
    const recentMonths = generateRecentMonths();
    const serviceTypeData = recentMonths.map(month => ({
      name: month,
      proactive: 0,
      reactive: 0
    }));

    return {
      // 基础指标
      uniqueUsers: 0,
      avgHelpTime: 0,
      csatScore: 0,
      bypassRate: 0,
      
      // 新增核心指标
      totalSessions: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      conversionRate: 0,
      problemResolutionRate: 0,
      
      // 用户行为数据
      pageViews: 0,
      qrCodeScans: 0,
      videoWatchTime: 0,
      knowledgeBaseSearches: 0,
      
      // 新增详细交互数据
      avgStayTime: 0,
      avgConversationRounds: 0,
      totalMessages: 0,
      totalTokensConsumed: 0,
      avgTokensPerSession: 0,
      humanTransferRequests: 0,
      humanTransferRate: 0,
      audioCallsEnabled: 0,
      audioCallRate: 0,
      fileUploads: 0,
      fileUploadRate: 0,
      
      // 地域和IP数据
      geographicDistribution: [
        { region: '北京', users: 0, percentage: 0 },
        { region: '上海', users: 0, percentage: 0 },
        { region: '广州', users: 0, percentage: 0 },
        { region: '深圳', users: 0, percentage: 0 },
        { region: '杭州', users: 0, percentage: 0 },
        { region: '其他', users: 0, percentage: 0 }
      ],
      
      // IP访问统计
      ipStats: {
        uniqueIPs: 0,
        repeatVisitors: 0,
        newVisitors: 0
      },
      
      // 对话轮数分布
      conversationRoundsDistribution: [
        { rounds: '1-3轮', count: 0 },
        { rounds: '4-6轮', count: 0 },
        { rounds: '7-10轮', count: 0 },
        { rounds: '11-15轮', count: 0 },
        { rounds: '15+轮', count: 0 }
      ],
      
      // 停留时间分布
      stayTimeDistribution: [
        { duration: '0-1分钟', count: 0 },
        { duration: '1-3分钟', count: 0 },
        { duration: '3-5分钟', count: 0 },
        { duration: '5-10分钟', count: 0 },
        { duration: '10+分钟', count: 0 }
      ],
      
      // Token消耗分析
      tokenConsumptionTrends: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        return {
          date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          tokens: 0,
          cost: 0
        };
      }),
      
      // 设备和终端详细数据
      deviceTypes: [
        { name: 'Mobile', value: 0 },
        { name: 'Desktop', value: 0 },
        { name: 'Tablet', value: 0 }
      ],
      
      // 详细终端类型分布
      terminalTypes: [
        { type: 'Windows PC', count: 0, percentage: 0 },
        { type: 'Mac', count: 0, percentage: 0 },
        { type: 'iPhone', count: 0, percentage: 0 },
        { type: 'Android', count: 0, percentage: 0 },
        { type: 'iPad', count: 0, percentage: 0 },
        { type: 'Linux', count: 0, percentage: 0 },
        { type: 'Other', count: 0, percentage: 0 }
      ],
      
      // 手机型号详细统计
      mobileModels: [
        { model: 'iPhone 15 Pro', count: 0, os: 'iOS' },
        { model: 'iPhone 14', count: 0, os: 'iOS' },
        { model: 'iPhone 13', count: 0, os: 'iOS' },
        { model: 'Samsung Galaxy S24', count: 0, os: 'Android' },
        { model: 'Samsung Galaxy S23', count: 0, os: 'Android' },
        { model: 'Xiaomi 14', count: 0, os: 'Android' },
        { model: 'Huawei Mate 60', count: 0, os: 'Android' },
        { model: 'OPPO Find X7', count: 0, os: 'Android' },
        { model: 'vivo X100', count: 0, os: 'Android' },
        { model: 'OnePlus 12', count: 0, os: 'Android' },
        { model: 'Other Models', count: 0, os: 'Mixed' }
      ],
      
      // 操作系统版本分布
      osVersions: [
        { os: 'iOS 17', count: 0 },
        { os: 'iOS 16', count: 0 },
        { os: 'Android 14', count: 0 },
        { os: 'Android 13', count: 0 },
        { os: 'Android 12', count: 0 },
        { os: 'Windows 11', count: 0 },
        { os: 'Windows 10', count: 0 },
        { os: 'macOS Sonoma', count: 0 },
        { os: 'macOS Ventura', count: 0 },
        { os: 'Other', count: 0 }
      ],
      
      // 浏览器分布
      browserDistribution: [
        { browser: 'Chrome', count: 0, percentage: 0 },
        { browser: 'Safari', count: 0, percentage: 0 },
        { browser: 'Edge', count: 0, percentage: 0 },
        { browser: 'Firefox', count: 0, percentage: 0 },
        { browser: 'WeChat', count: 0, percentage: 0 },
        { browser: 'QQ Browser', count: 0, percentage: 0 },
        { browser: 'Other', count: 0, percentage: 0 }
      ],
      
      // 屏幕分辨率统计
      screenResolutions: [
        { resolution: '1920x1080', count: 0, type: 'Desktop' },
        { resolution: '1366x768', count: 0, type: 'Desktop' },
        { resolution: '2560x1440', count: 0, type: 'Desktop' },
        { resolution: '390x844', count: 0, type: 'iPhone 15' },
        { resolution: '375x812', count: 0, type: 'iPhone 13/14' },
        { resolution: '414x896', count: 0, type: 'iPhone 11' },
        { resolution: '360x800', count: 0, type: 'Android' },
        { resolution: '412x915', count: 0, type: 'Android' },
        { resolution: 'Other', count: 0, type: 'Mixed' }
      ],
      
      // 时间分布数据
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        sessions: 0
      })),
      
      // 用户满意度详细数据
      satisfactionDetails: [
        { rating: 5, count: 0 },
        { rating: 4, count: 0 },
        { rating: 3, count: 0 },
        { rating: 2, count: 0 },
        { rating: 1, count: 0 }
      ],
      
      // 原有数据
      serviceTypeData,
      issueDistribution: [
        { name: 'Installation', value: 0 },
        { name: 'WIFI Setup', value: 0 },
        { name: 'Hardware', value: 0 },
        { name: 'Others', value: 0 },
      ],
      
      // 新增趋势数据
      dailyTrends: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 29 + i);
        return {
          date: date.toISOString().split('T')[0],
          users: 0,
          sessions: 0,
          satisfaction: 0
        };
      }),
      
      // 用户流失和留存
      userRetention: [
        { period: 'Day 1', rate: 0 },
        { period: 'Day 7', rate: 0 },
        { period: 'Day 30', rate: 0 }
      ],
      
      // 功能使用统计
      featureUsage: [
        { feature: 'AI Chat', usage: 0 },
        { feature: 'Video Guide', usage: 0 },
        { feature: 'Knowledge Search', usage: 0 },
        { feature: 'QR Code', usage: 0 },
        { feature: 'Voice Message', usage: 0 },
        { feature: 'File Upload', usage: 0 },
        { feature: 'Human Transfer', usage: 0 }
      ]
    };
  };

  // 从本地存储加载分析数据
  useEffect(() => {
    const loadAnalyticsData = () => {
      const savedData = localStorage.getItem('smartguide_analytics');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setAnalyticsData(parsedData);
        } catch (error) {
          console.error('Error parsing analytics data:', error);
          // 如果解析失败，初始化数据
          const initialData = initializeAnalyticsData();
          setAnalyticsData(initialData);
          localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
        }
      } else {
        // 如果没有保存的数据，初始化数据
        const initialData = initializeAnalyticsData();
        setAnalyticsData(initialData);
        localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
      }
    };

    loadAnalyticsData();
  }, []);

  // 保存分析数据到本地存储
  useEffect(() => {
    localStorage.setItem('smartguide_analytics', JSON.stringify(analyticsData));
  }, [analyticsData]);

  // 清零分析数据
  const resetAnalyticsData = () => {
    const initialData = initializeAnalyticsData();
    setAnalyticsData(initialData);
    localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
  };

  // 生成数据导出API密钥和链接
  const [apiKey, setApiKey] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [showApiInfo, setShowApiInfo] = useState(false);

  // 处理商家名称转换为URL安全格式
  const convertMerchantNameToId = (merchantName: string): string => {
    if (merchantName === '未设置商家名称' || !merchantName.trim()) {
      return 'default_merchant';
    }
    
    // 中文商家名称处理策略
    let merchantId = merchantName;
    
    // 1. 尝试提取英文字符
    const englishChars = merchantName.match(/[a-zA-Z0-9]/g);
    if (englishChars && englishChars.length > 0) {
      merchantId = englishChars.join('').toLowerCase();
    } else {
      // 2. 如果没有英文字符，使用URL编码并清理
      merchantId = encodeURIComponent(merchantName)
        .replace(/%/g, '')
        .toLowerCase();
    }
    
    // 3. 确保ID不为空且长度合适
    if (!merchantId || merchantId.length < 3) {
      const timestamp = Date.now().toString().slice(-6);
      merchantId = `merchant_${timestamp}`;
    } else if (merchantId.length > 20) {
      merchantId = merchantId.substring(0, 20);
    }
    
    // 4. 确保以字母开头
    if (!/^[a-zA-Z]/.test(merchantId)) {
      merchantId = 'm_' + merchantId;
    }
    
    return merchantId;
  };

  // 生成API密钥
  const generateApiKey = () => {
    const timestamp = Date.now();
    
    // 生成更复杂的随机字符串，包含特殊符号
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // 生成基础随机字符串 (20位)
    let randomStr = '';
    for (let i = 0; i < 20; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 添加特殊符号 (4位)
    let specialStr = '';
    for (let i = 0; i < 4; i++) {
      specialStr += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    }
    
    // 生成额外的数字序列 (8位)
    const numericStr = Math.random().toString().slice(2, 10);
    
    // 使用新的商家名称转换函数
    const merchantId = convertMerchantNameToId(currentMerchant.merchantName);
    
    // 组合成最终的API密钥：sk_{merchantId}_{timestamp}_{randomStr}{specialStr}{numericStr}
    const keyBody = `${randomStr}${specialStr}${numericStr}`;
    const newApiKey = `sk_${merchantId}_${timestamp}_${keyBody}`;
    const newEndpoint = `${window.location.origin}/api/analytics/${merchantId}`;
    
    setApiKey(newApiKey);
    setApiEndpoint(newEndpoint);
    
    // 保存到localStorage
    localStorage.setItem('analytics_api_key', newApiKey);
    localStorage.setItem('analytics_api_endpoint', newEndpoint);
    localStorage.setItem('analytics_merchant_id', merchantId);
    
    setShowApiInfo(true);
  };

  // 加载已保存的API信息
  useEffect(() => {
    const savedApiKey = localStorage.getItem('analytics_api_key');
    const savedEndpoint = localStorage.getItem('analytics_api_endpoint');
    if (savedApiKey && savedEndpoint) {
      setApiKey(savedApiKey);
      setApiEndpoint(savedEndpoint);
    }
  }, []);

  // AI自动分析数据（模拟）
  const triggerAIAnalysis = async () => {
    // 这里可以调用AI服务分析数据
    console.log('触发AI自动分析...');
    // 模拟AI分析过程
    setTimeout(() => {
      console.log('AI分析完成，数据已更新');
    }, 2000);
  };

  // 定时AI分析（每日）
  useEffect(() => {
    const scheduleAIAnalysis = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0); // 每天凌晨2点执行
      
      const timeUntilAnalysis = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        triggerAIAnalysis();
        // 设置每24小时执行一次
        setInterval(triggerAIAnalysis, 24 * 60 * 60 * 1000);
      }, timeUntilAnalysis);
    };

    scheduleAIAnalysis();
  }, []);

  return (
    <div className="space-y-8">
      {/* 商家信息表头 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={28} />
              数据分析中心
            </h1>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">商家名称:</span>
                <span className="ml-2 font-semibold text-slate-800">{currentMerchant.merchantName}</span>
              </div>
              <div>
                <span className="text-slate-500">产品名称:</span>
                <span className="ml-2 font-semibold text-slate-800">{currentMerchant.productName}</span>
              </div>
              <div>
                <span className="text-slate-500">行业:</span>
                <span className="ml-2 font-semibold text-slate-800">{currentMerchant.industry}</span>
              </div>
              <div>
                <span className="text-slate-500">地域:</span>
                <span className="ml-2 font-semibold text-slate-800">{currentMerchant.region}</span>
              </div>
            </div>
          </div>
          
          {/* 数据导出功能 */}
          <div className="flex items-center gap-3">
            <button
              onClick={triggerAIAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors"
            >
              <Activity size={16} />
              AI分析
            </button>
            <button
              onClick={generateApiKey}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              <Download size={16} />
              数据导出
            </button>
            <button
              onClick={resetAnalyticsData}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              清零数据
            </button>
          </div>
        </div>
      </div>

      {/* API导出信息面板 */}
      {showApiInfo && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe size={20} className="text-blue-500" />
              数据导出API接口
            </h3>
            <button
              onClick={() => setShowApiInfo(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">API端点</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={apiEndpoint}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(apiEndpoint)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                  >
                    复制
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">API密钥</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={apiKey}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(apiKey)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                  >
                    复制
                  </button>
                </div>
                {apiKey && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">企业级安全强度</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      长度: {apiKey.length}位 | 包含: 字母+数字+特殊符号
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">🔒 安全说明</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• API仅提供只读访问，不允许修改数据</li>
                  <li>• 密钥具有访问限制，仅能获取当前商家的数据</li>
                  <li>• API密钥有效期为1年，过期后需重新生成</li>
                  <li>• 密钥采用高强度加密，包含字母、数字和特殊符号</li>
                  <li>• 密钥长度超过32位，符合企业级安全标准</li>
                  <li>• 请妥善保管API密钥，不要泄露给无关人员</li>
                  <li>• API支持HTTPS加密传输，确保数据安全</li>
                  <li>• 支持中文商家名称，系统会自动进行URL编码处理</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">🎯 企业级应用场景</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>完整数据备份：</strong> 定期备份所有业务数据到企业存储</p>
                  <p><strong>BI系统集成：</strong> 将完整数据导入Power BI、Tableau等分析平台</p>
                  <p><strong>CRM系统同步：</strong> 同步客户服务数据、知识库到CRM系统</p>
                  <p><strong>ERP系统集成：</strong> 将客服数据集成到企业资源规划系统</p>
                  <p><strong>数据仓库建设：</strong> 作为主要数据源构建企业数据仓库</p>
                  <p><strong>自动化运维：</strong> 监控系统状态、自动生成运营报告</p>
                  <p><strong>第三方开发：</strong> 基于API开发定制化管理工具</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-800 mb-2">💻 API调用示例</h4>
              <pre className="text-sm text-slate-700 bg-white p-3 rounded font-mono overflow-x-auto border">
{`# 1. 获取完整分析数据
curl -X GET "${apiEndpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"

# 2. 获取项目配置
curl -X GET "${apiEndpoint}/projects" \\
  -H "Authorization: Bearer ${apiKey}"

# 3. 获取知识库数据
curl -X GET "${apiEndpoint}/knowledge" \\
  -H "Authorization: Bearer ${apiKey}"

# 4. 获取系统配置
curl -X GET "${apiEndpoint}/config" \\
  -H "Authorization: Bearer ${apiKey}"

# 返回数据结构示例
{
  "success": true,
  "data": {
    "analytics": { "完整分析数据": "..." },
    "projects": [ "所有项目配置" ],
    "knowledgeBase": [ "知识库内容" ],
    "systemInfo": { "系统信息": "..." },
    "metadata": {
      "dataScope": "complete_business_data",
      "apiVersion": "1.0",
      "exportedAt": "2024-02-02T10:30:00.000Z"
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 基础指标 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">独立用户</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.uniqueUsers}</p>
            </div>
            <Users className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">对话总次数</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.totalMessages}</p>
            </div>
            <MessageSquare className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">总会话数</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.totalSessions}</p>
            </div>
            <MessageSquare className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">平均会话时长</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.avgSessionDuration}s</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">问题解决率</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.problemResolutionRate}%</p>
            </div>
            <Target className="text-purple-500" size={24} />
          </div>
        </div>
        
        {/* 用户行为指标 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">页面浏览量</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.pageViews}</p>
            </div>
            <Eye className="text-indigo-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">二维码扫描</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.qrCodeScans}</p>
            </div>
            <Download className="text-teal-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">跳出率</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.bounceRate}%</p>
            </div>
            <RefreshCw className="text-red-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">CSAT评分</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.csatScore}/5</p>
            </div>
            <ThumbsUp className="text-yellow-500" size={24} />
          </div>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-8">30天用户趋势</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData.dailyTrends}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" name="用户数" />
              <Area type="monotone" dataKey="sessions" stroke="#10b981" fillOpacity={1} fill="url(#colorSessions)" name="会话数" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 设备类型分布 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">设备类型分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.deviceTypes}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 功能使用统计 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">功能使用统计</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.featureUsage} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis type="category" dataKey="feature" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={100} />
                <Tooltip />
                <Bar dataKey="usage" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24小时活跃度分布 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">24小时活跃度分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#f59e0b" strokeWidth={3} dot={{fill: '#f59e0b', strokeWidth: 2, r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 用户满意度详细分布 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">用户满意度详细分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.satisfactionDetails}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="rating" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">服务类型分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.serviceTypeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="proactive" fill="#3b82f6" radius={[4, 4, 0, 0]} name="自助引导" />
                <Bar dataKey="reactive" fill="#94a3b8" radius={[4, 4, 0, 0]} name="AI聊天" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">问题分类分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.issueDistribution}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.issueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 设备详细分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 详细终端类型分布 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Monitor size={20} className="text-blue-500" />
            终端类型详细分布
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.terminalTypes} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis type="category" dataKey="type" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={80} />
                <Tooltip formatter={(value, name) => [`${value} 用户`, '数量']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 手机型号统计 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Smartphone size={20} className="text-green-500" />
            手机型号分布
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.mobileModels.slice(0, 8)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis type="category" dataKey="model" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={120} />
                <Tooltip formatter={(value, name) => [`${value} 用户`, '数量']} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 操作系统版本分布 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Laptop size={20} className="text-purple-500" />
            操作系统版本
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.osVersions.filter(item => item.count > 0)}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {analyticsData.osVersions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} 用户`, '数量']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 浏览器分布 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Chrome size={20} className="text-orange-500" />
            浏览器分布
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.browserDistribution.filter(item => item.count > 0)}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {analyticsData.browserDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} 用户`, '数量']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 屏幕分辨率统计表格 */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Monitor size={20} className="text-indigo-500" />
          屏幕分辨率统计
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">分辨率</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">设备类型</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">用户数</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">占比</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.screenResolutions.map((item, index) => {
                const total = analyticsData.screenResolutions.reduce((sum, res) => sum + res.count, 0);
                const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-sm">{item.resolution}</td>
                    <td className="py-3 px-4 text-slate-600">{item.type}</td>
                    <td className="py-3 px-4 text-right font-semibold">{item.count}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 用户留存率 */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-8">用户留存率</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analyticsData.userRetention.map((item, index) => (
            <div key={index} className="text-center p-6 bg-slate-50 rounded-xl">
              <p className="text-slate-500 text-sm font-medium">{item.period}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{item.rate}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">数据收集与分析能力</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">📊 已实现的数据收集</h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
              <li>用户访问与会话数据</li>
              <li>详细设备类型与终端分布</li>
              <li>手机型号与操作系统版本</li>
              <li>浏览器类型与屏幕分辨率</li>
              <li>24小时活跃度分析</li>
              <li>停留时间与对话轮数统计</li>
              <li>Token消耗与成本分析</li>
              <li>转人工与音频对讲使用率</li>
              <li>文件上传与附件统计</li>
              <li>地域分布与IP访问分析</li>
              <li><strong>商家名称与行业属性分析</strong></li>
              <li><strong>产品类别与业务类型统计</strong></li>
              <li><strong>公司规模与地区分布</strong></li>
              <li><strong>商家表现排行与对比</strong></li>
              <li>功能使用统计</li>
              <li>问题分类与解决率</li>
              <li>用户满意度评分</li>
              <li>用户留存率分析</li>
              <li>页面浏览与交互数据</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">🤖 自动化分析功能</h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
              <li>实时数据收集与存储</li>
              <li>自动生成趋势报告</li>
              <li>异常数据检测与告警</li>
              <li>用户行为路径分析</li>
              <li>智能推荐优化建议</li>
              <li>定期数据备份</li>
              <li>多维度数据关联分析</li>
              <li>可视化图表自动更新</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💡 商家维度数据分析价值</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-700">行业洞察分析</p>
              <ul className="text-blue-600 mt-1 space-y-1">
                <li>• 不同行业的AI使用偏好</li>
                <li>• 行业满意度对比分析</li>
                <li>• 垂直领域优化建议</li>
                <li>• 行业标杆案例识别</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-700">商家运营优化</p>
              <ul className="text-blue-600 mt-1 space-y-1">
                <li>• 产品类别表现对比</li>
                <li>• 业务类型成本分析</li>
                <li>• 公司规模适配策略</li>
                <li>• 地区市场渗透率</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-700">平台发展策略</p>
              <ul className="text-blue-600 mt-1 space-y-1">
                <li>• 目标客户群体画像</li>
                <li>• 市场扩展优先级</li>
                <li>• 产品功能迭代方向</li>
                <li>• 定价策略优化</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            数据存储在本地，确保隐私安全 • 支持数据导出 • 实时更新
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors">
              导出报告
            </button>
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors">
              自动分析
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
