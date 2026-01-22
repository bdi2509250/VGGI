import { createGL, resizeToDisplaySize, createProgram, loadTexture2D } from "./gl.js";
import { identity, multiply, perspective, lookAt, rotateX, rotateY, mat3FromMat4, mat3InverseTranspose } from "./mat4.js";
import { VERT_SRC, FRAG_SRC } from "./shaders.js";
import { buildAstroidalTorus } from "./astroidal_torus.js";
import { Model } from "./Model.js";
import { initUI } from "./ui.js";

const canvas = document.getElementById("glcanvas");
const gl = createGL(canvas);

gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);

const program = createProgram(gl, VERT_SRC, FRAG_SRC);
gl.useProgram(program);

const locs = {
  a_position: gl.getAttribLocation(program, "a_position"),
  a_normal: gl.getAttribLocation(program, "a_normal"),
  a_uv: gl.getAttribLocation(program, "a_uv"),
  a_tangent: gl.getAttribLocation(program, "a_tangent"),

  u_mv: gl.getUniformLocation(program, "u_mv"),
  u_mvp: gl.getUniformLocation(program, "u_mvp"),
  u_normalMat: gl.getUniformLocation(program, "u_normalMat"),
  u_uvScale: gl.getUniformLocation(program, "u_uvScale"),
  u_uvRotation: gl.getUniformLocation(program, "u_uvRotation"),

  u_lightPosV: gl.getUniformLocation(program, "u_lightPosV"),
  u_ambient: gl.getUniformLocation(program, "u_ambient"),
  u_diffuseColor: gl.getUniformLocation(program, "u_diffuseColor"),
  u_specularColor: gl.getUniformLocation(program, "u_specularColor"),
  u_shininess: gl.getUniformLocation(program, "u_shininess"),

  u_diffuseMap: gl.getUniformLocation(program, "u_diffuseMap"),
  u_specularMap: gl.getUniformLocation(program, "u_specularMap"),
  u_normalMap: gl.getUniformLocation(program, "u_normalMap"),
};

const texDiffuse  = loadTexture2D(gl, "assets/diffuse.png");
const texSpecular = loadTexture2D(gl, "assets/specular.png");
const texNormal   = loadTexture2D(gl, "assets/normal.png");

gl.uniform1i(locs.u_diffuseMap, 0);
gl.uniform1i(locs.u_specularMap, 1);
gl.uniform1i(locs.u_normalMap, 2);

gl.uniform1f(locs.u_uvScale, 1.0);
gl.uniform1f(locs.u_uvRotation, 0.0);

gl.uniform3f(locs.u_ambient, 0.10, 0.10, 0.12);
gl.uniform3f(locs.u_diffuseColor, 1.0, 1.0, 1.0);
gl.uniform3f(locs.u_specularColor, 1.0, 1.0, 1.0);
gl.uniform1f(locs.u_shininess, 64.0);

let model = null;
let rotX = -0.5;
let rotY = 0.9;
let dist = 5.0;
let dragging = false;
let lastX = 0, lastY = 0;

// Texture rotation angle (in radians)
let textureRotation = 0.0;
const ROTATION_SPEED = 1.5; // radians per second

// Keyboard state
const keys = {};

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener("mouseup", () => dragging = false);
window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  rotY += dx * 0.005;
  rotX += dy * 0.005;
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const s = Math.sign(e.deltaY);
  dist *= (s > 0) ? 1.08 : 0.92;
  dist = Math.min(30, Math.max(2.2, dist));
}, { passive: false });

// Keyboard input for texture rotation
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

let curU = 128;
let curV = 128;
let texScale = 1.0;

function rebuild(U, V) {
  const geom = buildAstroidalTorus(U, V);
  model = new Model(gl, geom);
}

initUI(({ U, V, texScale: ts }) => {
  texScale = (typeof ts === "number" && isFinite(ts)) ? ts : 1.0;
  if (!model || U !== curU || V !== curV) {
    curU = U;
    curV = V;
    rebuild(U, V);
  }
});

let lastTime = performance.now();

function frame(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Update texture rotation based on keyboard input
  if (keys['KeyW'] || keys['KeyA'] || keys['KeyS'] || keys['KeyD']) {
    if (keys['KeyW']) textureRotation += ROTATION_SPEED * deltaTime; // Rotate CCW
    if (keys['KeyS']) textureRotation -= ROTATION_SPEED * deltaTime; // Rotate CW
    if (keys['KeyA']) textureRotation += ROTATION_SPEED * deltaTime; // Rotate CCW
    if (keys['KeyD']) textureRotation -= ROTATION_SPEED * deltaTime; // Rotate CW
  }

  if (resizeToDisplaySize(canvas)) {
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  gl.clearColor(0.04, 0.05, 0.07, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (!model) {
    requestAnimationFrame(frame);
    return;
  }

  const aspect = canvas.width / canvas.height;
  const P = perspective(60 * Math.PI / 180, aspect, 0.1, 100.0);
  const Vw = lookAt([0, 0, dist], [0, 0, 0], [0, 1, 0]);
  let M = identity();
  M = rotateX(M, rotX);
  M = rotateY(M, rotY);
  const MV = multiply(Vw, M);
  const MVP = multiply(P, MV);

  gl.uniformMatrix4fv(locs.u_mv, false, MV);
  gl.uniformMatrix4fv(locs.u_mvp, false, MVP);

  const n3 = mat3InverseTranspose(mat3FromMat4(MV));
  gl.uniformMatrix3fv(locs.u_normalMat, false, n3);

  const lightWorld = [3.5, 2.5, 4.0, 1.0];
  const lx = Vw[0]*lightWorld[0] + Vw[4]*lightWorld[1] + Vw[8]*lightWorld[2]  + Vw[12]*lightWorld[3];
  const ly = Vw[1]*lightWorld[0] + Vw[5]*lightWorld[1] + Vw[9]*lightWorld[2]  + Vw[13]*lightWorld[3];
  const lz = Vw[2]*lightWorld[0] + Vw[6]*lightWorld[1] + Vw[10]*lightWorld[2] + Vw[14]*lightWorld[3];
  gl.uniform3f(locs.u_lightPosV, lx, ly, lz);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texDiffuse);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texSpecular);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texNormal);
  
  gl.uniform1f(locs.u_uvScale, texScale);
  gl.uniform1f(locs.u_uvRotation, textureRotation);

  model.draw(locs);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);