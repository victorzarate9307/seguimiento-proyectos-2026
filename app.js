// ======================================================
// BASE DE DATOS LOCAL
// ======================================================

let proyectos =
    JSON.parse(
        localStorage.getItem(
            "proyectos"
        )
    )
    ||
    [];


let proyectoEditando =
    null;



// ======================================================
// ELEMENTOS DEL FORMULARIO
// ======================================================

const formulario =
    document.getElementById(
        "formProyecto"
    );


const oportunidad =
    document.getElementById(
        "oportunidad"
    );


const tipoProyecto =
    document.getElementById(
        "tipoProyecto"
    );


const fechaSolicitud =
    document.getElementById(
        "fechaSolicitud"
    );


const vendedor =
    document.getElementById(
        "vendedor"
    );


const fechaCotizacion =
    document.getElementById(
        "fechaCotizacion"
    );


const estatus =
    document.getElementById(
        "estatus"
    );


const fechaGanado =
    document.getElementById(
        "fechaGanado"
    );


const precioVenta =
    document.getElementById(
        "precioVenta"
    );


const monedaVenta =
    document.getElementById(
        "monedaVenta"
    );


const precioContratista =
    document.getElementById(
        "precioContratista"
    );


const monedaContratista =
    document.getElementById(
        "monedaContratista"
    );


const contratista =
    document.getElementById(
        "contratista"
    );


const tipoCambio =
    document.getElementById(
        "tipoCambio"
    );


const margen =
    document.getElementById(
        "margen"
    );


const cuerpoTabla =
    document.getElementById(
        "cuerpoTabla"
    );



// ======================================================
// FILTROS
// ======================================================

const buscar =
    document.getElementById(
        "buscar"
    );


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



// ======================================================
// GUARDAR LOCAL STORAGE
// ======================================================

function guardarLocalStorage() {

    localStorage.setItem(

        "proyectos",

        JSON.stringify(
            proyectos
        )

    );

}



// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHTML(texto) {

    return String(
        texto ?? ""
    )

    .replaceAll(
        "&",
        "&amp;"
    )

    .replaceAll(
        "<",
        "&lt;"
    )

    .replaceAll(
        ">",
        "&gt;"
    )

    .replaceAll(
        '"',
        "&quot;"
    )

    .replaceAll(
        "'",
        "&#039;"
    );

}



// ======================================================
// FORMATO DINERO
// ======================================================

function formatearDinero(valor) {

    if (
        valor === ""
        ||
        valor === null
        ||
        valor === undefined
    ) {

        return "";

    }


    const numero =
        Number(valor);


    if (
        Number.isNaN(
            numero
        )
    ) {

        return "";

    }


    return numero.toLocaleString(

        "es-MX",

        {

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }

    );

}



// ======================================================
// FORMATO MXN
// ======================================================

function formatearMXN(valor) {

    const numero =
        Number(valor)
        ||
        0;


    return numero.toLocaleString(

        "es-MX",

        {

            style:
                "currency",

            currency:
                "MXN",

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }

    );

}



// ======================================================
// FORMATO COMPACTO
// ======================================================

function numeroCompacto(numero) {

    return new Intl.NumberFormat(

        "es-MX",

        {

            notation:
                "compact",

            maximumFractionDigits:
                1

        }

    ).format(
        numero || 0
    );

}



// ======================================================
// FORMATO FECHA
// ======================================================

function formatearFecha(fecha) {

    if (!fecha) {

        return "";

    }


    const partes =
        fecha.split("-");


    if (
        partes.length !== 3
    ) {

        return fecha;

    }


    return (

        partes[2]
        +
        "/"
        +
        partes[1]
        +
        "/"
        +
        partes[0]

    );

}



// ======================================================
// CONVERTIR PRECIO DE VENTA A MXN
// ======================================================

function precioVentaMXN(proyecto) {

    const precio =
        Number(
            proyecto.precioVenta
        )
        ||
        0;


    if (
        proyecto.monedaVenta ===
        "USD"
    ) {

        const tc =
            Number(
                proyecto.tipoCambio
            )
            ||
            0;


        if (
            tc <= 0
        ) {

            return 0;

        }


        return (
            precio
            *
            tc
        );

    }


    return precio;

}



