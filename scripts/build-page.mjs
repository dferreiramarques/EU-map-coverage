// Injects src/shapes.json into src/template.html and writes a standalone, password-protected index.html.
// The page body (markup, script, data) is encrypted with AES-256-GCM; the key is derived from the
// password with PBKDF2. Set the password with the SITE_PASSWORD environment variable.
import fs from 'fs';
import crypto from 'crypto';
const u = p => new URL(p, import.meta.url);
const password = process.env.SITE_PASSWORD;
if (!password) { console.error('Set SITE_PASSWORD, e.g.  SITE_PASSWORD="your password" npm run build'); process.exit(1); }

const tpl = fs.readFileSync(u('../src/template.html'), 'utf8')
  .replace('__SHAPES__', fs.readFileSync(u('../src/shapes.json'), 'utf8').trim());
// <title>, font links and <style> go in <head>; the rest is the body.
const cut = tpl.indexOf('<div class="wrap">');
const head = tpl.slice(0, cut).trim(), body = tpl.slice(cut).trim();

const ITER = 250000;
const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITER, 32, 'sha256');
const c = crypto.createCipheriv('aes-256-gcm', key, iv);
const enc = Buffer.concat([c.update(body, 'utf8'), c.final(), c.getAuthTag()]); // WebCrypto expects tag appended
const payload = JSON.stringify({ s: salt.toString('base64'), i: iv.toString('base64'), d: enc.toString('base64'), n: ITER });

const gate = `
<style>
#gate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
#gate form{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:24px;width:min(360px,100%);display:flex;flex-direction:column;gap:12px}
#gate h1{font-size:22px;margin:0}
#gate input{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:9px 10px}
#gate button{font:inherit;font-weight:600;border-radius:8px;padding:9px 14px;cursor:pointer;border:1px solid var(--fg);background:var(--fg);color:var(--bg)}
#gate p{margin:0;font-size:13px;color:#b3261e;min-height:1em}
</style>
<div id="gate"><form id="gateForm">
  <h1>Station coverage map</h1>
  <label for="pw" class="note">Enter the password to view this page.</label>
  <input id="pw" type="password" autocomplete="current-password" autofocus required>
  <button type="submit">Unlock</button>
  <p id="gateErr" role="alert"></p>
</form></div>
<script>
(()=>{
const P=${payload};
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function unlock(pw){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(P.s),iterations:P.n,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
  const buf=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(P.i)},key,b64(P.d));
  const html=new TextDecoder().decode(buf);
  document.getElementById('gate').remove();
  const box=document.createElement('div');box.innerHTML=html;
  const scripts=[...box.querySelectorAll('script')].map(s=>{const n=document.createElement('script');n.textContent=s.textContent;s.remove();return n});
  while(box.firstChild)document.body.appendChild(box.firstChild);
  scripts.forEach(s=>document.body.appendChild(s));
}
const err=document.getElementById('gateErr');
async function attempt(pw,quiet){
  try{await unlock(pw);try{sessionStorage.setItem('pw',pw)}catch(e){}return true}
  catch(e){if(!quiet)err.textContent=window.crypto&&crypto.subtle?'Wrong password.':'This page must be opened over https:// or localhost.';return false}
}
document.getElementById('gateForm').onsubmit=e=>{e.preventDefault();err.textContent='';attempt(document.getElementById('pw').value)};
try{const k=sessionStorage.getItem('pw');if(k)attempt(k,true)}catch(e){}
})();
</script>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
${head}
</head>
<body style="margin:0">
${gate}
</body>
</html>
`;
fs.mkdirSync(u('../public/'), { recursive: true });
fs.writeFileSync(u('../public/index.html'), html);
console.log('public/index.html written (' + Math.round(html.length / 1024) + ' KB, password-protected)');
