const Entity = require('./Entity')

module.exports = class Powerup extends Entity {
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