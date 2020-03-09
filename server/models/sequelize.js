const { Sequelize } = require('sequelize')
const path = require('path')

// Connect Sequelize to our SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../db.sqlite'),
    define: { freezeTableName: true },
    logging: false, // Disable startup SQL logging
})

sequelize.sync()

// Export the sequelize instance
module.exports = sequelize