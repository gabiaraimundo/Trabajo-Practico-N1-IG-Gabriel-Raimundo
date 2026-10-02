// ===================================================
// 1. SELECTORES DEL DOM
// ===================================================
const tablaCartas = document.querySelector("#tabla-cartas");
const tablaDados = document.querySelector("#tabla-dados");
const tablaTrivia = document.querySelector("#tabla-trivia");
const btnLimpiar = document.querySelector("#btn-limpiar");

// ===================================================
// 2. FUNCIÓN DE RENDERIZADO DINÁMICO
// ===================================================
const renderizarTabla = (claveStorage, elementoTbody, unidadPuntaje) => {
  // 1. Leer string desde localStorage y parsear a array de objetos
  const records = JSON.parse(localStorage.getItem(claveStorage)) || [];

  // 2. Limpiar contenido previo del tbody
  elementoTbody.innerHTML = "";

  // 3. Caso borde: sin datos guardados
  if (records.length === 0) {
    const filaVacia = document.createElement("tr");
    filaVacia.innerHTML = `<td colspan="4" style="text-align: center; color: var(--color-muted);">No hay récords registrados aún. ¡Jugá una partida para inaugurar la tabla!</td>`;
    elementoTbody.appendChild(filaVacia);
    return;
  }

  // 4. Renderizar cada récord con forEach y template strings
  records.forEach((registro, index) => {
    const fila = document.createElement("tr");
    
    // Resaltar al primer puesto con una medalla
    const medalla = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : "";

    fila.innerHTML = `
      <td>${medalla}#${index + 1}</td>
      <td><strong>${registro.jugador}</strong></td>
      <td>${registro.puntos} ${unidadPuntaje}</td>
      <td>${registro.fecha}</td>
    `;

    elementoTbody.appendChild(fila);
  });
};

// Cargar todas las tablas en pantalla
const cargarTodosLosPuntajes = () => {
  renderizarTabla("records_cartas", tablaCartas, "pts");
  renderizarTabla("records_dados", tablaDados, "turnos");
  renderizarTabla("records_trivia", tablaTrivia, "pts");
};

// ===================================================
// 3. BORRADO DE DATOS (MÉTODO REMOVEITEM)
// ===================================================
const limpiarRecords = () => {
  const confirmacion = confirm("¿Estás seguro de que querés borrar todos los récords almacenados?");
  if (confirmacion) {
    localStorage.removeItem("records_cartas");
    localStorage.removeItem("records_dados");
    localStorage.removeItem("records_trivia");
    cargarTodosLosPuntajes();
  }
};

// ===================================================
// 4. LISTENERS E INICIALIZACIÓN
// ===================================================
btnLimpiar.addEventListener("click", limpiarRecords);

// Renderizar al abrir la página
cargarTodosLosPuntajes();