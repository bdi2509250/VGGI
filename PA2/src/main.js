import { createProgram } from './gl.js';
import { perspective, lookAt, identity, multiply, rotateX, rotateY, scale, mat3FromMat4, mat3InverseTranspose } from './mat4.js';
import { VERT_SRC, FRAG_SRC } from './shaders.js';
import { Model } from './Model.js';
import { initUI } from './ui.js';

const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
if (!gl) { alert('WebGL not supported'); throw new Error('WebGL not supported'); }

const program = createProgram(gl, VERT_SRC, FRAG_SRC);
const loc = {
  a_position: gl.getAttribLocation(program, 'a_position'),
  a_normal:   gl.getAttribLocation(program, 'a_normal'),
  u_mvp:      gl.getUniformLocation(program, 'u_mvp'),
  u_mv:       gl.getUniformLocation(program, 'u_mv'),
  u_normalMat:gl.getUniformLocation(program, 'u_normalMat'),
  u_lightPos: gl.getUniformLocation(program, 'u_lightPos'),
  u_ambient:  gl.getUniformLocation(program, 'u_ambient'),
  u_diffuse:  gl.getUniformLocation(program, 'u_diffuse'),
  u_specular: gl.getUniformLocation(program, 'u_specular'),
  u_shininess:gl.getUniformLocation(program, 'u_shininess'),
};

const FOV = 30 * Math.PI / 180;
const FIT_MARGIN = 1.2, BOUND_PAD = 1.1;

let width = 0, height = 0;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(canvas.clientWidth * dpr);
  const h = Math.floor(canvas.clientHeight * dpr);
  if (w !== width || h !== height) {
    width = w; height = h;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
}
window.addEventListener('resize', resize);
resize();

let distance = 6.0, rotX = 0.35, rotY = -0.8;
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  rotY += dx * 0.005;
  rotX -= dy * 0.005;
  rotX = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, rotX));
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = Math.exp(e.deltaY * 0.0015);
  distance = Math.max(2.0, Math.min(50.0, distance * factor));
}, { passive: false });

const params = { a:1, r:2, theta:0, Nu:64, Nv:128 };
const model = new Model(gl, params);

const R = (model.params.r + model.params.a) * BOUND_PAD;
distance = (R / Math.tan(FOV / 2)) * FIT_MARGIN;

initUI({ Nu: params.Nu, Nv: params.Nv }, ({ Nu, Nv }) => {
  model.rebuild({ Nu, Nv });
});

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.frontFace(gl.CW);

gl.clearColor(0.055, 0.065, 0.08, 1.0);

gl.useProgram(program);
gl.uniform3f(loc.u_ambient,  0.08, 0.08, 0.10);
gl.uniform3f(loc.u_diffuse,  0.85, 0.85, 0.95);
gl.uniform3f(loc.u_specular, 0.40, 0.40, 0.40);
gl.uniform1f(loc.u_shininess, 64.0);

function render() {
  resize();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = width / Math.max(1, height);
  const proj = perspective(FOV, aspect, 0.01, 200);

  const eye = [0, 0, distance];
  const view = lookAt(eye, [0,0,0], [0,1,0]);

  let modelM = identity();
  modelM = rotateY(modelM, rotY);
  modelM = rotateX(modelM, rotX);
  modelM = scale(modelM, 0.9, 0.9, 0.9);

  const mv = multiply(view, modelM);
  const mvp = multiply(proj, mv);
  const nmat = mat3InverseTranspose(mat3FromMat4(mv));

  const L = [3.0, 1.5, 3.0];
  gl.uniform3fv(loc.u_lightPos, new Float32Array(L));

  gl.uniformMatrix4fv(loc.u_mvp, false, mvp);
  gl.uniformMatrix4fv(loc.u_mv,  false, mv);
  gl.uniformMatrix3fv(loc.u_normalMat, false, nmat);

  model.draw(program, loc);
  requestAnimationFrame(render);
}

render();
