// ============================================================
// OBJETIVOS 2026 - SUPABASE
// ============================================================

const YEAR = 2026;

const BASE = {
    cutoff: "2026-06-30",
    sections: {
        colleagues: 100,
        community: 50,
        customers: 53,
        environment: 60,
        shareholders: 43,
        suppliers: 100,
        personal: 25
    },
    values: {
        training: 100,
        serviceOrders: 2,
        communityActivities: 2,
        inclusion: 0,
        engineering: 1,
        installation: 3,
        projectManagement: 0,
        pullThrough: 0,
        fuelReduction: -3,
        orders: 1174919,
        sales: 951594,
        hsSilver: 100,
        supplierContracts: 100,
        english: 0,
        steam: 50
    }
};

const TARGETS = {
    serviceOrders: 2,
    communityActivities: 2,
    inclusion: 1,
    engineering: 6,
    installation: 6,
    projectManagement: 100,
    quoteDays: 5,
    pullThrough: 100000,
    fuelReduction: -5,
    orders: 9711516,
    sales: 9711516,
    gm: 38,
    hsSilver: 100,
    supplierContracts: 100,
    english: 100,
    steam: 100
};

const SECTION_WEIGHTS = {
    colleagues: 15,
    community: 15,
    customers: 25,
    environment: 10,
    shareholders: 25,
    suppliers: 10,
    personal: 0
};

const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const MANUAL_KEYS = [
    "training",
    "serviceOrders",
    "communityActivities",
    "inclusion",
    "projectManagement",
    "pullThrough",
    "fuelReduction",
    "hsSilver",
    "supplierContracts",
    "english",
    "steam"
];

let currentUser = null;
let proyectos = [];

let state = {
    cutoff: BASE.cutoff,
    manual: {
        training: BASE.values.training,
        serviceOrders: BASE.values.serviceOrders,
        communityActivities: BASE.values.communityActivities,
        inclusion: BASE.values.inclusion,
        projectManagement: BASE.values.projectManagement,
        pullThrough: BASE.values.pullThrough,
        fuelReduction: BASE.values.fuelReduction,
        hsSilver: BASE.values.hsSilver,
        supplierContracts: BASE.values.supplierContracts,
        english: BASE.values.english,
        steam: BASE.values.steam
    }
};

let activity = {
    bbs: new Array(12).fill(0),
    take5: new Array(12).fill(0),
    vehiculo: new Array(12).fill(0)
};


// ============================================================
// UTILIDADES
// ============================================================

function clamp(v, min = 0, max = 100) {
    return Math.min(max, Math.max(min, Number(v) || 0));
}

function fmtNumber(v) {
    return Number(v || 0).toLocaleString(
        "en-US",
        { maximumFractionDigits: 2 }
    );
}

function fmtMoney(v) {
    return "$" + Number(v || 0).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}

function fmtPct(v) {
    return `${Math.round(Number(v) || 0)}%`;
}

function ratio(value, target) {
    if (target === 0) {
        return 0;
    }

    return clamp(
        (Number(value || 0) / Number(target)) * 100
    );
}

function fechaANumero(fecha) {
    if (!fecha) {
        return 20260630;
    }

    return Number(
        String(fecha).replaceAll("-", "")
    );
}

function numeroAFecha(numero) {
    const texto = String(
        Math.trunc(Number(numero) || 20260630)
    ).padStart(8, "0");

    if (texto.length !== 8) {
        return BASE.cutoff;
    }

    return (
        texto.slice(0, 4)
        + "-"
        + texto.slice(4, 6)
        + "-"
        + texto.slice(6, 8)
    );
}


// ============================================================
// SESIÓN
// ============================================================

async function obtenerUsuario() {
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (
        error
        ||
        !data
        ||
        !data.session
        ||
        !data.session.user
    ) {
        window.location.replace("login.html");
        return null;
    }

    return data.session.user;
}


// ============================================================
// CARGA DESDE SUPABASE
// ============================================================

async function cargarProyectosSupabase() {
    const { data, error } =
        await supabaseClient
            .from("proyectos")
            .select("*")
            .order(
                "fecha_cotizacion",
                { ascending: true }
            );

    if (error) {
        console.error(
            "Error cargando proyectos:",
            error
        );

        throw new Error(
            "No se pudieron cargar los proyectos: "
            + error.message
        );
    }

    proyectos = (data || []).map(
        function(fila) {
            return {
                id: fila.id,
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
                fechaCotizacion:
                    fila.fecha_cotizacion || "",
                estatus:
                    fila.estatus || "",
                fechaGanado:
                    fila.fecha_ganado || "",
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
                    fila.margen
            };
        }
    );
}

