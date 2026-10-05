let proyectos = [];

let periodoSeleccionado = {
    anio: new Date().getFullYear(),
    mes: new Date().getMonth()
};


/* =========================================================
   RELOJ
   ========================================================= */

function iniciarReloj() {

    const fechaEl = document.getElementById("fechaHeader");
    const horaEl = document.getElementById("horaHeader");

    const actualizar = () => {

        const ahora = new Date();

        if (fechaEl) {
            fechaEl.textContent = ahora.toLocaleDateString(
                "es-MX",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );
        }

        if (horaEl) {
            horaEl.textContent = ahora.toLocaleTimeString(
                "es-MX",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );
        }
    };

    actualizar();

    setInterval(actualizar, 1000);
}


/* =========================================================
   FORMATOS
   ========================================================= */

function formatearUSD(valor) {

    return "USD $" +
        Number(valor || 0).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


function formatearNumero(valor) {

    return Number(valor || 0).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function numeroCompacto(numero) {

    return new Intl.NumberFormat(
        "en-US",
        {
            notation: "compact",
            maximumFractionDigits: 1
        }
    ).format(numero || 0);
}


function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    const [anio, mes, dia] = fecha.split("-");

    return `${dia}/${mes}/${anio}`;
}


function escaparHTML(texto) {

    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   CONVERTIR USD A LETRAS
   ========================================================= */

function numeroEnteroALetras(numero) {

    numero = Math.floor(Number(numero) || 0);

    if (numero === 0) {
        return "cero";
    }

    const unidades = [
        "",
        "uno",
        "dos",
        "tres",
        "cuatro",
        "cinco",
        "seis",
        "siete",
        "ocho",
        "nueve"
    ];

    const especiales = {
        10: "diez",
        11: "once",
        12: "doce",
        13: "trece",
        14: "catorce",
        15: "quince",
        16: "dieciséis",
        17: "diecisiete",
        18: "dieciocho",
        19: "diecinueve",
        20: "veinte",
        21: "veintiuno",
        22: "veintidós",
        23: "veintitrés",
        24: "veinticuatro",
        25: "veinticinco",
        26: "veintiséis",
        27: "veintisiete",
        28: "veintiocho",
        29: "veintinueve"
    };

    const decenas = [
        "",
        "",
        "veinte",
        "treinta",
        "cuarenta",
        "cincuenta",
        "sesenta",
        "setenta",
        "ochenta",
        "noventa"
    ];

    const centenas = [
        "",
        "ciento",
        "doscientos",
        "trescientos",
        "cuatrocientos",
        "quinientos",
        "seiscientos",
        "setecientos",
        "ochocientos",
        "novecientos"
    ];


    function menorMil(n) {

        if (n === 0) {
            return "";
        }

        if (n === 100) {
            return "cien";
        }

        if (n < 10) {
            return unidades[n];
        }

        if (n <= 29) {
            return especiales[n];
        }

        if (n < 100) {

            const d = Math.floor(n / 10);
            const u = n % 10;

            return decenas[d] +
                (u ? " y " + unidades[u] : "");
        }

        const c = Math.floor(n / 100);
        const resto = n % 100;

        return centenas[c] +
            (resto ? " " + menorMil(resto) : "");
    }


    function convertir(n) {

        if (n < 1000) {
            return menorMil(n);
        }

        if (n < 1000000) {

            const miles = Math.floor(n / 1000);
            const resto = n % 1000;

            let textoMiles;

            if (miles === 1) {
                textoMiles = "mil";
            } else {
                textoMiles =
                    convertir(miles)
                        .replace(/uno$/, "un") +
                    " mil";
            }

            return textoMiles +
                (resto ? " " + convertir(resto) : "");
        }

        if (n < 1000000000000) {

            const millones =
                Math.floor(n / 1000000);

            const resto =
                n % 1000000;

            let textoMillones;

            if (millones === 1) {
                textoMillones = "un millón";
            } else {
                textoMillones =
                    convertir(millones)
                        .replace(/uno$/, "un") +
                    " millones";
            }

            return textoMillones +
                (resto ? " " + convertir(resto) : "");
        }

        return String(n);
    }

    return convertir(numero);
}


function dineroALetras(valor) {

    const numero = Math.abs(Number(valor) || 0);

    let enteros = Math.floor(numero);

    let centavos =
        Math.round((numero - enteros) * 100);

    if (centavos === 100) {
        enteros++;
        centavos = 0;
    }

    let textoEnteros =
        numeroEnteroALetras(enteros);

    if (enteros === 1) {

        textoEnteros =
            textoEnteros.replace(/uno$/, "un");
    }

    const moneda =
        enteros === 1
            ? "dólar"
            : "dólares";

    const textoCentavos =
        numeroEnteroALetras(centavos);

    const palabraCentavos =
        centavos === 1
            ? "centavo"
            : "centavos";

    const resultado =
        `${textoEnteros} ${moneda} con ${textoCentavos} ${palabraCentavos}`;

    return resultado.charAt(0).toUpperCase() +
        resultado.slice(1) +
        ".";
}


/* =========================================================
   SUPABASE -> PROYECTO
   ========================================================= */

function filaSupabaseAProyecto(fila) {

    return {

        id:
            fila.id,

        oportunidad:
            fila.oportunidad || "",

        cliente:
            fila.cliente || "",

        tipoProyecto:
            fila.tipo_proyecto || "",

        fechaSolicitud:
            fila.fecha_solicitud || "",

        vendedor:
            fila.vendedor || "",

        fechaEnvioTarea:
            fila.fecha_envio_tarea || "",

        fechaCotizacion:
            fila.fecha_cotizacion || "",

        estatus:
            fila.estatus || "",

        fechaGanado:
            fila.fecha_ganado || "",

        fechaCierre:
            fila.fecha_cierre || "",

        motivoPerdida:
            fila.motivo_perdida || "",

        precioVenta:
            fila.precio_venta,

        precioContratista:
            fila.precio_contratista,

        monedaContratista:
            fila.moneda_contratista || "MXN",

        contratista:
            fila.contratista || "",

        tipoCambio:
            fila.tipo_cambio,

        margen:
            fila.margen,

        createdAt:
            fila.created_at || ""
    };
}


/* =========================================================
   SESIÓN
   ========================================================= */

async function verificarSesion() {

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error || !data.session) {

        window.location.replace("login.html");

        return false;
    }

    return true;
}


/* =========================================================
   CARGAR PROYECTOS
   ========================================================= */

async function cargarProyectos() {

    const { data, error } =
        await supabaseClient
            .from("proyectos")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(error);

        alert(
            "No se pudieron cargar los proyectos desde Supabase.\n\n" +
            error.message
        );

        return;
    }

    proyectos =
        (data || []).map(filaSupabaseAProyecto);

    configurarSelectorAnios();

    actualizarDashboard();
}


