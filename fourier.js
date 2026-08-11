const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');
const CX = 200, CY = 200, R = 120;



let N = 10; //number of points on the circle
let harmonics = N/2;
let points = [];
let playing = true;

//sliders and buttons ////////////////////////////
const harmonicsSlider = document.getElementById('hSlider');
harmonicsSlider.min = 1; harmonicsSlider.max = N; harmonicsSlider.value = N/2;
harmonicsSlider.addEventListener('input', () => {
    harmonics = parseInt(harmonicsSlider.value);
    document.getElementById('hVal').innerHTML = harmonics;
});
const nSlider = document.getElementById('nSlider');
nSlider.min = 1; nSlider.max = 20; nSlider.value = nSlider.max/2;
nSlider.addEventListener('input', () => {
    N = parseInt(nSlider.value);
    document.getElementById('nVal').innerHTML = N;
    initCircle();
    trace = []; // clear
    harmonicsSlider.max = N; harmonicsSlider.value = N/2;
    recompute();
});
//reset button
const rst = document.getElementById('resetButton');
rst.addEventListener('click', () => {
    initCircle();
    drawCircle();
});
//pause button
document.getElementById('pauseButton').addEventListener('click', (e) => {
    playing = !playing;
    e.target.textContent = playing ? "Pause" : "Play";
});
//sliders and buttons ////////////////////////////

// initalizes the location of points on the circle
function initCircle(){
    points = [];
    for(let i = 0; i < N; i++){
        const angle = (i/N) * 2 * Math.PI;
        points.push({x : Math.cos(angle) * R, y : Math.sin(angle) * R});
    }
}
initCircle();


//Discrete Fourier Transfrom! not the fast one. 
/* 
idea is: get the point, imagine it's in an imaginary plane, and then get the angle and the radius of that point. 
*/
function computeFourier(){
    const n = points.length;
    const coeffs = [];
    for(let k =0; k <n; k++){  //how much frequency we want to compute? 
        let re = 0, im = 0;
        for(let m = 0; m < n; m++) { //which point we're looking at
            const angle = -2 * Math.PI * k * m/n;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            re += points[m].x * cos - points[m].y * sin;
            im += points[m].x * sin + points[m].y * cos;
        }
        re /= n;
        im /=n;
        const freq = k <= n/2 ? k : k-n; //negative frequencies. 
        coeffs.push({freq, re, im});
    }
    coeffs.sort((a,b) => Math.abs(a.freq) - Math.abs(b.freq)); //sort by frequency
    console.log(coeffs);
    return coeffs;
}

function evalAt(t, terms){
    let x = CX, y = CY; //centre 
    const chain = [{x,y}];
    terms.forEach((term) => {
        const angle = term.freq * t;
        x += term.re * Math.cos(angle) - term.im * Math.sin(angle);
        y += term.re * Math.sin(angle) + term.im * Math.cos(angle); //rotation
        chain.push({x,y});
    });
    return chain; // last point in this chain is the final point of the fourier series at time t ! 
}

//reconstruction of the fourier series (right panel)
const display = document.getElementById('displayCanvas');
const dctx = display.getContext('2d');

let t = 0; trace = [];
function drawRight(coeffs){
    dctx.clearRect(0, 0, display.width, display.height);
    const terms = coeffs.slice(0, harmonics);
    const chain = evalAt(t, terms);
    for(let i = 0; i < chain.length -1; i++){
        const r = Math.hypot(terms[i].re, terms[i].im);
        dctx.beginPath();
        dctx.arc(chain[i].x, chain[i].y, r, 0, 2*Math.PI);
        dctx.strokeStyle = "#ccc";
        dctx.stroke();
        dctx.beginPath();
        dctx.moveTo(chain[i].x, chain[i].y);
        dctx.lineTo(chain[i+1].x, chain[i+1].y);
        dctx.strokeStyle = "red";
        dctx.stroke();
    }
    const tip = chain[chain.length -1];
    trace.push(tip);
    if(trace.length > 700){ //path lasting effect 
        trace.shift(); }
    dctx.beginPath();
    trace.forEach((p,i) => {
        if(i === 0){
            dctx.moveTo(p.x, p.y);
        }
        else{ dctx.lineTo(p.x, p.y); }
        dctx.strokeStyle = "#11e";
        dctx.lineWidth = 2;
    });
    dctx.stroke();
}

let cache = computeFourier();
function recompute(){
    cache = computeFourier();
}
function loop() {
    if(playing) t += 0.02;
    drawCircle();
    if(playing) drawRight(cache);

    requestAnimationFrame(loop);
}
loop();

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

const rect = drawCanvas.getBoundingClientRect();

let posIndex = null;
function getPos(evt){
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
        drawCircle();
        recompute();
    } 
});

window.addEventListener('mouseup', (evt) => {
    posIndex = null;
});