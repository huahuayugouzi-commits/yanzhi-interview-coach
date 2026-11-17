// Local preparation only: never sends credentials or uploads files itself.
import fs from 'node:fs/promises';
import {parseEnv} from 'node:util';
const names=(await fs.readFile('work/github-files.txt','utf8')).replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(Boolean);
const env=parseEnv(await fs.readFile('.env','utf8'));
const secrets=['LLM_API_KEY','ASR_API_KEY','ACCESS_CODE'].map(k=>env[k]).filter(v=>v?.length>=8);
const forbidden=/^(?:\.env(?:\..*)?$|node_modules\/|dist\/|work\/|release\/|\.pnpm-store\/|\.cache\/|\.browsers\/|test-results\/|playwright-report\/)|\.(?:wav|mp3|mp4|webm|ogg|pem|key)$/i;
const elements=[];
for(const name of names){
 if(name!=='.env.example'&&forbidden.test(name))throw Error('Excluded file in upload list: '+name);
 const bytes=await fs.readFile(name);
 if(bytes.includes(0))throw Error('Unexpected binary file: '+name);
 const content=bytes.toString('utf8').replace(/\r\n/g,'\n');
 if(secrets.some(s=>content.includes(s)))throw Error('Configured secret detected in: '+name);
 if(/(?:sk-[a-zA-Z0-9_-]{24,}|gh[pousr]_[a-zA-Z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(content))throw Error('Potential credential detected in: '+name);
 elements.push({path:name,mode:'100644',type:'blob',content});
}
await fs.writeFile('work/github-upload.json',JSON.stringify(elements));
console.log(JSON.stringify({files:elements.length,bytes:elements.reduce((n,x)=>n+Buffer.byteLength(x.content),0),configured_secret_scan:'PASSED',credential_pattern_scan:'PASSED',excluded:['.env','recordings','node_modules','dist','caches','release','browser reports']},null,2));
