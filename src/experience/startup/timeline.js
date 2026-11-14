import reference from "./reference-tracks.json";

export const STARTUP_DURATION = reference.duration;
export const VIRTUAL_ASPECT = 512 / 448;
export const VERTICAL_FOV = (2 * Math.atan(224 / 1024) * 180) / Math.PI;
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const smooth = (a, b, t) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

// Measured against the recording: early drift, acceleration, then black at 4.43s.
// World coordinates use -Z as forward; all animation is an absolute-time function.
export function cameraAt(seconds) {
  const t = clamp(seconds, 0, STARTUP_DURATION);
  const keys = [
    [0, 16, 0],
    [1.5, 19.6, 0.0675],
    [2.5, 27, 0.15],
    [3, 42, 0.27],
    [3.5, 68, 0.5],
    [3.75, 88, 0.72],
    [4, 124, 0.95],
    [4.3, 156, 1.12],
    [STARTUP_DURATION, 180, 1.2],
  ];
  const pose = interpolate(keys, t);
  return {
    z: -pose[0],
    roll: pose[1],
    exposure: smooth(0.23, 0.48, t) * (1 - smooth(4.02, 4.43, t)),
  };
}

// Smooth Hermite interpolation of screen-space calibration landmarks.
// The renderer unprojects these into 3D, retaining real geometry and face rotation.
export function interpolate(keys, t) {
  let index = keys.findIndex((k) => k[0] >= t);
  if (index <= 0) return keys[index === -1 ? keys.length - 1 : 0].slice(1);
  const a = keys[index - 1],
    b = keys[index],
    before = keys[Math.max(0, index - 2)],
    after = keys[Math.min(keys.length - 1, index + 1)];
  const span = b[0] - a[0],
    u = clamp((t - a[0]) / span);
  return a.slice(1).map((v, i) => {
    const j = i + 1,
      m0 = (b[j] - before[j]) / (b[0] - before[0]),
      m1 = (after[j] - a[j]) / (after[0] - a[0]);
    return (
      (2 * u ** 3 - 3 * u * u + 1) * v +
      (u ** 3 - 2 * u * u + u) * span * m0 +
      (-2 * u ** 3 + 3 * u * u) * b[j] +
      (u ** 3 - u * u) * span * m1
    );
  });
}

// [seconds, normalized screen center X/Y, projected edge width].
// Authored from the supplied recording rather than an arbitrary randomized field.
const CUBE_LANDMARKS = [
  [
    [0, 0.76, 0.47, 0.065],
    [1.5, 0.77, 0.53, 0.073],
    [2.5, 0.83, 0.47, 0.085],
    [3, 0.88, 0.28, 0.1],
    [3.5, 1.01, -0.04, 0.145],
    [4, 1.4, -0.6, 0.25],
  ],
  [
    [0, 0.45, 0.39, 0.06],
    [1.5, 0.45, 0.365, 0.069],
    [2.5, 0.44, 0.33, 0.087],
    [3, 0.445, 0.29, 0.105],
    [3.25, 0.46, 0.27, 0.123],
    [3.5, 0.495, 0.23, 0.155],
    [3.75, 0.56, 0.13, 0.21],
    [4, 0.7, -0.1, 0.36],
    [4.3, 1, -0.7, 0.5],
  ],
  [
    [0, 0.76, 0.78, 0.07],
    [1.5, 0.78, 0.83, 0.078],
    [2.5, 0.86, 0.86, 0.1],
    [3, 0.94, 0.8, 0.13],
    [3.5, 1.1, 0.7, 0.17],
    [4, 1.5, 0.4, 0.25],
  ],
  [
    [0, 0.245, 0.76, 0.083],
    [1.5, 0.23, 0.78, 0.09],
    [2.5, 0.15, 0.78, 0.113],
    [3, 0.08, 0.72, 0.14],
    [3.25, -0.02, 0.6, 0.18],
    [3.5, -0.2, 0.4, 0.24],
    [4, -0.8, -0.1, 0.35],
  ],
  [
    [0, 0.2, 0.31, 0.069],
    [1.5, 0.19, 0.25, 0.078],
    [2.5, 0.13, 0.13, 0.09],
    [3, 0.12, 0.01, 0.115],
    [3.5, -0.07, -0.3, 0.16],
    [4, -0.5, -0.8, 0.24],
  ],
];
export const cubeProjection = (index, t) =>
  interpolate(CUBE_LANDMARKS[index], t);