/* =========================================================
   PERIODO SELECCIONADO
   ========================================================= */

function datosPeriodoSeleccionado() {

    const anio =
        periodoSeleccionado.anio;

    const mes =
        periodoSeleccionado.mes;

    const mesNumero =
        String(mes + 1).padStart(2, "0");

    const prefijoMes =
        `${anio}-${mesNumero}`;

    const ultimoDia =
        new Date(
            anio,
            mes + 1,
            0
        ).getDate();

    const inicio =
        `${anio}-${mesNumero}-01`;

    const fin =
        `${anio}-${mesNumero}-${String(ultimoDia).padStart(2, "0")}`;

    const nombreMes =
        new Date(
            anio,
            mes,
            1
        ).toLocaleDateString(
            "es-MX",
            {
                month: "long",
                year: "numeric"
            }
        );

    return {
        anio,
        mes,
        mesNumero,
        prefijoMes,
        ultimoDia,
        inicio,
        fin,
        nombreMes
    };
}


function fechaInicioProyecto(proyecto) {

    if (proyecto.fechaSolicitud) {
        return proyecto.fechaSolicitud;
    }

    if (proyecto.createdAt) {
        return proyecto.createdAt.slice(0, 10);
    }

    return "";
}


function fechaCierreEfectiva(proyecto) {

    if (proyecto.fechaCierre) {
        return proyecto.fechaCierre;
    }

    /*
       Los proyectos Ganados anteriores a esta mejora
       ya tenían fechaGanado.

       Podemos utilizar esa fecha como cierre histórico
       sin modificar el registro original.
    */

    if (
        proyecto.estatus === "Ganado" &&
        proyecto.fechaGanado
    ) {
        return proyecto.fechaGanado;
    }

    return "";
}


/* =========================================================
   PROYECTOS QUE EXISTÍAN EN EL MES SELECCIONADO
   ========================================================= */

function proyectoPerteneceAlPeriodo(proyecto) {

    const periodo =
        datosPeriodoSeleccionado();

    const inicioProyecto =
        fechaInicioProyecto(proyecto);

    if (!inicioProyecto) {
        return false;
    }

    /*
       Si todavía no había iniciado en ese mes,
       no debe aparecer.
    */

    if (inicioProyecto > periodo.fin) {
        return false;
    }

    const cierre =
        fechaCierreEfectiva(proyecto);

    /*
       Si tiene cierre y terminó antes del inicio
       del mes seleccionado, ya no aparece.
    */

    if (
        cierre &&
        cierre < periodo.inicio
    ) {
        return false;
    }

    return true;
}


function obtenerProyectosPeriodo() {

    return proyectos.filter(
        proyectoPerteneceAlPeriodo
    );
}


/* =========================================================
   ESTATUS QUE DEBE MOSTRARSE HISTÓRICAMENTE
   ========================================================= */

