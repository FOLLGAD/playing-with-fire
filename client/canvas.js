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

export function init(canvas, scene) {
    window.addEventListener("keydown keyup", keyDownListener)
    canvas.width = 500
    canvas.height = 500
    ctx = canvas.getContext("2d")
    gameScene = scene;


//    promise.then(draw);
}

// TODO: Send input to server

export function destroy() {
    window.removeEventListener("keydown keyup", keyDownListener)
}

const wallImage = new Image()
wallImage.src = '/assets/tile.png'

const barrelImage = new Image()
barrelImage.src = '/assets/barrel.png'

let promise = new Promise(res => {
    let done = 0
    let add = () => {
        done++
        if (done >= 2) res()
    }

    wallImage.onload = add

    barrelImage.onload = add
})

function render() {
    var height = canvasHeight / 12;
    var width = canvasWidth / 14;

    gameScene.forEach(function (arrayItem) {
        var type = arrayItem.type;
        var position = arrayItem.pos;
        switch (type) {
            case "WALL":
                ctx.drawImage(wallImage, height * position.x, width * position.y, width, height);
                break;
            case "BARREL":
                ctx.drawImage(barrelImage, height * position.x, width * position.y, width, height);
                break;
            case "PLAYER":
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect((height/2) * position.x, (width/2) * position.y, width, height);
                break;
            case "BOMB":
                base_image.onload = function(){
                    ctx.drawImage(base_image, height * position.x, width * position.y, width, height);
                    }
                base_image.src = 'assets/bomb.PNG';
                ctx.drawImage(base_image, height * position.x, width * position.y, width, height);
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
//    promise.then(draw);
}

export function removeObjects(objects) {
    objects.forEach(d => {
        gameScene.splice(d.id, 1)
    })
//    promise.then(draw);
}


export function initializeMap(scene) {
    gameScene = scene;
}


export function draw() {
    if (ctx !== undefined){
        console.log("CTX")
        console.log(ctx)
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        var base_image = new Image()
        base_image.onload = function () {
            ctx.drawImage(base_image, 0, 0, canvasWidth, canvasHeight);
        }
        base_image.src = 'assets/barrel.PNG';
        render();
        ctx.fillRect(0 ,0 ,10 ,10)
        window.requestAnimationFrame(draw)
    }
}


let canvasWidth = 500, canvasHeight = 500;
let ctx;
let gameScene = [];