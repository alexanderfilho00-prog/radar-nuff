const {chromium}=require('playwright');const fs=require('fs'),path=require('path');(async()=>{const b=await chromium.launch();
for(const f of process.argv.slice(2)){const [src,out,scale]=f.split('|');
const m=fs.readFileSync(src,'utf8').match(/width="([\d.]+)" height="([\d.]+)"/);
const ctx=await b.newContext({viewport:{width:Math.round(+m[1]),height:Math.round(+m[2])},deviceScaleFactor:+(scale||1)});const p=await ctx.newPage();
await p.goto('file://'+path.resolve(src));await p.screenshot({path:out,omitBackground:true});await ctx.close();}
await b.close()})()