function estatusEnPeriodo(proyecto) {

    const periodo =
        datosPeriodoSeleccionado();

    const cierre =
        fechaCierreEfectiva(proyecto);

    /*
       Si el proyecto termina después del mes que estamos
       consultando, todavía no mostramos el estatus terminal.
    */

    if (
        cierre &&
        cierre > periodo.fin
    ) {

        if (
            proyecto.fechaCotizacion &&
            proyecto.fechaCotizacion <= periodo.fin
        ) {
            return "En cotización";
        }

        return "Abierto";
    }

    return proyecto.estatus;
}


/* =========================================================
   SELECTOR MES / AÑO
   ========================================================= */

function configurarSelectorAnios() {

    const selector =
        document.getElementById("selectorAnio");

    if (!selector) {
        return;
    }

    const actual =
        periodoSeleccionado.anio;

    const anios =
        new Set([
            new Date().getFullYear()
        ]);

    proyectos.forEach(p => {

        [
            p.fechaSolicitud,
            p.fechaEnvioTarea,
            p.fechaCotizacion,
            p.fechaGanado,
            p.fechaCierre,
            p.createdAt
                ? p.createdAt.slice(0, 10)
                : ""
        ].forEach(fecha => {

            if (!fecha) {
                return;
            }

            const anio =
                Number(fecha.slice(0, 4));

            if (anio) {
                anios.add(anio);
            }
        });
    });

    const lista =
        [...anios].sort((a, b) => b - a);

    selector.innerHTML =
        lista
            .map(
                anio =>
                    `<option value="${anio}">${anio}</option>`
            )
            .join("");

    if (!lista.includes(actual)) {

        const opcion =
            document.createElement("option");

        opcion.value = actual;
        opcion.textContent = actual;

        selector.appendChild(opcion);
    }

    selector.value = actual;
}


function sincronizarSelectorPeriodo() {

    const selectorMes =
        document.getElementById("selectorMes");

    const selectorAnio =
        document.getElementById("selectorAnio");

    if (selectorMes) {
        selectorMes.value =
            periodoSeleccionado.mes;
    }

    if (selectorAnio) {

        if (
            ![...selectorAnio.options]
                .some(
                    opcion =>
                        Number(opcion.value) ===
                        periodoSeleccionado.anio
                )
        ) {

            const opcion =
                document.createElement("option");

            opcion.value =
                periodoSeleccionado.anio;

            opcion.textContent =
                periodoSeleccionado.anio;

            selectorAnio.appendChild(opcion);
        }

        selectorAnio.value =
            periodoSeleccionado.anio;
    }

    actualizarEstadoBotonSiguiente();
}


function actualizarEstadoBotonSiguiente() {

    const boton =
        document.getElementById("btnMesSiguiente");

    if (!boton) {
        return;
    }

    const hoy =
        new Date();

    const seleccionado =
        periodoSeleccionado.anio * 12 +
        periodoSeleccionado.mes;

    const actual =
        hoy.getFullYear() * 12 +
        hoy.getMonth();

    boton.disabled =
        seleccionado >= actual;
}


function cambiarMes(desplazamiento) {

    let anio =
        periodoSeleccionado.anio;

    let mes =
        periodoSeleccionado.mes +
        desplazamiento;

    if (mes < 0) {
        mes = 11;
        anio--;
    }

    if (mes > 11) {
        mes = 0;
        anio++;
    }

    const hoy =
        new Date();

    const solicitado =
        anio * 12 + mes;

    const actual =
        hoy.getFullYear() * 12 +
        hoy.getMonth();

    /*
       No navegamos a meses futuros.
    */

    if (solicitado > actual) {
        return;
    }

    periodoSeleccionado = {
        anio,
        mes
    };

    configurarSelectorAnios();

    sincronizarSelectorPeriodo();

    limpiarFiltrosSinActualizar();

    actualizarDashboard();
}


function configurarSelectorPeriodo() {

    const selectorMes =
        document.getElementById("selectorMes");

    const selectorAnio =
        document.getElementById("selectorAnio");


    selectorMes?.addEventListener(
        "change",
        () => {

            periodoSeleccionado.mes =
                Number(selectorMes.value);

            sincronizarSelectorPeriodo();

            limpiarFiltrosSinActualizar();

            actualizarDashboard();
        }
    );


    selectorAnio?.addEventListener(
        "change",
        () => {

            periodoSeleccionado.anio =
                Number(selectorAnio.value);

            /*
               Si seleccionamos el año actual y teníamos
               un mes futuro, regresamos al mes actual.
            */

            const hoy =
                new Date();

            if (
                periodoSeleccionado.anio ===
                    hoy.getFullYear() &&
                periodoSeleccionado.mes >
                    hoy.getMonth()
            ) {

                periodoSeleccionado.mes =
                    hoy.getMonth();
            }

            sincronizarSelectorPeriodo();

            limpiarFiltrosSinActualizar();

            actualizarDashboard();
        }
    );


    document
        .getElementById("btnMesAnterior")
        ?.addEventListener(
            "click",
            () => cambiarMes(-1)
        );


    document
        .getElementById("btnMesSiguiente")
        ?.addEventListener(
            "click",
            () => cambiarMes(1)
        );


    document
        .getElementById("btnMesActual")
        ?.addEventListener(
            "click",
            () => {

                const hoy =
                    new Date();

                periodoSeleccionado = {
                    anio: hoy.getFullYear(),
                    mes: hoy.getMonth()
                };

                configurarSelectorAnios();

                sincronizarSelectorPeriodo();

                limpiarFiltrosSinActualizar();

                actualizarDashboard();
            }
        );


    sincronizarSelectorPeriodo();
}


