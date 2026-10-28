import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.argv[2]||8765);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Use a port between 1024 and 65535.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.includes('\0')||pathname.split(/[\\/]/).some(segment=>segment.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
    let file=path.resolve(root,`.${pathname}`);
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end('Forbidden');return;}
    const stat=await fs.stat(file);
    if(stat.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(302,{Location:`${encodeURI(pathname)}/`});res.end();return;}
      file=path.join(file,'index.html');
    }
    const body=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){const status=['ENOENT','ENOTDIR'].includes(error.code)?404:400;res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});res.end(status===404?'Not found':'Bad request');}
});
server.on('error',error=>{console.error(`Preview server: ${error.code}. Try: node scripts/serve.mjs <another-port>`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/catalog/`));
