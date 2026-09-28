// Wraps handlers: POST only, friendly errors, never leaks internals.
export const handler=fn=>async(req,res)=>{
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  try{res.status(200).json(await fn(req.body||{}))}
  catch(e){res.status(e.status||500).json({error:e.status?e.message:'Server error. Please try again.'})}
};
