
const TILESIZE = 1

class Entity {
    static Types = {
        PLAYER: "PLAYER",
        WALL: "WALL",
        BARREL: "BARREL",
        BOMB: "BOMB",
        POWERUP: "POWERUP",
        FIRE: "FIRE",
    }
    constructor({ type, id }) {
        this.pos = { x: 0, y: 0 }
        this.type = type
        this.id = id
        this.isBlocking = false

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
        this.speed = 0.005
        this.lastBombPlace = null
        this.bombCooldown = 3000 // 3 Seconds
        this.explodeTimer = 2000 // 2 Seconds
        this.bombTimeout = 2500 // 2.5 Seconds
        this.maxBombs = 1
        this.pos = { x: 1, y: 1 }

        // TODO: Input
        // let input = {
        // 	delta: delta,
        // 	ydt: 0,
        //     xdt: -1,
        //     space: true,
        // }
    }
}

class Wall extends Entity {
    constructor({ id, pos }) {
        super({ type: Entity.Types.WALL, id })
        this.pos = pos
        this.isBlocking = true
    }
}

class Fire extends Entity {
    constructor({ id, pos }) {
        super({ type: Entity.Types.FIRE, id })
        this.timeOut = timeout
        this.pos = pos
    }
}

class Bomb extends Entity {
    constructor({ id, pos, owner, explodesAt }) {
        super({ type: Entity.Types.BOMB, id })
        this.owner = owner
        this.placedAt = Date.now()
        this.explodesAt = explodesAt
        this.pos = pos
    }
}

class Barrel extends Entity {
    constructor({ id, pos }) {
        super({ type: Entity.Types.BARREL, id })
        this.pos = pos
        this.powerup = null
        this.isBlocking = true

        // Generate random powerup
        if (Math.random() > 0.8) {
            // 20% chance of spawning powerup
            let powerups = Object.keys(Powerup.PowerupTypes)
            // Gets a random index from powerups
            this.powerup = powerups[Math.floor(Math.random() * powerups.length)]
        }
    }
}

class Powerup extends Entity {
    // Powerup types
    static PowerupTypes = {
        SPEED: 'SPEED',
        EXPLOSION: 'EXPLOSION',
        BOMBS: 'BOMBS',
    }
    constructor({ id, pos, powerupType }) {
        super({ type: Entity.Types.POWERUP, id })
        this.pos = pos
        this.powerupType = powerupType
    }
}

class Game {
    constructor(gameid) {
        this.sockets = []
        this.entities = []
        this.idCounter = 10
        this.id = gameid
        this.initializeBarrels()
        this.initializeWalls()
        this.interval = null

        this.tick = this.tick.bind(this)
    }

    joinGame(socket) {
        let player = new Player({ id: this.nextId(), socket })
        this.entities.push(player)
        this.sockets.push(socket)
        return player
    }

    leaveGame(socket) {
        this.sockets.splice(this.sockets.indexOf(socket), 1)
        // Delete player from game?
        // let player = this.entities.find(e => e.type === Entity.Types.PLAYER && e.socket === socket)
        // if (player) {
        //     let message = JSON.stringify({ type: 'remove', data: [player.id] })
        //     this.sockets.forEach(p => {
        //         p.send(message)
        //     })
        // }
    }

    // Start playing
    start() {
        this.interval = setInterval(this.tick)
    }

    movePlayer(player, { delta, xdt, ydt, space }) {
        if (space) {
            this.placeBomb(player)
        }

        let x = (player.pos.x + xdt * delta * player.speed)
        let y = (player.pos.y + ydt * delta * player.speed)
        let flooredX = Math.floor(player.pos.x)
        let flooredY = Math.floor(player.pos.y)
        let ceiledX = Math.ceil(player.pos.x)
        let ceiledY = Math.ceil(player.pos.y)

        if (xdt > 0) {
            let block = this.getBlockByPosition(flooredX + 1, flooredY) || this.getBlockByPosition(ceiledX + 1, flooredY)
            if (!block || (block.isBlocking && player.pos.x + 1 < block.pos.x)) {
                player.pos.x = x
            } else {
                player.pos.x = block.pos.x - 1
            }
        } else if (xdt < 0) {
            let block = this.getBlockByPosition(flooredX - 1, flooredY) || this.getBlockByPosition(ceiledX - 1, flooredY)
            if (!block || (block.isBlocking && player.pos.x > block.pos.x + 1)) {
                player.pos.x = x
            } else {
                player.pos.x = block.pos.x + 1
            }
        }
        // XX
        // 
        if (ydt > 0) {
            let block = this.getBlockByPosition(flooredX, flooredY + 1) || this.getBlockByPosition(flooredX, ceiledY + 1)
            if (!block || (block.isBlocking && player.pos.y + 1 < block.pos.y)) {
                player.pos.y = y
            } else {
                player.pos.y = block.pos.y - 1
            }
        } else if (ydt < 0) {
            let block = this.getBlockByPosition(flooredX, flooredY - 1) || this.getBlockByPosition(flooredX, ceiledY - 1)
            if (!block || (block.isBlocking && player.pos.y > block.pos.y + 1)) {
                player.pos.y = y
            } else {
                player.pos.y = block.pos.y + 1
            }
        }

        this.emitPlayerPos(player)
    }

