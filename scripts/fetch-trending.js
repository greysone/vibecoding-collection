/**
 * GitHub 趋势项目抓取器
 * 用法: node scripts/fetch-trending.js
 *
 * 通过 GitHub Search API 获取每日热门 AI 项目
 * 更新 data/trending.json
 */

const fs = require('fs');
const path = require('path');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

async function fetchTrending() {
  const headers = { 'User-Agent': 'vibecoding-builder/1.0' };
  if (GITHUB_TOKEN) headers['Authorization'] = 'token ' + GITHUB_TOKEN;

  // 使用 GitHub Search API: 过去一周创建的 AI 项目，按 star 增长排序
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const dateStr = oneWeekAgo.toISOString().slice(0,10);

  const queries = [
    'ai created:>=' + dateStr + ' stars:>100',
    'artificial-intelligence created:>=' + dateStr + ' stars:>50',
    'llm created:>=' + dateStr + ' stars:>50',
    'machine-learning created:>=' + dateStr + ' stars:>100'
  ];

  var allRepos = [];
  var seen = new Set();

  for (var i = 0; i < queries.length; i++) {
    try {
      var url = 'https://api.github.com/search/repositories?q=' + encodeURIComponent(queries[i]) + '&sort=stars&order=desc&per_page=15';
      var res = await fetch(url, { headers: headers });
      if (!res.ok) {
        console.log('  ⚠️  搜索 "' + queries[i].slice(0,30) + '..." 失败: ' + res.status);
        continue;
      }
      var data = await res.json();

      (data.items || []).forEach(function(repo) {
        var fullName = repo.full_name;
        if (!seen.has(fullName)) {
          seen.add(fullName);
          allRepos.push({
            repo: fullName,
            desc: repo.description || '(暂无描述)',
            stars: formatStars(repo.stargazers_count),
            lang: repo.language || 'Other',
            license: repo.license ? repo.license.spdx_id : 'Other',
            trend: '+' + formatStars((repo.stargazers_count || 0)) + ' total',
            tags: (repo.topics || []).slice(0, 5),
            rawStars: repo.stargazers_count
          });
        }
      });
    } catch (e) {
      console.log('  ⚠️  搜索请求异常: ' + e.message);
    }
  }

  // 按 star 排序取前 12
  allRepos.sort(function(a,b){ return b.rawStars - a.rawStars; });
  var topRepos = allRepos.slice(0, 12).map(function(r) {
    return {
      repo: r.repo,
      desc: r.desc,
      stars: r.stars,
      lang: r.lang,
      license: r.license,
      trend: r.trend,
      tags: r.tags
    };
  });

  return {
    fetchedAt: new Date().toISOString(),
    repos: topRepos
  };
}

function formatStars(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

(async function() {
  console.log('🌐 正在抓取 GitHub 趋势项目...');
  console.log('   搜索近一周新增的 AI 相关项目');

  var trending;
  try {
    trending = await fetchTrending();
  } catch (e) {
    console.error('❌ 抓取失败:', e.message);
    process.exit(1);
  }

  var outPath = path.resolve(__dirname, '..', 'data', 'trending.json');
  fs.writeFileSync(outPath, JSON.stringify(trending, null, 2));

  console.log('✅ 已更新 trending.json');
  console.log('   共收录 ' + trending.repos.length + ' 个项目');
  console.log('   更新时间: ' + trending.fetchedAt);
  trending.repos.forEach(function(r) {
    console.log('   - ' + r.repo + ' (★ ' + r.stars + ')');
  });
})();