async function cargarObjetivosSupabase() {
    const { data, error } =
        await supabaseClient
            .from("objetivos_2026")
            .select("id,user_id,clave,valor")
            .eq("user_id", currentUser.id);

    if (error) {
        console.error(
            "Error cargando objetivos:",
            error
        );

        throw new Error(
            "No se pudieron cargar los objetivos: "
            + error.message
        );
    }

    (data || []).forEach(
        function(fila) {
            if (fila.clave === "cutoff") {
                state.cutoff =
                    numeroAFecha(fila.valor);
                return;
            }

            if (
                MANUAL_KEYS.includes(
                    fila.clave
                )
            ) {
                state.manual[fila.clave] =
                    Number(fila.valor);
            }
        }
    );
}

async function cargarActividadSupabase() {
    const { data, error } =
        await supabaseClient
            .from("actividad_mensual")
            .select(
                "id,user_id,anio,mes,bbs,take5,revision_vehiculo"
            )
            .eq("user_id", currentUser.id)
            .eq("anio", YEAR)
            .order("mes", { ascending: true });

    if (error) {
        console.error(
            "Error cargando actividad:",
            error
        );

        throw new Error(
            "No se pudo cargar la actividad mensual: "
            + error.message
        );
    }

    activity = {
        bbs: new Array(12).fill(0),
        take5: new Array(12).fill(0),
        vehiculo: new Array(12).fill(0)
    };

    (data || []).forEach(
        function(fila) {
            const indice =
                Number(fila.mes) - 1;

            if (
                indice < 0
                ||
                indice > 11
            ) {
                return;
            }

            activity.bbs[indice] =
                Number(fila.bbs) || 0;

            activity.take5[indice] =
                Number(fila.take5) || 0;

            activity.vehiculo[indice] =
                Number(
                    fila.revision_vehiculo
                ) || 0;
        }
    );
}


// ============================================================
// GUARDADO DE OBJETIVOS EN SUPABASE
// No depende de una restricción UNIQUE.
// Primero busca la fila; si existe actualiza, si no existe inserta.
// ============================================================

