const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/config.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));
const trending = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trending.json'), 'utf8'));
const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'src/script.js'), 'utf8');

const GH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>';

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function genTrending() {
  const repos = trending.repos || [];
  if (!repos.length) return '<p style="color:var(--text-muted);text-align:center">暂无明星项目数据</p>';
  const updated = trending.fetchedAt ? '<div class="star-updated">更新时间: ' + trending.fetchedAt.slice(0,10) + '</div>' : '';
  return repos.map(function(r) {
    return '<div class="star-card"><div class="star-card-top"><div class="star-repo">' + GH_ICON + ' ' + esc(r.repo) + '</div></div><div class="star-desc">' + esc(r.desc) + '</div><div class="star-meta"><span>● ' + r.lang + '</span><span>' + r.license + '</span></div><div class="star-stars">★ ' + r.stars + '</div>' + updated + '<div class="star-card-footer">' + (r.tags||[]).map(function(t){return '<span class="star-tag">' + esc(t) + '</span>';}).join('') + '</div></div>';
  }).join('\n');
}

function genProjectCard(p, idx, catKey) {
  var did = 'd-' + catKey + '-' + idx;
  var details = [
    { label: '🎯 值得做的原因', text: p.details.reason },
    { label: '👤 适合的新手类型', text: p.details.audience },
    { label: '📺 演示效果参考', text: p.details.demo }
  ];
  var detailHTML = details.map(function(d) {
    return '<div class="detail-item"><div class="detail-label">' + d.label + '</div><div class="detail-text">' + esc(d.text) + '</div></div>';
  }).join('');

  var ghIconSmall = GH_ICON.replace('width="18" height="18"','width="16" height="16"').replace('stroke="currentColor"','fill="currentColor" stroke="none"');

  return '<div class="project-card" data-category="' + p.category + '"><div class="project-card-visual"><div class="icon">' + p.icon + '</div></div><div class="project-card-body"><h3>' + esc(p.title) + '</h3><p class="brief">' + esc(p.brief) + '</p><div class="project-tags">' + (p.tags||[]).map(function(t){return '<span class="tag">' + esc(t) + '</span>';}).join('') + '</div><div class="project-details" id="' + did + '">' + detailHTML + '<div class="detail-item"><div class="detail-label">🤖 开工提示词</div><div class="prompt-box"><pre>' + esc(p.prompt) + '</pre><a href="' + esc(p.ghLink) + '" target="_blank" class="gh-link">' + ghIconSmall + ' 查看 GitHub 原始项目 →</a></div></div></div><button class="project-expand" onclick="toggleDetails(this)"><span>查看开工详情</span><span class="arrow">▼</span></button></div></div>';
}

function genCategories() {
  return config.categories.map(function(cat) {
    var catProjects = projects.filter(function(p){ return p.category === cat.key; });
    if (!catProjects.length) return '';
    return '<section class="category-section ' + cat.class + '" data-category="' + cat.key + '"><div class="container"><div class="category-header"><div class="category-icon">' + cat.icon + '</div><h2>' + cat.title + '</h2><p>' + esc(cat.description) + '</p></div><div class="total-count">共 ' + catProjects.length + ' 个项目</div><div class="category-grid">' + catProjects.map(function(p,i){ return genProjectCard(p,i,cat.key); }).join('\n') + '</div></div></section>';
  }).join('\n');
}

function build() {
  if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS, { recursive: true });
  var totalProjects = projects.length;
  var today = new Date().toISOString().slice(0,10);

  var html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>' + esc(config.siteName) + ' — ' + esc(config.siteDescription) + '</title>\n<meta name="description" content="' + esc(config.siteDescription) + '">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n<style>' + css + '</style>\n</head>\n<body>\n<nav id="navbar"><div class="container"><div class="nav-logo">VibeCoding<span> 集</span></div><ul class="nav-links"><li><a href="#projects">项目分类</a></li><li><a href="#star-projects">明星项目</a></li><li><a href="#about">关于本站</a></li></ul></div></nav>\n\n<section class="hero" id="hero"><div class="hero-grid"></div><div class="container"><div class="hero-content"><div class="hero-badge">' + esc(config.hero.badge) + '</div><h1>' + esc(config.hero.title) + '<br><span class="gradient-text">' + esc(config.hero.subtitle) + '</span></h1><p>' + esc(config.hero.description) + '</p><div class="hero-actions"><a href="#projects" class="btn btn-primary">浏览项目 ↓</a><a href="#star-projects" class="btn btn-secondary">本周明星 ⭐</a></div><div class="hero-stats"><div><div class="hero-stat-value">' + esc(config.stats.projects) + '</div><div class="hero-stat-label">精选项目</div></div><div><div class="hero-stat-value">' + esc(config.stats.categories) + '</div><div class="hero-stat-label">方向分类</div></div><div><div class="hero-stat-value">' + esc(config.stats.prompts) + '</div><div class="hero-stat-label">可复现提示词</div></div></div><div style="margin-top:8px"><span style="color:rgba(255,255,255,.4);font-size:.8rem">已收录 ' + totalProjects + ' 个项目 · 更新于 ' + today + '</span></div></div></div></section>\n\n<section class="star-projects" id="star-projects"><div class="container"><div class="star-header"><div><h2>⭐ 本周明星项目</h2><div class="sub">GitHub 上增长最快的 AI 相关开源项目 · 每日自动更新</div></div></div><div class="star-grid">' + genTrending() + '</div></div></section>\n\n<div class="section" id="projects"><div class="container"><div class="section-title"><h2>📂 项目分类</h2><p>三大方向覆盖不同需求，找到最适合你的第一个 AI 项目</p></div><div class="cat-tabs"><button class="cat-tab active" data-target="all"><span class="dot" style="background:var(--primary)"></span>全部</button><button class="cat-tab" data-target="fun"><span class="dot" style="background:var(--accent-amber)"></span>最好玩</button><button class="cat-tab" data-target="useful"><span class="dot" style="background:var(--accent-blue)"></span>最好用</button><button class="cat-tab" data-target="diy"><span class="dot" style="background:var(--accent-green)"></span>最好搓</button></div></div></div>\n\n' + genCategories() + '\n\n<section class="cta-section" id="about"><div class="container"><h2>💡 准备好了吗？</h2><p>选一个心动的项目，把开工提示词复制给 Codex，你的 AI 编码之旅就正式开始了。</p><a href="#projects" class="btn btn-primary">浏览全部项目 ↓</a></div></section>\n\n<footer><div class="container"><p>' + esc(config.siteName) + ' · 为 AI 编码新手打造的精选项目集合站</p><p style="margin-top:8px;font-size:.8rem">本站内容基于开源项目信息 AI 生成，仅供学习参考 · ' + today + '</p></div></footer>\n\n<button class="back-top" id="backTop" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">↑</button>\n<script>' + js + '</script>\n</body>\n</html>';

  var outPath = path.join(DOCS, 'index.html');
  fs.writeFileSync(outPath, html);
  var size = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log('✅ 构建完成: ' + outPath);
  console.log('   项目数: ' + totalProjects + ' | 明星项目: ' + (trending.repos||[]).length + ' | 文件大小: ' + size + 'KB');
}

build();
