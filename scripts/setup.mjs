import { copyFileSync, existsSync } from 'node:fs';
if (!existsSync('backend/.env')) copyFileSync('backend/.env.example', 'backend/.env');
console.log('Yerel yapılandırma hazır.');
