import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=name=>fs.readFileSync(new URL('../browser/'+name,import.meta.url),'utf8');
const love='webgal-lovelive.lovelive';
const config={components:[{type:'model',role:'integrated',description:'3D actor',expressionGroups:[{type:'face',states:[{name:'smile'}]}]}]};
function fixture(engine=love,{gltf=config,reference='actor/config.json',manifestError=false}={}){
 const reads=[],requests=[],writes=[];
 const box={AbortSignal,window:null,commandType:{say:'say',changeFigure:'changeFigure'},WebVideoProjectCore:{safePath:x=>x,safeId:x=>x,escapeText:x=>x},
  WebVideoProject:{projectPath:x=>x,read:async path=>{
   reads.push(path);
   if(path==='webgal-engine.json'){if(manifestError)throw Error('manifest unavailable');return JSON.stringify({id:engine});}
   if(path.startsWith('game/3d/figure/')){if(gltf instanceof Error)throw gltf;return typeof gltf==='string'?gltf:gltf===null?null:JSON.stringify(gltf);}
   if(path.startsWith('game/figure/'))return JSON.stringify({motions:{idle:[]},expressions:[{name:'smile'}]});
   throw Error('unexpected read '+path);
  },writer:(row,{args})=>{writes.push(args);return 'changeFigure:'+row.content+';';},parse:text=>({sentenceList:text.split('\n').map(line=>({command:line.startsWith('changeFigure:')?'changeFigure':'say',args:[]}))})},
  fetch:async url=>{
   requests.push(url);
   if(url.endsWith('/webgal-engine.json')){if(manifestError)throw Error('manifest unavailable');return {ok:true,json:async()=>({id:engine})};}
   if(url==='/api/manageGame/updateGltfResourceCatalog')return {ok:true,json:async()=>({resources:[{type:'motion',name:'idle'}]})};
   if(gltf instanceof Error)throw gltf;
   return {ok:gltf!==null,json:async()=>typeof gltf==='string'?JSON.parse(gltf):gltf};
  }};
 box.window=box;vm.createContext(box);vm.runInContext(source('anogo-import-core.js')+'\nglobalThis.Anogo=WebVideoAnogo;',box);vm.runInContext(source('id-model-character.js'),box);
 const model={path:'games/fixture/game/scene/start.txt',source:'',statements:[{command:'changeFigure',content:reference,args:{id:'hero'}}]};
 return {box,reads,requests,writes,model,async compile(){return box.Anogo.compile(JSON.stringify([{角色:'actor',动作:'greet',对话:'hi'}]),model,{nameToId:{actor:'hero'}},{lookup:{greet:{motion:'idle',expression:'smile'}}},true);}};
}
for(const engine of ['open-webgal.webgal','webgal-mygo.mygo',undefined])test(String(engine)+' never probes a colliding 3D config',async()=>{
 const f=fixture(engine===undefined?'':engine);await f.compile();
 assert.equal(f.writes[0].expression,'smile');assert.equal(f.writes[0].motion,'idle');
 assert.deepEqual(f.reads,['webgal-engine.json','game/figure/actor/config.json']);assert.deepEqual(f.requests,[]);
 const names=await f.box.webVideoReadModelCharacters('fixture',f.model);
 assert.equal(names.size,0);assert.deepEqual(f.requests,['/games/fixture/webgal-engine.json']);
});
test('unreadable engine metadata preserves Live2D fallback and avoids 3D probes',async()=>{
 const f=fixture(love,{manifestError:true});await f.compile();assert.equal(f.writes[0].expression,'smile');
 assert.equal((await f.box.webVideoReadModelCharacters('fixture',f.model)).size,0);
 assert.ok(!f.reads.some(path=>path.startsWith('game/3d/')));
});
for(const gltf of [null,new Error('HTTP 500'),'{invalid',{}, {components:{}},{components:[{type:'model',role:'head'}]}])test('unsuccessful 3D probe falls back to Live2D: '+String(gltf instanceof Error?gltf.message:JSON.stringify(gltf)),async()=>{
 const f=fixture(love,{gltf});await f.compile();assert.equal(f.writes[0].motion,'idle');assert.equal(f.writes[0].expression,'smile');
 assert.ok(f.reads.includes('game/figure/actor/config.json'));
});
test('LoveLive keeps a valid 3D package ahead of the colliding Live2D name',async()=>{
 const f=fixture();await f.compile();assert.equal(f.writes[0].expression,'3d:face/smile');assert.equal(f.writes[0].motion,'idle');
 assert.ok(!f.reads.includes('game/figure/actor/config.json'));
 assert.deepEqual(Array.from((await f.box.webVideoReadModelCharacters('fixture',f.model)).get('actor/config.json')),['3D actor']);
});
test('LoveLive shared 3D references still resolve Anogo and ID metadata',async()=>{
 const reference='http://127.0.0.1:1234/webvideo-shared/'+'a'.repeat(32)+'/actor/config.json';
 const f=fixture(love,{reference});await f.compile();assert.equal(f.writes[0].expression,'3d:face/smile');
 assert.deepEqual(Array.from((await f.box.webVideoReadModelCharacters('fixture',f.model)).get(reference)),['3D actor']);
});
test('non-config figures need no engine lookup',async()=>{
 const f=fixture(love,{reference:'actor/model.json'});await f.compile();assert.deepEqual(f.reads,['game/figure/actor/model.json']);
 assert.equal((await f.box.webVideoReadModelCharacters('fixture',f.model)).size,0);assert.deepEqual(f.requests,[]);
});
for(const id of ['webgal','mygo','lovelive'])test(id+' frame waits only when glTF is supported',async()=>{
 const events=[],box={__wgProbe:{adapter:{id},core:{gameplay:{pixiStage:{currentApp:{render:()=>events.push('render')}}}}},
  __pwClock:{controller:{runFor:async()=>events.push('clock')}},live2dBindingPending:false,
  __exportWaitForGltf:async()=>events.push('gltf'),document:{getAnimations:()=>[]},__exportMedia:{sync:async()=>events.push('media')},__exportRefreshMouth(){},__exportRecordMouth(){}};
 vm.createContext(box);const render=source('render.js');vm.runInContext(render.slice(render.indexOf('globalThis.__stepExportFrame='),render.indexOf('globalThis.__gpuReadbackRendererScale=')),box);
 await box.__stepExportFrame({t:16,elapsed:16,batch:[],lips:[]});
 assert.deepEqual(events,id==='lovelive'?['gltf','clock','gltf','media','render']:['clock','media','render']);
});
for(const id of ['webgal','mygo','lovelive'])test(id+' stage barrier invokes glTF readiness only for LoveLive',async()=>{
 const box={__wgProbe:{adapter:{id},core:{gameplay:{pixiStage:{backgroundObjects:[],figureObjects:[]}}}}};
 vm.createContext(box);vm.runInContext(source('barrier.js')+'\ninstallStageAssetBarrier();',box);
 let waits=0;box.__exportWaitForGltf=async()=>{waits++;};
 await box.__exportWaitForStageAssets();assert.equal(waits,id==='lovelive'?1:0);
});
