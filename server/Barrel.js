const Entity = require('./Entity')
const Powerup = require('./Powerup')

module.exports = class Barrel extends Entity {
    constructor({ id, pos }) {
        super({ type: Entity.Types.BARREL, id })
        this.pos = pos
        this.isBlocking = true
        this.powerup = null

        // Generate random powerup
        if (Math.random() > 0.7) {
            // 20% chance of spawning powerup
            let powerups = Object.keys(Powerup.PowerupTypes)
            // Gets a random index from powerups
            this.powerup = powerups[Math.floor(Math.random() * powerups.length)]
        }
    }
}