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
// 5. CONSUMO DE API (FETCH + ASYNC/AWAIT) EN ESPAÑOL
// ===================================================
const obtenerPreguntasAPI = async () => {
  elTextoPregunta.textContent = "Cargando preguntas en español...";
  elOpciones.innerHTML = "";
  elFeedback.textContent = "";

  try {
    // API pública de preguntas culturales y generales en español
    // Banco abierto de preguntas en formato JSON estándar
    const url = "https://raw.githubusercontent.com/mdominguez88/trivia-preguntas-espanol/main/preguntas.json";
    
    // Si querés seguir con OpenTDB pero con soporte en español, 
    // la cátedra admite APIs públicas en formato JSON
    const respuesta = await fetch(url);
    
    if (!respuesta.ok) {
      throw new Error(`Error en la consulta: ${respuesta.status}`);
    }

    const todasLasPreguntas = await respuesta.json();
    
    // Mezclar el banco de datos y extraer 5 preguntas al azar
    const preguntasAleatorias = mezclarArray(todasLasPreguntas).slice(0, TOTAL_PREGUNTAS);
    return preguntasAleatorias;

  } catch (error) {
    // Plan B: Respaldo local dinámico con preguntas en español si la red falla
    console.warn("Fallo de red al consultar API externa, cargando banco alternativo:", error);
    
    const bancoRespaldo = [
      {
        question: "¿Cuál es el río más caudaloso del mundo?",
        correct_answer: "Amazonas",
        incorrect_answers: ["Nilo", "Misisipi", "Danubio"]
      },
      {
        question: "¿En qué año llegó el ser humano a la Luna?",
        correct_answer: "1969",
        incorrect_answers: ["1955", "1972", "1965"]
      },
      {
        question: "¿Cuál es el elemento químico más abundante en el universo?",
        correct_answer: "Hidrógeno",
        incorrect_answers: ["Oxígeno", "Helio", "Carbono"]
      },
      {
        question: "¿Quién pintó la Mona Lisa?",
        correct_answer: "Leonardo da Vinci",
        incorrect_answers: ["Miguel Ángel", "Pablo Picasso", "Vincent van Gogh"]
      },
      {
        question: "¿Cuál es el planeta más grande de nuestro sistema solar?",
        correct_answer: "Júpiter",
        incorrect_answers: ["Saturno", "Neptuno", "Marte"]
      },
      {
        question: "¿Qué país tiene la mayor superficie territorial del planeta?",
        correct_answer: "Rusia",
        incorrect_answers: ["Canadá", "China", "Estados Unidos"]
      },
      {
        question: "¿En qué país se originaron los Juegos Olímpicos antiguos?",
        correct_answer: "Grecia",
        incorrect_answers: ["Italia", "Egipto", "Francia"]
      }
    ];

    return mezclarArray(bancoRespaldo).slice(0, TOTAL_PREGUNTAS);
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
  elTextoPregunta.textContent = "¡Has completado las 5 preguntas!";
  elOpciones.innerHTML = "";
  elFeedback.textContent = `Resultado final: ${aciertos} de ${TOTAL_PREGUNTAS} aciertos con ${puntajeTotal} puntos totales.`;
  elFeedback.style.color = "var(--color-accent)";
  btnSiguiente.style.display = "none";
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