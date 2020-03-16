module.exports = class Entity {
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

        this.width = 1
        this.height = 1
    }
    getData() {
        return { type: this.type, pos: this.pos, id: this.id }
    }
}