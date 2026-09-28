// Focus client. Talks only to /api/* (no secrets here). Data is saved in this browser (localStorage).
const $=s=>document.querySelector(s);
const L=(k,d)=>{try{return JSON.parse(localStorage.getItem('focus_'+k))??d}catch{return d}};
const S=(k,v)=>localStorage.setItem('focus_'+k,JSON.stringify(v));
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/^#+ (.*)$/gm,'<h3>$1</h3>').replace(/^[-*] /gm,'• ').replace(/\n/g,'<br>');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const TOOLS={summarizer:'Summarizer',mcq:'MCQ Generator',flashcards:'Flashcard Generator',paper:'Question Paper Generator',notes:'Notes Generator',beginner:"Explain Like I'm a Beginner",important:'Important Questions',planner:'Revision Planner'};
let st={user:L('user',null),mats:L('mats',[]),chats:L('chats',[]),cards:L('cards',[]),mcqs:L('mcqs',[]),notes:L('notes',[]),prefs:L('prefs',{level:'undergraduate'}),
  chat:null,mat:null,busy:false,err:'',out:null,tool:'summarizer',ci:0,flip:false,qa:{},best:L('best',null)};
const save=()=>['user','mats','chats','cards','mcqs','notes','prefs','best'].forEach(k=>S(k,st[k]));
async function api(p,b){let r;try{r=await fetch('/api/'+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})}catch{throw Error('Network error. Check your connection and try again.')}
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Something went wrong.');return d}
const matText=()=>st.mats.find(m=>m.id===st.mat)?.text||'';
const curChat=()=>{let c=st.chats.find(c=>c.id===st.chat);if(!c){c={id:uid(),title:'New chat',messages:[]};st.chats.unshift(c);st.chat=c.id}return c};
const download=(name,txt)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download=name;a.click()};
const matSelect=()=>`<label for="src">Study material</label><select id="src" data-a="pickmat"><option value="">None</option>${st.mats.map(m=>`<option value="${m.id}" ${m.id===st.mat?'selected':''}>${esc(m.name)}</option>`).join('')}</select>`;
const err=()=>st.err?`<p class="err" role="alert">${esc(st.err)}</p>`:'';
const cta=`<a class="btn p" href="#/${st.user?'dashboard':'login'}" style="display:inline-block;text-decoration:none;background:var(--brand);color:#fff">Start studying free</a>`;

