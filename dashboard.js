let proyectos = [];

function iniciarReloj() {
    const fechaEl = document.getElementById("fechaHeader");
    const horaEl = document.getElementById("horaHeader");
    const actualizar = () => {
        const ahora = new Date();
        if (fechaEl) fechaEl.textContent = ahora.toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
        if (horaEl) horaEl.textContent = ahora.toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
    };
    actualizar();
    setInterval(actualizar, 1000);
}

function formatearUSD(valor) {
    return "USD $" + Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function numeroCompacto(numero) {
    return new Intl.NumberFormat("en-US", { notation:"compact", maximumFractionDigits:1 }).format(numero || 0);
}
function escaparHTML(texto) {
    return String(texto ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function filaSupabaseAProyecto(fila) {
    return { id:fila.id, oportunidad:fila.oportunidad||"", cliente:fila.cliente||"", tipoProyecto:fila.tipo_proyecto||"", fechaSolicitud:fila.fecha_solicitud||"", vendedor:fila.vendedor||"", fechaCotizacion:fila.fecha_cotizacion||"", estatus:fila.estatus||"", fechaGanado:fila.fecha_ganado||"", motivoPerdida:fila.motivo_perdida||"", precioVenta:fila.precio_venta, precioContratista:fila.precio_contratista, monedaContratista:fila.moneda_contratista||"MXN", contratista:fila.contratista||"", tipoCambio:fila.tipo_cambio, margen:fila.margen };
}
async function verificarSesion() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) { window.location.replace("login.html"); return false; }
    return true;
}
async function cargarProyectos() {
    const { data, error } = await supabaseClient.from("proyectos").select("*").order("created_at", { ascending:false });
    if (error) { console.error(error); alert("No se pudieron cargar los proyectos desde Supabase.\n\n" + error.message); return; }
    proyectos = (data || []).map(filaSupabaseAProyecto);
    actualizarDashboard();
}
function datosFechaActual() {
    const hoy = new Date(), anio = hoy.getFullYear(), mes = hoy.getMonth();
    const mesNumero = String(mes + 1).padStart(2,"0");
    const prefijoMes = anio + "-" + mesNumero;
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return { hoy, anio, mes, mesNumero, prefijoMes, ultimoDia };
}
function animarNumero(elemento, valorFinal, opciones={}) {
    if (!elemento) return;
    const { duracion=1200, tipo="numero", decimales=0 } = opciones;
    const final = Number(valorFinal) || 0;
    const reducir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pintar = valor => {
        if (tipo === "usd") elemento.textContent = "USD $" + Number(valor).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
        else if (tipo === "porcentaje") elemento.textContent = Number(valor).toLocaleString("es-MX", { minimumFractionDigits:0, maximumFractionDigits:decimales }) + "%";
        else elemento.textContent = Math.round(Number(valor)).toLocaleString("es-MX");
    };
    if (reducir) { pintar(final); return; }
    const inicio = performance.now();
    const cuadro = ahora => {
        const p = Math.min((ahora - inicio) / duracion, 1);
        const suave = 1 - Math.pow(1 - p, 3);
        pintar(final * suave);
        if (p < 1) requestAnimationFrame(cuadro); else pintar(final);
    };
    pintar(0); requestAnimationFrame(cuadro);
}
function actualizarContador() {
    const el = document.getElementById("contadorProyectos");
    if (el) el.textContent = proyectos.length + (proyectos.length === 1 ? " proyecto registrado" : " proyectos registrados");
}
function actualizarKPIs() {
    const fecha = datosFechaActual();
    const cotizacionesMes = proyectos.filter(p => p.fechaCotizacion && p.fechaCotizacion.startsWith(fecha.prefijoMes));
    const ganadosMes = proyectos.filter(p => p.estatus === "Ganado" && p.fechaGanado && p.fechaGanado.startsWith(fecha.prefijoMes));
    const montoCotizado = cotizacionesMes.reduce((t,p) => t + (Number(p.precioVenta)||0), 0);
    const montoVendido = ganadosMes.reduce((t,p) => t + (Number(p.precioVenta)||0), 0);
    const conversion = montoCotizado > 0 ? (montoVendido / montoCotizado) * 100 : 0;
    animarNumero(document.getElementById("kpiCotizado"), montoCotizado, { tipo:"usd" });
    animarNumero(document.getElementById("kpiVendido"), montoVendido, { tipo:"usd" });
    animarNumero(document.getElementById("kpiCotizaciones"), cotizacionesMes.length, { duracion:900 });
    animarNumero(document.getElementById("kpiConversion"), conversion, { tipo:"porcentaje", decimales:1, duracion:1100 });
    const nombreMes = fecha.hoy.toLocaleDateString("es-MX", { month:"long", year:"numeric" });
    document.getElementById("periodoActual").textContent = "Del 01 al " + String(fecha.ultimoDia).padStart(2,"0") + " de " + nombreMes;
}
function obtenerDatosMensuales() {
    const fecha = datosFechaActual(), montos = new Array(12).fill(0), cantidades = new Array(12).fill(0);
    proyectos.forEach(p => {
        if (!p.fechaCotizacion) return;
        const partes = p.fechaCotizacion.split("-"), anio = Number(partes[0]), mes = Number(partes[1])-1;
        if (anio !== fecha.anio) return;
        cantidades[mes]++; montos[mes] += Number(p.precioVenta)||0;
    });
    return { anio:fecha.anio, montos, cantidades };
}
function crearGrafica(contenedorId, valores, tipo) {
    const contenedor = document.getElementById(contenedorId); contenedor.innerHTML = "";
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const maximo = Math.max(...valores,1);
    valores.forEach((valor,indice) => {
        const columna = document.createElement("div"); columna.className="barra-columna";
        const etiqueta = document.createElement("div"); etiqueta.className="barra-valor";
        if (tipo === "dinero" && valor > 0) etiqueta.textContent = "USD $" + numeroCompacto(valor);
        else if (tipo === "cantidad" && valor > 0) etiqueta.textContent = valor;
        const barra = document.createElement("div"); barra.className = tipo === "cantidad" ? "barra barra-cantidad" : "barra";
        barra.style.height = valor > 0 ? Math.max((valor/maximo)*100,4) + "%" : "2px";
        const mes = document.createElement("div"); mes.className="barra-mes"; mes.textContent=meses[indice];
        columna.append(etiqueta,barra,mes); contenedor.appendChild(columna);
    });
}
function actualizarGraficas() {
    const d=obtenerDatosMensuales(); crearGrafica("graficaMonto",d.montos,"dinero"); crearGrafica("graficaCantidad",d.cantidades,"cantidad");
    document.getElementById("tituloGraficaMonto").textContent="Precio final enviado a Ventas en USD — "+d.anio;
    document.getElementById("tituloGraficaCantidad").textContent="Cotizaciones emitidas por mes — "+d.anio;
}
function obtenerResumenVendedores() {
    const fecha=datosFechaActual(), resumen={};
    proyectos.forEach(p=>{
        const nombre=(p.vendedor||"").trim(); if(!nombre)return;
        if(!resumen[nombre]) resumen[nombre]={vendedor:nombre,cotizaciones:0,montoCotizado:0,ganados:0,montoVendido:0};
        const importe=Number(p.precioVenta)||0;
        if(p.fechaCotizacion&&p.fechaCotizacion.startsWith(fecha.anio+"-")){resumen[nombre].cotizaciones++;resumen[nombre].montoCotizado+=importe;}
        if(p.estatus==="Ganado"&&p.fechaGanado&&p.fechaGanado.startsWith(fecha.anio+"-")){resumen[nombre].ganados++;resumen[nombre].montoVendido+=importe;}
    });
    return Object.values(resumen).sort((a,b)=>b.montoCotizado-a.montoCotizado);
}
function actualizarGraficaVendedores() {
    const contenedor=document.getElementById("graficaVendedores"), resumen=obtenerResumenVendedores(), fecha=datosFechaActual(); contenedor.innerHTML="";
    document.getElementById("periodoGraficaVendedores").textContent="Acumulado del año "+fecha.anio+" — montos de venta expresados en USD";
    if(!resumen.length){contenedor.innerHTML='<div style="text-align:center;padding:30px;color:#68727d;">No existen datos para mostrar.</div>';return;}
    let maximo=1; resumen.forEach(i=>maximo=Math.max(maximo,i.montoCotizado,i.montoVendido));
    resumen.forEach(i=>{const fila=document.createElement("div");fila.className="vendedor-grafica-fila";fila.innerHTML=`<div class="vendedor-grafica-nombre">${escaparHTML(i.vendedor)}</div><div class="vendedor-barras"><div class="vendedor-barra-linea"><div class="vendedor-barra-etiqueta">Cotizado</div><div class="vendedor-barra-fondo"><div class="vendedor-barra-cotizado" style="width:${(i.montoCotizado/maximo)*100}%;"></div></div><div class="vendedor-barra-valor">${formatearUSD(i.montoCotizado)}</div></div><div class="vendedor-barra-linea"><div class="vendedor-barra-etiqueta">Vendido</div><div class="vendedor-barra-fondo"><div class="vendedor-barra-vendido" style="width:${(i.montoVendido/maximo)*100}%;"></div></div><div class="vendedor-barra-valor">${formatearUSD(i.montoVendido)}</div></div></div>`;contenedor.appendChild(fila);});
}
function actualizarTablaVendedores() {
    const tbody=document.getElementById("tablaVendedores"), resumen=obtenerResumenVendedores(), fecha=datosFechaActual(); tbody.innerHTML="";
    if(!resumen.length) tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:25px;">No existen datos para mostrar.</td></tr>';
    resumen.forEach(i=>{const conversion=i.montoCotizado>0?(i.montoVendido/i.montoCotizado)*100:0;const fila=document.createElement("tr");fila.innerHTML=`<td>${escaparHTML(i.vendedor)}</td><td>${i.cotizaciones}</td><td>${formatearUSD(i.montoCotizado)}</td><td>${i.ganados}</td><td>${formatearUSD(i.montoVendido)}</td><td>${conversion.toLocaleString("es-MX",{maximumFractionDigits:1})}%</td>`;tbody.appendChild(fila);});
    document.getElementById("periodoVendedores").textContent="Acumulado del año "+fecha.anio+" — montos expresados en USD";
}

function formatearFecha(fecha) {
    if (!fecha) return "";
    const [a,m,d] = fecha.split("-");
    return `${d}/${m}/${a}`;
}
function formatearNumero(valor) {
    return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function claseEstatus(estado) {
    if (estado === "Abierto") return "estatus-abierto";
    if (estado === "En cotización") return "estatus-cotizacion";
    if (estado === "Ganado") return "estatus-ganado";
    if (estado === "Cerrado") return "estatus-cerrado";
    if (estado === "Perdido") return "estatus-perdido";
    return "";
}
function proyectosFiltrados() {
    const buscar = document.getElementById("buscar");
    const filtroTipo = document.getElementById("filtroTipo");
    const filtroEstatus = document.getElementById("filtroEstatus");
    const filtroVendedor = document.getElementById("filtroVendedor");
    const texto = (buscar?.value || "").toLowerCase().trim();
    return proyectos.filter(p => {
        const coincideTexto = (p.oportunidad||"").toLowerCase().includes(texto) || (p.cliente||"").toLowerCase().includes(texto) || (p.vendedor||"").toLowerCase().includes(texto) || (p.contratista||"").toLowerCase().includes(texto);
        return coincideTexto && (!filtroTipo?.value || p.tipoProyecto === filtroTipo.value) && (!filtroEstatus?.value || p.estatus === filtroEstatus.value) && (!filtroVendedor?.value || p.vendedor === filtroVendedor.value);
    });
}
function actualizarFiltroVendedores() {
    const select = document.getElementById("filtroVendedor");
    if (!select) return;
    const actual = select.value;
    const vendedores = [...new Set(proyectos.map(p => (p.vendedor||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
    select.innerHTML = '<option value="">Todos los vendedores</option>' + vendedores.map(v => `<option value="${escaparHTML(v)}">${escaparHTML(v)}</option>`).join("");
    if (vendedores.includes(actual)) select.value = actual;
}
function mostrarProyectosRegistrados() {
    const cuerpo = document.getElementById("cuerpoTabla");
    if (!cuerpo) return;
    const lista = proyectosFiltrados();
    cuerpo.innerHTML = "";
    if (!lista.length) {
        cuerpo.innerHTML = '<tr><td colspan="16" style="text-align:center;padding:30px;">No hay proyectos para mostrar.</td></tr>';
        return;
    }
    lista.forEach(p => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${escaparHTML(p.oportunidad)}</td><td>${escaparHTML(p.cliente)}</td><td>${escaparHTML(p.tipoProyecto)}</td>
            <td>${formatearFecha(p.fechaSolicitud)}</td><td>${escaparHTML(p.vendedor)}</td><td>${formatearFecha(p.fechaCotizacion)}</td>
            <td><span class="estatus ${claseEstatus(p.estatus)}">${escaparHTML(p.estatus)}</span></td>
            <td>${formatearFecha(p.fechaGanado)}</td><td>${escaparHTML(p.motivoPerdida)}</td><td>USD $${formatearNumero(p.precioVenta)}</td>
            <td class="confidencial">${formatearNumero(p.precioContratista)}</td><td class="confidencial">${escaparHTML(p.monedaContratista)}</td>
            <td class="confidencial">${escaparHTML(p.contratista)}</td><td>${p.tipoCambio ?? ""}</td>
            <td class="confidencial">${p.margen !== null && p.margen !== undefined && p.margen !== "" ? escaparHTML(p.margen)+"%" : ""}</td>
            <td class="acciones-tabla no-print"><button type="button" class="btn btn-azul btn-editar-dashboard" data-id="${escaparHTML(p.id)}">Editar</button> <button type="button" class="btn btn-rojo btn-eliminar-dashboard" data-id="${escaparHTML(p.id)}">Eliminar</button></td>`;
        cuerpo.appendChild(fila);
    });
    document.querySelectorAll(".btn-editar-dashboard").forEach(b => b.addEventListener("click", () => { window.location.href = `proyectos.html?editar=${encodeURIComponent(b.dataset.id)}`; }));
    document.querySelectorAll(".btn-eliminar-dashboard").forEach(b => b.addEventListener("click", () => eliminarProyectoDashboard(b.dataset.id)));
}
async function eliminarProyectoDashboard(id) {
    const p = proyectos.find(x => String(x.id) === String(id));
    if (!p) return;
    if (!confirm(`¿Eliminar el proyecto ${p.oportunidad || p.cliente || "seleccionado"}?`)) return;
    const { error } = await supabaseClient.from("proyectos").delete().eq("id", id);
    if (error) { alert("No se pudo eliminar el proyecto.\n\n" + error.message); return; }
    await cargarProyectos();
}
function prepararReporte(tipo) {
    document.body.classList.toggle("reporte-ventas", tipo === "ventas");
    const titulo = document.getElementById("tituloReporte");
    const datos = document.getElementById("datosReporte");
    if (titulo) titulo.textContent = tipo === "ventas" ? "Reporte de Ventas" : "Reporte de Proyectos";
    if (datos) datos.textContent = `Generado el ${new Date().toLocaleDateString("es-MX")} · ${proyectosFiltrados().length} registros`;
    document.getElementById("modalReporte")?.classList.remove("modal-activo");
    setTimeout(() => window.print(), 80);
}
function configurarInterfazTabla() {
    actualizarFiltroVendedores();
    mostrarProyectosRegistrados();
    ["buscar","filtroTipo","filtroEstatus","filtroVendedor"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener(id === "buscar" ? "input" : "change", mostrarProyectosRegistrados);
    });
    document.getElementById("btnLimpiarFiltros")?.addEventListener("click", () => {
        ["buscar","filtroTipo","filtroEstatus","filtroVendedor"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
        mostrarProyectosRegistrados();
    });
    document.getElementById("btnReporte")?.addEventListener("click", () => document.getElementById("modalReporte")?.classList.add("modal-activo"));
    document.getElementById("btnCerrarModal")?.addEventListener("click", () => document.getElementById("modalReporte")?.classList.remove("modal-activo"));
    document.getElementById("btnReporteVentas")?.addEventListener("click", () => prepararReporte("ventas"));
    document.getElementById("btnReporteProyectos")?.addEventListener("click", () => prepararReporte("proyectos"));
}
function actualizarDashboard(){
    actualizarContador(); actualizarKPIs(); actualizarGraficas(); actualizarGraficaVendedores(); actualizarTablaVendedores();
    actualizarFiltroVendedores(); mostrarProyectosRegistrados();
}
async function iniciar(){
    iniciarReloj();
    configurarInterfazTabla();
    if(await verificarSesion()) await cargarProyectos();
    if (new URLSearchParams(location.search).get("reporte") === "1") document.getElementById("modalReporte")?.classList.add("modal-activo");
}
iniciar();
