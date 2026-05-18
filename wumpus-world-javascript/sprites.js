// sprites.js

// Variable global para rastrear en qué coordenadas está el jugador en todo momento
let playerPosition = { x: 0, y: 0 }; 

function createSprite(type) {
    // Si por accidente llega un objeto en lugar de un string, lo capturamos
    if (typeof type !== 'string') {
        console.error("[Sprites] Tipo inválido bloqueado en createSprite:", type);
        type = "unknown";
    }
    const sprite = document.createElement("div");
    sprite.classList.add("sprite", type);
    return sprite;
}

document.addEventListener("DOMContentLoaded", () => {
  // Referencia al contenedor HTML donde se dibujan las celdas
  const boardContainer = document.getElementById("board");

  // Función principal que reparte los elementos por el tablero
  function generateSprites() {
      // Convierte las celdas del DOM en un array para poder trabajar con ellas
      const cells = Array.from(boardContainer.getElementsByClassName("cell"));
      // Calcula el tamaño del tablero (lado) extrayendo la raíz cuadrada del total de celdas
      const boardSize = Math.sqrt(cells.length);
      
      // Objeto para almacenar las coordenadas de cada tipo de elemento
      const positions = {
        gold: [],                           // Lista para guardar múltiples oros
        player: { x: 0, y: 0 },             // El jugador siempre empieza en (0,0)
        pits: [],                           // Lista para guardar múltiples pozos
        wumpus: []                          // Lista para guardar múltiples Wumpus
      };

      // --- GENERACIÓN DE MÚLTIPLES OROS ---
      // Crea una cantidad de oros proporcional al tamaño del tablero
      const cantidadOro = Math.max(1, Math.floor(boardSize / 3)); 

      for (let i = 0; i < cantidadOro; i++) {
          let goldPosition = getRandomPosition(boardSize);
          
          // Condición estricta: No puede aparecer en (0,0) ni chocar con elementos ya creados
          while (
              (goldPosition.x === 0 && goldPosition.y === 0) || 
              isConflict(goldPosition, positions)
          ) {
              goldPosition = getRandomPosition(boardSize);
          }
          
          positions.gold.push(goldPosition); // Guarda con éxito el oro en la lista
      }
      console.log(`[Generador] Se han distribuido ${positions.gold.length} lingotes de oro en el mapa.`);


      // --- GENERACIÓN DE POZOS Y AGUA (BRISA) ---
      // Crea una cantidad de pozos proporcional al tamaño del tablero
      for (let i = 0; i < Math.floor(boardSize / 2); i++) {
          let pitPosition = getRandomPosition(boardSize);
          
          // Mientras la posición elegida choque con algo ya puesto, busca otra
          while (isConflict(pitPosition, positions)) {
              pitPosition = getRandomPosition(boardSize);
          }
          positions.pits.push(pitPosition); // Guarda la posición del pozo
          // Crea el efecto de "agua/brisa" en las 4 casillas adyacentes
          generateSurrounding(cells, pitPosition, "water", boardSize);
      }


      // --- GENERACIÓN DE WUMPUS Y HEDOR ---
      for (let i = 0; i < Math.floor(boardSize / 2); i++) {
          let wumpusPosition = getRandomPosition(boardSize);
          
          // Evita conflictos con el jugador, el oro o pozos ya creados
          while (isConflict(wumpusPosition, positions)) {
              wumpusPosition = getRandomPosition(boardSize);
          }
          positions.wumpus.push(wumpusPosition);
          // Crea el efecto de "hedor" (stench) en las casillas de alrededor
          generateSurrounding(cells, wumpusPosition, "stench", boardSize);
      }


      // --- COLOCACIÓN VISUAL REAL EN EL TABLERO FÍSICO ---
      // Usamos el formato estandarizado: placeSprite(tipoEnTexto, objetoCoordenada)

      // 1. Dibujar Jugador
      placeSprite("player", positions.player);

      // 2. Dibujar todos los Oros generados
      positions.gold.forEach(pos => {
          placeSprite("gold", pos); 
      });

      // 3. Dibujar todos los Pozos
      positions.pits.forEach(pos => {
          placeSprite("pit", pos); 
      });

      // 4. Dibujar todos los Wumpus
      positions.wumpus.forEach(pos => {
          placeSprite("wumpus", pos); 
      });


      // --- REVELAR CASILLA INICIAL ---
      // Calcula el índice de la casilla del jugador y le quita la capa negra para que sea visible
      const playerIndex = positions.player.y * boardSize + positions.player.x;
      const playerCell = cells[playerIndex];
      if (playerCell) {
          const blackLayer = playerCell.querySelector(".black-layer");
          if (blackLayer) {
              blackLayer.classList.add("hidden");
          }
      }

      // Sincroniza la posición global con la recién generada
      window.playerPosition = positions.player;
  }

  // Genera coordenadas {x, y} aleatorias dentro de los límites del tablero
  function getRandomPosition(boardSize) {
    return {
      x: Math.floor(Math.random() * boardSize),
      y: Math.floor(Math.random() * boardSize),
    };
  }

  // Función lógica para evitar que dos cosas importantes caigan en el mismo sitio
  function isConflict(position, positions) {
    if (position.x === 0 && position.y === 0) return true; // No poner nada sobre el jugador
    // No poner nada donde ya está el oro
    if (positions.gold.x === position.x && positions.gold.y === position.y)
      return true;
    // No poner nada donde ya hay un pozo
    if (positions.pits.some((p) => p.x === position.x && p.y === position.y))
      return true;
    // No poner nada donde ya hay un Wumpus
    if (positions.wumpus.some((w) => w.x === position.x && w.y === position.y))
      return true;
    return false; // Si no hay choque, la posición es válida
  }

  // Función para colocar efectos (agua/hedor) alrededor de un peligro
  function generateSurrounding(cells, position, spriteClass, boardSize) {
    const directions = [
      { x: -1, y: 0 }, // Izquierda
      { x: 1, y: 0 },  // Derecha
      { x: 0, y: -1 }, // Arriba
      { x: 0, y: 1 },  // Abajo
    ];
    directions.forEach((dir) => {
      const newX = position.x + dir.x;
      const newY = position.y + dir.y;
      // Verifica que la casilla adyacente no se salga del tablero
      if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
        const index = newY * boardSize + newX;
        const cell = cells[index];
        const sprite = document.createElement("div"); // Crea el elemento visual
        sprite.classList.add("sprite", spriteClass);
        cell.appendChild(sprite); // Lo mete en la celda correspondiente
      }
    });
  }

  // Función genérica para añadir un icono (sprite) a una casilla específica
function placeSprite(type, position) {
    // Si la posición está dañada o cruzada, detenemos el proceso antes del crash
    if (!position || position.x === undefined || position.y === undefined) {
        console.error(`[Sprites] Posición inválida para el elemento '${type}':`, position);
        return;
    }

    const cellId = `cell-${position.y}-${position.x}`;
    const cellElement = document.getElementById(cellId);

    if (cellElement) {
        const sprite = createSprite(type);
        cellElement.appendChild(sprite);
    } else {
        console.error(`[Sprites] No existe en el DOM la celda con ID: ${cellId}`);
    }
}

  // Escucha el botón de "Generar Tablero" para ejecutar toda esta lógica de población
  const generateBoardBtn = document.getElementById("generateBoard");
  generateBoardBtn.addEventListener("click", generateSprites);

});