
const TILESIZE = 1
const GameScore = require('./models/GameScore')

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
    constructor({ socket, id }) {
        super({ type: Entity.Types.PLAYER, id })
        this.socket = socket

        this.lastInput = null
        this.speed = 0.005
        this.maxBombs = 1
        this.fireLength = 3
        this.lastBombPlace = null
        this.bombCooldown = 3000 // 3 Seconds
        this.explodeTimer = 2000
        this.pos = { x: 1, y: 1 }
        this.diedAt = null
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
    constructor({ id, pos, timeout }) {
        super({ type: Entity.Types.FIRE, id })
        this.timeOut = timeout
        this.pos = pos
        this.isBlocking = false
    }
}

class Bomb extends Entity {
    constructor({ id, pos, owner, explodesAt }) {
        super({ type: Entity.Types.BOMB, id })
        this.owner = owner
        this.placedAt = Date.now()
        this.explodesAt = explodesAt
        this.isBlocking = false
        this.pos = pos
    }
}

class Barrel extends Entity {
    constructor({ id, pos }) {
        super({ type: Entity.Types.BARREL, id })
        this.pos = pos
        this.isBlocking = true
        this.powerup = null

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
    getData() {
        return { type: this.type, pos: this.pos, id: this.id, powerupType: this.powerupType }
    }
}

class Game {
    constructor(gameid) {
        this.players = []
        this.entities = []
        this.idCounter = 10
        this.id = gameid
        this.initializeBarrels()
        this.initializeWalls()
        this.interval = null
        this.tick = this.tick.bind(this)
        this.start()
    }

    joinGame(socket) {
        if (this.players.find(d => d.socket === socket)) {
            throw new Error("Already joined")
        }
        let player = new Player({ id: this.nextId(), socket })
        this.entities.push(player)
        this.players.push({ socket, username: socket.username, player: player.id, diedAt: null })
        return player
    }

    killPlayer(player) {
        let p = this.players.find(p => p.player === player.id)
        p.diedAt = Date.now()
        this.removeEntity(player)
        let playersLeft = this.players.filter(p => p.diedAt == null)
        if (playersLeft.length === 0) {
            this.finished()
        }

    }

    leaveGame(socket) {
        // let player = this.entities.find(e => e.type === Entity.Types.PLAYER && e.socket === socket)
        //  if (player) {
        //      let message = JSON.stringify({ type: 'remove', data: [player.id] })
        //      this.sockets.forEach(p => {
        //          p.send(message)
        //      })
        //  }
        let p = this.players.find(p => p.socket === socket)
        if (p) {
            p.socket = null
        }
    }

    connections() {
        return this.players.map(p => p.socket).filter(s => s)
    }

    // Start playing
    start() {
        this.interval = setInterval(this.tick, 1000 / 30)
    }

