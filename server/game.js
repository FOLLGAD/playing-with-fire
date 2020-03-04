
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
        this.bombTimeout = 2500 // 2.5 Seconds

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
        /* 
        *Might also need the powerup*
        let x = Math.floor(xdt * delta * player.speed)
        let y = Math.floor(ydt * delta * player.speed)
        let block = this.getBlockByPosition(x,y)
        if (block.type !== "WALL"){
            this.emitPlayerPos(player)
        }else if(block.type !== FIRE){
          *logic for dying in game*
        }else{
            player.pos.x += xdt * delta * player.speed
            player.pos.y += ydt * delta * player.speed
        }
         */
    
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
            let bomb = new Bomb({ id: this.idCounter, pos: { x: Math.floor(player.pos.x), y: Math.floor(player.pos.y) }, owner: player.id, explodesAt: Date.now() + player.explodeTimer })
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
        this.entities.forEach(element => {
            if ( element.type === "BOMB" || Date.now() >= element.explodesAt){
                // Bomb position?
                let x = Math.floor(element.pos.x)
                let y = Math.floor(element.pos.y)
                // TODO: This is for the first four blocks from the center to the east, add north, west, south in same way with three?
                for(let i = 0; i<4; i++){
                    let block = this.getBlockByPosition(x + i,y) 
                    if (block.type === "WALL"){
                        break;
                    }else if(block.type === "BARREL"){
                        this.removeEntity(block.id)
                        let fire = new Fire({ id: this.idCounter, timeout: player.bombTimeout})
                        this.idCounter++
                        this.addEntity(fire)
                        setTimeout(function(){ this.removeEntity(fire.id); }, fire.timeOut);
                        if(this.powerupChance){
                            // powerup position?
                            let powerup = new Powerup({ id: this.idCounter})
                            setTimeout(function(){ this.addEntity(powerup); }, fire.timeOut);
                        }
                        break;
                    }else{
                        let fire = new Fire({ id: this.idCounter, pos: { x: x + i, y: y} ,timeout: player.bombTimeout})
                        this.idCounter++
                        this.addEntity(fire)
                        setTimeout(function(){ this.removeEntity(fire.id); }, player.bombTimeout);
                    } 
                }
            }  
        });
    }

    removeEntity(id){
        let index = this.entities.findIndex(block => block.id === id)
        this.entities.splice(index, 1)

        let message = JSON.stringify({ type: 'delete', data: [entity.getData()] })
        this.sockets.forEach(s => s.send(message))
    }

    powerupChance(){
        let chance = Math.floor(Math.random() * 3)
        if (!chance){
            return true
        }
        return false
    }

    initializeEntities(){
        // TODO: Adding barrels, doing it in the same iteration? 
        let columnsNum = 14
        let rowsNum = 12
        for(let i = 0; i<rowsNum; i++){
            if(i === 0 || i == (rowsNum - 1)){
                let wall = new Wall({ id: this.idCounter, pos: { x: m, y: i}})
                this.idCounter++
                this.addEntity(wall)
            }else if(i % 2) {
                for(let m = 0; m<columnsNum; m++){
                    if (m % 2 || (i === 0 || i == (columnsNum-1))) {
                        let wall = new Wall({ id: this.idCounter, pos: { x: m, y: i}})
                        this.idCounter++
                        this.addEntity(wall)
                    }
                }
            }
        }
    }

    getBlockByPosition(x,y){
        let block = users.find(block => ((block.pos.x === x) && (block.pos.y === y)))
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