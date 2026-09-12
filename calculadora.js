const precioContratista = document.getElementById("precioContratista");
const monedaContratista = document.getElementById("monedaContratista");
const margen = document.getElementById("margen");
const tipoCambio = document.getElementById("tipoCambio");

const resultadoSubtotal = document.getElementById("resultadoSubtotal");
const resultadoIVA = document.getElementById("resultadoIVA");
const resultadoTotal = document.getElementById("resultadoTotal");
const costoBaseUSD = document.getElementById("costoBaseUSD");
const margenAplicado = document.getElementById("margenAplicado");
const mensajeError = document.getElementById("mensajeError");
const ayudaTipoCambio = document.getElementById("ayudaTipoCambio");
const btnCopiar = document.getElementById("btnCopiar");

const IVA = 0.16;

let ultimoResultado = null;

function formatearUSD(valor) {
    return "USD $" + Number(valor || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function mostrarError(texto) {
    mensajeError.textContent = texto;
    mensajeError.classList.remove("oculto");
}

function ocultarError() {
    mensajeError.textContent = "";
    mensajeError.classList.add("oculto");
}

function actualizarAyudaTipoCambio() {
    if (monedaContratista.value === "USD") {
        ayudaTipoCambio.textContent = "No afecta el cálculo cuando el contratista ya cotiza en USD.";
    } else {
        ayudaTipoCambio.textContent = "Necesario cuando el costo del contratista está en MXN.";
    }
}

function calcular() {
    ocultarError();

    const costoOriginal = Number(precioContratista.value);
    const moneda = monedaContratista.value;
    const margenPorcentaje = Number(margen.value);
    const tc = Number(tipoCambio.value);

    if (!costoOriginal || costoOriginal <= 0) {
        mostrarError("Ingresa un precio de contratista mayor a cero.");
        return;
    }

    if (![38, 40, 45, 50].includes(margenPorcentaje)) {
        mostrarError("Selecciona un margen válido.");
        return;
    }

    if (moneda === "MXN" && (!tc || tc <= 0)) {
        mostrarError("Ingresa el tipo de cambio interno para convertir el costo de MXN a USD.");
        return;
    }

    const costoUSD = moneda === "MXN"
        ? costoOriginal / tc
        : costoOriginal;

    const margenDecimal = margenPorcentaje / 100;

    // Misma lógica del Excel proporcionado:
    // Precio de venta = costo / (1 - margen)
    const subtotalUSD = costoUSD / (1 - margenDecimal);
    const ivaUSD = subtotalUSD * IVA;
    const totalUSD = subtotalUSD + ivaUSD;

    resultadoSubtotal.textContent = formatearUSD(subtotalUSD);
    resultadoIVA.textContent = formatearUSD(ivaUSD);
    resultadoTotal.textContent = formatearUSD(totalUSD);
    costoBaseUSD.textContent = formatearUSD(costoUSD);
    margenAplicado.textContent = margenPorcentaje + "%";

    ultimoResultado = {
        costoOriginal,
        moneda,
        margenPorcentaje,
        tc,
        costoUSD,
        subtotalUSD,
        ivaUSD,
        totalUSD
    };

    btnCopiar.disabled = false;

    localStorage.setItem("calculadoraCotizacionUltimoTC", tipoCambio.value || "");
}

function limpiar() {
    precioContratista.value = "";
    monedaContratista.value = "MXN";
    margen.value = "38";

    resultadoSubtotal.textContent = "USD $0.00";
    resultadoIVA.textContent = "USD $0.00";
    resultadoTotal.textContent = "USD $0.00";
    costoBaseUSD.textContent = "USD $0.00";
    margenAplicado.textContent = "38%";

    ultimoResultado = null;
    btnCopiar.disabled = true;
    ocultarError();
    actualizarAyudaTipoCambio();

    precioContratista.focus();
}

async function copiarResultado() {
    if (!ultimoResultado) return;

    const texto = [
        "Cálculo de cotización",
        `Precio antes de impuestos: ${formatearUSD(ultimoResultado.subtotalUSD)}`,
        `IVA 16%: ${formatearUSD(ultimoResultado.ivaUSD)}`,
        `Total con IVA: ${formatearUSD(ultimoResultado.totalUSD)}`,
        `Margen: ${ultimoResultado.margenPorcentaje}%`
    ].join("\n");

    try {
        await navigator.clipboard.writeText(texto);
        const textoOriginal = btnCopiar.textContent;
        btnCopiar.textContent = "✓ Resultado copiado";
        setTimeout(() => {
            btnCopiar.textContent = textoOriginal;
        }, 1500);
    } catch (error) {
        mostrarError("No se pudo copiar automáticamente. Puedes copiar los importes mostrados en pantalla.");
    }
}

document.getElementById("btnCalcular").addEventListener("click", calcular);
document.getElementById("btnLimpiar").addEventListener("click", limpiar);
btnCopiar.addEventListener("click", copiarResultado);
monedaContratista.addEventListener("change", actualizarAyudaTipoCambio);

[precioContratista, tipoCambio].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            calcular();
        }
    });
});

const tcGuardado = localStorage.getItem("calculadoraCotizacionUltimoTC");
if (tcGuardado) {
    tipoCambio.value = tcGuardado;
}

actualizarAyudaTipoCambio();
