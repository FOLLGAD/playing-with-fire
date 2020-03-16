const GameScore = require('./models/GameScore')
const Entity = require('./Entity')
const Barrel = require('./Barrel')
const Bomb = require('./Bomb')
const Fire = require('./Fire')
const Powerup = require('./Powerup')
const Wall = require('./Wall')
const Player = require('./Player')

class Game {
    constructor(gameid, host) {
        this.width = 15
        this.height = 13
        this.players = []
        this.entities = []
        this.idCounter = 10
        this.id = gameid
        this.host = host
        this.interval = null
        this.tick = this.tick.bind(this)
        this.running = false
    }

    joinGame(socket) {
        if (this.players.find(d => d.socket === socket)) {
            throw new Error("Already joined")
        }
        let pl = { socket, username: socket.username, player: null, diedAt: null }
        this.players.push(pl)
        return pl
    }

    killPlayer(player) {
        if (!player) {
            console.error("Tried to kill player", player)
            return
        }
        let p = this.players.find(p => p.player === player.id)
        p.diedAt = Date.now()
        this.removeEntity(player)

        let playersLeft = this.entities.filter(e => e.type === Entity.Types.Player && e.diedAt == null)
        if (playersLeft.length <= 1) {
            this.announceWinner()
        }
    }

    leaveGame(socket) {
        let index = this.players.findIndex(p => p.socket === socket)

        if (index === -1) return

        let [p] = this.players.splice(index, 1)
        if (p) {
            let ent = this.entities.find(d => d.id === p.player)
            if (ent) {
                this.killPlayer(ent)
            }
        }
        // If host left, make another person host
        if (this.host == socket) {
            let newHost = this.players[0]
            this.host = newHost.socket

            let msg = JSON.stringify({ type: 'new-host', data: {} })
            this.host.send(msg)
        }
    }

    connections() {
        return this.players.map(p => p.socket).filter(s => s)
    }

    // Start playing
    start() {
        this.initializeWalls()
        this.initializeBarrels()
        this.running = true
        this.interval = setInterval(this.tick, 1000 / 30)

        // All four corners of the map
        let spawnPositions = [
            { x: 1, y: 1 },
            { x: 1, y: this.height - 2 },
            { x: this.width - 2, y: this.height - 2 },
            { x: this.width - 2, y: 1 },
        ]
        let playerColors = [
            "tomato",
            "mediumseagreen",
            "gold",
            "#519dff",
        ]

        this.players.forEach((p, i) => {
            let player = new Player({
                id: this.nextId(),
                socket: p.socket,
                color: playerColors[i % playerColors.length],
            })
            p.player = player.id

            // Put all players in their own corner (assumes four or less players)
            player.pos = spawnPositions[i % spawnPositions.length]

            this.entities.push(player)
        })

        this.players.forEach(p => {
            p.socket.send(JSON.stringify({ type: 'game-start', data: this.getData() }))
        })
        let players = this.entities.filter(e => e.type === Entity.Types.PLAYER)
        players.forEach(p => this.emitPlayerPos(p))
    }

    movePlayer(socket, { delta, xdt, ydt, space }) {
        if (!this.running) return;
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
        let toRemove = this.entities.filter(e => e.removeAt && e.removeAt < Date.now())
        if (toRemove.length > 0) this.removeEntities(toRemove)
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
                if (!bombOwner) {
                    //player died after placing bomb
                    return;
                }
                for (let i = 0; i < bombOwner.fireLength; i++) {
                    let block = this.getBlockByPosition(x + i, y)
                    if (block && block.type === "WALL") {
                        break;
                    } else if (block && block.type === "BARREL") {
                        this.removeEntity(block)
                        let fire = new Fire({ id: this.nextId(), pos: { x: x + i, y: y }, removeAt: Date.now() + 1200 })
                        this.addEntity(fire)
                        break;
                    } else {
                        let fire = new Fire({ id: this.nextId(), pos: { x: x + i, y: y }, removeAt: Date.now() + 1200 })
                        this.addEntity(fire)
                    }
                }
                for (let i = 1; i < 4; i++) {
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

                            let fire = new Fire({ id: this.nextId(), pos: { x: xhelp, y: yhelp }, removeAt: Date.now() + 1200 })
                            this.addEntity(fire)
                            break;
                        } else {
                            let fire = new Fire({ id: this.nextId(), pos: { x: xhelp, y: yhelp }, removeAt: Date.now() + 1200 })
                            this.addEntity(fire)
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
                                    player.speed += 0.0005
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
    removeEntities(entities) {
        let deleted = []
        entities.forEach(e => {
            let [entity] = this.entities.splice(this.entities.findIndex(g => g.id === e.id), 1)
            deleted.push(entity.id)
        })

        let message = JSON.stringify({ type: 'delete', data: deleted })
        this.players.forEach(s => s.socket && s.socket.send(message))
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

    percentageChance(proc) {
        return Math.random() < (proc / 100)
    }

    nextId() {
        return this.idCounter++
    }

    initializeWalls() {
        for (let i = 0; i < this.height; i++) {
            if (!(i % 2) || i === 0 || i == (this.height - 1)) {
                for (let m = 0; m < this.width; m++) {
                    if (!(m % 2) || m === 0 || m == (this.width - 1)) {
                        let wall = new Wall({ id: this.nextId(), pos: { x: m, y: i } })
                        this.addEntity(wall)
                    } else if (i === 0 || i == (this.height - 1)) {
                        let wall = new Wall({ id: this.nextId(), pos: { x: m, y: i } })
                        this.addEntity(wall)
                    }
                }
            } else {
                let wall = new Wall({ id: this.nextId(), pos: { x: 0, y: i } })
                this.addEntity(wall)
                wall = new Wall({ id: this.nextId(), pos: { x: this.width - 1, y: i } })
                this.addEntity(wall)
            }
        }
    }

    initializeBarrels() {
        for (let x = 1; x < this.width - 1; x++) {
            for (let y = 1; y < this.height - 1; y++) {
                if ((y == 1 || y == this.height - 2) && (x < 5 || x > this.width - 5)) continue;
                if ((x == 1 || x == this.width - 2) && (y < 5 || y > this.height - 5)) continue;

                if (!this.getBlockByPosition(x, y) && this.percentageChance(90)) {
                    let barrel = new Barrel({ id: this.nextId(), pos: { x, y } })
                    this.addEntity(barrel)
                }
            }
        }
    }


    getBlockByPosition(x, y) {
        return this.entities.find(block => ((block.pos.x === x) && (block.pos.y === y)))
    }

    async finished() {

        setTimeout(() => {
            this.destroy()
        }, 5000) // Self-destruct in 5 seconds
    }

    // Stop playing (game ended)
    stop() {
        this.running = false
        clearInterval(this.interval)

        this.connections()
            .forEach(s => {
                s.send(JSON.stringify({ type: 'game-stop', data: {} }))
            })
    }
    announceWinner() {
        let winner = this.players.find(p => p.diedAt === null)

        if (winner) {
            this.connections()
                .forEach(socket => {
                    socket.send(JSON.stringify({ type: 'winner', data: winner.username }))
                })
        }

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

        setTimeout(() => {
            this.stop()
        }, 5000) // Stop after 5 seconds
    }

    // Kill game for garbage collector
    destroy() {
        this.stop()
    }

    getData() {
        return {
            entities: this.entities.map(e => e.getData()),
            players: this.players.map(p => ({ username: p.username, player: p.player, diedAt: p.diedAt })),
            id: this.id,
        }
    }
}

module.exports = {
    Game,
    Player,
    Entity,
}