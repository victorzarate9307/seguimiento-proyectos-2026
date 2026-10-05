let proyectoEditando = null;
let totalProyectos = 0;

let usuarioActual = null;
let estatusOriginal = null;
let fechaCierreOriginal = null;

const $ = id => document.getElementById(id);

const formulario = $("formProyecto");

const oportunidad = $("oportunidad");
const cliente = $("cliente");
const tipoProyecto = $("tipoProyecto");
const fechaSolicitud = $("fechaSolicitud");
const vendedor = $("vendedor");
const fechaEnvioTarea = $("fechaEnvioTarea");
const fechaCotizacion = $("fechaCotizacion");
const estatus = $("estatus");
const fechaGanado = $("fechaGanado");
const motivoPerdida = $("motivoPerdida");
const precioVenta = $("precioVenta");
const precioContratista = $("precioContratista");
const monedaContratista = $("monedaContratista");
const contratista = $("contratista");
const tipoCambio = $("tipoCambio");
const margen = $("margen");

const btnGuardar = $("btnGuardar");
const btnEditar = $("btnEditar");
const btnLimpiar = $("btnLimpiar");


/* =========================================================
   RELOJ
   ========================================================= */

function iniciarReloj() {

    const actualizar = () => {

        const ahora = new Date();

        $("fechaHeader").textContent =
            ahora.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });

        $("horaHeader").textContent =
            ahora.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
    };

    actualizar();

    setInterval(actualizar, 1000);
}


/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function textoONull(valor) {

    const texto = String(valor ?? "").trim();

    return texto || null;
}


function numeroONull(valor) {

    if (
        valor === "" ||
        valor === null ||
        valor === undefined
    ) {
        return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
}


function fechaONull(valor) {

    return valor || null;
}


function fechaHoyISO() {

    const hoy = new Date();

    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}


function esEstatusTerminal(valor) {

    return [
        "Ganado",
        "Cerrado",
        "Perdido"
    ].includes(valor);
}


/* =========================================================
   SESIÓN
   ========================================================= */

async function verificarSesion() {

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error || !data.session) {

        location.replace("login.html");

        return false;
    }

    usuarioActual = data.session.user;

    return true;
}


/* =========================================================
   FECHA DE CIERRE
   ========================================================= */

function calcularFechaCierre() {

    const estadoActual = estatus.value;

    /*
       ABIERTO / EN COTIZACIÓN
       No existe cierre.
    */

    if (!esEstatusTerminal(estadoActual)) {

        return null;
    }


    /*
       GANADO
       La fecha de cierre será la fecha de venta/ganado.
    */

    if (estadoActual === "Ganado") {

        if (fechaGanado.value) {

            return fechaGanado.value;
        }

        /*
           Si estamos editando un proyecto que ya estaba
           terminado, conservamos su cierre anterior.
        */

        if (
            proyectoEditando &&
            esEstatusTerminal(estatusOriginal) &&
            fechaCierreOriginal
        ) {

            return fechaCierreOriginal;
        }

        return fechaHoyISO();
    }


    /*
       CERRADO / PERDIDO

       Si el proyecto ya estaba terminado,
       conservamos la fecha de cierre que tenía.
    */

    if (
        proyectoEditando &&
        esEstatusTerminal(estatusOriginal) &&
        fechaCierreOriginal
    ) {

        return fechaCierreOriginal;
    }


    /*
       Si acaba de pasar de activo a Cerrado/Perdido,
       se registra automáticamente la fecha de hoy.
    */

    return fechaHoyISO();
}


/* =========================================================
   LEER FORMULARIO
   ========================================================= */

