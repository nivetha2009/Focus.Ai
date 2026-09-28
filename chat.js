import {handler} from '../lib/http.js';
import {ask,fail} from '../lib/claude.js';
import {CHAT_SYSTEM} from '../lib/prompts.js';
export default handler(async({messages,material,level})=>{
  const m=(Array.isArray(messages)?messages:[]).filter(x=>['user','assistant'].includes(x.role)&&String(x.content||'').trim()).slice(-20).map(x=>({role:x.role,content:String(x.content).slice(0,8000)}));
  if(!m.length||m[m.length-1].role!=='user')throw fail(400,'Please type a message first.');
  const sys=CHAT_SYSTEM(level)+(material?`\n\nSTUDY MATERIAL:\n${String(material).slice(0,60000)}`:'');
  return {text:await ask({system:sys,messages:m})};
});
