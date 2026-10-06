(() => {
const WORLD=5000,zona=document.getElementById("zonaTrabajo"),mundo=document.getElementById("lienzoMundo"),canvas=document.getElementById("canvasDibujo"),ctx=canvas.getContext("2d"),svg=document.getElementById("capaObjetos"),pipeSvg=document.getElementById("capaTuberia"),fittingSvg=document.getElementById("capaAccesorios"),techSvg=document.getElementById("capaTecnica"),canvasFront=document.getElementById("canvasDibujoFrente"),ctxFront=canvasFront.getContext("2d");
const mensaje=document.getElementById("mensajeInicial"),zoomTxt=document.getElementById("textoZoom"),estado=document.getElementById("estadoHerramienta"),reticula=document.getElementById("tipoReticula");
const panel=document.getElementById("panelEscenario"),modal=document.getElementById("modalFondo"),form=document.getElementById("formDimensiones"),modalTitulo=document.getElementById("modalTitulo"),nombre=document.getElementById("nombreElemento"),largo=document.getElementById("dimensionLargo"),ancho=document.getElementById("dimensionAncho"),alto=document.getElementById("dimensionAlto"),labelAlto=document.getElementById("labelDimensionAlto"),btnLock=document.getElementById("btnBloquearEscenario");
const barraSeleccion=document.getElementById("barraSeleccion"),seleccionNombre=document.getElementById("seleccionNombre"),btnEditarObjeto=document.getElementById("btnEditarObjeto"),btnEliminarObjeto=document.getElementById("btnEliminarObjeto");
canvas.width=WORLD;canvas.height=WORLD;canvasFront.width=WORLD;canvasFront.height=WORLD;ctx.lineCap="round";ctx.lineJoin="round";ctxFront.lineCap="round";ctxFront.lineJoin="round";
let v3Drag=null,v3Moved=false;
let tool="pan",scale=1,ox=0,oy=0,pointer=false,lastX=0,lastY=0,current=null,strokes=[],redo=[],objects=[],selectedScene=null,locked=false,dragObj=null,dragStart=null,selectedId=null,editingId=null,penLayer="back",technicalLines=[],measurements=[],technicalStart=null,measureStart=null,pendingMeasure=null,techDir="r",selectedTechnical=null,dragTechnical=null,dragTechnicalStart=null,pipeSegments=[],pipeStart=null,pipeDir="r",selectedPipe=null,dragPipe=null,dragPipeStart=null,fittings=[],selectedFittingType=null,selectedFitting=null,selectedKind=null,universalDrag=null;

const sceneNames={wall:"Pared",floor:"Piso",ceiling:"Techo",column:"Columna",platform:"Plataforma",door:"Puerta",stairs:"Escalera",generic:"Equipo genérico",boiler:"Caldera",tankV:"Tanque vertical",tankH:"Tanque horizontal",exchanger:"Intercambiador",pump:"Bomba"};
function transform(){mundo.style.transform=`translate(${ox}px,${oy}px) scale(${scale})`;zoomTxt.textContent=`${Math.round(scale*100)}%`}
function center(){const r=zona.getBoundingClientRect();scale=1;ox=r.width/2-WORLD/2;oy=r.height/2-WORLD/2;transform()}
function worldPoint(x,y){const r=zona.getBoundingClientRect();return{x:(x-r.left-ox)/scale,y:(y-r.top-oy)/scale}}
function selectTool(t){document.body.classList.toggle("modo-mover",t==="pan");

 tool=t;document.querySelectorAll("[data-tool]").forEach(b=>b.classList.toggle("activa",b.dataset.tool===t));
 zona.classList.toggle("dibujando",["pen","eraser","measure","techline","pipe"].includes(t));
 estado.textContent={pan:"Mover",pen:"Lápiz",eraser:"Borrador",scenario:"Escenario",measure:"Medida",techline:"Línea técnica",pipe:"Tubería",equipment:"Accesorios",bom:"Lista de materiales"}[t]||t;
 if(t==="scenario")panel.classList.remove("oculto");else panel.classList.add("oculto");
 document.getElementById("panelTuberia").classList.toggle("oculto",t!=="pipe");
 document.getElementById("panelAccesorios").classList.toggle("oculto",t!=="equipment");document.getElementById("panelBom").classList.toggle("oculto",t!=="bom");if(t==="bom")renderBom();
 const pt=document.getElementById("panelTecnico");
 pt.classList.toggle("oculto",!(t==="measure"||t==="techline"));
 document.getElementById("contenidoMedida").classList.toggle("oculto",t!=="measure");
 document.getElementById("contenidoLinea").classList.toggle("oculto",t!=="techline");
 document.getElementById("tituloPanelTecnico").textContent=t==="techline"?"Línea técnica":"Medida / Cota";
 technicalStart=null;measureStart=null;pipeStart=null;renderTechnical();renderPipes();
}
document.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));

function drawStroke(s,target){if(!s||!s.puntos.length)return;const c=target||(s.layer==="front"?ctxFront:ctx);c.save();c.globalCompositeOperation=s.tipo==="eraser"?"destination-out":"source-over";c.strokeStyle=s.color||"#173f5f";c.lineWidth=s.ancho;c.beginPath();c.moveTo(s.puntos[0].x,s.puntos[0].y);for(let i=1;i<s.puntos.length;i++)c.lineTo(s.puntos[i].x,s.puntos[i].y);if(s.puntos.length===1)c.lineTo(s.puntos[0].x+.1,s.puntos[0].y+.1);c.stroke();c.restore()}
function updateEmptyState(){mensaje.classList.toggle("oculto",strokes.length>0||objects.length>0||technicalLines.length>0||measurements.length>0||pipeSegments.length>0||fittings.length>0)}
function redraw(){ctx.clearRect(0,0,WORLD,WORLD);ctxFront.clearRect(0,0,WORLD,WORLD);strokes.forEach(s=>drawStroke(s));updateEmptyState()}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function objectMarkup(o){
 const w=o.w,h=o.h,label=esc(o.name);
 const selected=o.id===selectedId;
 let shape="",labelMarkup="";
 if(o.type==="floor"||o.type==="ceiling"){
   const elevation=Number(o.hReal||0);
   const elevationText=`${elevation>=0?"+":""}${elevation.toFixed(2)} m`;
   const y=h/2;
   shape=`<rect class="scene-reference-hitbox" x="-12" y="${y-24}" width="${w+24}" height="48" rx="5"/>
          <line class="scene-reference-line" x1="0" y1="${y}" x2="${w}" y2="${y}"/>
          <line class="scene-reference-tick" x1="0" y1="${y-10}" x2="0" y2="${y+10}"/>
          <line class="scene-reference-tick" x1="${w}" y1="${y-10}" x2="${w}" y2="${y+10}"/>`;
   labelMarkup=`<text class="scene-reference-label" x="8" y="${y-10}">${label}</text>
                <text class="scene-reference-elevation" x="8" y="${y+19}">${o.type==="floor"?"Nivel":"Elevación"} ${elevationText} · Long. ${o.l} m</text>`;
 } else {
   const dims=`${o.l} × ${o.a} × ${o.hReal} m`;
   if(o.type==="tankV") shape=`<ellipse class="scene-shape" cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}"/><line class="scene-detail" x1="${w/2}" y1="0" x2="${w/2}" y2="${h}"/>`;
   else if(o.type==="tankH") shape=`<rect class="scene-shape" x="0" y="${h*.12}" width="${w}" height="${h*.76}" rx="${h*.38}"/><line class="scene-detail" x1="${w*.2}" y1="${h*.12}" x2="${w*.2}" y2="${h*.88}"/><line class="scene-detail" x1="${w*.8}" y1="${h*.12}" x2="${w*.8}" y2="${h*.88}"/>`;
   else if(o.type==="pump") shape=`<circle class="scene-shape" cx="${w*.45}" cy="${h*.5}" r="${Math.min(w,h)*.32}"/><path class="scene-line" d="M${w*.77} ${h*.5} H${w} M${w*.45} ${h*.18} V0"/><circle class="scene-detail" cx="${w*.45}" cy="${h*.5}" r="${Math.min(w,h)*.1}"/>`;
   else if(o.type==="stairs") {let lines="";for(let i=0;i<5;i++)lines+=`<line class="scene-detail" x1="${i*w/5}" y1="${h}" x2="${(i+1)*w/5}" y2="0"/>`;shape=`<rect class="scene-shape" width="${w}" height="${h}"/>${lines}`}
   else if(o.type==="door") shape=`<rect class="scene-shape" width="${w}" height="${h}"/><path class="scene-detail" d="M0 ${h} A${w} ${h} 0 0 1 ${w} 0"/>`;
   else if(o.type==="boiler") shape=`<rect class="scene-shape" width="${w}" height="${h}" rx="8"/><rect class="scene-detail" x="${w*.1}" y="${h*.18}" width="${w*.8}" height="${h*.64}" rx="6"/><circle class="scene-detail" cx="${w*.18}" cy="${h*.5}" r="${Math.min(w,h)*.08}"/>`;
   else if(o.type==="exchanger") shape=`<rect class="scene-shape" width="${w}" height="${h}" rx="${h/2}"/><line class="scene-detail" x1="${w*.15}" y1="${h*.25}" x2="${w*.85}" y2="${h*.25}"/><line class="scene-detail" x1="${w*.15}" y1="${h*.5}" x2="${w*.85}" y2="${h*.5}"/><line class="scene-detail" x1="${w*.15}" y1="${h*.75}" x2="${w*.85}" y2="${h*.75}"/>`;
   else shape=`<rect class="scene-shape" width="${w}" height="${h}" rx="${o.type==="column"?2:5}"/>`;
   labelMarkup=`<text class="scene-label" x="${w/2}" y="${h/2-3}">${label}</text><text class="scene-dims" x="${w/2}" y="${h/2+14}">${dims}</text>`;
 }
 const pad=10;
 return `<g class="scene-object ${locked?"bloqueado":""} ${selected?"seleccionado":""}" data-id="${o.id}" transform="translate(${o.x} ${o.y})">
   ${shape}${labelMarkup}
   <rect class="scene-selection-box" x="${-pad}" y="${-pad}" width="${w+pad*2}" height="${h+pad*2}" rx="5"/>
 </g>`;
}