function leerFormulario() {

    return {

        oportunidad:
            textoONull(oportunidad.value),

        cliente:
            textoONull(cliente.value),

        tipo_proyecto:
            textoONull(tipoProyecto.value),

        fecha_solicitud:
            fechaONull(fechaSolicitud.value),

        vendedor:
            textoONull(vendedor.value),

        fecha_envio_tarea:
            fechaONull(fechaEnvioTarea.value),

        fecha_cotizacion:
            fechaONull(fechaCotizacion.value),

        estatus:
            textoONull(estatus.value),

        fecha_ganado:
            estatus.value === "Ganado"
                ? fechaONull(fechaGanado.value)
                : null,

        fecha_cierre:
            calcularFechaCierre(),

        motivo_perdida:
            estatus.value === "Perdido"
                ? textoONull(motivoPerdida.value)
                : null,

        precio_venta:
            numeroONull(precioVenta.value),

        precio_contratista:
            numeroONull(precioContratista.value),

        moneda_contratista:
            textoONull(monedaContratista.value),

        contratista:
            textoONull(contratista.value),

        tipo_cambio:
            numeroONull(tipoCambio.value),

        margen:
            numeroONull(margen.value),

        updated_at:
            new Date().toISOString()
    };
}


/* =========================================================
   CAMPOS SEGÚN ESTATUS
   ========================================================= */

function actualizarCamposEstatus() {

    const estado = estatus.value;

    $("contenedorFechaGanado")
        .classList.toggle(
            "oculto",
            estado !== "Ganado"
        );

    $("contenedorMotivoPerdida")
        .classList.toggle(
            "oculto",
            estado !== "Perdido"
        );


    if (estado !== "Ganado") {

        fechaGanado.value = "";
    }


    if (estado !== "Perdido") {

        motivoPerdida.value = "";
    }
}


/* =========================================================
   LIMPIAR FORMULARIO
   ========================================================= */

function limpiarFormulario() {

    formulario.reset();

    monedaContratista.value = "MXN";

    proyectoEditando = null;
    estatusOriginal = null;
    fechaCierreOriginal = null;

    btnGuardar.disabled = false;
    btnEditar.disabled = true;

    btnGuardar.textContent = "Guardar";
    btnEditar.textContent = "Guardar cambios";

    $("tituloFormulario").textContent =
        "Nuevo proyecto";

    actualizarCamposEstatus();

    history.replaceState(
        {},
        "",
        "proyectos.html"
    );
}


/* =========================================================
   CONTADOR
   ========================================================= */

async function actualizarContador() {

    const { count, error } =
        await supabaseClient
            .from("proyectos")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            );

    if (error) {

        console.error(
            "Error al contar proyectos:",
            error
        );

        return;
    }

    totalProyectos = count || 0;

    $("contadorProyectos").textContent =
        totalProyectos +
        (
            totalProyectos === 1
                ? " proyecto registrado"
                : " proyectos registrados"
        );
}


/* =========================================================
   CARGAR PROYECTO PARA EDITAR
   ========================================================= */

