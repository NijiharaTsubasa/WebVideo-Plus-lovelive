globalThis.__exportWaitForGltf=async()=>{
  const probe=globalThis.__wgProbe,stage=probe?.core?.gameplay?.pixiStage;
  if(!stage||probe.adapter.id!=='lovelive')return;
  const embed=globalThis.__pwClock?.controller?._embedder;
  const realNow=()=>embed.performanceNow();
  const start=realNow(),timeoutMs=120000;
  while(true){
    if(globalThis.__exportGltfFailure)throw new Error('glTF角色加载失败：'+String(globalThis.__exportGltfFailure?.message||globalThis.__exportGltfFailure));
    const status=probe.getCharacterLoadingStatus();
    if(status?.phase==='error')throw new Error('glTF角色准备失败：'+String(status.error?.message||status.error));
    const figures=(stage.figureObjects||[]).filter(object=>object.sourceType==='gltf');
    if(status?.phase!=='loading'&&figures.every(object=>object.gltfRuntime?.isReady&&object.pixiContainer?.children?.length)){
      // A motion/expression command is a Promise queue even with cached inputs.
      return;
    }
    for(const object of figures){
      const runtime=object.gltfRuntime;
      if(runtime&&!runtime.isReady){
        let cancel=()=>{};
        const deadline=new Promise((_,reject)=>{cancel=embed.setTimeout(()=>reject(new Error('glTF角色准备超时：'+object.key)),Math.max(1,timeoutMs-(realNow()-start)));});
        try{await Promise.race([runtime.prepare(),deadline]);}finally{cancel();}
      }
    }
    if(realNow()-start>timeoutMs)throw new Error('glTF角色准备超时：'+figures.filter(object=>!object.gltfRuntime?.isReady).map(object=>object.key).join(', '));
    await new Promise(resolve=>embed.setTimeout(resolve,2));
    await globalThis.__pwClock.controller.runFor(0);
  }
};

function installStageAssetBarrier() {
 globalThis.__exportWaitForStageAssets=async()=>{
  await __exportWaitForGltf();
  const stage=__wgProbe.core.gameplay.pixiStage;
  const missing=()=>[...stage.backgroundObjects,...stage.figureObjects].filter(object=>{
   if(!object.sourceUrl)return false;
   const children=object.pixiContainer?.children||[];
   if(!children.length)return true;
   const url=decodeURIComponent(new URL(object.sourceUrl,location.href).pathname);
   const expected=globalThis.__nativeAggregateCounts?.[url];
   return expected&&(children.length<expected||children.some(model=>!model.visible||!model.internalModel));
  });
  await Promise.resolve();
  if(!missing().length)return;
  await new Promise((resolve,reject)=>{
   const timer=__pwClock.controller._embedder.setTimeout;
   let cancelPoll=()=>{},finished=false;
   const cancelTimeout=timer(()=>{
    finished=true;cancelPoll();reject(Error('舞台素材或聚合模型加载超时：'+missing().map(x=>x.key+' ('+x.sourceUrl+')').join(', ')));
   },20000);
   const check=async()=>{
    try{await __pwClock.controller.runFor(0);}catch(error){finished=true;cancelTimeout();reject(error);return;}
    if(finished)return;
    if(!missing().length){finished=true;cancelTimeout();resolve();}else cancelPoll=timer(check,2);
   };
   check();
  });
 };
}
