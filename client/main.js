document.addEventListener("DOMContentLoaded", init)

document.addEventListener("keydown", movement)

let x = 0, y = 0;
let canvasWidth= 500, canvasHeight=500;
let ctx;
function init() {
    const canvas = document.querySelector("#game-canvas")
    canvas.width = 500
    canvas.height = 500

    ctx = canvas.getContext("2d")

    setInterval(() => {
        //x++
        //y++
    }, 10)
    
    draw();
}

function drawBoxes(){
    var height = canvasHeight/11;
    var width = canvasWidth/13;
    //We want eleven box-areas in height.
    for(var i = 0; i<11; i++){
        // Only add boxes to even rows.
        if(i%2){
            //We want thirteen box-areas in width.
            for(var m = 0; m< 13; m++){
                // Only add boxes to even columns.
                if(m%2){
                    ctx.fillRect(m*width, i*height, width, height);
                }
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    drawBoxes();
    ctx.rect(0,0,canvasWidth,canvasHeight)
    ctx.fillRect(x, y, 50, 50);
    window.requestAnimationFrame(draw)
}

function movement(e){
    if(e.keyCode == '37'){
        x -= 10;
    }else if(e.keyCode == '38'){
        y -= 10;
    }else if(e.keyCode == '39'){
        x += 10;
    }else if(e.keyCode == '40'){
        y +=10;
    }
}