async function cargarParaEditar(id) {

    const { data, error } =
        await supabaseClient
            .from("proyectos")
            .select("*")
            .eq("id", id)
            .single();


    if (error || !data) {

        console.error(
            "Error al cargar proyecto:",
            error
        );

        alert(
            "No se pudo cargar el proyecto para editar.\n\n" +
            (error?.message || "")
        );

        return;
    }


    proyectoEditando = id;

    estatusOriginal =
        data.estatus || "";

    fechaCierreOriginal =
        data.fecha_cierre || null;


    oportunidad.value =
        data.oportunidad || "";

    cliente.value =
        data.cliente || "";

    tipoProyecto.value =
        data.tipo_proyecto || "";

    fechaSolicitud.value =
        data.fecha_solicitud || "";

    vendedor.value =
        data.vendedor || "";

    fechaEnvioTarea.value =
        data.fecha_envio_tarea || "";

    fechaCotizacion.value =
        data.fecha_cotizacion || "";

    estatus.value =
        data.estatus || "";

    fechaGanado.value =
        data.fecha_ganado || "";

    motivoPerdida.value =
        data.motivo_perdida || "";

    precioVenta.value =
        data.precio_venta ?? "";

    precioContratista.value =
        data.precio_contratista ?? "";

    monedaContratista.value =
        data.moneda_contratista || "MXN";

    contratista.value =
        data.contratista || "";

    tipoCambio.value =
        data.tipo_cambio ?? "";

    margen.value =
        data.margen ?? "";


    $("tituloFormulario").textContent =
        "Editar proyecto";

    btnGuardar.disabled = true;
    btnEditar.disabled = false;

    actualizarCamposEstatus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   GUARDAR PROYECTO NUEVO
   ========================================================= */

async function guardarProyectoNuevo() {

    if (!usuarioActual) {

        alert(
            "No se encontró una sesión activa. " +
            "Vuelve a iniciar sesión."
        );

        return;
    }


    btnGuardar.disabled = true;

    const textoOriginal =
        btnGuardar.textContent;

    btnGuardar.textContent =
        "Guardando...";


    const datosProyecto =
        leerFormulario();


    /*
       Cada proyecto nuevo queda asociado
       al usuario autenticado.
    */

    datosProyecto.user_id =
        usuarioActual.id;


    const { error } =
        await supabaseClient
            .from("proyectos")
            .insert(datosProyecto);


    if (error) {

        console.error(
            "Error al guardar proyecto:",
            error
        );

        alert(
            "No se pudo guardar el proyecto.\n\n" +
            error.message
        );

        btnGuardar.disabled = false;

        btnGuardar.textContent =
            textoOriginal;

        return;
    }


    btnGuardar.textContent =
        textoOriginal;


    limpiarFormulario();

    await actualizarContador();


    alert(
        "Proyecto guardado correctamente."
    );
}


/* =========================================================
   ACTUALIZAR PROYECTO EXISTENTE
   ========================================================= */

async function actualizarProyectoExistente() {

    if (!proyectoEditando) {

        return;
    }


    btnEditar.disabled = true;

    const textoOriginal =
        btnEditar.textContent;

    btnEditar.textContent =
        "Guardando...";


    const datosProyecto =
        leerFormulario();


    /*
       No modificamos user_id al editar.
       El proyecto conserva su propietario original.
    */

    const { error } =
        await supabaseClient
            .from("proyectos")
            .update(datosProyecto)
            .eq("id", proyectoEditando);


    if (error) {

        console.error(
            "Error al actualizar proyecto:",
            error
        );

        alert(
            "No se pudieron guardar los cambios.\n\n" +
            error.message
        );

        btnEditar.disabled = false;

        btnEditar.textContent =
            textoOriginal;

        return;
    }


    btnEditar.textContent =
        textoOriginal;


    alert(
        "Cambios guardados correctamente."
    );


    location.href =
        "index.html#proyectosRegistrados";
}


/* =========================================================
   EVENTOS
   ========================================================= */

estatus.addEventListener(
    "change",
    actualizarCamposEstatus
);


btnLimpiar.addEventListener(
    "click",
    limpiarFormulario
);


/*
   ENTER / SUBMIT

   Si estamos creando:
   INSERT.

   Si estamos editando:
   UPDATE.

   Esto evita crear accidentalmente
   un proyecto nuevo mientras editamos.
*/

formulario.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();

        if (proyectoEditando) {

            await actualizarProyectoExistente();

        } else {

            await guardarProyectoNuevo();
        }
    }
);


btnEditar.addEventListener(
    "click",
    async () => {

        await actualizarProyectoExistente();
    }
);


/* =========================================================
   INICIO
   ========================================================= */

async function iniciar() {

    iniciarReloj();


    const sesionCorrecta =
        await verificarSesion();


    if (!sesionCorrecta) {

        return;
    }


    await actualizarContador();


    const id =
        new URLSearchParams(
            location.search
        ).get("editar");


    if (id) {

        await cargarParaEditar(id);
    }


    actualizarCamposEstatus();
}


iniciar();