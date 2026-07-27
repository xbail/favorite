import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Bot, Key, Globe, Sparkles, PauseCircle, Wrench, Box, Copy, Check, Settings, Clock, Lock, LayoutGrid, MessageCircle, Cloud, BookOpen, Upload, CloudCog, LogOut, Download, Inbox, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { AIConfig, LinkItem, PasswordExpiryConfig, MastodonConfig, WeatherConfig } from '../types';
import { generateLinkDescription } from '../services/geminiService';
import { toast } from './Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
  links: LinkItem[];
  onUpdateLinks: (links: LinkItem[]) => void;
  passwordExpiryConfig: PasswordExpiryConfig;
  onSavePasswordExpiry: (config: PasswordExpiryConfig) => void;
  authToken: string | null;
  showPinnedWebsites: boolean;
  onShowPinnedWebsitesChange: (show: boolean) => void;
  mastodonConfig: MastodonConfig;
  onMastodonConfigChange: (config: Partial<MastodonConfig>) => void;
  weatherConfig: WeatherConfig;
  onWeatherConfigChange: (config: Partial<WeatherConfig>) => void;
  onImportClick: () => void;
  onBackupClick: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, config, onSave, links, onUpdateLinks, passwordExpiryConfig, onSavePasswordExpiry, authToken, showPinnedWebsites, onShowPinnedWebsitesChange, mastodonConfig, onMastodonConfigChange, weatherConfig, onWeatherConfigChange, onImportClick, onBackupClick
}) => {
  console.log('SettingsModal rendering. isOpen:', isOpen, 'authToken:', authToken, 'config:', config);
  const [activeTab, setActiveTab] = useState<'tools' | 'website' | 'review'>('website');
  const [localConfig, setLocalConfig] = useState<AIConfig>(config || {});
  const [localPasswordExpiryConfig, setLocalPasswordExpiryConfig] = useState<PasswordExpiryConfig>(passwordExpiryConfig || { value: 1, unit: 'week' });
  const [defaultViewMode, setDefaultViewMode] = useState<'compact' | 'detailed'>('compact');
  const [localMastodonConfig, setLocalMastodonConfig] = useState<MastodonConfig>(mastodonConfig || { enabled: false });
  const [mastodonInputValue, setMastodonInputValue] = useState<string>(
    (mastodonConfig && mastodonConfig.username && mastodonConfig.instance) ?
    `@${mastodonConfig.username}@${mastodonConfig.instance}` : ''
  );
  const [localWeatherConfig, setLocalWeatherConfig] = useState<WeatherConfig>(weatherConfig || { enabled: false });

  // Bulk Generation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const shouldStopRef = useRef(false);

  // Tools State
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [showExtCode, setShowExtCode] = useState(true);

  // Copy feedback states
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  // Auth State (Moved to top to fix Rules of Hooks)
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ===== 申请审核 State =====
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [reviewCategories, setReviewCategories] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 加载待审核申请
  const loadPendingSubmissions = async () => {
    if (!authToken) return;
    setLoadingPending(true);
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-password': authToken },
        body: JSON.stringify({ operation: 'listPending' }),
      });
      if (res.ok) {
        const data = await res.json();
        setPendingSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('加载待审核申请失败:', e);
    } finally {
      setLoadingPending(false);
    }
  };

  // 加载分类列表（审核时选择目标分类）
  const loadReviewCategories = async () => {
    try {
      const res = await fetch('/api/storage?getConfig=categories');
      if (res.ok) {
        const data = await res.json();
        setReviewCategories(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('加载分类失败:', e);
    }
  };

  // 通过审核
  const handleApprove = async (id: string, categoryId: string) => {
    if (!authToken) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-password': authToken },
        body: JSON.stringify({ operation: 'approveLink', id, categoryId }),
      });
      if (res.ok) {
        setPendingSubmissions(prev => prev.filter(p => p.id !== id));
        toast('已通过审核并添加到导航', 'success');
      } else {
        toast('操作失败', 'error');
      }
    } catch (e) {
      toast('操作失败', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // 拒绝审核
  const handleReject = async (id: string) => {
    if (!authToken) return;
    if (!confirm('确定拒绝这条申请吗？')) return;
    setProcessingId(id);
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-password': authToken },
        body: JSON.stringify({ operation: 'rejectLink', id }),
      });
      if (res.ok) {
        setPendingSubmissions(prev => prev.filter(p => p.id !== id));
        toast('已拒绝该申请', 'success');
      } else {
        toast('操作失败', 'error');
      }
    } catch (e) {
      toast('操作失败', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // 切换到审核 tab 时加载数据
  useEffect(() => {
    if (isOpen && activeTab === 'review' && authToken) {
      loadPendingSubmissions();
      loadReviewCategories();
    }
  }, [isOpen, activeTab, authToken]);

  useEffect(() => {
    if (isOpen) {
      if (config) {
        setLocalConfig(config);
        // 从 AI 配置中读取默认视图模式设置
        if (config.defaultViewMode === 'detailed' || config.defaultViewMode === 'compact') {
          setDefaultViewMode(config.defaultViewMode);
        } else {
          setDefaultViewMode('compact'); // 默认值
        }
      }
      if (passwordExpiryConfig) setLocalPasswordExpiryConfig(passwordExpiryConfig);
      if (mastodonConfig) {
        setLocalMastodonConfig(mastodonConfig);
        setMastodonInputValue(
          mastodonConfig.username && mastodonConfig.instance ?
          `@${mastodonConfig.username}@${mastodonConfig.instance}` : ''
        );
      }
      if (weatherConfig) setLocalWeatherConfig(weatherConfig);
      
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
      shouldStopRef.current = false;
      setDomain(window.location.origin);
      const storedToken = localStorage.getItem('cloudnav_auth_token');
      if (storedToken) setPassword(storedToken);
    }
  }, [isOpen, config, passwordExpiryConfig, mastodonConfig, weatherConfig, authToken]);

  const handleChange = (key: keyof AIConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordExpiryChange = (key: keyof PasswordExpiryConfig, value: string | number) => {
    setLocalPasswordExpiryConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleMastodonConfigChange = (key: keyof MastodonConfig, value: boolean | string | number) => {
    setLocalMastodonConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleWeatherConfigChange = (key: keyof WeatherConfig, value: boolean | string) => {
    setLocalWeatherConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // 将默认视图模式包含在 AI 配置中一起保存
    const configWithViewMode = {
      ...localConfig,
      defaultViewMode: defaultViewMode
    };
    onSave(configWithViewMode);
    onSavePasswordExpiry(localPasswordExpiryConfig);
    onMastodonConfigChange(localMastodonConfig);
    onWeatherConfigChange(localWeatherConfig);
    onClose();
  };

  // 处理退出登录
  const handleLogout = () => {
    // 清除本地存储的认证信息
    localStorage.removeItem('cloudnav_auth_token');
    localStorage.removeItem('lastLoginTime');

    // 触发页面刷新或状态更新
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isAuthenticated: false } }));

    // 关闭设置模态框
    onClose();

    // 显示退出成功提示
    toast.success('已成功退出登录');
  };

  const handleBulkGenerate = async () => {
    if (!localConfig.apiKey) {
        toast.warning("请先配置并保存 API Key");
        return;
    }

    const missingLinks = links.filter(l => !l.description);
    if (missingLinks.length === 0) {
        toast.info("所有链接都已有描述！");
        return;
    }

    if (!confirm(`发现 ${missingLinks.length} 个链接缺少描述，确定要使用 AI 自动生成吗？这可能需要一些时间。`)) return;

    setIsProcessing(true);
    shouldStopRef.current = false;
    setProgress({ current: 0, total: missingLinks.length });

    let currentLinks = [...links];

    for (let i = 0; i < missingLinks.length; i++) {
        if (shouldStopRef.current) break;

        const link = missingLinks[i];
        try {
            const desc = await generateLinkDescription(link.title, link.url, localConfig);
            currentLinks = currentLinks.map(l => l.id === link.id ? { ...l, description: desc } : l);
            onUpdateLinks(currentLinks);
            setProgress({ current: i + 1, total: missingLinks.length });
        } catch (e) {
            console.error(`Failed to generate for ${link.title}`, e);
        }
    }

    setIsProcessing(false);
  };

  const handleStop = () => {
      shouldStopRef.current = true;
      setIsProcessing(false);
  };

  const handleCopy = (text: string, key: string) => {
      navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
  };

  const handleDownload = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleTestAI = async () => {
    if (!localConfig.apiKey) {
        toast.warning("请先输入 API Key");
        return;
    }

    try {
        // 导入 generateLinkDescription 来测试连接
        const { generateLinkDescription } = await import('../services/geminiService');
        const testTitle = "测试链接";
        const testUrl = "https://example.com";

        toast.info("正在测试 AI 连接...");
        const description = await generateLinkDescription(testTitle, testUrl, localConfig);

        if (description) {
            toast.success("AI 服务连接成功！");
        } else {
            toast.error("AI 服务返回空结果，请检查配置");
        }
    } catch (error: any) {
        console.error("AI 测试失败：", error);
        toast.error(`AI 服务测试失败：${error.message || "未知错误"}`);
    }
  };

  // --- Chrome Extension Code Generators ---

  // 根据当前域名和密码生成插件代码
  const getCurrentDomain = () => {
    // 尝试获取当前域名
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    // 回退到预设值
    return 'https://s.eallion.com'; // 替换为您的实际域名
  };

  const currentDomain = domain || getCurrentDomain();
  const currentPassword = password || '请输入密码';

  const extManifest = `{
  "manifest_version": 3,
  "name": "CloudNav Assistant",
  "version": "3.0",
  "permissions": ["activeTab"],
  "host_permissions": ["${currentDomain}/*"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "保存到 CloudNav"
  }
}`;

  const extPopupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 320px; padding: 16px; font-family: -apple-system, sans-serif; background: #f8fafc; }
    h3 { margin: 0 0 16px 0; font-size: 16px; color: #0f172a; }
    label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
    input, select { width: 100%; margin-bottom: 12px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
    button { width: 100%; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #2563eb; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    #status { margin-top: 12px; text-align: center; font-size: 12px; min-height: 18px; }
    .error { color: #ef4444; }
    .success { color: #22c55e; }
  </style>
</head>
<body>
  <h3>保存到 CloudNav</h3>

  <label>标题</label>
  <input type="text" id="title" placeholder="网站标题">

  <label>分类</label>
  <select id="category">
    <option value="" disabled selected>加载分类中...</option>
  </select>

  <button id="saveBtn">保存书签</button>
  <div id="status"></div>

  <script src="popup.js"></script>
</body>
</html>`;

  const extPopupJs = `const CONFIG = {
  apiBase: "${currentDomain}",
  password: "${currentPassword}"
};

document.addEventListener('DOMContentLoaded', async () => {
  const titleInput = document.getElementById('title');
  const catSelect = document.getElementById('category');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  let currentTabUrl = '';

  // 1. Get Current Tab Info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    titleInput.value = tab.title || '';
    currentTabUrl = tab.url || '';
  }

  // 2. Fetch Categories from CloudNav
  try {
    const res = await fetch(\`\${CONFIG.apiBase}/api/storage?checkAuth=true\`, {
      method: 'GET'
    });

    const authData = await res.json();

    // Try with password
    const dataRes = await fetch(\`\${CONFIG.apiBase}/api/storage?getConfig=true&readOnly=true\`, {
      method: 'GET'
    });

    if (!dataRes.ok) throw new Error('Failed to fetch categories.');

    const data = await dataRes.json();

    catSelect.innerHTML = '';
    // Sort categories: Common first, then others
    const sorted = data.categories.sort((a,b) => {
        if(a.id === 'common') return -1;
        if(b.id === 'common') return 1;
        return 0;
    });

    sorted.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });

    // Select 'common' by default if exists
    catSelect.value = 'common';

  } catch (e) {
    statusDiv.textContent = 'Error: ' + e.message;
    statusDiv.className = 'error';
    catSelect.innerHTML = '<option>Load failed</option>';
    saveBtn.disabled = true;
  }

  // 3. Save Handler
  saveBtn.addEventListener('click', async () => {
    const catId = catSelect.value;
    const title = titleInput.value;

    if (!currentTabUrl) return;

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
    statusDiv.textContent = '';

    try {
      const res = await fetch(\`\${CONFIG.apiBase}/api/storage\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-password': CONFIG.password
        },
        body: JSON.stringify({
          action: 'addLink',
          link: {
            title: title,
            url: currentTabUrl,
            categoryId: catId
          }
        })
      });

      if (res.ok) {
        statusDiv.textContent = '保存成功！';
        statusDiv.className = 'success';
        setTimeout(() => window.close(), 1200);
      } else {
        throw new Error(res.statusText);
      }
    } catch (e) {
      statusDiv.textContent = '保存失败：' + e.message;
      statusDiv.className = 'error';
      saveBtn.disabled = false;
      saveBtn.textContent = '保存书签';
    }
  });
});`;

  if (!isOpen) return null;

  // 未登录用户必须先输入密码
  const needsAuth = !authToken;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: authPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // 触发父组件的认证成功回调
          window.dispatchEvent(new CustomEvent('authSuccess', { detail: { token: data.token } }));
          // 登录成功后不关闭模态框，而是留在设置页面
          // onClose();
        }
      } else {
        setAuthError('密码错误');
      }
    } catch (err) {
      setAuthError('认证失败');
    } finally {
      setAuthLoading(false);
    }
  };

  // 如果没有认证令牌，显示密码输入框
  if (needsAuth) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            管理员登录
          </h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                管理员密码
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入管理员密码"
                required
              />
            </div>
            {authError && (
              <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={authLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {authLoading ? '登录中...' : '登录'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 已登录用户显示完整的设置面板
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            设置面板
          </h2>
          <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('website')}
                className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'website' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Settings size={18} /> 网站设置
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'tools' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Wrench size={18} /> 扩展工具
              </button>
              {authToken && (
                <button
                  onClick={() => setActiveTab('review')}
                  className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'review' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  <Inbox size={18} /> 申请审核
                </button>
              )}
            </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
              title="退出登录"
              aria-label="退出登录"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="关闭设置"
              aria-label="关闭设置"
            >
              <X className="w-5 h-5 dark:text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto min-h-[300px]">

            {activeTab === 'tools' && (
                authToken ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            第一步：配置生成参数
                        </label>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    访问密码 (用于生成代码)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest"
                                    placeholder="部署时设置的 PASSWORD"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    网站域名 (可选)
                                </label>
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    placeholder={currentDomain || 'https://s.eallion.com'}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    留空将使用当前域名：{currentDomain}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold dark:text-white mb-2 text-sm flex items-center gap-2">
                            <Box size={16} /> Chrome 扩展 (弹窗选择版)
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            在本地创建一个文件夹，创建以下 3 个文件，然后使用"加载已解压的扩展程序"安装。
                            <br/>此扩展允许您点击图标后<strong>手动选择分类</strong>保存。
                        </p>

                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            {/* File 1: Manifest */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-mono font-bold text-slate-500">1. manifest.json</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopy(extManifest, 'manifest')}
                                            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 text-slate-600 dark:text-slate-300"
                                        >
                                            {copiedStates['manifest'] ? <Check size={12}/> : <Copy size={12}/>} 复制
                                        </button>
                                        <button
                                            onClick={() => handleDownload(extManifest, 'manifest.json')}
                                            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-green-100 text-slate-600 dark:text-slate-300"
                                            title="下载文件"
                                        >
                                            <Download size={12}/> 下载
                                        </button>
                                    </div>
                                </div>
                                <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700">
                                    {extManifest}
                                </pre>
                            </div>

                            {/* File 2: Popup HTML */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-mono font-bold text-slate-500">2. popup.html</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopy(extPopupHtml, 'popuphtml')}
                                            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 text-slate-600 dark:text-slate-300"
                                        >
                                            {copiedStates['popuphtml'] ? <Check size={12}/> : <Copy size={12}/>} 复制
                                        </button>
                                        <button
                                            onClick={() => handleDownload(extPopupHtml, 'popup.html')}
                                            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-green-100 text-slate-600 dark:text-slate-300"
                                            title="下载文件"
                                        >
                                            <Download size={12}/> 下载
                                        </button>
                                    </div>
                                </div>
                                <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700">
                                    {extPopupHtml}
                                </pre>
                            </div>

                            {/* File 3: Popup JS */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-mono font-bold text-slate-500">3. popup.js</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopy(extPopupJs, 'popupjs')}
                                            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 text-slate-600 dark:text-slate-300"
                                        >
                                            {copiedStates['popupjs'] ? <Check size={12}/> : <Copy size={12}/>} 复制
                                        </button>
                                        <button
                                            onClick={() => handleDownload(extPopupJs, 'popup.js')}
                                            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-green-100 text-slate-600 dark:text-slate-300"
                                            title="下载文件"
                                        >
                                            <Download size={12}/> 下载
                                        </button>
                                    </div>
                                </div>
                                <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700">
                                    {extPopupJs}
                                </pre>
                            </div>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <Wrench size={24} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">需要登录访问</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">扩展工具需要管理员权限</p>
                    <button
                        onClick={handleLoginPrompt}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        立即登录
                    </button>
                  </div>
                )
            )}

            {/* ===== 申请审核 Tab ===== */}
            {activeTab === 'review' && authToken && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">网址收录申请</h3>
                    <p className="text-xs text-slate-400 mt-0.5">访客通过「申请收录网址」提交的待审核链接</p>
                  </div>
                  <button
                    onClick={loadPendingSubmissions}
                    className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-1"
                  >
                    <Loader2 size={12} className={loadingPending ? 'animate-spin' : 'hidden'} />
                    刷新
                  </button>
                </div>

                {loadingPending && pendingSubmissions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    加载中...
                  </div>
                ) : pendingSubmissions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">暂无待审核申请</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSubmissions.map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{item.title}</span>
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 shrink-0">
                                <ExternalLink size={12} />
                              </a>
                            </div>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 hover:underline truncate mt-0.5">
                              {item.url}
                            </a>
                            {item.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(item.submittedAt).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <select
                            id={`cat-${item.id}`}
                            defaultValue={item.categoryId || 'common'}
                            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {reviewCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const sel = document.getElementById(`cat-${item.id}`) as HTMLSelectElement;
                              handleApprove(item.id, sel?.value || 'common');
                            }}
                            disabled={processingId === item.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {processingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={processingId === item.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            拒绝
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'website' && (
                <div className="space-y-6">

                    <div>
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <Settings size={16} /> 浏览器标签标题设置
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            配置浏览器标签页显示的网站标题，让您的书签管理器更具个性化。
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    网站标题
                                </label>
                                <input
                                    type="text"
                                    value={localConfig?.websiteTitle || ''}
                                    onChange={(e) => handleChange('websiteTitle', e.target.value)}
                                    placeholder="CloudNav - 我的导航"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    显示在浏览器标签页上的标题
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    网页导航名称
                                </label>
                                <input
                                    type="text"
                                    value={localConfig?.navigationName || ''}
                                    onChange={(e) => handleChange('navigationName', e.target.value)}
                                    placeholder="CloudNav"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    显示在网页左上角的导航名称
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    网站图标 (Favicon URL)
                                </label>
                                <input
                                    type="text"
                                    value={localConfig?.faviconUrl || ''}
                                    onChange={(e) => handleChange('faviconUrl', e.target.value)}
                                    placeholder="/favicon.ico"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    网站图标的 URL 地址
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <Clock size={16} /> 密码过期时间设置
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            配置访问密码的过期时间，提高安全性。设置为"永久"则密码不会过期。
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    过期时间数值
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={localPasswordExpiryConfig?.value}
                                    onChange={(e) => handlePasswordExpiryChange('value', parseInt(e.target.value) || 1)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    密码过期的具体数值
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    过期时间单位
                                </label>
                                <select
                                    value={localPasswordExpiryConfig?.unit}
                                    onChange={(e) => handlePasswordExpiryChange('unit', e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="day">天</option>
                                    <option value="week">周</option>
                                    <option value="month">月</option>
                                    <option value="year">年</option>
                                    <option value="permanent">永久</option>
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    选择密码过期的时间单位
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <LayoutGrid size={16} /> 置顶网站设置
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            配置置顶网站的显示或隐藏状态。
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={() => onShowPinnedWebsitesChange(!showPinnedWebsites)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                                    showPinnedWebsites
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <div className="p-1">
                                    <LayoutGrid size={18} />
                                </div>
                                <span>{showPinnedWebsites ? '隐藏置顶网站' : '显示置顶网站'}</span>
                            </button>
                            <p className="text-xs text-slate-500 mt-2">
                                {showPinnedWebsites ? '置顶的网站将在页面顶部显示' : '置顶的网站将被隐藏，但仍可通过分类访问'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <MessageCircle size={16} /> Mastodon Ticker 设置
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            配置右上角滚动显示的 Mastodon 动态，让访客看到您最新的分享内容。
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localMastodonConfig?.enabled}
                                        onChange={(e) => handleMastodonConfigChange('enabled', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <span className="text-sm font-medium dark:text-slate-300">启用 Mastodon Ticker</span>
                                </label>
                                <p className="text-xs text-slate-500 mt-1 ml-7">
                                    是否在页面右上角显示滚动的 Mastodon 动态
                                </p>
                            </div>

                            {localMastodonConfig?.enabled && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Mastodon 实例和用户名
                                        </label>
                                        <input
                                            type="text"
                                            value={mastodonInputValue}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setMastodonInputValue(value);

                                                if (value === '') {
                                                    // 允许清空输入
                                                    handleMastodonConfigChange('username', '');
                                                    handleMastodonConfigChange('instance', '');
                                                } else {
                                                    const match = value.match(/^@?(.+?)@(.+)$/);
                                                    if (match) {
                                                        handleMastodonConfigChange('username', match[1]);
                                                        handleMastodonConfigChange('instance', match[2]);
                                                    }
                                                }
                                            }}
                                            placeholder="例如：@username@mastodon.social"
                                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            格式：@用户名@实例域名，如 @eallion@e5n.cc
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            显示条数
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={localMastodonConfig?.limit}
                                            onChange={(e) => handleMastodonConfigChange('limit', parseInt(e.target.value) || 5)}
                                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            获取并显示的动态条数（1-40）
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-3">
                                            内容过滤
                                        </label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!localMastodonConfig?.exclude_replies}
                                                    onChange={(e) => handleMastodonConfigChange('exclude_replies', !e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                                                />
                                                <span className="text-sm dark:text-slate-300">包含回复</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!localMastodonConfig?.exclude_reblogs}
                                                    onChange={(e) => handleMastodonConfigChange('exclude_reblogs', !e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                                                />
                                                <span className="text-sm dark:text-slate-300">包含转嘟</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={localMastodonConfig?.pinned}
                                                    onChange={(e) => handleMastodonConfigChange('pinned', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                                                />
                                                <span className="text-sm dark:text-slate-300">包含置顶动态</span>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <Cloud size={16} /> 天气设置
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            配置右上角显示的天气信息，使用今日诗词 API 获取实时天气数据，包含温度、湿度、空气质量等信息。
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localWeatherConfig?.enabled}
                                        onChange={(e) => handleWeatherConfigChange('enabled', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <span className="text-sm font-medium dark:text-slate-300">启用天气显示</span>
                                </label>
                                <p className="text-xs text-slate-500 mt-1 ml-7">
                                    是否在页面右上角显示天气信息
                                </p>
                            </div>

                            {localWeatherConfig?.enabled && (
                                <>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">今日诗词天气 API</h5>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                                    免费开源的天气 API，提供实时天气数据，包含温度、湿度、天气状况、空气质量等信息。
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href="https://www.jinrishici.com"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <Globe size={12} />
                                                        官方网站
                                                    </a>
                                                    <span className="text-xs text-blue-500 dark:text-blue-500">•</span>
                                                    <a
                                                        href="https://www.jinrishici.com/doc"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <Cloud size={12} />
                                                        API 文档
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                API 端点
                                            </label>
                                            <input
                                                type="text"
                                                value="https://v2.jinrishici.com/info"
                                                readOnly
                                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 outline-none transition-all text-sm"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                固定端点，获取天气数据和相关诗词信息
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                更新频率
                                            </label>
                                            <input
                                                type="text"
                                                value="每10分钟"
                                                readOnly
                                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 outline-none transition-all text-sm"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                自动刷新天气数据
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-3">
                                            显示特性
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                实时显示当前温度和天气状况
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                包含湿度和空气质量数据
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                根据天气状况显示相应图标
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <Globe size={16} /> 默认视图模式
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            设置用户访问网站时的默认视图模式。用户仍可以在页面上手动切换视图。
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-3">
                                    选择默认视图模式
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setDefaultViewMode('compact')}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            defaultViewMode === 'compact'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                                            : 'border-slate-200 dark:border-slate-600 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                        title="选择简约模式"
                                    >
                                        <div className="text-center">
                                            <div className="w-12 h-12 mx-auto mb-2 bg-slate-200 dark:bg-slate-600 rounded-md flex items-center justify-center">
                                                <div className="grid grid-cols-2 gap-1">
                                                    <div className="w-2 h-2 bg-slate-400 rounded-sm"></div>
                                                    <div className="w-2 h-2 bg-slate-400 rounded-sm"></div>
                                                    <div className="w-2 h-2 bg-slate-400 rounded-sm"></div>
                                                    <div className="w-2 h-2 bg-slate-400 rounded-sm"></div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium dark:text-white">简约模式</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">紧凑布局，显示较少信息</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setDefaultViewMode('detailed')}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            defaultViewMode === 'detailed'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                                            : 'border-slate-200 dark:border-slate-600 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                        title="选择详情模式"
                                    >
                                        <div className="text-center">
                                            <div className="w-12 h-12 mx-auto mb-2 bg-slate-200 dark:bg-slate-600 rounded-md flex items-center justify-center">
                                                <div className="space-y-1">
                                                    <div className="w-8 h-1 bg-slate-400 rounded"></div>
                                                    <div className="w-6 h-1 bg-slate-400 rounded ml-1"></div>
                                                    <div className="w-7 h-1 bg-slate-400 rounded ml-0.5"></div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium dark:text-white">详情模式</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">完整布局，显示更多信息</div>
                                        </div>
                                    </button>
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        <strong>当前选择：</strong> {defaultViewMode === 'compact' ? '简约模式' : '详情模式'}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        新用户首次访问时将使用此视图模式
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 只有登录用户才显示的功能管理区域 */}
                    {authToken && (
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                                <Wrench size={16} /> 网站内容管理
                            </h4>
                            <p className="text-xs text-slate-500 mb-4">
                                管理网站的书签、导入、备份和添加新链接等操作。
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={onImportClick}
                                    className="flex flex-col items-center justify-center gap-2 p-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 transition-all"
                                    title="导入书签"
                                >
                                    <Upload size={18} />
                                    <span>导入书签</span>
                                </button>

                                <button
                                    onClick={onBackupClick}
                                    className="flex flex-col items-center justify-center gap-2 p-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 transition-all"
                                    title="备份与恢复"
                                >
                                    <CloudCog size={18} />
                                    <span>备份恢复</span>
                                </button>

                              </div>
                        </div>
                    )}
                </div>
            )}


        </div>


        {activeTab === 'website' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    取消
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                    <Save size={16} /> 保存设置
                </button>
            </div>
        )}

        </div>
    </div>
  );
};

export default SettingsModal;
