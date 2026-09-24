/* ============================================================
 * config.example.js —— Supabase 配置模板（v3.0 反馈功能）
 *
 * 【怎么用】
 *   1. 把本文件复制一份，改名为  config.js  （同目录，即 js/config.js）
 *   2. 填入你自己 Supabase 项目的 Project URL 和 anon key
 *   3. 刷新页面即可
 *
 * 【在哪里找这两项】
 *   Supabase 控制台 → Project Settings → API
 *     · Project URL      → 填到下面的 url
 *     · Project API keys → anon / public 那一把 → 填到下面的 anonKey
 *
 * 【为什么单独一个文件】
 *   js/config.js 已写进 .gitignore，不会被提交到 Git / GitHub，
 *   所以密钥不会被公开。本文件（config.example.js）只有占位符，可以安全提交。
 *
 * 【不配置会怎样】
 *   站点照常运行：反馈表单仍然可用，提交内容会先暂存在访客本机浏览器，
 *   等配置好 config.js 之后再自动补交（见 js/feedback.js 的 outbox 机制）。
 * ============================================================ */

window.SUPABASE_CONFIG = {
  /* 例：https://abcdefghijklmn.supabase.co （注意结尾不要带斜杠） */
  url: "https://your-project-ref.supabase.co",

  /* 例：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... （很长的一串，anon public 那把） */
  anonKey: "your-anon-key",

  /* 反馈表名，与 sql/feedback.sql 中一致，一般不用改 */
  table: "feedback",

  /* 网站版本号：留空则自动从页面标题里抓取（例如「v2.7」）。
     想固定就写死，例如 "v3.0"。 */
  siteVersion: ""
};
