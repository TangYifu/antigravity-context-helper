'use strict';
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const dir = path.join(process.env.HOME, 'Library/Application Support/AntigravityContextHelper');
const activePort = path.join(process.env.HOME, 'Library/Application Support/Antigravity/DevToolsActivePort');
const app = '/Applications/Antigravity.app';
const hook = fs.readFileSync(path.join(dir, 'argon1m-hook.js'), 'utf8');
let lastStatus = '';
let waitingSince = 0;
function log(s) { if (s !== lastStatus) { lastStatus = s; console.log(new Date().toISOString() + ' ' + s); if (s.startsWith('Unsupported version') || s.startsWith('Incompatible interface')) cp.execFile('/usr/bin/osascript', ['-e', 'display notification "Antigravity 已更新或界面不兼容，1M 补丁未启用。" with title "Antigravity 上下文助手"'], () => {}); } }
function command(file, args) { try { return cp.execFileSync(file, args, {encoding:'utf8', timeout:3000, stdio:['ignore','pipe','ignore']}).trim(); } catch { return ''; } }
async function evaluate(url, expression) {
 const ws = new WebSocket(url);
 return await new Promise((resolve, reject) => {
  const timer = setTimeout(() => { ws.close(); reject(Error('debugger timeout')); }, 3000);
  ws.onerror = () => { clearTimeout(timer); reject(Error('debugger connection failed')); };
  ws.onopen = () => ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));
  ws.onmessage = event => { const m=JSON.parse(event.data); if(m.id!==1)return; clearTimeout(timer); ws.close(); if(m.error||m.result?.exceptionDetails)reject(Error('evaluation failed')); else resolve(m.result?.result?.value); };
 });
}
async function tick() {
 const pid=command('/usr/bin/pgrep',['-f','^/Applications/Antigravity.app/Contents/MacOS/Antigravity$']);
 if(!pid) { waitingSince = 0; log('Waiting for Antigravity'); return; }
 const version=command('/usr/libexec/PlistBuddy',['-c','Print :CFBundleShortVersionString',app+'/Contents/Info.plist']);
 if(!/^2\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) { log('Unsupported version '+version+'; injection skipped'); return; }
 let port; try {port=fs.readFileSync(activePort,'utf8').split('\n')[0];} catch {log('Waiting for debug port'); return;}
 if(!/^\d{1,5}$/.test(port)) return;
 const listeners=command('/usr/sbin/lsof',['-nP','-iTCP:'+port,'-sTCP:LISTEN','-t']).split('\n').filter(Boolean);
 if(!listeners.includes(pid.split('\n')[0])) { log('Debug port is not owned by Antigravity; injection skipped'); return; }
 const response=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(2000)});
 const targets=await response.json();
 let count=0, incompatible=0;
 for(const t of targets.filter(x=>x.type==='page' && /^https:\/\/127\.0\.0\.1:\d+\/$/.test(x.url) && /^ws:\/\/127\.0\.0\.1:\d+\//.test(x.webSocketDebuggerUrl))) {
  const expression=`(()=>{try{const sk=globalThis.J?.CascadeConfigSchema?.typeName==='exa.cortex_pb.CascadeConfig'?'J':'I'; const ck=sk==='J'?'Vb':'Wb'; const schema=globalThis[sk]; if(document.readyState!=='complete'||typeof globalThis[ck]!=='function'||!schema?.CascadeConfigSchema||!schema?.CheckpointConfigSchema)return 'waiting'; if(schema.CascadeConfigSchema.typeName!=='exa.cortex_pb.CascadeConfig')return 'incompatible'; const probe=globalThis[ck](schema.CascadeConfigSchema,{plannerConfig:{planModel:1417}}); if(probe?.plannerConfig?.planModel!==1417)return 'incompatible'; (${hook})(); const s=globalThis.__context1mPatch; if(!s?.installed||s.geminiBudget!==983040||s.claudeBudget!==868928)return 'incompatible'; const cases=[[1417,983040],[1525,983040],[1318,983040],[1400,868928],[1403,868928],[1416,null]]; return cases.every(([id,budget])=>{const x=globalThis[ck](schema.CascadeConfigSchema,{plannerConfig:{planModel:id}});return budget===null ? !x.checkpointConfig : x.checkpointConfig?.maxTokenLimit===budget && x.checkpointConfig?.tokenThreshold===budget}) ? 'active' : 'incompatible';}catch(e){return 'incompatible'}})()`;
  const status=await evaluate(t.webSocketDebuggerUrl,expression); if(status==='active')count++; else if(status==='incompatible')incompatible++; else if(status==='waiting') { if(!waitingSince) waitingSince=Date.now(); if(Date.now()-waitingSince>30000) incompatible++; }
 }
 if(count) waitingSince=0;
 log(count ? `Active on ${count} window(s), Antigravity ${version}` : incompatible ? `Incompatible interface, Antigravity ${version}; injection skipped` : 'Waiting for Antigravity window');
}
(async()=>{for(;;){try{await tick()}catch(e){log('Waiting for application debugger')} await new Promise(r=>setTimeout(r,1500));}})();
