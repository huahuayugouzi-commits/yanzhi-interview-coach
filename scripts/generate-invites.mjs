import {randomBytes,createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const count=Number(process.argv[2]||20);if(!Number.isInteger(count)||count<1||count>100)throw Error('count must be 1..100');
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const digest=x=>createHash('sha256').update(x).digest('hex');
const codes=new Set();while(codes.size<count){const chars=[...randomBytes(20)].map(x=>alphabet[x&31]).join('');codes.add('YZ-'+chars.match(/.{5}/g).join('-'));}
const batch=new Date().toISOString().replace(/[:.]/g,'-');const dir=path.join(root,'work','invitations',batch);await fs.mkdir(dir,{recursive:true});
const gateway=randomBytes(32).toString('hex');const list=[...codes].map((code,i)=>({id:'T'+String(i+1).padStart(2,'0'),code,valid_days:14,call_limit:30}));
await fs.writeFile(path.join(dir,'20-testers.csv'),'\ufeff编号,邀请码,有效期,请求总额度,启用期限,网站\r\n'+list.map(x=>[x.id,x.code,'首次使用起14天',30,'创建后30天内','https://yanzhi-interview-coach.onrender.com/train'].join(',')).join('\r\n')+'\r\n',{mode:0o600});
await fs.writeFile(path.join(dir,'private-config.json'),JSON.stringify({gateway,codes:list},null,2),{mode:0o600});
const migration=await fs.readFile(path.join(root,'supabase','invitations.sql'),'utf8');
const seed=`\nbegin;\ndo $$ begin if exists(select 1 from coach_invite_private.config) then raise exception 'Invitation config already exists; do not overwrite gateway or reset quotas'; end if; end $$;\ninsert into coach_invite_private.config(singleton,gateway_hash,daily_limit) values(true,'${digest(gateway)}',100);\ninsert into coach_invite_private.codes(id,code_hash,valid_days,call_limit) values\n${list.map(x=>`('${x.id}','${digest(x.code)}',14,30)`).join(',\n')};\ncommit;\nselect id,enabled,call_limit,used,valid_days,activate_by,expires_at from coach_invite_private.codes order by id;\n`;
await fs.writeFile(path.join(dir,'setup-private.sql'),migration+seed,{mode:0o600});
await fs.writeFile(path.join(dir,'render-invites.env'),['AUTH_MODE=invite','SUPABASE_URL='+(process.env.SUPABASE_URL||''),'SUPABASE_PUBLISHABLE_KEY='+(process.env.SUPABASE_PUBLISHABLE_KEY||''),'INVITE_GATEWAY_SECRET='+gateway].join('\n')+'\n',{mode:0o600});
await fs.writeFile(path.join(dir,'管理与分发说明.txt'),`20个邀请码，编号T01至T20，每人分发一行CSV。\n先完成Supabase初始化和Render配置并验收，才能使用。\n首次核验起14天有效，创建后30天内启用；每码30次服务请求，诊断/引导/对比/转录共用，开始处理后失败亦扣额。一次模型服务请求可能有最多2次模型修复调用；全站每日100次持久上限。\n数据库只存邀请码哈希，不存回答。\n停用单码（在Supabase SQL Editor执行）：update coach_invite_private.codes set enabled=false where id='T01';\n查看额度：select id,enabled,call_limit,used,call_limit-used remaining,expires_at from coach_invite_private.codes order by id;\n不要把private-config.json、render-invites.env或setup-private.sql发给测试用户或提交GitHub。\n邀请码本质为持有者凭证，请每人一码，不共享。\n`);
console.log(JSON.stringify({directory:dir,count:list.length,validDays:14,quota:30,ready:false}));
