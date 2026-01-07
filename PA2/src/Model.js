import { createArrayBuffer, createIndexBuffer } from './gl.js';
import { buildAstroidalTorus } from './astroidal_torus.js';

export class Model {
  constructor(gl, params) {
    this.gl = gl;
    this.params = params;
    this._build(params);
  }

  _build(params) {
    const gl = this.gl;
    const { positions, indices, normals } = buildAstroidalTorus(params);

    this.indexCount = indices.length;

    this.vboPos = this.vboPos || gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPos);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.vboNrm = this.vboNrm || gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboNrm);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    this.ibo = this.ibo || gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }

  rebuild(params) {
    this.params = { ...this.params, ...params };
    this._build(this.params);
  }

  draw(program, locs) {
    const gl = this.gl;

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPos);
    gl.enableVertexAttribArray(locs.a_position);
    gl.vertexAttribPointer(locs.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboNrm);
    gl.enableVertexAttribArray(locs.a_normal);
    gl.vertexAttribPointer(locs.a_normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(locs.a_position);
    gl.disableVertexAttribArray(locs.a_normal);
  }
}
