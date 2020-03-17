const Entity = require('./Entity')

module.exports = class Player extends Entity {
    constructor({ socket, id, color }) {
        super({ type: Entity.Types.PLAYER, id })
        this.socket = socket
        this.username = socket.username
        this.color = color

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
    // Override the Entity.getData function
    getData() {
        return { type: this.type, pos: this.pos, id: this.id, color: this.color }
    }
}