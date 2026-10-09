# YouTube 视频总结工具 — 部署指南

这个工具和其他工具不同：它需要一个**轻量后端**（抓字幕 + 调 AI），无法纯前端实现。
后端用 **Cloudflare Pages Functions** 实现，随你现有的 muexe.com Pages 项目一起部署，无需单独的服务器。

## 架构一览

```
用户粘贴 YouTube 链接
   ↓
前端 /api/summarize?url=...（同域，无跨域）
   ↓
functions/api/summarize.js（Pages Function）
   ├─ 1. 抓取字幕（手动字幕优先 → 自动字幕兜底）
   └─ 2. 调用 Workers AI（llama-4-scout-17b）生成结构化英文总结
   ↓
返回 JSON：summary + keyPoints + chapters（带时间戳）
```

## 绑定 Workers AI（已通过 wrangler.jsonc 自动声明，无需手动后台配置 ✅）

项目根目录的 `wrangler.jsonc` 已经声明了 AI 绑定：

```jsonc
{
  "name": "muexe",
  "compatibility_date": "2025-01-01",
  "pages_build_output_dir": "./dist",
  "ai": { "binding": "AI" }
}
```

Cloudflare 构建系统（日志里的 "Checking for configuration in a Wrangler configuration file"）会读取这个文件，`git push` 后自动应用 AI 绑定，**无需在后台手动配置**。

> Cloudflare Workers AI 每天有 **10,000 Neurons 免费额度**，这个工具每次总结约消耗几百 Neurons，个人使用完全够。

### 如果 wrangler.jsonc 未自动生效（BETA 功能，兜底手动配置）

万一 push 后仍报 `AI binding is not configured`，说明该 BETA 功能在你账号未启用，改为后台手动配置：

1. Cloudflare Dashboard → **Workers & Pages** → 点进 **muexe** 项目 → **Settings** → **Bindings**（⚠️ 是 Bindings，不是「环境变量 / Variables and Secrets」）
2. 点 **Add binding** → Type 选 `Workers AI` → Variable name 填 `AI`
3. 保存后必须重新部署：**Deployments** → 最新一条部署记录最右侧的 **「⋯」三个点** → **Retry deployment**

### 重新部署的另一种办法（找不到「⋯」按钮时用）

在本地仓库执行一次空提交并推送，Cloudflare 会自动触发重新构建（等效于 Retry deployment）：

```bash
cd /d "D:\网站\workbuddy\muexe"
git commit --allow-empty -m "chore: trigger redeploy to apply AI binding"
git push origin main
```

## 部署

**无需额外操作**。`functions/api/summarize.js` 已经提交进仓库，`git push` 后 Cloudflare 会自动：
1. 跑 `python build.py` 生成静态页（新工具页已包含）
2. 识别 `functions/` 目录并部署为 Pages Functions

所以流程还是老样子：**改完 → push → 自动上线**。

## 验证

线上部署完成后：

1. 打开 `https://muexe.com/youtube-summarizer.html`
2. 粘贴一个**有字幕**的 YouTube 视频链接（例如任意英文教程、演讲）
3. 点 **Summarize**，等 10–30 秒，应出现：摘要 + 要点 + 带时间戳的章节

命令行快速验证后端是否正常：

```bash
curl "https://muexe.com/api/summarize?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

- 返回 JSON 带 `summary` 字段 → 成功
- 返回 `{"error":"AI binding is not configured..."}` → 说明第 1 步的 AI 绑定还没配好
- 返回 `{"error":"No subtitles available..."}` → 该视频没字幕，换个视频试

## 工作原理与限制

| 项 | 说明 |
|---|---|
| 字幕来源 | 手动字幕优先，无则用 YouTube 自动字幕（asr）兜底 |
| 总结语言 | 固定英文（面向全球流量） |
| 总结形式 | 摘要 + 要点 + 3-8 个带时间戳章节（章节可点击跳转到视频对应时间点） |
| 长视频 | 字幕超过约 2 万字符时只取前段，超长视频的后半部分不会被总结 |
| 依赖 | 依赖 YouTube 公开的字幕接口，YouTube 调整可能影响（属所有同类工具的共性风险） |
| 无字幕视频 | 无法总结，会明确提示 |

## 常见问题

**Q：点了 Summarize 一直转圈？**
首次调用 Workers AI 有冷启动，可能慢到 30 秒，之后会快。若超过 1 分钟，用上面的 curl 命令看后端返回什么。

**Q：报 "AI binding is not configured"？**
回去做「一次性配置」那一步，`AI` 变量名别拼错。

**Q：报 "No subtitles available"？**
该视频作者关闭了字幕，换一个视频测试。大部分英文视频都有字幕。
