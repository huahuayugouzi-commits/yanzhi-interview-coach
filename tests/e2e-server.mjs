import {createApp} from '../server/app.mjs';
const protectedMode=process.argv.includes('--protected');
createApp({config:{},accessCode:protectedMode?'trial-test-code':'',trustProxy:false}).listen(protectedMode?3004:3003,'127.0.0.1');