const V={
home:()=>`<div class="wrap"><div class="row" style="justify-content:space-between"><b style="font-size:1.4rem">◎ Focus</b><a class="btn" href="#/${st.user?'dashboard':'login'}">${st.user?'Open app':'Log in'}</a></div>
<section class="hero"><h1>Study smarter, not longer.</h1><p class="mute" style="font-size:1.2rem">Upload your notes, chat with an AI tutor, and turn any chapter into summaries, MCQs, flashcards and revision plans.</p>${cta}</section>
<h2>Features</h2><div class="grid">${['AI tutor chat','Upload PDF, PPTX, DOCX, TXT','8 study tools','Interactive MCQs & flashcards'].map(t=>`<div class="card"><h3>${t}</h3></div>`).join('')}</div>
<h2>How it works</h2><div class="grid"><div class="card"><b>1. Upload</b><br>Add your lecture files.</div><div class="card"><b>2. Ask or generate</b><br>Chat or pick a tool.</div><div class="card"><b>3. Practise</b><br>Quiz yourself and revise.</div></div>
<p class="mute" style="text-align:center;margin-top:3em">© Focus – built for students.</p></div>`,
login:()=>`<div class="wrap" style="max-width:420px"><h1>◎ Focus</h1><form class="card" data-f="login"><h2>Welcome</h2><label for="n">Your name</label><input id="n" required><label for="e">Email</label><input id="e" type="email" required><p class="mute">Your profile and study data are stored in this browser only.</p><button class="p">Continue</button></form></div>`,
dashboard:()=>{const q=st.best;return `<h1>Hi ${esc(st.user.name)} 👋</h1><div class="row"><a class="btn p" href="#/assistant" style="background:var(--brand);color:#fff;text-decoration:none">Ask the AI</a><a class="btn" href="#/materials">Upload material</a><a class="btn" href="#/tools">Study tools</a></div>
<h2>Progress</h2><div class="grid"><div class="card"><h3>${st.chats.length}</h3>chats</div><div class="card"><h3>${st.mats.length}</h3>materials</div><div class="card"><h3>${st.cards.length}</h3>flashcards</div><div class="card"><h3>${q?q.pct+'%':'–'}</h3>last quiz score${q?`<div class="bar"><i style="width:${q.pct}%"></i></div>`:''}</div></div>
<h2>Recent materials</h2>${st.mats.slice(0,3).map(m=>`<div class="card">${esc(m.name)}</div>`).join('')||'<p class="mute">None yet.</p>'}
<h2>Recent chats</h2>${st.chats.slice(0,3).map(c=>`<a class="card" style="display:block" href="#/assistant" data-a="openchat" data-v="${c.id}">${esc(c.title)}</a>`).join('')||'<p class="mute">None yet.</p>'}`},
assistant:()=>{const c=st.chats.find(c=>c.id===st.chat);return `<div class="row" style="justify-content:space-between"><h1>AI Assistant</h1><div class="row"><button data-a="newchat">New chat</button><button data-a="clear">Clear</button></div></div>
<div class="row">${st.chats.map(x=>`<button data-a="openchat" data-v="${x.id}" ${x.id===st.chat?'class="p"':''}>${esc(x.title.slice(0,24))}</button>`).join('')}</div>${matSelect()}
<div class="msgs" aria-live="polite">${(c?.messages||[]).map((m,i)=>`<div class="m ${m.role}">${md(m.content)}${m.role==='assistant'?`<div class="row"><button data-a="copy" data-v="${i}">Copy</button>${i===c.messages.length-1?'<button data-a="regen">Regenerate</button>':''}</div>`:''}</div>`).join('')||'<p class="mute">Ask anything about your courses…</p>'}${st.busy?'<div class="m assistant">Thinking…</div>':''}</div>${err()}
<form data-f="chat" class="row"><label for="q" class="mute" style="flex-basis:100%">Message</label><textarea id="q" rows="2" style="flex:1" required></textarea><button class="p" ${st.busy?'disabled':''}>Send</button></form>`},
materials:()=>`<h1>Study Materials</h1><div class="card"><label for="f">Upload PDF, PPTX, DOCX or TXT (max 3 MB)</label><input id="f" type="file" accept=".pdf,.pptx,.docx,.txt" data-a="upload">${st.busy?'<p>Reading file…</p>':''}${err()}</div>
${st.mats.map(m=>`<div class="card row" style="margin-top:.8em;justify-content:space-between"><span>${esc(m.name)} <span class="mute">(${m.text.length.toLocaleString()} chars)</span></span><span class="row"><a class="btn" href="#/assistant" data-a="usemat" data-v="${m.id}">Chat</a><button data-a="delmat" data-v="${m.id}">Delete</button></span></div>`).join('')}`,
tools:()=>`<h1>Study Tools</h1><div class="row">${Object.entries(TOOLS).map(([k,v])=>`<button data-a="tool" data-v="${k}" ${k===st.tool?'class="p"':''}>${v}</button>`).join('')}</div>
<form class="card" data-f="gen" style="margin-top:1em"><h2>${TOOLS[st.tool]}</h2>${matSelect()}<label for="txt">Or paste text</label><textarea id="txt" rows="5"></textarea>
<div class="row"><div><label for="cnt">Count</label><input id="cnt" type="number" min="1" max="50" value="10"></div><div><label for="dif">Difficulty</label><select id="dif"><option>easy</option><option selected>medium</option><option>hard</option></select></div></div>
<label for="ins">Extra instructions (optional)</label><input id="ins"><p></p><button class="p" ${st.busy?'disabled':''}>${st.busy?'Generating…':'Generate'}</button>${err()}</form>
${st.out?`<div class="card" style="margin-top:1em"><div class="row"><button data-a="copyout">Copy</button><button data-a="dlout">Download</button></div><div>${md(st.out)}</div></div>`:''}`,
flashcards:()=>{const c=st.cards[st.ci];return `<h1>Flashcards</h1>${c?`<div class="card fc" role="button" tabindex="0" data-a="flip">${esc(st.flip?c.back:c.front)}</div><div class="row" style="margin-top:1em"><button data-a="prev">Previous</button><span>${st.ci+1} / ${st.cards.length}</span><button data-a="next">Next</button></div>`:'<p class="mute">Generate flashcards in Study Tools.</p>'}`},
mcqs:()=>{const q=st.mcqs,done=q.length&&Object.keys(st.qa).length===q.length;const sc=q.filter((x,i)=>st.qa[i]===x.answer).length;
 return `<h1>MCQs</h1>${q.map((x,i)=>`<div class="card" style="margin-bottom:1em"><b>${i+1}. ${esc(x.q)}</b>${x.options.map((o,j)=>{const a=st.qa[i],cl=a===undefined?'':j===x.answer?'ok':j===a?'bad':'';return `<button class="opt ${cl}" data-a="pick" data-v="${i}:${j}" ${a!==undefined?'disabled':''}>${esc(o)}</button>`}).join('')}${st.qa[i]!==undefined?`<p class="mute">${esc(x.explanation||'')}</p>`:''}</div>`).join('')||'<p class="mute">Generate MCQs in Study Tools.</p>'}${done?`<div class="card"><h2>Score: ${sc}/${q.length}</h2><button data-a="retry">Retry</button></div>`:''}`},
notes:()=>`<h1>Notes</h1>${st.notes.map(n=>`<div class="card" style="margin-bottom:1em"><b>${esc(n.title)}</b><div class="row"><button data-a="ncopy" data-v="${n.id}">Copy</button><button data-a="ndl" data-v="${n.id}">Download</button><button data-a="ndel" data-v="${n.id}">Delete</button></div><div>${md(n.text)}</div></div>`).join('')||'<p class="mute">Generated notes, summaries and plans are saved here.</p>'}`,
settings:()=>`<h1>Settings</h1><form class="card" data-f="prefs"><label for="sn">Name</label><input id="sn" value="${esc(st.user.name)}"><label for="lv">Study level</label><select id="lv">${['school','undergraduate','postgraduate'].map(l=>`<option ${l===st.prefs.level?'selected':''}>${l}</option>`).join('')}</select><p></p><button class="p">Save</button></form><p><button data-a="wipe">Delete all my data</button> <button data-a="logout">Log out</button></p>`
};
const NAV=['dashboard','assistant','materials','tools','flashcards','mcqs','notes','settings'];
function render(){
  let r=(location.hash.slice(2)||'home');if(!V[r])r='home';
  if(!['home','login'].includes(r)&&!st.user)r='login';
  const inner=V[r]();
  $('#app').innerHTML=NAV.includes(r)?`<div class="shell"><nav class="side" aria-label="Main"><b style="font-size:1.3rem;padding:.4em .8em">◎ Focus</b>${NAV.map(n=>`<a href="#/${n}" class="${n===r?'on':''}">${n[0].toUpperCase()+n.slice(1)}</a>`).join('')}</nav><main>${inner}</main></div>`:inner;
}
const go=async(fn)=>{st.busy=true;st.err='';save();render();try{await fn()}catch(e){st.err=e.message}st.busy=false;save();render()};
async function reply(){const c=curChat();await go(async()=>{const d=await api('chat',{messages:c.messages,material:matText(),level:st.prefs.level});c.messages.push({role:'assistant',content:d.text})})}
const A={
 newchat:()=>{st.chat=null;curChat()},clear:()=>{const c=curChat();c.messages=[];c.title='New chat'},
 openchat:v=>{st.chat=v},copy:v=>navigator.clipboard.writeText(curChat().messages[v].content),
 regen:()=>{curChat().messages.pop();reply();return 1},
 usemat:v=>{st.mat=v},delmat:v=>{st.mats=st.mats.filter(m=>m.id!==v);if(st.mat===v)st.mat=null},tool:v=>{st.tool=v;st.out=null;st.err=''},
 copyout:()=>{navigator.clipboard.writeText(st.out);return 1},dlout:()=>{download('focus-'+st.tool+'.txt',st.out);return 1},
 flip:()=>{st.flip=!st.flip},next:()=>{st.ci=(st.ci+1)%st.cards.length;st.flip=false},prev:()=>{st.ci=(st.ci-1+st.cards.length)%st.cards.length;st.flip=false},
 pick:v=>{const[i,j]=v.split(':').map(Number);st.qa[i]=j;if(Object.keys(st.qa).length===st.mcqs.length){const s=st.mcqs.filter((x,k)=>st.qa[k]===x.answer).length;st.best={pct:Math.round(100*s/st.mcqs.length)}}},
 retry:()=>{st.qa={}},ncopy:v=>{navigator.clipboard.writeText(st.notes.find(n=>n.id===v).text);return 1},ndl:v=>{const n=st.notes.find(n=>n.id===v);download(n.title+'.txt',n.text);return 1},
 ndel:v=>{st.notes=st.notes.filter(n=>n.id!==v)},logout:()=>{st.user=null;location.hash='#/'},
 wipe:()=>{if(confirm('Delete all data?')){localStorage.clear();location.reload()}return 1}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||['INPUT','SELECT'].includes(b.tagName)||!A[b.dataset.a])return;const r=A[b.dataset.a](b.dataset.v);if(r)return;save();render()});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset?.a==='flip'){A.flip();render()}});
