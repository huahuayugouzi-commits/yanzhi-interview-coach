let accessCode='';
try{accessCode=sessionStorage.getItem('interview-coach-access')||'';}catch{}
export function getAccessCode(){return accessCode;}
export function setAccessCode(value:string){accessCode=value;try{if(value)sessionStorage.setItem('interview-coach-access',value);else sessionStorage.removeItem('interview-coach-access');}catch{}}
export async function api<T>(route:string,body:unknown,code=accessCode):Promise<T>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),70000);
 try{const form=body instanceof FormData;const headers:Record<string,string>={};if(!form)headers['Content-Type']='application/json';if(code)headers['X-Access-Code']=code;const r=await fetch('/api/'+route,{method:'POST',headers,body:form?body:JSON.stringify(body),signal:controller.signal});let data;try{data=await r.json();}catch{throw new Error('服务响应异常，请确认后端已启动后重试。');}if(!r.ok)throw new Error(data.error?.message||'请求失败，请稍后重试。');return data as T;}catch(e){if(e instanceof Error&&e.name==='AbortError')throw new Error('请求超时，你的回答仍保留在页面，请重试。');if(e instanceof TypeError)throw new Error('无法连接服务，请检查网络或后端后重试。');throw e;}finally{clearTimeout(timer);}
}
