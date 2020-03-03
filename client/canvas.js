export function init(canvas, scene) {
    canvas.width = 500
    canvas.height = 500
    console.log("DID I START?")
    ctx = canvas.getContext("2d")
    gameScene = scene;
    draw();
}

// TODO: Send input to server

export function render() {
    var height = canvasHeight / 11;
    var width = canvasWidth / 13;

    gameScene.forEach(function (arrayItem) {
        var type = arrayItem.type;
        var position = arrayItem.pos;
        var base_image = new Image()
        switch (type) {
            case "WALL":
                console.log(" DO I FIND THE WALL?")
                base_image.onload = function(){
                ctx.drawImage(base_image, height * position.x, width * position.y, width, height);
                }
                base_image.src = 'assets/tile.PNG';
                break;
            case "BARREL":
                base_image.onload = function(){
                    ctx.drawImage(base_image, height * position.x, width * position.y, width, height);
                    }
                base_image.src = 'assets/barrel.PNG';
                ctx.drawImage(base_image, height * position.x, width * position.y, width, height);
                break;
            case "PLAYER":
                console.log(" DO I FIND THE PLAYER?")
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(height * position.x, width * position.y, width, height);
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
    draw()
}

export function removeObjects(objects) {
        objects.forEach(d => {
            gameScene.splice(d.id, 1)
        })
    draw()
}


export function initializeMap(scene){
    gameScene = scene;
}


export function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    var base_image = new Image()
    base_image.onload = function(){
        ctx.drawImage(base_image, 0, 0, canvasWidth, canvasHeight);
        }
    base_image.src = 'assets/barrel.PNG';
    render();
    ctx.fillRect(0 ,0 ,10 ,10)
    window.requestAnimationFrame(draw)
}


let canvasWidth = 500, canvasHeight = 500;
let ctx;
let gameScene = [];