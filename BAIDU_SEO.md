# 璞合资本 · 百度 SEO 配置指南

## 一、注册百度搜索资源平台

1. 打开 https://ziyuan.baidu.com
2. 用百度账号登录
3. 点击「添加站点」→ 输入 `www.pulitocapital.com`
4. 选择验证方式：**文件验证**
   - 下载验证文件
   - 放到 `pulito-site/` 目录下
   - 执行 `git add && git commit && git push`
   - 点「完成验证」

> 或直接复制验证 HTML 标签，放到 `pulito-site/index.html` 的 `<head>` 里。

## 二、配置 Token（环境变量）

验证通过后：
1. 进入站点管理 → 「普通收录」→ 「API推送」
2. 复制你的 token
3. 在本机设置环境变量：

```bash
cd ~/.openclaw/workspace
echo 'export BAIDU_ZIYUAN_TOKEN="你的token"' >> .env
```

以后每次 `python3 gen.py` 或 `site-maintain.sh` 执行时，
会自动推送所有文章 URL 到百度收录接口。

## 三、提交 Sitemap

1. 百度资源平台 → 「普通收录」→ 「Sitemap」
2. 提交：`https://www.pulitocapital.com/sitemap.xml`
3. 百度会自动定期抓取

## 四、验证效果

```bash
# 检查域名是否已开始被收录
curl "https://www.baidu.com/s?wd=site:pulitocapital.com"
```

## 五、日常维护

代码已自动完成：
- ✅ `robots.txt` 已配置
- ✅ `sitemap.xml` 自动生成（每次 gen.py）
- ✅ 文章 URL 自动推送（gen.py 带 BAIDU_TOKEN 时）
- ✅ 记得先把 baidu_verify_placeholder.html 替换成百度给的文件