// ======================================================
// PROYECTO USD SIN TC
// ======================================================

function requiereTipoCambio(proyecto) {

    return (

        proyecto.monedaVenta ===
        "USD"

        &&

        Number(
            proyecto.precioVenta
        ) > 0

        &&

        Number(
            proyecto.tipoCambio
        ) <= 0

    );

}



// ======================================================
// COLOR DEL ESTATUS
// ======================================================

function claseEstatus(estado) {

    if (
        estado ===
        "Abierto"
    ) {

        return "estatus-abierto";

    }


    if (
        estado ===
        "En cotización"
    ) {

        return "estatus-cotizacion";

    }


    if (
        estado ===
        "Ganado"
    ) {

        return "estatus-ganado";

    }


    if (
        estado ===
        "Cerrado"
    ) {

        return "estatus-cerrado";

    }


    if (
        estado ===
        "Perdido"
    ) {

        return "estatus-perdido";

    }


    return "";

}



// ======================================================
// MOSTRAR FECHA GANADO
// ======================================================

function actualizarCampoGanado() {

    const contenedor =
        document.getElementById(
            "contenedorFechaGanado"
        );


    if (
        estatus.value ===
        "Ganado"
    ) {

        contenedor.classList.remove(
            "oculto"
        );

    }

    else {

        contenedor.classList.add(
            "oculto"
        );

    }

}


estatus.addEventListener(

    "change",

    actualizarCampoGanado

);



// ======================================================
// GUARDAR PROYECTO NUEVO
// ======================================================

formulario.addEventListener(

    "submit",

    function(event) {


        event.preventDefault();


        const nuevoProyecto = {


            id:
                Date.now(),


            oportunidad:
                oportunidad.value.trim(),


            tipoProyecto:
                tipoProyecto.value,


            fechaSolicitud:
                fechaSolicitud.value,


            vendedor:
                vendedor.value.trim(),


            fechaCotizacion:
                fechaCotizacion.value,


            estatus:
                estatus.value,


            fechaGanado:
                fechaGanado.value,


            precioVenta:
                precioVenta.value,


            monedaVenta:
                monedaVenta.value,


            precioContratista:
                precioContratista.value,


            monedaContratista:
                monedaContratista.value,


            contratista:
                contratista.value.trim(),


            tipoCambio:
                tipoCambio.value,


            margen:
                margen.value

        };


        proyectos.unshift(
            nuevoProyecto
        );


        guardarLocalStorage();


        limpiarFormulario();


        actualizarSistema();

    }

);



// ======================================================
// FILTRAR PROYECTOS
// ======================================================

function proyectosFiltrados() {

    const texto =
        buscar.value
        .toLowerCase()
        .trim();


    return proyectos.filter(

        function(proyecto) {


            const coincideTexto =

                (
                    proyecto.oportunidad
                    ||
                    ""
                )
                .toLowerCase()
                .includes(texto)

                ||

                (
                    proyecto.vendedor
                    ||
                    ""
                )
                .toLowerCase()
                .includes(texto)

                ||

                (
                    proyecto.contratista
                    ||
                    ""
                )
                .toLowerCase()
                .includes(texto);



            const coincideTipo =

                !filtroTipo.value

                ||

                proyecto.tipoProyecto ===
                filtroTipo.value;



            const coincideEstatus =

                !filtroEstatus.value

                ||

                proyecto.estatus ===
                filtroEstatus.value;



            const coincideVendedor =

                !filtroVendedor.value

                ||

                proyecto.vendedor ===
                filtroVendedor.value;



            return (

                coincideTexto

                &&

                coincideTipo

                &&

                coincideEstatus

                &&

                coincideVendedor

            );

        }

    );

}



// ======================================================
// MOSTRAR PROYECTOS
// ======================================================

