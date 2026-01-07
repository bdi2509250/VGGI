export function identity() {
    return new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }
  
  export function multiply(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        out[c*4 + r] =
          a[0*4 + r]*b[c*4 + 0] +
          a[1*4 + r]*b[c*4 + 1] +
          a[2*4 + r]*b[c*4 + 2] +
          a[3*4 + r]*b[c*4 + 3];
      }
    }
    return out;
  }
  
  export function perspective(fovyRad, aspect, near, far) {
    const f = 1 / Math.tan(fovyRad / 2);
    const nf = 1 / (near - far);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = (2 * far * near) * nf;
    return out;
  }
  
  export function lookAt(eye, center, up) {
    const [ex,ey,ez] = eye;
    const [cx,cy,cz] = center;
    const [ux,uy,uz] = up;
  
    let zx = ex - cx, zy = ey - cy, zz = ez - cz;
    let len = Math.hypot(zx, zy, zz) || 1;
    zx/=len; zy/=len; zz/=len;
  
    let xx = uy*zz - uz*zy;
    let xy = uz*zx - ux*zz;
    let xz = ux*zy - uy*zx;
    len = Math.hypot(xx,xy,xz) || 1;
    xx/=len; xy/=len; xz/=len;
  
    let yx = zy*xz - zz*xy;
    let yy = zz*xx - zx*xz;
    let yz = zx*xy - zy*xx;
  
    const out = identity();
    out[0]=xx; out[4]=xy; out[8]=xz;
    out[1]=yx; out[5]=yy; out[9]=yz;
    out[2]=zx; out[6]=zy; out[10]=zz;
    out[12]=-(xx*ex + xy*ey + xz*ez);
    out[13]=-(yx*ex + yy*ey + yz*ez);
    out[14]=-(zx*ex + zy*ey + zz*ez);
    return out;
  }
  
  export function rotateY(m, rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const r = identity();
    r[0]=c; r[8]=-s;
    r[2]=s; r[10]=c;
    return multiply(m, r);
  }
  
  export function rotateX(m, rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const r = identity();
    r[5]=c; r[9]=-s;
    r[6]=s; r[10]=c;
    return multiply(m, r);
  }
  
  export function scale(m, sx, sy, sz) {
    const r = identity();
    r[0]=sx; r[5]=sy; r[10]=sz;
    return multiply(m, r);
  }
  