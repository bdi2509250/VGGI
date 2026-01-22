export const VERT_SRC = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
attribute vec3 a_tangent;

uniform mat4 u_mv;
uniform mat4 u_mvp;
uniform mat3 u_normalMat;
uniform float u_uvScale;
uniform float u_uvRotation;

varying vec3 v_posV;
varying vec3 v_nV;
varying vec3 v_tV;
varying vec2 v_uv;

void main() {
  vec4 posV4 = u_mv * vec4(a_position, 1.0);
  v_posV = posV4.xyz;

  v_nV = normalize(u_normalMat * a_normal);
  v_tV = normalize(u_normalMat * a_tangent);

  // Apply rotation to UV coordinates
  vec2 uv = a_uv * u_uvScale;
  
  // Rotate around center (0.5, 0.5)
  vec2 centered = uv - 0.5;
  float cosA = cos(u_uvRotation);
  float sinA = sin(u_uvRotation);
  
  v_uv = vec2(
    centered.x * cosA - centered.y * sinA,
    centered.x * sinA + centered.y * cosA
  ) + 0.5;

  gl_Position = u_mvp * vec4(a_position, 1.0);
}
`;

export const FRAG_SRC = `
precision mediump float;

uniform vec3 u_lightPosV;      
uniform vec3 u_ambient;
uniform vec3 u_diffuseColor;
uniform vec3 u_specularColor;
uniform float u_shininess;

uniform sampler2D u_diffuseMap;
uniform sampler2D u_specularMap;
uniform sampler2D u_normalMap;

varying vec3 v_posV;
varying vec3 v_nV;
varying vec3 v_tV;
varying vec2 v_uv;

void main() {
  vec3 N = normalize(v_nV);
  vec3 T = normalize(v_tV);

  T = normalize(T - N * dot(N, T));
  vec3 B = normalize(cross(N, T));

  mat3 TBN = mat3(T, B, N);

  vec3 nTex = texture2D(u_normalMap, v_uv).xyz * 2.0 - 1.0;
  vec3 Np = normalize(TBN * nTex);

  vec3 L = normalize(u_lightPosV - v_posV);
  vec3 V = normalize(-v_posV);
  vec3 R = reflect(-L, Np);

  float diff = max(dot(Np, L), 0.0);
  float spec = pow(max(dot(R, V), 0.0), u_shininess);

  vec3 kd = texture2D(u_diffuseMap, v_uv).rgb;
  float ks = texture2D(u_specularMap, v_uv).r;

  vec3 color =
    u_ambient +
    (kd * u_diffuseColor) * diff +
    (u_specularColor * ks) * spec;

  gl_FragColor = vec4(color, 1.0);
}
`;