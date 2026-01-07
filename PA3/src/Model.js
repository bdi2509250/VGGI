export class Model {
  constructor(gl, geom) {
    this.gl = gl;
    this.count = geom.indices.length;

    this.pos = this._buf(gl.ARRAY_BUFFER, new Float32Array(geom.positions));
    this.nrm = this._buf(gl.ARRAY_BUFFER, new Float32Array(geom.normals));
    this.uv  = this._buf(gl.ARRAY_BUFFER, new Float32Array(geom.uvs));
    this.tan = this._buf(gl.ARRAY_BUFFER, new Float32Array(geom.tangents));
    this.idx = this._buf(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geom.indices));
  }

  _buf(target, data) {
    const gl = this.gl;
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  }

  draw(locs) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pos);
    if (locs.a_position >= 0) {
      gl.enableVertexAttribArray(locs.a_position);
      gl.vertexAttribPointer(locs.a_position, 3, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nrm);
    if (locs.a_normal >= 0) {
      gl.enableVertexAttribArray(locs.a_normal);
      gl.vertexAttribPointer(locs.a_normal, 3, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uv);
    if (locs.a_uv >= 0) {
      gl.enableVertexAttribArray(locs.a_uv);
      gl.vertexAttribPointer(locs.a_uv, 2, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.tan);
    if (locs.a_tangent >= 0) {
      gl.enableVertexAttribArray(locs.a_tangent);
      gl.vertexAttribPointer(locs.a_tangent, 3, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idx);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }
}