function mostrarProyectos() {

    cuerpoTabla.innerHTML =
        "";


    const lista =
        proyectosFiltrados();


    if (
        lista.length === 0
    ) {

        cuerpoTabla.innerHTML = `

            <tr>

                <td
                    colspan="15"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#777;
                    "
                >

                    No hay proyectos para mostrar.

                </td>

            </tr>

        `;


        actualizarContador();


        return;

    }


    lista.forEach(

        function(proyecto) {


            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `


                <td>

                    ${escaparHTML(
                        proyecto.oportunidad
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        proyecto.tipoProyecto
                    )}

                </td>


                <td>

                    ${formatearFecha(
                        proyecto.fechaSolicitud
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        proyecto.vendedor
                    )}

                </td>


                <td>

                    ${formatearFecha(
                        proyecto.fechaCotizacion
                    )}

                </td>


                <td>

                    <span
                        class="
                            estatus
                            ${claseEstatus(
                                proyecto.estatus
                            )}
                        "
                    >

                        ${escaparHTML(
                            proyecto.estatus
                        )}

                    </span>

                </td>


                <td>

                    ${formatearFecha(
                        proyecto.fechaGanado
                    )}

                </td>


                <td>

                    ${formatearDinero(
                        proyecto.precioVenta
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        proyecto.monedaVenta
                    )}

                </td>


                <td class="confidencial">

                    ${formatearDinero(
                        proyecto.precioContratista
                    )}

                </td>


                <td class="confidencial">

                    ${escaparHTML(
                        proyecto.monedaContratista
                    )}

                </td>


                <td class="confidencial">

                    ${escaparHTML(
                        proyecto.contratista
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        proyecto.tipoCambio
                    )}

                </td>


                <td class="confidencial">

                    ${
                        proyecto.margen
                        ?
                        escaparHTML(
                            proyecto.margen
                        )
                        +
                        "%"
                        :
                        ""
                    }

                </td>


                <td class="acciones-tabla">

                    <button
                        class="btn btn-azul"
                        onclick="
                            editarProyecto(
                                ${proyecto.id}
                            )
                        "
                    >

                        Editar

                    </button>


                    <button
                        class="btn btn-rojo"
                        onclick="
                            eliminarProyecto(
                                ${proyecto.id}
                            )
                        "
                    >

                        Eliminar

                    </button>

                </td>


            `;


            cuerpoTabla.appendChild(
                fila
            );

        }

    );


    actualizarContador();

}



// ======================================================
// LIMPIAR FORMULARIO
// ======================================================

function limpiarFormulario() {

    formulario.reset();


    monedaVenta.value =
        "MXN";


    monedaContratista.value =
        "MXN";


    proyectoEditando =
        null;


    document.getElementById(
        "btnGuardar"
    ).disabled =
        false;


    document.getElementById(
        "btnEditar"
    ).disabled =
        true;


    document.getElementById(
        "tituloFormulario"
    ).textContent =
        "Nuevo proyecto";


    actualizarCampoGanado();

}



// ======================================================
// BOTÓN LIMPIAR
// ======================================================

document.getElementById(
    "btnLimpiar"
)
.addEventListener(

    "click",

    limpiarFormulario

);



// ======================================================
// BOTÓN NUEVO
// ======================================================

document.getElementById(
    "btnNuevo"
)
.addEventListener(

    "click",

    function() {


        limpiarFormulario();


        document.getElementById(
            "seccionFormulario"
        )
        .scrollIntoView(

            {

                behavior:
                    "smooth"

            }

        );

    }

);



// ======================================================
// EDITAR PROYECTO
// ======================================================

