
const TILESIZE = 1

class Entity {
    static Types = {
        PLAYER: "PLAYER",
        WALL: "WALL",
        BARREL: "BARREL",
        BOMB: "BOMB",
        POWERUP: "POWERUP",
    }
    constructor({ type, id }) {
        this.pos = { x: 0, y: 0 }
        this.type = type
        this.id = id

        this.width = TILESIZE
        this.height = TILESIZE
    }
    getData() {
        return { type: this.type, pos: this.pos, id: this.id }
    }
}

class Player extends Entity {
    // Username is the database's username of that player
    constructor({ socket, id }) {
        super({ type: Entity.Types.PLAYER, id })
        this.socket = socket

        this.lastInput = null
        this.speed = 1
        this.lastBombPlace = null
        this.bombCooldown = 3000 // 3 Seconds
        this.explodeTimer = 2000 // 2 Seconds

        // let input = {
        // 	delta: delta,
        // 	ydt: 0,
        // 	xdt: 0,
        // 	isn: inputNumber++,
        // }
    }
}

class Wall extends Entity {
    constructor({ id, pos }) {
        super({ type: Entity.Types.WALL, id })
        this.pos = pos
    }
}

class Bomb extends Entity {
    constructor({ id, owner, explodesAt }) {
        super({ type: Entity.Types.BOMB, id })
        this.owner = owner
        this.placedAt = Date.now()
        this.explodesAt = explodesAt
    }
}

class Powerup extends Entity {
    constructor({ id }) {
        super({ type: Entity.Types.POWERUP, id })
    }
}

class Game {
    constructor(gameid) {
        this.sockets = []
        this.entities = []
        this.idCounter = 10
        this.id = gameid
        this.entities = [
            new Wall({ id: this.idCounter++, pos: { x: 2, y: 4 } }),
            new Wall({ id: this.idCounter++, pos: { x: 4, y: 4 } }),
            new Wall({ id: this.idCounter++, pos: { x: 2, y: 6 } }),
            new Wall({ id: this.idCounter++, pos: { x: 4, y: 6 } }),
        ]
        this.interval = null

        this.tick = this.tick.bind(this)
    }

    joinGame(socket) {
        let player = new Player(this.idCounter, socket)
        this.idCounter++
        this.entities.push(player)
    }

    leaveGame(socket) {
        let player = this.players.splice(this.players.findIndex(p => p.socket == socket), 1)
        if (player) {
            let message = JSON.stringify({ type: 'remove', data: [player.id] })
            this.sockets.forEach(p => {
                p.socket.send(message)
            })
        }
    }

    // Start playing
    start() {
        this.interval = setInterval(this.tick)
    }

    movePlayer(player, { delta, xdt, ydt }) {
        player.pos.x += xdt * delta * player.speed
        player.pos.y += ydt * delta * player.speed

        this.emitPlayerPos(player)
    }

    addEntity(entity) {
        let message = JSON.stringify({ type: 'update', data: [entity.getData()] })

        this.sockets.forEach(s => s.send(message))
    }

    placeBomb(player) {
        if (!player.lastBombPlace || player.lastBombPlace < Date.now() - player.bombCooldown) {
            let bomb = new Bomb({ id: this.idCounter, owner: player.id, explodesAt: Date.now() + player.explodeTimer })
            this.addEntity(bomb)
            this.idCounter++
        }
    }

    emitPlayerPos(player) {
        const msg = JSON.stringify({ type: 'update', data: [player.getData()] })

        this.players.forEach(p => {
            p.socket.send(msg)
        })
    }

    tick() {
        // TODO: Make bombs explode and stuff
        
    }

    // Stop playing (game ended)
    stop() {
        clearInterval(this.interval)
    }

    // Kill game for garbage collector
    destroy() {
        this.stop()

    }

    getData() {
        return { entities: this.entities.map(e => e.getData()) }
    }
}

module.exports = {
    Game,
    Player,
    Entity,
}