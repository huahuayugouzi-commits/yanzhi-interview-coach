import {createApp} from './app.mjs';
const production=process.env.NODE_ENV==='production';
if(production&&(!process.env.ACCESS_CODE||process.env.ACCESS_CODE.length<12))throw new Error('Production requires ACCESS_CODE with at least 12 characters.');
const port=Number(process.env.PORT||3001);const host=process.env.HOST||(production?'0.0.0.0':'127.0.0.1');
createApp().listen(port,host,()=>console.log(`Interview coach: http://${host}:${port}`));
