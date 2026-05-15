// movePlayer.js
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa la posición del jugador en el eje X e Y
  let playerPosition = { x: 0, y: 0 }; 

  // Referencias a los botones de la interfaz
  const movePlayerBtn = document.getElementById("movePlayer");
  const toggleBlackLayerBtn = document.getElementById("toggleBlackLayer");
  
  // Estructura de datos para recordar qué celdas ya exploró el jugador
  const visitedCells = new Set(); 

  // Función heurística: Distancia Manhattan (Requisito: Algoritmo Informado) 
function heuristica(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function aEstrella(inicio, meta, boardSize, celdasHTML) {
    // Lista de nodos por explorar: f = g + h 
    let listaAbierta = [{ 
        pos: inicio, 
        g: 0, 
        h: heuristica(inicio, meta), 
        f: 0, 
        padre: null 
    }];
    let listaCerrada = new Set();

    while (listaAbierta.length > 0) {
        // Ordenar por el valor de 'f' más bajo (mejor opción actual)
        listaAbierta.sort((a, b) => a.f - b.f);
        let nodoActual = listaAbierta.shift();
        
        let idActual = `${nodoActual.pos.x}-${nodoActual.pos.y}`;
        if (listaCerrada.has(idActual)) continue;
        listaCerrada.add(idActual);

        // Si llegamos a la meta (Oro o Salida) [cite: 14, 15]
        if (nodoActual.pos.x === meta.x && nodoActual.pos.y === meta.y) {
            let camino = [];
            let temp = nodoActual;
            while (temp !== null) {
                camino.push(temp.pos);
                temp = temp.padre;
            }
            return camino.reverse(); // Devuelve la ruta desde el inicio al fin
        }

        // Explorar vecinos transitables (Evitar obstáculos) [cite: 16, 24]
        const direcciones = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
        
        for (let dir of direcciones) {
            let nuevaX = nodoActual.pos.x + dir.x;
            let nuevaY = nodoActual.pos.y + dir.y;

            if (nuevaX >= 0 && nuevaX < boardSize && nuevaY >= 0 && nuevaY < boardSize) {
                let index = nuevaY * boardSize + nuevaX;
                let celdaHTML = celdasHTML[index];
                
                // Representación del conocimiento: Evitar pozos y Wumpus conocidos [cite: 38, 39]
                const esPeligroso = celdaHTML.querySelector(".pit") || celdaHTML.querySelector(".wumpus");
                
                if (!esPeligroso) {
                    let gNuevo = nodoActual.g + 1;
                    let hNuevo = heuristica({x: nuevaX, y: nuevaY}, meta);
                    listaAbierta.push({
                        pos: {x: nuevaX, y: nuevaY},
                        g: gNuevo,
                        h: hNuevo,
                        f: gNuevo + hNuevo,
                        padre: nodoActual
                    });
                }
            }
        }
    }
    return null; // No hay camino seguro
}

  // Función principal para realizar el movimiento
  // Variable para almacenar el plan actual
let planDeCamino = [];

function ejecutarMovimientoInteligente() {
    const boardSize = parseInt(document.getElementById("boardSize").value);
    const cells = Array.from(document.getElementsByClassName("cell"));

    // 1. Si no hay plan o el objetivo cambió, calcular ruta con A* [cite: 35, 42]
    if (planDeCamino.length === 0) {
        // El objetivo es el Oro, si ya lo tiene, el objetivo es (0,0) [cite: 15]
        let objetivo = !hasGold ? goldPosition : {x: 0, y: 0};
        planDeCamino = aEstrella(playerPosition, objetivo, boardSize, cells);
        
        // El primer elemento es la posición actual, lo quitamos
        if (planDeCamino) planDeCamino.shift(); 
    }

    // 2. Tomar el siguiente paso del plan
    if (planDeCamino && planDeCamino.length > 0) {
        let siguientePaso = planDeCamino.shift();
        
        // 3. Mover al jugador físicamente (reutiliza tu lógica de sprites)
        actualizarPosicionEnPantalla(siguientePaso); 
        
        // 4. Actualizar la variable global
        playerPosition = siguientePaso;
        
        // 5. Verificar percepciones del entorno dinámico [cite: 19, 30]
        verificarSensoresYRecalcular();
    }
}

  // Función para mostrar/ocultar toda la niebla del tablero
  function toggleBlackLayer() {
    const blackLayers = document.querySelectorAll(".black-layer");
    blackLayers.forEach((layer) => {
      const parentCell = layer.parentElement;
      // No hace nada si la celda es donde está el jugador actualmente
      const isPlayerCell = parentCell.querySelector(".player") !== null;
      if (isPlayerCell) return;

      if (layer.classList.contains("hidden")) {
        // Si la capa está oculta pero la celda NO fue visitada, la vuelve a poner
        if (!visitedCells.has(parentCell)) {
          layer.classList.remove("hidden");
        }
      } else {
        // Si la capa es visible, la oculta (modo "ver todo")
        layer.classList.add("hidden");
      }
    });
  }

  // Asigna las funciones a los clics de los botones
  movePlayerBtn.addEventListener("click", movePlayer);
  toggleBlackLayerBtn.addEventListener("click", toggleBlackLayer);
});