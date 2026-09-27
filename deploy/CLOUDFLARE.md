# 部署到 Cloudflare Pages（Git 自动部署）

纯静态站 + 全球 CDN + 自动 HTTPS，免费。以后「push 即上线」。

## 前提
- 本地项目已完成 `git init` + 首次提交（已完成 ✅）
- 你有 GitHub 和 Cloudflare 账号

---

## 第 1 步：推送到 GitHub

1. GitHub 右上角 `New repository`，名称填 `muexe`，**不要勾选** README / .gitignore（保持空仓库）。
2. 本地执行（把 `你的用户名` 换成你的 GitHub 用户名）：

```bash
cd "D:\网站\workbuddy\muexe"
git remote add origin https://github.com/你的用户名/muexe.git
git branch -M main
git push -u origin main
```

推送成功后 GitHub 仓库里能看到 `build.py`、`src/`、`assets/` 等文件。

---

## 第 2 步：Cloudflare Pages 连接仓库

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选 GitHub → 授权 → 选 `muexe` 仓库 → **Begin setup**。
3. 构建配置填：

| 配置项 | 值 |
|---|---|
| Build command | `python build.py` |
| Build output directory | `dist` |

> 无需任何环境变量 —— `build.py` 只用 Python 标准库，Cloudflare 构建环境已预装 Python 3。

4. 点 **Save and Deploy**，几十秒后得到 `muexe.pages.dev` 临时域名。

---

## 第 3 步：绑定 muexe.com（顺带解决域名解析）

1. Pages 项目 → **Custom domains** → **Set up a custom domain** → 输入 `muexe.com`。
2. Cloudflare 会提示把域名的 **Nameserver（NS）** 改成它给的两个地址。
3. 到你的域名注册商后台，把 NS 改成 Cloudflare 提供的地址，等生效（几分钟到几小时）。
4. 生效后 Cloudflare 自动签发 HTTPS 证书，`https://muexe.com` 即可访问。

> 这一步顺便把之前「已买未解析」的问题解决了，还免费获得 DNS 托管 + 全球 CDN。

---

## 第 4 步：提交 sitemap 给 Google（SEO 收尾）

1. Google Search Console → 添加资源 → 输入 `muexe.com`（用 Cloudflare 的 DNS 记录验证最方便）。
2. 左侧 **Sitemaps** → 提交 `https://muexe.com/sitemap.xml`。

---

## 以后更新（全自动）

改完代码（比如加了新工具），执行：

```bash
git add -A && git commit -m "add: 新工具" && git push
```

Cloudflare 自动重新构建并上线，无需其他操作。

> ⚠️ 新增工具时，先本地生成它的分享图（OG + Pin 图）再 push：
> ```bash
> python generate_images.py
> ```

---

## 本地常用命令速查

| 操作 | 命令 |
|---|---|
| 加新工具 | `python add_tool.py "工具名" --cat 分类` |
| 重新构建 | `python build.py` |
| 生成本地预览 | `python -m http.server 8765 --directory dist` |
| 生成分享图 | `python generate_images.py` |