async function guardarObjetivo(clave, valor) {
    const { data: existente, error: errorBusqueda } =
        await supabaseClient
            .from("objetivos_2026")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("clave", clave)
            .limit(1);

    if (errorBusqueda) {
        throw errorBusqueda;
    }

    if (
        existente
        &&
        existente.length > 0
    ) {
        const { error } =
            await supabaseClient
                .from("objetivos_2026")
                .update({
                    valor: Number(valor),
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    existente[0].id
                );

        if (error) {
            throw error;
        }

        return;
    }

    const { error } =
        await supabaseClient
            .from("objetivos_2026")
            .insert({
                user_id: currentUser.id,
                clave: clave,
                valor: Number(valor),
                updated_at:
                    new Date().toISOString()
            });

    if (error) {
        throw error;
    }
}


// ============================================================
// GUARDADO DE ACTIVIDAD EN SUPABASE
// ============================================================

async function guardarActividadMes(indiceMes) {
    const mesBD = indiceMes + 1;

    const payload = {
        user_id: currentUser.id,
        anio: YEAR,
        mes: mesBD,
        bbs:
            Number(activity.bbs[indiceMes]) || 0,
        take5:
            Number(activity.take5[indiceMes]) || 0,
        revision_vehiculo:
            Number(
                activity.vehiculo[indiceMes]
            ) || 0
    };

    const { data: existente, error: errorBusqueda } =
        await supabaseClient
            .from("actividad_mensual")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("anio", YEAR)
            .eq("mes", mesBD)
            .limit(1);

    if (errorBusqueda) {
        throw errorBusqueda;
    }

    if (
        existente
        &&
        existente.length > 0
    ) {
        const { error } =
            await supabaseClient
                .from("actividad_mensual")
                .update({
                    bbs: payload.bbs,
                    take5: payload.take5,
                    revision_vehiculo:
                        payload.revision_vehiculo
                })
                .eq(
                    "id",
                    existente[0].id
                );

        if (error) {
            throw error;
        }

        return;
    }

    const { error } =
        await supabaseClient
            .from("actividad_mensual")
            .insert(payload);

    if (error) {
        throw error;
    }
}


// ============================================================
// MÉTRICAS DE PROYECTOS
// ============================================================

function isAfterCut(date) {
    return (
        !!date
        &&
        date > state.cutoff
        &&
        date.startsWith(`${YEAR}-`)
    );
}

function wonAfterCut(project) {
    return (
        project.estatus === "Ganado"
        &&
        isAfterCut(
            project.fechaGanado
        )
    );
}

function businessDays(start, end) {
    if (!start || !end) {
        return null;
    }

    const s =
        new Date(start + "T12:00:00");

    const e =
        new Date(end + "T12:00:00");

    if (e < s) {
        return null;
    }

    let count = 0;
    const d = new Date(s);

    while (d <= e) {
        const day = d.getDay();

        if (
            day !== 0
            &&
            day !== 6
        ) {
            count++;
        }

        d.setDate(
            d.getDate() + 1
        );
    }

    return Math.max(
        0,
        count - 1
    );
}

function projectMetrics() {
    const newWon =
        proyectos.filter(
            wonAfterCut
        );

    const engineeringNew =
        newWon.filter(
            p =>
                p.tipoProyecto
                ===
                "Ingeniería"
        ).length;

    const installationNew =
        newWon.filter(
            p =>
                p.tipoProyecto
                ===
                "Instalación"
        ).length;

    const wonAmount =
        newWon.reduce(
            (
                sum,
                p
            ) =>
                sum
                +
                (
                    Number(
                        p.precioVenta
                    )
                    ||
                    0
                ),
            0
        );

    const gmValues =
        newWon
            .map(
                p =>
                    Number(
                        p.margen
                    )
            )
            .filter(
                v =>
                    Number.isFinite(v)
                    &&
                    v > 0
            );

    const avgGM =
        gmValues.length
            ?
            gmValues.reduce(
                (a, b) =>
                    a + b,
                0
            )
            /
            gmValues.length
            :
            null;

    const quoted =
        proyectos.filter(
            p =>
                isAfterCut(
                    p.fechaCotizacion
                )
                &&
                p.fechaSolicitud
                &&
                p.fechaCotizacion
        );

    const quoteDays =
        quoted
            .map(
                p =>
                    businessDays(
                        p.fechaSolicitud,
                        p.fechaCotizacion
                    )
            )
            .filter(
                v =>
                    v !== null
            );

    const avgQuoteDays =
        quoteDays.length
            ?
            quoteDays.reduce(
                (a, b) =>
                    a + b,
                0
            )
            /
            quoteDays.length
            :
            null;

    return {
        newWonCount:
            newWon.length,

        wonAmount,

        engineering:
            Math.min(
                TARGETS.engineering,
                BASE.values.engineering
                +
                engineeringNew
            ),

        installation:
            Math.min(
                TARGETS.installation,
                BASE.values.installation
                +
                installationNew
            ),

        orders:
            BASE.values.orders
            +
            wonAmount,

        sales:
            BASE.values.sales
            +
            wonAmount,

        avgGM,
        avgQuoteDays
    };
}


// ============================================================
// AVANCE POR SECCIÓN
// ============================================================

function sectionProgress(metrics) {
    const colleagues =
        (
            clamp(
                state.manual.training
            )
            *
            0.5
        )
        +
        (
            ratio(
                state.manual.serviceOrders,
                TARGETS.serviceOrders
            )
            *
            0.5
        );

    const community =
        (
            ratio(
                state.manual.communityActivities,
                TARGETS.communityActivities
            )
            *
            0.5
        )
        +
        (
            ratio(
                state.manual.inclusion,
                TARGETS.inclusion
            )
            *
            0.5
        );

    const engBasePct =
        ratio(
            BASE.values.engineering,
            TARGETS.engineering
        );

    const instBasePct =
        ratio(
            BASE.values.installation,
            TARGETS.installation
        );

    const engNowPct =
        ratio(
            metrics.engineering,
            TARGETS.engineering
        );

    const instNowPct =
        ratio(
            metrics.installation,
            TARGETS.installation
        );

    let customers =
        BASE.sections.customers
        +
        (
            engNowPct
            -
            engBasePct
        )
        *
        0.2
        +
        (
            instNowPct
            -
            instBasePct
        )
        *
        0.2;

    if (
        state.manual.projectManagement
        >
        0
    ) {
        customers +=
            clamp(
                state.manual.projectManagement
            )
            *
            0.2;
    }

    if (
        state.manual.pullThrough
        >
        0
    ) {
        customers +=
            ratio(
                state.manual.pullThrough,
                TARGETS.pullThrough
            )
            *
            0.2;
    }

    customers =
        clamp(customers);

    const environment =
        clamp(
            (
                Math.abs(
                    state.manual.fuelReduction
                )
                /
                Math.abs(
                    TARGETS.fuelReduction
                )
            )
            *
            100
        );

    const baseOrderPct =
        ratio(
            BASE.values.orders,
            TARGETS.orders
        );

    const baseSalesPct =
        ratio(
            BASE.values.sales,
            TARGETS.sales
        );

    const nowOrderPct =
        ratio(
            metrics.orders,
            TARGETS.orders
        );

    const nowSalesPct =
        ratio(
            metrics.sales,
            TARGETS.sales
        );

    let shareholders =
        BASE.sections.shareholders
        +
        (
            nowOrderPct
            -
            baseOrderPct
        )
        *
        0.3
        +
        (
            nowSalesPct
            -
            baseSalesPct
        )
        *
        0.3;

    if (
        metrics.avgGM
        !==
        null
    ) {
        const gmPerformance =
            ratio(
                metrics.avgGM,
                TARGETS.gm
            );

        shareholders =
            Math.max(
                shareholders,
                clamp(
                    (
                        nowOrderPct
                        *
                        0.3
                    )
                    +
                    (
                        nowSalesPct
                        *
                        0.3
                    )
                    +
                    (
                        gmPerformance
                        *
                        0.4
                    )
                )
            );
    }

    shareholders =
        clamp(shareholders);

    const suppliers =
        (
            clamp(
                state.manual.hsSilver
            )
            *
            0.5
        )
        +
        (
            clamp(
                state.manual.supplierContracts
            )
            *
            0.5
        );

    const personal =
        (
            clamp(
                state.manual.english
            )
            *
            0.5
        )
        +
        (
            clamp(
                state.manual.steam
            )
            *
            0.5
        );

    return {
        colleagues,
        community,
        customers,
        environment,
        shareholders,
        suppliers,
        personal
    };
}

function overallProgress(sections) {
    let sum = 0;
    let weight = 0;

    for (
        const [key, w]
        of
        Object.entries(
            SECTION_WEIGHTS
        )
    ) {
        if (w > 0) {
            sum +=
                sections[key]
                *
                w;

            weight += w;
        }
    }

    return weight
        ?
        sum / weight
        :
        0;
}


// ============================================================
// COMPONENTES HTML
// ============================================================

function manualButtons(
    key,
    step = 1,
    min = 0,
    max = 100
) {
    return `
        <div class="manual-controls">
            <button
                data-manual="${key}"
                data-step="${-step}"
                data-min="${min}"
                data-max="${max}"
            >−</button>

            <button
                class="plus"
                data-manual="${key}"
                data-step="${step}"
                data-min="${min}"
                data-max="${max}"
            >+</button>
        </div>
    `;
}

function goalHtml({
    title,
    meta,
    progress,
    value,
    subvalue,
    chip,
    chipClass = "",
    controls = ""
}) {
    return `
        <div class="goal">
            <div>
                <div class="goal-title">
                    ${title}
                </div>

                <div class="goal-meta">
                    ${meta || ""}
                </div>

                ${
                    chip
                        ?
                        `<span class="status-chip ${chipClass}">
                            ${chip}
                        </span>`
                        :
                        ""
                }
            </div>

            <div class="goal-bar">
                <div
                    style="width:${clamp(progress)}%"
                ></div>
            </div>

            <div class="goal-value">
                <strong>
                    ${value}
                </strong>

                ${
                    subvalue
                        ?
                        `<small>${subvalue}</small>`
                        :
                        ""
                }

                ${controls}
            </div>
        </div>
    `;
}

function perspectiveHtml(
    key,
    title,
    weight,
    progress,
    goals
) {
    const complete =
        progress >= 99.5
            ?
            "complete"
            :
            "";

    return `
        <section class="perspective ${complete}">
            <div class="perspective-header">
                <div class="perspective-title">
                    <h3>
                        ${title}
                    </h3>

                    <small>
                        Peso ${weight}% · vencimiento 31/12/2026
                    </small>
                </div>

                <div class="section-bar">
                    <div
                        style="width:${clamp(progress)}%"
                    ></div>
                </div>

                <div class="section-percent">
                    ${fmtPct(progress)}
                </div>
            </div>

            <div class="goals">
                ${goals}
            </div>
        </section>
    `;
}


// ============================================================
// RENDER DE OBJETIVOS
// ============================================================

function renderObjectives() {
    const m =
        projectMetrics();

    const s =
        sectionProgress(m);

    const general =
        overallProgress(s);

    document
        .getElementById(
            "avanceGeneral"
        )
        .textContent =
        fmtPct(general);

    document
        .getElementById(
            "barraGeneral"
        )
        .style.width =
        `${clamp(general)}%`;

    document
        .getElementById(
            "fechaCorte"
        )
        .value =
        state.cutoff;

    document
        .getElementById(
            "proyectosGanadosNuevos"
        )
        .textContent =
        m.newWonCount;

    document
        .getElementById(
            "montoGanadoNuevo"
        )
        .textContent =
        fmtMoney(
            m.wonAmount
        );

    document
        .getElementById(
            "promedioCotizacion"
        )
        .textContent =
        m.avgQuoteDays === null
            ?
            "—"
            :
            m.avgQuoteDays
                .toFixed(1);

    document
        .getElementById(
            "seccionesCumplidas"
        )
        .textContent =
        Object
            .entries(s)
            .filter(
                ([key, value]) =>
                    SECTION_WEIGHTS[key] > 0
                    &&
                    value >= 99.5
            )
            .length;

    const quoteProgress =
        m.avgQuoteDays === null
            ?
            0
            :
            (
                m.avgQuoteDays
                <=
                TARGETS.quoteDays
                    ?
                    100
                    :
                    clamp(
                        (
                            TARGETS.quoteDays
                            /
                            m.avgQuoteDays
                        )
                        *
                        100
                    )
            );

    const gmProgress =
        m.avgGM === null
            ?
            0
            :
            ratio(
                m.avgGM,
                TARGETS.gm
            );

    let html = "";

    html +=
        perspectiveHtml(
            "colleagues",
            "Create sustainable value for our Colleagues",
            15,
            s.colleagues,

            goalHtml({
                title:
                    "Participar en plan de capacitación 2026",
                meta:
                    "Meta: 100%",
                progress:
                    state.manual.training,
                value:
                    `${state.manual.training}%`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "training",
                        10,
                        0,
                        100
                    )
            })
            +
            goalHtml({
                title:
                    "Generar 2 orders en conjunto con Servicios",
                meta:
                    "Instalación + garantía extendida / ingeniería + auditoría",
                progress:
                    ratio(
                        state.manual.serviceOrders,
                        TARGETS.serviceOrders
                    ),
                value:
                    `${state.manual.serviceOrders} / ${TARGETS.serviceOrders}`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "serviceOrders",
                        1,
                        0,
                        TARGETS.serviceOrders
                    )
            })
        );

    html +=
        perspectiveHtml(
            "community",
            "Create sustainable value for our Community",
            15,
            s.community,

            goalHtml({
                title:
                    "Participar en al menos dos actividades de apoyo a la comunidad",
                meta:
                    "Meta: 2 actividades",
                progress:
                    ratio(
                        state.manual.communityActivities,
                        TARGETS.communityActivities
                    ),
                value:
                    `${state.manual.communityActivities} / ${TARGETS.communityActivities}`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "communityActivities",
                        1,
                        0,
                        TARGETS.communityActivities
                    )
            })
            +
            goalHtml({
                title:
                    "Participar en la actividad de inclusión durante 2026",
                meta:
                    "Meta: 1 actividad",
                progress:
                    ratio(
                        state.manual.inclusion,
                        TARGETS.inclusion
                    ),
                value:
                    `${state.manual.inclusion} / ${TARGETS.inclusion}`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "inclusion",
                        1,
                        0,
                        TARGETS.inclusion
                    )
            })
        );

    html +=
        perspectiveHtml(
            "customers",
            "Create sustainable value for our Customers",
            25,
            s.customers,

            goalHtml({
                title:
                    "Confirmar mediante PO al menos 1 Ingeniería por cada vendedor asignado",
                meta:
                    "Base medio año: 1 / 6 · se suman proyectos Ganados de tipo Ingeniería después del corte",
                progress:
                    ratio(
                        m.engineering,
                        TARGETS.engineering
                    ),
                value:
                    `${m.engineering} / ${TARGETS.engineering}`,
                chip:
                    "Automático",
                chipClass:
                    "auto"
            })
            +
            goalHtml({
                title:
                    "Confirmar mediante PO al menos 1 Instalación por cada vendedor asignado",
                meta:
                    "Base medio año: 3 / 6 · se suman proyectos Ganados de tipo Instalación después del corte",
                progress:
                    ratio(
                        m.installation,
                        TARGETS.installation
                    ),
                value:
                    `${m.installation} / ${TARGETS.installation}`,
                chip:
                    "Automático",
                chipClass:
                    "auto"
            })
            +
            goalHtml({
                title:
                    "Implementar al 100% el proceso de Gestión de Proyectos",
                meta:
                    "El avance de este subobjetivo no aparece en las capturas de medio año; queda manual desde ahora.",
                progress:
                    state.manual.projectManagement,
                value:
                    `${state.manual.projectManagement}%`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "projectManagement",
                        10,
                        0,
                        100
                    )
            })
            +
            goalHtml({
                title:
                    "Cotizar en promedio en menos de 5 días hábiles",
                meta:
                    "Calculado con Fecha solicitud de Ventas y Fecha envío de cotización, posteriores al corte. Se excluyen sábados y domingos.",
                progress:
                    quoteProgress,
                value:
                    m.avgQuoteDays === null
                        ?
                        "Sin datos"
                        :
                        `${m.avgQuoteDays.toFixed(1)} días`,
                chip:
                    "Automático",
                chipClass:
                    "auto"
            })
            +
            goalHtml({
                title:
                    "Pull-Through derivado de instalaciones ejecutadas",
                meta:
                    "Meta formal de tabla: $100,000. Avance manual.",
                progress:
                    ratio(
                        state.manual.pullThrough,
                        TARGETS.pullThrough
                    ),
                value:
                    fmtMoney(
                        state.manual.pullThrough
                    ),
                subvalue:
                    ` / ${fmtMoney(TARGETS.pullThrough)}`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "pullThrough",
                        5000,
                        0,
                        TARGETS.pullThrough
                    )
            })
        );

    html +=
        perspectiveHtml(
            "environment",
            "Create sustainable value for our Environment",
            10,
            s.environment,

            goalHtml({
                title:
                    "Lograr una reducción en el consumo de gasolina de 5% vs 2025",
                meta:
                    "Actualización de medio año: -3%",
                progress:
                    s.environment,
                value:
                    `${state.manual.fuelReduction}%`,
                subvalue:
                    " Meta: -5%",
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "fuelReduction",
                        1,
                        -5,
                        0
                    )
            })
        );

    html +=
        perspectiveHtml(
            "shareholders",
            "Create sustainable value for our Shareholders",
            25,
            s.shareholders,

            goalHtml({
                title:
                    "Cumplir el presupuesto en ORDERS",
                meta:
                    `Base medio año: ${fmtNumber(BASE.values.orders)} · suma proyectos Ganados después del corte`,
                progress:
                    ratio(
                        m.orders,
                        TARGETS.orders
                    ),
                value:
                    fmtMoney(
                        m.orders
                    ),
                subvalue:
                    ` / ${fmtMoney(TARGETS.orders)}`,
                chip:
                    "Automático",
                chipClass:
                    "auto"
            })
            +
            goalHtml({
                title:
                    "Cumplir el presupuesto en SALES",
                meta:
                    `Base medio año: ${fmtNumber(BASE.values.sales)} · por ahora suma los mismos proyectos Ganados después del corte`,
                progress:
                    ratio(
                        m.sales,
                        TARGETS.sales
                    ),
                value:
                    fmtMoney(
                        m.sales
                    ),
                subvalue:
                    ` / ${fmtMoney(TARGETS.sales)}`,
                chip:
                    "Automático",
                chipClass:
                    "auto"
            })
            +
            goalHtml({
                title:
                    "GM (Gross Margin) promedio ≥ 38%",
                meta:
                    "Se calcula con el campo Margen de proyectos Ganados posteriores al corte.",
                progress:
                    gmProgress,
                value:
                    m.avgGM === null
                        ?
                        "Sin datos"
                        :
                        `${m.avgGM.toFixed(1)}%`,
                subvalue:
                    " Meta: ≥38%",
                chip:
                    "Automático",
                chipClass:
                    "auto"
            })
        );

    html +=
        perspectiveHtml(
            "suppliers",
            "Create sustainable value for our Suppliers",
            10,
            s.suppliers,

            goalHtml({
                title:
                    "Implementar las acciones necesarias del nivel plata en Group H&S Excellence",
                meta:
                    "Actualización de medio año: 100%",
                progress:
                    state.manual.hsSilver,
                value:
                    `${state.manual.hsSilver}%`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "hsSilver",
                        10,
                        0,
                        100
                    )
            })
            +
            goalHtml({
                title:
                    "Elaborar 100% de contratos a proveedores de las PO realizadas",
                meta:
                    "Actualización de medio año: 100%",
                progress:
                    state.manual.supplierContracts,
                value:
                    `${state.manual.supplierContracts}%`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "supplierContracts",
                        10,
                        0,
                        100
                    )
            })
        );

    html +=
        perspectiveHtml(
            "personal",
            "My personal development and special Projects",
            0,
            s.personal,

            goalHtml({
                title:
                    "Tomar curso de inglés",
                meta:
                    "Actualización de medio año: 0%",
                progress:
                    state.manual.english,
                value:
                    `${state.manual.english}%`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "english",
                        10,
                        0,
                        100
                    )
            })
            +
            goalHtml({
                title:
                    "Aprender sobre Vapor",
                meta:
                    "Actualización de medio año: 50%",
                progress:
                    state.manual.steam,
                value:
                    `${state.manual.steam}%`,
                chip:
                    "Manual",
                controls:
                    manualButtons(
                        "steam",
                        10,
                        0,
                        100
                    )
            })
        );

    document
        .getElementById(
            "objetivosContainer"
        )
        .innerHTML =
        html;
}


