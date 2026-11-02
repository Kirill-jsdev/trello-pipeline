/**
 * typecheck — быстрая проверка типов после каждой правки TypeScript.
 *
 * Зачем:
 *   Агент implementer пишет код по спеке. Без этого hook ошибка типов всплыла бы только на этапе
 *   verifier (npm run build) и стоила бы целого круга повторной реализации. С hook агент видит ошибку
 *   сразу после правки файла и исправляет её на месте.
 *
 * Когда срабатывает:
 *   Claude Code вызывает скрипт после каждого инструмента Edit или Write (PostToolUse в .claude/settings.json)
 *   и передаёт в stdin JSON с путём изменённого файла (`tool_input.file_path`).
 *
 * Как работает:
 *   1. Если изменён не .ts-файл (например, .md или .json), сразу выходит с кодом 0.
 *   2. Иначе запускает `tsc --noEmit` в корне проекта: компилятор проверяет типы по tsconfig.json,
 *      но ничего не пишет в dist/.
 *   3. Ошибки компиляции: выводит их в stderr и завершается с кодом 2, и Claude Code передаёт этот
 *      текст модели как обратную связь. Без ошибок код 0, работа продолжается молча.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path ?? '';
if (!file.endsWith('.ts')) process.exit(0);

const result = spawnSync('npx --no-install tsc --noEmit', {
  cwd: process.env.CLAUDE_PROJECT_DIR ?? input.cwd,
  encoding: 'utf8',
  shell: true,
});

if (result.status !== 0) {
  process.stderr.write(`typecheck: tsc --noEmit failed\n${result.stdout}${result.stderr}`);
  process.exit(2);
}