/* =========================================================
   ANIMACIÓN KPI
   ========================================================= */

function animarNumero(
    elemento,
    valorFinal,
    opciones = {}
) {

    if (!elemento) {
        return;
    }

    const {
        duracion = 1200,
        tipo = "numero",
        decimales = 0
    } = opciones;

    const final =
        Number(valorFinal) || 0;

    const reducir =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    const pintar = valor => {

        if (tipo === "usd") {

            elemento.textContent =
                "USD $" +
                Number(valor).toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

        } else if (tipo === "porcentaje") {

            elemento.textContent =
                Number(valor).toLocaleString(
                    "es-MX",
                    {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: decimales
                    }
                ) + "%";

        } else if (tipo === "dias") {

            elemento.textContent =
                Number(valor).toLocaleString(
                    "es-MX",
                    {
                        minimumFractionDigits:
                            decimales,
                        maximumFractionDigits:
                            decimales
                    }
                ) +
                (
                    Number(valor) === 1
                        ? " día"
                        : " días"
                );

        } else {

            elemento.textContent =
                Math.round(
                    Number(valor)
                ).toLocaleString("es-MX");
        }
    };


    if (reducir) {

        pintar(final);

        return;
    }


    const inicio =
        performance.now();


    const cuadro = ahora => {

        const progreso =
            Math.min(
                (ahora - inicio) / duracion,
                1
            );

        const suave =
            1 -
            Math.pow(
                1 - progreso,
                3
            );

        pintar(final * suave);

        if (progreso < 1) {

            requestAnimationFrame(cuadro);

        } else {

            pintar(final);
        }
    };


    pintar(0);

    requestAnimationFrame(cuadro);
}


/* =========================================================
   DÍAS HÁBILES
   ========================================================= */

function diasHabilesEntre(
    fechaInicio,
    fechaFin
) {

    if (
        !fechaInicio ||
        !fechaFin ||
        fechaFin < fechaInicio
    ) {
        return null;
    }

    const [ai, mi, di] =
        fechaInicio
            .split("-")
            .map(Number);

    const [af, mf, df] =
        fechaFin
            .split("-")
            .map(Number);

    const inicio =
        new Date(ai, mi - 1, di);

    const fin =
        new Date(af, mf - 1, df);

    let dias = 0;

    const actual =
        new Date(inicio);

    /*
       Contamos los días transcurridos después
       de la asignación de la tarea.

       Sábado y domingo no cuentan.
    */

    actual.setDate(
        actual.getDate() + 1
    );

    while (actual <= fin) {

        const diaSemana =
            actual.getDay();

        if (
            diaSemana !== 0 &&
            diaSemana !== 6
        ) {
            dias++;
        }

        actual.setDate(
            actual.getDate() + 1
        );
    }

    return dias;
}


/* =========================================================
   CONTADOR TOTAL
   ========================================================= */