// ============================================================
// EVENTOS DE OBJETIVOS MANUALES
// ============================================================

function setupManualEvents() {
    document
        .getElementById(
            "objetivosContainer"
        )
        .addEventListener(
            "click",
            async function(e) {
                const btn =
                    e.target.closest(
                        "button[data-manual]"
                    );

                if (!btn) {
                    return;
                }

                const key =
                    btn.dataset.manual;

                const step =
                    Number(
                        btn.dataset.step
                    );

                const min =
                    Number(
                        btn.dataset.min
                    );

                const max =
                    Number(
                        btn.dataset.max
                    );

                const current =
                    Number(
                        state.manual[key]
                        ||
                        0
                    );

                const previous =
                    current;

                const next =
                    Math.min(
                        max,
                        Math.max(
                            min,
                            current + step
                        )
                    );

                state.manual[key] =
                    next;

                renderObjectives();

                try {
                    await guardarObjetivo(
                        key,
                        next
                    );
                }
                catch (error) {
                    console.error(error);

                    state.manual[key] =
                        previous;

                    renderObjectives();

                    alert(
                        "No se pudo guardar el avance en Supabase.\n\n"
                        +
                        error.message
                    );
                }
            }
        );
}


// ============================================================
// CORTE BASE
// ============================================================

function setupCutoff() {
    document
        .getElementById(
            "guardarCorte"
        )
        .addEventListener(
            "click",
            async function() {
                const input =
                    document.getElementById(
                        "fechaCorte"
                    );

                const button =
                    document.getElementById(
                        "guardarCorte"
                    );

                const value =
                    input.value;

                if (!value) {
                    return;
                }

                const previous =
                    state.cutoff;

                state.cutoff =
                    value;

                renderObjectives();

                const original =
                    button.textContent;

                button.disabled =
                    true;

                button.textContent =
                    "Guardando...";

                try {
                    await guardarObjetivo(
                        "cutoff",
                        fechaANumero(value)
                    );

                    button.textContent =
                        "Guardado";
                }
                catch (error) {
                    console.error(error);

                    state.cutoff =
                        previous;

                    renderObjectives();

                    button.textContent =
                        original;

                    alert(
                        "No se pudo guardar el corte base.\n\n"
                        +
                        error.message
                    );
                }
                finally {
                    setTimeout(
                        function() {
                            button.disabled =
                                false;

                            button.textContent =
                                original;
                        },
                        800
                    );
                }
            }
        );
}