function editarProyecto(id) {

    const proyecto =
        proyectos.find(

            function(item) {

                return (
                    item.id ===
                    id
                );

            }

        );


    if (!proyecto) {

        return;

    }


    proyectoEditando =
        id;


    oportunidad.value =
        proyecto.oportunidad
        ||
        "";


    tipoProyecto.value =
        proyecto.tipoProyecto
        ||
        "";


    fechaSolicitud.value =
        proyecto.fechaSolicitud
        ||
        "";


    vendedor.value =
        proyecto.vendedor
        ||
        "";


    fechaCotizacion.value =
        proyecto.fechaCotizacion
        ||
        "";


    estatus.value =
        proyecto.estatus
        ||
        "";


    fechaGanado.value =
        proyecto.fechaGanado
        ||
        "";


    precioVenta.value =
        proyecto.precioVenta
        ||
        "";


    monedaVenta.value =
        proyecto.monedaVenta
        ||
        "MXN";


    precioContratista.value =
        proyecto.precioContratista
        ||
        "";


    monedaContratista.value =
        proyecto.monedaContratista
        ||
        "MXN";


    contratista.value =
        proyecto.contratista
        ||
        "";


    tipoCambio.value =
        proyecto.tipoCambio
        ||
        "";


    margen.value =
        proyecto.margen
        ||
        "";


    actualizarCampoGanado();


    document.getElementById(
        "btnGuardar"
    ).disabled =
        true;


    document.getElementById(
        "btnEditar"
    ).disabled =
        false;


    document.getElementById(
        "tituloFormulario"
    ).textContent =

        "Editando oportunidad "

        +

        (
            proyecto.oportunidad
            ||
            ""
        );


    document.getElementById(
        "seccionFormulario"
    )
    .scrollIntoView(

        {

            behavior:
                "smooth"

        }

    );

}



// ======================================================
// GUARDAR CAMBIOS
// ======================================================

document.getElementById(
    "btnEditar"
)
.addEventListener(

    "click",

    function() {


        if (
            proyectoEditando ===
            null
        ) {

            return;

        }


        const indice =
            proyectos.findIndex(

                function(item) {

                    return (
                        item.id ===
                        proyectoEditando
                    );

                }

            );


        if (
            indice === -1
        ) {

            return;

        }


        proyectos[indice] = {


            ...proyectos[indice],


            oportunidad:
                oportunidad.value.trim(),


            tipoProyecto:
                tipoProyecto.value,


            fechaSolicitud:
                fechaSolicitud.value,


            vendedor:
                vendedor.value.trim(),


            fechaCotizacion:
                fechaCotizacion.value,


            estatus:
                estatus.value,


            fechaGanado:
                fechaGanado.value,


            precioVenta:
                precioVenta.value,


            monedaVenta:
                monedaVenta.value,


            precioContratista:
                precioContratista.value,


            monedaContratista:
                monedaContratista.value,


            contratista:
                contratista.value.trim(),


            tipoCambio:
                tipoCambio.value,


            margen:
                margen.value

        };


        guardarLocalStorage();


        limpiarFormulario();


        actualizarSistema();

    }

);



// ======================================================
// ELIMINAR PROYECTO
// ======================================================

function eliminarProyecto(id) {

    const confirmar =
        confirm(
            "¿Seguro que quieres eliminar este proyecto?"
        );


    if (!confirmar) {

        return;

    }


    proyectos =
        proyectos.filter(

            function(item) {

                return (
                    item.id !==
                    id
                );

            }

        );


    guardarLocalStorage();


    actualizarSistema();

}



// ======================================================
// CONTADOR
// ======================================================

function actualizarContador() {

    const contador =
        document.getElementById(
            "contadorProyectos"
        );


    if (
        proyectos.length ===
        1
    ) {

        contador.textContent =
            "1 proyecto registrado";

    }

    else {

        contador.textContent =

            proyectos.length

            +

            " proyectos registrados";

    }

}



// ======================================================
// FILTRO DE VENDEDORES
// ======================================================

function actualizarFiltroVendedores() {

    const vendedorActual =
        filtroVendedor.value;


    const vendedores = [

        ...new Set(

            proyectos

            .map(

                function(proyecto) {

                    return (

                        proyecto.vendedor
                        ||
                        ""

                    ).trim();

                }

            )

            .filter(Boolean)

        )

    ].sort();


    filtroVendedor.innerHTML =

        '<option value="">Todos los vendedores</option>';


    vendedores.forEach(

        function(nombre) {


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                nombre;


            option.textContent =
                nombre;


            filtroVendedor.appendChild(
                option
            );

        }

    );


    if (
        vendedores.includes(
            vendedorActual
        )
    ) {

        filtroVendedor.value =
            vendedorActual;

    }

}



// ======================================================
// EVENTOS FILTROS
// ======================================================

buscar.addEventListener(

    "input",

    mostrarProyectos

);


filtroTipo.addEventListener(

    "change",

    mostrarProyectos

);


