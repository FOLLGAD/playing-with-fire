
class Player {
    // Username is the database's username of that player
    constructor(socket) {
        this.socket = socket
    }
}

class SocketGame {
    constructor() {
        this.players = []
        this.entities = []
        this.entities.push(new Entity(Entity.Types.PLAYER))
        this.interval = null

        this.update = this.update.bind(this)
    }

    joinGame(socket) {
        let player = new Player(socket)
        this.players.push(player)
    }

    addPlayer(player) {
        this.players.push(player)
    }

    // Start playing
    start() {
        this.interval = setInterval(this.update)
    }

    update() {
        this
    }

    // Stop playing (game ended)
    stop() {

    }

    // Kill game for garbage collector
    destroy() {

    }
}

const TILESIZE = 50

class Entity {
    static Types = {
        PLAYER: "PLAYER",
        WALL: "WALL",
        CRATE: "CRATE",
    }
    constructor(type) {
        this.pos = { x: 0, y: 0 }
        this.type = type

        this.width = TILESIZE
        this.height = TILESIZE
    }
}
