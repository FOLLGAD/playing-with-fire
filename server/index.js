const WebSocket = require('ws')
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
const appCookieParser = cookieParser(process.env.cookieSecret)
app.use(appCookieParser)
app.use(bodyParser.json())

// Create HTTP server using express
const server = http.createServer(app)

const games = new Map()

// Create websocket server
const wss = new WebSocket.Server({
    server,
    verifyClient: (info, next) => {
        appCookieParser(info.req, {}, () => {
            try {
                const sc = info.req.signedCookies['session-cookie']

                authenticate(sc)

                next(true)
            } catch (error) {
                console.error(error)
                next(false)
            }
        })
    }
})

wss.on('connection', (ws, req) => {
    const sc = req.signedCookies['session-cookie']
    ws.username = authenticate(sc)

    let currentGame = null
    let currentPlayer = null

    // Wrapper to send JSON messages with ws.sendMsg(type, data)
    ws.sendMsg = (type, data) => {
        ws.send(JSON.stringify({ type, data }))
    }

    ws.on('message', message => {

        const { type, data } = JSON.parse(message)

        console.log(`${username} says: ${type} ${data}`)

        if (type === 'create-game') {
            const gameid = uuid.v4()
            const game = new SocketGame()

            game.addPlayer(new Player(ws))

            games.set(gameid, game)
        } else if (type === 'join-game') {
            if (games.has(data)) {
                games.get(data).playerJoin(ws)
            }
        }
    })
})

const sessions = new Map()

const authMiddleware = (req, res, next) => {
    try {
        const auth = authenticate(req.signedCookies['session-cookie'])
        req.user = auth.username
        next()
    } catch (error) {
        res.status(400).json({ error: error })
    }
}

const authenticate = cookie => {
    if (sessions.has(cookie)) {
        const session = sessions.get(cookie)
        let fiveDays = 1000 * 60 * 60 * 24 * 5

        // Expires after five days
        if (session.at + fiveDays < Date.now()) {
            sessions.delete(cookie)
            throw new Error("Cookie expired")
        }

        return session.username
    }
    throw new Error("Doesn't exist")
}

// /api router
const auth = express.Router()
    .post('/authenticate', async (req, res) => {
        const { username, password } = req.body

        try {
            const foundUser = await User.findUser(username, password)
            const newUuid = uuid.v4()
            sessions.set(newUuid, { username: foundUser.username, at: Date.now() })
            res.cookie('session-cookie', newUuid, { signed: true, httpOnly: true })
            res.status(200).json({ username: foundUser.username })
        } catch (error) {
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
        const { username, password } = req.body

        if (username.length < 5 || password.length < 5) {
            res.status(400).json({ error: "Password or username is too short" })
        }

        try {
            const user = await User.create({ username, password })
            return res.status(200).json({ username: user.username })
        } catch (error) {
            return res.status(400).json({})
        }
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