filtroEstatus.addEventListener(

    "change",

    mostrarProyectos

);


filtroVendedor.addEventListener(

    "change",

    mostrarProyectos

);



// ======================================================
// LIMPIAR FILTROS
// ======================================================

document.getElementById(
    "btnLimpiarFiltros"
)
.addEventListener(

    "click",

    function() {


        buscar.value =
            "";


        filtroTipo.value =
            "";


        filtroEstatus.value =
            "";


        filtroVendedor.value =
            "";


        mostrarProyectos();

    }

);



// ======================================================
// FECHA ACTUAL
// ======================================================

function datosFechaActual() {

    const hoy =
        new Date();


    const anio =
        hoy.getFullYear();


    const mes =
        hoy.getMonth();


    const mesNumero =
        String(
            mes + 1
        )
        .padStart(
            2,
            "0"
        );


    const prefijoMes =

        anio
        +
        "-"
        +
        mesNumero;


    const ultimoDia =
        new Date(

            anio,

            mes + 1,

            0

        ).getDate();


    return {

        hoy,

        anio,

        mes,

        mesNumero,

        prefijoMes,

        ultimoDia

    };

}



// ======================================================
// KPIs
// ======================================================

function actualizarKPIs() {

    const fecha =
        datosFechaActual();


    const cotizacionesMes =
        proyectos.filter(

            function(proyecto) {

                return (

                    proyecto.fechaCotizacion

                    &&

                    proyecto.fechaCotizacion
                    .startsWith(
                        fecha.prefijoMes
                    )

                );

            }

        );


    const ganadosMes =
        proyectos.filter(

            function(proyecto) {

                return (

                    proyecto.estatus ===
                    "Ganado"

                    &&

                    proyecto.fechaGanado

                    &&

                    proyecto.fechaGanado
                    .startsWith(
                        fecha.prefijoMes
                    )

                );

            }

        );


    const montoCotizado =
        cotizacionesMes.reduce(

            function(total, proyecto) {

                return (

                    total

                    +

                    precioVentaMXN(
                        proyecto
                    )

                );

            },

            0

        );


    const montoVendido =
        ganadosMes.reduce(

            function(total, proyecto) {

                return (

                    total

                    +

                    precioVentaMXN(
                        proyecto
                    )

                );

            },

            0

        );


    let conversion =
        0;


    if (
        montoCotizado > 0
    ) {

        conversion =

            (
                montoVendido
                /
                montoCotizado
            )

            *

            100;

    }


    document.getElementById(
        "kpiCotizado"
    ).textContent =
        formatearMXN(
            montoCotizado
        );


    document.getElementById(
        "kpiVendido"
    ).textContent =
        formatearMXN(
            montoVendido
        );


    document.getElementById(
        "kpiCotizaciones"
    ).textContent =
        cotizacionesMes.length;


    document.getElementById(
        "kpiConversion"
    ).textContent =

        conversion.toLocaleString(

            "es-MX",

            {

                maximumFractionDigits:
                    1

            }

        )

        +

        "%";


    const nombreMes =
        fecha.hoy.toLocaleDateString(

            "es-MX",

            {

                month:
                    "long",

                year:
                    "numeric"

            }

        );


    document.getElementById(
        "periodoActual"
    ).textContent =

        "Del 01 al "

        +

        String(
            fecha.ultimoDia
        )
        .padStart(
            2,
            "0"
        )

        +

        " de "

        +

        nombreMes;


    const sinTC =
        proyectos.filter(
            requiereTipoCambio
        );


    const nota =
        document.getElementById(
            "notaTipoCambio"
        );


    if (
        sinTC.length > 0
    ) {

        nota.textContent =

            "Nota: existen "

            +

            sinTC.length

            +

            " proyecto(s) en USD sin tipo de cambio. "

            +

            "Esos importes no se incluyen en los totales en MXN.";

    }

    else {

        nota.textContent =
            "";

    }

}



// ======================================================
// DATOS MENSUALES
// ======================================================

