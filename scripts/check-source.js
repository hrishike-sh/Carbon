const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.join(__dirname, '..');
const sourceRoots = ['src', 'scripts', 'tests']
  .map((directory) => path.join(projectRoot, directory))
  .filter((directory) => fs.existsSync(directory));

function findJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findJavaScriptFiles(entryPath) :
      (entry.name.endsWith('.js') ? [entryPath] : []);
  });
}

let failed = false;

for (const filePath of sourceRoots.flatMap(findJavaScriptFiles)) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${filePath}\n${result.error?.message || result.stderr || result.stdout || 'Syntax check failed'}\n`);
  }
}

if (failed) process.exitCode = 1;
else console.log('All JavaScript source files passed syntax validation.');