    addEntity(entity) {
        this.entities.push(entity)

        let message = JSON.stringify({ type: 'update', data: [entity.getData()] })

        this.sockets.forEach(s => s.send(message))
    }

    placeBomb(player) {
        if (!player.lastBombPlace || player.lastBombPlace < Date.now() - player.bombCooldown) {
            const currentBombs = this.entities.filter(e => e.type === Entity.Types.BOMB && e.owner === player.id).length
            if (currentBombs < player.maxBombs) {
                let bomb = new Bomb({
                    id: this.nextId(),
                    pos: { x: Math.round(player.pos.x), y: Math.round(player.pos.y) },
                    owner: player.id,
                    explodesAt: Date.now() + player.explodeTimer,
                })
                this.addEntity(bomb)
            }
        }
    }

    emitPlayerPos(player) {
        const msg = JSON.stringify({ type: 'update', data: [player.getData()] })

        this.sockets.forEach(p => {
            p.send(msg)
        })
    }

    tick() {
        // Go through all bombs
        this.entities
            .filter(elem => elem.type === Entity.Types.BOMB && Date.now() >= elem.explodesAt)
            .forEach(element => {
                // Bomb position?
                let x = Math.floor(element.pos.x)
                let y = Math.floor(element.pos.y)
                // TODO: This is for the first four blocks from the center to the east, add north, west, south in same way with three?
                for (let i = 0; i < 4; i++) {
                    let block = this.getBlockByPosition(x + i, y)
                    if (block.type === "WALL") {
                        break;
                    } else if (block.type === "BARREL") {
                        this.removeEntity(block.id)
                        let fire = new Fire({ id: this.nextId(), timeout: player.bombTimeout })
                        this.addEntity(fire)
                        setTimeout(function () { this.removeEntity(fire.id); }, fire.timeOut);
                        break;
                    } else {
                        let fire = new Fire({ id: this.nextId(), pos: { x: x + i, y: y }, timeout: player.bombTimeout })
                        this.addEntity(fire)
                        setTimeout(function () { this.removeEntity(fire.id); }, player.bombTimeout);
                    }
                }
            });
        // Go through all players
        this.entities
            .filter(elem => elem.type === Entity.Types.PLAYER)
            .forEach(element => {
                let x = Math.floor(element.pos.x)
                let y = Math.floor(element.pos.y)


            });
    }

    removeEntity(id) {
        let index = this.entities.findIndex(block => block.id === id)
        this.entities.splice(index, 1)

        let message = JSON.stringify({ type: 'delete', data: [entity.getData()] })
        this.sockets.forEach(s => s.send(message))
    }

    procentageChance(proc) {
        let chance = Math.random()
        if (chance < (proc / 100)) {
            return true
        }
        return false
    }

    nextId() {
        return this.idCounter++
    }

    initializeWalls() {
        let columnsNum = 15
        let rowsNum = 13
        for (let i = 0; i < rowsNum; i++) {
            if (!(i % 2) || i === 0 || i == (rowsNum - 1)) {
                for (let m = 0; m < columnsNum; m++) {
                    if (!(m % 2) || m === 0 || m == (columnsNum - 1)) {
                        let wall = new Wall({ id: this.idCounter, pos: { x: m, y: i } })
                        this.nextId()
                        this.addEntity(wall)
                    } else if (i === 0 || i == (rowsNum - 1)) {
                        let wall = new Wall({ id: this.idCounter, pos: { x: m, y: i } })
                        this.nextId()
                        this.addEntity(wall)
                    }
                }
            } else {
                let wall = new Wall({ id: this.idCounter, pos: { x: 0, y: i } })
                this.nextId()
                this.addEntity(wall)
                wall = new Wall({ id: this.idCounter, pos: { x: columnsNum - 1, y: i } })
                this.nextId()
                this.addEntity(wall)
            }
        }
    }

    initializeBarrels() {
        let columnsNum = 15
        let rowsNum = 13
        for (let i = 2; i < rowsNum - 2; i++) {
            for (let m = 2; m < columnsNum - 2; m++) {
                if (!(m % 2 === 0 && i % 2 === 0)) {
                    if (this.procentageChance(90)) {
                        let barrel = new Barrel({ id: this.idCounter, pos: { x: m, y: i } })
                        this.nextId()
                        this.addEntity(barrel)
                    }
                }
            }
        }
    }


    getBlockByPosition(x, y) {
        let block = this.entities.find(block => ((block.pos.x === x) && (block.pos.y === y)))
        return block
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
        return { entities: this.entities.map(e => e.getData()), id: this.id }
    }
}

module.exports = {
    Game,
    Player,
    Entity,
}