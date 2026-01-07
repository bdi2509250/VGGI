export const VERT_SRC = `
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_mvp;
uniform mat4 u_mv;
uniform mat3 u_normalMat;

uniform vec3 u_lightPos;
uniform vec3 u_ambient;
uniform vec3 u_diffuse;
uniform vec3 u_specular;
uniform float u_shininess;

varying vec3 vColor;

void main() {
  vec3 posV = (u_mv * vec4(a_position, 1.0)).xyz;
  vec3 N = normalize(u_normalMat * a_normal);

  vec3 L = normalize(u_lightPos - posV);
  vec3 V = normalize(-posV);
  vec3 R = reflect(-L, N);

  float diff = max(dot(N, L), 0.0);
  float spec = 0.0;
  if (diff > 0.0) {
    spec = pow(max(dot(R, V), 0.0), u_shininess);
  }

  vColor = u_ambient + u_diffuse * diff + u_specular * spec;

  gl_Position = u_mvp * vec4(a_position, 1.0);
}
`;

export const FRAG_SRC = `
precision mediump float;
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(clamp(vColor, 0.0, 1.0), 1.0);
}
`;
