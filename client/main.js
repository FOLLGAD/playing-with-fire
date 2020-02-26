document.addEventListener("DOMContentLoaded", init)

let x = 0, y = 0;
let ctx;
function init() {
    const canvas = document.querySelector("#game-canvas")
    canvas.width = 500
    canvas.height = 500

    ctx = canvas.getContext("2d")

    setInterval(() => {
        x++
        y++
    }, 10)
    
    draw();
}

function draw() {
    ctx.clearRect(0, 0, 500, 500)
    ctx.fillRect(x, y, 50, 50);
    window.requestAnimationFrame(draw)
}