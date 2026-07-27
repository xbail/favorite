// EdgeOne Pages Function for Storage API
// 已从 KV (CLOUDNAV_KV) 迁移到 Blob 存储 (@edgeone/pages-blob)
// Blob 无需在控制台开通命名空间/绑定项目，首次 getStore 自动创建

import { getStore } from '@edgeone/pages-blob';

const STORE_NAME = 'cloudnav';

// 存储键常量（与 KV 版保持一致，原样复用）
const STORAGE_KEYS = {
  CONFIG_KEY: 'config',
  SEARCH_CONFIG_KEY: 'search_config',
  CATEGORIES_CONFIG_KEY: 'cate_config',
  LINKS_CONFIG_KEY: 'links_config',
  PENDING_SUBMISSIONS_KEY: 'pending_submissions',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-auth-password',
};

// 校验 token：写后强一致读取，并判断过期时间（Blob 无 TTL，过期时间存在 value 里）
async function verifyToken(store, providedPassword) {
  if (!providedPassword) return false;
  try {
    const rec = await store.get(`auth_token:${providedPassword}`, { type: 'json', consistency: 'strong' });
    if (rec && rec.valid && (!rec.expiresAt || rec.expiresAt > Date.now())) {
      return true;
    }
  } catch (e) {
    // ignore parse error
  }
  return false;
}

