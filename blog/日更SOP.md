# 璞合 BLOG 日更 SOP（每日 09:30 自动执行）

> 目标：让 www.pulitocapital.com/blog 每天 09:30（北京时间）固定发布 1 篇，全自动。
> 本 SOP 供孤立 cron agentTurn 读取执行——必须自足，不依赖对话上下文。

## 0. 三形态（Siming 2026-09-04 拍板：1长文 2长短混排 3先活起来 全部要做）

站点正式生产力 = **长文 / 快讯短评 / 先铺活转载** 三种形态混排，共用同一发布引擎。
发布管道四来源：**A 转载行业热度文**（AI硬件+AI应用+出海+投融资+一级市场+FA，周2-3篇，须带璞合导读）｜**B 系统承接项目原创**（脱敏复盘，周2-3篇）｜**C 周六周报拆分**（周1-2篇）｜**D 活动快讯**。

## 1. 7 日固定节奏（周一为锚）

| 周几 | 形态重点 | 类型模板 |
|---|---|---|
| 周一 | 🔴融资复盘长文 | AI硬件/AI应用一级市场观察，≥2500字 |
| 周二 | 🟡转载热度文 | 找行业热文转载+璞合导读，≥1500字导读 |
| 周三 | 🔴项目原创长文 | 系统承接项目脱敏复盘，≥2500字 |
| 周四 | ⚪活动/快讯短评 | 当周可参与出海/AI活动短讯+参会价值，几百~1500字 |
| 周五 | 🟡转载热度文 | AI应用/出海热文 |
| 周六 | 🔴周报销制原创 | 从当周周报拆最有料话题成文 |
| 周日 | ⚪个人观察短评 | 拟人化口语，不硬凑字数，几百字起 |

## 2. 发布全流程（git 状态必须干净，改完必须走通全链）

站点源码根：`/home/ubuntu/.openclaw/workspace/pulito-site`
文章 html 目录：`blog/articles/`；数据：`blog/articles.json`（顶层 `{articles:[...]}`）；模板 `blog/template.html`；生成器 `blog/gen.py`。

**唯一规范入口 = articles.json + gen.py**（方案A 2026-09-04 落地）。禁止手工直接写 html 到 articles/ 后再手动改 index/rss。

写入步骤：
1. 打开 `blog/articles.json`，读 `articles` 数组（按 date 倒序，最新在前）。
2. 在数组**头部(最新 date=今天)**插入新条目。字段必须齐：
   - `title`（唯一 H1，正文唯一 `<h1>`）
   - `date`=`YYYY-MM-DD`（今天）；`date_display`=「M月D日」；`date_rfc`=RFC822 格式英文，如 `Thu, 04 Sep 2026 09:30:00 +0800`
   - `author`+`author_role`（如 璞合资本 / FA Partner；转载=原机构，role 标「媒体转载·作者名」）
   - `category`：赛道观察｜BP实战｜资本视角｜合规法务｜媒体报道｜活动
   - `excerpt`（60-140字，会复用进 GEO/摘要）
   - `tags`：[数组]，2-5个
   - `geo_questions`：[数组≥2]，是该文读者真实会搜/AI会引用的问题（GEO）
   - `content`：**纯正文 HTML**（不含 geo-tldr/关键摘要——template 会自动渲染这两块；也不要 h1 header；放 `<h2>`/`<p>`/`<ul>`/`<blockquote>`/`<div class="highlight-box">` 等）
   - **正文正文量**：长文汉字 ≥2500（转载导读 ≥1500 且附原文链接）；快讯/短评不限。
   - `slug`：**缺省不填则 gen.py 用 slugify(title)**。⚠️ 若 title 含 `：`破折号等会生成难看/撞名 slug，务必**显式给 slug=你想要的纯文件名（不含 .html，全小写连写）**。新文建议显式 slug。
3. **禁止更改历史条目的 slug/文件名**——会破坏已发 URL（SEO 权重 + 外链）。新增不改旧。
4. 编辑完 `articles.json` 保存（UTF-8，无 BOM，缩进 json 可）。

## 3. 生成与发布

