/**
 * Cloudflare Worker 友链推送脚本
 * 支持 Telegram 和飞书机器人，推送方式二选一
 * 机器人令牌、chat_id、Webhook等通过环境变量传递
 *
 * 环境变量：
 *   TG_BOT_TOKEN
 *   TG_CHAT_ID
 *   FEISHU_WEBHOOK
 */
function corsResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*", // 推荐上线时改为你的前端域名
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      // 处理预检请求
      return corsResponse(null, 204);
    }
    if (request.method !== 'POST') {
      return corsResponse('Method Not Allowed', 405);
    }
    let data;
    try {
      data = await request.json();
    } catch {
      return corsResponse('Invalid JSON', 400);
    }
    // 期望data结构: { name, url, logo, desc, pushType }
    const { name, url, logo, desc, pushType } = data;
    if (!name || !url || !pushType) {
      return corsResponse('Missing required fields', 400);
    }
    const msg = `【友链申请】\n站点名: ${name}\n链接: ${url}\nLogo: ${logo || '无'}\n描述: ${desc || '无'}`;
    let pushResult = null;
    if (pushType === 'telegram') {
      // 推送到Telegram
      const tgToken = env.TG_BOT_TOKEN;
      const tgChatId = env.TG_CHAT_ID;
      if (!tgToken || !tgChatId) {
        return corsResponse('Telegram配置缺失', 500);
      }
      const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      pushResult = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: msg })
      });
    } else if (pushType === 'feishu') {
      // 推送到飞书
      const feishuWebhook = env.FEISHU_WEBHOOK;
      if (!feishuWebhook) {
        return corsResponse('飞书配置缺失', 500);
      }
      pushResult = await fetch(feishuWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg_type: 'text', content: { text: msg } })
      });
    } else {
      return corsResponse('不支持的推送方式', 400);
    }
    if (pushResult && pushResult.ok) {
      return corsResponse(JSON.stringify({ ok: true }), 200);
    } else {
      return corsResponse('推送失败', 500);
    }
  }
} 