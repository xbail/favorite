// 调试用：检测 Blob 存储是否可用（替代原 KV 检测）
import { getStore } from '@edgeone/pages-blob';

export async function onRequest(context) {
  const result = {
    message: 'Debug Info',
    envKeys: {},
    blobStore: 'Not Found'
  };

  try {
    // Check env
    if (context && context.env) {
      for (const key in context.env) {
        const value = context.env[key];
        result.envKeys[key] = typeof value === 'string' ? 'String (Hidden)' : typeof value;
      }
    }

    // Check Blob Store
    try {
      const store = getStore('cloudnav');
      result.blobStore = 'Present';
      const { blobs } = await store.list({ consistency: 'strong' });
      result.blobCount = blobs.length;
      result.blobKeys = blobs.map(b => b.key);
    } catch (e) {
      result.blobStore = `Error: ${e.message}`;
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Exception in debug function',
      message: e.message,
      stack: e.stack
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
