const uRange = document.getElementById('uRes');
const vRange = document.getElementById('vRes');
const uVal = document.getElementById('uVal');
const vVal = document.getElementById('vVal');

export function initUI({ Nu=64, Nv=128 }, onChange) {
  uRange.value = Nu;
  vRange.value = Nv;
  uVal.textContent = Nu;
  vVal.textContent = Nv;

  function handler() {
    const Nu = parseInt(uRange.value, 10);
    const Nv = parseInt(vRange.value, 10);
    uVal.textContent = Nu;
    vVal.textContent = Nv;
    onChange({ Nu, Nv });
  }

  uRange.addEventListener('input', handler);
  vRange.addEventListener('input', handler);
}

export function getResolution() {
  return {
    Nu: parseInt(uRange.value, 10),
    Nv: parseInt(vRange.value, 10),
  };
}
