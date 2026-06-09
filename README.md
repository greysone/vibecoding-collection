# VibeCoding 集

面向 AI 编码新手的项目集合站。三大方向精选项目，每个附带可直接交给 Codex 的开工提示词。

## 快速开始

```bash
npm install
npm run build
```

构建产物在 `docs/` 目录，可直接部署到 GitHub Pages。

## 目录结构

```
vibecoding-site/
├── src/
│   ├── build.js        ← 构建引擎（读取数据 → 生成 HTML）
│   ├── styles.css      ← 样式
│   └── script.js       ← 前端交互
├── data/
│   ├── config.json     ← 站点配置
│   ├── projects.json   ← 项目数据（核心）
│   └── trending.json   ← 明星项目（自动更新）
├── scripts/
│   ├── generate-content.js ← AI 内容生成器
│   └── fetch-trending.js   ← GitHub 趋势抓取
├── docs/               ← 构建产物（GitHub Pages 发布目录）
└── .github/workflows/  ← CI/CD 流水线
```

## 工作流程

### 1. 加新项目

```bash
# 方式一（推荐）：AI 自动生成
export OPENAI_API_KEY=sk-xxx
node scripts/generate-content.js https://github.com/用户名/仓库名

# 方式二：手动编辑 data/projects.json
# 按已有格式新增一条即可
```

生成的内容审核后，手动 append 到 `data/projects.json`，然后：

```bash
npm run build    # 本地构建预览
git add . && git commit -m "✨ 新增: 项目名称"
git push         # 自动部署
```

### 2. 每日趋势自动更新

GitHub Actions 每天 UTC 0:00 和 12:00 自动运行：
1. 调用 GitHub Search API 抓取本周趋势 AI 项目
2. 更新 `data/trending.json`
3. 重新构建站点
4. 自动 commit + push + 部署

### 3. 修改站点

- 样式: 编辑 `src/styles.css`
- 交互: 编辑 `src/script.js`
- 布局: 编辑 `src/build.js` 中的 HTML 模板逻辑

## 部署

### GitHub Pages（推荐，免费）

1. 在 GitHub 创建仓库，推送到 `main` 分支
2. 仓库 Settings → Pages → Source → **GitHub Actions**
3. 首次手动触发 Actions → Deploy workflow

部署完成后访问：`https://你的用户名.github.io/仓库名/`

## 前置条件

| 工具 | 用途 | 备注 |
|------|------|------|
| Node.js 18+ | 构建 | 本地开发需要 |
| GitHub 账号 | 托管 + CI/CD | 免费 |
| GitHub Token (可选) | API 调用 | 提高 Trending 抓取频率限制 |
| OpenAI API Key (可选) | AI 内容生成 | 不设置时输出模板数据 |

## 许可证

MIT - 本项目代码可自由使用和修改。
收录的项目信息仅供参考学习，具体请遵守各开源项目的许可证条款。
