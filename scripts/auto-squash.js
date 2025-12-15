#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import process from 'process';
import "dotenv/config";


const API_KEY = process.env.AI_API_KEY;
if (!API_KEY) throw new Error('export DASHSCOPE_API_KEY=xxx');

const APPLY = process.argv.includes('--apply');

// 解析日期参数：node auto-squash.js 2025-12 或 2025-12-13
const dateArg = process.argv.find(arg => /^\d{4}-\d{2}(-\d{2})?$/.test(arg));
let dateFilter = null;
if (dateArg) {
  const parts = dateArg.split('-');
  if (parts.length === 2) {
    // 月份过滤：2025-12
    dateFilter = { type: 'month', value: dateArg };
  } else if (parts.length === 3) {
    // 日期过滤：2025-12-13
    dateFilter = { type: 'day', value: dateArg };
  }
}

const SYSTEM_PROMPT = `You are an expert Git historian and software engineer.
Given a list of Git commits from the SAME DAY,
decide which commits should be squashed together.
Principles:
- Squash commits that represent intermediate work, fixes, or iteration noise.
- Preserve commits that represent complete, independent features or refactors.
- A squashed group must be contiguous in time.
- Every commit must belong to exactly ONE group.
Output rules:
- Output ONLY valid JSON in this exact format: {"groups": [{"type": "keep" or "squash", "commits": ["hash1", "hash2"]}]}
- Each group MUST have a "type" field ("keep" or "squash") and a "commits" field (array of commit hashes)
- Do NOT explain your reasoning.
- Do NOT add extra text.`;

/* ---------- 1. 拉取原始 log ---------- */
let gitCmd = 'git log --reverse --date=short --pretty=format:"%H|%ad|%s"';
if (dateFilter) {
  if (dateFilter.type === 'month') {
    gitCmd += ` --after="${dateFilter.value}-01" --before="${dateFilter.value}-32"`;
  } else if (dateFilter.type === 'day') {
    gitCmd += ` --after="${dateFilter.value}" --before="${dateFilter.value} 23:59:59"`;
  }
}
const raw = execSync(gitCmd, { encoding: 'utf8' }).trim();

if (!raw) {
  console.log(`>>> 未找到匹配的 commit (${dateFilter ? dateFilter.value : '全部历史'})`);
  process.exit(0);
}

/* ---------- 2. 按天分组 ---------- */
const days = {};
for (const line of raw.split('\n')) {
  const [hash, date, ...rest] = line.split('|');
  const msg = rest.join('|');
  if (!days[date]) days[date] = [];
  days[date].push({ hash, date, message: msg });
}

/* ---------- 3. 补充文件与 stat ---------- */
for (const date in days) {
  for (const c of days[date]) {
    const stat = execSync(`git show --stat ${c.hash} | tail -1`, {
      encoding: 'utf8'
    }).trim();
    const files = execSync(
      `git show --pretty=format: --name-only ${c.hash}`,
      { encoding: 'utf8' }
    )
      .split('\n')
      .filter(Boolean);
    c.files = files;
    c.stat = stat;
    c.time = execSync(
      `git show -s --pretty=format:%ai ${c.hash}`,
      { encoding: 'utf8' }
    )
      .split(' ')[1]
      .slice(0, 5); // HH:MM
  }
}

/* ---------- 4. 调用 Qwen ---------- */
async function callAI(dayData) {
  const res = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(dayData) }
        ]
      })
    }
  );
  const json = await res.json();
  return JSON.parse(json.choices[0].message.content);
}

/* ---------- 5. 生成 todo ---------- */
const todo = [];
for (const [date, commits] of Object.entries(days)) {
  const dayData = { date, commits };
  const ai = await callAI(dayData);
  
  // 验证 AI 返回格式
  if (!ai.groups || !Array.isArray(ai.groups)) {
    throw new Error(`AI 返回格式错误 (${date}): 缺少 groups 数组\n${JSON.stringify(ai, null, 2)}`);
  }
  
  // 简单校验
  const used = new Set();
  for (const g of ai.groups) {
    // 兼容处理：如果 g 本身是数组，转换为标准格式
    let group = g;
    if (Array.isArray(g)) {
      group = { type: 'squash', commits: g };
    }
    
    if (!group.commits || !Array.isArray(group.commits)) {
      throw new Error(`AI 返回格式错误 (${date}): group 缺少 commits 字段\n${JSON.stringify(g, null, 2)}`);
    }
    
    group.commits.forEach(h => {
      if (used.has(h)) throw new Error(`重复 hash ${h}`);
      used.add(h);
    });
  }
  if (used.size !== commits.length)
    throw new Error(`AI 返回不完整 ${date}`);

  // 转 todo
  for (const g of ai.groups) {
    // 兼容处理：如果 g 本身是数组，转换为标准格式
    let group = g;
    if (Array.isArray(g)) {
      group = { type: 'squash', commits: g };
    }
    
    group.commits.forEach((h, i) => {
      todo.push(
        group.type === 'keep' ? `pick ${h}` : i === 0 ? `pick ${h}` : `squash ${h}`
      );
    });
  }
}

/* ---------- 6. 写文件 & 执行 ---------- */
const TODO_FILE = '.git/autosquash-todo';
fs.writeFileSync(TODO_FILE, todo.join('\n') + '\n');
console.log(`>>> rebase todo 已写入 ${TODO_FILE}`);
console.log(`共 ${todo.length} 条指令，预计合成后约 ${todo.filter(l => l.startsWith('pick')).length} 个 commit`);

if (APPLY) {
  console.log('>>> 开始非交互 rebase，别动终端…');
  execSync(`GIT_SEQUENCE_EDITOR='cat ${TODO_FILE} >' git rebase -i --root`, { stdio: 'inherit' });
} else {
  console.log('>>> 追加 --apply 即可真正执行');
}