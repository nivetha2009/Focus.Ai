import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import {fail} from './claude.js';
export async function extractText(name,buf){
  const ext=String(name).split('.').pop().toLowerCase();
  let t='';
  if(ext==='txt')t=buf.toString('utf8');
  else if(ext==='pdf')t=(await pdf(buf)).text;
  else if(ext==='docx')t=(await mammoth.extractRawText({buffer:buf})).value;
  else if(ext==='pptx'){
    const z=await JSZip.loadAsync(buf);
    const n=f=>+f.match(/\d+/g).pop();
    const slides=Object.keys(z.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f)).sort((a,b)=>n(a)-n(b));
    for(const f of slides){const x=await z.file(f).async('string');t+=[...x.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>m[1]).join(' ')+'\n\n'}
  }else throw fail(400,'Unsupported file type. Use PDF, PPTX, DOCX or TXT (old .doc/.ppt: re-save as DOCX/PPTX).');
  t=t.trim();
  if(t.length<20)throw fail(422,'No readable text found (scanned/image-only files are not supported).');
  return t;
}
