import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const schedulerPath=createRequire(require.resolve('react-dom/package.json')).resolve('scheduler');
import ts from 'typescript';
import {build} from 'vite';
// In-process TypeScript transform also supports restricted Windows environments
// where starting esbuild child processes is unavailable.
await build({configFile:false,resolve:{preserveSymlinks:true,alias:{scheduler:schedulerPath}},esbuild:false,plugins:[{name:'typescript-in-process',enforce:'pre',transform(code,id){code=code.replaceAll('process.env.NODE_ENV',JSON.stringify('production'));if(!/\.[jt]sx?$/.test(id)||id.includes('node_modules'))return {code,map:null};const result=ts.transpileModule(code,{fileName:id,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,sourceMap:true}});return {code:result.outputText,map:result.sourceMapText};}}],build:{minify:false}});