document.addEventListener('change',async e=>{const t=e.target;if(t.dataset.a==='pickmat')st.mat=t.value||null;
 if(t.dataset.a==='upload'&&t.files[0]){const f=t.files[0];await go(async()=>{if(f.size>3*1024*1024)throw Error('File too large (max 3 MB).');
  const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=()=>rej(Error('Could not read the file.'));r.readAsDataURL(f)});
  const d=await api('extract',{name:f.name,data});st.mats.unshift({id:uid(),name:f.name,text:d.text});st.mat=st.mats[0].id})}});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target.dataset.f,v=id=>$('#'+id)?.value.trim();
 if(f==='login'){st.user={name:v('n'),email:v('e')};save();location.hash='#/dashboard';render()}
 if(f==='prefs'){st.user.name=v('sn')||st.user.name;st.prefs.level=v('lv');save();render()}
 if(f==='chat'){const t=v('q');if(!t){st.err='Please type a message.';return render()}const c=curChat();if(!c.messages.length)c.title=t.slice(0,40);c.messages.push({role:'user',content:t});await reply()}
 if(f==='gen'){const text=matText()||v('txt');if(!text){st.err='Choose a material or paste some text.';return render()}
  const args={tool:st.tool,text,count:v('cnt'),difficulty:v('dif'),instructions:v('ins'),level:st.prefs.level};
  await go(async()=>{const d=await api('generate',args);
   if(st.tool==='flashcards'){st.cards=d.result;st.ci=0;st.flip=false;st.out=`Created ${d.result.length} flashcards – open the Flashcards page.`}
   else if(st.tool==='mcq'){st.mcqs=d.result;st.qa={};st.out=`Created ${d.result.length} questions – open the MCQs page.`}
   else{st.out=d.result;st.notes.unshift({id:uid(),title:TOOLS[st.tool]+' – '+new Date().toLocaleDateString(),text:d.result})}})}});
addEventListener('hashchange',render);render();
