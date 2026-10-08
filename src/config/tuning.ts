/**
 * Central configuration of gameplay physics, bounds, geometry, and tunings.
 * Eliminates magic numbers across gameSlice, Ship, GameCanvas, etc.
 */

export const TRACK_CONFIG = {
  lanes: [-2, 0, 2] as const,
  laneWidth: 2.0,
} as const;

export const SHIP_HITBOX = {
  width: 1.0,
  length: 1.5,
  zReach: 0.8,
  defaultY: 0.2,
  pitchBobbingSpeed: 4.0,
  pitchBobbingAmount: 0.03,
} as const;

export const SPEED_CONFIG = {
  initialSpeed: 28,
  accelerationPerSec: 0.4,
  boostBaseSpeedBonus: 25,
  boostWarpSpeedBonus: 35, // with engine_boost_3
  boostAccelRate: 2.8, // Parts separation visual transition rate
} as const;

export const GAMEPLAY_TIMERS = {
  defaultBoostDuration: 5.0,
  upgradedBoostDuration: 6.0, // with engine_boost_1
  defaultMagnetDuration: 8.0,
  temporalSkinMagnetDuration: 12.0,
  magnetPowerupExtraDuration: 3.0, // with harvest_magnet_2
  shieldRegenCooldown: 40.0,
  sonicBlastRangeZ: 80,
  blastWaveDuration: 0.45,
} as const;

export const MAGNET_CONFIG = {
  pullRate: 16.0, // Fraction of the remaining gap to the ship closed per second (exponential pull)
} as const;

export const SPAWN_CONFIG = {
  intervalZ: 35,
  cleanupDistanceZ: 40,
} as const;

export const CAMERA_CONFIG = {
  defaultOffsetY: 1.9,
  boostOffsetY: 2.1,
  defaultOffsetZ: 5.5,
  boostOffsetZ: 6.0,
  followLagX: 0.45,
  lookTargetLagX: 0.6,
  lookTargetAheadZ: 7.5,
  // Portrait screens: widen FOV and pull back so all three lanes stay in frame.
  // Blend goes from 0 at aspect >= 1 to 1 at aspect <= portraitFullAspect.
  baseFov: 65,
  portraitFov: 78,
  portraitExtraOffsetZ: 2.5,
  portraitExtraOffsetY: 0.8,
  portraitFullAspect: 0.45,
} as const;

export const CONTROL_CONFIG = {
  keyboardLerpSpeed: 12,
  boostLerpSpeed: 5.0,
} as const;
