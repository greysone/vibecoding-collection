/**
 * AI 内容生成器
 * 用法: node scripts/generate-content.js <GitHub 仓库URL>
 * 示例: node scripts/generate-content.js https://github.com/abi/screenshot-to-code
 *
 * 功能：
 * 1. 通过 GitHub API 获取项目信息
 * 2. 自动分类并填充数据
 * 3. 输出可追加到 projects.json 的 JSON 片段
 *
 * 前提：需要设置环境变量 OPENAI_API_KEY 或 ANTHROPIC_API_KEY
 */

const fs = require('fs');
const path = require('path');

// ===== 配置 =====
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const AI_MODEL = 'gpt-4o-mini';

// ===== 命令行参数 =====
const repoUrl = process.argv[2];
if (!repoUrl) {
  console.error('❌ 用法: node scripts/generate-content.js <GitHub 仓库URL>');
  console.error('   示例: node scripts/generate-content.js https://github.com/abi/screenshot-to-code');
  process.exit(1);
}

// 解析 owner/repo
const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+?)(?:\/|$)/);
if (!match) {
  console.error('❌ 无法解析 GitHub 仓库 URL');
  process.exit(1);
}
const repoPath = match[1].replace(/\.git$/, '');

// ===== GitHub API 请求 =====
async function fetchGitHubRepo(repo) {
  const headers = { 'User-Agent': 'vibecoding-builder/1.0' };
  if (GITHUB_TOKEN) headers['Authorization'] = 'token ' + GITHUB_TOKEN;

  // 获取仓库信息
  const res = await fetch('https://api.github.com/repos/' + repo, { headers });
  if (!res.ok) {
    throw new Error('GitHub API 错误: ' + res.status + ' ' + res.statusText);
  }
  const data = await res.json();

  // 获取 README（前 2000 字符）
  let readme = '';
  try {
    const readmeRes = await fetch('https://api.github.com/repos/' + repo + '/readme', { headers });
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      readme = Buffer.from(readmeData.content, 'base64').toString('utf8').slice(0, 2000);
    }
  } catch (e) {
    // README 可选，失败不影响
  }

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description || '',
    stars: data.stargazers_count,
    language: data.language || '',
    topics: data.topics || [],
    license: data.license ? data.license.spdx_id : 'Other',
    readme: readme
  };
}

// ===== AI 生成内容 =====
async function generateContent(repoInfo) {
  if (!OPENAI_API_KEY) {
    // 无 API key 时输出模板，让用户手动填写
    console.log('⚠️  未设置 OPENAI_API_KEY，输出模板数据（请手动编辑）\n');
    return getTemplate(repoInfo);
  }

  const prompt = '你是一个 AI 编码项目的评测专家。请根据以下 GitHub 项目信息，生成中文项目介绍内容。\n\n' +
    '项目名称: ' + repoInfo.fullName + '\n' +
    '描述: ' + repoInfo.description + '\n' +
    '语言: ' + repoInfo.language + '\n' +
    'Star数: ' + repoInfo.stars + '\n' +
    '标签: ' + repoInfo.topics.join(', ') + '\n' +
    'README 摘要: ' + repoInfo.readme.slice(0, 1000) + '\n\n' +
    '请生成以下 JSON 格式的内容（只输出 JSON，不要其他文字）：\n' +
    '{\n' +
    '  "title": "中文项目标题（20字以内，带表情符号）",\n' +
    '  "brief": "一句话简介（30字以内）",\n' +
    '  "icon": "一个 emoji 图标",\n' +
    '  "category": "fun|useful|diy",\n' +
    '  "tags": ["标签1","标签2","标签3"],\n' +
    '  "details": {\n' +
    '    "reason": "值得做的原因（150-200字）",\n' +
    '    "audience": "适合的新手类型（100字以内）",\n' +
    '    "demo": "演示效果参考（150字以内）"\n' +
    '  },\n' +
    '  "prompt": "开工提示词（可直接交给 AI 编码助手的提示文本，300字左右）"\n' +
    '}';

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error('API 错误: ' + res.status + ' ' + errText);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const json = JSON.parse(content.replace(/^```json\s*/, '').replace(/\s*```$/, ''));
    return json;

  } catch (e) {
    console.error('⚠️  AI 生成失败:', e.message);
    console.log('   使用模板数据代替...\n');
    return getTemplate(repoInfo);
  }
}

