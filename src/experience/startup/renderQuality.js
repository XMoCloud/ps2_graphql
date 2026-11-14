// Default quality preserves native desktop pixels, including 4K, and up to 2x
// on Retina screens. Only very large buffers reach the 8.3 MP ceiling.
export function renderPixelRatio(width,height,dpr) {
  return Math.min(dpr,2,Math.sqrt(8300000/(Math.max(1,width)*Math.max(1,height))));
}
