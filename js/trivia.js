// ===================================================
// 1. ESTADO DEL JUEGO
// ===================================================
const TOTAL_PREGUNTAS = 5;
const SEGUNDOS_POR_PREGUNTA = 15;

let preguntas = [];
let indicePreguntaActual = 0;
let puntajeTotal = 0;
let aciertos = 0;
let tiempoRestante = SEGUNDOS_POR_PREGUNTA;
let idIntervalo = null;
let juegoEnCurso = false;

// ===================================================
// 2. SELECTORES DEL DOM
// ===================================================
const elTemporizador = document.querySelector("#temporizador");
const elAciertos = document.querySelector("#aciertos");
const elPuntaje = document.querySelector("#puntaje-trivia");
const elTextoPregunta = document.querySelector("#texto-pregunta");
const elOpciones = document.querySelector("#opciones-respuesta");
const elFeedback = document.querySelector("#mensaje-feedback");

const btnIniciar = document.querySelector("#btn-iniciar");
const btnSiguiente = document.querySelector("#btn-siguiente");

// ===================================================
// 3. FUNCIONES AUXILIARES
// ===================================================
// Resuelve caracteres especiales de la API (ej: &quot; -> ")
const decodificarTexto = (texto) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(texto, "text/html");
  return dom.body.textContent;
};

// Algoritmo para mezclar opciones aleatoriamente
const mezclarArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const actualizarMarcadores = () => {
  elTemporizador.textContent = tiempoRestante;
  elAciertos.textContent = aciertos;
  elPuntaje.textContent = puntajeTotal;
};

// ===================================================
// 4. CONTROL DEL TEMPORIZADOR
// ===================================================
const detenerTimer = () => {
  if (idIntervalo) {
    clearInterval(idIntervalo);
    idIntervalo = null;
  }
};

const iniciarTimer = () => {
  detenerTimer();
  tiempoRestante = SEGUNDOS_POR_PREGUNTA;
  elTemporizador.textContent = tiempoRestante;

  idIntervalo = setInterval(() => {
    tiempoRestante--;
    elTemporizador.textContent = tiempoRestante;

    if (tiempoRestante <= 0) {
      detenerTimer();
      manejarTiempoAgotado();
    }
  }, 1000);
};

// ===================================================
// 5. CONSUMO DE API (FETCH + ASYNC/AWAIT) REAL EN VIVO
// ===================================================
// Función auxiliar para traducir texto al vuelo usando MyMemory API pública gratuita
const traducirAlEspañol = async (textoIngles) => {
  try {
    const urlTraduccion = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoIngles)}&langpair=en|es`;
    const res = await fetch(urlTraduccion);
    const data = await res.json();
    return data.responseData.translatedText || textoIngles;
  } catch {
    return textoIngles; // Si la traducción falla, no bloquea el juego y muestra el original
  }
};

const obtenerPreguntasAPI = async () => {
  elTextoPregunta.textContent = "Consultando preguntas en vivo a la API...";
  elOpciones.innerHTML = "";
  elFeedback.textContent = "";

  try {
    // 1. Solicitud directa a Open Trivia DB (5 preguntas aleatorias por partida)
    const url = `https://opentdb.com/api.php?amount=${TOTAL_PREGUNTAS}&type=multiple`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error(`Error en la solicitud HTTP: ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    // Verificamos el código de estado propio de la API de OpenTDB (0 = éxito)
    if (datos.response_code !== 0 || !datos.results || datos.results.length === 0) {
      throw new Error("La API no devolvió resultados válidos.");
    }

    elTextoPregunta.textContent = "Traduciendo preguntas al español en vivo...";

    // 2. Procesamos y traducimos en tiempo real los datos recibidos de la API
    const preguntasProcesadas = await Promise.all(
      datos.results.map(async (item) => {
        const preguntaLimpia = decodificarTexto(item.question);
        const correctaLimpia = decodificarTexto(item.correct_answer);

        const preguntaTraducida = await traducirAlEspañol(preguntaLimpia);
        const correctaTraducida = await traducirAlEspañol(correctaLimpia);

        const incorrectasTraducidas = await Promise.all(
          item.incorrect_answers.map(async (inc) => {
            const incLimpia = decodificarTexto(inc);
            return await traducirAlEspañol(incLimpia);
          })
        );

        return {
          question: preguntaTraducida,
          correct_answer: correctaTraducida,
          incorrect_answers: incorrectasTraducidas
        };
      })
    );

    return preguntasProcesadas;

  } catch (error) {
    console.error("Error al consumir la API:", error);
    elTextoPregunta.textContent = "Error al conectar con la API. Reintentá en unos instantes.";
    btnIniciar.disabled = false;
    btnIniciar.style.display = "inline-block";
    return [];
  }
};

