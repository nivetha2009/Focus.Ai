// AI service: the ONLY place the secret key is read (server-side).
const fail=(status,message)=>Object.assign(new Error(message),{status});
export async function ask({system,messages,max_tokens=4096}){
  const key=process.env.ANTHROPIC_API_KEY;
  if(!key||key==='your_api_key_here')throw fail(503,'The AI service is not configured yet. Add ANTHROPIC_API_KEY on the server.');
  let r;
  try{r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
    headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5',max_tokens,system,messages})});
  }catch{throw fail(502,'Could not reach the AI service. Please try again.')}
  if(r.status===401||r.status===403)throw fail(503,'The AI service key is invalid. Check ANTHROPIC_API_KEY.');
  if(r.status===429)throw fail(429,'The AI service is busy. Please wait a moment.');
  if(!r.ok)throw fail(502,'The AI request failed. Please try again.');
  const d=await r.json();
  const text=(d.content||[]).map(c=>c.text||'').join('').trim();
  if(!text)throw fail(502,'The AI returned an empty answer. Please try again.');
  return text;
}
export {fail};
