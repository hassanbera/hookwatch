import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
mkdirSync('.github/workflows', { recursive: true });
if (!existsSync('.github/workflows/ci.yml'))
  copyFileSync('docs/github-actions-ci.yml', '.github/workflows/ci.yml');
console.log('CI dosyası hazır. Workflow yazma yetkili GitHub oturumuyla commit ve push yapın.');