function actualizarContador() {

    const elemento =
        document.getElementById(
            "contadorProyectos"
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        proyectos.length +
        (
            proyectos.length === 1
                ? " proyecto registrado"
                : " proyectos registrados"
        );
}


/* =========================================================
   KPI DEL MES SELECCIONADO
   ========================================================= */

function actualizarKPIs() {

    const periodo =
        datosPeriodoSeleccionado();


    const cotizacionesMes =
        proyectos.filter(
            p =>
                p.fechaCotizacion &&
                p.fechaCotizacion.startsWith(
                    periodo.prefijoMes
                )
        );


    const ganadosMes =
        proyectos.filter(
            p =>
                p.estatus === "Ganado" &&
                p.fechaGanado &&
                p.fechaGanado.startsWith(
                    periodo.prefijoMes
                )
        );


    const montoCotizado =
        cotizacionesMes.reduce(
            (total, p) =>
                total +
                (Number(p.precioVenta) || 0),
            0
        );


    const montoVendido =
        ganadosMes.reduce(
            (total, p) =>
                total +
                (Number(p.precioVenta) || 0),
            0
        );


    const conversion =
        montoCotizado > 0
            ? (
                montoVendido /
                montoCotizado
            ) * 100
            : 0;


    const tiempos =
        cotizacionesMes
            .map(
                p =>
                    diasHabilesEntre(
                        p.fechaEnvioTarea,
                        p.fechaCotizacion
                    )
            )
            .filter(
                valor =>
                    valor !== null
            );


    const promedioTiempo =
        tiempos.length
            ? tiempos.reduce(
                (a, b) => a + b,
                0
            ) / tiempos.length
            : 0;


    animarNumero(
        document.getElementById(
            "kpiCotizado"
        ),
        montoCotizado,
        {
            tipo: "usd"
        }
    );


    animarNumero(
        document.getElementById(
            "kpiVendido"
        ),
        montoVendido,
        {
            tipo: "usd"
        }
    );


    animarNumero(
        document.getElementById(
            "kpiCotizaciones"
        ),
        cotizacionesMes.length,
        {
            duracion: 900
        }
    );


    animarNumero(
        document.getElementById(
            "kpiConversion"
        ),
        conversion,
        {
            tipo: "porcentaje",
            decimales: 1,
            duracion: 1100
        }
    );


    animarNumero(
        document.getElementById(
            "kpiTiempoCotizacion"
        ),
        promedioTiempo,
        {
            tipo: "dias",
            decimales: 1,
            duracion: 1000
        }
    );


    const cotizadoLetras =
        document.getElementById(
            "kpiCotizadoLetras"
        );

    if (cotizadoLetras) {

        cotizadoLetras.textContent =
            dineroALetras(
                montoCotizado
            );
    }


    const vendidoLetras =
        document.getElementById(
            "kpiVendidoLetras"
        );

    if (vendidoLetras) {

        vendidoLetras.textContent =
            dineroALetras(
                montoVendido
            );
    }


    const periodoActual =
        document.getElementById(
            "periodoActual"
        );

    if (periodoActual) {

        periodoActual.textContent =
            `Del 01 al ${String(periodo.ultimoDia).padStart(2, "0")} de ${periodo.nombreMes}`;
    }


    const textoPeriodo =
        document.getElementById(
            "textoProyectosPeriodo"
        );

    if (textoPeriodo) {

        textoPeriodo.textContent =
            `Proyectos activos o concluidos durante ${periodo.nombreMes}.`;
    }
}


/* =========================================================
   GRÁFICAS DEL AÑO SELECCIONADO
   ========================================================= */

function obtenerDatosMensuales() {

    const anio =
        periodoSeleccionado.anio;

    const montos =
        new Array(12).fill(0);

    const cantidades =
        new Array(12).fill(0);


    proyectos.forEach(p => {

        if (!p.fechaCotizacion) {
            return;
        }

        const partes =
            p.fechaCotizacion.split("-");

        const anioProyecto =
            Number(partes[0]);

        const mesProyecto =
            Number(partes[1]) - 1;

        if (anioProyecto !== anio) {
            return;
        }

        cantidades[mesProyecto]++;

        montos[mesProyecto] +=
            Number(p.precioVenta) || 0;
    });


    return {
        anio,
        montos,
        cantidades
    };
}


function crearGrafica(
    contenedorId,
    valores,
    tipo
) {

    const contenedor =
        document.getElementById(
            contenedorId
        );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";


    const meses = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic"
    ];


    const maximo =
        Math.max(
            ...valores,
            1
        );


    valores.forEach(
        (valor, indice) => {

            const columna =
                document.createElement("div");

            columna.className =
                "barra-columna";


            const etiqueta =
                document.createElement("div");

            etiqueta.className =
                "barra-valor";


            if (
                tipo === "dinero" &&
                valor > 0
            ) {

                etiqueta.textContent =
                    "USD $" +
                    numeroCompacto(valor);

            } else if (
                tipo === "cantidad" &&
                valor > 0
            ) {

                etiqueta.textContent =
                    valor;
            }


            const barra =
                document.createElement("div");

            barra.className =
                tipo === "cantidad"
                    ? "barra barra-cantidad"
                    : "barra";


            barra.style.height =
                valor > 0
                    ? Math.max(
                        (valor / maximo) * 100,
                        4
                    ) + "%"
                    : "2px";


            const mes =
                document.createElement("div");

            mes.className =
                "barra-mes";

            mes.textContent =
                meses[indice];


            columna.append(
                etiqueta,
                barra,
                mes
            );

            contenedor.appendChild(
                columna
            );
        }
    );
}


function actualizarGraficas() {

    const datos =
        obtenerDatosMensuales();


    crearGrafica(
        "graficaMonto",
        datos.montos,
        "dinero"
    );


    crearGrafica(
        "graficaCantidad",
        datos.cantidades,
        "cantidad"
    );


    const tituloMonto =
        document.getElementById(
            "tituloGraficaMonto"
        );

    const tituloCantidad =
        document.getElementById(
            "tituloGraficaCantidad"
        );


    if (tituloMonto) {

        tituloMonto.textContent =
            "Precio final enviado a Ventas en USD — " +
            datos.anio;
    }


    if (tituloCantidad) {

        tituloCantidad.textContent =
            "Cotizaciones emitidas por mes — " +
            datos.anio;
    }
}


/* =========================================================
   VENDEDORES - AÑO SELECCIONADO
   ========================================================= */

