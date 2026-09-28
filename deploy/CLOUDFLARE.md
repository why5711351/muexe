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

1. Cloudflare Dashboard → **Workers & Pages** → **Create application**。
2. ⚠️ **关键**：创建页有 **Workers** 和 **Pages** 两个标签，**默认停在 Workers**，必须手动点 **Pages** 标签，再选 **Connect to Git**。
   > 进错 Workers 会出现「部署命令 / 构建令牌 / 构建变量」等字段，且找不到「Build output directory」。看到这些字段说明进错入口了，退回重点 Pages。
3. 选 GitHub → 授权 → 选 `muexe` 仓库 → **Begin setup**。
4. 构建配置填：

| 配置项 | 值 |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `python build.py` |
| Build output directory | `dist` |
| Root directory | 留空 |

> 无需任何环境变量 —— `build.py` 只用 Python 标准库，Cloudflare 构建环境已预装 Python 3。若报 `python: command not found`，把命令改成 `python3 build.py`。

5. 点 **Save and Deploy**，几十秒后得到 `muexe.pages.dev` 临时域名。

---

## 第 3 步：绑定 muexe.com 和 www.muexe.com

分两小步：**先把域名接入 Cloudflare，再绑到 Pages**（顺序不能反）。

### 3.1 先把 muexe.com 接入 Cloudflare（改 NS）

1. Cloudflare 首页右上 **Add a site / 添加站点** → 输入 `muexe.com` → 选 **Free** 计划。
2. Cloudflare 扫描现有 DNS 记录（还没解析过的话是空的，直接下一步）。
3. Cloudflare 给你两个 **Nameserver 地址**（形如 `xxx.ns.cloudflare.com` / `yyy.ns.cloudflare.com`）。
4. 到**买域名的注册商**后台（阿里云/腾讯云/GoDaddy/Namecheap 等），把域名的 NS 服务器改成上面两个地址。
5. 等生效（通常几分钟，最长 24 小时）。Cloudflare 状态变为 **Active** 即完成。

### 3.2 在 Pages 绑定两个域名

1. Pages 项目 → **Custom domains** → **Set up a custom domain**。
2. 输入 `muexe.com` → **Continue**。因为域名已在 Cloudflare，它会**自动创建 DNS 记录**（裸域用 CNAME flattening，无需手动配 A 记录）。
3. 再点一次 **Set up a custom domain** → 输入 `www.muexe.com` → **Continue**（自动创建 CNAME `www` → `muexe.pages.dev`）。
4. Cloudflare 自动签发 HTTPS 证书（Universal SSL），等 1~2 分钟后：
   - `https://muexe.com` ✅
   - `https://www.muexe.com` ✅

### 3.3（可选）统一主域，避免 SEO 重复内容

两个域名都能访问后，建议让一个 301 跳转到另一个，防止 Google 把两个当重复页。二选一：

- 方案 A：`www.muexe.com` 301 → `muexe.com`（裸域为主，更简洁）
- 方案 B：`muexe.com` 301 → `www.muexe.com`（www 为主）

在 Cloudflare 域名面板 → **Rules / Redirect Rules** 里加一条 301 规则即可；不设也能用，只是 SEO 略吃亏。

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
