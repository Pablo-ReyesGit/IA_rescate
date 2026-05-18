// game.js
import BaseConocimientoProposicional from './base_conocimiento.js';
window.KB = new BaseConocimientoProposicional();
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

  function resetGame() {
    console.log("%c[Sistema] ¡Nivel completado! Reiniciando el entorno para el siguiente desafío...", "color: #00e676; font-weight: bold;");

    // 1. Vaciar todas las estructuras de datos de la IA y variables globales
    window.planDeCamino = [];
    window.goldPositions = [];
    window.playerPosition = { x: 0, y: 0 };
    
    // 2. Apagar las banderas de estado del juego
    window.hasGold = false;
    window.hasWon = false;
    window.hasLost = false;

    // 3. Limpiar el registro de celdas peligrosas de la Base de Conocimiento si existe
    if (window.celdasPeligrosas) {
        window.celdasPeligrosas.clear();
    }

    // 4. Instanciar una base de conocimientos completamente limpia (Tabula Rasa)
    if (window.BaseConocimientoProposicional) {
        window.KB = new window.BaseConocimientoProposicional();
        console.log("[KB] Cerebro lógico reseteado a cero hechos.");
    }

    // 5. Simular el clic en el botón físico del HTML para recrear el mapa visual
    const botonGenerar = document.getElementById("generateBoard");
    if (botonGenerar) {
        botonGenerar.click(); 
    } else {
        console.error("[Sistema] No se encontró el botón #generateBoard para disparar el nuevo mapa.");
    }

    // 6. Limpiar avisos o mensajes visuales de la pantalla
    const contenedorMensajes = document.getElementById("message");
    if (contenedorMensajes) {
        contenedorMensajes.innerText = "¡Nuevo mapa generado! Esperando órdenes del Agente.";
    }
}

// Expón la función globalmente para que movePlayer.js pueda llamarla
window.resetGame = resetGame;

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
        } else if (itemGold) {
            document.getElementById("message").innerText = "¡Has recolectado un lingote de oro!";
            currentCell.removeChild(currentCell.querySelector(".gold")); // Lo borra visualmente
            
            // Filtramos el array global para eliminar las coordenadas de este oro que acabamos de pisar
            window.goldPositions = window.goldPositions.filter(
                pos => !(pos.x === window.playerPosition.x && pos.y === window.playerPosition.y)
            );
            
            // Forzamos a que el plan se vacíe para que en el siguiente paso calcule la ruta al SIGUIENTE oro
            window.planDeCamino = []; 
            
        // Lógica de Victoria (Regreso a casa con el objetivo)
        } else if (window.goldPositions && window.goldPositions.length === 0) {
        
        // Y si el agente ya logró caminar de regreso a la entrada de la cueva
        if (window.playerPosition.x === 0 && window.playerPosition.y === 0) {
            
            // Lanzamos una alerta visual de éxito e invocamos el reinicio autónomo
            alert("¡Felicidades! El agente recolectó todos los tesoros y escapó a salvo de la cueva.");
            
            if (typeof window.resetGame === "function") {
                window.resetGame();
            }
        }
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
        console.log("[Tablero] Generando nuevo entorno dinámico...");
        
        window.planDeCamino = [];        
        window.hasGold = false;          
        window.hasLost = false;          
        window.hasWon = false;           
        window.playerPosition = { x: 0, y: 0 }; 

        if (window.celdasPeligrosas) {
            window.celdasPeligrosas.clear();
        }

        // --- SOLUCIÓN DE LÍNEA 140 ---
        // Usamos la clase global que inyectamos desde base_conocimiento.js
        if (window.BaseConocimientoProposicional) {
            window.KB = new window.BaseConocimientoProposicional();
            console.log("[Sistema] Base de conocimiento reiniciada para el nuevo mapa.");
        } else {
            console.error("[KB] Error crítico: No se encontró la clase BaseConocimientoProposicional cargada.");
        }

        if (window.hasLost || window.hasWon) {
            resetGame();
        }
        
        // Si tu función de generar sprites visuales se llama aquí, asegúrate de pasarle solo lo que necesita, por ejemplo:
        // generateSprites(); 
        
        if (typeof setGoldPositions === 'function') {
            setGoldPositions();
        }
    });
}

  // Ejecución constante de reglas (Loop de juego)
  setInterval(checkConditions, 100);

  // Reemplaza la función vieja de setGoldPosition en game.js por esta versión corregida:
const setGoldPositions = () => {
    const boardSize = parseInt(document.getElementById("boardSize").value);
    const cells = Array.from(document.getElementsByClassName("cell"));
    
    // Inicializamos un array global para guardar todas las metas
    window.goldPositions = []; 
    
    // Buscamos todas las celdas del tablero físico que tengan la clase .gold
    cells.forEach(celda => {
        if (celda.querySelector(".gold") !== null) {
            // Extraemos las coordenadas desde el ID de la celda (cell-y-x)
            const partesId = celda.id.split("-"); // [ "cell", "y", "x" ]
            const yOro = parseInt(partesId[1]);
            const xOro = parseInt(partesId[2]);
            
            // Insertamos la coordenada en nuestra base de datos de metas de la IA
            window.goldPositions.push({ x: xOro, y: yOro });
        }
    });
    
    if (window.goldPositions.length > 0) {
        console.log(`%c[Config] IA Informada. ${window.goldPositions.length} posiciones de oro sincronizadas.`, "color: #ffeb3b; font-weight: bold;");
        console.log("[Config] Coordenadas de los objetivos:", window.goldPositions);
    } else {
        console.error("[Juego] Error crítico: No se encontró ningún sprite de oro en el mapa generado.");
    }
};
});