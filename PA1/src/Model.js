import { buildAstroidalTorus } from './astroidal_torus.js';

export class Model {
  constructor(gl, params) {
    this.gl = gl;
    this.params = params;
    this._build();
  }

  _build() {
    const gl = this.gl;
    const { uCurves, vCurves } = buildAstroidalTorus(this.params);

    this.strips = [];

    const makeStrip = (pts, color) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
      return { buf, count: pts.length/3, color };
    };

    this.strips.push(...uCurves.map(c => makeStrip(c, [0.80,0.86,1.0])));
    this.strips.push(...vCurves.map(c => makeStrip(c, [0.98,0.64,0.24])));

    this.counts = { u: uCurves.length, v: vCurves.length };
  }

  draw(program, aPos, uMvp, mvp, uColor) {
    const gl = this.gl;
    gl.useProgram(program);
    gl.uniformMatrix4fv(uMvp, false, mvp);
    for (const s of this.strips) {
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(uColor, s.color);
      gl.drawArrays(gl.LINE_STRIP, 0, s.count);
    }
    gl.disableVertexAttribArray(aPos);
  }
}
