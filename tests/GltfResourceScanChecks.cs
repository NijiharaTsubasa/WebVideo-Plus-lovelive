using System;
using System.IO;
using System.Linq;
using System.Reflection;
using NativeVideo;
namespace NativeVideo {
 public static class LayerExport {
  public static void WriteTransparentImage(string path){throw new InvalidOperationException("Timing image generation is outside resource preflight tests");}
 }
}

// Production scanner tests only. No WebView2, renderer, or real export is exercised.
public static class GltfResourceScanChecks {
 static int checks;
 static void Check(bool ok,string message){if(!ok)throw new Exception(message);checks++;}
 static void Put(string root,string path,string text){Files.Atomic(Path.Combine(root,path),text);}
 static void Glb(string root,string path,string shader=null){
  var file=Path.Combine(root,path);Directory.CreateDirectory(Path.GetDirectoryName(file));
  var text=J.Text(J.O("materials",new[]{J.O("extras",J.O("shader",shader??""))}));
  while(text.Length%4!=0)text+=" ";var bytes=System.Text.Encoding.UTF8.GetBytes(text);
  using(var writer=new BinaryWriter(File.Create(file))){writer.Write(0x46546c67u);writer.Write(2u);writer.Write(20+bytes.Length);writer.Write(bytes.Length);writer.Write(0x4e4f534au);writer.Write(bytes);}
 }
 static object Model(string role,string model,string motion="",string profile="",object[] behaviors=null){return J.O("type","model","role",role,"model",model,"defaultMotion",motion,"renderProfile",profile,"behaviors",behaviors??new object[0]);}
 static void Pack(string project,string name,params object[] models){Put(project,"game/3d/figure/"+name+"/config.json",J.Text(J.O("components",models)));}
 static object Scan(string project,string reference,SharedAssets shared=null){
  var ctor=typeof(EngineAdapter).GetConstructors(BindingFlags.Instance|BindingFlags.NonPublic).Single();
  var adapter=(EngineAdapter)ctor.Invoke(new object[]{"lovelive","0.2.0",project,"unused.js","unit-test",false,false,null});
  var assets=new ProjectAssets(project,project+"-snapshot-"+Guid.NewGuid().ToString("N"),project,"changeFigure:"+reference+";",null,adapter){Shared=shared};
  return assets.Scan(J.O("sentenceList",new[]{J.O("commandRaw","changeFigure","command",1,"content",reference)}));
 }
 static void Bad(string project,string reference,string reason,SharedAssets shared=null){var report=Scan(project,reference,shared);Check(J.A(J.Get(report,"issues")).Any(i=>J.S(i,"message").Contains(reason)),"Missing diagnosis: "+reason+" "+J.Text(report));}
 static void Good(string project,string reference){var report=Scan(project,reference);Check(J.A(J.Get(report,"issues")).Count==0,"Unexpected issue: "+J.Text(report));}
 public static int Run(){
  string home=Path.Combine(Path.GetTempPath(),"webvideo-gltf-scan-"+Guid.NewGuid().ToString("N")),project=Path.Combine(home,"project");
  Directory.CreateDirectory(project);
  try{
   Pack(project,"actor",Model("body","mesh.glb"));
   Bad(project,"actor/config.json","找不到 3D 模型");
   Glb(project,"game/3d/figure/actor/mesh.glb");Good(project,"actor/config.json");
   Pack(project,"actor",Model("body","mesh.glb","idle.motionbin"));Bad(project,"actor/config.json","找不到默认动作");
   Put(project,"game/3d/motion/idle.motionbin","fixture");Good(project,"actor/config.json");
   Pack(project,"actor",Model("body","mesh.glb","./missing.motionbin"));Bad(project,"actor/config.json","找不到默认动作");
   Pack(project,"actor",Model("body","../../../../outside.glb"));Bad(project,"actor/config.json","找不到 3D 模型");
   Pack(project,"actor",Model("body","mesh.glb","","missing-profile"));Bad(project,"actor/config.json","render-profile:missing-profile");
   Pack(project,"actor",Model("body","mesh.glb","","",new[]{J.O("name","test.required")}));Bad(project,"actor/config.json","behavior:test.required");
   Pack(project,"actor",Model("body","mesh.glb","","",new[]{J.O("name","test.optional","required",false)}));Good(project,"actor/config.json");
   Glb(project,"game/3d/figure/actor/mesh.glb","missing-shader");Bad(project,"actor/config.json","shader:missing-shader");
   Glb(project,"game/3d/figure/actor/mesh.glb");
   Pack(project,"head",Model("head","head.glb","ignored.motionbin"),Model("body","missing.glb"));
   Glb(project,"game/3d/figure/head/head.glb");Good(project,"head/config.json+actor/config.json");
   Pack(project,"actor",Model("body","mesh.glb","","missing-profile"));Bad(project,"head/config.json+actor/config.json","render-profile:missing-profile");
   Pack(project,"actor",Model("head","mesh.glb"));Bad(project,"head/config.json+actor/config.json","缺少所需组件");
   Pack(project,"actor",Model("body","mesh.glb","","good-profile"));
   Put(project,"game/3d/runtime/index.json","{\"packages\":[\"package.json\"]}");
   Put(project,"game/3d/runtime/package.json","{\"components\":[{\"type\":\"render-profile\",\"name\":\"good-profile\",\"script\":\"good.js\"}]}");
   Bad(project,"actor/config.json","render-profile:good-profile");
   Put(project,"game/3d/runtime/good.js","fixture");Good(project,"actor/config.json");
   string library=Path.Combine(home,"library");
   Put(library,"pair/config.json",J.Text(J.O("components",new[]{Model("head","head.glb"),Model("body","body.glb","missing.motionbin")})));
   Glb(library,"pair/head.glb");Glb(library,"pair/body.glb");
   var shared=new SharedAssets(Path.Combine(home,"shared.json"),project);
   var id=J.S(shared.Add(library,"all","fixture"),"id");
   string sharedReference="__shared/"+id+"/pair/config.json";
   Bad(project,sharedReference,"找不到默认动作",shared);
   Put(project,"game/3d/motion/missing.motionbin","local fallback");
   var copyAdapter=(EngineAdapter)typeof(EngineAdapter).GetConstructors(BindingFlags.Instance|BindingFlags.NonPublic).Single().Invoke(new object[]{"lovelive","0.2.0",project,"unused.js","unit-test",false,false,null});
   var copyAssets=new ProjectAssets(project,Path.Combine(home,"copy-stage"),project,"",null,copyAdapter){Shared=shared};
   copyAssets.CollectShared("figure",sharedReference);
   var pending=(System.Collections.Generic.Dictionary<string,string>)typeof(ProjectAssets).GetField("copies",BindingFlags.Instance|BindingFlags.NonPublic).GetValue(copyAssets);
   Check(!pending.Values.Contains(Files.Full(Path.Combine(project,"game/3d/motion/missing.motionbin"))),"Validation-only fallback must not enter the copy set");
   copyAssets.CopyShared();
   Check(!File.Exists(Path.Combine(home,"copy-stage/game/3d/motion/missing.motionbin")),"Validation-only fallback must not be copied into a shared package");
   Check(File.Exists(Path.Combine(home,"copy-stage/game/3d/figure",sharedReference)),"Shared package copy accepts an existing project default motion fallback");
   var selected=Scan(project,sharedReference+"+actor/config.json",shared);
   Check(J.A(J.Get(selected,"issues")).Count==0,"Unselected shared body must not require its missing motion");
   // The runner supplies a real junction fixture, avoiding symlink privilege requirements.
   string junction=Environment.GetEnvironmentVariable("WEBVIDEO_GLTF_JUNCTION");
   if(!string.IsNullOrEmpty(junction)){
    bool rejected=false;try{SharedAssets.FilesWithoutLinks(Path.GetDirectoryName(junction),junction).ToArray();}catch(IOException){rejected=true;}
    Check(rejected,"Recursive traversal must reject a junction before enumerating its target");
    Pack(junction,"linked",Model("body","mesh.glb"));Glb(junction,"game/3d/figure/linked/mesh.glb");
    Bad(junction,"linked/config.json","实体素材文件夹");
   }
   return checks;
  }finally{if(Directory.Exists(home))Directory.Delete(home,true);}
 }
}
