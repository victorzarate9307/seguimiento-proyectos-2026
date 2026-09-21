let proyectoEditando = null;
let totalProyectos = 0;

const $ = id => document.getElementById(id);
const formulario = $("formProyecto");
const oportunidad=$("oportunidad"), cliente=$("cliente"), tipoProyecto=$("tipoProyecto"), fechaSolicitud=$("fechaSolicitud"), vendedor=$("vendedor"), fechaCotizacion=$("fechaCotizacion"), estatus=$("estatus"), fechaGanado=$("fechaGanado"), motivoPerdida=$("motivoPerdida"), precioVenta=$("precioVenta"), precioContratista=$("precioContratista"), monedaContratista=$("monedaContratista"), contratista=$("contratista"), tipoCambio=$("tipoCambio"), margen=$("margen");
const btnGuardar=$("btnGuardar"), btnEditar=$("btnEditar"), btnLimpiar=$("btnLimpiar");

function iniciarReloj(){
    const actualizar=()=>{const ahora=new Date(); $("fechaHeader").textContent=ahora.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); $("horaHeader").textContent=ahora.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit"});};
    actualizar(); setInterval(actualizar,1000);
}
function textoONull(v){const x=String(v??"").trim(); return x||null;}
function numeroONull(v){return v===""||v===null||v===undefined?null:Number(v);}
function fechaONull(v){return v||null;}
async function verificarSesion(){const {data,error}=await supabaseClient.auth.getSession(); if(error||!data.session){location.replace("login.html");return false;} return true;}
function leerFormulario(){return {oportunidad:textoONull(oportunidad.value),cliente:textoONull(cliente.value),tipo_proyecto:textoONull(tipoProyecto.value),fecha_solicitud:fechaONull(fechaSolicitud.value),vendedor:textoONull(vendedor.value),fecha_cotizacion:fechaONull(fechaCotizacion.value),estatus:textoONull(estatus.value),fecha_ganado:estatus.value==="Ganado"?fechaONull(fechaGanado.value):null,motivo_perdida:estatus.value==="Perdido"?textoONull(motivoPerdida.value):null,precio_venta:numeroONull(precioVenta.value),precio_contratista:numeroONull(precioContratista.value),moneda_contratista:textoONull(monedaContratista.value),contratista:textoONull(contratista.value),tipo_cambio:numeroONull(tipoCambio.value),margen:numeroONull(margen.value),updated_at:new Date().toISOString()};}
function actualizarCamposEstatus(){ $("contenedorFechaGanado").classList.toggle("oculto",estatus.value!=="Ganado"); $("contenedorMotivoPerdida").classList.toggle("oculto",estatus.value!=="Perdido"); }
function limpiarFormulario(){formulario.reset(); monedaContratista.value="MXN"; proyectoEditando=null; btnGuardar.disabled=false; btnEditar.disabled=true; $("tituloFormulario").textContent="Nuevo proyecto"; actualizarCamposEstatus(); history.replaceState({},"","proyectos.html");}
async function actualizarContador(){const {count,error}=await supabaseClient.from("proyectos").select("id",{count:"exact",head:true}); if(!error){totalProyectos=count||0; $("contadorProyectos").textContent=totalProyectos+(totalProyectos===1?" proyecto registrado":" proyectos registrados");}}
async function cargarParaEditar(id){
    const {data,error}=await supabaseClient.from("proyectos").select("*").eq("id",id).single();
    if(error||!data){alert("No se pudo cargar el proyecto para editar."); return;}
    proyectoEditando=id; oportunidad.value=data.oportunidad||""; cliente.value=data.cliente||""; tipoProyecto.value=data.tipo_proyecto||""; fechaSolicitud.value=data.fecha_solicitud||""; vendedor.value=data.vendedor||""; fechaCotizacion.value=data.fecha_cotizacion||""; estatus.value=data.estatus||""; fechaGanado.value=data.fecha_ganado||""; motivoPerdida.value=data.motivo_perdida||""; precioVenta.value=data.precio_venta??""; precioContratista.value=data.precio_contratista??""; monedaContratista.value=data.moneda_contratista||"MXN"; contratista.value=data.contratista||""; tipoCambio.value=data.tipo_cambio??""; margen.value=data.margen??"";
    $("tituloFormulario").textContent="Editar proyecto"; btnGuardar.disabled=true; btnEditar.disabled=false; actualizarCamposEstatus(); window.scrollTo({top:0,behavior:"smooth"});
}
estatus.addEventListener("change",actualizarCamposEstatus);
btnLimpiar.addEventListener("click",limpiarFormulario);
formulario.addEventListener("submit",async e=>{e.preventDefault(); btnGuardar.disabled=true; const original=btnGuardar.textContent; btnGuardar.textContent="Guardando..."; const {error}=await supabaseClient.from("proyectos").insert(leerFormulario()); if(error){alert("No se pudo guardar el proyecto.\n\n"+error.message); btnGuardar.disabled=false; btnGuardar.textContent=original; return;} btnGuardar.textContent=original; limpiarFormulario(); await actualizarContador(); alert("Proyecto guardado correctamente.");});
btnEditar.addEventListener("click",async()=>{if(!proyectoEditando)return; btnEditar.disabled=true; const original=btnEditar.textContent; btnEditar.textContent="Guardando..."; const {error}=await supabaseClient.from("proyectos").update(leerFormulario()).eq("id",proyectoEditando); if(error){alert("No se pudieron guardar los cambios.\n\n"+error.message); btnEditar.disabled=false; btnEditar.textContent=original; return;} btnEditar.textContent=original; limpiarFormulario(); await actualizarContador(); alert("Cambios guardados correctamente."); location.href="index.html#proyectosRegistrados";});
async function iniciar(){iniciarReloj(); if(!(await verificarSesion()))return; await actualizarContador(); const id=new URLSearchParams(location.search).get("editar"); if(id) await cargarParaEditar(id); actualizarCamposEstatus();}
iniciar();
