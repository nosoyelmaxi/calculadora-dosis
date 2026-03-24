import { useMemo, useRef, useState } from "react";
import "./index.css";

function sanitizarEntradaDecimalCL(valor) {
  if (typeof valor !== "string") return "";

  // Quitar espacios
  let limpio = valor.replace(/\s+/g, "");

  // Permitir solo números, punto y coma
  limpio = limpio.replace(/[^0-9.,]/g, "");

  // Quitar TODOS los puntos (miles)
  limpio = limpio.replace(/\./g, "");

  // Permitir solo una coma decimal
  const partes = limpio.split(",");
  if (partes.length > 2) {
    limpio = partes[0] + "," + partes.slice(1).join("");
  }

  return limpio;
}

function formatearInputCL(valor) {
  if (typeof valor !== "string" || valor === "") return "";

  const terminaEnComa = valor.endsWith(",");
  const [entero = "", decimal] = valor.split(",");

  const enteroLimpio = entero.replace(/\./g, "");
  const enteroFormateado =
    enteroLimpio === ""
      ? ""
      : enteroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (terminaEnComa) {
    return `${enteroFormateado},`;
  }

  if (decimal !== undefined) {
    return `${enteroFormateado},${decimal}`;
  }

  return enteroFormateado;
}

function parsearNumero(valor) {
  if (typeof valor !== "string") return null;

  const normalizado = valor.trim().replace(/\./g, "").replace(",", ".");

  if (
    normalizado === "" ||
    normalizado === "." ||
    !/^(\d+|\d*\.\d+)$/.test(normalizado)
  ) {
    return null;
  }

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function convertirAMg(valor, unidad) {
  const numero = parsearNumero(valor);
  if (numero === null) return null;
  return unidad === "g" ? numero * 1000 : numero;
}

function convertirAMl(valor, unidad) {
  const numero = parsearNumero(valor);
  if (numero === null) return null;
  return unidad === "L" ? numero * 1000 : numero;
}

function convertirAHoras(valor, unidad) {
  const numero = parsearNumero(valor);
  if (numero === null) return null;
  return unidad === "min" ? numero / 60 : numero;
}

function convertirAMinutos(valor, unidad) {
  const numero = parsearNumero(valor);
  if (numero === null) return null;
  return unidad === "horas" ? numero * 60 : numero;
}

function obtenerConcentracionUI(tipo) {
  switch (tipo) {
    case "insulina":
      return 100; // 100 UI por 1 mL
    case "heparina5000":
      return 5000; // 5000 UI por 1 mL
    default:
      return null;
  }
}

function formatearNumeroBonito(valor, maxDecimales = 2) {
  if (valor === null || Number.isNaN(valor) || !Number.isFinite(valor)) {
    return "--";
  }

  if (Number.isInteger(valor)) {
    return valor.toLocaleString("es-CL");
  }

  return valor.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimales,
  });
}

function formatearResultado(valor) {
  if (valor === null || Number.isNaN(valor) || !Number.isFinite(valor)) {
    return "--";
  }

  return `${formatearNumeroBonito(valor, 2)} mL`;
}

function formatearRitmoInfusion(valor) {
  if (valor === null || Number.isNaN(valor) || !Number.isFinite(valor)) {
    return "--";
  }

  return `${formatearNumeroBonito(valor, 2)} mL/h`;
}

function formatearGotas(valor) {
  if (valor === null || Number.isNaN(valor) || !Number.isFinite(valor)) {
    return "--";
  }

  return `${Math.round(valor).toLocaleString("es-CL")} gotas/min`;
}

function bloquearCaracteresInvalidos(e) {
  const teclasPermitidas = [
    "Backspace",
    "Delete",
    "Tab",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];

  if (teclasPermitidas.includes(e.key) || e.ctrlKey || e.metaKey) {
    return;
  }

  if (!/^[0-9.,]$/.test(e.key)) {
    e.preventDefault();
  }
}

function crearPropsInputDecimal(valor, setter, maxLength = 12) {
  return {
    type: "text",
    inputMode: "decimal",
    pattern: "[0-9]*[.,]?[0-9]*",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
    value: formatearInputCL(valor),
    onChange: (e) => {
      const valorLimpio = sanitizarEntradaDecimalCL(e.target.value).slice(
        0,
        maxLength
      );
      setter(valorLimpio);
    },
    onKeyDown: bloquearCaracteresInvalidos,
  };
}

