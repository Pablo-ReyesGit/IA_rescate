export default class BaseConocimientoProposicional {
    constructor() {
        this.simbolos = {}; // Guarda proposiciones: 'P-1-2': true/false
    }

    // TELL: Registrar un hecho verídico en la base de conocimientos
    tell(proposicion, valor) {
        this.simbolos[proposicion] = valor;
    }

    // ASK: Consultar si una proposición se cumple o deducir un estado
    ask(proposicion) {
        return this.simbolos[proposicion] || false;
    }

    /**
     * Aplica reglas de inferencia para determinar si una celda vecina es 100% segura.
     * Regla Proposicional: ¬Brisa(x,y) => ¬Pozo(Vecinos) y ¬Hedor(x,y) => ¬Wumpus(Vecinos)
     */
    esCeldaSeguraDeducida(x, y, vecinos) {
        // Regla de inicio: La celda (0,0) siempre es segura
        if (x === 0 && y === 0) return true;

        let seguroDePozo = false;
        let seguroDeWumpus = false;

        // Iterar sobre los vecinos que ya visitamos para deducir el estado de la casilla actual (x, y)
        for (let v of vecinos) {
            let idVecino = `${v.x}-${v.y}`;
            
            if (this.ask(`V-${idVecino}`)) { // Si el vecino ya fue visitado
                // Si el vecino visitado NO tenía brisa, por implicación lógica, NO puede haber pozo aquí
                if (!this.ask(`B-${idVecino}`)) {
                    seguroDePozo = true;
                }
                // Si el vecino visitado NO tenía hedor, por implicación lógica, NO puede estar el Wumpus aquí
                if (!this.ask(`H-${idVecino}`)) {
                    seguroDeWumpus = true;
                }
            }
        }

        // Si tenemos la certeza absoluta de que no hay pozo ni Wumpus, la celda es segura
        return seguroDePozo && seguroDeWumpus;
    }
}

window.BaseConocimientoProposicional = BaseConocimientoProposicional;