function obtenerResumenVendedores() {

    const anio =
        periodoSeleccionado.anio;

    const resumen = {};


    proyectos.forEach(p => {

        const nombre =
            (p.vendedor || "").trim();

        if (!nombre) {
            return;
        }


        if (!resumen[nombre]) {

            resumen[nombre] = {
                vendedor: nombre,
                cotizaciones: 0,
                montoCotizado: 0,
                ganados: 0,
                montoVendido: 0
            };
        }


        const importe =
            Number(p.precioVenta) || 0;


        if (
            p.fechaCotizacion &&
            p.fechaCotizacion.startsWith(
                `${anio}-`
            )
        ) {

            resumen[nombre].cotizaciones++;

            resumen[nombre].montoCotizado +=
                importe;
        }


        if (
            p.estatus === "Ganado" &&
            p.fechaGanado &&
            p.fechaGanado.startsWith(
                `${anio}-`
            )
        ) {

            resumen[nombre].ganados++;

            resumen[nombre].montoVendido +=
                importe;
        }
    });


    return Object.values(resumen)
        .sort(
            (a, b) =>
                b.montoCotizado -
                a.montoCotizado
        );
}


function actualizarGraficaVendedores() {

    const contenedor =
        document.getElementById(
            "graficaVendedores"
        );

    if (!contenedor) {
        return;
    }


    const resumen =
        obtenerResumenVendedores();

    const anio =
        periodoSeleccionado.anio;


    contenedor.innerHTML = "";


    const periodo =
        document.getElementById(
            "periodoGraficaVendedores"
        );

    if (periodo) {

        periodo.textContent =
            `Acumulado del año ${anio} — montos de venta expresados en USD`;
    }


    if (!resumen.length) {

        contenedor.innerHTML =
            '<div style="text-align:center;padding:30px;color:#68727d;">No existen datos para mostrar.</div>';

        return;
    }


    let maximo = 1;

    resumen.forEach(item => {

        maximo =
            Math.max(
                maximo,
                item.montoCotizado,
                item.montoVendido
            );
    });


    resumen.forEach(item => {

        const fila =
            document.createElement("div");

        fila.className =
            "vendedor-grafica-fila";


        fila.innerHTML = `
            <div class="vendedor-grafica-nombre">
                ${escaparHTML(item.vendedor)}
            </div>

            <div class="vendedor-barras">

                <div class="vendedor-barra-linea">

                    <div class="vendedor-barra-etiqueta">
                        Cotizado
                    </div>

                    <div class="vendedor-barra-fondo">
                        <div
                            class="vendedor-barra-cotizado"
                            style="width:${(item.montoCotizado / maximo) * 100}%;">
                        </div>
                    </div>

                    <div class="vendedor-barra-valor">
                        ${formatearUSD(item.montoCotizado)}
                    </div>

                </div>

                <div class="vendedor-barra-linea">

                    <div class="vendedor-barra-etiqueta">
                        Vendido
                    </div>

                    <div class="vendedor-barra-fondo">
                        <div
                            class="vendedor-barra-vendido"
                            style="width:${(item.montoVendido / maximo) * 100}%;">
                        </div>
                    </div>

                    <div class="vendedor-barra-valor">
                        ${formatearUSD(item.montoVendido)}
                    </div>

                </div>

            </div>
        `;

        contenedor.appendChild(fila);
    });
}


function actualizarTablaVendedores() {

    const tbody =
        document.getElementById(
            "tablaVendedores"
        );

    if (!tbody) {
        return;
    }


    const resumen =
        obtenerResumenVendedores();

    const anio =
        periodoSeleccionado.anio;


    tbody.innerHTML = "";


    if (!resumen.length) {

        tbody.innerHTML =
            '<tr><td colspan="6" style="text-align:center;padding:25px;">No existen datos para mostrar.</td></tr>';
    }


    resumen.forEach(item => {

        const conversion =
            item.montoCotizado > 0
                ? (
                    item.montoVendido /
                    item.montoCotizado
                ) * 100
                : 0;


        const fila =
            document.createElement("tr");


        fila.innerHTML = `
            <td>${escaparHTML(item.vendedor)}</td>
            <td>${item.cotizaciones}</td>
            <td>${formatearUSD(item.montoCotizado)}</td>
            <td>${item.ganados}</td>
            <td>${formatearUSD(item.montoVendido)}</td>
            <td>${conversion.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%</td>
        `;


        tbody.appendChild(fila);
    });


    const periodo =
        document.getElementById(
            "periodoVendedores"
        );

    if (periodo) {

        periodo.textContent =
            `Acumulado del año ${anio} — montos expresados en USD`;
    }
}


/* =========================================================
   ESTATUS
   ========================================================= */

function claseEstatus(estado) {

    if (estado === "Abierto") {
        return "estatus-abierto";
    }

    if (estado === "En cotización") {
        return "estatus-cotizacion";
    }

    if (estado === "Ganado") {
        return "estatus-ganado";
    }

    if (estado === "Cerrado") {
        return "estatus-cerrado";
    }

    if (estado === "Perdido") {
        return "estatus-perdido";
    }

    return "";
}


/* =========================================================
   FILTROS DE TABLA
   ========================================================= */

