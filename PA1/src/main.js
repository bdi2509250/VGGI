import { createProgram } from './gl.js';
import { perspective, lookAt, identity, multiply, rotateX, rotateY, scale } from './mat4.js';
import { Model } from './Model.js';

const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl', { antialias:true, alpha:false });
if (!gl) throw new Error('WebGL not supported');

const VS = `attribute vec3 a_position; uniform mat4 u_mvp; void main(){ gl_Position = u_mvp*vec4(a_position,1.0); }`;
const FS = `precision mediump float; uniform vec3 u_color; void main(){ gl_FragColor=vec4(u_color,1.0); }`;
const program = createProgram(gl, VS, FS);
const a_position = gl.getAttribLocation(program,'a_position');
const u_mvp = gl.getUniformLocation(program,'u_mvp');
const u_color = gl.getUniformLocation(program,'u_color');

let w=0,h=0;
function resize(){
  const dpr = window.devicePixelRatio||1;
  const nw = Math.floor(canvas.clientWidth*dpr);
  const nh = Math.floor(canvas.clientHeight*dpr);
  if(nw!==w||nh!==h){ w=nw; h=nh; canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
}
window.addEventListener('resize', resize); resize();

const FOV = 30*Math.PI/180, FIT=1.2, PAD=1.1;
let distance=6.0, rotX=0.35, rotY=-0.8;

let dragging=false, lastX=0,lastY=0;
canvas.addEventListener('mousedown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;});
window.addEventListener('mouseup',()=>dragging=false);
window.addEventListener('mousemove',e=>{
  if(!dragging) return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY;
  rotY+=dx*0.005; rotX-=dy*0.005;
  rotX=Math.max(-Math.PI/2+0.01, Math.min(Math.PI/2-0.01, rotX));
});
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const factor=Math.exp(e.deltaY*0.0015); 
  distance=Math.max(2, Math.min(50, distance*factor));
},{passive:false});

const model = new Model(gl, { a:1, r:2, theta:0, Nu:64, Nv:128 });
const R=(model.params.r+model.params.a)*PAD;
distance = (R/Math.tan(FOV/2))*FIT;

document.getElementById('uCount').textContent = String(model.counts.u);
document.getElementById('vCount').textContent = String(model.counts.v);

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.055,0.065,0.08,1);

function render(){
  resize();
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const aspect=w/Math.max(1,h);
  const proj=perspective(FOV, aspect, 0.01, 200);
  const view=lookAt([0,0,distance],[0,0,0],[0,1,0]);
  let m=identity(); m=rotateY(m,rotY); m=rotateX(m,rotX); m=scale(m,0.9,0.9,0.9);
  const mvp=multiply(multiply(proj,view),m);
  model.draw(program, a_position, u_mvp, mvp, u_color);
  requestAnimationFrame(render);
}
render();
