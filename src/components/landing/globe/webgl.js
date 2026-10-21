// True when the browser can create a WebGL context. When it cannot, the landing
// page keeps the lightweight CSS globe instead of loading the 3D scene.
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}