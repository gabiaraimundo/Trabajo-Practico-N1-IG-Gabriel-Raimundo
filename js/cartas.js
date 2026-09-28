// --- ESTADO DEL JUEGO ---
const MAX_RONDAS = 10;
let puntos = 0;
let vidas = 3;
let rondaActual = 1;
let cartaActual = null;
let juegoTerminado = false;

// Mazo representado con objetos
const mazo = [
  { valor: 1, nombre: "As", img: "img/cartas/carta1.png" },
  { valor: 2, nombre: "Dos", img: "img/cartas/carta2.png" },
  { valor: 3, nombre: "Tres", img: "img/cartas/carta3.png" },
  { valor: 4, nombre: "Cuatro", img: "img/cartas/carta4.png" },
  { valor: 5, nombre: "Cinco", img: "img/cartas/carta5.png" },
  { valor: 6, nombre: "Seis", img: "img/cartas/carta6.png" },
  { valor: 7, nombre: "Siete", img: "img/cartas/carta7.png" },
  { valor: 8, nombre: "Ocho", img: "img/cartas/carta8.png" },
  { valor: 9, nombre: "Nueve", img: "img/cartas/carta9.png" },
  { valor: 10, nombre: "Diez", img: "img/cartas/carta10.png" }
];

// --- SELECTORES DEL DOM ---
const elementoVidas = document.querySelector("#vidas");
const elementoPuntos = document.querySelector("#puntos");
const elementoRonda = document.querySelector("#ronda");
const elementoImagenCarta = document.querySelector("#carta-actual");
const elementoMensaje = document.querySelector("#mensaje-estado");

const btnMayor = document.querySelector("#btn-mayor");
const btnMenor = document.querySelector("#btn-menor");
const btnReiniciar = document.querySelector("#btn-reiniciar");

// --- FUNCIONES AUXILIARES ---
// Obtener una carta aleatoria
const obtenerCartaAleatoria = () => {
  const indice = Math.floor(Math.random() * mazo.length);
  return mazo[indice];
};

// Actualizar la interfaz gráfica
const actualizarInterfaz = () => {
  elementoVidas.textContent = vidas;
  elementoPuntos.textContent = puntos;
  elementoRonda.textContent = rondaActual;
};

// Iniciar o reiniciar la partida
const iniciarPartida = () => {
  puntos = 0;
  vidas = 3;
  rondaActual = 1;
  juegoTerminado = false;

  btnMayor.disabled = false;
  btnMenor.disabled = false;

  cartaActual = obtenerCartaAleatoria();
  elementoImagenCarta.src = cartaActual.img;
  elementoImagenCarta.alt = `Carta ${cartaActual.nombre}`;

  actualizarInterfaz();
  elementoMensaje.textContent = `Carta inicial: ${cartaActual.nombre}. ¿La siguiente será mayor o menor?`;
};

// Guardar el récord en Web Storage (localStorage)
const guardarRecord = (puntosFinales) => {
  const nombreJugador = prompt("¡Partida finalizada! Ingresa tu nombre:") || "Anónimo";
  const fechaHoy = new Date().toLocaleDateString();

  const nuevoRegistro = {
    jugador: nombreJugador,
    puntos: puntosFinales,
    fecha: fechaHoy
  };

  // Leer récords previos o inicializar array vacío
  const recordsPrevios = JSON.parse(localStorage.getItem("records_cartas")) || [];
  recordsPrevios.push(nuevoRegistro);

  // Ordenar de mayor a menor puntaje y conservar los mejores 5
  recordsPrevios.sort((a, b) => b.puntos - a.puntos);
  const topRecords = recordsPrevios.slice(0, 5);

  localStorage.setItem("records_cartas", JSON.stringify(topRecords));
};

// Finalizar el juego
const finalizarJuego = (mensajeFinal) => {
  juegoTerminado = true;
  btnMayor.disabled = true;
  btnMenor.disabled = true;
  elementoMensaje.textContent = mensajeFinal;
  guardarRecord(puntos);
};

// Procesar la jugada seleccionada ("mayor" o "menor")
const jugar = (eleccion) => {
  if (juegoTerminado) return;

  const siguienteCarta = obtenerCartaAleatoria();
  elementoImagenCarta.src = siguienteCarta.img;
  elementoImagenCarta.alt = `Carta ${siguienteCarta.nombre}`;

  const esMayor = siguienteCarta.valor > cartaActual.valor;
  const esMenor = siguienteCarta.valor < cartaActual.valor;
  const esIgual = siguienteCarta.valor === cartaActual.valor;

  let acierto = false;
  if (eleccion === "mayor" && esMayor) acierto = true;
  if (eleccion === "menor" && esMenor) acierto = true;

  if (esIgual) {
    elementoMensaje.textContent = `¡Empate! Ambas cartas valen ${siguienteCarta.valor}. No sumas ni restas.`;
  } else if (acierto) {
    puntos += 100;
    elementoMensaje.textContent = `¡Correcto! Salió un ${siguienteCarta.nombre}. Sumaste 100 puntos.`;
  } else {
    vidas--;
    elementoMensaje.textContent = `Fallaste. Salió un ${siguienteCarta.nombre}. Pierdes 1 vida.`;
  }

  cartaActual = siguienteCarta;
  rondaActual++;
  actualizarInterfaz();

  // Validar condiciones de fin de partida
  if (vidas <= 0) {
    finalizarJuego(`Te quedaste sin vidas. Fin de la partida. Puntaje final: ${puntos}`);
  } else if (rondaActual > MAX_RONDAS) {
    finalizarJuego(`¡Completaste las 10 rondas con éxito! Puntaje final: ${puntos}`);
  }
};

// --- EVENT LISTENERS ---
btnMayor.addEventListener("click", () => jugar("mayor"));
btnMenor.addEventListener("click", () => jugar("menor"));
btnReiniciar.addEventListener("click", iniciarPartida);

// Arrancar el juego al cargar la página
iniciarPartida();