export async function onRequest(context) {
  const { request, env } = context;
  const store = getStore(STORE_NAME);
  const url = new URL(request.url);

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle GET requests
  if (request.method === 'GET') {
    try {
      const checkAuth = url.searchParams.get('checkAuth');
      const getConfig = url.searchParams.get('getConfig');
      const key = url.searchParams.get('key');

      // Check Auth
      if (checkAuth === 'true') {
        const serverPassword = env.PASSWORD;
        return new Response(JSON.stringify({
          hasPassword: !!serverPassword,
          requiresAuth: !!serverPassword,
          readOnlyAccess: true
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Get Config
      if (['ai', 'website', 'search', 'mastodon', 'weather'].includes(getConfig)) {
        const unifiedConfigStr = await store.get('config');
        const config = unifiedConfigStr ? JSON.parse(unifiedConfigStr) : {};

        let response = {};
        if (getConfig === 'ai') response = config.ai || {};
        else if (getConfig === 'website') response = config.website || { passwordExpiry: { value: 1, unit: 'week' } };
        else if (getConfig === 'search') response = config.search || {};
        else if (getConfig === 'mastodon') response = config.mastodon || {};
        else if (getConfig === 'weather') response = config.weather || {};

        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Get Favicon
      if (getConfig === 'favicon') {
        const domain = url.searchParams.get('domain');
        if (!domain) {
          return new Response(JSON.stringify({ error: 'Domain parameter is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const cachedIcon = await store.get(`favicon:${domain}`);
        return new Response(JSON.stringify({ icon: cachedIcon || null, cached: !!cachedIcon }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Get Categories
      if (getConfig === 'categories') {
        const categoriesData = await store.get(STORAGE_KEYS.CATEGORIES_CONFIG_KEY);
        return new Response(categoriesData || '[]', {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Get Links
      if (getConfig === 'links') {
        const linksData = await store.get(STORAGE_KEYS.LINKS_CONFIG_KEY);
        return new Response(linksData || '[]', {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Read by Key
      if (key) {
        if (key === STORAGE_KEYS.CONFIG_KEY) {
          const config = await store.get('config');
          return new Response(JSON.stringify({ key, value: config || '{}' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        const value = await store.get(key);
        return new Response(JSON.stringify({ key, value }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Get All Data
      if (getConfig === 'true') {
        const linksData = await store.get(STORAGE_KEYS.LINKS_CONFIG_KEY);
        const categoriesData = await store.get(STORAGE_KEYS.CATEGORIES_CONFIG_KEY);

        const combinedData = {
          links: linksData ? JSON.parse(linksData) : [],
          categories: categoriesData ? JSON.parse(categoriesData) : []
        };

        return new Response(JSON.stringify(combinedData), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ links: [], categories: [] }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (err) {
      console.error('Storage API error:', err);
      return new Response(JSON.stringify({
        error: 'Failed to fetch data',
        details: err.message
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // Handle POST requests
  if (request.method === 'POST') {
    const providedPassword = request.headers.get('x-auth-password');
    const serverPassword = env.PASSWORD;

    try {
      const body = await request.json();
      const readOnlyOperations = ['favicon', 'submitLink'];

      // Anonymous allowed operations
      if (readOnlyOperations.includes(body.operation)) {
        if (body.saveConfig === 'favicon') {
          const { domain, icon } = body;
          if (!domain || !icon) {
            return new Response(JSON.stringify({ error: 'Domain and icon are required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
          // Blob 没有 expirationTtl，favicon 直接永久缓存（图标基本不变）
          await store.set(`favicon:${domain}`, icon);
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        // 访客在线申请收录网址（进入待审核队列）
        if (body.operation === 'submitLink') {
          const { title, url, description, categoryId } = body;
          if (!title || !url) {
            return new Response(JSON.stringify({ error: '标题和 URL 为必填' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
          const pendingStr = await store.get(STORAGE_KEYS.PENDING_SUBMISSIONS_KEY);
          const pending = pendingStr ? JSON.parse(pendingStr) : [];
          const submission = {
            id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            title,
            url,
            description: description || '',
            categoryId: categoryId || 'common',
            submittedAt: Date.now(),
            status: 'pending',
          };
          pending.push(submission);
          await store.set(STORAGE_KEYS.PENDING_SUBMISSIONS_KEY, JSON.stringify(pending));
          return new Response(JSON.stringify({ success: true, id: submission.id }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      // Auth Check for other operations
      let isAuthenticated = false;
      if (serverPassword && providedPassword === serverPassword) {
        isAuthenticated = true;
      } else if (providedPassword) {
        isAuthenticated = await verifyToken(store, providedPassword);
      }

      if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: '管理操作需要密码验证' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Auth Only Check
      if (body.authOnly) {
        await store.set('last_auth_time', Date.now().toString());
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // ===== 网址申请审核（管理员）=====
      // 列出待审核申请
      if (body.operation === 'listPending') {
        const pendingStr = await store.get(STORAGE_KEYS.PENDING_SUBMISSIONS_KEY);
        return new Response(pendingStr || '[]', {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      // 通过审核：把申请的链接写入 links_config，并从待审队列移除
      if (body.operation === 'approveLink') {
        const { id, categoryId } = body;
        const pendingStr = await store.get(STORAGE_KEYS.PENDING_SUBMISSIONS_KEY);
        const pending = pendingStr ? JSON.parse(pendingStr) : [];
        const item = pending.find(p => p.id === id);
        if (!item) {
          return new Response(JSON.stringify({ error: '申请不存在' }), {
            status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        const linksStr = await store.get(STORAGE_KEYS.LINKS_CONFIG_KEY);
        const links = linksStr ? JSON.parse(linksStr) : [];
        const newLink = {
          id: Date.now().toString(),
          title: item.title,
          url: item.url,
          description: item.description || '',
          categoryId: categoryId || item.categoryId || 'common',
          createdAt: Date.now(),
          pinned: false,
          icon: undefined,
        };
        await store.set(STORAGE_KEYS.LINKS_CONFIG_KEY, JSON.stringify([newLink, ...links]));
        await store.set(STORAGE_KEYS.PENDING_SUBMISSIONS_KEY, JSON.stringify(pending.filter(p => p.id !== id)));
        return new Response(JSON.stringify({ success: true, link: newLink }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      // 拒绝审核：直接从待审队列移除
      if (body.operation === 'rejectLink') {
        const { id } = body;
        const pendingStr = await store.get(STORAGE_KEYS.PENDING_SUBMISSIONS_KEY);
        const pending = pendingStr ? JSON.parse(pendingStr) : [];
        await store.set(STORAGE_KEYS.PENDING_SUBMISSIONS_KEY, JSON.stringify(pending.filter(p => p.id !== id)));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Save Config (Search, AI, Website, Mastodon, Weather)
      if (['search', 'ai', 'website', 'mastodon', 'weather'].includes(body.saveConfig)) {
        let unifiedConfig = {};
        const existingConfig = await store.get('config');
        if (existingConfig) unifiedConfig = JSON.parse(existingConfig);

        unifiedConfig[body.saveConfig] = body.config;
        await store.set('config', JSON.stringify(unifiedConfig));

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Save Categories
      if (body.saveConfig === 'categories') {
        await store.set(STORAGE_KEYS.CATEGORIES_CONFIG_KEY, JSON.stringify(body.categories));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Save Links
      if (body.saveConfig === 'links') {
        await store.set(STORAGE_KEYS.LINKS_CONFIG_KEY, JSON.stringify(body.links));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Sync To Blob (Unified Config)
      if (body.key === STORAGE_KEYS.CONFIG_KEY && body.value) {
        await store.set('config', body.value);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Save Combined Links and Categories
      if (body.links && body.categories) {
        await store.set(STORAGE_KEYS.LINKS_CONFIG_KEY, JSON.stringify(body.links));
        await store.set(STORAGE_KEYS.CATEGORIES_CONFIG_KEY, JSON.stringify(body.categories));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else if (body.links) {
        await store.set(STORAGE_KEYS.LINKS_CONFIG_KEY, JSON.stringify(body.links));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else if (body.categories) {
        await store.set(STORAGE_KEYS.CATEGORIES_CONFIG_KEY, JSON.stringify(body.categories));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid data format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: 'Failed to save data' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}
