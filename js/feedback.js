/* ============================================================
 * feedback.js —— 反馈功能 (v3.0)
 *
 *  这一版只做「管道」，不改设计：
 *    ① 反馈入口（前端界面）—— 访客可以写意见
 *    ② 后台（数据库）      —— Supabase / Postgres 收下并保存
 *  达标标准：能收到 · 能存下 · 能查到
 *
 *  数据流：
 *    表单 → 校验 → 附带「网站版本 + 所在栏目」→ 写进 Supabase 的 feedback 表
 *         ↘ 网络不通 / 还没配 config.js 时：先暂存在本机 localStorage（outbox），
 *           等下次打开页面自动补交，保证「能收到」不会因为一次断网而丢掉。
 *
 *  想查反馈：
 *    · Supabase 控制台 → Table Editor → feedback
 *    · 或打开本仓库的 admin.html 控制台（时间 / 关系 / 设备 / 关键词筛选 + 导出 CSV）
 *
 *  依赖：
 *    · js/data.js    —— 中英文案（SITE_DATA.lang.*.feedback）
 *    · js/config.js  —— Supabase 配置（该文件被 .gitignore 忽略，不入 Git）
 *    · @supabase/supabase-js v2（CDN，可选：加载失败就走本机暂存，页面照常可用）
 * ============================================================ */

