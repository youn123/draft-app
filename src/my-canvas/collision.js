export const hitTestElement = (element, point, threshold) => {
  // Check point-distance-to-line-segment for every segment in the
  // element's points (its input points, not its outline points).
  // This is... okay? It's plenty fast, but the GA library may
  // have a faster option.
  if (element.points.length < 2) {
    return false;
  }

  let [A, B] = element.points;

  // For freedraw lines
  for (let i = 1; i < element.points.length; i++) {
    const delta = [B.x - A.x, B.y - A.y];
    const length = Math.hypot(delta[1], delta[0]);

    const mid = {
      x: (A.x + B.x) / 2,
      y: (A.y + B.y) / 2
    };

    const d = [mid.x - point.x, mid.y - point.y];


    // const numer = Math.abs((B.x - A.x)*(A.y - point.y) - (A.x - point.x)*(B.y - A.y));
    const dist = Math.hypot(d[1], d[0]);

    if (dist < threshold) {
      console.log(`dist: ${dist}`);
      return true;
    }

    A = B;
    B = element.points[i + 1];
  }

  return false;
};