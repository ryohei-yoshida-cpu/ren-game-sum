// ゲームで しゃべる セリフを ぜんぶ あつめて lines.json に かきだす
//   node tools/voices/lines.mjs
// セリフは js/data.js の LINES に まとめてある（こえの スタジオと おなじ いちらん）
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), ctx);
const out = ctx.window.LINES.map(l => ({ who: l.who, text: l.text }));
fs.writeFileSync(path.join(root, 'tools/voices/lines.json'), JSON.stringify(out, null, 1));
console.log(`${out.length} lines`);
