// game.js

document.addEventListener("DOMContentLoaded", () => {
  
  // --- VARIABLES DE ESTADO GLOBALES ---
  // Se eliminó 'let' en algunas para asegurar que sean accesibles por movePlayer.js
  window.hasGold = false;             
  window.hasWon = false;              
  window.hasLost = false;             
  window.initialPlayerPosition = { x: 0, y: 0 }; 
  window.goldPosition = null;         

  console.log("%c[Sistema] Game.js cargado e inicializado.", "color: orange; font-weight: bold;");

  // --- FUNCIONES DE CONTROL ---

  const resetGame = () => {
    console.log("[Juego] Reiniciando estado general...");
        window.planDeCamino = [];        // Borra por completo la ruta guardada
        window.hasGold = false;          // Reinicia el estado del oro
        window.hasLost = false;          // Reinicia estado de derrota si existía
        window.hasWon = false;           // Reinicia estado de victoria
        window.playerPosition = { x: 0, y: 0 }; // ¡MUY IMPORTANTE! Forzar a la IA a saber que vuelve a estar en el inicio
        
        // Si tienes una lista de celdas sospechosas o peligrosas de la partida anterior, la limpias aquí:
        if (window.celdasPeligrosas) {
            window.celdasPeligrosas.clear();
        }

    // Referencia al nuevo botón de movimiento inteligente
    const btnSmart = document.getElementById("ejecutarMovimientoInteligente");
    if (btnSmart) btnSmart.disabled = false;

    document.getElementById("resetBtn").classList.add("hidden");
    document.getElementById("message").innerText = "";
    
    resetPlayerPosition();
  };

  const resetPlayerPosition = () => {
    try {
        const playerElement = document.querySelector(".player");
        if (playerElement) {
            const playerCell = playerElement.parentElement;
            playerCell.removeChild(playerElement);
        }

        const initialCell = document.getElementById(
          `cell-${window.initialPlayerPosition.y}-${window.initialPlayerPosition.x}`
        );

        if (initialCell) {
            // Nota: createSprite debe estar definida en sprites.js
            if (typeof createSprite === 'function') {
                initialCell.appendChild(createSprite("player"));
            } else {
                console.error("[Error] Función 'createSprite' no encontrada. Revisa sprites.js");
            }
        }
        
        window.playerPosition = { ...window.initialPlayerPosition };
        console.log("[Juego] Jugador reseteado a la posición (0,0)");
    } catch (error) {
        console.error("[Error] Fallo al resetear posición del jugador:", error);
    }
  };

  const checkConditions = () => {
    const playerImg = document.querySelector(".player");
    if (!playerImg) return; // Si no hay jugador en pantalla, no validar

    const currentCell = playerImg.parentElement;
    
    // Verificación de elementos en la celda actual
    const hasPit = currentCell.querySelector(".pit") !== null;
    const hasWumpus = currentCell.querySelector(".wumpus") !== null;
    const itemGold = currentCell.querySelector(".gold"); // Cambiado para mayor precisión

    // Lógica de Derrota
    if (hasPit || hasWumpus) {
        window.hasLost = true;
        const msg = hasPit ? "¡Has caído en el hoyo! ¡Has perdido!" : "¡El Wumpus te ha devorado! ¡Has perdido!";
        document.getElementById("message").innerText = msg;
        console.warn(`[Evento] Derrota: ${msg}`);

        // Bloquea ambos posibles botones de movimiento
        if (document.getElementById("ejecutarMovimientoInteligente")) 
            document.getElementById("ejecutarMovimientoInteligente").disabled = true;
        
        document.getElementById("resetBtn").classList.remove("hidden");
        
    // Lógica de Recogida de Oro (Rescate)
    } else if (itemGold && !window.hasGold) {
        window.hasGold = true;
        document.getElementById("message").innerText = "¡Felicidades! ¡Has encontrado el objetivo (Oro)! Ahora vuelve al inicio.";
        console.log("%c[Evento] Oro recogido. Nueva meta: Regresar a (0,0)", "color: yellow; background: black;");
        
        // Elimina visualmente el oro
        if (currentCell.querySelector(".gold")) currentCell.removeChild(currentCell.querySelector(".gold"));
        window.goldPosition = null; 
        
    // Lógica de Victoria (Regreso a casa con el objetivo)
    } else if (window.hasGold && currentCell.id === "cell-0-0") {
        window.hasWon = true;
        document.getElementById("message").innerText = "¡Misión Cumplida! Has regresado a salvo.";
        console.log("%c[Evento] Victoria alcanzada.", "color: white; background: green;");
        
        if (document.getElementById("ejecutarMovimientoInteligente")) 
            document.getElementById("ejecutarMovimientoInteligente").disabled = true;
        
        document.getElementById("resetBtn").classList.remove("hidden");
    }
  };

  // --- ASIGNACIÓN DE EVENTOS ---

  const resetGameBtn = document.getElementById("resetBtn");
  if (resetGameBtn) {
      resetGameBtn.addEventListener("click", resetGame);
  }
// --- ASIGNACIÓN DE EVENTOS ---

const genBoardBtn = document.getElementById("generateBoard");
if (genBoardBtn) {
    genBoardBtn.addEventListener("click", () => {
        console.log("%c[Tablero] Generando nuevo entorno dinámico...", "color: #4CAF50; font-weight: bold;");
        
        // --- CORRECCIÓN: LIMPIEZA ADENTRO DEL EVENTO CLICK ---
        window.planDeCamino = [];        // Borra por completo la ruta guardada
        window.hasGold = false;          // Reinicia el estado del oro
        window.hasLost = false;          // Reinicia estado de derrota si existía
        window.hasWon = false;           // Reinicia estado de victoria
        window.playerPosition = { x: 0, y: 0 }; // ¡MUY IMPORTANTE! Forzar a la IA a saber que vuelve a estar en el inicio
        
        // Si tienes una lista de celdas sospechosas o peligrosas de la partida anterior, la limpias aquí:
        if (window.celdasPeligrosas) {
            window.celdasPeligrosas.clear();
        }

        console.log("[Sistema] Base de conocimiento e historial de la IA reseteados para el nuevo mapa.");

        // Si el jugador ya había perdido o ganado, restablece la interfaz
        if (window.hasLost || window.hasWon) {
            resetGame();
        }
        
        // Calcula la posición del nuevo oro
        setGoldPosition();
    });
}

  // Ejecución constante de reglas (Loop de juego)
  setInterval(checkConditions, 100);

  // Reemplaza la función vieja de setGoldPosition en game.js por esta versión corregida:
const setGoldPosition = () => {
    const boardSize = parseInt(document.getElementById("boardSize").value);
    const cells = Array.from(document.getElementsByClassName("cell"));
    
    // Buscamos en el HTML cuál celda tiene físicamente el oro dibujado por sprites.js
    const celdaConOro = cells.find(c => c.querySelector(".gold") !== null);
    
    if (celdaConOro) {
        // Extraemos las coordenadas a partir del ID de la celda (cell-y-x)
        const partesId = celdaConOro.id.split("-"); // [ "cell", "y", "x" ]
        const yOro = parseInt(partesId[1]);
        const xOro = parseInt(partesId[2]);
        
        window.goldPosition = { x: xOro, y: yOro };
        console.log(`%c[Config] Meta del A* sincronizada con el mapa físico en: (${xOro}, ${yOro})`, "color: #ffeb3b; font-weight: bold;");
    } else {
        console.error("[Juego] Error crítico: No se encontró ningún sprite de oro en el mapa generado.");
    }
};
});