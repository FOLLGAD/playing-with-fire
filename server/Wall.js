const Entity = require('./Entity')

module.exports = class Wall extends Entity {
    constructor({ id, pos }) {
        super({ type: Entity.Types.WALL, id })
        this.pos = pos
        this.isBlocking = true
    }
}