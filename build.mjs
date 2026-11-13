import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const output = 'docs';
import figures from './content/illustrated-steps-data.mjs';

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const textList = (items) => Array.isArray(items) && items.length > 0 && items.every(hasText);
const procedures = readdirSync('content').filter((name) => name.endsWith('.json')).sort().map((name) => {
  const item = JSON.parse(readFileSync('content/' + name, 'utf8').replace(/^\uFEFF/, ''));
  const citation = ({ pages, pdfPage, source }) => /^\d+(?:–\d+)?$/.test(pages) &&
    Number.isInteger(pdfPage) && pdfPage > 0 && Number.isInteger(source) && source >= 1 && source <= item.sources.length;
  const notes = (items) => Array.isArray(items) && items.every((note) => hasText(note.text) && citation(note));
  const ids = new Set(item.steps.map((step) => step.id));
  if (!identifier.test(item.slug) || name !== item.slug + '.json' ||
      ![item.title, item.region, item.system, item.summary].every(hasText) ||
      !item.sources.length || !item.sources.every((source) =>
        [source.title, source.section].every(hasText) && new URL(source.url).protocol === 'https:') ||
      item.steps.length < 5 || item.steps.length > 6 || ids.size !== item.steps.length ||
      !item.steps.every((step) => identifier.test(step.id) && [step.title, step.summary, step.purpose].every(hasText) &&
        step.instruments.length && step.instruments.every(({ name, use }) => [name, use].every(hasText)) &&
        textList(step.operations) && textList(step.checks) && notes(step.pitfalls) && step.pitfalls.length &&
        notes(step.values) && notes(step.branches) && citation(step)) ||
      item.planning.length !== 3 || !item.planning.every((group) => hasText(group.title) && group.items.length && notes(group.items)) ||
      item.checks.length !== 2 || !item.checks.every((group) => hasText(group.title) && group.items.length &&
        group.items.every(({ text, stage }) => hasText(text) && ids.has(stage))) ||
      (item.postoperative && !citation(item.postoperative))) {
    throw new Error('Invalid procedure: ' + name);
  }
  return item;
});

function page(title, root, body, interactive = false) {
  return `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · OrthoSurg Atlas</title><link rel="stylesheet" href="${root}assets/site.css">
${interactive ? '<script defer src="' + root + 'assets/stages.js"></script>' : ''}</head>
<body><header><div class="wrap"><a class="brand" href="${root}index.html">OrthoSurg <span>Atlas</span></a></div></header>
<main class="wrap">${body}</main><footer class="wrap">骨科醫師教學 · 植入物與器械操作請查閱對應版本的原廠手冊。</footer></body></html>`;
}

const list = (items) => items.map((value) => `<li>${escape(value)}</li>`).join('');
const cards = procedures.map((item) => `<a class="card" href="procedures/${item.slug}/index.html">
<p class="region">${escape(item.region)}</p><h2>${escape(item.title)}</h2><p class="system">${escape(item.system)}</p>
<p>${escape(item.summary)}</p><span class="action">瀏覽手術流程 →</span></a>`).join('');
writeFileSync(output + '/index.html', page('骨科手術圖譜', './',
  `<div class="hero"><h1>骨科手術圖譜</h1><p>為骨科醫師整理的術前複習與手術流程教學。</p>
  <p>選擇術式後，點選流程圖可跳到並展開階段詳解。點手冊頁碼可查閱原廠 PDF。</p></div>
  <div class="cards">${cards}</div>`));

for (const item of procedures) {
  const path = output + '/procedures/' + item.slug;
  const sourceUrl = (source) => source.url;
  const pdfLink = ({ pages, pdfPage, source }) => {
    const url = sourceUrl(item.sources[source - 1]).split('#')[0] + '#page=' + pdfPage;
    return `<a href="${escape(url)}" target="_blank" rel="noopener">手冊第 ${escape(pages)} 頁</a>`;
  };
  const notes = (items) => items.map((note) => `<li>${escape(note.text)} ${pdfLink(note)}</li>`).join('');
  const noteGroup = (title, items) => items.length ? `<h4>${title}</h4><ul>${notes(items)}</ul>` : '';
  const flow = item.steps.map((step) => `<li><a data-stage-link href="#stage-${step.id}">${escape(step.title)}</a></li>`).join('');
  const illustratedSteps = (step) => {
    const items = figures[item.slug]?.[step.id] ?? [];
    if (!items.length) return '';
    return '<h4>圖解子步驟</h4><ol class="illustrated-steps">' + items.map(({ page, pdfPage, title, body }) => {
      return '<li><div><h5>' + escape(title) + '</h5><p>' + escape(body) + '</p><p>' +
        pdfLink({ pages: page, pdfPage, source: step.source }) + '</p></div></li>';
    }).join('') + '</ol>';
  };
  const steps = item.steps.map((step) => `<details id="stage-${step.id}" class="stage"><summary>
    <strong>${escape(step.title)}</strong><span>${escape(step.summary)}</span></summary>
    <div class="stage-body"><h4>目的</h4><p>${escape(step.purpose)}</p>
    <h4>主要器械</h4><ul>${step.instruments.map(({ name, use }) => `<li><strong>${escape(name)}</strong> · ${escape(use)}</li>`).join('')}</ul>
    <h4>操作重點</h4><ul>${list(step.operations)}</ul>
    <h4>確認事項</h4><ul>${list(step.checks)}</ul>
    ${noteGroup('容易忽略的檢查點', step.pitfalls)}
    ${noteGroup('原廠關鍵數值', step.values)}
    ${noteGroup('器械分支', step.branches)}
    ${illustratedSteps(step)}<p>${pdfLink(step)}</p></div></details>`).join('');
  const planning = item.planning.map((group) => `<h3>${escape(group.title)}</h3><ul>${notes(group.items)}</ul>`).join('');
  const checks = item.checks.map((group) => `<h3>${escape(group.title)}</h3><ul>${group.items.map(({ text, stage }) =>
    `<li><a data-stage-link href="#stage-${stage}">${escape(text)}</a></li>`).join('')}</ul>`).join('');
  const sources = item.sources.map((source) => `<li><a href="${escape(sourceUrl(source))}">${escape(source.title)}</a><p>${escape(source.section)}</p></li>`).join('');
  mkdirSync(path, { recursive: true });
  writeFileSync(path + '/index.html', page(item.title, '../../',
    `<a class="back" href="../../index.html">← 所有術式</a>
    <div class="hero"><p class="region">${escape(item.region)}</p><h1>${escape(item.title)}</h1>
    <p class="system">${escape(item.system)}</p><p>${escape(item.summary)}</p></div>
    <nav aria-label="本頁目錄"><a href="#planning">術前規劃</a><a href="#steps">階段詳解</a><a href="#checks">試模與最終確認</a><a href="#sources">參考來源</a></nav>
    <section aria-labelledby="flow-title"><h2 id="flow-title">流程總覽</h2><p>點選階段可展開詳解。</p><ol class="flow">${flow}</ol></section>
    <section id="planning"><h2>術前規劃</h2>${planning}</section>
    <section id="steps"><h2>階段詳解</h2>${steps}</section>
    <section id="checks"><h2>試模與最終確認</h2>${checks}</section>
    <section id="sources"><h2>參考來源</h2><ol>${sources}</ol>
    ${item.postoperative ? '<p>術後照護 · ' + pdfLink(item.postoperative) + '</p>' : ''}</section>`, true));
}
console.log('Built ' + procedures.length + ' procedure pages.');
