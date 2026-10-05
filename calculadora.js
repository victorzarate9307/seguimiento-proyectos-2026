const precioContratista = document.getElementById("precioContratista");
const monedaContratista = document.getElementById("monedaContratista");
const margen = document.getElementById("margen");
const tipoCambio = document.getElementById("tipoCambio");

const resultadoSubtotal = document.getElementById("resultadoSubtotal");
const resultadoSubtotalLetras = document.getElementById("resultadoSubtotalLetras");
const resultadoIVA = document.getElementById("resultadoIVA");
const resultadoTotal = document.getElementById("resultadoTotal");
const resultadoTotalLetras = document.getElementById("resultadoTotalLetras");

const costoBaseUSD = document.getElementById("costoBaseUSD");
const margenAplicado = document.getElementById("margenAplicado");
const mensajeError = document.getElementById("mensajeError");
const ayudaTipoCambio = document.getElementById("ayudaTipoCambio");
const btnCopiar = document.getElementById("btnCopiar");

const IVA = 0.16;

let ultimoResultado = null;


/* =========================================================
   FORMATO USD
   ========================================================= */

function formatearUSD(valor) {
    return "USD $" + Number(valor || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* =========================================================
   NÚMEROS ENTEROS A LETRAS
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
                textoMiles = convertir(miles) + " mil";
            }

            return textoMiles +
                (resto ? " " + convertir(resto) : "");
        }

        if (n < 1000000000000) {

            const millones = Math.floor(n / 1000000);
            const resto = n % 1000000;

            let textoMillones;

            if (millones === 1) {
                textoMillones = "un millón";
            } else {
                textoMillones = convertir(millones) + " millones";
            }

            return textoMillones +
                (resto ? " " + convertir(resto) : "");
        }

        return String(n);
    }

    return convertir(numero);
}


/* =========================================================
   CORRECCIÓN GRAMATICAL ANTES DE DÓLARES / CENTAVOS
   ========================================================= */

function apocoparUno(texto) {

    return texto
        .replace(/veintiuno$/i, "veintiún")
        .replace(/ y uno$/i, " y un")
        .replace(/uno$/i, "un");
}


/* =========================================================
   DINERO A LETRAS
   ========================================================= */

function dineroALetras(valor) {

    const numero = Math.abs(Number(valor) || 0);

    let enteros = Math.floor(numero);

    let centavos = Math.round(
        (numero - enteros) * 100
    );

    if (centavos === 100) {
        enteros++;
        centavos = 0;
    }

    let textoEnteros =
        numeroEnteroALetras(enteros);

    textoEnteros =
        apocoparUno(textoEnteros);


    let textoCentavos =
        numeroEnteroALetras(centavos);

    textoCentavos =
        apocoparUno(textoCentavos);


    const palabraDolar =
        enteros === 1
            ? "dólar"
            : "dólares";


    const palabraCentavo =
        centavos === 1
            ? "centavo"
            : "centavos";


    /*
       Para cantidades exactas en millones:
       1,000,000 -> un millón de dólares
       2,000,000 -> dos millones de dólares
    */

    const usaDe =
        enteros >= 1000000 &&
        enteros % 1000000 === 0;


    const resultado =
        textoEnteros +
        (usaDe ? " de " : " ") +
        palabraDolar +
        " con " +
        textoCentavos +
        " " +
        palabraCentavo;


    return resultado.charAt(0).toUpperCase() +
        resultado.slice(1) +
        ".";
}


/* =========================================================
   MENSAJES
   ========================================================= */

function mostrarError(texto) {

    mensajeError.textContent = texto;
    mensajeError.classList.remove("oculto");
}


function ocultarError() {

    mensajeError.textContent = "";
    mensajeError.classList.add("oculto");
}


/* =========================================================
   TIPO DE CAMBIO
   ========================================================= */

function actualizarAyudaTipoCambio() {

    if (monedaContratista.value === "USD") {

        ayudaTipoCambio.textContent =
            "No afecta el cálculo cuando el contratista ya cotiza en USD.";

    } else {

        ayudaTipoCambio.textContent =
            "Necesario cuando el costo del contratista está en MXN.";
    }
}


/* =========================================================
   CALCULAR
   ========================================================= */

