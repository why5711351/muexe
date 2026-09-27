# Muexe.com 部署指引（腾讯云 + 宝塔）

本站是纯静态站，`dist/` 即完整站点，任何静态托管均可。以下按你的环境（宝塔）分步执行。

---

## 第 1 步：域名解析（先做，生效需几分钟~24小时）

到你的域名注册商（阿里云/腾讯云/Namecheap 等）DNS 管理里添加两条记录，指向你腾讯云服务器的公网 IP：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A    | @       | 你的服务器IP |
| A    | www     | 你的服务器IP |

验证是否生效（本机执行）：
```
nslookup muexe.com
```

> ⚠️ 若服务器在国内大陆，域名需完成 ICP 备案才能绑定 80/443 端口；未备案可改用香港/海外节点或 Cloudflare。

## 第 2 步：宝塔添加站点

1. 宝塔面板 → **网站** → **添加站点**
2. 域名填：`muexe.com` 和 `www.muexe.com`
3. 根目录填：`/www/wwwroot/muexe.com`
4. PHP 版本选「纯静态」，不创建数据库
5. 提交后，把 `dist/` 里的**所有内容**（不是 dist 文件夹本身）上传到该根目录

上传方式（任选）：
- 宝塔文件管理器直接上传 dist 内容
- 或本机 PowerShell 打包后用 SFTP 工具（WinSCP）上传：
  ```powershell
  Compress-Archive -Path D:\网站\workbuddy\muexe\dist\* -DestinationPath D:\muexe-dist.zip
  ```
  上传 zip 到根目录后，在宝塔里解压。

## 第 3 步：申请 SSL 证书（HTTPS 必须，Google 排名因素）

宝塔 → 网站 → muexe.com → **SSL** → Let's Encrypt → 勾选两个域名 → 申请，
并开启「强制 HTTPS」。

## 第 4 步：Nginx 优化配置（可选但推荐）

宝塔 → 网站 → 设置 → **配置文件**，在 `server { }` 内加入 `deploy/nginx-snippet.conf` 的内容
（开启 gzip 与静态资源长缓存）。

## 第 5 步：上线后必做（SEO 关键）

1. **Google Search Console**：https://search.google.com/search-console
   - 添加资源 → 验证 muexe.com（DNS TXT 记录验证最方便）
   - 提交 sitemap：`https://muexe.com/sitemap.xml`
2. **Bing Webmaster Tools**：可从 GSC 一键导入
3. 用 GSC 的「网址检查 → 请求编入索引」提交首页和每个工具页，加速收录
4. **AdSense**：流量稳定后到 https://adsense.google.com 申请，
   通过后把发布商 ID 填进 `build.py` 的 `ADSENSE_CLIENT`，重新 `python build.py` 并上传
5. **Pinterest**：注册 Pinterest Business 账号 → 设置里验证 muexe.com →
   用每个工具页的「Save to Pinterest」按钮把 Pin 图发到你的 Board（每工具 2-3 张，含关键词描述）

## 日常新增工具

1. 在 `src/tools.json` 加一条工具数据（slug/name/SEO 文案/FAQ）
2. 在 `src/content/` 新增 `<slug>.html` 和 `<slug>.js`（交互区）
3. 运行 `python build.py` → 首页、导航、sitemap、搜索索引**自动更新**
4. 上传新的 `dist/` 覆盖即可