// ============================================================
// ACTIVIDAD MENSUAL
// ============================================================

function setupActivity() {
    const sel =
        document.getElementById(
            "mesActividad"
        );

    sel.innerHTML = "";

    months.forEach(
        function(m, i) {
            const op =
                document.createElement(
                    "option"
                );

            op.value = i;
            op.textContent = m;

            sel.appendChild(op);
        }
    );

    const currentMonth =
        new Date().getFullYear()
        ===
        YEAR
            ?
            new Date().getMonth()
            :
            0;

    sel.value =
        currentMonth;

    sel.addEventListener(
        "change",
        renderActivity
    );

    document
        .querySelectorAll(
            "button[data-counter]"
        )
        .forEach(
            function(btn) {
                btn.addEventListener(
                    "click",
                    async function() {
                        const type =
                            btn.dataset.counter;

                        const delta =
                            Number(
                                btn.dataset.delta
                            );

                        const month =
                            Number(
                                sel.value
                            );

                        const previous =
                            Number(
                                activity[type][month]
                            )
                            ||
                            0;

                        activity[type][month] =
                            Math.max(
                                0,
                                previous + delta
                            );

                        renderActivity();

                        document
                            .querySelectorAll(
                                "button[data-counter]"
                            )
                            .forEach(
                                b =>
                                    b.disabled =
                                        true
                            );

                        try {
                            await guardarActividadMes(
                                month
                            );
                        }
                        catch (error) {
                            console.error(error);

                            activity[type][month] =
                                previous;

                            renderActivity();

                            alert(
                                "No se pudo guardar la actividad mensual.\n\n"
                                +
                                error.message
                            );
                        }
                        finally {
                            document
                                .querySelectorAll(
                                    "button[data-counter]"
                                )
                                .forEach(
                                    b =>
                                        b.disabled =
                                            false
                                );
                        }
                    }
                );
            }
        );
}

