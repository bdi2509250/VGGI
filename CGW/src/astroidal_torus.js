function normalize3(v) {
  const l = Math.hypot(v[0], v[1], v[2]);
  if (!isFinite(l) || l < 1e-12) return [0, 0, 0];
  return [v[0] / l, v[1] / l, v[2] / l];
}

function sub3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function mul3(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function wrap01(x) {
  x = x % 1;
  if (x < 0) x += 1;
  return x;
}

export function buildAstroidalTorus(arg1 = 128, arg2 = 128) {
  let a = 1.0;
  let r = 2.0;
  let theta = 0.0;
  let Nu, Nv;

  if (typeof arg1 === "object" && arg1 !== null) {
    ({ a = 1, r = 2, theta = 0, Nu = 64, Nv = 128 } = arg1);
  } else {
    Nu = arg1 | 0;
    Nv = arg2 | 0;
  }

  Nu = Math.max(24, Nu | 0);
  Nv = Math.max(24, Nv | 0);

  const ct = Math.cos(theta), st = Math.sin(theta);

  function surface(u01, v01) {
    const u = -Math.PI + 2 * Math.PI * u01;
    const v = 2 * Math.PI * v01;
    const cu = Math.cos(u), su = Math.sin(u);
    const x0 = a * cu * cu * cu;
    const z0 = a * su * su * su;
    const xr = x0 * ct - z0 * st;
    const zr = x0 * st + z0 * ct;
    const rad = r + xr;
    const cv = Math.cos(v), sv = Math.sin(v);
    return [rad * cv, rad * sv, zr];
  }

  const positions = [];
  const normals = [];
  const uvs = [];
  const tangents = [];
  const indices = [];

  const epsU = 1 / Nu;
  const epsV = 1 / Nv;
  for (let j = 0; j <= Nv; j++) {
    const v01 = j / Nv;
    for (let i = 0; i <= Nu; i++) {
      const u01 = i / Nu;

      const p = surface(u01, v01);
      positions.push(p[0], p[1], p[2]);
      uvs.push(u01, v01);
      const uP = wrap01(u01 + epsU);
      const uM = wrap01(u01 - epsU);
      const vP = wrap01(v01 + epsV);
      const vM = wrap01(v01 - epsV);
      const puP = surface(uP, v01);
      const puM = surface(uM, v01);
      const pvP = surface(u01, vP);
      const pvM = surface(u01, vM);
      const du = sub3(puP, puM);
      const dv = sub3(pvP, pvM);

      let n = normalize3(cross3(du, dv));
      if (Math.hypot(n[0], n[1], n[2]) < 1e-8) n = [0, 0, 1];
      normals.push(n[0], n[1], n[2]);

      tangents.push(1, 0, 0);
    }
  }

  const row = Nu + 1;
  for (let j = 0; j < Nv; j++) {
    for (let i = 0; i < Nu; i++) {
      const a0 = j * row + i;
      const b0 = a0 + 1;
      const c0 = a0 + row;
      const d0 = c0 + 1;

      indices.push(a0, c0, b0);
      indices.push(b0, c0, d0);
    }
  }

  const tanAcc = Array((Nu + 1) * (Nv + 1)).fill(0).map(() => [0, 0, 0]);

  function getPos(idx) {
    const k = idx * 3;
    return [positions[k], positions[k + 1], positions[k + 2]];
  }
  function getUV(idx) {
    const k = idx * 2;
    return [uvs[k], uvs[k + 1]];
  }

  for (let t = 0; t < indices.length; t += 3) {
    const i0 = indices[t], i1 = indices[t + 1], i2 = indices[t + 2];

    const p0 = getPos(i0), p1 = getPos(i1), p2 = getPos(i2);
    const w0 = getUV(i0), w1 = getUV(i1), w2 = getUV(i2);

    const e1 = sub3(p1, p0);
    const e2 = sub3(p2, p0);

    const du1 = w1[0] - w0[0];
    const dv1 = w1[1] - w0[1];
    const du2 = w2[0] - w0[0];
    const dv2 = w2[1] - w0[1];

    const denom = (du1 * dv2 - dv1 * du2);
    if (Math.abs(denom) < 1e-10) continue;

    const inv = 1.0 / denom;
    const T = mul3(sub3(mul3(e1, dv2), mul3(e2, dv1)), inv);

    tanAcc[i0] = add3(tanAcc[i0], T);
    tanAcc[i1] = add3(tanAcc[i1], T);
    tanAcc[i2] = add3(tanAcc[i2], T);
  }

  for (let i = 0; i < tanAcc.length; i++) {
    const n = [normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]];
    let t = tanAcc[i];

    t = sub3(t, mul3(n, dot3(n, t)));

    let tl = Math.hypot(t[0], t[1], t[2]);

    if (!isFinite(tl) || tl < 1e-8) {
      const up = (Math.abs(n[1]) < 0.999) ? [0, 1, 0] : [1, 0, 0];
      t = cross3(up, n);
      tl = Math.hypot(t[0], t[1], t[2]) || 1;
    }

    t = [t[0] / tl, t[1] / tl, t[2] / tl];

    tangents[i * 3] = t[0];
    tangents[i * 3 + 1] = t[1];
    tangents[i * 3 + 2] = t[2];
  }

  return {
    positions,
    normals,
    uvs,
    tangents,
    indices,
    params: { a, r, theta, Nu, Nv }
  };
}
