let input = {
    delta: 0,
    xdt: 0,     // Speed in x-axis
    ydt: 0,     // Speed in y-axis
    space: 0,   // Is dropping bomb?
}

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

function keyDownListener(e) {
    Object.keys(keyMaps).forEach(key => {
        if (e.code === keyMaps[key].code) {
            keyMaps[key].value = e.type === "keydown"
        }
    })
}

let ctx;
let gameScene = [];
const tileSize = 40;
const canvasWidth = tileSize * 14,
    canvasHeight = tileSize * 12;

export function init(canvas, scene) {
    window.addEventListener("keydown keyup", keyDownListener)
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    ctx = canvas.getContext("2d")
    gameScene = scene;

    promise.then(draw);
}

// TODO: Send input to server

export function destroy() {
    window.removeEventListener("keydown keyup", keyDownListener)
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
                ctx.fillRect((tileSize / 2) * position.x, (tileSize / 2) * position.y, tileSize, tileSize);
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
    gameScene.forEach(g => {
        objects.forEach(d => {
            if (g.id == d.id) {
                Object.assign(g, d)
            }
        })
    })
}

export function removeObjects(idsToRemove) {
    idsToRemove.forEach(d => {
        gameScene.splice(gameScene.findIndex(g => g.id === d), 1)
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