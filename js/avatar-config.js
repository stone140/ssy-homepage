/* ============================================================
 * avatar-config.js — 数字分身的公开配置（v4.0）
 *
 * 这里只有 Supabase Edge Function 的地址，没有任何模型密钥。
 * DeepSeek 的 API Key 只存在于 Supabase 的 Secrets 里，绝不下发到浏览器。
 *
 * 本地联调：
 *   启动 tools/local_avatar_proxy.py 后，在地址后加
 *   ?avatarEndpoint=http://127.0.0.1:8787/avatar
 *   （仅在 localhost / 127.0.0.1 / file:// 下生效）
 * ============================================================ */

window.AVATAR_CONFIG = {
  /* Supabase 项目：vzjlwiznwhqgofqalmvt */
  endpoint:
    "https://vzjlwiznwhqgofqalmvt.supabase.co/functions/v1/avatar",

  /* 前端等待云函数的最长时间（毫秒） */
  timeoutMs: 30000,

  /* 每次请求最多带多少条历史消息（用户 + 分身） */
  maxHistory: 8,
};
