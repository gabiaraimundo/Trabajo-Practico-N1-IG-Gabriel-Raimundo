// ===================================================
// 1. ESTADO DEL JUEGO
// ===================================================
const META_PUNTOS = 100;
const MAX_TURNOS = 20;
let puntajeTotal = 0;
let pozoTurno = 0;
let turnoActual = 1;
let tirandoDados = false; // Bandera para evitar clics dobles durante la animación

// ===================================================
// 2. SELECTORES DEL DOM
// ===================================================
const elTotalPuntos = document.querySelector("#total-puntos");
const elPozoActual = document.querySelector("#pozo-actual");
const elTurno = document.querySelector("#turno");
const elDado1 = document.querySelector("#dado-1");
const elDado2 = document.querySelector("#dado-2");
const elMensaje = document.querySelector("#mensaje-estado");

const btnLanzar = document.querySelector("#btn-lanzar");
const btnPlantarse = document.querySelector("#btn-plantarse");
const btnReiniciar = document.querySelector("#btn-reiniciar");

// ===================================================
// 3. FUNCIONES AUXILIARES Y RENDERIZADO
// ===================================================
const actualizarInterfaz = () => {
  elTotalPuntos.textContent = puntajeTotal;
  elPozoActual.textContent = pozoTurno;
  elTurno.textContent = turnoActual;
};

// Generar número entero entre 1 y 6
const tirarDado = () => Math.floor(Math.random() * 6) + 1;

// Guardar récord en localStorage (se premia lograrlo en MENOS turnos)
const guardarRecord = (turnosUsados) => {
  const nombreJugador = prompt("¡Llegaste a los 100 puntos exactos! Ingresá tu nombre:") || "Anónimo";
  const fechaHoy = new Date().toLocaleDateString();

  const nuevoRegistro = {
    jugador: nombreJugador,
    puntos: turnosUsados,
    fecha: fechaHoy
  };

  const recordsPrevios = JSON.parse(localStorage.getItem("records_dados")) || [];
  recordsPrevios.push(nuevoRegistro);

  // Ordenar de menor a mayor cantidad de turnos y conservar los 5 mejores
  recordsPrevios.sort((a, b) => a.puntos - b.puntos);
  const topRecords = recordsPrevios.slice(0, 5);

  localStorage.setItem("records_dados", JSON.stringify(topRecords));
};

// ===================================================
// 4. CONDICIONES DE FINALIZACIÓN
// ===================================================
const victoria = () => {
  btnLanzar.disabled = true;
  btnPlantarse.disabled = true;
  elMensaje.textContent = `¡Felicitaciones! Alcanzaste 100 puntos en ${turnoActual} turnos.`;
  guardarRecord(turnoActual);
};

const derrota = () => {
  btnLanzar.disabled = true;
  btnPlantarse.disabled = true;
  elMensaje.textContent = `¡Fin de la partida! Agotaste los ${MAX_TURNOS} turnos y te quedaste con ${puntajeTotal} puntos.`;
};

// Control del cambio de turno y límite máximo
const pasarTurno = () => {
  pozoTurno = 0;
  turnoActual++;
  btnPlantarse.disabled = true;

  if (turnoActual > MAX_TURNOS) {
    actualizarInterfaz();
    derrota();
  } else {
    actualizarInterfaz();
  }
};

// Reiniciar partida desde cero
const iniciarPartida = () => {
  puntajeTotal = 0;
  pozoTurno = 0;
  turnoActual = 1;
  tirandoDados = false;

  btnLanzar.disabled = false;
  btnPlantarse.disabled = true;

  elDado1.src = "img/dados/dado1.png";
  elDado2.src = "img/dados/dado1.png";

  actualizarInterfaz();
  elMensaje.textContent = "Presioná 'Lanzar Dados' para iniciar tu turno.";
};

// ===================================================
// 5. MECÁNICAS PRINCIPALES DE JUEGO
// ===================================================
const lanzar = () => {
  if (tirandoDados) return;

  tirandoDados = true;
  btnLanzar.disabled = true;
  btnPlantarse.disabled = true;
  elMensaje.textContent = "Lanzando los dados...";

  setTimeout(() => {
    const valor1 = tirarDado();
    const valor2 = tirarDado();

    elDado1.src = `img/dados/dado${valor1}.png`;
    elDado2.src = `img/dados/dado${valor2}.png`;

    // Caso 1: Doble 1 (pierde pozo y acumulado total)
    if (valor1 === 1 && valor2 === 1) {
      puntajeTotal = 0;
      elMensaje.textContent = "¡DOBLE 1! Mala suerte: perdiste TODO tu puntaje acumulado.";
      pasarTurno();
    }
    // Caso 2: Un solo 1 (pierde solo el pozo del turno)
    else if (valor1 === 1 || valor2 === 1) {
      elMensaje.textContent = "Sacaste un 1. Perdés los puntos acumulados en este turno.";
      pasarTurno();
    }
    // Caso 3: Jugada válida
    else {
      const sumaDados = valor1 + valor2;
      pozoTurno += sumaDados;

      if (valor1 === 6 && valor2 === 6) {
        pozoTurno += 10;
        elMensaje.textContent = `¡Doble 6! Sumás ${sumaDados} + 10 de bonus. Pozo: ${pozoTurno}.`;
      } else {
        elMensaje.textContent = `Sacaste ${valor1} y ${valor2} (+${sumaDados}). ¿Seguís tirando o te plantás?`;
      }

      btnPlantarse.disabled = false;
      actualizarInterfaz();
    }

    tirandoDados = false;
    btnLanzar.disabled = false;
  }, 600);
};

const plantarse = () => {
  if (tirandoDados || pozoTurno === 0) return;

  // Si supera 100 se pasa y no suma
  if (puntajeTotal + pozoTurno > META_PUNTOS) {
    elMensaje.textContent = `¡Te pasaste de 100! (Intentaste sumar ${pozoTurno} a ${puntajeTotal}). No sumás puntos este turno.`;
    pasarTurno();
  } else {
    puntajeTotal += pozoTurno;
    actualizarInterfaz();

    if (puntajeTotal === META_PUNTOS) {
      victoria();
    } else {
      elMensaje.textContent = `Guardaste ${pozoTurno} puntos. Total acumulado: ${puntajeTotal}.`;
      pasarTurno();
    }
  }
};

// ===================================================
// 6. EVENT LISTENERS E INICIALIZACIÓN
// ===================================================
btnLanzar.addEventListener("click", lanzar);
btnPlantarse.addEventListener("click", plantarse);
btnReiniciar.addEventListener("click", iniciarPartida);

// Iniciar al cargar la página
iniciarPartida();