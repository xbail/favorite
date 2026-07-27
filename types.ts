export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  categoryId: string;
  createdAt: number;
  pinned?: boolean; // New field for pinning
  pinnedOrder?: number; // Field for pinned link sorting order
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  password?: string; // Optional password for category protection
  parentId?: string; // Parent category ID for subcategories
  isSubcategory?: boolean; // Flag to identify if this is a subcategory
}

export interface AppState {
  links: LinkItem[];
  categories: Category[];
  darkMode: boolean;
}

export interface WebDavConfig {
  url: string;
  username: string;
  password: string;
  enabled: boolean;
}

export type AIProvider = 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  websiteTitle?: string; // 网站标题 (浏览器标签)
  faviconUrl?: string; // 网站图标 URL
  navigationName?: string;
}

// 图标获取方式类型
export type IconSourceType = 'faviconextractor' | 'google' | 'customapi' | 'customurl';

// 图标配置
export interface IconConfig {
  source: IconSourceType;
  faviconextractor?: {
    enabled: boolean;
  };
  google?: {
    enabled: boolean;
    apiKey?: string;
  };
  customapi?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
  customurl?: {
    enabled: boolean;
    url: string;
  };
}

// 密码过期时间单位
export type PasswordExpiryUnit = 'day' | 'week' | 'month' | 'year' | 'permanent';

// 密码过期时间配置
export interface PasswordExpiryConfig {
  value: number; // 数值
  unit: PasswordExpiryUnit; // 单位
}

// 网站配置
export interface WebsiteConfig {
  passwordExpiry: PasswordExpiryConfig;
}

// 搜索模式类型
export type SearchMode = 'internal' | 'external';

// 外部搜索源配置
export interface ExternalSearchSource {
  id: string;
  name: string;
  url: string;
  icon?: string;
  enabled: boolean;
  createdAt: number;
}

// 搜索配置
export interface SearchConfig {
  mode: SearchMode;
  externalSources: ExternalSearchSource[];
  selectedSource?: ExternalSearchSource | null; // 选中的搜索源
}

// Mastodon 配置
export interface MastodonConfig {
  enabled: boolean; // 是否启用
  instance: string; // Mastodon 实例域名，如 e5n.cc
  username: string; // 用户名，如 eallion
  limit: number; // 获取条数
  exclude_replies: boolean; // 是否排除回复
  exclude_reblogs: boolean; // 是否排除转嘟
  pinned: boolean; // 是否包含置顶
}

// 天气配置
export interface WeatherConfig {
  enabled: boolean; // 是否启用天气显示
  apiHost: string; // 和风天气 API Host，如 devapi.qweather.com
  apiKey: string; // 和风天气 API Key
  location: string; // 位置 ID，如 101010100（北京）
  unit: 'celsius' | 'fahrenheit'; // 温度单位
}

// 完全统一的应用配置（包含所有配置）
export interface AppConfig {
  // AI 配置
  ai?: AIConfig;

  // 网站配置
  website?: WebsiteConfig;

  // WebDAV 配置
  webdav?: WebDavConfig;

  // 搜索配置
  search?: SearchConfig;

  // Mastodon 配置
  mastodon?: MastodonConfig;

  // 天气配置
  weather?: WeatherConfig;

  // 图标配置
  icon?: IconConfig;

  // 视图配置（仅简洁模式，详情模式已移除）
  view?: {
    mode: 'compact'; // 用户个人视图偏好
    defaultMode?: 'compact'; // 管理员设置的默认视图模式
  };

  // 界面配置
  ui?: {
    showPinnedWebsites: boolean; // 是否显示置顶网站
    darkMode?: boolean; // 深色模式偏好（可选，主要使用系统级主题）
  };

  // 其他用户偏好设置
  preferences?: {
    [key: string]: any;
  };
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "common", name: "常用推荐", icon: "Star" },
  { id: "tools","name":"工具","icon":"Folder","isSubcategory":false},
  { id: "life","name":"生活工具","icon":"Target","parentId":"tools","isSubcategory":true},
  { id: "network","name":"网络工具","icon":"Wifi","parentId":"tools","isSubcategory":true},
];