    movePlayer(socket, { delta, xdt, ydt, space }) {
        let player = this.entities.find(t => t.type === "PLAYER" && t.socket === socket)
        if (!player) return;

        if (space) {
            this.placeBomb(player)
        }

        let x = (player.pos.x + xdt * delta * player.speed)
        let y = (player.pos.y + ydt * delta * player.speed)
        let flooredX = Math.floor(player.pos.x)
        let flooredY = Math.floor(player.pos.y)
        let ceiledX = Math.ceil(player.pos.x)
        let ceiledY = Math.ceil(player.pos.y)

        this.bombBlocker(player.pos, player)

        if (xdt > 0) {
            let blocktest = this.getBlockByPosition(flooredX + 1, ceiledY)
            let block = this.getBlockByPosition(flooredX + 1, flooredY) || this.getBlockByPosition(ceiledX + 1, flooredY)
            if (!block || (block.isBlocking && player.pos.x + 1 < block.pos.x) || !block.isBlocking) {
                if (!block || Math.floor(x) < block.pos.x || !block.isBlocking) {
                    player.pos.x = x
                }
            } else {
                player.pos.x = block.pos.x - 1
                if (block && block.pos.x !== 14 && (player.pos.y !== block.pos.y)) {
                    if ((block.pos.y - (player.pos.y - 1) <= 0.1)) {
                        player.pos.y = block.pos.y + 1
                        player.pos.x = x
                    } else {
                        player.pos.y += 0.1
                    }
                }
            }

            if (blocktest && blocktest.isBlocking && blocktest.pos.x !== 14 && (player.pos.y !== blocktest.pos.y)) {
                player.pos.x = blocktest.pos.x - 1
                if ((player.pos.y - (blocktest.pos.y - 1)) <= 0.1) {
                    player.pos.y = blocktest.pos.y - 1
                    player.pos.x = x
                } else {
                    player.pos.y -= 0.1
                }
            }
        } else if (xdt < 0) {
            let blocktest = this.getBlockByPosition(flooredX - 1, ceiledY)
            let block = this.getBlockByPosition(flooredX - 1, flooredY) || this.getBlockByPosition(ceiledX - 1, flooredY)
            if (!block || (block.isBlocking && player.pos.x > block.pos.x + 1) || !block.isBlocking) {
                if (!block || Math.floor(x) > block.pos.x || !block.isBlocking) {
                    player.pos.x = x
                }
            } else {
                player.pos.x = block.pos.x + 1
                if (block && block.pos.x !== 0 && (player.pos.y !== block.pos.y)) {
                    if (((block.pos.y + 1) - player.pos.y) <= 0.1) {
                        player.pos.y = block.pos.y + 1
                        player.pos.x = x
                    } else {
                        player.pos.y += 0.1
                    }
                }
            }

            if (blocktest && blocktest.isBlocking && blocktest.pos.x !== 0 && player.pos.y !== blocktest.pos.y) {
                player.pos.x = blocktest.pos.x + 1
                if ((player.pos.y - (blocktest.pos.y - 1)) <= 0.1) {
                    player.pos.y = blocktest.pos.y - 1
                    player.pos.x = x
                } else {
                    player.pos.y -= 0.1
                }
            }
        }
        // XX
        // 
        if (xdt === 0) {
            if (ydt > 0) {
                let blocktest = this.getBlockByPosition(ceiledX, flooredY + 1)
                let block = this.getBlockByPosition(flooredX, flooredY + 1) || this.getBlockByPosition(flooredX, ceiledY + 1)
                if (!block || (block.isBlocking && player.pos.y + 1 < block.pos.y) || !block.isBlocking) {
                    if (!block || Math.floor(y) < block.pos.y || !block.isBlocking) {
                        player.pos.y = y
                    }
                } else {
                    player.pos.y = block.pos.y - 1
                    if (block && block.pos.y !== 12 && (player.pos.x !== block.pos.x)) {
                        if (((block.pos.x + 1) - player.pos.x) <= 0.1) {
                            player.pos.x = block.pos.x + 1
                            player.pos.y = y
                        } else {
                            player.pos.x += 0.1
                        }
                    }
                }
                if (blocktest && blocktest.isBlocking && blocktest.pos.y !== 12 && (player.pos.x !== blocktest.pos.x)) {
                    player.pos.y = blocktest.pos.y - 1
                    if ((player.pos.x - (blocktest.pos.x - 1)) <= 0.1) {
                        player.pos.x = blocktest.pos.x - 1
                        player.pos.y = y
                    } else {
                        player.pos.x -= 0.1
                    }
                }
            } else if (ydt < 0) {
                let blocktest = this.getBlockByPosition(ceiledX, flooredY - 1)
                let block = this.getBlockByPosition(flooredX, flooredY - 1) || this.getBlockByPosition(flooredX, ceiledY - 1)
                if (!block || (block.isBlocking && player.pos.y > block.pos.y + 1) || !block.isBlocking) {
                    if (!block || Math.floor(y) > block.pos.y || !block.isBlocking) {
                        player.pos.y = y
                    }
                } else {
                    player.pos.y = block.pos.y + 1
                    if (block && block.pos.y !== 0 && (player.pos.x !== block.pos.x)) {
                        if (((block.pos.x + 1) - player.pos.x) <= 0.1) {
                            player.pos.x = block.pos.x + 1
                            player.pos.y = y
                        } else {
                            player.pos.x += 0.1
                        }
                    }
                }
                if (blocktest && blocktest.isBlocking && blocktest.pos.y !== 0 && (player.pos.x !== blocktest.pos.x)) {
                    player.pos.y = blocktest.pos.y + 1
                    if ((player.pos.x - (blocktest.pos.x - 1)) <= 0.1) {
                        player.pos.x = blocktest.pos.x - 1
                        player.pos.y = y
                    } else {
                        player.pos.x -= 0.1
                    }
                }
            }
        }
        this.emitPlayerPos(player)
    }

