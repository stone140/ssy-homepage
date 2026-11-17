/* ============================================================
 * main.js —— 页面交互逻辑 (v2.7)
 *  - 主页手柄: A/B/X/Y + 十字键 + 绿屏 + L/R + SELECT/MENU/START (initGamepad)
 *  - 顶部「页面选择」: 5 页切换 (个人介绍/个人专业/个人兴趣/联系我/留言板)
 *  - 我的分身: v4.0 真实大模型 (js/avatar.js + Supabase Edge Function)
 *  - 中英切换(i18n)
 *  - 子页面弹窗(点击兴趣卡片)
 *  - 聊天 / 留言(本地 localStorage, 预留后端接入)
 *  - v2.7 像素动物自由漫游: 任意方向走位 / 偶尔飞出画面再飞回来 (initAnimalWander)
 *    (湖水流动是纯 CSS 动画, 见 css/style.css 末尾「v2.1 / v2.7」一段)
 * ============================================================ */

(function () {
  "use strict";

  /* ---------- 当前语言状态 ---------- */
  let currentLang = localStorage.getItem("page-lang") || "zh";
  /* ---------- 当前页 ---------- */
  let currentPage = "intro";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ============ 1. 中英切换 ============ */
  function applyLang() {
    const d = SITE_DATA.lang[currentLang];

    // 语言按钮
    const lt = $("#langToggle");
    if (lt) lt.setAttribute("aria-label", currentLang === "zh" ? "Switch to English" : "切换到中文");

    // 顶部导航 (4 项, 用 data-page 定位)
    const nav = d.nav;
    $$(".site-nav ul li a").forEach((a) => {
      const key = a.dataset.page;
      if (nav[key]) a.textContent = nav[key];
    });

    // 顶部画面菜单 (4 项)
    $$(".page-menu .menu-item").forEach((btn) => {
      const key = btn.dataset.page;
      const label = btn.querySelector(".menu-label");
      if (label && nav[key]) label.textContent = nav[key];
    });

    // Hero
    const kicker = $(".hero-kicker");
    if (kicker) kicker.textContent = d.heroKicker;
    const sub = $(".hero-sub");
    if (sub) sub.textContent = d.heroSub;
    const intro = $("#heroIntro");
    if (intro) intro.textContent = d.heroIntro;
    const hint = $("#heroHint");
    if (hint) hint.textContent = d.menuHint;

    // 各页面面板标题/副标题/卡片
    renderPanels(d);

    // 兴趣卡片文案
    $$(".hobby-card").forEach((card) => {
      const key = card.dataset.hobby;
      const hc = d.hobbyCards[key];
      if (!hc) return;
      card.querySelector("h3").textContent = hc.title;
      card.querySelector(".hobby-more").textContent = hc.more;
    });

    // 联系卡片
    const contactWrap = $("#page-contact .contact-grid");
    if (contactWrap) {
      contactWrap.innerHTML = d.contact
        .map(
          (c) => `
        <a class="info-card contact-card" href="${c.href || "javascript:void(0)"}" ${
            c.href && c.href.indexOf("mailto:") === 0 ? "" : 'data-copy="' + c.value + '"'
          }>
          <div class="info-icon">${c.icon}</div>
          <div class="info-label">${c.label}</div>
          <div class="info-value">${c.value}</div>
        </a>`
        )
        .join("");
      bindCopyCards();
    }

    // 页脚
    const footerNote = $(".site-footer .footer-note");
    if (footerNote) footerNote.textContent = d.footer.note;
    const footerMain = $(".site-footer p");
    if (footerMain) footerMain.textContent = "© " + new Date().getFullYear() + " " + d.footer.text;

    // 聊天
    const ch = d.chat;
    const chatHead = $("#chatPanel .chat-head span");
    if (chatHead) chatHead.textContent = ch.title;
    if ($("#chatInput")) $("#chatInput").placeholder = ch.placeholder;
    if ($("#chatSend")) $("#chatSend").textContent = ch.send;
    const chatNote = $(".chat-note");
    if (chatNote) chatNote.textContent = ch.note;

    localStorage.setItem("page-lang", currentLang);
    syncMusicUI();
    renderChat();
    renderBoard();
    renderBotTexts();
    syncPadScreen(currentPage);   // 手柄绿屏文案跟着语言走 (v2.7)
    applyTheme(currentTheme); // 语言切换后同步主题按钮的提示文案
    // v3.0 反馈: 语言切换后重刷反馈入口与弹窗文案
    // (feedback.js 是 defer 加载的，首屏可能还没就绪，所以先判断存在性)
    if (window.SiteFeedback) window.SiteFeedback.refresh();
  }

  /* 渲染四个页面的标题 / 副标题 / 卡片 */
  function renderPanels(d) {
    Object.keys(d.panels).forEach((key) => {
      const panel = document.querySelector('.page-panel[data-page="' + key + '"]');
      if (!panel) return;
      const data = d.panels[key];
      const titleEl = panel.querySelector(".page-title");
      const subEl = panel.querySelector(".page-sub");
      if (titleEl) titleEl.textContent = data.title;
      if (subEl) subEl.textContent = data.sub;

      // 个人介绍页的照片说明(中英双语)
      const capEl = panel.querySelector(".intro-photo-cap");
      if (capEl) capEl.textContent = data.photoCap || "";

      // 兴趣页保留手写卡片, 不重建
      if (key === "hobbies") return;
      // 联系页由 contact 数组渲染
      if (key === "contact") return;

      const grid = panel.querySelector(".card-grid");
      if (grid) {
        const cardsHtml = (data.cards || [])
          .map(
            (c) => `
          <div class="info-card">
            <div class="info-icon">${c.icon}</div>
            <h3>${c.title}</h3>
            <p>${c.text}</p>
          </div>`
          )
          .join("");
        // 个人介绍页: 在「目标与信念」卡片右侧补一张像素版头像
        if (key === "intro") {
          grid.innerHTML =
            cardsHtml +
            `
          <figure class="intro-pixel">
            <div class="intro-pixel-frame">
              <img src="assets/images/me-pixel.png" alt="${data.pixelCap || ""}" width="256" height="256" />
            </div>
            <figcaption class="intro-pixel-cap">${data.pixelCap || ""}</figcaption>
          </figure>`;
        } else {
          grid.innerHTML = cardsHtml;
        }
      }
    });
  }

  /* ============ 页面切换 ============ */
  function switchPage(key, scroll) {
    if (!key) return;
    currentPage = key;

    // 面板
    $$(".page-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.page === key);
    });
    // 顶部导航高亮
    $$(".site-nav ul li a").forEach((a) => {
      a.classList.toggle("active", a.dataset.page === key);
    });
    // 画面菜单高亮
    $$(".page-menu .menu-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.page === key);
    });
    // 手柄绿屏 + ABXY 白圈跟着走 (v2.7)
    syncPadScreen(key);

    // 关闭移动端菜单
    const navEl = $(".site-nav");
    if (navEl) navEl.classList.remove("open");
    const burgerEl = $("#navBurger");
    if (burgerEl) burgerEl.classList.remove("open");

    if (scroll) {
      const stage = $(".stage");
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // 同步地址栏 (可选)
    if (history.replaceState) history.replaceState(null, "", "#page-" + key);
  }

  /* 绑定所有页面选择入口 */
  function initPageNav() {
    $$("[data-page]").forEach((el) => {
      if (el.tagName === "A") {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          switchPage(el.dataset.page, true);
        });
      } else if (el.classList.contains("menu-item")) {
        el.addEventListener("click", () => switchPage(el.dataset.page, true));
      }
    });
  }

  const langToggle = $("#langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      currentLang = currentLang === "zh" ? "en" : "zh";
      applyLang();
      if (modalOpen) renderModal(lastModalKey);
    });
  }

  /* ============ 复制微信等文案到剪贴板 ============ */
  function bindCopyCards() {
    $$(".contact-card[data-copy]").forEach((card) => {
      card.addEventListener("click", () => {
        const val = card.dataset.copy;
        const notify = () => {
          const el = card.querySelector(".info-value");
          if (!el) return;
          el.textContent = currentLang === "zh" ? "已复制 ✓" : "Copied ✓";
          setTimeout(() => {
            if (card.isConnected) el.textContent = val;
          }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(notify).catch(notify);
        } else {
          const ta = document.createElement("textarea");
          ta.value = val;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch {}
          document.body.removeChild(ta);
          notify();
        }
      });
    });
  }

  /* ============ 2. 子页面弹窗 ============ */
  const overlay = $("#modalOverlay");
  const modalClose = $("#modalClose");
  let modalOpen = false;
  let lastModalKey = null;

  function renderModal(key) {
    const page = SITE_DATA.pages[key];
    if (!page) return;
    const content = page[currentLang === "zh" ? "zh" : "en"];
    const hc = SITE_DATA.lang[currentLang].hobbyCards[key];
    $("#modalEmoji").textContent = hc ? hc.emoji : "";
    $("#modalTitle").textContent = content.title;
    $("#modalBody").innerHTML = content.paragraphs.map((p) => `<p>${p}</p>`).join("");
  }

  function openModal(key) {
    lastModalKey = key;
    renderModal(key);
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    modalOpen = true;
    overlay.classList.add("show");
  }

  function closeModal() {
    overlay.hidden = true;
    overlay.classList.remove("show");
    document.body.classList.remove("modal-open");
    modalOpen = false;
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }
  if (modalClose) modalClose.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modalOpen) closeModal();
      if (!$("#chatPanel").hidden) toggleChat(false);
      if (window.SiteAvatar && window.SiteAvatar.isOpen()) {
        window.SiteAvatar.close();
      }
    }
  });

  $$(".hobby-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.hobby));
  });

  /* ============ 3. 聊天 / 留言 (localStorage) ============ */
  const chatToggle = $("#chatToggle");
  const chatPanel = $("#chatPanel");
  const chatClose = $("#chatClose");
  const chatLog = $("#chatLog");
  const chatInput = $("#chatInput");
  const chatSend = $("#chatSend");
  const CHAT_KEY = "site-messages";

  function getMessages() {
    try {
      return JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveMessages(arr) {
    localStorage.setItem(CHAT_KEY, JSON.stringify(arr));
  }

  function renderChat() {
    if (!chatLog) return;
    const msgs = getMessages();
    chatLog.innerHTML = "";
    if (!msgs.length) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = SITE_DATA.lang[currentLang].chat.empty;
      chatLog.appendChild(empty);
      return;
    }
    msgs.forEach((m) => {
      const row = document.createElement("div");
      row.className = "chat-msg";
      row.innerHTML =
        `<span class="chat-who">${escapeHtml(m.name || "访客")}</span>` +
        `<span class="chat-date">${m.time || ""}</span>` +
        `<p class="chat-text">${escapeHtml(m.text || "")}</p>`;
      chatLog.appendChild(row);
    });
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addMessage(text, name) {
    const msgs = getMessages();
    const now = new Date();
    const ts = now.toLocaleString(currentLang === "zh" ? "zh-CN" : "en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    msgs.push({
      name: (name && String(name).trim()) || (currentLang === "zh" ? "我" : "Me"),
      text: text,
      time: ts,
    });
    saveMessages(msgs);
    renderChat();
    renderBoard();
  }

  /* ============ 5. 留言板页面 (与聊天共用本地存储) ============ */
  const boardForm = $("#boardForm");
  const boardName = $("#boardName");
  const boardText = $("#boardText");
  const boardSend = $("#boardSend");
  const boardList = $("#boardList");
  const boardNote = $("#boardNote");

  function renderBoard() {
    if (!boardList) return;
    const bd = SITE_DATA.lang[currentLang].board || {};
    if (boardNote) boardNote.textContent = bd.note || "";
    if (boardName) boardName.placeholder = bd.namePlaceholder || "";
    if (boardText) boardText.placeholder = bd.msgPlaceholder || "";
    if (boardSend) boardSend.textContent = bd.send || "Send";
    const msgs = getMessages();
    boardList.innerHTML = "";
    if (!msgs.length) {
      const empty = document.createElement("div");
      empty.className = "board-empty";
      empty.textContent = bd.empty || "";
      boardList.appendChild(empty);
      return;
    }
    msgs
      .slice()
      .reverse()
      .forEach((m) => {
        const item = document.createElement("article");
        item.className = "board-item";
        item.innerHTML =
          `<div class="board-item-head"><span class="board-who">${escapeHtml(m.name || "访客")}</span>` +
          `<span class="board-date">${escapeHtml(m.time || "")}</span></div>` +
          `<p class="board-text">${escapeHtml(m.text || "")}</p>`;
        boardList.appendChild(item);
      });
  }

  if (boardForm) {
    boardForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = ((boardText && boardText.value) || "").trim();
      if (!text) return;
      addMessage(text, boardName ? boardName.value : "");
      if (boardText) boardText.value = "";
    });
  }

  function toggleChat(open) {
    if (!chatPanel) return;
    const show = open !== undefined ? open : chatPanel.hidden;
    chatPanel.hidden = !show;
    if (chatToggle) chatToggle.classList.toggle("active", show);
    if (show && chatInput) chatInput.focus();
  }

  if (chatToggle) chatToggle.addEventListener("click", () => toggleChat());
  if (chatClose) chatClose.addEventListener("click", () => toggleChat(false));

  function send() {
    const val = chatInput.value.trim();
    if (!val) return;
    addMessage(val);
    chatInput.value = "";
  }
  if (chatSend) chatSend.addEventListener("click", send);
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ============ 6. 我的分身 (v4.0 · 真实大模型) ============ */
  // 具体逻辑在 js/avatar.js：检索知识库 → 调 Supabase Edge Function → DeepSeek。
  // main.js 只保留语言切换时的刷新入口，避免两套逻辑同时绑定 DOM。
  function renderBotTexts() {
    if (window.SiteAvatar) window.SiteAvatar.refresh();
  }

  /* ============ 移动端菜单 ============ */
  const burger = $("#navBurger");
  if (burger) {
    burger.addEventListener("click", () => {
      const navEl = $(".site-nav");
      if (navEl) navEl.classList.toggle("open");
      burger.classList.toggle("open");
    });
  }

  /* ============ 4. 右上角: 最爱音乐 · 像素碟片 ============ */
  const discCard = $("#discCard");
  const bgm = $("#bgm");
  const discState = $("#discState");

  function syncMusicUI() {
    if (!bgm || !discCard) return;
    const playing = !bgm.paused && !bgm.ended;
    discCard.classList.toggle("playing", playing);
    discCard.setAttribute("aria-pressed", playing ? "true" : "false");
    const mus = SITE_DATA.lang[currentLang].music || {};
    if (discState) discState.textContent = playing ? "❚❚" : "▶";
    discCard.setAttribute("aria-label", playing ? mus.pause || "Pause" : mus.play || "Play");
    const dt = $("#discTitle");
    if (dt && mus.title) dt.textContent = mus.title;
    const dtr = $("#discTrack");
    if (dtr && mus.track) dtr.textContent = mus.track;
  }

  /* 点击即刻播放 / 再次点击暂停 */
  function toggleMusic() {
    if (!bgm) return;
    if (bgm.paused) {
      bgm.volume = 0.85;
      const p = bgm.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } else {
      bgm.pause();
    }
  }

  if (discCard) discCard.addEventListener("click", toggleMusic);
  if (bgm) {
    ["play", "pause", "ended", "loadedmetadata"].forEach((ev) => {
      bgm.addEventListener(ev, syncMusicUI);
    });
  }

  /* ============ 明暗模式切换 (明亮 / 黑夜) ============ */
  const THEME_KEY = "page-theme";
  const themeToggle = $("#themeToggle");

  // 初始值优先级: 本地记录 > <html data-theme> > 明亮
  let currentTheme =
    localStorage.getItem(THEME_KEY) ||
    document.documentElement.getAttribute("data-theme") ||
    "light";

  function applyTheme(mode) {
    const dark = mode === "dark";
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");

    // 手柄 L / R: 亮着的那个表示当前模式 (v2.7)
    const padL = $("#padL");
    const padR = $("#padR");
    if (padL) padL.classList.toggle("is-on", !dark);
    if (padR) padR.classList.toggle("is-on", dark);

    if (!themeToggle) return;
    const t = (SITE_DATA.lang[currentLang] || {}).theme || {};
    const label = dark ? (t.light || "切换到明亮模式") : (t.dark || "切换到黑夜模式");
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
    const icon = themeToggle.querySelector(".theme-icon");
    if (icon) icon.textContent = dark ? "☀️" : "🌙";
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, currentTheme); } catch (e) {}
      applyTheme(currentTheme);
    });
  }

  /* ============ v2.7: 主页手柄 (gamepad) ============
     CSS 画的一台掌机, 每个按键都接到站内已有的功能上:
       A / B / X / Y  → 个人介绍 / 个人专业 / 个人兴趣 / 联系我
       绿屏(主板)     → 留言板
       十字键          → 上/左 上一个栏目, 右/下 下一个栏目 (5 个栏目循环)
       L / R          → 日间 / 夜间模式
       SELECT / MENU  → 中英文切换 / 音乐播放暂停
       START / HOME   → 滚到内容区开始阅读 / 回到顶部

     另外: 手柄按 1160×540 设计, 这里按可用空间算一个等比 scale(),
     窄窗口、小屏也能整台完整显示, 不会把首屏撑出滚动条。 */
  const PAD_PAGES = ["intro", "major", "hobbies", "contact", "board"];

  /* 绿屏文字 + ABXY 白圈: 页面切换 / 语言切换后刷新 */
  function syncPadScreen(key) {
    const pageEl = $("#padScreenPage");
    if (!pageEl) return;
    const nav = (SITE_DATA.lang[currentLang] || {}).nav || {};
    pageEl.textContent = nav[key] || key;
    $$("[data-pad-page]").forEach(function (b) {
      b.classList.toggle("is-selected", b.dataset.padPage === key);
    });
  }

  /* 等比缩放到可用空间 (整台手柄永远完整可见) */
  function fitGamepad() {
    const wrap = $("#console");
    const pad = $("#gamepad");
    if (!wrap || !pad) return;
    const k = Math.min((wrap.clientWidth - 24) / 1160, (wrap.clientHeight - 24) / 540);
    pad.style.transform = "scale(" + (k > 0 ? k : 1) + ")";
  }

  function initGamepad() {
    const pad = $("#gamepad");
    if (!pad) return;

    // ABXY → 四个栏目
    $$("[data-pad-page]").forEach(function (btn) {
      btn.addEventListener("click", function () { switchPage(btn.dataset.padPage, true); });
    });

    // 十字键 → 上一个 / 下一个栏目 (循环)
    $$("[data-pad-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const step = parseInt(btn.dataset.padStep, 10) || 1;
        const n = PAD_PAGES.length;
        const i = PAD_PAGES.indexOf(currentPage);
        switchPage(PAD_PAGES[((i === -1 ? 0 : i) + step + n) % n], true);
      });
    });

    // 绿屏 = 主板 → 留言板
    const screenBtn = $("#padScreen");
    if (screenBtn) screenBtn.addEventListener("click", function () { switchPage("board", true); });

    // L / R → 日间 / 夜间 (与右上角月亮按钮共用同一套主题状态)
    function setTheme(mode) {
      currentTheme = mode;
      try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
      applyTheme(mode);
    }
    const padL = $("#padL");
    if (padL) padL.addEventListener("click", function () { setTheme("light"); });
    const padR = $("#padR");
    if (padR) padR.addEventListener("click", function () { setTheme("dark"); });

    // SELECT → 中英切换
    const padSelect = $("#padSelect");
    if (padSelect) {
      padSelect.addEventListener("click", function () {
        currentLang = currentLang === "zh" ? "en" : "zh";
        applyLang();
      });
    }

    // MENU → 音乐播放 / 暂停 (按钮发亮表示正在播放)
    const padMenu = $("#padMenu");
    if (padMenu) {
      padMenu.addEventListener("click", toggleMusic);
      if (bgm) {
        ["play", "pause", "ended", "loadedmetadata"].forEach(function (ev) {
          bgm.addEventListener(ev, function () {
            padMenu.classList.toggle("is-on", !bgm.paused && !bgm.ended);
          });
        });
      }
    }

    // START → 滚到内容区; HOME → 回到顶部
    const padStart = $("#padStart");
    if (padStart) padStart.addEventListener("click", function () { switchPage(currentPage, true); });
    const padHome = $("#padHome");
    if (padHome) {
      padHome.addEventListener("click", function () {
        if (window.scrollTo) window.scrollTo({ top: 0, behavior: "smooth" });
        else window.scrollTo(0, 0);
      });
    }

    // 尺寸自适应
    fitGamepad();
    window.addEventListener("resize", fitGamepad);
    window.addEventListener("load", fitGamepad);
    window.addEventListener("orientationchange", fitGamepad);
    if (window.ResizeObserver) new window.ResizeObserver(fitGamepad).observe($("#console"));

    syncPadScreen(currentPage);
  }

  /* ============ v2.7: 像素动物自由漫游 ============
     取代 v2.1 的「碰到就左右摆动」: 每只动物自己随机挑目标点走(任意方向),
     偶尔还会溜达出画面、飞一圈再回来; 鼠标蹭到它会朝反方向惊走。

     两套坐标系各算各的:
       · 画面里的动物 <g class="animal"> 在 480×270 的 SVG 用户坐标系里, 位移用「用户单位」
         (CSS transform 的 px 落在 SVG 里就是用户单位);
       · 页面贴图 <svg class="pet"> 是普通 HTML, 位移用「像素」, 飞出屏幕时按
         getBoundingClientRect() 现算要滚多远。
     位置只在指针碰过来时才测量, 且 0.2 秒过期(动物一直在动, 缓存不能太长寿)。

     几个刻意的处理:
       1) 隐藏页面里的贴图尺寸是 0 → 直接跳过, 等它显示出来再动;
       2) 用 requestAnimationFrame 节流, 一帧最多算一次;
       3) 系统开了「减少动态效果」就完全不启动漫游。 */
  function initAnimalWander() {
    const els = $$("[data-animal]");
    if (!els.length) return;

    const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (mq && mq.matches) return;   // 尊重系统的「减少动态效果」

    const rand = function (a, b) { return a + Math.random() * (b - a); };
    const list = [];

    els.forEach(function (el, i) {
      const inScene = el.classList.contains("animal");      // 画面里的动物(SVG 用户单位)
      list.push({
        el: el,
        inScene: inScene,
        x: 0, y: 0,                                         // 相对「老窝」的偏移 (老窝 = 页面原本摆的位置)
        facing: 1,
        phase: "walk",
        step: inScene ? [6, 26] : [10, 46],                 // 一步走多远 (用户单位 / 像素)
        dur: inScene ? [1.6, 3.4] : [1.4, 3.0],             // 走一步用多久(秒)
        idle: [900, 3600],                                  // 走完歇多久(毫秒)
        fly: inScene ? 0.12 : 0.1,                          // 直接飞出画面的概率
        timer: 0
      });
      el.style.transitionTimingFunction = i % 3 === 0 ? "ease-in-out" : "linear";
    });

    /* 走位: 写 transform, 过渡交给 CSS; 往左走时水平镜像(像素小动物都朝右画) */
    function moveTo(it, tx, ty, dur, ease) {
      it.facing = tx < it.x ? -1 : (tx > it.x ? 1 : it.facing);
      it.x = tx;
      it.y = ty;
      it.el.style.transitionDuration = dur + "s";
      if (ease) it.el.style.transitionTimingFunction = ease;
      it.el.style.transform =
        "translate(" + tx.toFixed(1) + "px, " + ty.toFixed(1) + "px)" +
        (it.facing < 0 ? " scaleX(-1)" : "");
    }

    /* 别走太远: 离老窝超过 5 步就往回拽 */
    function clampHome(it, tx, ty) {
      const lim = it.step[1] * 5;
      return [
        tx > lim ? lim : (tx < -lim ? -lim : tx),
        ty > lim ? lim : (ty < -lim ? -lim : ty)
      ];
    }

    /* 随便走一步 */
    function wander(it) {
      let dx = rand(-1, 1);
      let dy = rand(-1, 1) * 0.7;
      if (Math.random() < 0.35) { dy = 0; dx = Math.random() < 0.5 ? -1 : 1; }   // 偶尔直着走
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const dist = rand(it.step[0], it.step[1]);
      const t = clampHome(it, it.x + (dx / len) * dist, it.y + (dy / len) * dist);
      moveTo(it, t[0], t[1], rand(it.dur[0], it.dur[1]), "linear");
    }

    /* 飞出画面: 画面里的用用户单位, 贴图按屏幕实际位置现算 */
    function flyAway(it) {
      const r = it.el.getBoundingClientRect();
      const dir = Math.random() < 0.5 ? -1 : 1;
      let tx, ty;
      if (it.inScene) {
        tx = it.x + dir * 520;                              // 画布只有 480 宽, 520 足够飞出去
        ty = it.y - rand(30, 110);
      } else {
        const room = dir > 0 ? (window.innerWidth - r.left + 80) : (r.left + r.width + 80);
        tx = it.x + dir * room;
        ty = it.y + rand(-40, 40);
      }
      it.el.classList.add("is-away");                       // 渐隐, 免得贴着边缘僵住
      moveTo(it, tx, ty, rand(3.2, 4.2), "cubic-bezier(0.35, 0, 0.75, 0.35)");
    }

    /* 飞够了就回家: 先关过渡瞬移回老窝, 再自然走出来 */
    function comeBack(it) {
      it.el.style.transitionDuration = "0s";
      it.el.style.transform = "translate(0px, 0px)" + (it.facing < 0 ? " scaleX(-1)" : "");
      it.x = 0;
      it.y = 0;
      it.el.classList.remove("is-away");
      it.el.getBoundingClientRect();                        // 强制一次重排, 让 0 秒位移立即生效
      it.el.style.transitionDuration = "";
    }

    /* 每只动物自己的节拍: 走一步 → 歇一会儿 → 再走 / 偶尔飞出去 */
    function tick(it) {
      const r = it.el.getBoundingClientRect();
      if (document.hidden || r.width <= 0 || r.height <= 0) {
        it.timer = window.setTimeout(function () { tick(it); }, 1200);   // 看不见就等着
        return;
      }
      if (it.phase === "away") {
        comeBack(it);
        it.phase = "walk";
        it.timer = window.setTimeout(function () { tick(it); }, rand(500, 1400));
        return;
      }
      if (Math.random() < it.fly) {
        it.phase = "away";
        flyAway(it);
        it.timer = window.setTimeout(function () { tick(it); }, 4600 + rand(0, 1800));
        return;
      }
      wander(it);
      it.timer = window.setTimeout(function () { tick(it); }, it.dur[1] * 1000 + rand(it.idle[0], it.idle[1]));
    }

    /* ---- 鼠标蹭到 → 朝反方向惊走 (rAF 节流 + 0.2 秒位置缓存) ---- */
    const PAD = 6;
    const TTL = 200;
    let boxes = [];
    let boxesAt = 0;
    let px = null;
    let py = null;
    let rafId = 0;
    let touching = null;

    function measure() {
      boxes = [];
      list.forEach(function (it) {
        const r = it.el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        boxes.push({ it: it, left: r.left - PAD, top: r.top - PAD, right: r.right + PAD, bottom: r.bottom + PAD });
      });
      boxesAt = Date.now();
    }

    function hitTest(x, y) {
      if (!boxesAt || Date.now() - boxesAt > TTL) measure();
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return b;
      }
      return null;
    }

    function startle(it, x) {
      it.el.classList.add("is-touched");
      window.setTimeout(function () { it.el.classList.remove("is-touched"); }, 420);
      if (it.phase === "away") return;
      const rect = it.el.getBoundingClientRect();
      const dir = rect.left + rect.width / 2 >= x ? 1 : -1;               // 朝远离指针的方向
      const t = clampHome(
        it,
        it.x + dir * rand(it.step[1], it.step[1] * 1.8),
        it.y + rand(-it.step[1] * 0.6, it.step[1] * 0.6)
      );
      moveTo(it, t[0], t[1], 0.55, "cubic-bezier(0.3, 0, 0.7, 0.4)");
      window.clearTimeout(it.timer);                                      // 打乱原来的节拍
      it.timer = window.setTimeout(function () { tick(it); }, rand(900, 2100));
    }

    window.addEventListener("pointermove", function (e) {
      px = e.clientX;
      py = e.clientY;
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = 0;
        if (px === null) return;
        const b = hitTest(px, py);
        if (!b) {
          if (touching) { touching.classList.remove("is-touched"); touching = null; }
          return;
        }
        if (touching !== b.it.el) {
          if (touching) touching.classList.remove("is-touched");
          touching = b.it.el;
          startle(b.it, px);
        }
      });
    }, { passive: true });

    function forget() {
      px = null;
      py = null;
      if (touching) { touching.classList.remove("is-touched"); touching = null; }
      boxesAt = 0;
    }
    window.addEventListener("pointerleave", forget);
    window.addEventListener("pointercancel", forget);
    window.addEventListener("blur", forget);
    window.addEventListener("scroll", function () { boxesAt = 0; }, { passive: true, capture: true });
    window.addEventListener("resize", function () { boxesAt = 0; });

    measure();
    list.forEach(function (it) {
      it.timer = window.setTimeout(function () { tick(it); }, rand(300, 2600));
    });
  }

  /* ============ 初始化 ============ */
  initGamepad();        // 先绑手柄(顺便算一次缩放), 它要跟着首屏页面高亮
  applyLang();
  initPageNav();
  initAnimalWander();

  // 依据地址栏 hash 决定初始页
  const hash = (location.hash || "").replace("#page-", "").replace("#", "");
  if (["intro", "major", "hobbies", "contact", "board"].indexOf(hash) !== -1) {
    switchPage(hash, false);
  } else {
    switchPage("intro", false);
  }

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
