import express from 'express';
import multer from 'multer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {AppError,validateDiagnosisInput,validateComparisonInput,validateGuidanceInput} from './contracts.mjs';
import {model,transcribe,configuration} from './coach.mjs';
import {createAccess} from './access.mjs';
import {createAccounts,accountConfiguration} from './accounts.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createApp({runModel=model,runASR=transcribe,config=configuration(),accessCode=process.env.ACCESS_CODE||'',hourlyLimit=Number(process.env.HOURLY_LIMIT||20),dailyLimit=Number(process.env.DAILY_LIMIT||100),trustProxy=process.env.RENDER==='true',authMode=process.env.AUTH_MODE||'code',authConfig=accountConfiguration()}={}){
 if(!['code','supabase'].includes(authMode))throw new Error('Unsupported AUTH_MODE');
 const app=express();app.disable('x-powered-by');
 if(trustProxy)app.set('trust proxy',1);
 const access=createAccess({code:accessCode,hourly:hourlyLimit,daily:dailyLimit});
 const accounts=createAccounts(authConfig);const authenticate=authMode==='supabase'?accounts.authenticate:access.authenticate;
 app.use((req,res,next)=>{res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"});const origin=req.get('origin');if(origin){try{const u=new URL(origin);if(!['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&u.host!==req.get('host'))throw Error();}catch{return res.status(403).json({error:{code:'ORIGIN_BLOCKED',message:'不允许跨站调用。'}});}}next();});
 app.use('/api',express.json({limit:'256kb'}));
 let active=0;app.use('/api',(req,res,next)=>{if(active>=4)return res.status(429).json({error:{code:'BUSY',message:'当前请求较多，请稍后重试。'}});active++;res.once('close',()=>active--);next();});
 app.get('/api/health',(_req,res)=>res.json({ok:true,llm_configured:!!config.llmKey,asr_configured:!!config.asrKey,access_required:authMode==='supabase'||access.required,auth_mode:authMode,...(authMode==='supabase'?{auth_configured:accounts.configured}:{})}));
 if(authMode==='supabase'){
  app.post('/api/auth/login',accounts.login);
  app.get('/api/auth/session',accounts.authenticate,(req,res)=>res.json({user:req.account}));
  app.post('/api/auth/logout',accounts.logout);
 }
 app.post('/api/access',authenticate,(_req,res)=>res.json({ok:true}));
 app.use(['/api/diagnose','/api/compare','/api/guidance','/api/transcribe'],authenticate,access.budget);
 for(const [route,validator] of [['diagnose',validateDiagnosisInput],['compare',validateComparisonInput],['guidance',validateGuidanceInput]])app.post('/api/'+route,async(req,res)=>{if(!validator(req.body))throw new AppError(400,'INVALID_INPUT','请检查必填字段及长度：JD/回答最多 16000 字，简历最多 20000 字。');res.json(await runModel(route,req.body,{config}));});
 const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024,files:1,fields:0}});
 app.post('/api/transcribe',upload.single('audio'),async(req,res)=>{if(!req.file||!['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg','video/webm'].includes(req.file.mimetype))throw new AppError(400,'INVALID_AUDIO','请上传支持的录音格式（WebM、MP4、OGG、WAV、MP3），最大 15MB。');res.json(await runASR(req.file,{config}));});
 app.use('/api',(_req,res)=>res.status(404).json({error:{code:'NOT_FOUND',message:'接口不存在。'}}));
 app.use(express.static(path.join(root,'dist')));
 app.get('/{*path}',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));
 app.use((err,_req,res,_next)=>{const status=err instanceof AppError?err.status:err instanceof multer.MulterError?400:err.type==='entity.too.large'?413:err instanceof SyntaxError?400:500;res.status(status).json({error:{code:err instanceof AppError?err.code:status===500?'INTERNAL_ERROR':'INVALID_REQUEST',message:err instanceof AppError?err.message:status===500?'服务暂时不可用，请重试。':'请求格式错误或文件超出限制。'}});});
 return app;
}
