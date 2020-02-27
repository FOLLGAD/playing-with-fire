// GameScore model
// Stores data about previous games

const { Model, DataTypes } = require('sequelize')
const sequelize = require('./sequelize')

class GameScore extends Model {

}
GameScore.init({
    username: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    password: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, modelName: "GameScore" })

module.exports = GameScore