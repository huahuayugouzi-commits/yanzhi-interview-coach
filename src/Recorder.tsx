import {useEffect,useRef,useState} from 'react';
import {api} from './api';
export default function Recorder({onText,disabled,asrReady,onBusy}:{onText:(text:string)=>void;disabled:boolean;asrReady:boolean;onBusy:(busy:boolean)=>void}){
 const [recording,setRecording]=useState(false),[processing,setProcessing]=useState(false),[seconds,setSeconds]=useState(0),[url,setUrl]=useState(''),[error,setError]=useState('');
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]),blob=useRef<Blob|null>(null),mounted=useRef(true),audioURL=useRef(''),recordingTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(recordingTimer.current)clearTimeout(recordingTimer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(audioURL.current)URL.revokeObjectURL(audioURL.current);onBusy(false);};},[]);
 useEffect(()=>{if(!recording)return;const t=setInterval(()=>setSeconds(x=>x+1),1000);return()=>clearInterval(t);},[recording]);
 const busy=(v:boolean)=>{setProcessing(v);onBusy(v);};
 async function start(){setError('');if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setError('当前浏览器不支持录音，请使用新版 Chrome / Edge，或直接输入文字。');return;}busy(true);try{
 const s=await navigator.mediaDevices.getUserMedia({audio:true});if(!mounted.current){s.getTracks().forEach(t=>t.stop());return;}stream.current=s;
 const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(x=>MediaRecorder.isTypeSupported(x));
 const r=new MediaRecorder(s,mime?{mimeType:mime}:undefined);recorder.current=r;chunks.current=[];
 r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data);};
 r.onstop=()=>{s.getTracks().forEach(t=>t.stop());if(recordingTimer.current)clearTimeout(recordingTimer.current);if(!mounted.current)return;blob.current=new Blob(chunks.current,{type:r.mimeType||'audio/webm'});if(audioURL.current)URL.revokeObjectURL(audioURL.current);audioURL.current=URL.createObjectURL(blob.current);setUrl(audioURL.current);setRecording(false);busy(false);};
 r.onerror=()=>{setError('录音中断，请重新录制或输入文字。');s.getTracks().forEach(t=>t.stop());setRecording(false);busy(false);};
 r.start(1000);setSeconds(0);setRecording(true);setProcessing(false);onBusy(true);recordingTimer.current=setTimeout(()=>{if(r.state==='recording')r.stop();},180000);
 }catch{stream.current?.getTracks().forEach(t=>t.stop());setError('无法使用麦克风，请允许录音权限，或直接输入文字继续。');busy(false);}}
 async function convert(){if(!blob.current)return;setError('');busy(true);try{const form=new FormData();const type=blob.current.type.split(';')[0];form.append('audio',blob.current,'answer.'+(type.includes('mp4')?'mp4':type.includes('ogg')?'ogg':'webm'));const r=await api<{text:string}>('transcribe',form);if(mounted.current)onText(r.text);}catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current)busy(false);}}
 return <div className="recorder"><div className="record-row"><button type="button" className={'record-button '+(recording?'is-recording':'')} disabled={disabled||processing} onClick={()=>recording?recorder.current?.stop():start()}><span aria-hidden="true">{recording?'■':'●'}</span> {recording?'停止录音':url?'重新录制':'开始录音'}</button><div><strong className="timer">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</strong><span className="small">建议 60–120 秒 · 最长 3 分钟</span></div></div>{url&&<div className="audio-row"><audio controls src={url}/><button type="button" className="secondary" onClick={convert} disabled={disabled||processing||recording}>{processing?'正在转录…':'转为文字'}</button></div>}{!asrReady&&<p className="small">转录服务未配置：可以录音回听，也可以直接输入回答。</p>}{error&&<p className="inline-error" role="alert">{error}</p>}</div>;
}
