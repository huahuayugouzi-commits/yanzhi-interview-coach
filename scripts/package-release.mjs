import fs from 'node:fs/promises';
import path from 'node:path';
import {parseEnv} from 'node:util';
const root=path.resolve('.'),out=path.join(root,'release/source');
const dirs=['src','server','schemas','scripts','tests'];
const files=['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','.npmrc','.gitignore','.env.example','index.html','tsconfig.json','vite.config.js','playwright.config.ts','render.yaml','README.md','docs/deploy-render.md','docs/acceptance.md','docs/evaluation/latest.json'];
const env=await fs.readFile('.env','utf8').then(parseEnv).catch(()=>({}));
const secrets=['LLM_API_KEY','ASR_API_KEY','ACCESS_CODE'].map(k=>env[k]).filter(v=>v?.length>=8);
await fs.mkdir(out,{recursive:true});
let count=0;
async function copy(rel){const content=await fs.readFile(path.join(root,rel));if(secrets.some(s=>content.includes(Buffer.from(s))))throw Error('Release contains a configured secret: '+rel);await fs.mkdir(path.dirname(path.join(out,rel)),{recursive:true});await fs.writeFile(path.join(out,rel),content);count++;}
async function walk(rel){for(const e of await fs.readdir(path.join(root,rel),{withFileTypes:true})){const p=path.join(rel,e.name);if(e.isDirectory())await walk(p);else if(e.isFile())await copy(p);}}
for(const dir of dirs)await walk(dir);
for(const file of files)await copy(file);
await fs.writeFile(path.join(root,'release/manifest.json'),JSON.stringify({generated_at:new Date().toISOString(),files:count,secret_scan:'PASSED',excluded:['.env','work','node_modules','.pnpm-store','browser profiles','user data','test artifacts'],note:'Source staging only. Public deployment not yet complete.'},null,2));
console.log('Release staged at E:/AI20261112/release/source; configured-secret scan PASSED; files:',count);