    bombBlocker(pos, player) {
        let posx = Math.floor(pos.x)
        let posy = Math.floor(pos.y)
        let blockNorth, blockWest, blockEast, blockSouth

        blockNorth = this.getBlockByPosition(posx, posy - 2)
        if (blockNorth && blockNorth.type == "BOMB") {
            blockNorth.isBlocking = true
        }
        blockSouth = this.getBlockByPosition(posx, posy + 2)
        if (blockSouth && blockSouth.type == "BOMB") {
            blockSouth.isBlocking = true
        }
        blockEast = this.getBlockByPosition(posx + 2, posy)
        if (blockEast && blockEast.type == "BOMB") {
            blockEast.isBlocking = true
        }
        blockWest = this.getBlockByPosition(posx - 2, posy)
        if (blockWest && blockWest.type == "BOMB") {
            blockWest.isBlocking = true
        }
    }

    addEntity(entity) {
        this.entities.push(entity)

        let message = JSON.stringify({ type: 'update', data: [entity.getData()] })

        this.players.forEach(p => p.socket && p.socket.send(message))
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

        this.players.forEach(p => p.socket && p.socket.send(msg))
    }

    tick() {
        // Go through all bombs
        this.entities
            .filter(elem => elem.type === Entity.Types.BOMB && Date.now() >= elem.explodesAt)
            .forEach(element => {
                // Bomb position
                let x = Math.floor(element.pos.x)
                let y = Math.floor(element.pos.y)
                this.removeEntity(element)
                let bombOwner = this.entities.find(player => (element.owner === player.id))
                //East and center
                for (let i = 0; i < bombOwner.fireLength; i++) {
                    let block = this.getBlockByPosition(x + i, y)
                    if (block && block.type === "WALL") {
                        break;
                    } else if (block && block.type === "BARREL") {
                        this.removeEntity(block)
                        if (block.powerup) {
                            let power = new Powerup({ id: this.nextId(), pos: block.pos, powerupType: block.powerup })
                            this.addEntity(power)
                        }
                        let fire = new Fire({ id: this.nextId(), pos: { x: x + i, y: y }, timeout: 2500 })
                        this.addEntity(fire)
                        setTimeout(() => { this.removeEntity(fire); }, fire.timeOut);
                        break;
                    } else {
                        let fire = new Fire({ id: this.nextId(), pos: { x: x + i, y: y }, timeout: 2500 })
                        this.addEntity(fire)
                        setTimeout(() => { this.removeEntity(fire); }, fire.timeOut);
                    }
                }
                for (let i = 1; i < bombOwner.fireLength + 1; i++) {
                    let xhelp, yhelp
                    for (let m = 1; m < bombOwner.fireLength; m++) {
                        switch (i) {
                            case (1):
                                //North 
                                xhelp = x
                                yhelp = y - m
                                break;
                            case (2):
                                //West
                                xhelp = x - m
                                yhelp = y
                                break;
                            case (3):
                                //South
                                xhelp = x
                                yhelp = y + m
                                break;
                            default:
                                console.error("Unknown direction for fire")
                        }


                        let block = this.getBlockByPosition(xhelp, yhelp)
                        if (block && block.type === "WALL") {
                            break;
                        } else if (block && block.type === "BARREL") {
                            this.removeEntity(block)
                            if (block.powerup) {
                                let power = new Powerup({ id: this.nextId(), pos: block.pos, powerupType: block.powerup })
                                this.addEntity(power)
                            }
                            let fire = new Fire({ id: this.nextId(), pos: { x: xhelp, y: yhelp }, timeout: 2500 })
                            this.addEntity(fire)
                            setTimeout(() => { this.removeEntity(fire); }, fire.timeOut);
                            break;
                        } else {
                            let fire = new Fire({ id: this.nextId(), pos: { x: xhelp, y: yhelp }, timeout: 2500 })
                            this.addEntity(fire)
                            setTimeout(() => { this.removeEntity(fire); }, fire.timeOut);
                        }
                    }
                }
            });


        this.entities
            .filter(elem => elem.type === Entity.Types.PLAYER)
            .forEach(player => {
                this.entities
                    .filter(elem => elem.type === Entity.Types.POWERUP)
                    .forEach(powerup => {
                        if (powerup.pos.x < player.pos.x + 1 && powerup.pos.x + 1 > player.pos.x &&
                            powerup.pos.y < player.pos.y + 1 && powerup.pos.y + 1 > player.pos.y) {
                            this.removeEntity(powerup)
                            switch (powerup.powerupType) {
                                case ("BOMBS"):
                                    player.maxBombs += 1
                                    break;
                                case ("SPEED"):
                                    player.speed += 0.001
                                    break;
                                case ("EXPLOSION"):
                                    player.fireLength += 1
                                    break;
                            }
                        }
                    });

                this.entities
                    .filter(elem => elem.type === Entity.Types.FIRE)
                    .forEach(fireBlock => {
                        // Check if player collides with fire
                        let safeZone = 0.3
                        if (fireBlock.pos.x < player.pos.x + 1 - safeZone && fireBlock.pos.x + 1 - safeZone > player.pos.x &&
                            fireBlock.pos.y < player.pos.y + 1 - safeZone && fireBlock.pos.y + 1 - safeZone > player.pos.y) {
                            this.killPlayer(player)
                        }
                    });
            });
    }