function obtenerDatosMensuales() {

    const fecha =
        datosFechaActual();


    const montos =
        new Array(12)
        .fill(0);


    const cantidades =
        new Array(12)
        .fill(0);


    proyectos.forEach(

        function(proyecto) {


            if (
                !proyecto.fechaCotizacion
            ) {

                return;

            }


            const fechaProyecto =
                proyecto.fechaCotizacion
                .split("-");


            const anio =
                Number(
                    fechaProyecto[0]
                );


            const mes =
                Number(
                    fechaProyecto[1]
                )
                -
                1;


            if (
                anio !==
                fecha.anio
            ) {

                return;

            }


            if (
                mes < 0
                ||
                mes > 11
            ) {

                return;

            }


            cantidades[mes]++;


            montos[mes] +=
                precioVentaMXN(
                    proyecto
                );

        }

    );


    return {

        anio:
            fecha.anio,

        montos,

        cantidades

    };

}



// ======================================================
// CREAR GRÁFICA
// ======================================================

function crearGrafica(

    contenedorId,

    valores,

    tipo

) {

    const contenedor =
        document.getElementById(
            contenedorId
        );


    contenedor.innerHTML =
        "";


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

        function(valor, indice) {


            const columna =
                document.createElement(
                    "div"
                );


            columna.className =
                "barra-columna";


            const etiqueta =
                document.createElement(
                    "div"
                );


            etiqueta.className =
                "barra-valor";


            if (
                tipo ===
                "dinero"
            ) {

                etiqueta.textContent =

                    valor > 0

                    ?

                    "$"
                    +
                    numeroCompacto(
                        valor
                    )

                    :

                    "";

            }

            else {

                etiqueta.textContent =

                    valor > 0

                    ?

                    valor

                    :

                    "";

            }


            const barra =
                document.createElement(
                    "div"
                );


            barra.className =

                tipo ===
                "cantidad"

                ?

                "barra barra-cantidad"

                :

                "barra";


            const porcentaje =

                (
                    valor
                    /
                    maximo
                )

                *

                100;


            barra.style.height =

                valor > 0

                ?

                Math.max(
                    porcentaje,
                    4
                )

                +
                "%"

                :

                "2px";


            if (
                tipo ===
                "dinero"
            ) {

                barra.title =

                    meses[indice]

                    +

                    ": "

                    +

                    formatearMXN(
                        valor
                    );

            }

            else {

                barra.title =

                    meses[indice]

                    +

                    ": "

                    +

                    valor

                    +

                    " cotizaciones";

            }


            const mes =
                document.createElement(
                    "div"
                );


            mes.className =
                "barra-mes";


            mes.textContent =
                meses[indice];


            columna.appendChild(
                etiqueta
            );


            columna.appendChild(
                barra
            );


            columna.appendChild(
                mes
            );


            contenedor.appendChild(
                columna
            );

        }

    );

}



// ======================================================
// ACTUALIZAR GRÁFICAS MENSUALES
// ======================================================

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


    document.getElementById(
        "tituloGraficaMonto"
    ).textContent =

        "Monto de venta enviado a Ventas — "

        +

        datos.anio;


    document.getElementById(
        "tituloGraficaCantidad"
    ).textContent =

        "Cotizaciones emitidas por mes — "

        +

        datos.anio;

}



// ======================================================
// RESUMEN POR VENDEDOR
// ======================================================

function obtenerResumenVendedores() {

    const fecha =
        datosFechaActual();


    const resumen = {};


    proyectos.forEach(

        function(proyecto) {


            const nombre =
                (
                    proyecto.vendedor
                    ||
                    ""
                )
                .trim();


            if (!nombre) {

                return;

            }


            if (
                !resumen[nombre]
            ) {

                resumen[nombre] = {

                    vendedor:
                        nombre,

                    cotizaciones:
                        0,

                    montoCotizado:
                        0,

                    ganados:
                        0,

                    montoVendido:
                        0

                };

            }



            // --------------------------------------------
            // COTIZADO
            // --------------------------------------------

            if (

                proyecto.fechaCotizacion

                &&

                proyecto.fechaCotizacion
                .startsWith(
                    fecha.anio
                    +
                    "-"
                )

            ) {

                resumen[nombre]
                    .cotizaciones++;


                resumen[nombre]
                    .montoCotizado +=
                    precioVentaMXN(
                        proyecto
                    );

            }



            // --------------------------------------------
            // VENDIDO
            // --------------------------------------------

            if (

                proyecto.estatus ===
                "Ganado"

                &&

                proyecto.fechaGanado

                &&

                proyecto.fechaGanado
                .startsWith(
                    fecha.anio
                    +
                    "-"
                )

            ) {

                resumen[nombre]
                    .ganados++;


                resumen[nombre]
                    .montoVendido +=
                    precioVentaMXN(
                        proyecto
                    );

            }

        }

    );


    return Object.values(
        resumen
    )
    .sort(

        function(a, b) {

            return (

                b.montoCotizado

                -

                a.montoCotizado

            );

        }

    );

}



