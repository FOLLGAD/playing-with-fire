const Entity = require('./Entity')

module.exports = class Bomb extends Entity {
    constructor({ id, pos, owner, explodesAt }) {
        super({ type: Entity.Types.BOMB, id })
        this.owner = owner
        this.placedAt = Date.now()
        this.explodesAt = explodesAt
        this.isBlocking = false
        this.pos = pos
    }
}