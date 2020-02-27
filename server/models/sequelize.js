const { Sequelize } = require('sequelize')

// Connect Sequelize to our SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '../../db.sqlite',
    define: { freezeTableName: true },
    logging: false, // Disable startup SQL logging
})

sequelize.sync()

// Export the sequelize instance
module.exports = sequelize