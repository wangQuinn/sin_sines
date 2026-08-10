const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');
const CX = 200, CY = 200, R = 120;

let N = 8;
let points = [];

function initCircle(){
    points = [];
    for(let i = 0; i < N; i++){
        const angle = (i/N) * 2 * Math.PI;
        points.push({x : Math.cos(angle) * R + CX, y : Math.sin(angle) * R + CY});
    }
}

initCircle();

function drawCircle(){
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.beginPath();
    points.forEach((p,i)=>
    {
        if(i === 0){
            ctx.moveTo(p.x, p.y);
        }
        else{
            ctx.lineTo(p.x, p.y);
        }
    })
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.stroke();

    // points
    points.forEach((p,i)=>
    {
        ctx.beginPath();
        ctx.arc(p.x,p.y, 3, 0, 2 * Math.PI); //draw circle
        ctx.fillStyle = "red";
        ctx.fill();
    });
}
drawCircle();