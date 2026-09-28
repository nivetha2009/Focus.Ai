import {handler} from '../lib/http.js';
import {extractText} from '../lib/extract.js';
import {fail} from '../lib/claude.js';
export default handler(async({name,data})=>{
  if(!name||!data)throw fail(400,'Please choose a file.');
  const buf=Buffer.from(data,'base64');
  if(buf.length>3*1024*1024)throw fail(413,'File too large (max 3 MB).');
  return {text:(await extractText(name,buf)).slice(0,200000)};
});