function updateSelectionBar(){
 const o=objects.find(x=>x.id===selectedId);
 if(!o){barraSeleccion.classList.add("oculto");return}
 seleccionNombre.textContent=o.name;
 btnEditarObjeto.disabled=locked;
 btnEliminarObjeto.disabled=locked;
 barraSeleccion.classList.remove("oculto");
}

function selectObject(id){
 selectedId=id;
 renderObjects();
}

function renderObjects(){
 svg.innerHTML=objects.map(objectMarkup).join("");

 svg.querySelectorAll(".scene-object").forEach(g=>{
   const id=g.dataset.id;

   g.addEventListener("pointerdown",e=>{
     e.preventDefault();
     e.stopPropagation();

     const o=objects.find(x=>x.id===id);
     if(!o)return;

     // Seleccionar sin reconstruir todo el SVG.
     selectedId=id;
     svg.querySelectorAll(".scene-object").forEach(el=>{
       el.classList.toggle("seleccionado",el.dataset.id===id);
     });
     updateSelectionBar();

     if(locked)return;

     dragObj=o;
     const p=worldPoint(e.clientX,e.clientY);
     dragStart={
       dx:p.x-o.x,
       dy:p.y-o.y,
       moved:false
     };

     g.classList.add("arrastrando");
     try{g.setPointerCapture(e.pointerId)}catch(_){}
   });

   g.addEventListener("pointermove",e=>{
     if(!dragObj||dragObj.id!==id||locked)return;

     e.preventDefault();
     const p=worldPoint(e.clientX,e.clientY);
     const nx=p.x-dragStart.dx;
     const ny=p.y-dragStart.dy;

     if(Math.abs(nx-dragObj.x)>0.15||Math.abs(ny-dragObj.y)>0.15){
       dragStart.moved=true;
     }

     // Actualizamos datos y SOLO el transform del objeto.
     // Esto elimina la dilación que provocaba reconstruir todo el SVG.
     dragObj.x=nx;
     dragObj.y=ny;
     g.setAttribute("transform",`translate(${nx} ${ny})`);
   });

   const terminarArrastre=e=>{
     if(!dragObj||dragObj.id!==id)return;
     g.classList.remove("arrastrando");
     try{g.releasePointerCapture(e.pointerId)}catch(_){}
     dragObj=null;
     dragStart=null;
     saveDraft();
     updateSelectionBar();
   };

   g.addEventListener("pointerup",terminarArrastre);
   g.addEventListener("pointercancel",terminarArrastre);
   g.addEventListener("lostpointercapture",()=>{
     if(dragObj&&dragObj.id===id){
       g.classList.remove("arrastrando");
       dragObj=null;
       dragStart=null;
       saveDraft();
     }
   });
 });

 updateSelectionBar();
 redraw();
}

function snapIso(a,b){
 const dx=b.x-a.x,dy=b.y-a.y;
 if(!dx&&!dy)return {...a};
 // Mismos 3 ejes visuales de la retícula: 0°, +60°, -60°.
 const dirs=[
  {x:1,y:0},{x:-1,y:0},
  {x:.5,y:.8660254038},{x:-.5,y:-.8660254038},
  {x:.5,y:-.8660254038},{x:-.5,y:.8660254038}
 ];
 const len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 let best=dirs[0],score=-Infinity;
 dirs.forEach(d=>{const s=ux*d.x+uy*d.y;if(s>score){score=s;best=d}});
 const projected=dx*best.x+dy*best.y;
 return{x:a.x+best.x*projected,y:a.y+best.y*projected};
}
function dirVector(d){
 return ({
  r:[1,0],l:[-1,0],
  ur:[.5,-.8660254038],ul:[-.5,-.8660254038],
  dr:[.5,.8660254038],dl:[-.5,.8660254038],
  u:[0,-1]
 })[d]||[1,0]
}
function renderTechnical(preview){
 let h="";
 technicalLines.forEach((l,i)=>{
  const id=l.id||(l.id=`tl_${Date.now()}_${i}`),mx=(l.a.x+l.b.x)/2,my=(l.a.y+l.b.y)/2;
  h+=`<g class="tech-item ${selectedTechnical===id?"seleccionado":""}" data-tech-id="${id}" data-tech-type="line">
       <line class="tech-hitbox" x1="${l.a.x}" y1="${l.a.y}" x2="${l.b.x}" y2="${l.b.y}"/>
       <line class="tech-line" x1="${l.a.x}" y1="${l.a.y}" x2="${l.b.x}" y2="${l.b.y}"/>
       ${l.meters?`<text class="tech-text" x="${mx}" y="${my-8}">${Number(l.meters).toFixed(2)} m</text>`:""}
      </g>`;
 });
 measurements.forEach((m,i)=>{
  const id=m.id||(m.id=`m_${Date.now()}_${i}`),dx=m.b.x-m.a.x,dy=m.b.y-m.a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,o=18,
  a={x:m.a.x+nx*o,y:m.a.y+ny*o},b={x:m.b.x+nx*o,y:m.b.y+ny*o},mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  h+=`<g class="tech-item ${selectedTechnical===id?"seleccionado":""}" data-tech-id="${id}" data-tech-type="measure">
       <line class="tech-hitbox" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>
       <line class="measure-tick" x1="${m.a.x}" y1="${m.a.y}" x2="${a.x}" y2="${a.y}"/>
       <line class="measure-tick" x1="${m.b.x}" y1="${m.b.y}" x2="${b.x}" y2="${b.y}"/>
       <line class="measure-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>
       <line class="measure-tick" x1="${a.x-nx*7}" y1="${a.y-ny*7}" x2="${a.x+nx*7}" y2="${a.y+ny*7}"/>
       <line class="measure-tick" x1="${b.x-nx*7}" y1="${b.y-ny*7}" x2="${b.x+nx*7}" y2="${b.y+ny*7}"/>
       <text class="measure-text" x="${mx}" y="${my-7}">${Number(m.meters).toFixed(2)} m</text>
      </g>`;
 });
 if(preview)h+=`<line class="tech-preview" x1="${preview.a.x}" y1="${preview.a.y}" x2="${preview.b.x}" y2="${preview.b.y}"/>`;
 techSvg.innerHTML=h;
 bindTechnicalEvents();
 updateTechnicalBar();
}
function getTechnical(id){
 let item=technicalLines.find(x=>x.id===id);if(item)return{item,type:"line"};
 item=measurements.find(x=>x.id===id);return item?{item,type:"measure"}:null;
}
function updateTechnicalBar(){
 const bar=document.getElementById("barraSeleccionTecnica"),found=getTechnical(selectedTechnical);
 if(!found){bar.classList.add("oculto");return}
 document.getElementById("seleccionTecnicaNombre").textContent=found.type==="measure"?"Cota":"Línea técnica";
 bar.classList.remove("oculto");
}
function bindTechnicalEvents(){
 techSvg.querySelectorAll(".tech-item").forEach(g=>{
  g.onpointerdown=e=>{
   if(!["pan","techline","measure"].includes(tool))return;
   e.preventDefault();e.stopPropagation();
   selectedTechnical=g.dataset.techId;selectedKind="technical";selectedPipe=null;selectedFitting=null;selectedId=null;updateGlobalEditBar();selectedId=null;
   const f=getTechnical(selectedTechnical);if(!f)return;
   const p=worldPoint(e.clientX,e.clientY);
   dragTechnical=f.item;dragTechnicalStart={x:p.x,y:p.y,a:{...f.item.a},b:{...f.item.b}};
   g.classList.add("arrastrando");try{g.setPointerCapture(e.pointerId)}catch(_){}
   renderTechnical();
  };
  g.onpointermove=e=>{
   if(!dragTechnical||selectedTechnical!==g.dataset.techId)return;
   const p=worldPoint(e.clientX,e.clientY),dx=p.x-dragTechnicalStart.x,dy=p.y-dragTechnicalStart.y;
   dragTechnical.a={x:dragTechnicalStart.a.x+dx,y:dragTechnicalStart.a.y+dy};
   dragTechnical.b={x:dragTechnicalStart.b.x+dx,y:dragTechnicalStart.b.y+dy};
   renderTechnical();
  };
  g.onpointerup=e=>{if(dragTechnical){dragTechnical=null;dragTechnicalStart=null;saveDraft();renderTechnical()}};
 });
}

