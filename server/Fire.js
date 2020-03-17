const Entity = require('./Entity')

module.exports = class Fire extends Entity {
    constructor({ id, pos, removeAt }) {
        super({ type: Entity.Types.FIRE, id })
        this.pos = pos
        this.isBlocking = false
        this.removeAt = removeAt
    }
}