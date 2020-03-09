// GameScore model
// Stores data about previous games

const { Model, DataTypes } = require('sequelize')
const sequelize = require('./sequelize')

class GameScore extends Model {

}
GameScore.init({
    gameid: { type: DataTypes.NUMBER, allowNull: false },
    placement: { type: DataTypes.NUMBER, allowNull: false },
    totalPlayers: { type: DataTypes.NUMBER, allowNull: false },
    at: { type: DataTypes.DATE, allowNull: false }
}, { sequelize, modelName: "GameScore" })

module.exports = GameScore