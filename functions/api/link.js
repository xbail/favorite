// EdgeOne Pages Function for Link Creation
// 已从 KV 迁移到 Blob 存储 (@edgeone/pages-blob)

import { getStore } from '@edgeone/pages-blob';

const STORE_NAME = 'cloudnav';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, x-auth-password',
  'Access-Control-Max-Age': '86400',
};

// 校验 token：写后强一致读取，并判断过期时间
async function verifyToken(store, providedPassword) {
  if (!providedPassword) return false;
  try {
    const rec = await store.get(`auth_token:${providedPassword}`, { type: 'json', consistency: 'strong' });
    if (rec && rec.valid && (!rec.expiresAt || rec.expiresAt > Date.now())) return true;
  } catch (e) {}
  return false;
}

export async function onRequest(context) {
  const { request, env } = context;
  const store = getStore(STORE_NAME);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method === 'POST') {
    // 1. Auth Check
    const providedPassword = request.headers.get('x-auth-password');
    const serverPassword = env.PASSWORD;

    let isAuthenticated = false;
    if (serverPassword && providedPassword === serverPassword) {
      isAuthenticated = true;
    } else if (providedPassword) {
      isAuthenticated = await verifyToken(store, providedPassword);
    }

    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      const newLinkData = await request.json();

      if (!newLinkData.title || !newLinkData.url) {
        return new Response(JSON.stringify({ error: 'Missing title or url' }), { status: 400, headers: corsHeaders });
      }

      // 2. Fetch current data from Blob
      const currentDataStr = await store.get('app_data');
      let currentData = { links: [], categories: [] };

      if (currentDataStr) {
        currentData = JSON.parse(currentDataStr);
      } else {
        // Fallback: try to read from split keys if app_data is empty (Smart Migration)
        const linksStr = await store.get('links_config');
        const catsStr = await store.get('cate_config');
        if (linksStr || catsStr) {
          currentData.links = linksStr ? JSON.parse(linksStr) : [];
          currentData.categories = catsStr ? JSON.parse(catsStr) : [];
        }
      }

      // 3. Determine Category
      let targetCatId = '';
      let targetCatName = '';

      if (newLinkData.categoryId) {
        const explicitCat = currentData.categories.find(c => c.id === newLinkData.categoryId);
        if (explicitCat) {
          targetCatId = explicitCat.id;
          targetCatName = explicitCat.name;
        }
      }

      if (!targetCatId) {
        if (currentData.categories && currentData.categories.length > 0) {
          const keywords = ['收集', '未分类', 'inbox', 'temp', 'later'];
          const match = currentData.categories.find(c =>
            keywords.some(k => c.name.toLowerCase().includes(k))
          );

          if (match) {
            targetCatId = match.id;
            targetCatName = match.name;
          } else {
            const common = currentData.categories.find(c => c.id === 'common');
            if (common) {
              targetCatId = 'common';
              targetCatName = common.name;
            } else {
              targetCatId = currentData.categories[0].id;
              targetCatName = currentData.categories[0].name;
            }
          }
        } else {
          targetCatId = 'common';
          targetCatName = '默认';
        }
      }

      // 4. Create new link object
      const newLink = {
        id: Date.now().toString(),
        title: newLinkData.title,
        url: newLinkData.url,
        description: newLinkData.description || '',
        categoryId: targetCatId,
        createdAt: Date.now(),
        pinned: false,
        icon: undefined
      };

      // 5. Append
      currentData.links = [newLink, ...(currentData.links || [])];

      // 6. Save back to Blob
      await store.set('app_data', JSON.stringify(currentData));

      // Also sync to split keys to ensure consistency with main app
      await store.set('links_config', JSON.stringify(currentData.links));

      return new Response(JSON.stringify({
        success: true,
        link: newLink,
        categoryName: targetCatName
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}