function pipeSpec(){
 return{
  diameter:document.getElementById("pipeDiameter").value,
  material:document.getElementById("pipeMaterial").value,
  schedule:document.getElementById("pipeSchedule").value,
  status:document.getElementById("pipeStatus").value
 };
}
function pipeStatusName(s){return s==="existing"?"Existente":s==="remove"?"Retirar":"Nueva"}
function pipeMaterialAbbr(material){
 const m=(material||"").toLowerCase();
 if(m.includes("carb"))return "AC";
 if(m.includes("inox"))return "AI";
 if(m.includes("cobre"))return "Cu";
 if(m.includes("pvc"))return "PVC";
 return (material||"").trim().slice(0,4).toUpperCase()||"MAT";
}
function getPipe(id){return pipeSegments.find(x=>x.id===id)}
function pipeTooltipHtml(p){
 return `<strong>Tubería ${pipeStatusName(p.status)}</strong>
         <div>Ø ${p.diameter} · ${Number(p.meters||0).toFixed(2)} m</div>
         <div class="pipe-meta">${p.material} · Céd. ${p.schedule}</div>`;
}
function showPipeTooltip(p,e){
 const tip=document.getElementById("pipeTooltip");
 tip.innerHTML=pipeTooltipHtml(p);
 tip.classList.remove("oculto");
 const pad=14,w=230,h=82;
 tip.style.left=Math.min(e.clientX+14,window.innerWidth-w-pad)+"px";
 tip.style.top=Math.min(e.clientY+14,window.innerHeight-h-pad)+"px";
}
function hidePipeTooltip(){document.getElementById("pipeTooltip").classList.add("oculto")}
function renderPipes(preview=null){
 let h="";
 pipeSegments.forEach((p,i)=>{
  if(!p.id)p.id=`p_${Date.now()}_${i}`;
  const mx=(p.a.x+p.b.x)/2,my=(p.a.y+p.b.y)/2;
  h+=`<g class="pipe-item pipe-${p.status||"new"} ${selectedPipe===p.id?"seleccionado":""}" data-pipe-id="${p.id}">
      <line class="pipe-hitbox" x1="${p.a.x}" y1="${p.a.y}" x2="${p.b.x}" y2="${p.b.y}"/>
      <line class="pipe-line" x1="${p.a.x}" y1="${p.a.y}" x2="${p.b.x}" y2="${p.b.y}"/>
      ${(()=>{let ang=Math.atan2(p.b.y-p.a.y,p.b.x-p.a.x)*180/Math.PI;if(ang>90||ang<-90)ang+=180;return `<text class="pipe-label" x="${mx}" y="${my-11}" transform="rotate(${ang} ${mx} ${my-11})">${p.diameter} · ${pipeMaterialAbbr(p.material)} · Céd. ${p.schedule} · ${pipeEquipmentLengthM(p.id)>0?`tramo ${Number(p.meters||0).toFixed(2)} m · tubo ${pipeNetMeters(p).toFixed(2)} m`:Number(p.meters||0).toFixed(2)+" m"}</text>`})()}
      <circle class="pipe-joint" cx="${p.a.x}" cy="${p.a.y}" r="4"/>
      <circle class="pipe-joint" cx="${p.b.x}" cy="${p.b.y}" r="4"/>
     </g>`;
 });
 if(preview)h+=`<line class="pipe-preview" x1="${preview.a.x}" y1="${preview.a.y}" x2="${preview.b.x}" y2="${preview.b.y}"/>`;
 pipeSvg.innerHTML=h;
 bindPipeEvents();
 updatePipeBar();
 updateEmptyState();
}
function updatePipeBar(){
 const bar=document.getElementById("barraSeleccionTuberia"),p=getPipe(selectedPipe);
 if(!p){bar.classList.add("oculto");return}
 document.getElementById("seleccionTuberiaNombre").textContent=`Tubería ${p.diameter} · ${pipeStatusName(p.status)}`;
 bar.classList.remove("oculto");
}
function bindPipeEvents(){
 pipeSvg.querySelectorAll(".pipe-item").forEach(g=>{
  const id=g.dataset.pipeId;
  const hit=g.querySelector(".pipe-hitbox");
  if(!hit)return;
  const get=()=>getPipe(id);

  hit.onpointerenter=e=>{
   const p=get(); if(p)showPipeTooltip(p,e);
  };
  hit.onpointerleave=()=>{
   if(!dragPipe)hidePipeTooltip();
  };

  hit.onpointerdown=e=>{
   if(tool!=="pan")return;
   e.preventDefault();e.stopPropagation();

   const p=get(); if(!p)return;

   // Selección universal REAL
   selectedKind="pipe";
   selectedPipe=id;
   selectedFitting=null;
   selectedTechnical=null;
   selectedId=null;

   const wp=worldPoint(e.clientX,e.clientY);
   dragPipe=p;
   dragPipeStart={x:wp.x,y:wp.y,a:{...p.a},b:{...p.b}};

   pipeSvg.querySelectorAll(".pipe-item").forEach(el=>
    el.classList.toggle("seleccionado",el.dataset.pipeId===id)
   );
   updateGlobalEditBar();
   try{hit.setPointerCapture(e.pointerId)}catch(_){}
  };

  hit.onpointermove=e=>{
   const p=get();
   if(p)showPipeTooltip(p,e);
   if(tool!=="pan"||!dragPipe||selectedPipe!==id||!dragPipeStart)return;

   e.preventDefault();e.stopPropagation();
   const wp=worldPoint(e.clientX,e.clientY);
   const dx=wp.x-dragPipeStart.x,dy=wp.y-dragPipeStart.y;
   dragPipe.a={x:dragPipeStart.a.x+dx,y:dragPipeStart.a.y+dy};
   dragPipe.b={x:dragPipeStart.b.x+dx,y:dragPipeStart.b.y+dy};

   g.querySelectorAll(".pipe-hitbox,.pipe-line").forEach(line=>{
    line.setAttribute("x1",dragPipe.a.x);line.setAttribute("y1",dragPipe.a.y);
    line.setAttribute("x2",dragPipe.b.x);line.setAttribute("y2",dragPipe.b.y);
   });
   const circles=g.querySelectorAll(".pipe-joint");
   if(circles[0]){circles[0].setAttribute("cx",dragPipe.a.x);circles[0].setAttribute("cy",dragPipe.a.y)}
   if(circles[1]){circles[1].setAttribute("cx",dragPipe.b.x);circles[1].setAttribute("cy",dragPipe.b.y)}
   const label=g.querySelector(".pipe-label");
   if(label){
    const mx=(dragPipe.a.x+dragPipe.b.x)/2,my=(dragPipe.a.y+dragPipe.b.y)/2-11;
    let ang=Math.atan2(dragPipe.b.y-dragPipe.a.y,dragPipe.b.x-dragPipe.a.x)*180/Math.PI;
    if(ang>90||ang<-90)ang+=180;
    label.setAttribute("x",mx);label.setAttribute("y",my);
    label.setAttribute("transform",`rotate(${ang} ${mx} ${my})`);
   }
  };

  const finish=e=>{
   if(!dragPipe||selectedPipe!==id)return;
   try{hit.releasePointerCapture(e.pointerId)}catch(_){}
   dragPipe=null;dragPipeStart=null;hidePipeTooltip();
   saveDraft();renderPipes();renderFittings();renderBom();updateGlobalEditBar();
  };
  hit.onpointerup=finish;
  hit.onpointercancel=finish;

  hit.onclick=e=>{
   if(tool!=="pan")return;
   e.preventDefault();e.stopPropagation();
   selectedKind="pipe";selectedPipe=id;selectedFitting=null;selectedTechnical=null;selectedId=null;
   renderPipes();updateGlobalEditBar();
  };
 });
}

function fittingById(id){return fittings.find(f=>f.id===id)}
function selectedEntity(){
 if(selectedKind==="pipe"&&selectedPipe)return {kind:"pipe",obj:getPipe(selectedPipe),name:"Tubería"};
 if(selectedKind==="fitting"&&selectedFitting)return {kind:"fitting",obj:fittingById(selectedFitting),name:fittingName(fittingById(selectedFitting)?.type)};
 if(selectedKind==="scenario"&&selectedId)return {kind:"scenario",obj:objects.find(o=>o.id===selectedId),name:objects.find(o=>o.id===selectedId)?.name||"Escenario"};
 if(selectedKind==="technical"&&selectedTechnical){
   let o=technicalLines.find(x=>x.id===selectedTechnical)||measurements.find(x=>x.id===selectedTechnical);
   return {kind:"technical",obj:o,name:o?.type==="measure"?"Cota":"Línea técnica"};
 }
 return null;
}
function updateGlobalEditBar(){
 const bar=document.getElementById("barraEdicionGlobal"),e=selectedEntity();
 if(!e||!e.obj){bar.classList.add("oculto");return}
 document.getElementById("edicionNombre").textContent=e.name;
 bar.classList.remove("oculto");
}
function clearUniversalSelection(){
 selectedKind=null;selectedPipe=null;selectedFitting=null;selectedId=null;selectedTechnical=null;
 updateGlobalEditBar();renderPipes();renderFittings();renderObjects();renderTechnical();
}
function bindFittingEvents(){
 fittingSvg.querySelectorAll(".fitting").forEach(g=>{
   g.onpointerdown=e=>{
     if(tool!=="pan")return;
     e.preventDefault();e.stopPropagation();
     const f=fittingById(g.dataset.fittingId);if(!f)return;
     selectedKind="fitting";selectedFitting=f.id;selectedPipe=null;selectedId=null;selectedTechnical=null;
     universalDrag={kind:"fitting",id:f.id,start:worldPoint(e.clientX,e.clientY),x:f.x,y:f.y};
     try{g.setPointerCapture(e.pointerId)}catch(_){}
     renderFittings();updateGlobalEditBar();
   };
   g.onpointermove=e=>{
     if(!universalDrag||universalDrag.kind!=="fitting"||universalDrag.id!==g.dataset.fittingId)return;
     const f=fittingById(universalDrag.id),p=worldPoint(e.clientX,e.clientY);
     f.x=universalDrag.x+(p.x-universalDrag.start.x);f.y=universalDrag.y+(p.y-universalDrag.start.y);
     g.setAttribute("transform",`translate(${f.x} ${f.y}) rotate(${f.angle||0})`);
   };
   g.onpointerup=e=>{
     if(universalDrag?.kind==="fitting"){universalDrag=null;saveDraft();renderFittings();updateGlobalEditBar()}
   };
 });
}
function duplicateSelected(){
 const e=selectedEntity();if(!e?.obj)return;
 if(e.kind==="pipe"){
   const n=JSON.parse(JSON.stringify(e.obj));n.id=`p_${Date.now()}`;n.a.x+=35;n.a.y+=35;n.b.x+=35;n.b.y+=35;pipeSegments.push(n);selectedPipe=n.id;selectedKind="pipe";renderPipes();
 }else if(e.kind==="fitting"){
   const n=JSON.parse(JSON.stringify(e.obj));n.id=`fit_${Date.now()}`;n.x+=35;n.y+=35;fittings.push(n);selectedFitting=n.id;selectedKind="fitting";renderFittings();
 }else if(e.kind==="scenario"){
   const n=JSON.parse(JSON.stringify(e.obj));n.id=`obj_${Date.now()}`;n.x+=35;n.y+=35;objects.push(n);selectedId=n.id;selectedKind="scenario";renderObjects();
 }else if(e.kind==="technical"){
   const src=technicalLines.includes(e.obj)?technicalLines:measurements,n=JSON.parse(JSON.stringify(e.obj));n.id=`tech_${Date.now()}`;n.a.x+=35;n.a.y+=35;n.b.x+=35;n.b.y+=35;src.push(n);selectedTechnical=n.id;selectedKind="technical";renderTechnical();
 }
 saveDraft();updateGlobalEditBar();
}
function deleteSelected(){
 const e=selectedEntity();if(!e?.obj)return;
 if(!confirm(`¿Eliminar ${e.name}?`))return;
 if(e.kind==="pipe")pipeSegments=pipeSegments.filter(x=>x.id!==e.obj.id);
 if(e.kind==="fitting")fittings=fittings.filter(x=>x.id!==e.obj.id);
 if(e.kind==="scenario")objects=objects.filter(x=>x.id!==e.obj.id);
 if(e.kind==="technical"){technicalLines=technicalLines.filter(x=>x.id!==e.obj.id);measurements=measurements.filter(x=>x.id!==e.obj.id)}
 selectedKind=null;selectedPipe=null;selectedFitting=null;selectedId=null;selectedTechnical=null;
 renderPipes();renderFittings();renderObjects();renderTechnical();renderBom();saveDraft();updateGlobalEditBar();
}
function editSelected(){
 const e=selectedEntity();if(!e?.obj)return;
 if(e.kind==="pipe"){
   const p=e.obj;
   const meters=prompt("Longitud real (m):",Number(p.meters||0).toFixed(2));if(meters===null)return;
   const diameter=prompt('Diámetro (ej. 2"):',p.diameter||'2"');if(diameter===null)return;
   const material=prompt("Material (AC / AI):",pipeMaterialAbbr(p.material||"AC"));if(material===null)return;
   const schedule=prompt("Cédula:",p.schedule||"40");if(schedule===null)return;
   if(Number(meters)>0)p.meters=Number(meters);
   if(diameter.trim())p.diameter=diameter.trim();
   const ma=material.trim().toUpperCase();p.material=ma==="AI"?"Acero inoxidable":ma==="AC"?"Acero al carbón":material.trim();
   if(schedule.trim())p.schedule=schedule.trim();
   renderPipes();renderBom();saveDraft();updateGlobalEditBar();return;
 }
 if(e.kind==="fitting"){
   const f=e.obj,types=["elbow90","elbow45","tee","reducer","flange","valve","trap","strainer","gauge"];
   const names=types.map((t,i)=>`${i+1}. ${fittingName(t)}`).join("\\n");
   const v=prompt(`Tipo de accesorio:\\n${names}\\n\\nEscribe número:`,String(Math.max(1,types.indexOf(f.type)+1)));
   if(v===null)return;const t=types[Number(v)-1];if(t)f.type=t;
   renderFittings();renderBom();saveDraft();updateGlobalEditBar();return;
 }
 if(e.kind==="scenario"){
   const o=e.obj,n=prompt("Nombre:",o.name||"");if(n!==null&&n.trim())o.name=n.trim();
   renderObjects();saveDraft();updateGlobalEditBar();return;
 }
 if(e.kind==="technical"){
   const o=e.obj,m=prompt("Longitud / medida en metros:",Number(o.meters||0).toFixed(2));
   if(m!==null&&Number(m)>0){
     const val=Number(m),dx=o.b.x-o.a.x,dy=o.b.y-o.a.y,L=Math.hypot(dx,dy)||1;o.meters=val;o.b={x:o.a.x+dx/L*val*70,y:o.a.y+dy/L*val*70};
     renderTechnical();saveDraft();updateGlobalEditBar();
   }
 }
}