// ======================================================
// GRÁFICA VENDEDORES
// ======================================================

function actualizarGraficaVendedores() {

    const contenedor =
        document.getElementById(
            "graficaVendedores"
        );


    const resumen =
        obtenerResumenVendedores();


    contenedor.innerHTML =
        "";


    const fecha =
        datosFechaActual();


    document.getElementById(
        "periodoGraficaVendedores"
    ).textContent =

        "Acumulado del año "

        +

        fecha.anio

        +

        " — valores en MXN equivalente";


    if (
        resumen.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="sin-datos-vendedor">

                No existen datos de vendedores
                para mostrar.

            </div>

        `;


        return;

    }


    let maximo =
        1;


    resumen.forEach(

        function(item) {

            maximo =
                Math.max(

                    maximo,

                    item.montoCotizado,

                    item.montoVendido

                );

        }

    );


    resumen.forEach(

        function(item) {


            const porcentajeCotizado =

                (
                    item.montoCotizado
                    /
                    maximo
                )

                *

                100;


            const porcentajeVendido =

                (
                    item.montoVendido
                    /
                    maximo
                )

                *

                100;


            const fila =
                document.createElement(
                    "div"
                );


            fila.className =
                "vendedor-grafica-fila";


            fila.innerHTML = `


                <div
                    class="vendedor-grafica-nombre"
                >

                    ${escaparHTML(
                        item.vendedor
                    )}

                </div>



                <div class="vendedor-barras">



                    <div
                        class="vendedor-barra-linea"
                    >


                        <div
                            class="vendedor-barra-etiqueta"
                        >

                            Cotizado

                        </div>



                        <div
                            class="vendedor-barra-fondo"
                        >

                            <div
                                class="vendedor-barra-cotizado"
                                style="
                                    width:
                                    ${porcentajeCotizado}%;
                                "
                            >
                            </div>

                        </div>



                        <div
                            class="vendedor-barra-valor"
                        >

                            ${formatearMXN(
                                item.montoCotizado
                            )}

                        </div>


                    </div>



                    <div
                        class="vendedor-barra-linea"
                    >


                        <div
                            class="vendedor-barra-etiqueta"
                        >

                            Vendido

                        </div>



                        <div
                            class="vendedor-barra-fondo"
                        >

                            <div
                                class="vendedor-barra-vendido"
                                style="
                                    width:
                                    ${porcentajeVendido}%;
                                "
                            >
                            </div>

                        </div>



                        <div
                            class="vendedor-barra-valor"
                        >

                            ${formatearMXN(
                                item.montoVendido
                            )}

                        </div>


                    </div>


                </div>


            `;


            contenedor.appendChild(
                fila
            );

        }

    );

}



// ======================================================
// TABLA VENDEDORES
// ======================================================

function actualizarTablaVendedores() {

    const tbody =
        document.getElementById(
            "tablaVendedores"
        );


    tbody.innerHTML =
        "";


    const resumen =
        obtenerResumenVendedores();


    const fecha =
        datosFechaActual();


    if (
        resumen.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:25px;
                        color:#777;
                    "
                >

                    No existen datos para mostrar.

                </td>

            </tr>

        `;

    }


    resumen.forEach(

        function(item) {


            let conversion =
                0;


            if (
                item.montoCotizado > 0
            ) {

                conversion =

                    (
                        item.montoVendido
                        /
                        item.montoCotizado
                    )

                    *

                    100;

            }


            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `


                <td>

                    ${escaparHTML(
                        item.vendedor
                    )}

                </td>


                <td>

                    ${item.cotizaciones}

                </td>


                <td>

                    ${formatearMXN(
                        item.montoCotizado
                    )}

                </td>


                <td>

                    ${item.ganados}

                </td>


                <td>

                    ${formatearMXN(
                        item.montoVendido
                    )}

                </td>


                <td>

                    ${
                        conversion.toLocaleString(

                            "es-MX",

                            {

                                maximumFractionDigits:
                                    1

                            }

                        )
                    }%

                </td>


            `;


            tbody.appendChild(
                fila
            );

        }

    );


    document.getElementById(
        "periodoVendedores"
    ).textContent =

        "Acumulado del año "

        +

        fecha.anio

        +

        " — montos expresados en MXN equivalente";

}



