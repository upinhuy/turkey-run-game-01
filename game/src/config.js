// config.js — every tuning number for Turkey Run lives here, in one place,
// so the feel of the game can be balanced without touching the game logic.
export const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,
  groundY: 600, // y of the ground line; the turkey stands on this
  gravity: 2600, // px per second squared
  jumpVelocity: -980, // px per second
  runSpeed: 300, // world scroll speed in px per second at a steady run
  dashMultiplier: 1.7, // how much faster the world scrolls while dashing
  dashDrain: 45, // stamina per second while dashing
  dashRegen: 22, // stamina per second while not dashing
  moveSpeed: 300, // turkey left/right speed in px per second
  turkeyMinX: 110,
  turkeyMaxX: 640,
  startLives: 3,
  startFarmerGap: 42, // metres of lead the turkey starts with
  catchGap: 0, // farmer gap at or below this means CAUGHT
  winDistance: 1500, // metres to the forest gate
  invulnerableSeconds: 2, // after a hit, the turkey cannot be hurt again
  cornScore: 10,
  drumstickScore: 50,
  distanceScorePerMetre: 1,
  // Stage boundaries in metres. Each stage changes the palette, the
  // obstacles that spawn and how hard the farmer pushes.
  stages: [
    { name: 'FARMYARD', from: 0, to: 500, sky: '#f7b267', skyTop: '#f4845f', ground: '#c98a3d', groundDark: '#a96f2c', accent: '#e07b39' },
    { name: 'BARN', from: 500, to: 1000, sky: '#e8a34c', skyTop: '#b85c38', ground: '#8a5a2b', groundDark: '#6e4520', accent: '#d97b2f' },
    { name: 'KITCHEN', from: 1000, to: 1500, sky: '#d96a4a', skyTop: '#8e2f2f', ground: '#7a3b2e', groundDark: '#5e2b21', accent: '#e8a13a' },
  ],
  // How often each obstacle appears (seconds between spawns) per stage.
  spawnInterval: [1.9, 1.45, 1.05],
  // Farmer behaviour: the gap closes this fast (metres per second) when the
  // turkey dawdles near the left edge, and opens when the turkey runs far right.
  farmerCloseRate: 2.6,
  farmerOpenRate: 3.4,
  farmerSprintRate: 9, // metres per second lost during a stage-3 sprint
  hideRegenRate: 2.2, // metres per second the gap grows while hidden
};
