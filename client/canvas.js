let keyMaps = {
    left: {
        code: "KeyA",
        value: false,
    },
    right: {
        code: "KeyD",
        value: false,
    },
    up: {
        code: "KeyW",
        value: false,
    },
    down: {
        code: "KeyS",
        value: false,
    },
    space: {
        code: "Space",
        value: false,
    },
}

function keyListener(e) {
    if (e.repeat) return
    Object.keys(keyMaps).forEach(key => {
        if (e.code === keyMaps[key].code) {
            keyMaps[key].value = e.type === "keydown"
        }
    })
}

const tileSize = 40;
const canvasWidth = tileSize * 15,
    canvasHeight = tileSize * 13;

let ctx,
    gameScene = [],
    tickInterval = null,
    inputSentAt = null,
    socket = null,
    rendering = false;

export function init(ws, canvas, scene) {
    window.addEventListener("keydown", keyListener)
    window.addEventListener("keyup", keyListener)
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    ctx = canvas.getContext("2d")
    gameScene = scene;
    rendering = true;

    promise.then(draw);
    tickInterval = setInterval(tick, 1000 / 30)
    socket = ws

    socket.on("update", updates => {
        updateObjects(updates)
    })

    socket.on("delete", gamelogic => {
        // make game-canvas takes in the game logic using gamelogic
        removeObjects(gamelogic);
    });
}

// TODO: Send input to server
function tick() {
    let lastSentAt = inputSentAt
    inputSentAt = Date.now()
    if (!lastSentAt) return;

    const input = {
        delta: inputSentAt - lastSentAt,                    // Get the time diff in milliseconds between latest send
        xdt: -keyMaps.left.value + keyMaps.right.value,     // Speed in x-axis
        ydt: -keyMaps.up.value + keyMaps.down.value,        // Speed in y-axis
        space: keyMaps.space.value,                         // Is dropping bomb?
    }

    if (input.xdt != 0 || input.ydt != 0 || input.space != 0) {
        socket.send("input", input)
        keyMaps.space.value = false
    }
}

// Remove all listeners and intervals
export function destroy() {
    window.removeEventListener("keydown", keyListener)
    window.removeEventListener("keyup", keyListener)
    clearInterval(tickInterval)
    rendering = false
}

const wallImage = new Image()
wallImage.src = '/assets/tile.PNG'

const barrelImage = new Image()
barrelImage.src = '/assets/barrel.PNG'

const bombImage = new Image()
bombImage.src = '/assets/dynamite.png'

const backgroundImage = new Image()
backgroundImage.src = '/assets/background.PNG'

const fireImage = new Image()
fireImage.src = '/assets/fire.png'

const shoesImage = new Image()
shoesImage.src = '/assets/shoe.png'

const lightningImage = new Image()
lightningImage.src = '/assets/lightning.png'

const extrabombImage = new Image()
extrabombImage.src = '/assets/extrabomb.png'

const playerImage = new Image()
playerImage.src = '/assets/player.png'

let promise = new Promise(res => {
    let done = 0, required = 0

    let addImg = function (img) {
        required++
        img.onload = () => {
            done++
            if (done >= required) res()
        }
        img.onerror = () => {
            console.error("Image didnt load successfully:", img.src)
            img.onload()
        }
    }
    addImg(extrabombImage)
    addImg(lightningImage)
    addImg(backgroundImage)
    addImg(wallImage)
    addImg(bombImage)
    addImg(barrelImage)
    addImg(fireImage)
    addImg(shoesImage)
    addImg(playerImage)
})

function render() {
    ctx.beginPath()
    ctx.fillStyle = "#cdb99d"
    ctx.strokeStyle = "#111"
    ctx.lineWidth = 3
    gameScene
        .filter(g => g.type === "WALL")
        .forEach(g => {
            ctx.rect(tileSize * g.pos.x, tileSize * g.pos.y, tileSize, tileSize)
        })
    ctx.fill()
    ctx.stroke()

    gameScene.forEach(function (arrayItem) {
        var type = arrayItem.type;
        var position = arrayItem.pos;
        switch (type) {
            case "WALL":
                break;
            case "BARREL":
                ctx.drawImage(barrelImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            case "BOMB":
                ctx.drawImage(bombImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            case "FIRE":
                ctx.drawImage(fireImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            case "POWERUP":
                switch (arrayItem.powerupType) {
                    case "SPEED":
                        ctx.drawImage(shoesImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                        break;
                    case "EXPLOSION":
                        ctx.drawImage(lightningImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                        break;
                    case "BOMBS":
                        ctx.drawImage(extrabombImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                        break;
                }
                break;
            case "PLAYER":
                // ctx.drawImage(barrelImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                ctx.fillStyle = "tomato";
                ctx.fillRect(tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            default:
                console.error("unkown type, this block doesnt exist in game", type);
        }
    });
}

export function updateObjects(objects) {
    objects.forEach(d => {
        let found = gameScene.find(g => g.id === d.id)
        if (found) {
            Object.assign(found, d)
        } else {
            gameScene.push(d)
        }
    })
}

export function removeObjects(objects) {
    objects.forEach(d => {
        let playerTest = gameScene.splice(gameScene.findIndex(g => g.id === d), 1)
    })
}


export function initializeMap(scene) {
    gameScene = scene;
}

export function draw() {
    if (!rendering) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    let pattern = ctx.createPattern(backgroundImage, 'repeat')
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    render();
    window.requestAnimationFrame(draw)
}