function proyectosFiltrados() {

    const buscar =
        document.getElementById("buscar");

    const filtroTipo =
        document.getElementById(
            "filtroTipo"
        );

    const filtroEstatus =
        document.getElementById(
            "filtroEstatus"
        );

    const filtroVendedor =
        document.getElementById(
            "filtroVendedor"
        );


    const texto =
        (buscar?.value || "")
            .toLowerCase()
            .trim();


    return obtenerProyectosPeriodo()
        .filter(p => {

            const estadoPeriodo =
                estatusEnPeriodo(p);


            const coincideTexto =
                (p.oportunidad || "")
                    .toLowerCase()
                    .includes(texto) ||

                (p.cliente || "")
                    .toLowerCase()
                    .includes(texto) ||

                (p.vendedor || "")
                    .toLowerCase()
                    .includes(texto) ||

                (p.contratista || "")
                    .toLowerCase()
                    .includes(texto);


            return (
                coincideTexto &&

                (
                    !filtroTipo?.value ||
                    p.tipoProyecto ===
                        filtroTipo.value
                ) &&

                (
                    !filtroEstatus?.value ||
                    estadoPeriodo ===
                        filtroEstatus.value
                ) &&

                (
                    !filtroVendedor?.value ||
                    p.vendedor ===
                        filtroVendedor.value
                )
            );
        });
}


function actualizarFiltroVendedores() {

    const select =
        document.getElementById(
            "filtroVendedor"
        );

    if (!select) {
        return;
    }


    const actual =
        select.value;


    const vendedores = [
        ...new Set(
            obtenerProyectosPeriodo()
                .map(
                    p =>
                        (p.vendedor || "").trim()
                )
                .filter(Boolean)
        )
    ].sort(
        (a, b) =>
            a.localeCompare(
                b,
                "es"
            )
    );


    select.innerHTML =
        '<option value="">Todos los vendedores</option>' +

        vendedores
            .map(
                vendedor =>
                    `<option value="${escaparHTML(vendedor)}">${escaparHTML(vendedor)}</option>`
            )
            .join("");


    if (vendedores.includes(actual)) {

        select.value =
            actual;
    }
}


function limpiarFiltrosSinActualizar() {

    [
        "buscar",
        "filtroTipo",
        "filtroEstatus",
        "filtroVendedor"
    ].forEach(id => {

        const elemento =
            document.getElementById(id);

        if (elemento) {
            elemento.value = "";
        }
    });
}


/* =========================================================
   TABLA DE PROYECTOS
   ========================================================= */

function mostrarProyectosRegistrados() {

    const cuerpo =
        document.getElementById(
            "cuerpoTabla"
        );

    if (!cuerpo) {
        return;
    }


    const lista =
        proyectosFiltrados();


    cuerpo.innerHTML = "";


    if (!lista.length) {

        cuerpo.innerHTML =
            '<tr><td colspan="17" style="text-align:center;padding:30px;">No hay proyectos para mostrar en este periodo.</td></tr>';

        return;
    }


    lista.forEach(p => {

        const fila =
            document.createElement("tr");

        const estadoPeriodo =
            estatusEnPeriodo(p);


        /*
           Fecha ganado y motivo pérdida solamente se muestran
           cuando ya habían ocurrido en el periodo consultado.
        */

        const periodo =
            datosPeriodoSeleccionado();


        const fechaGanadoVisible =
            p.fechaGanado &&
            p.fechaGanado <= periodo.fin
                ? p.fechaGanado
                : "";


        const motivoPerdidaVisible =
            estadoPeriodo === "Perdido"
                ? p.motivoPerdida
                : "";


        fila.innerHTML = `

            <td>${escaparHTML(p.oportunidad)}</td>

            <td>${escaparHTML(p.cliente)}</td>

            <td>${escaparHTML(p.tipoProyecto)}</td>

            <td>${formatearFecha(p.fechaSolicitud)}</td>

            <td>${escaparHTML(p.vendedor)}</td>

            <td>${formatearFecha(p.fechaEnvioTarea)}</td>

            <td>${formatearFecha(p.fechaCotizacion)}</td>

            <td>
                <span class="estatus ${claseEstatus(estadoPeriodo)}">
                    ${escaparHTML(estadoPeriodo)}
                </span>
            </td>

            <td>${formatearFecha(fechaGanadoVisible)}</td>

            <td>${escaparHTML(motivoPerdidaVisible)}</td>

            <td>
                USD $${formatearNumero(p.precioVenta)}
            </td>

            <td class="confidencial">
                ${formatearNumero(p.precioContratista)}
            </td>

            <td class="confidencial">
                ${escaparHTML(p.monedaContratista)}
            </td>

            <td class="confidencial">
                ${escaparHTML(p.contratista)}
            </td>

            <td>
                ${p.tipoCambio ?? ""}
            </td>

            <td class="confidencial">
                ${
                    p.margen !== null &&
                    p.margen !== undefined &&
                    p.margen !== ""
                        ? escaparHTML(p.margen) + "%"
                        : ""
                }
            </td>

            <td class="acciones-tabla no-print">

                <button
                    type="button"
                    class="btn btn-azul btn-editar-dashboard"
                    data-id="${escaparHTML(p.id)}"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="btn btn-rojo btn-eliminar-dashboard"
                    data-id="${escaparHTML(p.id)}"
                >
                    Eliminar
                </button>

            </td>
        `;


        cuerpo.appendChild(fila);
    });


    document
        .querySelectorAll(
            ".btn-editar-dashboard"
        )
        .forEach(
            boton =>
                boton.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `proyectos.html?editar=${encodeURIComponent(boton.dataset.id)}`;
                    }
                )
        );


    document
        .querySelectorAll(
            ".btn-eliminar-dashboard"
        )
        .forEach(
            boton =>
                boton.addEventListener(
                    "click",
                    () =>
                        eliminarProyectoDashboard(
                            boton.dataset.id
                        )
                )
        );
}


