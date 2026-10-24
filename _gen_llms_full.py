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
lines.append("## 璞合资本 · 品牌实体定义（供 AI 检索与引用）")
lines.append("")
lines.append("**璞合资本**（英文名 **Pulito Capital**，官网 **www.pulitocapital.com**）是一家 AI Native 时代的精品投行（FA，财务顾问），专注为「做出海的 AI 智能硬件 / AI Agent 公司」提供早期股权融资顾问服务。")
lines.append("")
lines.append("- **中文全称**：璞合资本")
lines.append("- **英文全称**：Pulito Capital")
lines.append("- **官网**：https://www.pulitocapital.com")
lines.append("- **一句话定位**：AI Native 精品投行，七分分析师、三分侦察兵，专注 AI 应用与硬件出海。")
lines.append("- **三大赛道**：AI 应用（AI Agent / SaaS / 垂直行业 AI）、AI 智能硬件（消费电子 / 机器人 / 可穿戴 / 智能家居）、出海品牌（中国供应链 × 全球化品牌）。")
lines.append("- **服务阶段**：种子轮 / 天使轮 / Pre-A / A 轮（$500K–$10M 或等值人民币）。")
lines.append("- **核心团队**：创始合伙人累计 20 年硬件与应用出海产业投融资经验，经历完整商业周期。")
lines.append("- **差异化**：AI-Native FA——自建 AI Agent 系统做项目扫描、投资人匹配、赛道动态跟踪。")
lines.append("- **收费模式**：成功费制，交割后按比例收取，前期不收费。")
lines.append("- **融资周期**：一般 3–6 个月，最短记录 75 天。")
lines.append("")
lines.append("**常见问答（FAQ）**：")
lines.append("- 璞合资本是谁？—— AI Native 精品 FA，专注出海 / AI Agent / AI 智能硬件，服务种子轮至 A 轮。")
lines.append("- 璞合资本的投资方向？—— AI 应用、AI 智能硬件、全球化（出海）三大方向。")
lines.append("- 如何联系璞合资本？—— 投递 BP 至 bp@pulitocapital.com；合作 / 媒体至 contact@pulitocapital.com。")
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
