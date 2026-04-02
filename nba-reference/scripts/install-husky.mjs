import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);
const appRoot = resolve(currentDirectory, '..');
const repositoryRoot = resolve(appRoot, '..');
const gitMetadataPath = resolve(repositoryRoot, '.git');

if (process.env.HUSKY === '0') {
  console.log('Skipping Husky installation because HUSKY=0.');
  process.exit(0);
}

if (!existsSync(gitMetadataPath)) {
  console.log(`Skipping Husky installation because ${gitMetadataPath} was not found.`);
  process.exit(0);
}

const huskyBinaryPath = resolve(
  appRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'husky.cmd' : 'husky'
);

const result = spawnSync(huskyBinaryPath, ['nba-reference/.husky'], {
  cwd: repositoryRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
