// script.js
document.addEventListener("DOMContentLoaded", () => {
  // --- REFERENCIAS A ELEMENTOS DEL HTML ---
  const boardSizeSelect = document.getElementById("boardSize");       // Menú desplegable para el tamaño
  const generateBoardBtn = document.getElementById("generateBoard");  // Botón para crear nuevo juego
  const toggleBlackLayerBtn = document.getElementById("toggleBlackLayer"); // Botón para ver/ocultar niebla
  const boardContainer = document.getElementById("board");            // Contenedor principal del tablero (Grid)
  
  // --- VARIABLES DE CONFIGURACIÓN ---
  let boardSize = parseInt(boardSizeSelect.value); // Guarda el tamaño elegido (ej: 8, 10, 12)
  let blackLayerVisible = true;                   // Estado global de la visibilidad de la niebla
  let board = [];                                 // Matriz lógica que representará el tablero en memoria

  // --- ASIGNACIÓN DE EVENTOS ---
  generateBoardBtn.addEventListener("click", generateBoard);
  toggleBlackLayerBtn.addEventListener("click", toggleBlackLayer);

  // --- FUNCIONES ---

  // Función para construir el tablero desde cero
  function generateBoard() {
    boardSize = parseInt(boardSizeSelect.value); // Actualiza el tamaño según la selección actual
    boardContainer.innerHTML = "";               // Borra el tablero anterior del HTML
    
    // Configura la cuadrícula de CSS (Grid) dinámicamente según el tamaño elegido
    // Crea 'boardSize' columnas y filas de 50px cada una
    boardContainer.style.gridTemplateColumns = `repeat(${boardSize}, 50px)`;
    boardContainer.style.gridTemplateRows = `repeat(${boardSize}, 50px)`;

    board = []; // Reinicia la matriz lógica
    
    // Bucle anidado para crear filas (i) y columnas (j)
    for (let i = 0; i < boardSize; i++) {
      const row = []; // Crea una fila lógica
      for (let j = 0; j < boardSize; j++) {
        // Crear el elemento visual de la celda
        const cell = document.createElement("div");
        cell.classList.add("cell");
        // Le asigna un ID único basado en su posición (útil para localizarla luego)
        cell.id = `cell-${i}-${j}`; 
        boardContainer.appendChild(cell);

        // Crear la "capa negra" (niebla de guerra) para esta celda
        const blackLayer = document.createElement("div");
        blackLayer.classList.add("sprite", "black-layer");
        cell.appendChild(blackLayer);

        // Guarda el estado inicial de la celda en el array 'board'
        row.push({
          element: cell,      // Referencia al objeto HTML
          hasPlayer: false,   // Estado: ¿está el jugador aquí?
          hasGold: false,     // Estado: ¿está el oro aquí?
          hasPit: false,      // Estado: ¿hay un pozo?
          hasWumpus: false,   // Estado: ¿está el Wumpus?
        });
      }
      board.push(row); // Añade la fila completa a la matriz del tablero
    }
  }

  // Función para mostrar u ocultar todas las capas negras a la vez
  function toggleBlackLayer() {
    // Invierte el estado de visibilidad (si era true, pasa a false y viceversa)
    blackLayerVisible = !blackLayerVisible;
    
    // Selecciona todas las capas negras creadas en el DOM
    const blackLayers = document.querySelectorAll(".black-layer");
    
    blackLayers.forEach((layer) => {
      const parentCell = layer.parentElement;
      // Regla de excepción: No oculta/muestra la capa si el jugador está parado ahí
      const isPlayerCell = parentCell.querySelector(".player") !== null;
      if (isPlayerCell) return;

      // Aplica o quita la clase CSS 'hidden' según el estado de la variable
      if (blackLayerVisible) {
        layer.classList.remove("hidden"); // Se vuelve a ver la niebla
      } else {
        layer.classList.add("hidden");    // Se descubre el mapa
      }
    });
  }
});