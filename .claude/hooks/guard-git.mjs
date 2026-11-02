/**
 * guard-git — страховка от опасных операций с git и GitHub.
 *
 * Зачем:
 *   Агент пайплайна сам коммитит и пушит. Инструкции в скиллах и агентах говорят ему работать только
 *   в feature-ветках, но инструкция может быть нарушена. Этот hook проверяет каждую команду до запуска
 *   и не даёт выполнить опасную, что бы ни решила модель.
 *
 * Когда срабатывает:
 *   Claude Code вызывает скрипт перед каждой командой Bash или PowerShell (PreToolUse в .claude/settings.json)
 *   и передаёт в stdin JSON с текстом команды (`tool_input.command`) и рабочей папкой (`cwd`).
 *
 * Что блокирует:
 *   - git commit, если текущая ветка защищённая (baseBranch из .claude/pipeline.json, по умолчанию main);
 *   - git push в защищённую ветку: явно (`origin main`, `x:main`), через HEAD или без аргументов с main;
 *   - force-push в любом виде: --force, -f, -uf, --force-with-lease, +refspec;
 *   - git push --all / --mirror / --delete;
 *   - git reset --hard;
 *   - gh api с методом, отличным от GET, или с телом запроса (-f, -F, --input): GitHub только читаем.
 *
 * Как работает:
 *   1. Делит команду на части по &&, ||, ;, | и переводам строк, чтобы найти git внутри цепочек
 *      вроде `npm test && git push origin main`.
 *   2. В каждой части находит git или gh, пропускает глобальные опции (-C <dir>, -c <key=value>)
 *      и определяет подкоманду и её аргументы.
 *   3. Для commit и push без явной ветки узнаёт текущую ветку через `git rev-parse`.
 *   4. Нарушение: печатает причину в stderr и завершается с кодом 2. Claude Code отменяет команду
 *      и показывает модели причину, чтобы она выбрала безопасный путь. Иначе код 0, команда выполняется.
 *
 * Ограничение:
 *   Команда разбирается как текст, поэтому опасная фраза внутри строки (например, в echo) тоже будет
 *   заблокирована. Для страховки это допустимая ошибка в безопасную сторону.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const command = input.tool_input?.command ?? '';
const cwd = input.cwd ?? process.cwd();
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? cwd;

function protectedBranches() {
  try {
    const config = JSON.parse(readFileSync(join(projectDir, '.claude', 'pipeline.json'), 'utf8'));
    return [config.git.baseBranch];
  } catch {
    return ['main'];
  }
}

function currentBranch(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function block(reason) {
  process.stderr.write(`guard-git: ${reason}\n`);
  process.exit(2);
}

const PROTECTED = protectedBranches();
const GIT_OPTS_WITH_ARG = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace']);

// Split chained commands (&&, ||, ;, |, newlines) and tokenize, dropping quotes.
const segments = command
  .split(/&&|\|\||[;|\n]/)
  .map((s) => s.trim().split(/\s+/).map((t) => t.replace(/^['"]|['"]$/g, '')).filter(Boolean))
  .filter((t) => t.length);

for (const tokens of segments) {
  const tool = tokens.findIndex((t) => /(^|[\\/])(git|gh)(\.exe)?$/.test(t));
  if (tool === -1) continue;
  const isGh = /gh(\.exe)?$/.test(tokens[tool]);
  const rest = tokens.slice(tool + 1);

  if (isGh) {
    if (rest[0] !== 'api') continue;
    const args = rest.slice(1);
    const method = args.find((a, i) => args[i - 1] === '-X' || args[i - 1] === '--method') ?? 'GET';
    const hasBody = args.some((a) => /^(-f|-F|--field|--raw-field|--input)$/.test(a));
    if (method.toUpperCase() !== 'GET' || hasBody) block('`gh api` is allowed for read-only (GET) requests only.');
    continue;
  }

  let dir = cwd;
  let i = 0;
  while (i < rest.length && rest[i].startsWith('-')) {
    if (rest[i] === '-C') dir = join(cwd, rest[i + 1] ?? '');
    i += GIT_OPTS_WITH_ARG.has(rest[i]) ? 2 : 1;
  }
  const sub = rest[i];
  const args = rest.slice(i + 1);
  const flags = args.filter((a) => a.startsWith('-'));
  const positional = args.filter((a) => !a.startsWith('-'));

  if (sub === 'reset' && flags.includes('--hard')) block('`git reset --hard` is not allowed.');

  if (sub === 'commit') {
    const branch = currentBranch(dir);
    if (PROTECTED.includes(branch)) block(`committing directly to \`${branch}\` is not allowed; use a feature/* branch.`);
  }

  if (sub === 'push') {
    // --force, --force-with-lease, --force-if-includes, or short flags containing f (-f, -uf)
    if (flags.some((f) => (f.startsWith('--') ? f.startsWith('--force') : /^-[a-zA-Z]*f/.test(f)))) {
      block('force-push is not allowed.');
    }
    if (flags.some((f) => f === '--all' || f === '--mirror' || f === '--delete' || f === '-d')) {
      block('`git push --all/--mirror/--delete` is not allowed.');
    }
    const refspecs = positional.slice(1);
    if (refspecs.some((r) => r.startsWith('+'))) block('force-push (`+refspec`) is not allowed.');
    const targets = refspecs.length
      ? refspecs.map((r) => r.split(':').pop().replace(/^refs\/heads\//, ''))
      : [currentBranch(dir)];
    const hit = targets.find((t) => PROTECTED.includes(t) || (t === 'HEAD' && PROTECTED.includes(currentBranch(dir))));
    if (hit) block(`pushing to \`${PROTECTED.join(', ')}\` is not allowed; push a feature/* branch instead.`);
  }
}

process.exit(0);
