export function initUI(onChange) {
  const uSeg = document.getElementById("uSeg");
  const vSeg = document.getElementById("vSeg");
  const texScale = document.getElementById("texScale");

  const uVal = document.getElementById("uVal");
  const vVal = document.getElementById("vVal");
  const texVal = document.getElementById("texVal");

  function emit() {
    const U = parseInt(uSeg.value, 10);
    const V = parseInt(vSeg.value, 10);
    const tex = texScale ? parseFloat(texScale.value) : 1.0;

    uVal.textContent = String(U);
    vVal.textContent = String(V);
    if (texVal) texVal.textContent = tex.toFixed(2);

    onChange({ U, V, texScale: tex });
  }

  uSeg.addEventListener("input", emit);
  vSeg.addEventListener("input", emit);
  if (texScale) texScale.addEventListener("input", emit);

  emit();
}