// ===== 模板数据（无 AI 时使用） =====
function getTemplate(repoInfo) {
  return {
    title: repoInfo.description ? repoInfo.description.slice(0, 30) : repoInfo.fullName,
    brief: repoInfo.description ? repoInfo.description.slice(0, 50) : '一个值得尝试的 AI 项目',
    icon: '🚀',
    category: 'fun',
    tags: [repoInfo.language || '通用', '新手友好'],
    details: {
      reason: repoInfo.fullName + ' 是一个值得关注的开源项目，具有 ' + repoInfo.stars + ' 颗 Star。它使用 ' + (repoInfo.language || '多种技术') + ' 构建，适合 AI 编码新手学习和实践。',
      audience: '对所有 AI 编码感兴趣的新手开发者。',
      demo: '请参考 GitHub 仓库的 README 和演示截图了解效果。'
    },
    prompt: '请参考 GitHub 项目 ' + repoInfo.fullName + '，使用 AI 辅助构建一个类似的项目。具体需求请参考原始项目的 README。\n原始项目: ' + repoUrl
  };
}

// ===== 主流程 =====
(async function() {
  console.log('🔍 正在获取仓库信息: ' + repoPath);

  let repoInfo;
  try {
    repoInfo = await fetchGitHubRepo(repoPath);
    console.log('   ✓ 名称: ' + repoInfo.fullName);
    console.log('   ✓ Star: ' + repoInfo.stars);
    console.log('   ✓ 语言: ' + repoInfo.language);
    console.log('   ✓ 描述: ' + (repoInfo.description || '(无)'));
  } catch (e) {
    console.error('❌ 获取失败:', e.message);
    // 使用基本信息继续
    repoInfo = {
      name: repoPath.split('/')[1],
      fullName: repoPath,
      description: '',
      stars: 0,
      language: '',
      topics: [],
      license: 'Other',
      readme: ''
    };
  }

  console.log('🤖 正在生成内容...');
  const content = await generateContent(repoInfo);

  // 组装完整条目
  const now = new Date().toISOString();
  const entry = {
    id: repoPath.replace('/', '-').toLowerCase(),
    category: content.category || 'fun',
    title: content.title || repoInfo.fullName,
    brief: content.brief || (repoInfo.description || '').slice(0, 60),
    tags: content.tags || [repoInfo.language || '通用'],
    icon: content.icon || '🚀',
    details: content.details || {
      reason: '暂无详细分析',
      audience: '暂无',
      demo: '暂无'
    },
    prompt: content.prompt || '请参考 GitHub 项目 ' + repoPath,
    ghLink: repoUrl,
    source: 'ai-generated',
    addedAt: now.slice(0, 10)
  };

  // 输出结果
  console.log('\n📦 生成完成！以下是项目数据（可追加到 data/projects.json）：');
  console.log(JSON.stringify(entry, null, 2));

  // 自动追加到 projects.json（可选）
  const projectsPath = path.resolve(__dirname, '..', 'data', 'projects.json');
  if (fs.existsSync(projectsPath)) {
    console.log('\n💡 是否自动追加到 projects.json？运行:');
    console.log('   node -e "');
    console.log('     var fs=require(\'fs\');');
    console.log('     var p=JSON.parse(fs.readFileSync(\'' + projectsPath.replace(/\\/g,'\\\\') + '\',\'utf8\'));');
    console.log('     p.push(' + JSON.stringify(entry) + ');');
    console.log('     fs.writeFileSync(\'' + projectsPath.replace(/\\/g,'\\\\') + '\',JSON.stringify(p,null,2));');
    console.log('     console.log(\'✓ 已追加\');');
    console.log('   "');
  }
})();