function renderActivity() {
    const month =
        Number(
            document
                .getElementById(
                    "mesActividad"
                )
                .value
            ||
            0
        );

    document
        .getElementById(
            "bbsValor"
        )
        .textContent =
        activity.bbs[month]
        ||
        0;

    document
        .getElementById(
            "take5Valor"
        )
        .textContent =
        activity.take5[month]
        ||
        0;

    document
        .getElementById(
            "vehiculoValor"
        )
        .textContent =
        activity.vehiculo[month]
        ||
        0;

    const max =
        Math.max(
            1,
            ...activity.bbs,
            ...activity.take5,
            ...activity.vehiculo
        );

    let html = "";

    for (
        let i = 0;
        i < 12;
        i++
    ) {
        const b =
            activity.bbs[i]
            ||
            0;

        const t =
            activity.take5[i]
            ||
            0;

        const v =
            activity.vehiculo[i]
            ||
            0;

        html += `
            <div class="month-chart-item">
                <div class="month-bars">
                    <div
                        class="mini-bar bbs"
                        style="height:${Math.max(1, (b / max) * 100)}%"
                    >
                        <span>${b || ""}</span>
                    </div>

                    <div
                        class="mini-bar take5"
                        style="height:${Math.max(1, (t / max) * 100)}%"
                    >
                        <span>${t || ""}</span>
                    </div>

                    <div
                        class="mini-bar vehiculo"
                        style="height:${Math.max(1, (v / max) * 100)}%"
                    >
                        <span>${v || ""}</span>
                    </div>
                </div>

                <div class="month-label">
                    ${months[i]}
                </div>
            </div>
        `;
    }

    document
        .getElementById(
            "graficaActividad"
        )
        .innerHTML =
        html;
}


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function iniciarObjetivos() {
    try {
        currentUser =
            await obtenerUsuario();

        if (!currentUser) {
            return;
        }

        await Promise.all([
            cargarProyectosSupabase(),
            cargarObjetivosSupabase(),
            cargarActividadSupabase()
        ]);

        setupManualEvents();
        setupCutoff();
        setupActivity();

        renderObjectives();
        renderActivity();
    }
    catch (error) {
        console.error(
            "Error al iniciar Objetivos:",
            error
        );

        alert(
            "No se pudo cargar el Dashboard de Objetivos.\n\n"
            +
            error.message
        );
    }
}

iniciarObjetivos();
