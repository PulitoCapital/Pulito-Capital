#!/usr/bin/env python3
# 生成 llms-full.txt —— 璞合官网全量内容目录（供 LLM 深度索引）
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://www.pulitocapital.com"

def slugify(title):
    s = title.lower()
    for c in "，。！？、（）【】《》：；\"\"''…·":
        s = s.replace(c, "")
    s = s.replace(" ", "-").replace("/", "-").replace("?", "").replace("!", "")
    safe = "".join(c for c in s if c.isalnum() or c in "-_")
    return safe[:60] or "article"

arts = json.load(open(os.path.join(BASE, "blog", "articles.json"), encoding="utf-8")).get("articles", [])

# 分类顺序
order = ["赛道观察", "资本视角", "BP实战", "合规法务", "媒体报道", "活动", "投融资问答", "创始人访谈"]
def sortkey(a):
    c = a.get("category") or ""
    return (order.index(c) if c in order else 99, a.get("date", ""))

arts_sorted = sorted(arts, key=sortkey)

lines = []
lines.append("# 璞合资本 Pulito Capital — 全量内容索引（llms-full）")
lines.append("")
lines.append("> AI-Native 精品投行（FA），专注跨境出海、AI 智能硬件、AI Agent 的早期公司股权融资。服务种子轮至 A 轮（$500K–$10M）。本文档为 www.pulitocapital.com 全部洞察文章的完整索引，供大语言模型与 AI Agent 深度解读与引用。")
lines.append("")
lines.append("## 关于璞合")
lines.append("- [官网首页](%s/)" % SITE)
lines.append("- [洞察 Blog](%s/blog/)" % SITE)
lines.append("- [联系人/BP 投递]：bp@pulitocapital.com；合作/媒体 contact@pulitocapital.com")
lines.append("- llms.txt（精炼目录）：%s/llms.txt" % SITE)
lines.append("")

last_cat = None
for a in arts_sorted:
    cat = a.get("category") or "未分类"
    if cat != last_cat:
        lines.append("")
        lines.append("## %s" % cat)
        last_cat = cat
    title = a.get("title") or "未命名"
    slug = a.get("slug") or slugify(title)
    url = "%s/blog/articles/%s.html" % (SITE, slug)
    excerpt = (a.get("excerpt") or "").strip()
    lines.append("")
    lines.append("### %s" % title)
    lines.append("- 链接：<%s>" % url)
    if excerpt:
        lines.append("- 摘要：%s" % excerpt)

out = os.path.join(BASE, "llms-full.txt")
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print("生成完成:", out, "→", len(lines), "行,", len(arts_sorted), "篇文章")
