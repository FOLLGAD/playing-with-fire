const WebSocket = require('ws')
const https = require('https')
const express = require('express')
const path = require('path')
const uuid = require('uuid')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const csp = require('helmet-csp')
const sequelize = require('sequelize')

const User = require('./models/User')
const GameScore = require('./models/GameScore')

const { Game } = require('./game')

// Loads the options from the .env file into process.env.{SETTING}
require('dotenv').config()

if (!process.env.cookieSecret) {
    throw new Error("Need a cookie secret in .env")
}

const PORT = process.env.PORT || 5000

const app = express()
app.use(cors({ origin: "https://localhost:8000" }))

const appCookieParser = cookieParser(process.env.cookieSecret)

app.use(appCookieParser)
app.use(bodyParser.json())

app.use(csp({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"], // Websockets
        // sandbox: ['allow-forms', 'allow-scripts'],
        reportUri: '/report-violation',
        objectSrc: ["'self'"],
        upgradeInsecureRequests: true,
        workerSrc: false  // This is not set.
    },
    loose: false,
    reportOnly: false,
    setAllHeaders: false,
    disableAndroid: false,
    browserSniff: true
}))
const cookieOptions = { signed: true, httpOnly: true, sameSite: true }

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../tls/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../tls/cert.pem')),
}

// Create HTTPS server using the express app
const server = https.createServer(httpsOptions, app)

const games = new Map()

// Predefined violation handler.
// app.post(
//     '/report-violation',
//     // bodyparser.json({
//     //   type: ['json', 'application/csp-report']
//     // }),
//     (req, res) => {
//         if (req.body) {
//             console.log('csp violation: ', req.body)
//         } else {
//             console.log('csp violation: no data received!')
//         }
//         res.status(204).end()
//     }
// )

// Create websocket server
const wss = new WebSocket.Server({
    server,
    verifyClient: (info, next) => {
        appCookieParser(info.req, {}, () => {
            try {
                const sc = info.req.signedCookies['session-cookie']

                authenticate(sc, info.req.connection.remoteAddress)

                next(true)
            } catch (error) {
                console.log(error)
                next(false)
            }
        })
    }
})


wss.on('connection', (ws, req) => {
    const sc = req.signedCookies['session-cookie']
    ws.username = authenticate(sc, req.connection.remoteAddress)

    let currentGame = null

    // Wrapper to send JSON messages with ws.sendMsg(type, data)
    ws.sendMsg = (type, data) => {
        ws.send(JSON.stringify({ type, data }))
    }

    let leaveGame = async () => {
        if (currentGame) {
            let data = JSON.stringify({ type: 'player-leave', data: [ws.username] })
            currentGame.connections().forEach(s => {
                s.send(data)
            })
            currentGame.leaveGame(ws)
            if (currentGame.connections().length === 0) {
                currentGame.destroy()
                games.delete(currentGame.id)
            }
            currentGame = null
        }
    }

    ws.on('message', message => {
        const { type, data } = JSON.parse(message)

        let currentPlayer = null

        // console.log(`${ws.username} says: ${type} ${data}`)

        // TODO: Add route for game list updates (gameRoomUpdate)
        // TODO: Leave games
        if (type === 'input') {
            currentGame.movePlayer(ws, data)
        } else if (type === 'game-info') {
            ws.send(JSON.stringify({ type: 'new-game', data: currentGame.getData() }))
        } else if (type === 'create-game') {
            const gameid = uuid.v4()
            const game = new Game(gameid, ws)

            game.joinGame(ws)

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
                    currentGame = null
                }

                let alreadyJoined = g.players.find(p => p.username === ws.username)

                if (alreadyJoined) {
                    // Override socket
                    alreadyJoined.socket = ws
                    currentGame = g
                } else if (!currentGame) {
                    currentPlayer = g.joinGame(ws)
                }
                
                currentGame = g
                let gameData = currentGame.getData()
                ws.send(JSON.stringify({
                    type: 'joined-game', data: {
                        gamedata: gameData,
                        isHost: currentGame.host === ws,
                    }
                }))
                if (currentPlayer) {
                    console.log(currentPlayer)
                    let sendData = JSON.stringify({
                        type: 'player-joined', data: [
                            { username: currentPlayer.username, player: currentPlayer.id, diedAt: currentPlayer.diedAt }
                        ]
                    })
                    currentGame.players.forEach(p => p.socket && p.socket.send(sendData))
                }
                } else {
                ws.send(JSON.stringify({ type: 'not-found' }))
            }
    
        } else if(type === "start-game") {
            currentGame.start()
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
        const auth = authenticate(req.signedCookies['session-cookie'], req.connection.remoteAddress)
        req.user = auth.username
        next()
    } catch (error) {
        res.status(400).json({ error: error })
    }
}

const authenticate = (cookie, ip) => {
    if (sessions.has(cookie)) {
        const session = sessions.get(cookie)
        const time = 1000 * 60 * 30 // 30 min

        // Expires after 30 minutes of continuous inactivity
        if (session.at + time < Date.now()) {
            sessions.delete(cookie)
            throw new Error("Cookie expired")
        }

        if (session.ip !== ip) {
            throw new Error("Calling from wrong IP address")
        }

        // Update activity
        session.at = Date.now()

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
            sessions.set(newUuid, { username: foundUser.username, at: Date.now(), ip: req.ip })
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
    .get('/highscores', async (req, res) => {
        console.log("Highscore access")
        await GameScore.findAll({
            attributes: ['username', [sequelize.fn('count', sequelize.col('username')), 'count']],
            group: ['gameScore.username'],
            limit: 10,
            where: {
                placement: 1
            },
            raw: true,
            order: sequelize.literal('count DESC')
        }).then((winners) => {
            console.table(winners)
            res.status(200).json({ list: winners })
        });
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