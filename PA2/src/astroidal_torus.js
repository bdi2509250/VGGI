export function buildAstroidalTorus({ a=1, r=2, theta=0, Nu=64, Nv=128 } = {}) {
  const uMin = -Math.PI, uMax = Math.PI;
  const vMin = 0,        vMax = 2*Math.PI;

  const ct = Math.cos(theta), st = Math.sin(theta);
  function XYZ(u, v) {
    const cu = Math.cos(u), su = Math.sin(u);
    const x0 = a * cu*cu*cu;
    const z0 = a * su*su*su;
    const xr =  x0*ct - z0*st;
    const zr =  x0*st + z0*ct;
    const rad = r + xr;
    const cv = Math.cos(v), sv = Math.sin(v);
    return [rad*cv, rad*sv, zr];
  }

  const nVerts = Nu * Nv;
  const positions = new Float32Array(nVerts * 3);
  let idx = 0;
  for (let i = 0; i < Nu; i++) {
    const u = uMin + (uMax - uMin) * (i / Nu);
    for (let j = 0; j < Nv; j++) {
      const v = vMin + (vMax - vMin) * (j / Nv);
      const [X,Y,Z] = XYZ(u, v);
      positions[idx++] = X;
      positions[idx++] = Y;
      positions[idx++] = Z;
    }
  }

  const indices = new Uint16Array(Nu * Nv * 6);
  let k = 0;
  const vid = (i, j) => ((i + Nu) % Nu) * Nv + ((j + Nv) % Nv);

  for (let i = 0; i < Nu; i++) {
    for (let j = 0; j < Nv; j++) {
      const i1 = (i + 1) % Nu;
      const j1 = (j + 1) % Nv;

      const v00 = vid(i,  j);
      const v10 = vid(i1, j);
      const v01 = vid(i,  j1);
      const v11 = vid(i1, j1);

      indices[k++] = v00; indices[k++] = v10; indices[k++] = v11;
      indices[k++] = v00; indices[k++] = v11; indices[k++] = v01;
    }
  }

  const normals = new Float32Array(nVerts * 3);
  for (let t = 0; t < indices.length; t += 3) {
    const i0 = indices[t], i1 = indices[t+1], i2 = indices[t+2];

    const p0x = positions[3*i0+0], p0y = positions[3*i0+1], p0z = positions[3*i0+2];
    const p1x = positions[3*i1+0], p1y = positions[3*i1+1], p1z = positions[3*i1+2];
    const p2x = positions[3*i2+0], p2y = positions[3*i2+1], p2z = positions[3*i2+2];

    const e1x = p1x - p0x, e1y = p1y - p0y, e1z = p1z - p0z;
    const e2x = p2x - p0x, e2y = p2y - p0y, e2z = p2z - p0z;

    const cx = e1y*e2z - e1z*e2y;
    const cy = e1z*e2x - e1x*e2z;
    const cz = e1x*e2y - e1y*e2x;

    normals[3*i0+0] += cx; normals[3*i0+1] += cy; normals[3*i0+2] += cz;
    normals[3*i1+0] += cx; normals[3*i1+1] += cy; normals[3*i1+2] += cz;
    normals[3*i2+0] += cx; normals[3*i2+1] += cy; normals[3*i2+2] += cz;
  }
  for (let v = 0; v < nVerts; v++) {
    const nx = normals[3*v+0], ny = normals[3*v+1], nz = normals[3*v+2];
    const len = Math.hypot(nx, ny, nz) || 1.0;
    normals[3*v+0] = nx / len;
    normals[3*v+1] = ny / len;
    normals[3*v+2] = nz / len;
  }

  return { positions, indices, normals, params: { a, r, theta, Nu, Nv } };
}
