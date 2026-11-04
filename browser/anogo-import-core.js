/* Independent import adapter for AnoGO's published background/narration/dialogue data format. */
const WebVideoAnogo=(()=>{
 const lookup=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key)?object[key]:null;
 const importText=value=>{const text=String(value??'');if(text.includes(' -')||/[\\|\x00]/.test(text))throw Error('正文含有参数或转义分隔符，请先调整文本');return C.escapeText(text);};
 const fold=value=>String(value??'').trim().toLowerCase(),plain=value=>String(value??'').replace(/[\r\n]+/g,' '),C=window.WebVideoProjectCore;
 function parse(input){const text=input.replace(/^\uFEFF/,'').trim().replace(/^```(?:json|yaml|yml)?\s*\n([\s\S]*?)\n```$/i,'$1');if(!text)throw Error('请粘贴 Anogo 文本或选择文件。');if(text.length>4*1024*1024)throw Error('输入不能超过 4 MB。');let data;try{data=JSON.parse(text);}catch{data=window.WebVideoYaml.load(text,{schema:window.WebVideoYaml.JSON_SCHEMA});}if(!Array.isArray(data)||!data.length||data.length>10000)throw Error('Anogo 文本应为 1 到 10000 条语句组成的数组。');
  return data.map((item,index)=>{if(!item||typeof item!=='object'||Array.isArray(item))throw Error('第 '+(index+1)+' 条必须是对象。');const keys=Object.keys(item),type='背景'in item?'background':'旁白'in item?'narration':'dialogue',required=type==='background'?['背景']:type==='narration'?['旁白']:['角色','对话'],allowed=type==='dialogue'?['角色','动作','对话']:required;if(keys.some(k=>!allowed.includes(k))||required.some(k=>!['string','number'].includes(typeof item[k])))throw Error('第 '+(index+1)+' 条字段不符合 Anogo 格式。');if(item.动作!==undefined&&item.动作!==null&&!['string','number'].includes(typeof item.动作))throw Error('第 '+(index+1)+' 条动作必须是文字。');return {type,...Object.fromEntries(required.map(k=>[k,String(item[k])])),动作:item.动作==null?'':String(item.动作)};});
 }
 async function readGltfOptions(reference,readResources){
  if(!/(?:^|\/)config\.json$/i.test(reference))return null;
  const paths=reference.split(/(?<=config\.json)\+/i);
  const read=async file=>{
   const source=await WebVideoProject.read(WebVideoProject.projectPath(C.safePath(file)),null);
   return source?JSON.parse(source):null;
  };
  const configs=await Promise.all(paths.map(async path=>{
   if(!/^http:\/\/127\.0\.0\.1:\d+\/webvideo-shared\/[a-f0-9]{32}\//.test(path))return read('game/3d/figure/'+path);
   const response=await fetch(path,{signal:AbortSignal.timeout(5000)});
   return response.ok?response.json():null;
  }));
  if(!configs.some(Boolean))return null;
  const components=configs.flatMap((config,index)=>(config?.components||[])
   .filter(component=>component?.type==='model'&&(paths.length===1||component.role===(index===0?'head':'body'))));
  const integrated=components.find(component=>component.role==='integrated');
  const face=integrated||components.find(component=>component.role==='head');
  const body=integrated||components.find(component=>component.role==='body');
  if(!face||!body)return {motions:[],expressions:[]};
  const resources=await readResources();
  const motions=resources.filter(entry=>entry.type==='garupa-motion'||entry.type==='motion').map(entry=>entry.url?entry:entry.name);
  const expressions=[];
  const groups=Array.isArray(face.expressionGroups)?face.expressionGroups:[];
  const states=type=>groups.find(group=>group.type===type)?.states||[];
  const native=new Map();
  for(const state of states('face'))native.set(state.name,'3d:face/'+encodeURIComponent(state.name));
  const mouthDefault=states('mouth')[0]?.name;
  for(const state of states('eye')){
   const defaults=state.mouth||(state.name===face.defaultExpression?.eye?face.defaultExpression:null);
   const names=[state.name,defaults?.closed??mouthDefault,defaults?.open??mouthDefault];
   native.set(state.name,'3d:'+names.map(name=>encodeURIComponent(name??'')).join('/'));
  }
  const adapters=resources.filter(entry=>entry.type==='garupa-expression-adapter');
  const adapterConfigs=await Promise.all([...new Set(adapters.map(entry=>entry.config))].map(async config=>{
   try{return await read('game/'+config);}catch{return null;}
  }));
  if(body.motionGroup&&adapterConfigs.some(config=>config?.components?.some(component=>component.type==='garupa-expression-adapter'&&component.motionGroup===body.motionGroup))){
   expressions.push(...resources.filter(entry=>entry.type==='garupa-expression').map(entry=>entry.url?entry:entry.name));
  }
  return {motions,expressions,native};
 }
 async function compile(input,model,characters,actions,useActions){const data=parse(input),lines=[],reviewRelative=[],warnings=[],templates=new Map(),catalogs=new Map();let offset=0;
  for(const row of model.statements)if(row.command==='changeFigure'&&row.content&&row.content!=='none'&&row.args.clear!==true&&row.args.id)templates.set(fold(row.args.id),row);
  const add=(code,pending)=>{if(pending)reviewRelative.push(offset);lines.push(code);offset+=code.length+1;};
  let resourceRequest;
  const readResources=()=>resourceRequest??=(async()=>{
   const gameName=model.path.split('/')[1];
   const response=await fetch('/api/manageGame/updateGltfResourceCatalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gameName})});
   if(!response.ok)return [];
   const data=await response.json();
   const local=Array.isArray(data.resources)?data.resources:[];
   const shared=typeof WebVideoSharedMaterials==='undefined'?[]:await WebVideoSharedMaterials
    .request('/api/shared/gltf-named',{}).catch(()=>[]);
   return local.concat(shared.map(entry=>({...entry,type:entry.type==='expression'?'garupa-expression':'motion'})));
  })().catch(()=>[]);
  async function catalog(template){if(catalogs.has(template.content))return catalogs.get(template.content);let gltf;try{gltf=await readGltfOptions(template.content,readResources);}catch{gltf={motions:[],expressions:[]};}if(gltf){catalogs.set(template.content,gltf);return gltf;}if(!/\.jsonl?$/i.test(template.content)){const empty={motions:[],expressions:[]};catalogs.set(template.content,empty);return empty;}let motions=[],expressions=[];try{const file=WebVideoProject.projectPath('game/figure/'+C.safePath(template.content)),text=await WebVideoProject.read(file,null);if(text&&text.length<=4*1024*1024){let doc;try{doc=JSON.parse(text);}catch{for(const line of text.split(/\r?\n/)){try{const value=JSON.parse(line);if(value.motions||value.expressions||value.FileReferences){doc=value;break;}}catch{}}}if(doc){motions=Object.keys(doc.motions||doc.FileReferences?.Motions||{});expressions=(doc.expressions||doc.FileReferences?.Expressions||[]).map(item=>item.name||item.Name).filter(Boolean);}}}catch{}const result={motions,expressions};catalogs.set(template.content,result);return result;}
  const pick=(items,key)=>{
   if(!key)return null;
   const name=item=>fold(item.name??item),value=item=>item.url??item;
   const exact=items.find(item=>name(item)===fold(key)||fold(value(item))===fold(key));
   if(exact)return value(exact);
   const matches=items.filter(item=>name(item).includes(fold(key)));
   const local=matches.filter(item=>typeof item==='string').sort();
   return local[0]??(matches.length===1?value(matches[0]):null);
  };
  for(let index=0;index<data.length;index++){const item=data[index];if(item.type==='background'){const asset=C.safePath(item.背景);add('changeBg:'+C.escapeText(asset)+' -next;',!useActions);continue;}if(item.type==='narration'){add(':'+importText(item.旁白)+';',!useActions);continue;}
   const name=item.角色.trim();if(!name||name.includes(' -')||/[;:\\|\x00\r\n]/.test(name))throw Error('第 '+(index+1)+' 条角色名无效。');const id=lookup(characters.nameToId,fold(name)),action=item.动作.trim();let pending=!useActions||!action||!id,comment=action?' Anogo动作：'+plain(action):'',change=null;
   if(!id)warnings.push('第 '+(index+1)+' 条：角色“'+name+'”未匹配到 ID，已保留对话。');
   if(useActions&&action){const mapping=lookup(actions?.lookup,fold(id+'/'+action))||lookup(actions?.lookup,fold(action)),template=id&&templates.get(fold(id));if(mapping&&template){const available=await catalog(template),motion=pick(available.motions,String(mapping.motion||'').replaceAll('{name}',id)),expressionKey=String(mapping.expression||'').replaceAll('{name}',id),expression=available.native?.get(expressionKey)||pick(available.expressions,expressionKey);if(motion||expression){const args={id,next:true,motion:motion||false,expression:expression||false};change=WebVideoProject.writer(template,{args});}if(!motion||!expression){pending=true;warnings.push('第 '+(index+1)+' 条：动作或表情未完整匹配。');}}else{pending=true;warnings.push('第 '+(index+1)+' 条：未找到动作映射或已有立绘信息。');}}
   if(change)add(change,pending);const code=name+':'+importText(item.对话)+(id?' -id -figureId='+C.safeId(id):'')+';'+comment;add(code,pending);
  }
  const script=lines.join('\n')+'\n';const checked=WebVideoProject.parse(script.replace(/\n$/,'')).sentenceList.filter(row=>!row.isLineBreakHolder);if(checked.length!==lines.length)throw Error('生成语句数量异常，已停止导入。');for(const row of checked){const type=commandType[row.command];if(!['say','changeBg','changeFigure'].includes(type))throw Error('输入包含无法安全转换的语句。');if(type!=='changeFigure'){const allowed=new Set(type==='changeBg'?['next']:['speaker','id','figureId']);if(row.args.some(arg=>!allowed.has(arg.key)))throw Error('文本中包含会被解释成 WebGAL 参数的内容，请调整文本后重试。');}}const prefix=model.source&&!model.source.endsWith('\n')?'\n':'',insert=prefix+script,base=model.source.length+prefix.length;
  return {path:model.path,before:model.source,after:model.source+insert,patches:[{startOffset:model.source.length,endOffset:model.source.length,before:'',after:insert}],changed:data.length,reviewOffsets:reviewRelative.map(n=>base+n),warnings,statementCount:lines.length,reviewCount:reviewRelative.length,operation:{type:'importAnogo'}};
 }
 return {parse,compile};
})();