// ======================================================
// MODAL REPORTE
// ======================================================

const modalReporte =
    document.getElementById(
        "modalReporte"
    );


document.getElementById(
    "btnReporte"
)
.addEventListener(

    "click",

    function() {

        modalReporte.style.display =
            "flex";

    }

);


document.getElementById(
    "btnCerrarModal"
)
.addEventListener(

    "click",

    function() {

        modalReporte.style.display =
            "none";

    }

);



// ======================================================
// DESCRIPCIÓN FILTROS
// ======================================================

function descripcionFiltros() {

    const filtros =
        [];


    if (
        filtroTipo.value
    ) {

        filtros.push(

            "Tipo: "

            +

            filtroTipo.value

        );

    }


    if (
        filtroEstatus.value
    ) {

        filtros.push(

            "Estatus: "

            +

            filtroEstatus.value

        );

    }


    if (
        filtroVendedor.value
    ) {

        filtros.push(

            "Vendedor: "

            +

            filtroVendedor.value

        );

    }


    if (
        buscar.value.trim()
    ) {

        filtros.push(

            "Búsqueda: "

            +

            buscar.value.trim()

        );

    }


    if (
        filtros.length ===
        0
    ) {

        return "Todos los proyectos";

    }


    return filtros.join(
        " | "
    );

}



// ======================================================
// PREPARAR IMPRESIÓN
// ======================================================

function prepararImpresion(tipo) {

    modalReporte.style.display =
        "none";


    const ahora =
        new Date();


    const titulo =
        document.getElementById(
            "tituloReporte"
        );


    const datos =
        document.getElementById(
            "datosReporte"
        );


    if (
        tipo ===
        "ventas"
    ) {

        document.body.classList.add(
            "reporte-ventas"
        );


        titulo.textContent =
            "Reporte para Ventas";

    }

    else {

        document.body.classList.remove(
            "reporte-ventas"
        );


        titulo.textContent =
            "Reporte de Proyectos";

    }


    datos.textContent =

        "Generado: "

        +

        ahora.toLocaleString(
            "es-MX"
        )

        +

        " | "

        +

        descripcionFiltros();


    setTimeout(

        function() {

            window.print();

        },

        150

    );

}



// ======================================================
// REPORTE VENTAS
// ======================================================

document.getElementById(
    "btnReporteVentas"
)
.addEventListener(

    "click",

    function() {

        prepararImpresion(
            "ventas"
        );

    }

);



// ======================================================
// REPORTE PROYECTOS
// ======================================================

document.getElementById(
    "btnReporteProyectos"
)
.addEventListener(

    "click",

    function() {

        prepararImpresion(
            "proyectos"
        );

    }

);



// ======================================================
// DESPUÉS DE IMPRIMIR
// ======================================================

window.addEventListener(

    "afterprint",

    function() {

        document.body.classList.remove(
            "reporte-ventas"
        );

    }

);



// ======================================================
// ACTUALIZAR SISTEMA COMPLETO
// ======================================================

function actualizarSistema() {

    actualizarFiltroVendedores();

    mostrarProyectos();

    actualizarKPIs();

    actualizarGraficas();

    actualizarGraficaVendedores();

    actualizarTablaVendedores();

}



// ======================================================
// INICIAR SISTEMA
// ======================================================

actualizarCampoGanado();

actualizarSistema();