// ===================================================
// 6. DINÁMICA DE LA PARTIDA
// ===================================================
const mostrarPregunta = () => {
  const preguntaActual = preguntas[indicePreguntaActual];
  elTextoPregunta.textContent = `${indicePreguntaActual + 1}. ${decodificarTexto(preguntaActual.question)}`;
  elOpciones.innerHTML = "";
  elFeedback.textContent = "";
  btnSiguiente.style.display = "none";

  // Agrupar y desordenar respuesta correcta + incorrectas
  const todasLasOpciones = mezclarArray([
    preguntaActual.correct_answer,
    ...preguntaActual.incorrect_answers
  ]);

  todasLasOpciones.forEach((opcion) => {
    const boton = document.createElement("button");
    boton.classList.add("btn", "btn-secondary");
    boton.textContent = decodificarTexto(opcion);
    boton.style.width = "100%";
    boton.style.textAlign = "left";

    boton.addEventListener("click", () => verificarRespuesta(opcion, preguntaActual.correct_answer));
    elOpciones.appendChild(boton);
  });

  iniciarTimer();
};

const bloquearOpciones = () => {
  const botones = elOpciones.querySelectorAll("button");
  botones.forEach((btn) => (btn.disabled = true));
};

const verificarRespuesta = (seleccionada, correcta) => {
  detenerTimer();
  bloquearOpciones();

  if (seleccionada === correcta) {
    // Puntos base (100) + bono por segundos sobrantes (10 por segundo)
    const bono = tiempoRestante * 10;
    const puntosObtenidos = 100 + bono;
    puntajeTotal += puntosObtenidos;
    aciertos++;
    elFeedback.textContent = `¡Correcto! Sumaste ${puntosObtenidos} puntos (incluye +${bono} por velocidad).`;
    elFeedback.style.color = "var(--color-success)";
  } else {
    elFeedback.textContent = `Incorrecto. La respuesta correcta era: "${decodificarTexto(correcta)}".`;
    elFeedback.style.color = "var(--color-danger)";
  }

  actualizarMarcadores();
  btnSiguiente.style.display = "inline-block";
};

const manejarTiempoAgotado = () => {
  bloquearOpciones();
  const correcta = preguntas[indicePreguntaActual].correct_answer;
  elFeedback.textContent = `¡Tiempo agotado! La opción correcta era: "${decodificarTexto(correcta)}".`;
  elFeedback.style.color = "var(--color-danger)";
  btnSiguiente.style.display = "inline-block";
};

// ===================================================
// 7. PERSISTENCIA Y FINALIZACIÓN
// ===================================================
const guardarRecord = (puntosFinales) => {
  const nombreJugador = prompt("¡Trivia terminada! Ingresá tu nombre para el salón de la fama:") || "Anónimo";
  const fechaHoy = new Date().toLocaleDateString();

  const nuevoRegistro = {
    jugador: nombreJugador,
    puntos: puntosFinales,
    fecha: fechaHoy
  };

  const recordsPrevios = JSON.parse(localStorage.getItem("records_trivia")) || [];
  recordsPrevios.push(nuevoRegistro);
  recordsPrevios.sort((a, b) => b.puntos - a.puntos);
  const topRecords = recordsPrevios.slice(0, 5);

  localStorage.setItem("records_trivia", JSON.stringify(topRecords));
};

const finalizarJuego = () => {
  detenerTimer();
  juegoEnCurso = false;
  
  // Limpieza visual de la ronda
  tiempoRestante = SEGUNDOS_POR_PREGUNTA;
  elTemporizador.textContent = tiempoRestante;
  elTextoPregunta.textContent = "¡Has completado las 5 preguntas!";
  elOpciones.innerHTML = "";
  
  elFeedback.textContent = `Resultado final: ${aciertos} de ${TOTAL_PREGUNTAS} aciertos con ${puntajeTotal} puntos totales.`;
  elFeedback.style.color = "var(--color-accent)";
  btnSiguiente.style.display = "none";
  
  // Reactivación del botón para volver a jugar
  btnIniciar.disabled = false; // <-- Esto desbloquea el botón
  btnIniciar.textContent = "Jugar de nuevo";
  btnIniciar.style.display = "inline-block";

  guardarRecord(puntajeTotal);
};
const avanzarPregunta = () => {
  indicePreguntaActual++;
  if (indicePreguntaActual < TOTAL_PREGUNTAS) {
    mostrarPregunta();
  } else {
    finalizarJuego();
  }
};

const iniciarJuego = async () => {
  btnIniciar.disabled = true;
  btnIniciar.style.display = "none";
  puntajeTotal = 0;
  aciertos = 0;
  indicePreguntaActual = 0;
  actualizarMarcadores();

  preguntas = await obtenerPreguntasAPI();

  if (preguntas.length > 0) {
    juegoEnCurso = true;
    mostrarPregunta();
  }
};

// ===================================================
// 8. EVENT LISTENERS
// ===================================================
btnIniciar.addEventListener("click", iniciarJuego);
btnSiguiente.addEventListener("click", avanzarPregunta);