    removeEntity(entityToRemove) {
        let [entity] = this.entities.splice(this.entities.findIndex(g => g.id === entityToRemove.id), 1)

        if (entity) {
            if (entity.type === Entity.Types.BARREL && entity.powerup) {
                this.addEntity(new Powerup({ id: this.nextId(), powerupType: entity.powerup, pos: { x: entity.pos.x, y: entity.pos.y } }))
            }

            let message = JSON.stringify({ type: 'delete', data: [entity.id] })
            this.players.forEach(s => s.socket && s.socket.send(message))
        }
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
                        let wall = new Wall({ id: this.nextId(), pos: { x: m, y: i } })
                        this.addEntity(wall)
                    } else if (i === 0 || i == (rowsNum - 1)) {
                        let wall = new Wall({ id: this.nextId(), pos: { x: m, y: i } })
                        this.addEntity(wall)
                    }
                }
            } else {
                let wall = new Wall({ id: this.nextId(), pos: { x: 0, y: i } })
                this.addEntity(wall)
                wall = new Wall({ id: this.nextId(), pos: { x: columnsNum - 1, y: i } })
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
                    if (this.procentageChance(50)) {
                        let barrel = new Barrel({ id: this.nextId(), pos: { x: m, y: i } })
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

    async finished() {
        let players = this.players.sort((a, b) => a.diedAt < b.diedAt)
        players.forEach(async (player, index) => {
            let newGameScore = {
                username: player.username,
                gameid: this.id,
                placement: index + 1,
                totalPlayers: players.length,
                at: Date.now(),
            }
            await GameScore.create(newGameScore)
        })

        this.destroy()
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
        return {
            entities: this.entities.map(e => e.getData()),
            players: this.players.map(p => ({ username: p.username, id: p.id, diedAt: p.diedAt })),
            id: this.id,
        }
    }
}

module.exports = {
    Game,
    Player,
    Entity,
}