export const INITIAL_LINKS: LinkItem[] = [
  { id: '17656786301830', title: '博客 Blog', url: 'https://www.eallion.com/', icon: 'https://images.eallion.com/directus/files/e2e21dfb-3e9f-4593-ab3c-85b354711755.png', description: '大大的小蜗牛的个人生活博客', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 0, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/e2e21dfb-3e9f-4593-ab3c-85b354711755.png' }, pinnedOrder: 0 },
  { id: '17656786301832', title: 'Gmail', url: 'https://mail.google.com', icon: 'https://images.eallion.com/directus/files/7f40a208-6943-467b-94ea-be4cdef2b06c.svg', description: 'Secure, smart, and easy to use email', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 1, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/7f40a208-6943-467b-94ea-be4cdef2b06c.svg' }, pinnedOrder: 1 },
  { id: '1765695429252', title: 'Gemini', url: 'https://gemini.google.com/', icon: 'https://www.faviconextractor.com/favicon/gemini.google.com?larger=true', description: '谷歌新一代 AI 对话工具。', categoryId: '1765379444870', createdAt: 1765695429252, pinned: true, order: 1, pinnedOrder: 13 },
  { id: '17656786301831', title: 'Mastodon e5n.cc', url: 'https://e5n.cc/@eallion', icon: 'https://images.eallion.com/directus/files/4cbefe66-bc79-4be7-b26e-235cea151ecc.svg', description: 'Charles Chin\'s personal Mastodon.', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 2, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/4cbefe66-bc79-4be7-b26e-235cea151ecc.svg' }, pinnedOrder: 2 },
  { id: '176567863018334', title: 'GoToSocial Blog', url: 'https://m.eallion.com', icon: 'https://images.eallion.com/directus/files/dd29efa1-d486-4260-80d1-7bb12cc99c1b.svg', description: 'eallion\'s blog summary on fediverse', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 3, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/dd29efa1-d486-4260-80d1-7bb12cc99c1b.svg' }, pinnedOrder: 3 },
  { id: '176567863018335', title: 'Phanpy', url: 'https://app.e5n.cc', icon: 'https://images.eallion.com/directus/files/aaff7121-a2ce-4dcc-a967-0c8f10c74ddb.svg', description: 'Mastodon Web Client', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 4, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/aaff7121-a2ce-4dcc-a967-0c8f10c74ddb.svg' }, pinnedOrder: 4 },
  { id: '176567863018336', title: 'NAS 飞牛 fnOS', url: 'https://nas.eallion.com', icon: 'https://images.eallion.com/directus/files/e292c169-e379-497c-a905-dfa04a48ace8.png', description: 'NAS fnOS Cloudflared', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 5, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/e292c169-e379-497c-a905-dfa04a48ace8.png' }, pinnedOrder: 5 },
  { id: '17656786301835', title: 'GitHub', url: 'https://github.com/eallion', icon: 'https://images.eallion.com/directus/files/7f2b6b7a-09e4-49f0-850a-ed9d17411fc1.svg', description: 'Build and ship software on a single, collaborative platform', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 6, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/7f2b6b7a-09e4-49f0-850a-ed9d17411fc1.svg' }, pinnedOrder: 6 },
  { id: '17656786301836', title: 'Cloudflare', url: 'https://dash.cloudflare.com/', icon: 'https://images.eallion.com/directus/files/f8255184-0745-44a2-8826-9835d9da219d.svg', description: 'Connect, protect, and build everywhere', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 7, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/f8255184-0745-44a2-8826-9835d9da219d.svg' }, pinnedOrder: 7 },
  { id: '17656786301837', title: 'Vercel', url: 'https://vercel.com', icon: 'https://images.eallion.com/directus/files/a5d1c6a7-3f20-406a-aefc-7a5d97d85864.svg', description: 'Build and deploy the best web experiences with the Frontend Cloud', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 8, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/a5d1c6a7-3f20-406a-aefc-7a5d97d85864.svg' }, pinnedOrder: 8 },
  { id: '176567863018328', title: 'Dropbox', url: 'https://www.dropbox.com/', icon: 'https://images.eallion.com/directus/files/68cf4d97-1e8e-42b3-8db1-706566cb5b4d.svg', description: 'For all things worth saving', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 9, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/68cf4d97-1e8e-42b3-8db1-706566cb5b4d.svg' }, pinnedOrder: 9 },
  { id: '17656786301838', title: '阿里云', url: 'https://www.aliyun.com/', icon: 'https://images.eallion.com/directus/files/20637abb-1238-4940-b103-b700929ccc6b.svg', description: '计算，为了无法计算的价值', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 10, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/20637abb-1238-4940-b103-b700929ccc6b.svg' }, pinnedOrder: 10 },
  { id: '17656786301839', title: '腾讯云', url: 'https://cloud.tencent.com/', icon: 'https://images.eallion.com/directus/files/76fb7ad3-a1ed-4145-9b28-9c913b720e94.svg', description: '产业智变·云启未来', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 11, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/76fb7ad3-a1ed-4145-9b28-9c913b720e94.svg' }, pinnedOrder: 11 },
  { id: '176567863018310', title: 'Twitter 𝕏', url: 'https://x.com/eallion', icon: 'https://images.eallion.com/directus/files/e4bc1db2-a8a1-48c8-ada4-b0916c29e255.svg', description: 'Blaze your glory!', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 12, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/e4bc1db2-a8a1-48c8-ada4-b0916c29e255.svg' }, pinnedOrder: 12 },
  { id: '17656786301833', title: 'Deepseek', url: 'https://chat.deepseek.com/', icon: 'https://images.eallion.com/directus/files/5e2011d3-0f65-43f5-b99d-258d887ed724.svg', description: '深度求索 探索未至之境', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 14, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/5e2011d3-0f65-43f5-b99d-258d887ed724.svg' }, pinnedOrder: 14 },
  { id: '176567863018311', title: 'Youtube', url: 'https://www.youtube.com/', icon: 'https://images.eallion.com/directus/files/374e5802-0876-4902-b374-6897e9a38670.svg', description: 'Boardcast Yourself', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 15, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/374e5802-0876-4902-b374-6897e9a38670.svg' }, pinnedOrder: 15 },
  { id: '176567863018312', title: '哔哩哔哩', url: 'https://www.bilibili.com/', icon: 'https://images.eallion.com/directus/files/400f8313-d471-419a-878c-6458caaec2b8.svg', description: '你感兴趣的视频都在 B 站', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 16, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/400f8313-d471-419a-878c-6458caaec2b8.svg' }, pinnedOrder: 16 },
  { id: '176567863018313', title: 'Reddit', url: 'https://www.reddit.com/user/eallion/', icon: 'https://images.eallion.com/directus/files/dfa3d6af-559f-41cd-9874-1503dea86460.svg', description: 'Heart of the internet', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 17, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/dfa3d6af-559f-41cd-9874-1503dea86460.svg' }, pinnedOrder: 17 },
  { id: '176567863018314', title: '抖音', url: 'https://www.douyin.com/', icon: 'https://images.eallion.com/directus/files/1030a9db-a0f7-4034-8ddb-dc14825daa0c.svg', description: '记录美好生活', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 18, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/1030a9db-a0f7-4034-8ddb-dc14825daa0c.svg' }, pinnedOrder: 18 },
  { id: '176567863018315', title: '小红书', url: 'https://www.xiaohongshu.com', icon: 'https://images.eallion.com/directus/files/5f25809c-1713-44f2-bdb8-9ff611434e7b.png', description: '你的生活指南', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 19, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/5f25809c-1713-44f2-bdb8-9ff611434e7b.png' }, pinnedOrder: 19 },
  { id: '176567863018316', title: '京东', url: 'https://www.jd.com', icon: 'https://images.eallion.com/directus/files/aa2a4cf4-b66f-4dd2-9749-c39b342c9a8c.png', description: '正品低价、品质保障、配送及时、轻松购物！', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 20, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/aa2a4cf4-b66f-4dd2-9749-c39b342c9a8c.png' }, pinnedOrder: 20 },
  { id: '176567863018317', title: '酷白菜', url: 'https://www.kubaicai.com/?r=/l/ddlist', icon: 'https://images.eallion.com/directus/files/5c32deb3-0461-49c8-8c44-f2696344136f.png', description: '每天千款优惠券秒杀，一折限时疯抢！', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 21, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/5c32deb3-0461-49c8-8c44-f2696344136f.png' }, pinnedOrder: 21 },
  { id: '176567863018318', title: '什么值得买', url: 'https://www.smzdm.com/', icon: 'https://images.eallion.com/directus/files/a0f9faf0-89b2-4953-ab32-9712939ed68b.svg', description: '科学消费 认真生活', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 22, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/a0f9faf0-89b2-4953-ab32-9712939ed68b.svg' }, pinnedOrder: 22 },
  { id: '176567863018319', title: '淘宝', url: 'https://www.taobao.com', icon: 'https://images.eallion.com/directus/files/4e7c704c-fdcf-42e3-9262-254b45a7c640.webp', description: '亚洲较大的网上交易平台', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 23, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/4e7c704c-fdcf-42e3-9262-254b45a7c640.webp' }, pinnedOrder: 23 },
  { id: '176567863018320', title: '拼多多', url: 'https://mobile.yangkeduo.com/', icon: 'https://images.eallion.com/directus/files/6067e95e-9cc9-4038-a9c2-eb1401db3c72.png', description: '风靡全国的拼团商城，优质商品新鲜直供，快来一起拼多多吧', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 24, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/6067e95e-9cc9-4038-a9c2-eb1401db3c72.png' }, pinnedOrder: 24 },
  { id: '176567863018321', title: '小米有品', url: 'https://www.xiaomiyoupin.com/', icon: 'https://images.eallion.com/directus/files/96c5584b-92de-461a-81c4-9c6dc7ed81ef.png', description: '小米旗下精品生活电商平台', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 25, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/96c5584b-92de-461a-81c4-9c6dc7ed81ef.png' }, pinnedOrder: 25 },
  { id: '176567863018322', title: '抖音创作者中心', url: 'https://creator.douyin.com/creator-micro/home', icon: 'https://images.eallion.com/directus/files/1030a9db-a0f7-4034-8ddb-dc14825daa0c.svg', description: '抖音创作服务平台', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 26, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/1030a9db-a0f7-4034-8ddb-dc14825daa0c.svg' }, pinnedOrder: 26 },
  { id: '176567863018323', title: '小红书千帆', url: 'https://ark.xiaohongshu.com/', icon: 'https://images.eallion.com/directus/files/931332c3-ee72-4a01-8ef8-9a05c2f00e06.png', description: '小红书卖家版，解锁社交内容电商全新体验！', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 27, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/931332c3-ee72-4a01-8ef8-9a05c2f00e06.png' }, pinnedOrder: 27 },
  { id: '176567863018324', title: '淘宝联盟', url: 'https://pub.alimama.com/portal/v2/pages/promo/goods/index.htm', icon: 'https://images.eallion.com/directus/files/204b31d2-59bc-46c9-9569-b22e0ba032ec.ico', description: '淘宝联盟·生态伙伴', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 28, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/204b31d2-59bc-46c9-9569-b22e0ba032ec.ico' }, pinnedOrder: 28 },
  { id: '176567863018325', title: '京东联盟', url: 'https://union.jd.com/', icon: 'https://images.eallion.com/directus/files/aa2a4cf4-b66f-4dd2-9749-c39b342c9a8c.png', description: '网络赚钱，流量变现，专业电商 CPS 联盟平台！', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 29, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/aa2a4cf4-b66f-4dd2-9749-c39b342c9a8c.png' }, pinnedOrder: 29 },
  { id: '176567863018326', title: '多多进宝', url: 'https://jinbao.pinduoduo.com/', icon: 'https://images.eallion.com/directus/files/6067e95e-9cc9-4038-a9c2-eb1401db3c72.png', description: '大量高佣金、多优惠券商品在这里等你，可以随时随地登录该网站推广商品赚钱，商品优惠券多、佣金高，让您轻松赚钱！', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 30, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/6067e95e-9cc9-4038-a9c2-eb1401db3c72.png' }, pinnedOrder: 30 },
  { id: '176567863018327', title: 'Docker Status', url: 'https://status.1panel.top/status/docker', icon: 'https://images.eallion.com/directus/files/5fb9254d-13cd-4bdf-bd29-91765d0dde70.svg', description: '国内 Docker 服务状态 & 镜像加速监控', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 31, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/5fb9254d-13cd-4bdf-bd29-91765d0dde70.svg' }, pinnedOrder: 31 },
  { id: '176567863018329', title: '腾讯元宝', url: 'https://yuanbao.tencent.com/chat', icon: 'https://images.eallion.com/directus/files/001dfbb8-14c6-4b0a-b2db-b7f73d09bbd8.svg', description: '轻松工作 多点生活', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 32, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/001dfbb8-14c6-4b0a-b2db-b7f73d09bbd8.svg' }, pinnedOrder: 32 },
  { id: '176567863018330', title: '汇率', url: 'https://currency.eallion.com/', icon: 'https://images.eallion.com/directus/files/a7814137-cc6a-4273-8de9-10bb762cbd58.svg', description: '全球 34 个币种，付款无货币转换费', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 33, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/a7814137-cc6a-4273-8de9-10bb762cbd58.svg' }, pinnedOrder: 33 },
  { id: '176567863018331', title: 'ITDOG 在线 ping', url: 'https://www.itdog.cn/ping', icon: 'https://images.eallion.com/directus/files/2674d026-905b-48fc-bcc9-e1c9c695baaf.png', description: '多地 ping 网络延迟测试', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 34, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/2674d026-905b-48fc-bcc9-e1c9c695baaf.png' }, pinnedOrder: 34 },
  { id: '176567863018332', title: 'TinyPNG', url: 'https://tinypng.com/', icon: 'https://images.eallion.com/directus/files/0edbdff2-05b6-41e3-9681-b32c2ee54fb9.png', description: 'Compress AVIF, WebP, PNG and JPEG images', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 35, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/0edbdff2-05b6-41e3-9681-b32c2ee54fb9.png' }, pinnedOrder: 35 },
  { id: '176567863018333', title: '在线拼图 Pintu', url: 'https://kejiweixun.com/tools/merge-images', icon: 'https://images.eallion.com/directus/files/78c6e111-2608-421a-a108-954424ad3382.png', description: '图片拼接：长图拼接，把多张图片合并成一张，支持纵向或横向拼接图片，还能添加水印。该工具完全离线运行，手机建议使用微信小程序"拼长图"。', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 36, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/78c6e111-2608-421a-a108-954424ad3382.png' }, pinnedOrder: 36 },
  { id: '176567863018337', title: 'Perplexity', url: 'https://www.perplexity.ai/', icon: 'https://images.eallion.com/directus/files/cc4076a7-dea1-4d98-ba5e-f0c5e32e7b3b.svg', description: 'Where knowledge begins', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 37, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/cc4076a7-dea1-4d98-ba5e-f0c5e32e7b3b.svg' }, pinnedOrder: 37 },
  { id: '176567863018338', title: 'ChatGPT', url: 'https://chatgpt.com/', icon: 'https://images.eallion.com/directus/files/759d12e8-09a6-43f7-bc98-b8370f26ae4b.svg', description: 'OpenAI ChatGPT', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 38, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/759d12e8-09a6-43f7-bc98-b8370f26ae4b.svg' }, pinnedOrder: 38 },
  { id: '176567863018339', title: 'SVGViewer', url: 'https://www.svgviewer.dev/', icon: 'https://images.eallion.com/directus/files/a02f993b-069a-4f05-8224-5e5ca438ef89.svg', description: 'View, edit, and optimize SVGs', categoryId: 'common', createdAt: 1765678630183, pinned: true, order: 39, iconType: 'customurl', iconConfig: { iconType: 'customurl', customUrl: 'https://images.eallion.com/directus/files/a02f993b-069a-4f05-8224-5e5ca438ef89.svg' }, pinnedOrder: 39 }
];