(function () {
  "use strict";

  /* ---------- 常量 ---------- */
  var OUTBOX_KEY = "site-feedback-outbox"; // 本机待发件箱
  var CONTENT_MAX = 1000;                  // 前端字数上限（数据库侧兜底 2000）
  var TABLE_FALLBACK = "feedback";

  /* ---------- 文案兜底：万一 data.js 没加载出来，界面也不至于空着 ---------- */
  var FALLBACK_TEXT = {
    entryTitle: "给这个网站提反馈",
    entryDesc: "哪里不好用？告诉我，下一版就改",
    entryGo: "填写 →",
    boardLink: "想提具体建议？填一张反馈表 →",
    title: "反馈",
    intro: "这个网站还在改。你的意见会直接决定我下一步改什么。",
    nicknameLabel: "名字或昵称",
    nicknameHint: "可不填 · 昵称就行，不用真名",
    nicknamePlaceholder: "怎么称呼你？（可不填）",
    relationLabel: "你是我的……",
    deviceLabel: "你是在什么设备上看的？",
    contentLabel: "想反馈的内容",
    contentPlaceholder: "例如：手机上看「个人介绍」时，照片下面的字有点挤……（说得越具体越好）",
    contentHint: "说说具体位置、你的体验和遇到的问题",
    autoNote: "提交时间与网站版本会自动带上 ✦",
    submit: "提交反馈",
    cancel: "取消",
    sending: "正在提交…",
    ok: "收到啦，谢谢！我会认真看的。",
    queued: "网络好像不通，已先存在本机，等联网后自动补交。",
    fail: "提交失败，请稍后再试。",
    invalidRelation: "选一个吧",
    invalidDevice: "选一个吧",
    invalidContent: "写点什么吧，随便一句也行",
    tooLong: "有点太长啦，精简一下？",
    countSuffix: " 字",
    close: "关闭",
    outboxPending: "本机还有 {n} 条反馈没送出去，联网后会自动补交",
    relationOptions: [
      { value: "同学", label: "同学" },
      { value: "老师", label: "老师" },
      { value: "家人", label: "家人" },
      { value: "朋友", label: "朋友" },
      { value: "同事", label: "同事" },
      { value: "其他", label: "其他" },
      { value: "不便透露", label: "不便透露" }
    ],
    deviceOptions: [
      { value: "电脑", label: "电脑" },
      { value: "手机", label: "手机" },
      { value: "平板", label: "平板" },
      { value: "其他", label: "其他" }
    ]
  };

  /* ---------- 小工具 ---------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  /* 与 main.js 保持一致的转义策略：内容一律不进 innerHTML */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escAttr(str) {
    return esc(str).replace(/'/g, "&#39;");
  }

  /* 当前语言：与 main.js 共用同一个 localStorage 键 */
  function lang() {
    try {
      return localStorage.getItem("page-lang") === "en" ? "en" : "zh";
    } catch (e) {
      return "zh";
    }
  }

  /* 取文案：优先用 data.js 里的双语版本，缺字段就退回内置中文 */
  function t() {
    var d = window.SITE_DATA && SITE_DATA.lang && SITE_DATA.lang[lang()];
    var fb = d && d.feedback;
    if (!fb) return FALLBACK_TEXT;
    var merged = {};
    Object.keys(FALLBACK_TEXT).forEach(function (k) {
      merged[k] = fb[k] !== undefined ? fb[k] : FALLBACK_TEXT[k];
    });
    return merged;
  }

  /* ---------- 网站版本：自动附带，不要求访客填写 ---------- */
  function siteVersion() {
    var cfg = window.SUPABASE_CONFIG;
    if (cfg && cfg.siteVersion) return String(cfg.siteVersion);
    // 从页面标题里抓 "v2.7" 这样的版本号
    var m = String(document.title || "").match(/v\d+(?:\.\d+)+/);
    return m ? m[0] : "unknown";
  }

  /* 访客当前所在栏目（提交时自动附带，便于按「具体位置」定位） */
  function currentPageKey() {
    var panel = $(".page-panel.active");
    return panel ? panel.getAttribute("data-page") || "" : "";
  }

  function pageRef() {
    var key = currentPageKey();
    return (location.pathname || "/") + (key ? "#" + key : "");
  }

  /* ---------- Supabase 客户端（懒创建 + 只试一次） ---------- */
  var clientCache = null;
  var clientReady = false;

  function config() {
    var cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    if (/your-project-ref|your-anon-key/.test(cfg.url + cfg.anonKey)) return null; // 还是模板占位符
    return cfg;
  }

  function getClient() {
    if (clientReady) return clientCache;
    clientReady = true;
    clientCache = null;
    var cfg = config();
    if (!cfg) return null;
    var lib = window.supabase;
    if (!lib || typeof lib.createClient !== "function") return null;
    try {
      clientCache = lib.createClient(cfg.url, cfg.anonKey);
    } catch (e) {
      clientCache = null;
    }
    return clientCache;
  }

  function tableName() {
    var cfg = window.SUPABASE_CONFIG;
    return (cfg && cfg.table) || TABLE_FALLBACK;
  }

  /* ---------- 本机待发件箱（网络不通时先存下，保证「能收到」） ---------- */
  function readOutbox() {
    try {
      var arr = JSON.parse(localStorage.getItem(OUTBOX_KEY));
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeOutbox(arr) {
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr));
    } catch (e) {
      /* 隐私模式下可能写不进去，忽略即可 */
    }
  }

  function pushOutbox(payload) {
    var arr = readOutbox();
    arr.push({ id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8), at: new Date().toISOString(), payload: payload });
    writeOutbox(arr);
    return arr.length;
  }

  function outboxCount() {
    return readOutbox().length;
  }

  /* ---------- 写库 ---------- */
  function insertRow(payload) {
    var client = getClient();
    if (!client) return Promise.resolve({ ok: false, offline: true });
    try {
      return client
        .from(tableName())
        .insert(payload)
        .then(function (res) {
          if (res && res.error) return { ok: false, error: res.error };
          return { ok: true };
        })
        .catch(function (err) {
          return { ok: false, error: err };
        });
    } catch (err) {
      return Promise.resolve({ ok: false, error: err });
    }
  }

  /* 把待发件箱里的反馈逐条补交，成功的移出队列 */
  function flushOutbox() {
    var arr = readOutbox();
    var client = getClient();
    if (!client || !arr.length) return Promise.resolve(0);
    var sent = 0;
    var chain = Promise.resolve();
    arr.forEach(function (item) {
      chain = chain.then(function () {
        return insertRow(item.payload).then(function (r) {
          if (!r.ok) return;
          sent++;
          writeOutbox(
            readOutbox().filter(function (x) {
              return x.id !== item.id;
            })
          );
        });
      });
    });
    return chain.then(function () {
      return sent;
    });
  }

  /* ---------- DOM 引用 ---------- */
  var overlay, form, nicknameEl, relationWrap, deviceWrap, contentEl, countEl, statusEl, submitBtn, cancelBtn;
  var lastFocused = null;

  function cacheDom() {
    overlay = $("#feedbackOverlay");
    form = $("#fbForm");
    nicknameEl = $("#fbNickname");
    relationWrap = $("#fbRelation");
    deviceWrap = $("#fbDevice");
    contentEl = $("#fbContent");
    countEl = $("#fbCount");
    statusEl = $("#fbStatus");
    submitBtn = $("#fbSubmit");
    cancelBtn = $("#fbCancel");
  }

  /* ---------- 渲染：入口 ---------- */
  function renderEntry() {
    var T = t();
    var title = $("#feedbackEntryTitle");
    var desc = $("#feedbackEntryDesc");
    var go = $("#feedbackEntryGo");
    if (title) title.textContent = T.entryTitle;
    if (desc) desc.textContent = T.entryDesc;
    if (go) go.textContent = T.entryGo;

    var btns = document.querySelectorAll("[data-feedback-open]");
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.id === "boardFeedbackBtn") btn.textContent = T.boardLink;
      else btn.textContent = T.entryTitle;
    });

    var pending = outboxCount();
    var pendingEl = $("#feedbackPending");
    if (pendingEl) {
      pendingEl.textContent = pending ? T.outboxPending.replace("{n}", pending) : "";
      pendingEl.hidden = !pending;
    }
  }

  /* ---------- 渲染：弹窗（含单选选项） ---------- */
  function renderOptions(container, options, name) {
    if (!container) return;
    container.innerHTML = "";
    options.forEach(function (opt, i) {
      var id = name + "-" + i;
      var label = document.createElement("label");
      label.className = "fb-option";
      label.setAttribute("for", id);
      label.innerHTML =
        '<input type="radio" id="' + id + '" name="' + name + '" value="' + escAttr(opt.value) + '" />' +
        '<span class="fb-option-text">' + esc(opt.label) + "</span>";
      container.appendChild(label);
    });
  }

  /* 选中态：给 label 挂 is-checked（不依赖 CSS :has()，旧浏览器也能看出选中了） */
  function syncOptionState(container) {
    if (!container) return;
    Array.prototype.forEach.call(container.querySelectorAll(".fb-option"), function (label) {
      var input = label.querySelector("input");
      label.classList.toggle("is-checked", !!(input && input.checked));
    });
  }

  function clearErrors() {    ["#fbRelationError", "#fbDeviceError", "#fbContentError"].forEach(function (sel) {
      var el = $(sel);
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
    });
    [relationWrap, deviceWrap].forEach(function (el) {
      if (el) el.classList.remove("is-invalid");
    });
    if (contentEl) contentEl.classList.remove("is-invalid");
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "fb-status";
    }
  }

  function renderModal() {
    var T = t();
    var set = function (sel, text) {
      var el = $(sel);
      if (el) el.textContent = text;
    };
    set("#fbTitle", T.title);
    set("#fbIntro", T.intro);
    set("#fbNicknameLabel", T.nicknameLabel);
    set("#fbNicknameHint", T.nicknameHint);
    set("#fbRelationLabel", T.relationLabel);
    set("#fbDeviceLabel", T.deviceLabel);
    set("#fbContentLabel", T.contentLabel);
    set("#fbContentHint", T.contentHint);
    set("#fbAuto", T.autoNote);
    if (nicknameEl) nicknameEl.placeholder = T.nicknamePlaceholder;
    if (contentEl) contentEl.placeholder = T.contentPlaceholder;
    if (submitBtn) submitBtn.textContent = T.submit;
    if (cancelBtn) cancelBtn.textContent = T.cancel;
    var closeBtn = $("#fbClose");
    if (closeBtn) closeBtn.setAttribute("aria-label", T.close);

    renderOptions(relationWrap, T.relationOptions, "fb-relation");
    renderOptions(deviceWrap, T.deviceOptions, "fb-device");
    syncOptionState(relationWrap);
    syncOptionState(deviceWrap);
    updateCount();
  }

  function updateCount() {
    if (!countEl || !contentEl) return;
    var T = t();
    countEl.textContent = contentEl.value.length + " / " + CONTENT_MAX + (T.countSuffix || "");
  }

  function resetForm() {
    if (form) form.reset();
    syncOptionState(relationWrap);
    syncOptionState(deviceWrap);
    updateCount();
  }

  /* ---------- 打开 / 关闭 ---------- */
  function isOpen() {
    return !!overlay && !overlay.hidden;
  }

  function openModal(trigger) {
    if (!overlay) return;
    lastFocused = trigger || document.activeElement;
    clearErrors();
    renderModal();
    overlay.hidden = false;
    overlay.classList.add("show");
    document.body.classList.add("modal-open");
    // 焦点给到第一个可填项
    if (nicknameEl) window.setTimeout(function () { nicknameEl.focus(); }, 30);
  }

  function closeModal() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    overlay.classList.remove("show");
    document.body.classList.remove("modal-open");
    if (form) form.reset();
    clearErrors();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    lastFocused = null;
  }

  /* ---------- 校验 + 取值 ---------- */
  function checkedValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function showError(errorSel, wrap, message) {
    var el = $(errorSel);
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
    if (wrap) wrap.classList.add("is-invalid");
  }

  function collect() {
    var T = t();
    var nickname = nicknameEl ? nicknameEl.value.trim() : "";
    var relation = checkedValue("fb-relation");
    var device = checkedValue("fb-device");
    var content = contentEl ? contentEl.value.trim() : "";
    var firstBad = null;

    clearErrors();

    if (!relation) {
      showError("#fbRelationError", relationWrap, T.invalidRelation);
      firstBad = firstBad || relationWrap;
    }
    if (!device) {
      showError("#fbDeviceError", deviceWrap, T.invalidDevice);
      firstBad = firstBad || deviceWrap;
    }
    if (!content) {
      showError("#fbContentError", contentEl, T.invalidContent);
      firstBad = firstBad || contentEl;
    } else if (content.length > CONTENT_MAX) {
      showError("#fbContentError", contentEl, T.tooLong);
      firstBad = firstBad || contentEl;
    }

    if (firstBad) {
      var focusable = firstBad.querySelector ? firstBad.querySelector("input, textarea") : null;
      if (focusable) focusable.focus();
      return null;
    }

    return {
      nickname: nickname || null,
      relation: relation,
      device: device,
      content: content,
      site_version: siteVersion(),
      page_url: pageRef()
    };
  }

  /* ---------- 提交 ---------- */
  var sending = false;

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "fb-status" + (kind ? " is-" + kind : "");
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (sending) return;

    var payload = collect();
    if (!payload) return;

    sending = true;
    if (submitBtn) submitBtn.disabled = true;
    setStatus(t().sending, "sending");

    insertRow(payload).then(function (res) {
      sending = false;
      if (submitBtn) submitBtn.disabled = false;

      if (res.ok) {
        setStatus(t().ok, "ok");
        resetForm();
        renderEntry();
        window.setTimeout(closeModal, 1600);
        return;
      }

      // 没配 config.js（offline）或网络失败：先存本机，保证不丢
      pushOutbox(payload);
      setStatus(t().queued, "warn");
      resetForm();
      renderEntry();
    });
  }

  /* ---------- 绑定 ---------- */
  var bound = false;

  function bind() {
    if (bound) return;
    bound = true;
    cacheDom();

    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeModal();
      });
    }
    var closeBtn = $("#fbClose");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (form) form.addEventListener("submit", handleSubmit);
    if (contentEl) contentEl.addEventListener("input", updateCount);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) closeModal();
    });

    // 单选选中态跟着走（含键盘方向键切换）
    document.addEventListener("change", function (e) {
      var el = e.target;
      if (!el || !el.name) return;
      if (el.name === "fb-relation") syncOptionState(relationWrap);
      if (el.name === "fb-device") syncOptionState(deviceWrap);
    });

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-feedback-open]") : null;
      if (trigger) {
        e.preventDefault();
        openModal(trigger);
      }
    });
  }

  /* ---------- 对外 API ---------- */
  var api = {
    open: function () { openModal(null); },
    close: closeModal,
    /* 语言切换后由 main.js 调用，让入口与弹窗文案跟着变 */
    refresh: function () {
      renderEntry();
      if (isOpen()) renderModal();
    },
    /* 供 admin.html 等外部读取（调试用） */
    version: "v3.0",
    pendingCount: outboxCount
  };
  window.SiteFeedback = api;

  /* ---------- 初始化 ---------- */
  function init() {
    if (!$("#feedbackOverlay")) return; // 这个页面没有反馈 UI（例如 admin.html）
    bind();
    renderEntry();
    // 打开页面时顺手把上次没送出去的补交掉
    flushOutbox().then(function (n) {
      if (n > 0) renderEntry();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
