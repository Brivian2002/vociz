export function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    
    if (!gl) return false;

    // Check for "Disabled" renderer info which is common in some sandboxed environments
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Explicitly check for 'Disabled' or generic failure IDs as reported in the error log
      if (vendor === 'Disabled' || renderer === 'Disabled') {
        return false;
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}
