import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=name=>fs.readFileSync(new URL('../browser/'+name,import.meta.url),'utf8');
function harness(planning){
 const box={__nativePlanning:planning};vm.createContext(box);
 vm.runInContext(source('lovelive-export-host.js'),box);return box;
}
test('only planning suppresses recurring glTF drawing',()=>{
 for(const planning of [undefined,false,true]){
  const box=harness(planning);
  assert.equal(box.__webgalOfflineExportHost.shouldRenderGltfFrames(),!planning);
 }
});
test('planning still prepares pending models and propagates loading failures',async()=>{
 const box=harness(true);let prepares=0,ready=false;
 box.__wgProbe={adapter:{id:'lovelive'},core:{gameplay:{pixiStage:{figureObjects:[{
  sourceType:'gltf',pixiContainer:{children:[{}]},gltfRuntime:{
   get isReady(){return ready;},async prepare(){prepares++;ready=true;}
  }
 }]}}},getCharacterLoadingStatus:()=>({phase:ready?'ready':'loading'})};
 box.__pwClock={controller:{_embedder:{performanceNow:()=>0,setTimeout:()=>()=>{}},runFor:async()=>{}}};
 vm.runInContext(source('barrier.js'),box);
 // The native zero-delay wait yields once after preparation.
 box.__pwClock.controller._embedder.setTimeout=(fn,ms)=>{if(ms===2)queueMicrotask(fn);return ()=>{};};
 await box.__exportWaitForGltf();assert.equal(prepares,1);
 assert.equal(box.__webgalOfflineExportHost.shouldRenderGltfFrames(),false);
 ready=false;box.__wgProbe.core.gameplay.pixiStage.figureObjects[0].gltfRuntime.prepare=async()=>{throw Error('bad model');};
 await assert.rejects(box.__exportWaitForGltf(),/bad model/);
 box.__exportGltfFailure=Error('missing motion');
 await assert.rejects(box.__exportWaitForGltf(),/missing motion/);
});
