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
            console.log(e.code, e.type)
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
    socket = null;

export function init(ws, canvas, scene) {
    window.addEventListener("keydown", keyListener)
    window.addEventListener("keyup", keyListener)
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    ctx = canvas.getContext("2d")
    gameScene = scene;

    promise.then(draw);
    tickInterval = setInterval(tick, 1000 / 30)
    socket = ws

    socket.on("update", updates => {
        updateObjects(updates)
    })

    socket.on("remove", gamelogic => {
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
}

const wallImage = new Image()
wallImage.src = '/assets/tile.PNG'

const barrelImage = new Image()
barrelImage.src = '/assets/barrel.PNG'

const bombImage = new Image()
bombImage.src = '/assets/bomb.PNG'

const backgroundImage = new Image()
backgroundImage.src = '/assets/background.PNG'

let promise = new Promise(res => {
    let done = 0, required = 0

    let add = function () {
        done++
        if (done >= required) res()
    }

    backgroundImage.onload = add
    required++

    wallImage.onload = add
    required++

    barrelImage.onload = add
    required++

    bombImage.onload = add
    required++
})

function render() {
    gameScene.forEach(function (arrayItem) {
        var type = arrayItem.type;
        var position = arrayItem.pos;
        switch (type) {
            case "WALL":
                ctx.drawImage(wallImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            case "BARREL":
                ctx.drawImage(barrelImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            case "PLAYER":
                ctx.fillStyle = "tomato";
                ctx.fillRect(tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            case "BOMB":
                ctx.drawImage(bombImage, tileSize * position.x, tileSize * position.y, tileSize, tileSize);
                break;
            default:
                console.error("unkown type", type);
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

export function removeObjects(idsToRemove) {
    idsToRemove.forEach(id => {
        gameScene.splice(gameScene.findIndex(g => g.id === id), 1)
    })
}


export function initializeMap(scene) {
    gameScene = scene;
}

export function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    let pattern = ctx.createPattern(backgroundImage, 'repeat')
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    render();
    window.requestAnimationFrame(draw)
}