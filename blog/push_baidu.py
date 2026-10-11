#!/usr/bin/env python3
"""
百度主动推送 · 独立脚本（供 cron 每日调用）
- 从 sitemap.xml 读取全量 URL 快照
- 与 .baidu_pushed.json 账本比对，只推「未推过的 URL」
- 配额极小（每日 remain≈7-10 条），按 URL 顺序每次推一小批
用法：python3 push_baidu.py [--limit N]
"""
import json, os, re, sys, time

BASE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://www.pulitocapital.com"
BAIDU_TOKEN = "AgshR8YotwUmhPcT"
BAIDU_PUSH_API = f"http://data.zz.baidu.com/urls?site={SITE}&token={BAIDU_TOKEN}"
LEDGER = os.path.join(BASE, ".baidu_pushed.json")

def load_sitemap_urls():
    """从 sitemap.xml 读 URL 列表（保持顺序）"""
    p = os.path.join(BASE, "sitemap.xml")
    if not os.path.exists(p):
        print("⚠️  找不到 sitemap.xml")
        return []
    txt = open(p, encoding="utf-8").read()
    urls = re.findall(r"<loc>(.*?)</loc>", txt)
    return urls

def load_ledger():
    if os.path.exists(LEDGER):
        try:
            return set(json.load(open(LEDGER, encoding="utf-8")))
        except Exception:
            return set()
    return set()

def save_ledger(pushed):
    with open(LEDGER, "w", encoding="utf-8") as f:
        json.dump(sorted(pushed), f, ensure_ascii=False, indent=1)

def main():
    limit = 5
    if "--limit" in sys.argv:
        try:
            limit = int(sys.argv[sys.argv.index("--limit") + 1])
        except Exception:
            pass

    try:
        import requests
    except ImportError:
        print("⏭️  需要 requests 库")
        sys.exit(0)

    all_urls = load_sitemap_urls()
    pushed = load_ledger()
    # 候选：未推过的 URL，按 sitemap 顺序（首页/blog 优先已在前面）
    candidates = [u for u in all_urls if u not in pushed]

    if not candidates:
        print("✅ 全部 URL 均已推送过，无新 URL")
        return

    batch = candidates[:limit]
    data = "\n".join(batch)
    try:
        resp = requests.post(
            BAIDU_PUSH_API,
            data=data.encode("utf-8"),
            headers={"Content-Type": "text/plain"},
            timeout=15,
        )
        result = resp.json()
        ok = result.get("success", 0)
        remain = result.get("remain", 0)
        print(f"📡 百度推送: 提交{len(batch)}条 成功{ok}条 剩余{remain}条/天")
        if ok:
            for u in batch[:ok]:
                pushed.add(u)
            save_ledger(pushed)
        if result.get("not_same_site"):
            print(f"⚠️  未验证站点，{result['not_same_site']}条未推送")
        if result.get("error"):
            print(f"⚠️  百度返回错误: {result}")
    except Exception as e:
        print(f"⚠️  百度推送失败: {e}")

if __name__ == "__main__":
    main()
