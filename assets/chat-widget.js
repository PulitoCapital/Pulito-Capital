/**
 * 璞合网站客服 Widget — 小璞（创始人/中文）/ 小合（投资人/英文）
 * 用法：<script src="/assets/chat-widget.js" data-worker="https://xxx.workers.dev" defer></script>
 * SEO 安全：异步注入、position:fixed 不占文档流、不写正文 DOM
 */
(function () {
  if (window.__pulitoChatLoaded) return;
  window.__pulitoChatLoaded = true;

  var script = document.currentScript;
  // 默认指向璞合官网服务器双客服后端；可用 data-worker 属性覆盖
  var WORKER = (script && script.getAttribute("data-worker")) || "http://114.132.236.63:8787";

  // 按路径分流：/en/ → investor(小合)，其余 → founder(小璞)
  var isEn = location.pathname.indexOf("/en/") === 0;
  var AGENT = isEn ? "investor" : "founder";
  var NAME = isEn ? "Jade" : "小璞";
  var TITLE = isEn ? "Pulito Capital · Investor Concierge" : "璞合资本 · 创始人接待";
  var SUBTITLE = isEn
    ? "AI concierge for investors — deal flow, anonymized."
    : "AI 前台小璞，聊聊你的项目 👋";
  var AVATAR = isEn
    ? "https://www.pulitocapital.com/assets/avatars/jade-circle.png"
    : "https://www.pulitocapital.com/assets/avatars/pula-circle.png";
  var PLACEHOLDER = isEn ? "Type your message…" : "说说你的项目方向…";

  var GREETING = isEn
    ? "Hi 👋 I'm Jade, Pulito Capital's AI concierge. Which firm are you with, and what stage do you focus on?"
    : "你好呀，我是小璞 🤝 璞合的 AI 前台。方便介绍一下你的项目方向、阶段和这轮想融多少吗？";

  // 会话 ID（30 天持久）
  var SID_KEY = "pulito_chat_sid";
  var sid = localStorage.getItem(SID_KEY);
  if (!sid) {
    sid = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SID_KEY, sid);
  }

  var styles = [
    "#pulito-chat-btn{position:fixed;right:22px;bottom:22px;width:60px;height:60px;border-radius:50%;background:#020C45;border:2px solid #D4AF37;cursor:pointer;z-index:9999;box-shadow:0 4px 16px rgba(2,12,69,.35);display:flex;align-items:center;justify-content:center;padding:4px;transition:transform .2s}",
    "#pulito-chat-btn:hover{transform:scale(1.06)}",
    "#pulito-chat-btn img{width:100%;height:100%;border-radius:50%;object-fit:cover}",
    "#pulito-chat-panel{position:fixed;right:22px;bottom:94px;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 130px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(2,12,69,.28);display:none;flex-direction:column;overflow:hidden;z-index:9999;border:1px solid rgba(212,175,55,.4);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}",
    "#pulito-chat-panel.open{display:flex}",
    ".pulito-hd{background:linear-gradient(135deg,#020C45,#0A1A5C);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}",
    ".pulito-hd img{width:40px;height:40px;border-radius:50%;border:1.5px solid #D4AF37}",
    ".pulito-hd-t{font-weight:600;font-size:14px}",
    ".pulito-hd-s{font-size:11px;color:#C9D2F0;margin-top:2px}",
    "#pulito-chat-msgs{flex:1;overflow-y:auto;padding:14px;background:#F6F7FB;display:flex;flex-direction:column;gap:10px}",
    ".pulito-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word}",
    ".pulito-msg.bot{align-self:flex-start;background:#fff;border:1px solid #E3E7F2;border-bottom-left-radius:4px;color:#1B2340}",
    ".pulito-msg.user{align-self:flex-end;background:#020C45;color:#fff;border-bottom-right-radius:4px}",
    ".pulito-ft{display:flex;gap:8px;padding:10px;border-top:1px solid #ECEEF5;background:#fff;flex-shrink:0}",
    "#pulito-chat-inp{flex:1;border:1px solid #D8DCE8;border-radius:20px;padding:9px 14px;font-size:13.5px;outline:none}",
    "#pulito-chat-inp:focus{border-color:#D4AF37}",
    "#pulito-chat-send{border:none;border-radius:20px;background:#020C45;color:#fff;padding:0 18px;font-size:13px;cursor:pointer;font-weight:600}",
    "#pulito-chat-send:disabled{opacity:.5}",
    ".pulito-typing{color:#8892B0;font-size:12.5px;padding:8px 13px;background:#fff;border:1px solid #E3E7F2;border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start}",
    "@media(max-width:480px){#pulito-chat-panel{right:8px;bottom:86px;width:calc(100vw - 16px)}}",
  ].join("\n");

  function inject() {
    var st = document.createElement("style");
    st.textContent = styles;
    document.head.appendChild(st);

    var btn = document.createElement("div");
    btn.id = "pulito-chat-btn";
    btn.innerHTML = '<img src="' + AVATAR + '" alt="chat" loading="lazy">';
    document.body.appendChild(btn);

    var panel = document.createElement("div");
    panel.id = "pulito-chat-panel";
    panel.innerHTML =
      '<div class="pulito-hd"><img src="' + AVATAR + '" alt="">' +
      '<div><div class="pulito-hd-t">' + TITLE + '</div><div class="pulito-hd-s">' + SUBTITLE + "</div></div></div>" +
      '<div id="pulito-chat-msgs"><div class="pulito-msg bot">' + GREETING + "</div></div>" +
      '<div class="pulito-ft"><input id="pulito-chat-inp" placeholder="' + PLACEHOLDER + '">' +
      '<button id="pulito-chat-send">发送</button></div>';
    document.body.appendChild(panel);

    var inp = panel.querySelector("#pulito-chat-inp");
    var sendBtn = panel.querySelector("#pulito-chat-send");
    var msgs = panel.querySelector("#pulito-chat-msgs");
    var open = false;

    btn.addEventListener("click", function () {
      open = !open;
      panel.classList.toggle("open", open);
      if (open) inp.focus();
    });

    function addMsg(text, who) {
      var d = document.createElement("div");
      d.className = "pulito-msg " + who;
      d.textContent = text;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    async function send() {
      var text = inp.value.trim();
      if (!text || !WORKER) return;
      inp.value = "";
      addMsg(text, "user");
      var typing = document.createElement("div");
      typing.className = "pulito-typing";
      typing.textContent = "…";
      msgs.appendChild(typing);
      sendBtn.disabled = true;
      try {
        var resp = await fetch(WORKER + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent: AGENT, message: text, sessionId: sid }),
        });
        var data = await resp.json();
        typing.remove();
        addMsg(data.reply || "（未收到回复，请稍后再试）", "bot");
      } catch (e) {
        typing.remove();
        addMsg("网络开小差了，可以直接发邮件 bp@pulitocapital.com 📮", "bot");
      }
      sendBtn.disabled = false;
    }

    sendBtn.addEventListener("click", send);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  }

  // 延迟注入：3s 后或首次滚动/触摸，避免影响 LCP
  var done = false;
  function tryInject() {
    if (done) return;
    done = true;
    inject();
    window.removeEventListener("scroll", tryInject);
    window.removeEventListener("touchstart", tryInject);
  }
  setTimeout(tryInject, 3000);
  window.addEventListener("scroll", tryInject, { passive: true });
  window.addEventListener("touchstart", tryInject, { passive: true });
})();
