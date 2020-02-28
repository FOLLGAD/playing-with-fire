const ws = require('ws')
const http = require('http')
const express = require('express')
const path = require('path')
const uuid = require('uuid')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const User = require('./models/User')
const GameScore = require('./models/GameScore')

// Loads the options from the .env file into process.env.{SETTING}
require('dotenv').config()

const PORT = 5000

const app = express()
app.use(cookieParser(process.env.cookieSecret))
app.use(bodyParser.json())

// Create HTTP server using express
const server = http.createServer(app)

// Create websocket server
const webSocketServer = new ws.Server({ server })

webSocketServer.on('connection', webSocket => {
    webSocket.on('message', data => {
        const message = JSON.parse(data)
        console.log(`Message: ${message}`)
    })
})

const games = new Map()

class Player {
    constructor(socket, playerId) {
        this.socket = socket
        this.playerId = playerId
    }
}

class SocketGame {
    constructor() {
        this.players = []
    }
    addPlayer(player) {
        this.players.push(player)
    }
}

const sessions = new Map()

// /api router
const auth = express.Router()
    .post('/authenticate', async (req, res) => {
        console.log(req.body)
        const { username, password } = req.body

        try {
            const foundUser = await User.findUser(username, password)
            const newUuid = uuid.v4()
            sessions.set(newUuid, { username: foundUser.username, at: Date.now() })
            res.cookie('session-cookie', newUuid, { signed: true, httpOnly: true })
            res.status(200).json({ username: foundUser.username })
        } catch (error) {
            console.error(error)
            res.status(401).json({})
        }
    })
    .get('/is-authenticated', async (req, res) => {
        const cookie = req.signedCookies['session-cookie']

        if (cookie && sessions.has(cookie)) {
            const { username } = sessions.get(cookie)
            console.log(username)
            return res.status(200).json({ username })
        }

        res.status(401).json({})
    })
    .post('/register', async (req, res) => {
        console.log(req.body)
        const { username, password } = req.body

        if (username.length < 5 || password.length < 5) {
            res.status(400).json({ error: "Password or username is too short" })
        }

        const user = await User.create({ username, password })
        console.log(user)

        res.status(200).json({ username: user.username })
    })

app.use('/api', auth)

// Statically serve the contents of /client
app.use(express.static(path.join(__dirname, '../dist')))

// For all other routes, serve the Vue frontend SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
})

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})