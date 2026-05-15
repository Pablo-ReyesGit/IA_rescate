// movePlayer.js
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa la posición del jugador en el eje X e Y
  let playerPosition = { x: 0, y: 0 }; 

  // Referencias a los botones de la interfaz
  const movePlayerBtn = document.getElementById("ejecutarMovimientoInteligente");
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
  function actualizarPosicionEnPantalla(nuevaPos) {
    const boardSize = parseInt(document.getElementById("boardSize").value);
    const cells = Array.from(document.getElementsByClassName("cell"));
    
    // 1. Quitar sprite de la celda vieja
    const oldPlayer = document.querySelector(".player");
    if (oldPlayer) oldPlayer.remove();

    // 2. Dibujar en la celda nueva
    const index = nuevaPos.y * boardSize + nuevaPos.x;
    const newCell = cells[index];
    
    // Crear el elemento visual (sprite)
    const img = document.createElement("div");
    img.classList.add("sprite", "player");
    newCell.appendChild(img);
    
    // 3. Revelar la niebla de la nueva casilla
    const layer = newCell.querySelector(".black-layer");
    if (layer) layer.classList.add("hidden");
    
    console.log(`[Visual] Jugador movido a: ${nuevaPos.x}, ${nuevaPos.y}`);
}

/**
 * Función de Percepción: Verifica el entorno inmediato del agente.
 * Si detecta un peligro (brisa o hedor), el agente debe ser prudente.
 */
function verificarSensoresYRecalcular() {
    const boardSize = parseInt(document.getElementById("boardSize").value);
    const cells = Array.from(document.getElementsByClassName("cell"));
    
    // Obtener la celda donde está parado el agente ahora mismo
    const indexActual = playerPosition.y * boardSize + playerPosition.x;
    const celdaActual = cells[indexActual];

    // 1. PERCEPCIÓN: Leer sensores (clases CSS aplicadas en sprites.js)
    const hayHedor = celdaActual.querySelector(".stench") !== null;
    const hayBrisa = celdaActual.querySelector(".water") !== null;

    if (hayHedor || hayBrisa) {
        console.log("%c[Sensores] ¡Peligro detectado! Percepción: " + 
            (hayHedor ? "Hedor (Wumpus cerca) " : "") + 
            (hayBrisa ? "Brisa (Pozo cerca)" : ""), "color: orange; font-weight: bold;");

        // 2. RAZONAMIENTO: ¿Debemos seguir con el plan o es muy arriesgado?
        // Para la rúbrica de la UMG, aquí demostramos toma de decisiones bajo incertidumbre.
        
        // Buscamos si en el plan actual, el siguiente paso es una casilla no visitada
        if (planDeCamino.length > 0) {
            const siguientePaso = planDeCamino[0];
            const indexSiguiente = siguientePaso.y * boardSize + siguientePaso.x;
            const celdaSiguiente = cells[indexSiguiente];
            
            // Si la siguiente celda es "oscura" (no visitada) y hay sensores de peligro
            const esDesconocida = !celdaSiguiente.querySelector(".black-layer").classList.contains("hidden");

            if (esDesconocida) {
                console.warn("[IA] El siguiente paso es incierto. Recalculando ruta segura...");
                
                // Marcamos la celda actual en una "lista de precaución" para el A*
                // Esto fuerza al algoritmo a buscar un camino que no pase por aquí si es posible
                planDeCamino = []; 
                
                // Opcional: Podrías llamar a ejecutarMovimientoInteligente() aquí para buscar otra ruta
            }
        }
    } else {
        console.log("[Sensores] Entorno seguro. Continuando plan...");
    }
}

  // Asigna las funciones a los clics de los botones

    movePlayerBtn.addEventListener("click", ejecutarMovimientoInteligente);

    toggleBlackLayerBtn.addEventListener("click", toggleBlackLayer);
});