export function titleOpacity(t) {
  return clamp((t - 1.06) / 0.59) * (1 - clamp((t - 2.7) / 0.43));
}

// Five regular, sharp-edged glass cubes, separate from the rectangular pillar field.
// Anchor/extent information cross-checked against osdbits' documented opening.
export const CUBES = [
  { position: [12.4877, 1.9065, -111.102], index: 0 },
  { position: [-3.1647, -3.9106, -93.072], index: 1 },
  { position: [11.4237, -9.2719, -88.3875], index: 2 },
  { position: [-13.0536, -8.28695, -84.519], index: 3 },
  { position: [-10.85595, 7.84315, -81.8565], index: 4 },
];

export function cubeAngles(index, seconds) {
  if (index === 1)
    return interpolate(
      [
        [0, 5, -35, 5],
        [1.5, 15, -30, 20],
        [3, 24, -24, 35],
        [3.5, 28, -20, 45],
        [4.3, 40, -12, 70],
      ],
      seconds,
    );
  if (index === 3)
    return [-8 + seconds * 8, 12 + seconds * 5, -8 + seconds * 4];
  const d = index === 2 ? 0.9 : (index - 2) * 0.8;
  const start = d * (index % 3) * 3.7 + 0.2856;
  const frame = Math.max(0, seconds) * 60;
  return [
    start + (frame * 0.0031) / d,
    start + frame * d * 0.0022,
    start + frame * (d / 1000 + 0.0013),
  ].map((r) => (r * 180) / Math.PI);
}

const paths = Object.fromEntries(
  Object.entries(reference.tracks).map(([name, rows]) => {
    // Keep only isolated measured samples, removing hue-detector jumps into the cloud.
    const valid = rows
      .map((p, i) => (p ? [i / reference.fps, ...p] : null))
      .filter(Boolean);
    const clean = valid.filter((p, i) => {
      const before = valid[Math.max(0, i - 1)],
        after = valid[Math.min(valid.length - 1, i + 1)];
      return (
        Math.hypot(
          p[1] - (before[1] + after[1]) / 2,
          p[2] - (before[2] + after[2]) / 2,
        ) < 0.045
      );
    });
    return [name, clean];
  }),
);

// The red/pink hue samples swap identities at their close pass. Continue each
// trajectory through that pass instead of turning both heads back on themselves.
const crossingPaths={
  pink:[[.3,.46,.38],[.8,.511,.397],[1.2,.560,.412],[1.6,.605,.431],
    [2,.635,.452],[2.4,.655,.477],[2.8,.674,.525],[3.2,.683,.608],[3.6,.664,.760],[3.95,.607,.98]],
  red:[[.3,.70,.48],[.8,.646,.453],[1.2,.617,.438],[1.6,.584,.435],
    [2,.541,.424],[2.4,.489,.408],[2.8,.428,.377],[3.2,.34,.31],[3.6,.20,.17],[3.95,.04,-.03]],
};

export function lightAt(name, seconds) {
  const points = crossingPaths[name] || paths[name];
  if (!points?.length) return { x: 0.5, y: 0.5, alpha: 0 };
  const [x,y]=interpolate(points,seconds);
  return {
    x,y,
    alpha: smooth(0.25, 0.5, seconds) * (1 - smooth(3.82, 4.08, seconds)),
  };
}

// Reconstruct the head at its historical camera pose and its own cloud depth.
// Trails retain those world points, creating parallax as the camera flies past.
export function laserWorldAt(name,seconds,output) {
  const depths={green:-104,pink:-121,red:-97,violet:-112};
  const phases={green:0,pink:1.1,red:2.3,violet:3.7};
  const pose=cameraAt(seconds),p=lightAt(name,seconds);
  const z=depths[name]+Math.sin(seconds*.8+phases[name])*4;
  const distance=pose.z-z;
  const half=distance*Math.tan(VERTICAL_FOV*Math.PI/360);
  const x=(p.x*2-1)*half*VIRTUAL_ASPECT,y=(1-p.y*2)*half;
  const c=Math.cos(pose.roll),s=Math.sin(pose.roll);
  return output.set(x*c-y*s,x*s+y*c,z);
}
