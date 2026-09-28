import {handler} from '../lib/http.js';
import {ask,fail} from '../lib/claude.js';
import {TOOLS,JSON_TOOLS} from '../lib/prompts.js';
export default handler(async({tool,text,count,difficulty,instructions,level})=>{
  if(!TOOLS[tool])throw fail(400,'Unknown tool.');
  if(!String(text||'').trim())throw fail(400,'Add some study material or text first.');
  const o={count:Math.min(Math.max(+count||10,1),50),difficulty:difficulty||'medium',instructions:String(instructions||'').slice(0,500)};
  const out=await ask({system:`You are Focus, an expert study-material generator${level?` for ${level} students`:''}. Use only the provided material.`,
    messages:[{role:'user',content:`${TOOLS[tool](o)}\n\nMATERIAL:\n${String(text).slice(0,60000)}`}],max_tokens:6000});
  if(!JSON_TOOLS.includes(tool))return {result:out};
  try{const j=JSON.parse(out.replace(/^```(?:json)?|```$/g,'').trim());if(!Array.isArray(j)||!j.length)throw 0;return {result:j}}
  catch{throw fail(502,'The AI reply could not be read. Please try again.')}
});