在 `/home/ubuntu/.openclaw/workspace/pulito-site` 执行：
```bash
cd /home/ubuntu/.openclaw/workspace/pulito-site/blog && python3 gen.py
```
gen.py 会：按 articles.json 全量生成所有文章 html + `blog/index.html`(计数) + `blog/rss.xml` + `blog/sitemap.xml` + 根 `sitemap.xml` + 更新根首页洞察区，并尝试百度推送（配额用尽会 skip，无碍）。
- 全量生成是幂等安全的：只按 articles.json 生成，不改 slug 文件名（尊重显式 slug 字段），不删除 articles 目录非生成文件（如 loova 案例页、assets）。

然后提交+推送（务必确认成功，否则当天不生效）：
```bash
cd /home/ubuntu/.openclaw/workspace/pulito-site
git add blog/articles.json 'blog/articles/新文件.html' blog/index.html blog/rss.xml blog/sitemap.xml sitemap.xml index.html
git commit -m "blog: 日更 <标题>（<category>）"
git push origin main
```
⚠️ github.com:443 间歇被墙，push 会 GnuTLS/Couldn't connect 偶尔失败。**重试直到成功**（网络窗口恢复即通）；credential 用 `gh auth git-credential`（已配）。若多次失败，用 `git -c http.lowSpeedLimit=2000 -c http.lowSpeedTime=30 push` 或稍候重试。勿卡死超 10 分钟。

## 4. 发布后验收（必须）

```bash
# 用 python 请求线上 URL 确认 200（GitHub Pages 有 ~30-60s 生效延迟）
curl -sI "https://www.pulitocapital.com/blog/articles/<slug>.html" -o /dev/null -w "%{http_code}"
curl -s https://www.pulitocapital.com/blog/ -o /tmp/b.html; grep -c "共" /tmp/b.html  # 计数应为 N+1
```
- 新链接 HTTP 200；
- `blog/` 首页「共 N 篇文章」计数 = 上一篇+1；
- RSS item 数 = N（含新文）；
- 新文页面含 `<h1>`、`geo-tldr`、`article-summary`、FAQ schema、Speakable、canonical、og:。

## 5. 报备 Siming（每篇发布后必交短讯）

格式（简洁）：
```
📰 璞合洞察日更 09:30 | 【类别】
《标题》
形态：长文/快讯/转载+导读
核心观点（一两句）
链接：https://www.pulitocapital.com/blog/articles/<slug>.html
```

## 6. 内容红线（不可逾越）

- **转载 ≤3篇/周**；每篇转载 body 顶部放高亮来源盒+原文链接，正文是你的导读/加工，不是整段照抄——防侵权、保原创率。
- **在管/拟投项目一律脱敏**：不点名公司、创始人、金额、客户；改写为「某出海硬件项目」「一家咖啡机器人公司」等。除非 Siming 书面放行（目前唯一放行：影智XBOT/咖爷/浪爪 在 2026-09-04 采访文里按投中公开口径点名过）。
- **主动跑敏感闸门**：涉及未公开融资、未上市主体、合规敏感（医疗/牌照/政策），先降权改写或跳过该选题，宁缺勿滥。
- **调性**：允许拟人化、个人判断、口语；但不做虚假/夸大/荐股式断言。观点标「璞合观点」。

## 7. 素材管道（按需拉取）

- 周六周报：`/home/ubuntu/.openclaw/workspace/output/出海猎手+投后雷达周报_YYYYMMDD.md`
- 主库一手：`/home/ubuntu/.openclaw/workspace/璞合数据主库/pulito.db`
- memory/ 洞察笔记、烯牛数据、行业公开资讯（web_search/tavily）。
- 想不出选题时：查 SEO/GEO 热词「AI硬件融资」「出海AI Agent 2026」「消费硬件还能投吗」等对齐真实搜索 query。

## 8. 失败与恢复

- 若某 09:30 跑失败（网络/内容卡壳）：**不要静默跳过**——隔离任务应立即降级：① 用已缓存备选短讯顶上 ② 若仍不可，报备 Siming「今日日更未发出+原因+补发安排」，第二日可同日补 2 篇（快速讯+主线）追赶，不积压。