/* ===================== V3 INTERACTION ENGINE ===================== */
function v3DistToSegment(p,a,b){
 const vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy||1;
 let t=((p.x-a.x)*vx+(p.y-a.y)*vy)/l2;t=Math.max(0,Math.min(1,t));
 const x=a.x+t*vx,y=a.y+t*vy;
 return {d:Math.hypot(p.x-x,p.y-y),x,y,t};
}
function v3HitTest(pt){
 // Accesorios primero: son pequeños y normalmente están encima de tubería.
 let best=null,bestD=Infinity;
 fittings.forEach(f=>{
   const d=Math.hypot(pt.x-f.x,pt.y-f.y);
   if(d<32&&d<bestD){bestD=d;best={kind:"fitting",id:f.id,obj:f}}
 });
 if(best)return best;

 // Tuberías: tolerancia generosa para dedo/Pencil.
 pipeSegments.forEach(p=>{
   const r=v3DistToSegment(pt,p.a,p.b);
   if(r.d<24&&r.d<bestD){bestD=r.d;best={kind:"pipe",id:p.id,obj:p}}
 });
 if(best)return best;

 // Escenario: bounding box simple, suficiente para selección/movimiento.
 for(let i=objects.length-1;i>=0;i--){
   const o=objects[i],w=Number(o.w||120),h=Number(o.h||70);
   if(pt.x>=o.x-w/2&&pt.x<=o.x+w/2&&pt.y>=o.y-h/2&&pt.y<=o.y+h/2)
     return {kind:"scenario",id:o.id,obj:o};
 }

 // Técnicos/cotas.
 const tech=[...technicalLines,...measurements];
 tech.forEach(o=>{
   if(o?.a&&o?.b){
     const r=v3DistToSegment(pt,o.a,o.b);
     if(r.d<20&&r.d<bestD){bestD=r.d;best={kind:"technical",id:o.id,obj:o}}
   }
 });
 return best;
}
function v3Select(hit){
 selectedKind=hit?.kind||null;
 selectedPipe=hit?.kind==="pipe"?hit.id:null;
 selectedFitting=hit?.kind==="fitting"?hit.id:null;
 selectedId=hit?.kind==="scenario"?hit.id:null;
 selectedTechnical=hit?.kind==="technical"?hit.id:null;
 renderPipes();renderFittings();renderObjects();renderTechnical();updateGlobalEditBar();
}
function v3StartDrag(hit,pt){
 if(!hit)return;
 if(hit.kind==="pipe"){
   v3Drag={kind:"pipe",id:hit.id,start:pt,a:{...hit.obj.a},b:{...hit.obj.b}};
 }else if(hit.kind==="fitting"){
   v3Drag={kind:"fitting",id:hit.id,start:pt,x:hit.obj.x,y:hit.obj.y};
 }else if(hit.kind==="scenario"){
   v3Drag={kind:"scenario",id:hit.id,start:pt,x:hit.obj.x,y:hit.obj.y};
 }else if(hit.kind==="technical"){
   v3Drag={kind:"technical",id:hit.id,start:pt,a:{...hit.obj.a},b:{...hit.obj.b}};
 }
 v3Moved=false;
}
function v3MoveDrag(pt){
 if(!v3Drag)return;
 const dx=pt.x-v3Drag.start.x,dy=pt.y-v3Drag.start.y;
 if(Math.hypot(dx,dy)>2)v3Moved=true;
 if(v3Drag.kind==="pipe"){
   const o=getPipe(v3Drag.id);if(!o)return;
   o.a={x:v3Drag.a.x+dx,y:v3Drag.a.y+dy};o.b={x:v3Drag.b.x+dx,y:v3Drag.b.y+dy};
   // Accessories physically attached to this pipe follow it.
   fittings.filter(f=>f.pipeId===o.id).forEach(f=>{
      if(f._v3baseX==null){f._v3baseX=f.x;f._v3baseY=f.y}
      f.x=f._v3baseX+dx;f.y=f._v3baseY+dy;
   });
   renderPipes();renderFittings();
 }else if(v3Drag.kind==="fitting"){
   const o=fittingById(v3Drag.id);if(!o)return;o.x=v3Drag.x+dx;o.y=v3Drag.y+dy;renderFittings();
 }else if(v3Drag.kind==="scenario"){
   const o=objects.find(x=>x.id===v3Drag.id);if(!o)return;o.x=v3Drag.x+dx;o.y=v3Drag.y+dy;renderObjects();
 }else if(v3Drag.kind==="technical"){
   const o=technicalLines.find(x=>x.id===v3Drag.id)||measurements.find(x=>x.id===v3Drag.id);if(!o)return;
   o.a={x:v3Drag.a.x+dx,y:v3Drag.a.y+dy};o.b={x:v3Drag.b.x+dx,y:v3Drag.b.y+dy};renderTechnical();
 }
 updateGlobalEditBar();
}
function v3FinishDrag(){
 if(!v3Drag)return;
 fittings.forEach(f=>{delete f._v3baseX;delete f._v3baseY});
 v3Drag=null;saveDraft();renderBom();updateGlobalEditBar();
}
function initV3Interaction(){
 const ov=document.getElementById("interactionOverlay");if(!ov)return;
 ov.onpointerdown=e=>{
   if(tool!=="pan")return;
   const pt=worldPoint(e.clientX,e.clientY),hit=v3HitTest(pt);
   if(!hit){clearUniversalSelection();return}
   e.preventDefault();e.stopPropagation();v3Select(hit);v3StartDrag(hit,pt);
   ov.classList.add("arrastrando");try{ov.setPointerCapture(e.pointerId)}catch(_){}
 };
 ov.onpointermove=e=>{
   if(tool!=="pan"||!v3Drag)return;
   e.preventDefault();v3MoveDrag(worldPoint(e.clientX,e.clientY));
 };
 const done=e=>{
   if(!v3Drag)return;
   try{ov.releasePointerCapture(e.pointerId)}catch(_){}
   ov.classList.remove("arrastrando");v3FinishDrag();
 };
 ov.onpointerup=done;ov.onpointercancel=done;
}

const SPIRAX_CATALOG=window.SPIRAX_CATALOGO_2026||[];
let selectedRealProduct=null, catalogVisible=[], placingRealEquipment=null;
function esc2(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function normCatalogText(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"")}
function catalogFamilies(){return [...new Set(SPIRAX_CATALOG.map(x=>x.family).filter(Boolean))].sort()}
function catalogMatches(){
 const q=normCatalogText(document.getElementById("realSearch")?.value||"");
 const f=document.getElementById("realFamily")?.value||"";
 return SPIRAX_CATALOG.filter(x=>(!f||x.family===f)&&(!q||normCatalogText(`${x.title} ${x.ti} ${x.family} ${x.sizesText}`).includes(q))).slice(0,250);
}
function currentCatalogProduct(){
 const n=Number(document.getElementById("realProduct")?.value);
 return Number.isInteger(n)&&catalogVisible[n]?catalogVisible[n]:null;
}