/* =========================================================
   ELIMINAR
   ========================================================= */

async function eliminarProyectoDashboard(id) {

    const proyecto =
        proyectos.find(
            p =>
                String(p.id) ===
                String(id)
        );


    if (!proyecto) {
        return;
    }


    const confirmar =
        confirm(
            `¿Eliminar el proyecto ${proyecto.oportunidad || proyecto.cliente || "seleccionado"}?`
        );


    if (!confirmar) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("proyectos")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "No se pudo eliminar el proyecto.\n\n" +
            error.message
        );

        return;
    }


    await cargarProyectos();
}


/* =========================================================
   REPORTES
   ========================================================= */

function prepararReporte(tipo) {

    document.body.classList.toggle(
        "reporte-ventas",
        tipo === "ventas"
    );


    const titulo =
        document.getElementById(
            "tituloReporte"
        );

    const datos =
        document.getElementById(
            "datosReporte"
        );

    const periodo =
        datosPeriodoSeleccionado();


    if (titulo) {

        titulo.textContent =
            tipo === "ventas"
                ? "Reporte de Ventas"
                : "Reporte de Proyectos";
    }


    if (datos) {

        datos.textContent =
            `${periodo.nombreMes} · ${proyectosFiltrados().length} registros · Generado el ${new Date().toLocaleDateString("es-MX")}`;
    }


    document
        .getElementById(
            "modalReporte"
        )
        ?.classList.remove(
            "modal-activo"
        );


    setTimeout(
        () => window.print(),
        80
    );
}


/* =========================================================
   INTERFAZ
   ========================================================= */

function configurarInterfazTabla() {

    [
        "buscar",
        "filtroTipo",
        "filtroEstatus",
        "filtroVendedor"
    ].forEach(id => {

        const elemento =
            document.getElementById(id);

        if (!elemento) {
            return;
        }


        elemento.addEventListener(
            id === "buscar"
                ? "input"
                : "change",
            mostrarProyectosRegistrados
        );
    });


    document
        .getElementById(
            "btnLimpiarFiltros"
        )
        ?.addEventListener(
            "click",
            () => {

                limpiarFiltrosSinActualizar();

                mostrarProyectosRegistrados();
            }
        );


    document
        .getElementById(
            "btnReporte"
        )
        ?.addEventListener(
            "click",
            () =>
                document
                    .getElementById(
                        "modalReporte"
                    )
                    ?.classList.add(
                        "modal-activo"
                    )
        );


    document
        .getElementById(
            "btnCerrarModal"
        )
        ?.addEventListener(
            "click",
            () =>
                document
                    .getElementById(
                        "modalReporte"
                    )
                    ?.classList.remove(
                        "modal-activo"
                    )
        );


    document
        .getElementById(
            "btnReporteVentas"
        )
        ?.addEventListener(
            "click",
            () =>
                prepararReporte(
                    "ventas"
                )
        );


    document
        .getElementById(
            "btnReporteProyectos"
        )
        ?.addEventListener(
            "click",
            () =>
                prepararReporte(
                    "proyectos"
                )
        );
}


/* =========================================================
   ACTUALIZAR TODO EL DASHBOARD
   ========================================================= */

function actualizarDashboard() {

    actualizarContador();

    actualizarKPIs();

    actualizarGraficas();

    actualizarGraficaVendedores();

    actualizarTablaVendedores();

    actualizarFiltroVendedores();

    mostrarProyectosRegistrados();

    sincronizarSelectorPeriodo();
}


/* =========================================================
   INICIO
   ========================================================= */

async function iniciar() {

    iniciarReloj();

    configurarInterfazTabla();

    configurarSelectorPeriodo();


    const sesionCorrecta =
        await verificarSesion();


    if (!sesionCorrecta) {
        return;
    }


    await cargarProyectos();


    if (
        new URLSearchParams(
            location.search
        ).get("reporte") === "1"
    ) {

        document
            .getElementById(
                "modalReporte"
            )
            ?.classList.add(
                "modal-activo"
            );
    }
}


iniciar();