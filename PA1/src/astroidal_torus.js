export function buildAstroidalTorus({ a=1, r=2, theta=0, Nu=64, Nv=128 } = {}) {
    const uMin = -Math.PI, uMax = Math.PI;
    const vMin = 0,        vMax = 2*Math.PI;
    const ct = Math.cos(theta), st = Math.sin(theta);
  
    function XYZ(u, v) {
      const cu = Math.cos(u), su = Math.sin(u);
      const x0 = a * cu*cu*cu, z0 = a * su*su*su;
      const xr =  x0*ct - z0*st, zr = x0*st + z0*ct;
      const rad = r + xr, cv = Math.cos(v), sv = Math.sin(v);
      return [rad*cv, rad*sv, zr];
    }
  
    const uCurves = [];
    for (let i=0;i<Nu;i++){
      const u = uMin + (uMax-uMin)*(i/(Nu-1));
      const curve = [];
      for (let j=0;j<Nv;j++){
        const v = vMin + (vMax-vMin)*(j/(Nv-1));
        curve.push(...XYZ(u,v));
      }
      uCurves.push(curve);
    }
  
    const vCurves = [];
    for (let j=0;j<Nv;j++){
      const v = vMin + (vMax-vMin)*(j/(Nv-1));
      const curve = [];
      for (let i=0;i<Nu;i++){
        const u = uMin + (uMax-uMin)*(i/(Nu-1));
        curve.push(...XYZ(u,v));
      }
      vCurves.push(curve);
    }
  
    return { uCurves, vCurves, params: { a, r, theta, Nu, Nv } };
  }