function modelFromTitle(p){
 const list=extractModelsStable(p);
 return list[0]||((p?.title||"").split(/\s+/)[0].replace(/[(),]/g,""))||p?.ti||"Producto";
}
function extractModelsStable(p){
 if(!p)return[];
 const raw=`${p.title||""} ${p.sizesText||""}`;
 const out=[],add=v=>{
   v=String(v||"").trim().replace(/^[,;:/-]+|[,;:/-]+$/g,"");
   if(!v||v.length<2||v.length>24)return;
   if(!/[A-Z]/i.test(v)||!/\d/.test(v))return;
   const bad=/^(DN\d+|PN\d+|ANSI\d+|ASME\d+|ISO\d+|EN\d+|BSP|NPT)$/i;
   if(bad.test(v))return;
   if(!out.includes(v))out.push(v);
 };
 // Strongest source: title before descriptive English words.
 const title=String(p.title||"");
 const head=title.split(/\b(?:Thermodynamic|Steam|Trap|Valve|Valves|Pressure|Control|Separator|Strainer|Filter|Pump|Balanced|Stainless|Cast|Iron|Steel|Flanged|Screwed|Sanitary|Ball|Float|with|and)\b/i)[0];
 for(const token of head.split(/[\s,\/]+/))add(token);

 // Product-like codes throughout the documented text.
 for(const m of raw.matchAll(/\b[A-Z]{1,8}[A-Z0-9-]*\d[A-Z0-9-]*\b/g))add(m[0]);

 // Prefer variants sharing the first product root where possible.
 const seed=out[0]||"";
 if(seed){
   const root=(seed.match(/^[A-Z]+/i)||[""])[0].toUpperCase();
   const related=out.filter(x=>x.toUpperCase().startsWith(root));
   if(related.length>1)return related.slice(0,30);
 }
 return out.slice(0,30);
}
function extractSizesStable(p){
 const t=String(p?.sizesText||"").replace(/\s+/g," ");
 const out=[],add=x=>{x=x.trim().replace(/\s+"/g,'"');if(x&&!out.includes(x))out.push(x)};
 // Explicit DN sizes.
 for(const m of t.matchAll(/\bDN\s*(\d+)\b/gi))add("DN"+m[1]);
 // Imperial sizes that actually carry inch marks.
 for(const m of t.matchAll(/(?<![\d.])((?:\d+\s+)?(?:\d+\/\d+)|\d+|¼|⅜|½|¾)\s*"/g))add(m[1]+'"');
 // Unicode fractions sometimes lose the quote in extracted PDF text.
 for(const m of t.matchAll(/(?:^|[\s,(])([¼⅜½¾])(?=\s*(?:,|and|or))/gi))add(m[1]+'"');
 return out.slice(0,24);
}
function extractConnectionsStable(p){
 const t=String(p?.sizesText||"").toUpperCase(),a=[],add=x=>{if(x&&!a.includes(x))a.push(x)};
 if(/\bBSP\b/.test(t))add("BSP");
 if(/\bNPT\b/.test(t))add("NPT");
 if(/SOCKET\s*WELD/.test(t))add("Socket weld");
 if(/BUTT\s*WELD/.test(t))add("Butt weld");
 if(/SANITARY\s*CLAMP|TRI[- ]?CLAMP/.test(t))add("Sanitary clamp");
 if(/TUBE\s*END/.test(t))add("Tube end");
 for(const m of t.matchAll(/\bPN\s*(6|10|16|25|40|63|100)\b/g))add("Brida PN"+m[1]);
 for(const m of t.matchAll(/(?:ASME|ANSI|CLASS)\s*(125|150|250|300|600)\b/g))add("Brida Class "+m[1]);
 if(/FLANG/.test(t)&&!a.some(x=>x.startsWith("Brida")))add("Bridada");
 return a;
}
const VERIFIED_DIMENSIONS={
 "TI-P023-25":{"1 1/4\"":111,"1 1/2\"":111,"2\"":146},
 "TI-P023-07":{"1 1/4\"":111,"1 1/2\"":111,"2\"":166}
};
function documentedAStable(p,size){return Number(VERIFIED_DIMENSIONS[p?.ti]?.[size]||0)}
function fillProductList(){
 catalogVisible=catalogMatches();
 const sel=document.getElementById("realProduct");
 sel.innerHTML=catalogVisible.map((x,i)=>`<option value="${i}">${esc2(x.title)} · ${esc2(x.ti)}</option>`).join("");
 document.getElementById("catalogCount").textContent=`${SPIRAX_CATALOG.length} fichas indexadas · ${catalogVisible.length} resultados`;
 refreshRealConfiguration();
}
function refreshRealConfiguration(){
 const p=currentCatalogProduct();
 const v=document.getElementById("realVariant"),sz=document.getElementById("realSize"),cn=document.getElementById("realConnection");
 if(!p){
   v.innerHTML=sz.innerHTML=cn.innerHTML='<option value="">Sin resultados</option>';
   renderRealProductCard();return;
 }
 const models=extractModelsStable(p),sizes=extractSizesStable(p),conns=extractConnectionsStable(p);
 v.innerHTML=models.length?models.map(x=>`<option value="${esc2(x)}">${esc2(x)}</option>`).join(""):'<option value="">Dato no estructurado</option>';
 sz.innerHTML=sizes.length?sizes.map(x=>`<option value="${esc2(x)}">${esc2(x)}</option>`).join(""):'<option value="">Dato no estructurado</option>';
 cn.innerHTML=conns.length?conns.map(x=>`<option value="${esc2(x)}">${esc2(x)}</option>`).join(""):'<option value="">Dato no estructurado</option>';
 renderRealProductCard();
}
function realProductConfig(){
 const p=currentCatalogProduct();if(!p)return null;
 const model=document.getElementById("realVariant")?.value||"";
 const size=document.getElementById("realSize")?.value||"";
 const connection=document.getElementById("realConnection")?.value||"";
 const A_mm=documentedAStable(p,size);
 return {...p,model,size,connection,A_mm,dimensionVerified:A_mm>0,configurationComplete:!!(model&&size&&connection)};
}
function renderRealProductCard(){
 const p=realProductConfig(),box=document.getElementById("fichaReal"),btn=document.getElementById("btnUsarEquipoReal");
 if(!box||!btn)return;
 if(!p){box.innerHTML='<div class="warn">Sin resultados.</div>';btn.disabled=true;return}
 btn.disabled=!p.configurationComplete;
 const status=p.configurationComplete
   ?'<div class="ok">✓ Modelo, tamaño y conexión listos para colocar.</div>'
   :'<div class="warn">⚠ Esta ficha no tiene tamaño y conexión estructurados con suficiente certeza. No se puede colocar todavía.</div>';
 const dim=p.dimensionVerified
   ?`<div>📐 Longitud física validada: <b>${p.A_mm} mm</b></div>`
   :'<div class="warn">⚠ Longitud física no validada: se puede colocar, pero NO se descontará tubería.</div>';
 box.innerHTML=`<strong>${esc2(p.model)}</strong><div>${esc2(p.title)}</div><div>${esc2(p.ti)} · ${esc2(p.volume)} · pág. PDF ${p.page}</div><div><b>Tamaño:</b> ${esc2(p.size||"—")}</div><div><b>Conexión:</b> ${esc2(p.connection||"—")}</div>${status}${dim}<div class="src">Fuente: Product Handbook Spirax Sarco 2026 · ${esc2(p.ti)}</div>`;
}
function initRealLibrary(){
 const fam=document.getElementById("realFamily");
 fam.innerHTML='<option value="">Todas</option>'+catalogFamilies().map(x=>`<option value="${esc2(x)}">${esc2(x)}</option>`).join("");
 document.getElementById("realSearch").addEventListener("input",fillProductList);
 fam.addEventListener("change",fillProductList);
 document.getElementById("realProduct").addEventListener("change",refreshRealConfiguration);
 document.getElementById("realVariant").addEventListener("change",renderRealProductCard);
 document.getElementById("realSize").addEventListener("change",renderRealProductCard);
 document.getElementById("realConnection").addEventListener("change",renderRealProductCard);
 fillProductList();
}
function openRealLibrary(){document.getElementById("panelBibliotecaReal").classList.remove("oculto");renderRealProductCard()}
function closeRealLibrary(){document.getElementById("panelBibliotecaReal").classList.add("oculto")}
function pipeEquipmentLengthM(pipeId){
 return fittings.filter(f=>f.pipeId===pipeId&&f.realProduct?.A_mm>0).reduce((n,f)=>n+Number(f.realProduct.A_mm)/1000,0);
}
function pipeNetMeters(p){return Math.max(0,Number(p.meters||0)-pipeEquipmentLengthM(p.id))}
function renderBom(){
 const box=document.getElementById("bomContenido");if(!box)return;const pipes={},fits={};
 pipeSegments.filter(p=>p.status==="new").forEach(p=>{const k=`${p.diameter}|${p.material}|${p.schedule}`;if(!pipes[k])pipes[k]={d:p.diameter,m:p.material,s:p.schedule,n:0};pipes[k].n+=pipeNetMeters(p)});
 fittings.forEach(f=>{const s=f.pipeSpec||{};if(s.status&&s.status!=="new")return;const rn=f.realProduct?.title||"";const rz=f.realProduct?.size||"";const k=`${f.type}|${rn}|${rz}|${s.diameter}|${s.material}|${s.schedule}`;if(!fits[k])fits[k]={t:f.type,rn,rz,d:s.diameter||"",m:s.material||"",s:s.schedule||"",n:0};fits[k].n++});
 let h="",pa=Object.values(pipes),fa=Object.values(fits);
 if(pa.length){h+='<div class="bom-section"><h4>TUBERÍA NUEVA</h4>';pa.forEach(x=>h+=`<div class="bom-row"><span><strong>${x.d}</strong> · ${pipeMaterialAbbr(x.m)} · Céd. ${x.s}</span><b>${x.n.toFixed(2)} m</b></div>`);h+='</div>'}
 if(fa.length){h+='<div class="bom-section"><h4>ACCESORIOS</h4>';fa.forEach(x=>h+=`<div class="bom-row"><span><strong>${x.rn||fittingName(x.t)}</strong>${x.rz?` · ${x.rz}`:""} · ${x.d} · ${pipeMaterialAbbr(x.m)} · Céd. ${x.s}</span><b>${x.n} pza${x.n===1?"":"s"}</b></div>`);h+='</div>'}
 if(!pa.length&&!fa.length)h='<div class="bom-empty">Todavía no hay elementos nuevos para contabilizar.</div>';
 h+='<div class="bom-note">Solo se contabilizan elementos marcados como Nueva.</div>';box.innerHTML=h;
}
function fittingName(t){return({elbow90:"Codo 90°",elbow45:"Codo 45°",tee:"Tee",reducer:"Reducción",flange:"Brida",valve:"Válvula",trap:"Trampa",strainer:"Filtro Y",gauge:"Manómetro",separator:"Separador",real:"Equipo Spirax"})[t]||t}
function nearestPipePoint(pt){
 let best=null,dist=Infinity;
 pipeSegments.forEach(p=>{
  const vx=p.b.x-p.a.x,vy=p.b.y-p.a.y,l2=vx*vx+vy*vy||1;
  let t=((pt.x-p.a.x)*vx+(pt.y-p.a.y)*vy)/l2;t=Math.max(0,Math.min(1,t));
  const x=p.a.x+t*vx,y=p.a.y+t*vy,d=Math.hypot(pt.x-x,pt.y-y);
  if(d<dist){dist=d;best={pipe:p,x,y,angle:Math.atan2(vy,vx)*180/Math.PI}}
 });
 return dist<=45?best:null;
}


function shortRealEquipmentLabel(f){
 const p=f?.realProduct||{};
 const model=String(p.model||p.title||"Equipo").trim();
 const size=String(p.size||"").trim();
 return size?`${model} · ${size}`:model;
}
function realEquipmentSymbol(f){
 const p=f.realProduct||{}, model=String(p.model||p.title||"").toUpperCase();
 const family=String(p.family||"").toUpperCase();
 const title=String(p.title||"").toUpperCase();
 const all=`${model} ${family} ${title}`;

 // Separador: cuerpo vertical con drenaje inferior.
 if(/SEPARATOR|SEPARADOR|\bS1\b|\bS2\b|\bS3\b|\bS5\b|\bS6\b|\bS7\b|\bS8\b|\bS12\b|\bS13\b/.test(all))
   return `<g class="real-symbol separator"><path d="M-18 0H-9 M9 0H18"/><rect x="-9" y="-15" width="18" height="30" rx="8"/><path d="M0 15V25 M-5 25H5"/></g>`;

 // Filtro/strainer: Y clásico.
 if(/STRAINER|FILTER|FILTRO/.test(all))
   return `<g class="real-symbol strainer"><path d="M-20 0H20 M-7 0L7 14 M3 14H12"/></g>`;

 // Trampa termodinámica TD.
 if(/\bTD\d|THERMODYNAMIC/.test(all))
   return `<g class="real-symbol tdtrap"><path d="M-20 0H-11 M11 0H20"/><circle cx="0" cy="0" r="11"/><path d="M-7 -3H7 M-7 3H7"/></g>`;

 // Trampa de boya / FT.
 if(/\bFT[A-Z0-9]*\d|BALL FLOAT|FLOAT STEAM TRAP/.test(all))
   return `<g class="real-symbol floattrap"><path d="M-20 0H-13 M13 0H20"/><rect x="-13" y="-11" width="26" height="22" rx="5"/><circle cx="2" cy="1" r="5"/><path d="M-8 7L-2 3"/></g>`;

 // Otras trampas/purgadores.
 if(/STEAM TRAP|TRAP|PURGADOR/.test(all))
   return `<g class="real-symbol trap"><path d="M-20 0H-11 M11 0H20"/><path d="M-11 -10H11V10H-11Z M-7 -6L7 6 M7 -6L-7 6"/></g>`;

 // Reguladoras / control.
 if(/CONTROL VALVE|REGULAT|PRESSURE REDUC|25P|VALVE|VÁLVULA/.test(all))
   return `<g class="real-symbol valve"><path d="M-22 0H-12 M12 0H22"/><path d="M-12 -10L0 0L-12 10Z M12 -10L0 0L12 10Z"/><path d="M0 -1V-16 M-6 -16H6"/></g>`;

 // Manómetros / instrumentos / transmisores.
 if(/GAUGE|MANOM|TRANSMIT|SENSOR|INSTRUMENT/.test(all))
   return `<g class="real-symbol instrument"><path d="M-18 0H-10 M10 0H18"/><circle cx="0" cy="0" r="10"/><path d="M0 0L5 -5"/></g>`;

 // Medición de flujo.
 if(/FLOWMETER|FLOW METER|TVA|VORTEX|ORIFICE/.test(all))
   return `<g class="real-symbol flow"><path d="M-20 0H-10 M10 0H20"/><circle cx="0" cy="0" r="10"/><path d="M-5 5L5 -5 M1 -5H5V-1"/></g>`;

 // Bomba.
 if(/PUMP|BOMBA/.test(all))
   return `<g class="real-symbol pump"><path d="M-20 0H-12 M12 0H20"/><circle cx="0" cy="0" r="12"/><path d="M-6 7L7 0L-6 -7Z"/></g>`;

 // Intercambiador.
 if(/HEAT EXCHANGER|EXCHANGER|INTERCAMBIADOR/.test(all))
   return `<g class="real-symbol exchanger"><path d="M-22 0H-13 M13 0H22"/><circle cx="0" cy="0" r="13"/><path d="M-8 -8L8 8 M8 -8L-8 8"/></g>`;

 // Respaldo: equipo real aún sin símbolo DTI específico.
 return `<g class="real-symbol generic"><path d="M-20 0H-13 M13 0H20"/><rect x="-13" y="-10" width="26" height="20" rx="3"/><path d="M-7 0H7"/></g>`;
}
function renderFittings(){
 let h="";
 fittings.forEach(f=>{
  const p=f.pipeSpec||{},label=fittingName(f.type),a=f.angle||0;
  let symbol="";
  if(f.type==="valve")symbol=`<path class="fitting-symbol" d="M -13 -9 L 0 0 L -13 9 Z M 13 -9 L 0 0 L 13 9 Z"/>`;
  else if(f.type==="flange")symbol=`<line class="fitting-symbol" x1="-5" y1="-13" x2="-5" y2="13"/><line class="fitting-symbol" x1="5" y1="-13" x2="5" y2="13"/>`;
  else if(f.type==="reducer")symbol=`<path class="fitting-symbol" d="M -15 -9 L 15 -4 L 15 4 L -15 9 Z"/>`;
  else if(f.type==="tee")symbol=`<path class="fitting-symbol" d="M -14 0 L 14 0 M 0 0 L 0 -18"/>`;
  else if(f.type==="elbow90")symbol=`<path class="fitting-symbol" d="M -14 0 L 0 0 L 0 -16"/>`;
  else if(f.type==="elbow45")symbol=`<path class="fitting-symbol" d="M -14 0 L 0 0 L 12 -12"/>`;
  else if(f.type==="strainer")symbol=`<path class="fitting-symbol" d="M -13 0 L 13 0 M 0 0 L 10 14"/><text class="fitting-text" x="10" y="25">Y</text>`;
  else if(f.type==="gauge")symbol=`<line class="fitting-symbol" x1="0" y1="0" x2="0" y2="-12"/><circle class="fitting-symbol" cx="0" cy="-23" r="10"/>`;
  else if(f.type==="separator")symbol=`<path class="fitting-symbol" d="M -16 0 L -8 0 L -8 -15 Q 0 -22 8 -15 L 8 0 L 16 0 M 0 0 L 0 16 M -8 -7 L 8 -7"/>`;
  else if(f.type==="real")symbol=realEquipmentSymbol(f);else symbol=`<rect class="fitting-symbol" x="-11" y="-9" width="22" height="18" rx="3"/>`;
  if(f.realProduct)symbol+=`<text class="real-equipment-label" x="0" y="-28" text-anchor="middle" transform="rotate(${-a})">${shortRealEquipmentLabel(f)}${f.realProduct.A_mm?` · A ${f.realProduct.A_mm} mm`:``}</text>`;
  h+=`<g class="fitting ${selectedFitting===f.id?"seleccionado":""}" data-fitting-id="${f.id}" transform="translate(${f.x} ${f.y}) rotate(${a})"><circle class="fitting-hit" cx="0" cy="0" r="25"/>${symbol}</g>`;
 });
 fittingSvg.innerHTML=h;bindFittingEvents();updateEmptyState();
}
function addPipe(a,b,meters){
 const spec=pipeSpec();
 pipeSegments.push({id:`p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,a:{...a},b:{...b},meters,...spec});
 selectedPipe=null;renderPipes();saveDraft();
}


function beginRealEquipmentPlacement(config){
 placingRealEquipment=JSON.parse(JSON.stringify(config));
 selectedRealProduct=placingRealEquipment;
 selectedFittingType="real";
 closeRealLibrary();
 selectTool("equipment");
 document.body.classList.add("colocando-equipo-real");
 document.getElementById("estadoAccesorio").textContent=`${config.model} · ${config.size} · ${config.connection} listo · TOCA LA TUBERÍA`;
}
function finishRealEquipmentPlacement(){
 placingRealEquipment=null;
 document.body.classList.remove("colocando-equipo-real");
}
document.addEventListener("pointerdown",e=>{
 if(!placingRealEquipment)return;
 const r=zona.getBoundingClientRect();
 if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
 if(e.target.closest?.(".sidebar,.topbar,.panel-escenario,.panel-tecnico,.panel-biblioteca-real,.modal-fondo,.controles-zoom,.barra-seleccion,.barra-edicion-global"))return;
 e.preventDefault();e.stopPropagation();
 const pt=worldPoint(e.clientX,e.clientY),near=nearestPipePoint(pt);
 if(!near){
   document.getElementById("estadoAccesorio").textContent="No detecté tubería ahí. Toca directamente la línea azul.";
   return;
 }
 const p=near.pipe,rp=JSON.parse(JSON.stringify(placingRealEquipment));
 fittings.push({id:`fit_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:"real",x:near.x,y:near.y,angle:near.angle,pipeId:p.id,pipeSpec:{diameter:p.diameter,material:p.material,schedule:p.schedule,status:p.status},realProduct:rp});
 renderFittings();renderPipes();renderBom();saveDraft();
 document.getElementById("estadoAccesorio").textContent=`✓ ${rp.model} · ${rp.size} · ${rp.connection} COLOCADO`;
 finishRealEquipmentPlacement();
},true);

zona.addEventListener("pointerdown",e=>{
 if(e.target.closest?.(".panel-escenario,.panel-tecnico,.modal-fondo,.controles-zoom,.barra-seleccion"))return;
 if(e.target.closest?.(".tech-item,.pipe-item") && tool!=="equipment")return;
 if(tool==="equipment")return;
 if(tool==="pipe"){
  const p=worldPoint(e.clientX,e.clientY),mode=document.getElementById("pipeMode").value;
  if(mode==="length"){
   const m=Math.max(.01,+document.getElementById("pipeLength").value||1),v=dirVector(pipeDir),px=m*70;
   const start=pipeStart?{...pipeStart}:p,b={x:start.x+v[0]*px,y:start.y+v[1]*px};
   addPipe(start,b,m);pipeStart={...b};
   document.getElementById("estadoTuberia").textContent=`${m.toFixed(2)} m agregados · continúa desde la punta`;
  }else if(!pipeStart){
   pipeStart=p;document.getElementById("estadoTuberia").textContent="Inicio listo · marca el final";renderPipes({a:p,b:p});
  }else{
   const b=snapIso(pipeStart,p),m=Math.max(.01,Math.hypot(b.x-pipeStart.x,b.y-pipeStart.y)/70);
   addPipe(pipeStart,b,m);pipeStart={...b};
   document.getElementById("estadoTuberia").textContent=`${m.toFixed(2)} m · continúa desde la punta`;
  }
  return;
 }
 if(tool==="measure"){
  const p=worldPoint(e.clientX,e.clientY);
  if(!measureStart){measureStart=p;document.getElementById("estadoMedida").textContent="Punto A listo · marca punto B";renderTechnical({a:p,b:p})}
  else{const b=snapIso(measureStart,p);pendingMeasure={a:measureStart,b};document.getElementById("valorMedida").value=Math.max(.01,Math.hypot(b.x-measureStart.x,b.y-measureStart.y)/70).toFixed(2);document.getElementById("modalMedida").classList.remove("oculto")}
  return;
 }
 if(tool==="techline"){
  const p=worldPoint(e.clientX,e.clientY),mode=document.getElementById("modoLinea").value;
  if(mode==="length"){const m=Math.max(.01,+document.getElementById("longitudLinea").value||1),v=dirVector(techDir),px=m*70,b={x:p.x+v[0]*px,y:p.y+v[1]*px};technicalLines.push({id:`tl_${Date.now()}`,a:p,b,meters:m});renderTechnical();saveDraft();document.getElementById("estadoLinea").textContent=`${m.toFixed(2)} m agregados`}
  else if(!technicalStart){technicalStart=p;document.getElementById("estadoLinea").textContent="Inicio listo · marca el final";renderTechnical({a:p,b:p})}
  else{const b=snapIso(technicalStart,p);technicalLines.push({id:`tl_${Date.now()}`,a:technicalStart,b});technicalStart=b;renderTechnical();saveDraft();document.getElementById("estadoLinea").textContent="Continúa desde la punta"}
  return;
 }
 if(e.target===canvas||e.target===svg||e.target===pipeSvg||e.target===techSvg||e.target===mundo){selectedId=null;selectedTechnical=null;selectedPipe=null;renderObjects();renderTechnical();renderPipes()}
 if(tool==="scenario")return;pointer=true;lastX=e.clientX;lastY=e.clientY;if(tool==="pan"){zona.classList.add("arrastrando");return}if(tool==="pen"||tool==="eraser"){current={tipo:tool,color:"#173f5f",ancho:tool==="eraser"?34:3.2,layer:penLayer,puntos:[worldPoint(e.clientX,e.clientY)]};redo=[];mensaje.classList.add("oculto")}
});
zona.addEventListener("pointermove",e=>{
 if(tool==="pipe"&&pipeStart&&document.getElementById("pipeMode").value==="assisted"){renderPipes({a:pipeStart,b:snapIso(pipeStart,worldPoint(e.clientX,e.clientY))});return}
 if(tool==="measure"&&measureStart){renderTechnical({a:measureStart,b:snapIso(measureStart,worldPoint(e.clientX,e.clientY))});return}
 if(tool==="techline"&&technicalStart&&document.getElementById("modoLinea").value==="assisted"){renderTechnical({a:technicalStart,b:snapIso(technicalStart,worldPoint(e.clientX,e.clientY))});return}
 if(!pointer)return;if(tool==="pan"){ox+=e.clientX-lastX;oy+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;transform()}else if(current){current.puntos.push(worldPoint(e.clientX,e.clientY));redraw();drawStroke(current,current.layer==="front"?ctxFront:ctx)}
});
function end(){if(!pointer)return;pointer=false;zona.classList.remove("arrastrando");if(current){strokes.push(current);current=null;redraw()}}
zona.addEventListener("pointerup",end);zona.addEventListener("pointercancel",end);
zona.addEventListener("wheel",e=>{e.preventDefault();const r=zona.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,wx=(mx-ox)/scale,wy=(my-oy)/scale,ns=Math.min(2.5,Math.max(.35,scale*(e.deltaY<0?1.1:.9)));ox=mx-wx*ns;oy=my-wy*ns;scale=ns;transform()},{passive:false});
function zoom(f){const r=zona.getBoundingClientRect(),cx=r.width/2,cy=r.height/2,wx=(cx-ox)/scale,wy=(cy-oy)/scale,ns=Math.min(2.5,Math.max(.35,scale*f));ox=cx-wx*ns;oy=cy-wy*ns;scale=ns;transform()}
const btnLapizAtras=document.getElementById("btnLapizAtras"),btnLapizAdelante=document.getElementById("btnLapizAdelante");
function setPenLayer(layer){penLayer=layer;btnLapizAtras.classList.toggle("activa",layer==="back");btnLapizAdelante.classList.toggle("activa",layer==="front");localStorage.setItem("pizarra_pen_layer",layer)}
btnLapizAtras.onclick=()=>setPenLayer("back");
btnLapizAdelante.onclick=()=>setPenLayer("front");
setPenLayer(localStorage.getItem("pizarra_pen_layer")==="front"?"front":"back");




document.getElementById("edicionCerrar").onclick=clearUniversalSelection;
document.getElementById("edicionEliminar").onclick=deleteSelected;
document.getElementById("edicionDuplicar").onclick=duplicateSelected;
document.getElementById("edicionEditar").onclick=editSelected;
document.getElementById("edicionMover").onclick=()=>{selectTool("pan");};
document.getElementById("cerrarPanelBom").onclick=()=>selectTool("pan");document.getElementById("cerrarPanelAccesorios").onclick=()=>selectTool("pan");
document.querySelectorAll("[data-fitting]").forEach(b=>b.onclick=()=>{
 selectedFittingType=b.dataset.fitting;
 document.querySelectorAll("[data-fitting]").forEach(x=>x.classList.toggle("seleccionado",x===b));
 if(selectedFittingType==="spirax"){selectedFittingType=null;openRealLibrary();return}
 selectedRealProduct=null;document.getElementById("estadoAccesorio").textContent=`${fittingName(selectedFittingType)} listo · toca una tubería`;
});
document.getElementById("cerrarPanelTuberia").onclick=()=>selectTool("pan");
const pipeMode=document.getElementById("pipeMode");
pipeMode.onchange=()=>{
 const byLength=pipeMode.value==="length";
 document.getElementById("pipeLengthMode").classList.toggle("oculto",!byLength);
 document.getElementById("pipeAssistedHelp").classList.toggle("oculto",byLength);
 pipeStart=null;renderPipes();document.getElementById("estadoTuberia").textContent="Esperando punto inicial";
};
document.querySelectorAll("[data-pipe-dir]").forEach(b=>b.onclick=()=>{
 pipeDir=b.dataset.pipeDir;
 document.querySelectorAll("[data-pipe-dir]").forEach(x=>x.classList.toggle("activa",x===b));
});
document.getElementById("btnEliminarTuberia").onclick=()=>{
 const p=getPipe(selectedPipe);if(!p)return;
 if(confirm(`¿Eliminar este tramo de tubería ${p.diameter}?`)){
  pipeSegments=pipeSegments.filter(x=>x.id!==selectedPipe);selectedPipe=null;renderPipes();saveDraft();
 }
};
document.getElementById("btnEditarTuberia").onclick=()=>{
 const p=getPipe(selectedPipe);if(!p)return;
 const m=prompt("Longitud real en metros:",Number(p.meters).toFixed(2));if(m===null)return;
 const meters=Number(m);if(!(meters>0))return;
 const dia=prompt('Diámetro (ej. 2"):',p.diameter);if(dia===null)return;
 const mat=prompt("Material:",p.material);if(mat===null)return;
 const sch=prompt("Cédula:",p.schedule);if(sch===null)return;
 const status=prompt("Estado: Nueva / Existente / Retirar",pipeStatusName(p.status));if(status===null)return;
 const dx=p.b.x-p.a.x,dy=p.b.y-p.a.y,L=Math.hypot(dx,dy)||1;
 p.meters=meters;p.diameter=dia.trim()||p.diameter;p.material=mat.trim()||p.material;p.schedule=sch.trim()||p.schedule;
 p.status=/exist/i.test(status)?"existing":/ret/i.test(status)?"remove":"new";
 p.b={x:p.a.x+dx/L*meters*70,y:p.a.y+dy/L*meters*70};
 selectedPipe=p.id;renderPipes();saveDraft();
};
document.getElementById("btnEliminarTecnico").onclick=()=>{
 const f=getTechnical(selectedTechnical);if(!f)return;
 if(confirm(`¿Eliminar ${f.type==="measure"?"esta cota":"esta línea técnica"}?`)){
  if(f.type==="measure")measurements=measurements.filter(x=>x.id!==selectedTechnical);
  else technicalLines=technicalLines.filter(x=>x.id!==selectedTechnical);
  selectedTechnical=null;renderTechnical();saveDraft();
 }
};
document.getElementById("btnEditarTecnico").onclick=()=>{
 const f=getTechnical(selectedTechnical);if(!f)return;
 if(f.type==="measure"){
  const v=prompt("Medida real en metros:",Number(f.item.meters).toFixed(2));
  if(v!==null&&Number(v)>0){f.item.meters=Number(v);renderTechnical();saveDraft()}
 }else{
  const current=f.item.meters||Math.hypot(f.item.b.x-f.item.a.x,f.item.b.y-f.item.a.y)/70;
  const v=prompt("Longitud en metros:",Number(current).toFixed(2));
  if(v!==null&&Number(v)>0){
   const dx=f.item.b.x-f.item.a.x,dy=f.item.b.y-f.item.a.y,L=Math.hypot(dx,dy)||1,m=Number(v);
   f.item.meters=m;f.item.b={x:f.item.a.x+dx/L*m*70,y:f.item.a.y+dy/L*m*70};
   renderTechnical();saveDraft();
  }
 }
};
document.getElementById("cerrarPanelTecnico").onclick=()=>selectTool("pan");
const modoLinea=document.getElementById("modoLinea");
modoLinea.onchange=()=>{const m=modoLinea.value==="length";document.getElementById("modoLongitud").classList.toggle("oculto",!m);document.getElementById("ayudaAsistida").classList.toggle("oculto",m);technicalStart=null;renderTechnical()};
document.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>{techDir=b.dataset.dir;document.querySelectorAll("[data-dir]").forEach(x=>x.classList.toggle("activa",x===b))});
const modalMedida=document.getElementById("modalMedida");
function cancelarCota(){modalMedida.classList.add("oculto");pendingMeasure=null;measureStart=null;renderTechnical();document.getElementById("estadoMedida").textContent="Esperando punto A"}
document.getElementById("cerrarModalMedida").onclick=cancelarCota;document.getElementById("cancelarMedida").onclick=cancelarCota;
document.getElementById("formMedida").onsubmit=e=>{e.preventDefault();if(!pendingMeasure)return;const m=Math.max(.01,+document.getElementById("valorMedida").value||0);measurements.push({id:`m_${Date.now()}`,a:pendingMeasure.a,b:pendingMeasure.b,meters:m});modalMedida.classList.add("oculto");pendingMeasure=null;measureStart=null;renderTechnical();saveDraft();document.getElementById("estadoMedida").textContent=`Cota ${m.toFixed(2)} m agregada · marca otro punto A`};
document.getElementById("btnZoomMas").onclick=()=>zoom(1.15);document.getElementById("btnZoomMenos").onclick=()=>zoom(.85);document.getElementById("btnCentrar").onclick=center;
document.getElementById("btnDeshacer").onclick=()=>{if(strokes.length){redo.push(strokes.pop());redraw()}};
document.getElementById("btnRehacer").onclick=()=>{if(redo.length){strokes.push(redo.pop());redraw()}};
document.getElementById("btnLimpiar").onclick=()=>{if(confirm("¿Quieres limpiar la pizarra completa?")){strokes=[];objects=[];technicalLines=[];measurements=[];pipeSegments=[];fittings=[];redo=[];selectedId=null;selectedPipe=null;renderObjects();renderTechnical();renderPipes();renderFittings();saveDraft()}};

document.getElementById("cerrarEscenario").onclick=()=>{panel.classList.add("oculto");selectTool("pan")};
function configureModal(type, object=null){
 selectedScene=type;
 editingId=object?.id||null;
 const isReference=type==="floor"||type==="ceiling";
 modalTitulo.textContent=editingId?`Editar ${sceneNames[type]}`:`Insertar ${sceneNames[type]}`;
 nombre.value=object?.name||sceneNames[type];

 const defaults={wall:[5,.2,3],floor:[5,1,0],ceiling:[5,1,6],column:[.5,.5,3],platform:[3,2,1],door:[1,.2,2.1],stairs:[3,1.2,2],generic:[2,1.5,2],boiler:[4,2,3],tankV:[2,2,4],tankH:[4,2,2],exchanger:[3,1,1],pump:[1.2,.8,.8]}[type]||[2,2,2];

 largo.value=object?.l??defaults[0];
 ancho.value=object?.a??defaults[1];
 alto.value=object?.hReal??defaults[2];

 document.querySelector('label[for="dimensionAncho"]');
 ancho.closest("label").style.display=isReference?"none":"flex";
 labelAlto.textContent=isReference?(type==="floor"?"Nivel / elevación (m)":"Altura / elevación (m)"):"Alto (m)";
 modal.classList.remove("oculto");
}

document.querySelectorAll("[data-scene]").forEach(b=>b.onclick=()=>configureModal(b.dataset.scene));

document.getElementById("cerrarModal").onclick=()=>{modal.classList.add("oculto");editingId=null};
document.getElementById("cancelarElemento").onclick=()=>{modal.classList.add("oculto");editingId=null};

btnEditarObjeto.onclick=()=>{
 if(locked)return;
 const o=objects.find(x=>x.id===selectedId);
 if(o)configureModal(o.type,o);
};

btnEliminarObjeto.onclick=()=>{
 if(locked)return;
 const o=objects.find(x=>x.id===selectedId);
 if(!o)return;
 if(confirm(`¿Eliminar "${o.name}" del escenario?`)){
   objects=objects.filter(x=>x.id!==selectedId);
   selectedId=null;
   renderObjects();
   saveDraft();
 }
};

form.onsubmit=e=>{
 e.preventDefault();
 const l=Math.max(.1,+largo.value||1);
 const isReference=selectedScene==="floor"||selectedScene==="ceiling";
 const a=isReference?1:Math.max(.1,+ancho.value||1);
 const hR=isReference?(Number(alto.value)||0):Math.max(.1,+alto.value||1);

 let w,h;
 if(isReference){
   w=Math.max(140,Math.min(700,l*70));
   h=60;
 }else{
   const maxDim=Math.max(l,a),factor=Math.min(80,Math.max(32,260/maxDim));
   w=Math.max(70,l*factor);
   h=Math.max(55,a*factor);
 }

 if(editingId){
   const o=objects.find(x=>x.id===editingId);
   if(o)Object.assign(o,{name:nombre.value.trim()||sceneNames[selectedScene],l,a,hReal:hR,w,h});
 }else{
   const r=zona.getBoundingClientRect(),centerW=worldPoint(r.left+r.width/2,r.top+r.height/2);
   const id=`obj_${Date.now()}`;
   objects.push({id,type:selectedScene,name:nombre.value.trim()||sceneNames[selectedScene],l,a,hReal:hR,w,h,x:centerW.x-w/2,y:centerW.y-h/2});
   selectedId=id;
 }

 modal.classList.add("oculto");
 editingId=null;
 renderObjects();
 saveDraft();
};
btnLock.onclick=()=>{
 locked=!locked;
 dragObj=null;
 dragStart=null;
 btnLock.textContent=locked?"🔒 Escenario bloqueado":"🔓 Escenario desbloqueado";
 renderObjects();
 saveDraft();
};

function applyGrid(t){mundo.classList.remove("ret-isometrica","ret-cuadricula","ret-lisa");mundo.classList.add(`ret-${t}`);localStorage.setItem("pizarra_tipo_reticula",t)}
reticula.onchange=()=>applyGrid(reticula.value);
function saveDraft(){localStorage.setItem("pizarra_levantamiento_borrador",JSON.stringify({version:4,fecha:new Date().toISOString(),strokes,objects,technicalLines,measurements,pipeSegments,fittings,locked}))}
document.getElementById("btnGuardar").onclick=()=>{saveDraft();const b=document.getElementById("btnGuardar"),t=b.textContent;b.textContent="Guardado ✓";setTimeout(()=>b.textContent=t,1200)};
function load(){try{const d=JSON.parse(localStorage.getItem("pizarra_levantamiento_borrador")||"null");if(!d)return;if(Array.isArray(d.strokes))strokes=d.strokes;if(Array.isArray(d.trazos)&&!d.strokes)strokes=d.trazos;if(Array.isArray(d.objects))objects=d.objects;if(Array.isArray(d.technicalLines))technicalLines=d.technicalLines;if(Array.isArray(d.measurements))measurements=d.measurements;if(Array.isArray(d.pipeSegments))pipeSegments=d.pipeSegments;if(Array.isArray(d.fittings))fittings=d.fittings;locked=!!d.locked;btnLock.textContent=locked?"🔒 Escenario bloqueado":"🔓 Escenario desbloqueado"}catch(e){}}
const savedGrid=localStorage.getItem("pizarra_tipo_reticula")||"isometrica";reticula.value=["isometrica","cuadricula","lisa"].includes(savedGrid)?savedGrid:"isometrica";applyGrid(reticula.value);center();load();renderObjects();renderTechnical();renderPipes();renderFittings();redraw();selectTool("pan");initV3Interaction();
initRealLibrary();
document.getElementById("cerrarBibliotecaReal").onclick=(e)=>{e.preventDefault();e.stopPropagation();closeRealLibrary()};
document.getElementById("btnUsarEquipoReal").onclick=()=>{
 const p=realProductConfig();
 if(!p||!p.configurationComplete)return;
 beginRealEquipmentPlacement(p);
};
})();
