// movePlayer.js

import BaseConocimientoProposicional from './base_conocimiento.js';
window.KB = new BaseConocimientoProposicional();
document.addEventListener("DOMContentLoaded", () => {
    // Inicializa la posición del jugador en el eje X e Y de forma global
    if (!window.playerPosition) {
        window.playerPosition = { x: 0, y: 0 }; 
    }

    const movePlayerBtn = document.getElementById("ejecutarMovimientoInteligente");
    const toggleBlackLayerBtn = document.getElementById("toggleBlackLayer");
    const visitedCells = new Set(); 

    // Heurística: Distancia Manhattan
    function heuristica(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // Algoritmo Informado: A*
    function aEstrella(inicio, meta, boardSize, celdasHTML) {
        let listaAbierta = [{ 
            pos: inicio, 
            g: 0, 
            h: heuristica(inicio, meta), 
            f: 0, 
            padre: null 
        }];
        let listaCerrada = new Set();

        let nodosPrevisualizados = 0; 
        let celdasRevisadasLog = [];

        while (listaAbierta.length > 0) {
            listaAbierta.sort((a, b) => a.f - b.f);
            let nodoActual = listaAbierta.shift();
            
            let idActual = `${nodoActual.pos.x}-${nodoActual.pos.y}`;
            if (listaCerrada.has(idActual)) continue;
            listaCerrada.add(idActual);

            if (nodoActual.pos.x === meta.x && nodoActual.pos.y === meta.y) {
                let camino = [];
                let temp = nodoActual;
                while (temp !== null) {
                    camino.push(temp.pos);
                    temp = temp.padre;
                }
                console.log(`%c[A* Performance] Nodos previsualizados en memoria: ${nodosPrevisualizados}`, "color: #00bfff; font-weight: bold;");
                console.log(`[A* Mapa de Exploración]:`, celdasRevisadasLog.join(" ➔ "));
                return camino.reverse();
            }

            const direcciones = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
            for (let dir of direcciones) {
                let nuevaX = nodoActual.pos.x + dir.x;
                let nuevaY = nodoActual.pos.y + dir.y;

                if (nuevaX >= 0 && nuevaX < boardSize && nuevaY >= 0 && nuevaY < boardSize) {
                    let index = nuevaY * boardSize + nuevaX;
                    let celdaHTML = celdasHTML[index];
                    const esPeligroso = celdaHTML.querySelector(".pit") || celdaHTML.querySelector(".wumpus");
                    
                    if (!esPeligroso) {
                        nodosPrevisualizados++;
                        celdasRevisadasLog.push(`(${nuevaX},${nuevaY})`);

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
        return null;
    }

    // Algoritmo No Informado: BFS (Búsqueda en Anchura)
    function busquedaAnchura(inicio, meta, boardSize, celdasHTML) {
        console.log(`%c[BFS] Iniciando búsqueda ciega: (${inicio.x},${inicio.y}) -> (${meta.x},${meta.y})`, "color: magenta");

        let cola = [{ pos: inicio, padre: null }];
        let visitados = new Set();
        visitados.add(`${inicio.x}-${inicio.y}`);

        let nodosPrevisualizados = 0;
        let celdasRevisadasLog = [];

        while (cola.length > 0) {
            let nodoActual = cola.shift();

            if (nodoActual.pos.x === meta.x && nodoActual.pos.y === meta.y) {
                let camino = [];
                let temp = nodoActual;
                while (temp !== null) {
                    camino.push(temp.pos);
                    temp = temp.padre;
                }
                console.log(`%c[BFS Performance] Nodos previsualizados en memoria: ${nodosPrevisualizados}`, "color: #ff00ff; font-weight: bold;");
                console.log(`[BFS Mapa de Exploración]:`, celdasRevisadasLog.join(" ➔ "));
                return camino.reverse();
            }

            const direcciones = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
            for (let dir of direcciones) {
                let nuevaX = nodoActual.pos.x + dir.x;
                let nuevaY = nodoActual.pos.y + dir.y;
                let idVecino = `${nuevaX}-${nuevaY}`;

                if (nuevaX >= 0 && nuevaX < boardSize && nuevaY >= 0 && nuevaY < boardSize && !visitados.has(idVecino)) {
                    let index = nuevaY * boardSize + nuevaX;
                    let celdaHTML = celdasHTML[index];

                    const esPeligroConfirmado = celdaHTML.querySelector(".pit") || celdaHTML.querySelector(".wumpus");
                    const esSospechoso = window.celdasPeligrosas ? window.celdasPeligrosas.has(idVecino) : false;

                    if (!esPeligroConfirmado && !esSospechoso) {
                        nodosPrevisualizados++;
                        celdasRevisadasLog.push(`(${nuevaX},${nuevaY})`);

                        visitados.add(idVecino);
                        cola.push({
                            pos: { x: nuevaX, y: nuevaY },
                            parent: nodoActual, // Mantenido estructuralmente como 'padre' en la lectura de arriba
                            padre: nodoActual
                        });
                    }
                }
            }
        }
        console.error("[BFS] No se encontró ruta mediante búsqueda no informada.");
        return null;
    }

    // Función principal para realizar el movimiento
    function ejecutarMovimientoInteligente() {
        const boardSize = parseInt(document.getElementById("boardSize").value);
        const cells = Array.from(document.getElementsByClassName("cell"));

        if (!window.planDeCamino) {
            window.planDeCamino = [];
        }

        // 1. Si no hay plan, calcular ruta con el algoritmo seleccionado
        if (window.planDeCamino.length === 0) {
            if (!window.hasGold && !window.goldPosition) {
                console.error("[IA] Error: No se ha establecido la posición del oro todavía.");
                return;
            }

            let objetivo = !window.hasGold ? window.goldPosition : { x: 0, y: 0 };
            
            const selector = document.getElementById("selectorAlgoritmo");
            const algoritmoSeleccionado = selector ? selector.value : "AESTRELLA";

            console.log(`[Agente] Calculando ruta vía [${algoritmoSeleccionado}] desde (${window.playerPosition.x}, ${window.playerPosition.y}) hasta (${objetivo.x}, ${objetivo.y})`);

            let resultadoBusqueda = null;
            if (algoritmoSeleccionado === "BFS") {
                resultadoBusqueda = busquedaAnchura(window.playerPosition, objetivo, boardSize, cells);
            } else {
                resultadoBusqueda = aEstrella(window.playerPosition, objetivo, boardSize, cells);
            }
            
            // --- CORRECCIÓN BUG 1: Respetar la selección del algoritmo ---
            if (resultadoBusqueda !== null) {
                window.planDeCamino = resultadoBusqueda;
                window.planDeCamino.shift(); // Quitar la casilla actual
            } else {
                window.planDeCamino = [];
                console.warn("[IA] No hay un camino 100% seguro disponible.");
                document.getElementById("message").innerText = "El agente determina que el camino está bloqueado de forma insegura.";
                return;
            }
        }

        // 2. Tomar el siguiente paso de manera sincronizada
        if (window.planDeCamino && window.planDeCamino.length > 0) {
            let siguientePaso = window.planDeCamino.shift();
            
            if (typeof actualizarPosicionEnPantalla === 'function') {
                actualizarPosicionEnPantalla(siguientePaso); 
            }
            
            // Sincronización en la ventana global real
            window.playerPosition = siguientePaso; 
            
            if (typeof verificarSensoresYRecalcular === 'function') {
                verificarSensoresYRecalcular();
            }
        }
    }

    // Función para mostrar/ocultar toda la niebla del tablero
    function toggleBlackLayer() {
        const blackLayers = document.querySelectorAll(".black-layer");
        blackLayers.forEach((layer) => {
            const parentCell = layer.parentElement;
            const isPlayerCell = parentCell.querySelector(".player") !== null;
            if (isPlayerCell) return;

            if (layer.classList.contains("hidden")) {
                if (!visitedCells.has(parentCell)) {
                    layer.classList.remove("hidden");
                }
            } else {
                layer.classList.add("hidden");
            }
        });
    }

    function actualizarPosicionEnPantalla(nuevaPos) {
        const boardSize = parseInt(document.getElementById("boardSize").value);
        const cells = Array.from(document.getElementsByClassName("cell"));
        
        const listadeJugadores = document.querySelectorAll(".player");
        listadeJugadores.forEach(p => p.remove());

        const index = nuevaPos.y * boardSize + nuevaPos.x;
        const newCell = cells[index];
        
        if (newCell) {
            const img = document.createElement("div");
            img.classList.add("sprite", "player");
            newCell.appendChild(img);
            
            const layer = newCell.querySelector(".black-layer");
            if (layer) layer.classList.add("hidden");
            
            console.log(`[Visual] Jugador dibujado físicamente en: ${nuevaPos.x}, ${nuevaPos.y}`);
        } else {
            console.error(`[Visual] Error: La casilla en índice ${index} no existe.`);
        }
    }

    // --- CORRECCIÓN BUG 2: Actualización de referencias globales en sensores ---
    function verificarSensoresYRecalcular() {
        const boardSize = parseInt(document.getElementById("boardSize").value);
        const cells = Array.from(document.getElementsByClassName("cell"));
        
        const indexActual = window.playerPosition.y * boardSize + window.playerPosition.x;
        const celdaActual = cells[indexActual];
        if (!celdaActual) return;

        let idActual = `${window.playerPosition.x}-${window.playerPosition.y}`;

        // 1. PERCEPCIÓN DE SENSORES (Captura de literales)
        const hayHedor = celdaActual.querySelector(".stench") !== null;
        const hayBrisa = celdaActual.querySelector(".water") !== null; // Modifica según tu clase CSS de brisa

        // 2. TELL: Registrar percepciones en la Base de Conocimiento Proposicional
        KB.tell(`V-${idActual}`, true); // Visitada = Verdadera
        KB.tell(`B-${idActual}`, hayBrisa);
        KB.tell(`H-${idActual}`, hayHedor);

        console.log(`[KB - TELL] Registrado en celda (${idActual}) -> Brisa: ${hayBrisa}, Hedor: ${hayHedor}`);

        // 3. INFERENCIA LOGICA: Analizar el plan futuro bajo las reglas proposicionales
        if (window.planDeCamino && window.planDeCamino.length > 0) {
            const siguientePaso = window.planDeCamino[0];
            const idSiguiente = `${siguientePaso.x}-${siguientePaso.y}`;
            
            const indexSiguiente = siguientePaso.y * boardSize + siguientePaso.x;
            const celdaSiguiente = cells[indexSiguiente];
            const esDesconocida = celdaSiguiente && !celdaSiguiente.querySelector(".black-layer").classList.contains("hidden");

            if (esDesconocida) {
                // Obtenemos los vecinos de la celda de destino para evaluarla
                let vecinosDestino = obtenerVecinosAdyacentes(siguientePaso.x, siguientePaso.y, boardSize);
                
                // ASK: Le preguntamos a la KB si la casilla de destino es segura basándonos en lo que ya sabemos
                let esSegura = window.KB.esCeldaSeguraDeducida(siguientePaso.x, siguientePaso.y, vecinosDestino);

                if (!esSegura && (hayBrisa || hayHedor)) {
                    console.warn(`[KB - INFERENCIA] Celda ${idSiguiente} no se puede deducir como segura debido a sensores activos. Cancelando plan.`);
                    if (window.celdasPeligrosas) window.celdasPeligrosas.add(idSiguiente);
                    window.planDeCamino = []; // Forzar recalculo seguro
                }
            }
        }
    }

    // Función auxiliar para calcular coordenadas adyacentes válidas
    function obtenerVecinosAdyacentes(x, y, boardSize) {
        const dir = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
        let vecinos = [];
        for(let d of dir) {
            let nx = x + d.x;
            let ny = y + d.y;
            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                vecinos.push({x: nx, y: ny});
            }
        }
        return vecinos;
    }

    if (movePlayerBtn) movePlayerBtn.addEventListener("click", ejecutarMovimientoInteligente);
    if (toggleBlackLayerBtn) toggleBlackLayerBtn.addEventListener("click", toggleBlackLayer);
});