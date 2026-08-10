const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');
const CX = 200, CY = 200, R = 120;

let N = 8; //number of points on the circle
let points = [];

// initalizes the location of points on the circle
function initCircle(){
    points = [];
    for(let i = 0; i < N; i++){
        const angle = (i/N) * 2 * Math.PI;
        points.push({x : Math.cos(angle) * R, y : Math.sin(angle) * R});
    }
}
initCircle();

// draws the circle and points on the canvas
function drawCircle(){
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.beginPath();
    points.forEach((p,i)=>
    {
        if(i === 0){
            ctx.moveTo(p.x + CX, p.y + CY);
        }
        else{
            ctx.lineTo(p.x + CX, p.y + CY);
        }
    })
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.stroke();

    // points
    points.forEach((p,i)=>
    {
        ctx.beginPath();
        const squareSize = 8;
        ctx.rect((p.x + CX) - squareSize/2 , (p.y + CY) - squareSize/2, squareSize,squareSize); //draw square
        ctx.fillStyle = "red";
        ctx.fill();
    });
}
drawCircle();

let posIndex = null;
function getPos(evt){
    const rect = drawCanvas.getBoundingClientRect();
    const x = evt.clientX - rect.left - CX ;
    const y = evt.clientY - rect.top - CY;
    console.log(`x: ${x}, y: ${y}`);
    return {x, y };
}

drawCanvas.addEventListener('mousedown', (evt) => {
    const pos = getPos(evt);
    points.forEach((p, i) => {
        if(Math.hypot(p.x -pos.x, p.y - pos.y) < 10){
            posIndex = i;
        }
    });
});

window.addEventListener('mousemove', (evt) => {
    if(posIndex !== null){
        let pos = getPos(evt);
        points[posIndex] = pos;
    }
    drawCircle();
});

window.addEventListener('mouseup', (evt) => {
    posIndex = null;
});


//reset button
const rst = document.getElementById('resetButton');
rst.addEventListener('click', () => {
    initCircle();
    drawCircle();
});