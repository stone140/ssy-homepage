/* ============================================================
 * avatar.js — 我的分身（v4.0 · 真实大模型）
 *
 * 与旧版（5 问 5 答 + 关键词匹配）的区别：
 *   · 问题不再走本地关键词表，而是发给 Supabase Edge Function
 *   · 云函数检索知识库、调用 DeepSeek，再把回答返回页面
 *   · 支持多轮上下文、打字状态、超时与失败兜底
 *
 * 依赖：
 *   js/avatar-config.js  —— 云函数地址（公开，不含密钥）
 *   js/persona.js        —— UI 文案与快捷问题（由 data/persona.json 生成）
 *   js/config.js         —— Supabase URL / anon key（可选，用于 apikey 头）
 * ============================================================ */

(function () {
  "use strict";

  const PERSONA = window.AVATAR_PERSONA || { ui: {}, meta: {} };
  const CONFIG = window.AVATAR_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);

  const els = {
    toggle: $("#botToggle"),
    panel: $("#botPanel"),
    close: $("#botClose"),
    clear: $("#botClear"),
    title: $("#botTitle"),
    log: $("#botLog"),
    qs: $("#botQs"),
    input: $("#botInput"),
    send: $("#botSend"),
    status: $("#botStatus"),
  };

  if (!els.panel || !els.log) return;

  let lang = currentLang();
  let lastLang = "";
  let history = [];
  let busy = false;
  let typingEl = null;
  let generation = 0;

  function currentLang() {
    return localStorage.getItem("page-lang") === "en" ? "en" : "zh";
  }

  function ui() {
    return (PERSONA.ui && PERSONA.ui[lang]) || (PERSONA.ui && PERSONA.ui.zh) || {};
  }

  function setText(el, text) {
    if (el) el.textContent = text || "";
  }

  function resolveEndpoint() {
    let endpoint = String(CONFIG.endpoint || "");
    try {
      const params = new URLSearchParams(window.location.search);
      const override = params.get("avatarEndpoint");
      const isLocal =
        window.location.protocol === "file:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      // 只允许在本机预览时覆盖，避免线上被查询参数指向陌生地址。
      if (override && isLocal) endpoint = override;
    } catch (_) {
      /* ignore */
    }
    return endpoint;
  }

  function renderSuggestions() {
    if (!els.qs) return;
    els.qs.innerHTML = "";
    (ui().suggestions || []).forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bot-q";
      btn.textContent = q;
      btn.addEventListener("click", () => sendQuestion(q));
      els.qs.appendChild(btn);
    });
  }

  function append(who, text, extraClass) {
    const row = document.createElement("div");
    row.className =
      "bot-msg " + (who === "me" ? "bot-msg-me" : "bot-msg-bot");
    if (extraClass) row.classList.add(extraClass);
    row.textContent = text;
    els.log.appendChild(row);
    els.log.scrollTop = els.log.scrollHeight;
    return row;
  }

  function removeTyping() {
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl);
    }
    typingEl = null;
  }

  function showTyping() {
    removeTyping();
    typingEl = document.createElement("div");
    typingEl.className = "bot-msg bot-msg-bot bot-typing";
    typingEl.setAttribute("aria-label", ui().thinking || "Thinking");
    typingEl.innerHTML = "<span></span><span></span><span></span>";
    els.log.appendChild(typingEl);
    els.log.scrollTop = els.log.scrollHeight;
  }

  function setBusy(value) {
    busy = value;
    if (els.input) els.input.disabled = value;
    if (els.send) {
      els.send.disabled = value;
      els.send.textContent = value ? "…" : ui().ask || "Ask";
    }
    els.panel.setAttribute("aria-busy", value ? "true" : "false");
  }

  function reset(showGreeting) {
    generation += 1;
    history = [];
    removeTyping();
    els.log.innerHTML = "";
    if (showGreeting !== false) append("bot", ui().hint || "");
  }

  async function callApi(messages) {
    const endpoint = resolveEndpoint();
    if (!endpoint) throw new Error("endpoint_not_configured");

    const headers = { "Content-Type": "application/json" };
    const supa = window.SUPABASE_CONFIG || {};
    if (supa.anonKey) {
      // 新版 Supabase 的 sb_publishable_... 不是 JWT，只放 apikey 头；
      // 旧版 anon key 是 JWT，才需要再带 Authorization: Bearer。
      headers["apikey"] = supa.anonKey;
      if (!String(supa.anonKey).startsWith("sb_publishable_")) {
        headers["Authorization"] = "Bearer " + supa.anonKey;
      }
    }

    const controller = new AbortController();
    const timeout = Number(CONFIG.timeoutMs || 30000);
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          messages: messages.slice(-Number(CONFIG.maxHistory || 8)),
          lang: lang,
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (
        !res.ok ||
        !data ||
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        const code = data && data.error ? data.error : "http_" + res.status;
        throw new Error(code);
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function sendQuestion(raw) {
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
    if (!text || busy) return;

    const gen = generation;
    append("me", text);
    history.push({ role: "user", content: text });
    setBusy(true);
    showTyping();

    try {
      const data = await callApi(history);
      if (gen !== generation) return; // 语言切换/清空后丢弃旧回答
      removeTyping();
      append("bot", data.reply);
      history.push({ role: "assistant", content: data.reply });
      if (history.length > 20) history = history.slice(-20);
    } catch (err) {
      if (gen !== generation) return;
      removeTyping();
      append("bot", ui().error || "暂时不可用，请稍后再试。", "bot-msg-error");
      console.error("[avatar]", err);
    } finally {
      if (gen === generation) setBusy(false);
      if (els.input) els.input.focus();
    }
  }

  function open() {
    els.panel.hidden = false;
    if (els.toggle) els.toggle.classList.add("active");
    if (els.input) els.input.focus();
  }

  function close() {
    els.panel.hidden = true;
    if (els.toggle) els.toggle.classList.remove("active");
  }

  function toggle() {
    if (els.panel.hidden) open();
    else close();
  }

  function refresh() {
    const next = currentLang();
    const changed = next !== lastLang;
    lang = next;
    lastLang = next;

    const t = ui();
    setText(els.title, t.title);
    setText(els.status, t.status);
    if (els.input) els.input.placeholder = t.placeholder || "";
    if (els.send) els.send.textContent = busy ? "…" : t.ask || "Ask";
    if (els.clear) els.clear.textContent = t.clear || "Clear";
    if (els.toggle) {
      els.toggle.setAttribute("aria-label", t.open || t.title || "");
    }
    renderSuggestions();

    // 语言变化或首次加载时，重置成该语言的问候语；
    // 同一语言下重复调用（例如主题切换）不打断正在进行的对话。
    if (changed || !els.log.childElementCount) reset(true);
  }

  if (els.toggle) els.toggle.addEventListener("click", toggle);
  if (els.close) els.close.addEventListener("click", close);
  if (els.clear) {
    els.clear.addEventListener("click", () => {
      reset(true);
      if (els.input) els.input.focus();
    });
  }
  if (els.send) {
    els.send.addEventListener("click", () => {
      const value = els.input ? els.input.value : "";
      if (els.input) els.input.value = "";
      sendQuestion(value);
    });
  }
  if (els.input) {
    els.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const value = els.input.value;
        els.input.value = "";
        sendQuestion(value);
      }
    });
  }

  refresh();

  window.SiteAvatar = {
    refresh: refresh,
    open: open,
    close: close,
    isOpen: () => !els.panel.hidden,
  };
})();
