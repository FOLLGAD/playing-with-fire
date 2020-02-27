const { Sequelize } = require('sequelize')

// Connect Sequelize to our SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '../../db.sqlite',
})

// Export the sequelize instance
module.exports = sequelize