export default function App() {
  const [modo, setModo] = useState("volumen");

  // Volumen a administrar
  const [dosisIndicada, setDosisIndicada] = useState("");
  const [unidadDosis, setUnidadDosis] = useState("mg");

  const [cantidadFrasco, setCantidadFrasco] = useState("");
  const [unidadFrasco, setUnidadFrasco] = useState("mg");

  const [volumenDisponible, setVolumenDisponible] = useState("");
  const [unidadVolumen, setUnidadVolumen] = useState("mL");

  const [tipoUI, setTipoUI] = useState("insulina");

  // Gotas por tiempo
  const [volumenTotal, setVolumenTotal] = useState("");
  const [unidadVolumenTotal, setUnidadVolumenTotal] = useState("mL");

  const [tiempo, setTiempo] = useState("");
  const [unidadTiempo, setUnidadTiempo] = useState("horas");

  const [tipoGoteroVisible, setTipoGoteroVisible] = useState("macro");

  // Referencias
  const dosisInputRef = useRef(null);
  const frascoInputRef = useRef(null);
  const volumenTotalInputRef = useRef(null);
  const tiempoInputRef = useRef(null);

  function enfocarInput(ref) {
    setTimeout(() => {
      ref.current?.focus();
      ref.current?.select?.();
    }, 0);
  }

  function limpiarCamposVolumen(refAEnfocar = dosisInputRef) {
    setDosisIndicada("");
    setCantidadFrasco("");
    setVolumenDisponible("");
    enfocarInput(refAEnfocar);
  }

  function manejarCambioUnidadDosis(e) {
    const nuevaUnidad = e.target.value;

    if (nuevaUnidad === unidadDosis) return;

    setUnidadDosis(nuevaUnidad);

    if (nuevaUnidad === "UI" && unidadFrasco !== "UI") {
      setUnidadFrasco("UI");
      limpiarCamposVolumen(dosisInputRef);
      return;
    }

    setDosisIndicada("");
    enfocarInput(dosisInputRef);
  }

  function manejarCambioUnidadFrasco(e) {
    const nuevaUnidad = e.target.value;

    if (nuevaUnidad !== unidadFrasco) {
      setUnidadFrasco(nuevaUnidad);
      setCantidadFrasco("");
      enfocarInput(frascoInputRef);
    }
  }

  function manejarCambioUnidadVolumenTotal(e) {
    const nuevaUnidad = e.target.value;

    if (nuevaUnidad !== unidadVolumenTotal) {
      setUnidadVolumenTotal(nuevaUnidad);
      setVolumenTotal("");
      enfocarInput(volumenTotalInputRef);
    }
  }

  function manejarCambioUnidadTiempo(e) {
    const nuevaUnidad = e.target.value;

    if (nuevaUnidad !== unidadTiempo) {
      setUnidadTiempo(nuevaUnidad);
      setTiempo("");
      enfocarInput(tiempoInputRef);
    }
  }

  function manejarCambioTipoUI(nuevoTipo) {
    if (nuevoTipo === tipoUI) return;
    setTipoUI(nuevoTipo);
    limpiarCamposVolumen(dosisInputRef);
  }

  const usandoUI = unidadDosis === "UI" || unidadFrasco === "UI";

  const resultadoVolumen = useMemo(() => {
    const volumenMl = convertirAMl(volumenDisponible, unidadVolumen);

    if (volumenMl === null || volumenMl <= 0 || volumenMl > 1000000) {
      return null;
    }

    if (usandoUI) {
      if (unidadDosis !== "UI" || unidadFrasco !== "UI") {
        return null;
      }

      const dosisUI = parsearNumero(dosisIndicada);
      const frascoUI = parsearNumero(cantidadFrasco);
      const concentracionUI = obtenerConcentracionUI(tipoUI);

      if (
        dosisUI === null ||
        frascoUI === null ||
        dosisUI <= 0 ||
        frascoUI <= 0 ||
        !concentracionUI
      ) {
        return null;
      }

      const concentracionIngresada = frascoUI / volumenMl;

      if (
        !Number.isFinite(concentracionIngresada) ||
        Math.abs(concentracionIngresada - concentracionUI) > 0.0001
      ) {
        return null;
      }

      return dosisUI / concentracionUI;
    }

    const dosisMg = convertirAMg(dosisIndicada, unidadDosis);
    const frascoMg = convertirAMg(cantidadFrasco, unidadFrasco);

    if (
      dosisMg === null ||
      frascoMg === null ||
      dosisMg <= 0 ||
      frascoMg <= 0
    ) {
      return null;
    }

    return (dosisMg * volumenMl) / frascoMg;
  }, [
    dosisIndicada,
    unidadDosis,
    cantidadFrasco,
    unidadFrasco,
    volumenDisponible,
    unidadVolumen,
    tipoUI,
    usandoUI,
  ]);

  const resultadosGoteo = useMemo(() => {
    const volumenMl = convertirAMl(volumenTotal, unidadVolumenTotal);
    const tiempoHoras = convertirAHoras(tiempo, unidadTiempo);
    const tiempoMinutos = convertirAMinutos(tiempo, unidadTiempo);

    if (
      volumenMl === null ||
      tiempoHoras === null ||
      tiempoMinutos === null ||
      volumenMl <= 0 ||
      tiempoHoras <= 0 ||
      tiempoMinutos <= 0 ||
      volumenMl > 1000000
    ) {
      return {
        ritmoInfusion: null,
        macroGotas: null,
        microGotas: null,
      };
    }

    const ritmoInfusion = volumenMl / tiempoHoras;
    const macroGotas = (ritmoInfusion * 20) / 60;
    const microGotas = (volumenMl * 60) / tiempoMinutos;

    return {
      ritmoInfusion,
      macroGotas,
      microGotas,
    };
  }, [volumenTotal, unidadVolumenTotal, tiempo, unidadTiempo]);

  function reiniciarTodo() {
    setModo("volumen");

    setDosisIndicada("");
    setUnidadDosis("mg");

    setCantidadFrasco("");
    setUnidadFrasco("mg");

    setVolumenDisponible("");
    setUnidadVolumen("mL");

    setTipoUI("insulina");

    setVolumenTotal("");
    setUnidadVolumenTotal("mL");

    setTiempo("");
    setUnidadTiempo("horas");

    setTipoGoteroVisible("macro");

    enfocarInput(dosisInputRef);
  }

  return (
    <div className="app">
      <h1 className="title">Calculadora de Dosis</h1>

      <div className="tabs">
        <button
          className={modo === "volumen" ? "tab active" : "tab"}
          onClick={() => setModo("volumen")}
        >
          Volumen a Administrar
        </button>

        <button
          className={modo === "gotas" ? "tab active" : "tab"}
          onClick={() => setModo("gotas")}
        >
          Gotas por Tiempo
        </button>
      </div>

      <div className="content">
        {modo === "volumen" ? (
          <div className="form-section">
            <div className="field">
              <label>Dosis indicada</label>
              <div className="input-row">
                <input
                  ref={dosisInputRef}
                  {...crearPropsInputDecimal(dosisIndicada, setDosisIndicada, 12)}
                  placeholder="Ej: 20"
                />
                <select value={unidadDosis} onChange={manejarCambioUnidadDosis}>
                  <option value="mg">mg</option>
                  <option value="g">g</option>
                  <option value="UI">UI</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Cantidad del medicamento en el frasco</label>
              <div className="input-row">
                <input
                  ref={frascoInputRef}
                  {...crearPropsInputDecimal(cantidadFrasco, setCantidadFrasco, 12)}
                  placeholder="Ej: 50"
                />
                <select value={unidadFrasco} onChange={manejarCambioUnidadFrasco}>
                  <option value="mg">mg</option>
                  <option value="g">g</option>
                  <option value="UI">UI</option>
                </select>
              </div>
            </div>

            {usandoUI && (
              <div className="field">
                <label>Tipo de concentración UI</label>

                <div className="toggle-group">
                  <button
                    type="button"
                    className={
                      tipoUI === "insulina" ? "toggle-btn active" : "toggle-btn"
                    }
                    onClick={() => manejarCambioTipoUI("insulina")}
                  >
                    Insulina U-100
                    <br />
                    <span className="toggle-subtext">100 UI = 1 mL</span>
                  </button>

                  <button
                    type="button"
                    className={
                      tipoUI === "heparina5000"
                        ? "toggle-btn active"
                        : "toggle-btn"
                    }
                    onClick={() => manejarCambioTipoUI("heparina5000")}
                  >
                    Heparina
                    <br />
                    <span className="toggle-subtext">5.000 UI = 1 mL</span>
                  </button>
                </div>
              </div>
            )}

            <div className="field">
              <label>Volumen disponible</label>
              <div className="input-row">
                <input
                  {...crearPropsInputDecimal(
                    volumenDisponible,
                    setVolumenDisponible,
                    12
                  )}
                  placeholder="Ej: 5"
                />
                <select
                  value={unidadVolumen}
                  onChange={(e) => setUnidadVolumen(e.target.value)}
                >
                  <option value="mL">mL</option>
                </select>
              </div>
            </div>

            <div className="result-card">
              <p className="result-label">Debes administrar:</p>
              <p className="result-value">{formatearResultado(resultadoVolumen)}</p>
            </div>
                  <p class="aviso2">Cálculos basados en fórmulas estándar de dosis e infusión.</p>
          </div>
        ) : (
          <div className="form-section">
            <div className="field">
              <label>Volumen total</label>
              <div className="input-row">
                <input
                  ref={volumenTotalInputRef}
                  {...crearPropsInputDecimal(volumenTotal, setVolumenTotal, 12)}
                  placeholder="Ej: 1.000"
                />
                <select
                  value={unidadVolumenTotal}
                  onChange={manejarCambioUnidadVolumenTotal}
                >
                  <option value="mL">mL</option>
                  <option value="L">L</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Tiempo</label>
              <div className="input-row">
                <input
                  ref={tiempoInputRef}
                  {...crearPropsInputDecimal(tiempo, setTiempo, 12)}
                  placeholder="Ej: 2,5"
                />
                <select value={unidadTiempo} onChange={manejarCambioUnidadTiempo}>
                  <option value="horas">horas</option>
                  <option value="min">min</option>
                </select>
              </div>
            </div>

            <div className="toggle-group">
              <button
                type="button"
                className={
                  tipoGoteroVisible === "macro"
                    ? "toggle-btn active"
                    : "toggle-btn"
                }
                onClick={() => setTipoGoteroVisible("macro")}
              >
                Macrogoteo (20 gotas/mL)
              </button>

              <button
                type="button"
                className={
                  tipoGoteroVisible === "micro"
                    ? "toggle-btn active"
                    : "toggle-btn"
                }
                onClick={() => setTipoGoteroVisible("micro")}
              >
                Microgoteo (60 gotas/mL)
              </button>
            </div>

            <div className="result-card">
              <p className="result-label">
                {tipoGoteroVisible === "macro"
                  ? "Ritmo de goteo:"
                  : "Ritmo de microgoteo:"}
              </p>
              <p className="result-value result-value-small">
                {tipoGoteroVisible === "macro"
                  ? formatearGotas(resultadosGoteo.macroGotas)
                  : formatearGotas(resultadosGoteo.microGotas)}
              </p>
            </div>

            <div className="result-card">
              <p className="result-label">Ritmo de infusión:</p>
              <p className="result-value result-value-small">
                {formatearRitmoInfusion(resultadosGoteo.ritmoInfusion)}
              </p>
            </div>
            <p class="aviso2">Cálculos basados en fórmulas estándar de dosis e infusión.</p>
          </div>
        )}
      </div>

      <p class="aviso">Esta aplicación es una herramienta de apoyo para cálculos clínicos. No reemplaza el juicio profesional, protocolos institucionales ni la verificación previa a la administración de medicamentos. Confirmar siempre dosis, concentración, unidad y vía de administración antes de su uso.</p>
      <p class="firma">© 2026 — M. Álvarez & O. Carvajal</p>
      <p class="firma">Version 1.0</p>

      <div className="bottom-bar">
        <button className="reset-btn" onClick={reiniciarTodo}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}