function calcular() {

    ocultarError();

    const costoOriginal =
        Number(precioContratista.value);

    const moneda =
        monedaContratista.value;

    const margenPorcentaje =
        Number(margen.value);

    const tc =
        Number(tipoCambio.value);


    if (!costoOriginal || costoOriginal <= 0) {

        mostrarError(
            "Ingresa un precio de contratista mayor a cero."
        );

        return;
    }


    if (![38, 40, 45, 50].includes(margenPorcentaje)) {

        mostrarError(
            "Selecciona un margen válido."
        );

        return;
    }


    if (
        moneda === "MXN" &&
        (!tc || tc <= 0)
    ) {

        mostrarError(
            "Ingresa el tipo de cambio interno para convertir el costo de MXN a USD."
        );

        return;
    }


    const costoUSD =
        moneda === "MXN"
            ? costoOriginal / tc
            : costoOriginal;


    const margenDecimal =
        margenPorcentaje / 100;


    /*
       Precio de venta =
       costo / (1 - margen)
    */

    const subtotalUSD =
        costoUSD / (1 - margenDecimal);


    const ivaUSD =
        subtotalUSD * IVA;


    const totalUSD =
        subtotalUSD + ivaUSD;


    /* RESULTADOS */

    resultadoSubtotal.textContent =
        formatearUSD(subtotalUSD);

    resultadoSubtotalLetras.textContent =
        dineroALetras(subtotalUSD);


    resultadoIVA.textContent =
        formatearUSD(ivaUSD);


    resultadoTotal.textContent =
        formatearUSD(totalUSD);

    resultadoTotalLetras.textContent =
        dineroALetras(totalUSD);


    costoBaseUSD.textContent =
        formatearUSD(costoUSD);


    margenAplicado.textContent =
        margenPorcentaje + "%";


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


    localStorage.setItem(
        "calculadoraCotizacionUltimoTC",
        tipoCambio.value || ""
    );
}


/* =========================================================
   LIMPIAR
   ========================================================= */

function limpiar() {

    precioContratista.value = "";

    monedaContratista.value = "MXN";

    margen.value = "38";


    resultadoSubtotal.textContent =
        "USD $0.00";

    resultadoSubtotalLetras.textContent =
        "Cero dólares con cero centavos.";


    resultadoIVA.textContent =
        "USD $0.00";


    resultadoTotal.textContent =
        "USD $0.00";

    resultadoTotalLetras.textContent =
        "Cero dólares con cero centavos.";


    costoBaseUSD.textContent =
        "USD $0.00";

    margenAplicado.textContent =
        "38%";


    ultimoResultado = null;

    btnCopiar.disabled = true;


    ocultarError();

    actualizarAyudaTipoCambio();

    precioContratista.focus();
}


/* =========================================================
   COPIAR RESULTADO
   ========================================================= */

async function copiarResultado() {

    if (!ultimoResultado) {
        return;
    }


    const texto = [

        "Cálculo de cotización",

        `Precio antes de impuestos: ${formatearUSD(ultimoResultado.subtotalUSD)}`,

        dineroALetras(
            ultimoResultado.subtotalUSD
        ),

        `IVA 16%: ${formatearUSD(ultimoResultado.ivaUSD)}`,

        `Total con IVA: ${formatearUSD(ultimoResultado.totalUSD)}`,

        dineroALetras(
            ultimoResultado.totalUSD
        ),

        `Margen: ${ultimoResultado.margenPorcentaje}%`

    ].join("\n");


    try {

        await navigator.clipboard.writeText(texto);

        const textoOriginal =
            btnCopiar.textContent;

        btnCopiar.textContent =
            "✓ Resultado copiado";


        setTimeout(() => {

            btnCopiar.textContent =
                textoOriginal;

        }, 1500);


    } catch (error) {

        mostrarError(
            "No se pudo copiar automáticamente. Puedes copiar los importes mostrados en pantalla."
        );
    }
}


/* =========================================================
   EVENTOS
   ========================================================= */

document
    .getElementById("btnCalcular")
    .addEventListener(
        "click",
        calcular
    );


document
    .getElementById("btnLimpiar")
    .addEventListener(
        "click",
        limpiar
    );


btnCopiar.addEventListener(
    "click",
    copiarResultado
);


monedaContratista.addEventListener(
    "change",
    actualizarAyudaTipoCambio
);


[
    precioContratista,
    tipoCambio
].forEach(input => {

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                calcular();
            }
        }
    );
});


/* =========================================================
   RECUPERAR TIPO DE CAMBIO
   ========================================================= */

const tcGuardado =
    localStorage.getItem(
        "calculadoraCotizacionUltimoTC"
    );


if (tcGuardado) {
    tipoCambio.value = tcGuardado;
}


actualizarAyudaTipoCambio();