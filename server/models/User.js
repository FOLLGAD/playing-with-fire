// User model
// Stores data about registered users

const bcrypt = require('bcrypt')
const { Model, DataTypes } = require('sequelize')
const sequelize = require('./sequelize')

const saltRounds = 12

class User extends Model {
    static async findUser(username, password) {
        let user = await User.findOne({ where: { username } })

        if (user) {
            let matches = await bcrypt.compareSync(password, user.password)
            if (matches) {
                return user
            }
        }

        throw new Error("User not found")
    }
}
User.init({
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            // Automatically salt & hash the password when password is changed
            const hashed = bcrypt.hashSync(value, saltRounds)
            this.setDataValue('password', hashed)
        },
    },
}, { sequelize, modelName: "User" })

module.exports = User