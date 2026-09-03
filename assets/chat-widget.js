/**
 * 璞合网站客服 Widget v3（P0 · SDR 获客版）
 * 小璞(创始人/中文) / 小合 Jade(投资人/英文) / SDR 前台守护(首访身份判定)
 * 新增：
 *   1) 稳定 visitor_id（浏览器指纹 + localStorage 30d）→ 跨会话认人
 *   2) SDR 分流：active 对话默认 agent=auto，后端判定身份后返回 route，
 *      前端记住 role，本会话后续消息续用该 agent（不重复判定）
 *   3) 行为触发（不打扰式）：
 *      - 滚动经过 [data-sdr] 区块（融资/BP/合作 CTA）→ 浮窗轻轻提示一次
 *      - 页面停留 > 55s 且有滚动 → 浮窗轻微上浮一次
 *      - 30 天内每 visitor 仅自动提示 ≤2 次（localStorage 记次）
 *   4) 只弹“气泡提示”，从不自动展开面板；点按钮才进入对话
 * 用法：<script defer src="/assets/chat-widget.js"
 *        data-worker="https://chat.pulitocapital.com" data-sdr="1"></script>
 */
(function () {
  if (window.__pulitoChatLoaded) return;
  window.__pulitoChatLoaded = true;

  var script = document.currentScript;
  // 默认指向璞合官网服务器双客服后端（HTTPS）；可用 data-worker 属性覆盖（与旧 widget 一致，避免漏配即失效）
  var WORKER = (script && script.getAttribute("data-worker")) || "https://chat.pulitocapital.com";
  var SDR_ENABLED = (script && script.getAttribute("data-sdr")) === "1";

  /* ---- 稳定 visitor_id（保留旧 session 兼容；有 localStorage 用指路标） ---- */
  function genFingerprint() {
    var n = (navigator.userAgent || "") + "|" + screen.width + "x" + screen.height + "|" + (navigator.language || "") + "|" + Intl.DateTimeFormat().resolvedOptions().timeZone + "|" + (location.hostname || "");
    var h = 0;
    for (var i = 0; i < n.length; i++) { h = ((h << 5) - h + n.charCodeAt(i)) | 0; }
    return "v_" + Math.abs(h).toString(36) + Date.now().toString(36).slice(-4);
  }
  function loadStore(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } }
  function saveStore(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {} }

  var VID_KEY = "pulito_vid_v3";
  var vid = localStorage.getItem(VID_KEY);
  if (!vid) { vid = genFingerprint(); localStorage.setItem(VID_KEY, vid); }
  // 记住上次对话解析出的身份（延续），存独立 key 避免被清
  var ROLE_KEY = "pulito_role_" + vid;
  var curRole = localStorage.getItem(ROLE_KEY) || ""; // ""|founder|investor
  // 行为触发次数
  var AUTO_KEY = "pulito_auto_" + vid;
  var autoCount = loadStore(AUTO_KEY, { n: 0, t: 0 });
  if (!autoCount.n) autoCount = { n: 0, t: 0 };

  var isEn = location.pathname.indexOf("/en/") === 0;
  var AVATAR_DEF = isEn
    ? "https://www.pulitocapital.com/assets/avatars/jade-circle.png"
    : "https://www.pulitocapital.com/assets/avatars/pula-circle.png";
  var TITLE_DEF = isEn ? "Pulito Capital · Investor Concierge" : "璞合资本 · 创始人接待";
  var SUBTITLE_DEF = isEn ? "AI concierge for investors" : "AI 前台小璞，聊聊你的项目 👋";
  var GREETING_DEF = isEn
    ? "Hi 👋 I'm Jade. Which firm are you with, and what stage do you focus on?"
    : "你好，我是璞合的 AI 前台。你是来找融资的创始人，还是投资人想看项目呢？";
  var PLACEHOLDER_DEF = isEn ? "Type your message…" : "说点什么吧…";

  /* 解析 data-sdr 页面区块(守门 CTA)显示名——页面在关键按钮/区块上加属性即可 */
  function ctaName(el) {
    var g = el && el.getAttribute && el.getAttribute("data-sdr");
    return g || null;
  }

  var styles = [
    "#pulito-chat-btn{position:fixed;right:22px;bottom:22px;width:60px;height:60px;border-radius:50%;background:#020C45;border:2px solid #D4AF37;cursor:pointer;z-index:9999;box-shadow:0 4px 16px rgba(2,12,69,.35);display:flex;align-items:center;justify-content:center;padding:4px;transition:transform .2s,bottom .3s,box-shadow .2s}",
    "#pulito-chat-btn:hover{transform:scale(1.06)}",
    "#pulito-chat-btn.attn{animation:pulitoPulse 1.6s ease-in-out 2;box-shadow:0 0 0 0 rgba(212,175,55,.6)}",
    "#pulito-chat-btn.up{bottom:30px}",
    "@keyframes pulitoPulse{0%{box-shadow:0 0 0 0 rgba(212,175,55,.55)}70%{box-shadow:0 0 0 14px rgba(212,175,55,0)}100%{box-shadow:0 0 0 0 rgba(212,175,55,0)}}",
    "#pulito-chat-btn img{width:100%;height:100%;border-radius:50%;object-fit:cover}",
    "#pulito-chat-badge{position:fixed;right:92px;bottom:30px;max-width:250px;background:#fff;border:1px solid rgba(2,12,69,.16);border-radius:14px;padding:10px 14px;font-size:13px;line-height:1.45;color:#1B2340;box-shadow:0 6px 24px rgba(2,12,69,.16);z-index:9998;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;display:none;cursor:pointer}",
    "#pulito-chat-badge.show{display:block;animation:pulitoFade .35s ease}",
    "@keyframes pulitoFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
    "#pulito-chat-badge .close{position:absolute;top:4px;right:8px;color:#99a;font-size:15px;line-height:1;background:none;border:none;cursor:pointer;padding:2px}",
    "#pulito-chat-panel{position:fixed;right:22px;bottom:94px;width:370px;max-width:calc(100vw - 32px);height:500px;max-height:calc(100vh - 130px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(2,12,69,.28);display:none;flex-direction:column;overflow:hidden;z-index:9997;border:1px solid rgba(212,175,55,.4);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}",
    "#pulito-chat-panel.open{display:flex}",
    ".pulito-hd{background:linear-gradient(135deg,#020C45,#0A1A5C);color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}",
    ".pulito-hd img{width:40px;height:40px;border-radius:50%;border:1.5px solid #D4AF37}",
    ".pulito-hd-t{font-weight:600;font-size:14px}",
    ".pulito-hd-s{font-size:11px;color:#C9D2F0;margin-top:1px}",
    "#pulito-chat-msgs{flex:1;overflow-y:auto;padding:14px;background:#F6F7FB;display:flex;flex-direction:column;gap:10px}",
    ".pulito-msg{max-width:84%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word}",
    ".pulito-msg.bot{align-self:flex-start;background:#fff;border:1px solid #E3E7F2;border-bottom-left-radius:4px;color:#1B2340}",
    ".pulito-msg.user{align-self:flex-end;background:#020C45;color:#fff;border-bottom-right-radius:4px}",
    ".pulito-ft{display:flex;gap:8px;padding:10px;border-top:1px solid #ECEEF5;background:#fff;flex-shrink:0}",
    "#pulito-chat-inp{flex:1;border:1px solid #D8DCE8;border-radius:20px;padding:9px 14px;font-size:13.5px;outline:none}",
    "#pulito-chat-inp:focus{border-color:#D4AF37}",
    "#pulito-chat-send{border:none;border-radius:20px;background:#020C45;color:#fff;padding:0 18px;font-size:13px;cursor:pointer;font-weight:600}",
    "#pulito-chat-send:disabled{opacity:.5}",
    ".pulito-typing{color:#8892B0;font-size:12.5px;padding:8px 13px;background:#fff;border:1px solid #E3E7F2;border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start}",
    ".pulito-sys{font-size:11px;color:#8a93b0;text-align:center;padding:6px 10px}",
    "@media(max-width:480px){#pulito-chat-panel{right:8px;bottom:86px;width:calc(100vw - 16px)}#pulito-chat-badge{right:80px}}",
  ].join("\n");

  function inject() {
    var st = document.createElement("style");
    st.textContent = styles;
    document.head.appendChild(st);

    /* 浮动按钮 */
    var btn = document.createElement("div");
    btn.id = "pulito-chat-btn";
    btn.title = curRole === "investor" ? "Investor Concierge · Jade" : (curRole === "founder" ? "创始人接待 · 小璞" : "璞合 AI 前台");
    btn.innerHTML = '<img src="' + AVATAR_DEF + '" alt="chat" loading="lazy">';
    document.body.appendChild(btn);

    /* 不打扰式气泡提示（SDR 主动钩子只出现这个，不自动展开面板） */
    var badge = document.createElement("div");
    badge.id = "pulito-chat-badge";
    badge.innerHTML = '<button class="close" aria-label="关闭">×</button><span id="pulito-chat-badge-txt">…</span>';
    document.body.appendChild(badge);
    var badgeTxt = badge.querySelector("#pulito-chat-badge-txt");
    var badgeShownThisPage = false;
    function showBadge(txt) {
      if (badgeShownThisPage || panel.classList.contains("open")) return;
      badgeTxt.textContent = txt;
      badge.classList.add("show");
      btn.classList.add("attn");
      badgeShownThisPage = true;
    }
    badge.addEventListener("click", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("close")) { hideBadge(); return; }
      openPanel(); hideBadge();
    });
    btn.addEventListener("click", function () { togglePanel(); hideBadge(); });
    function hideBadge() { badge.classList.remove("show"); badgeShownThisPage = true; }

    /* 面板 */
    var panel = document.createElement("div");
    panel.id = "pulito-chat-panel";
    panel.innerHTML =
      '<div class="pulito-hd"><img id="pulito-hd-avatar" src="' + AVATAR_DEF + '" alt=""><div><div class="pulito-hd-t" id="pulito-hd-t">' + TITLE_DEF + '</div><div class="pulito-hd-s" id="pulito-hd-s">' + SUBTITLE_DEF + "</div></div></div>" +
      '<div id="pulito-chat-msgs"><div class="pulito-msg bot">' + GREETING_DEF + "</div></div>" +
      '<div class="pulito-ft"><input id="pulito-chat-inp" placeholder="' + PLACEHOLDER_DEF + '"><button id="pulito-chat-send">发送</button></div>';
    document.body.appendChild(panel);

    var inp = panel.querySelector("#pulito-chat-inp");
    var sendBtn = panel.querySelector("#pulito-chat-send");
    var msgs = panel.querySelector("#pulito-chat-msgs");
    var hdAvatar = panel.querySelector("#pulito-hd-avatar");
    var hdT = panel.querySelector("#pulito-hd-t");
    var hdS = panel.querySelector("#pulito-hd-s");
    var activeAgent = curRole; // "" | founder | investor（延续）
    var open = false;

    /* 头像/标题按当前 active agent 变化 */
    function applyAgent(a) {
      activeAgent = a;
      curRole = a;
      try { localStorage.setItem(ROLE_KEY, a); } catch (e) {}
      var zh = a !== "investor";
      var set = {
        founder: { src: "https://www.pulitocapital.com/assets/avatars/pula-circle.png", t: "璞合资本 · 创始人接待", s: "AI 前台小璞，聊聊你的项目 👋", ph: "说说你的项目方向…" },
        investor: { src: "https://www.pulitocapital.com/assets/avatars/jade-circle.png", t: "Pulito Capital · Investor Concierge", s: "AI concierge for investors", ph: "Type your message…" },
        _: { src: zh ? "https://www.pulitocapital.com/assets/avatars/pula-circle.png" : "https://www.pulitocapital.com/assets/avatars/jade-circle.png", t: zh ? "璞合资本 · AI 前台" : "Pulito Capital · Concierge", s: zh ? "让我们聊聊，帮你找到对的人 🤝" : "Let's find the right person for you", ph: zh ? "说点什么吧…" : "Type your message…" }
      };
      var v = set[a] || set._;
      hdAvatar.src = v.src; hdT.textContent = v.t; hdS.textContent = v.s;
      inp.placeholder = v.ph;
      btn.innerHTML = '<img src="' + v.src + '" alt="chat" loading="lazy">';
      if (a === "investor") btn.title = "Investor Concierge · Jade";
      else if (a === "founder") btn.title = "创始人接待 · 小璞";
      else btn.title = "璞合 AI 前台";
    }
    if (!curRole) applyAgent("");
    else applyAgent(curRole);

    function addMsg(text, who) {
      var d = document.createElement("div");
      d.className = "pulito-msg " + who;
      d.textContent = text;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }
    function addSys(text) {
      var d = document.createElement("div");
      d.className = "pulito-sys";
      d.textContent = text;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }
    function openPanel() { open = true; panel.classList.add("open"); setTimeout(function () { inp.focus(); }, 60); }
    function togglePanel() { open = !open; panel.classList.toggle("open", open); if (open) setTimeout(function () { inp.focus(); }, 60); }

    async function send() {
      var text = inp.value.trim();
      if (!text || !WORKER) return;
      inp.value = "";
      addMsg(text, "user");
      var typing = document.createElement("div");
      typing.className = "pulito-typing"; typing.textContent = "…";
      msgs.appendChild(typing); sendBtn.disabled = true;
      try {
        var resp = await fetch(WORKER + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // 已知身份→直接用对 agent；未知→auto(走 SDR 首轮判定)
            agent: activeAgent || "auto",
            message: text, visitorId: vid, lang: isEn ? "en" : "zh",
          }),
        });
        var data = await resp.json();
        typing.remove();
        addMsg(data.reply || "（未收到回复，请稍后再试）", "bot");
        // 后端判定出身份 → 前端切换形象并锁定，之后续用该 agent
        if (data.agent && data.agent !== activeAgent) {
          applyAgent(data.agent === "investor" ? "investor" : "founder");
          if (data.agent === "investor" && data.route !== "investor") addSys("→ 正在由 Jade 接洽您的投资需求");
          else if (data.agent === "founder") addSys("→ 已为您转接融资顾问小璞");
        }
      } catch (e) {
        typing.remove();
        addMsg("网络开小差了，可以直接发邮件 bp@pulitocapital.com 📮", "bot");
      }
      sendBtn.disabled = false;
    }
    sendBtn.addEventListener("click", send);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

    /* ===== SDR 行为触发（不打扰式，仅气泡提示，不开面板） ===== */
    if (SDR_ENABLED && autoCount.n < 2) {
      var triggered = false;
      var txtByRole = {
        founder: isEn ? "Raising a round? Our founder advisors can help — tap here." : "在做融资吗？让我们聊聊，帮创始人对接 👋",
        investor: isEn ? "Looking at deal flow? Tap here to see what we're placing." : "想看我们近期的项目管线？点这里聊聊 👋",
        _: isEn ? "Founder raising, or investor scouting? Tap to chat." : "找融资 or 看项目？点这里聊两句 👋",
      };
      function fire(role) {
        if (triggered) return;
        var now = Date.now();
        if (now - lastInject < 2500) return; // 别在刚加载完就打扰
        triggered = true;
        showBadge(txtByRole[role] || txtByRole._);
        autoCount.n += 1; autoCount.t = now;
        saveStore(AUTO_KEY, autoCount);
      }
      // 1) 滚动经过 [data-sdr] 区块：≈判断访客身份（页面作者在融资CTA上加 data-sdr="founder"，投资CTA加 data-sdr="investor"）
      var sdrEls = document.querySelectorAll("[data-sdr]");
      if (sdrEls.length) {
        var fired = false;
        window.addEventListener("scroll", function () {
          if (fired) return;
          var max = window.scrollY + window.innerHeight * 0.6;
          for (var i = 0; i < sdrEls.length; i++) {
            var r = sdrEls[i].getBoundingClientRect();
            if (r.top < window.innerHeight * 0.75 && r.bottom > 0 && window.scrollY + r.top < max) {
              fire(ctaName(sdrEls[i])); fired = true; break;
            }
          }
        }, { passive: true });
      }
      // 2) 停留 > 55s 且有滚动 → 视为有意图，轻提示一次
      var dwTimer = setTimeout(function () {
        if (window.scrollY > 120) fire("");
      }, 55000);
      // 有手动交互则取消停留提示（已有关注）
      btn.addEventListener("mouseenter", function () { clearTimeout(dwTimer); });
    }
  }

  var lastInject = Date.now();
  var done = false;
  function tryInject() {
    if (done) return;
    done = true;
    inject();
    window.removeEventListener("scroll", tryInject);
    window.removeEventListener("touchstart", tryInject);
  }
  setTimeout(tryInject, 3000);// 保 LCP
  window.addEventListener("scroll", tryInject, { passive: true });
  window.addEventListener("touchstart", tryInject, { passive: true });
  window.addEventListener("load", function () { /* 加载完成后再放行停留逻辑由内层处理 */ });
})();
