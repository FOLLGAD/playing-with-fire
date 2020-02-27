
class Player {
    // Username is the database's username of that player
    constructor(socket, username) {
        this.socket = socket
        this.username = username
    }

    changeSocket(socket) {
        this.socket = socket
    }
}

class SocketGame {
    constructor() {
        this.players = []
        this.entities = []
        this.entities.push(new Entity(Entity.Types.PLAYER))
    }

    addPlayer(player) {
        this.players.push(player)
    }

    // Start playing
    start() {

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
