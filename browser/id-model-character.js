/* Resolve the displayed character from the same model config that Terre uses. */
function webVideoModelCharacter(config){
 const models=Array.isArray(config?.components)?config.components.filter(component=>component?.type==='model'):[];
 if(!models?.length)return null;
 const heads=models.filter(model=>model.role==='head');
 const integrated=models.filter(model=>model.role==='integrated');
 const model=heads.length===1?heads[0]:integrated.length===1?integrated[0]:null;
 if(!model)return [];
 const yohane=/^(?:CH|EN)_([a-z]+)_/i.exec(model.name||'');
 if(model.group==='yohane'&&yohane){
  const names={chika:'千歌',riko:'梨子',kanan:'果南',dia:'黛雅',you:'曜',yohane:'夜羽',hanamaru:'花丸',mari:'鞠莉',ruby:'露比'};
  const name=names[yohane[1].toLowerCase()];
  const boss=/^EN_|_inv$/i.test(model.name);
  return name?[(boss?'暗夜恶魔 ':'幻日夜羽 ')+name]:[];
 }
 const description=typeof model.description==='string'?model.description:'';
 if(model.group==='garupa'||model.group==='garupa-michelle'){
  const code=/^(\d{3})_cos_/i.exec(model.name||'');
  const character=code&&webVideoGarupaCharacters[Number(code[1])];
  if(character)return [character];
  return [...description.matchAll(/[（(]([^（）()]+)[）)]/g)].map(match=>match[1]);
 }
 if(model.group==='hasunosora')return description.split('_').map(part=>part.replace(/[（(].*$/,''));
 return [description.split(/[\/／]/,1)[0]];
}

const webVideoGarupaCharacters={
 "1": "户山香澄",
 "2": "花园多惠",
 "3": "牛込里美",
 "4": "山吹沙绫",
 "5": "市谷有咲",
 "6": "美竹兰",
 "7": "青叶摩卡",
 "8": "上原绯玛丽",
 "9": "宇田川巴",
 "10": "羽泽鸫",
 "11": "弦卷心",
 "12": "濑田薰",
 "13": "北泽育美",
 "14": "松原花音",
 "15": "米歇尔",
 "16": "丸山彩",
 "17": "冰川日菜",
 "18": "白鹭千圣",
 "19": "大和麻弥",
 "20": "若宫伊芙",
 "21": "凑友希那",
 "22": "冰川纱夜",
 "23": "今井莉莎",
 "24": "宇田川亚子",
 "25": "白金燐子",
 "26": "仓田真白",
 "27": "桐谷透子",
 "28": "广町七深",
 "29": "二叶筑紫",
 "30": "八潮瑠唯",
 "31": "和奏瑞依",
 "32": "朝日六花",
 "33": "佐藤益木",
 "34": "鳰原令王那",
 "35": "珠手知由",
 "36": "高松灯",
 "37": "千早爱音",
 "38": "要乐奈",
 "39": "长崎素世",
 "40": "椎名立希",
 "601": "奥泽美咲"
};

async function webVideoReadModelCharacters(game,model){
 const references=[...new Set(model.statements.filter(row=>row.command==='changeFigure').map(row=>row.content))];
 const names=new Map();
 async function read(reference){
  const path=reference?.split(/(?<=config\.json)\+/)[0];
  if(!path?.endsWith('/config.json')&&path!=='config.json')return;
  const parts=path.split('/');
  if(parts.some(part=>!part||part==='.'||part==='..'||/[:\\]/.test(part)))return;
  const response=await fetch('/games/'+encodeURIComponent(game)+'/game/3d/figure/'+parts.map(encodeURIComponent).join('/'),{signal:AbortSignal.timeout(5000)}).catch(()=>null);
  if(!response?.ok)return;
  const character=webVideoModelCharacter(await response.json().catch(()=>null));
  if(character)names.set(reference,character);
 }
 for(let start=0;start<references.length;start+=8){
  await Promise.all(references.slice(start,start+8).map(read));
 }
 return names;
}
