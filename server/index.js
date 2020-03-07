const WebSocket = require('ws')
const http = require('http')
const express = require('express')
const path = require('path')
const uuid = require('uuid')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const cors = require('cors')

const User = require('./models/User')
const GameScore = require('./models/GameScore')

const { Game, Player } = require('./game')

// Loads the options from the .env file into process.env.{SETTING}
require('dotenv').config()

if (!process.env.cookieSecret) {
    throw new Error("Need a cookie secret in .env")
}

const PORT = process.env.PORT || 5000

const app = express()
const appCookieParser = cookieParser(process.env.cookieSecret)
app.use(appCookieParser)
app.use(bodyParser.json())
app.use(cors({ origin: false, credentials: true }))
const cookieOptions = { signed: true, httpOnly: true, sameSite: true }

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

    let leaveGame = () => {
        if (currentGame) {
            currentGame.leaveGame(ws)
            if (currentGame.sockets.length === 0) {
                currentGame.destroy()
                games.delete(currentGame.id)
            }
            currentGame = null
            currentPlayer = null
        }
    }

    ws.on('message', message => {
        const { type, data } = JSON.parse(message)

        // console.log(`${ws.username} says: ${type} ${data}`)

        // TODO: Add route for game list updates (gameRoomUpdate)
        // TODO: Leave games
        if (type === 'input') {
            if (currentPlayer) {
                currentGame.movePlayer(currentPlayer, data)
            }
        } else if (type === 'game-info') {
            ws.send(JSON.stringify({ type: 'new-game', data: currentGame.getData() }))
        } else if (type === 'create-game') {
            const gameid = uuid.v4()
            const game = new Game(gameid)

            currentPlayer = game.joinGame(ws)

            games.set(gameid, game)

            currentGame = game

            ws.send(JSON.stringify({ type: 'redirect-game', data: { id: game.id } }))

            let data = JSON.stringify({ type: 'update-gamelist', data: [game.getData()] })
            wss.clients.forEach(c => {
                c.send(data)
            })
        } else if (type === 'join-game') {
            if (games.has(data)) {
                let g = games.get(data)

                if (currentGame && currentGame.id !== g.id) {
                    currentGame.leaveGame(ws)
                } else if (!currentGame) {
                    currentPlayer = g.joinGame(ws)
                }

                currentGame = g
                ws.send(JSON.stringify({ type: 'joined-game', data: currentGame.getData() }))
            } else {
                ws.send(JSON.stringify({ type: 'not-found' }))
            }
        } else if (type === 'leave-game') {
            leaveGame()
        }
    })

    ws.on('close', () => {
        leaveGame()
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
            res.cookie('session-cookie', newUuid, cookieOptions)
            res.status(200).json({ username: foundUser.username })
        } catch (error) {
            console.error(error)
            res.status(401).json({})
        }
    })
    .get('/is-authenticated', authMiddleware, async (req, res) => {
        console.log(req.signedCookies)
        res.status(200).json({})
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
    .get('/logout', authMiddleware, async (req, res) => {
        res.clearCookie('session-cookie', cookieOptions)
        res.json({})
    })
    .get('/games', authMiddleware, async (req, res) => {
        console.log(games)
        res.status(200).json({ list: Array.from(games.values()).map(g => g.getData()) })
    })

app.use('/api', auth)

// Statically serve the contents of /public
app.use(express.static(path.join(__dirname, '../public')))

// Statically serve the contents of /dist
app.use(express.static(path.join(__dirname, '../dist')))

// For all other routes, serve the Vue frontend SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
})

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})