/**
 * run-pipeline — headless-запуск AI-пайплайна для одной карточки Trello.
 *
 * Запуск:
 *   npm run pipeline -- <card URL | short link>
 *
 * Что делает:
 *   1. Запускает `claude -p` (без интерактивной сессии) с промптом `/trello-to-commit <card>`.
 *      Промпт передаётся через stdin, а не аргументом командной строки, чтобы URL карточки
 *      не проходил через shell.
 *   2. Права берутся из .claude/settings.json (allow/deny и hooks действуют так же, как в сессии);
 *      `--permission-mode acceptEdits` разрешает правки файлов без подтверждения.
 *   3. Пишет весь поток событий (stream-json) в .pipeline/<shortLink>/run.log,
 *      а в консоль — краткий ход работы: какие скиллы, агенты и инструменты вызываются.
 *   4. Находит в финальном ответе блок `PIPELINE: OK | STOPPED` и завершается с кодом:
 *      0 — PIPELINE: OK; 1 — PIPELINE: STOPPED; 2 — ошибка запуска или блок не найден.
 */
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const card = process.argv[2];
const match = card?.match(/^(?:https:\/\/trello\.com\/c\/)?([A-Za-z0-9]{8})(?:\/[\w-]*)?$/);
if (!match) {
  console.error('Usage: npm run pipeline -- <card URL | short link>');
  process.exit(2);
}
const shortLink = match[1];

const config = JSON.parse(readFileSync('.claude/pipeline.json', 'utf8'));
const workdir = join(config.paths.workdir, shortLink);
mkdirSync(workdir, { recursive: true });
const logPath = join(workdir, 'run.log');
const log = createWriteStream(logPath);

console.log(`▶ trello-to-commit ${card}\n  log: ${logPath}\n`);

// Fixed command string with no user input; `shell` resolves claude.cmd on Windows.
const claude = spawn('claude -p --output-format stream-json --verbose --permission-mode acceptEdits', {
  shell: true,
  stdio: ['pipe', 'pipe', 'inherit'],
});
claude.stdin.end(`/trello-to-commit ${card}`);

let result = null;
let buffer = '';

function describe(tool) {
  const input = tool.input ?? {};
  if (tool.name === 'Skill') return `skill  /${input.skill} ${input.args ?? ''}`;
  if (tool.name === 'Agent') return `agent  ${input.subagent_type}`;
  if (tool.name === 'Bash') return `bash   ${String(input.command).split('\n')[0].slice(0, 100)}`;
  if (tool.name.startsWith('mcp__trello__')) return `trello ${tool.name.slice(13)} ${input.action ?? ''}`;
  return `${tool.name.toLowerCase().padEnd(6)} ${input.file_path ?? ''}`;
}

function handle(event) {
  if (event.type === 'assistant' && !event.parent_tool_use_id) {
    for (const block of event.message?.content ?? []) {
      if (block.type === 'tool_use') console.log(`  · ${describe(block)}`);
    }
  }
  if (event.type === 'result') result = event;
}

claude.stdout.on('data', (chunk) => {
  log.write(chunk);
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      handle(JSON.parse(line));
    } catch {
      // not a JSON event: already in run.log
    }
  }
});

claude.on('close', (code) => {
  log.end();
  const text = result?.result ?? '';
  const status = text.match(/^PIPELINE:\s*(OK|STOPPED)/m)?.[1];
  const block = text.slice(text.lastIndexOf('PIPELINE:')).split('```')[0].trim();

  console.log('');
  if (!result || result.is_error || !status) {
    console.error(`✖ pipeline did not report a result (claude exit code ${code}). See ${logPath}`);
    if (text) console.error(text.slice(-1500));
    process.exit(2);
  }
  console.log(block);
  console.log(`\n  turns: ${result.num_turns}, duration: ${Math.round(result.duration_ms / 1000)}s, cost: $${result.total_cost_usd?.toFixed(2) ?? '?'}`);
  process.exit(status === 'OK' ? 0 : 1);
});
