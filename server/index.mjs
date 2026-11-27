import {createApp} from './app.mjs';
import {accountConfiguration,validAccountConfiguration} from './accounts.mjs';
import {inviteConfiguration,validInviteConfiguration} from './invites.mjs';
const production=process.env.NODE_ENV==='production';
if(production){
 if(process.env.AUTH_MODE==='supabase'){if(!validAccountConfiguration(accountConfiguration()))throw new Error('Production account login requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');}
 else if(process.env.AUTH_MODE==='invite'){if(!validInviteConfiguration(inviteConfiguration()))throw new Error('Production invitation mode requires Supabase and INVITE_GATEWAY_SECRET.');}
 else if(!process.env.ACCESS_CODE||process.env.ACCESS_CODE.length<12)throw new Error('Production requires ACCESS_CODE with at least 12 characters.');
}
const port=Number(process.env.PORT||3001);const host=process.env.HOST||(production?'0.0.0.0':'127.0.0.1');
createApp().listen(port,host,()=>console.log(`Interview coach: http://${host}:${port}`));
