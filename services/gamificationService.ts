import { PoopLog, PoopSize } from '../types';
import { GAME_CONSTANTS, POOP_SIZES, TYPE_MULTIPLIERS } from '../constants';

export const calculateXP = (log: Partial<PoopLog>): number => {
  let xp = GAME_CONSTANTS.BASE_XP;

  // 1. Size Multiplier
  if (log.size) {
    const sizeData = POOP_SIZES.find(s => s.value === log.size);
    if (sizeData) {
      xp = Math.round(xp * sizeData.multiplier);
    }
  }

  // 2. Bristol Type (Health) Multiplier
  if (log.type) {
    const healthMultiplier = TYPE_MULTIPLIERS[log.type] || 1.0;
    xp = Math.round(xp * healthMultiplier);
  }

  // 3. Weight Bonus (Flat addition)
  if (log.weight && log.weight > 0) {
    xp += Math.round(log.weight * GAME_CONSTANTS.WEIGHT_MULTIPLIER);
  }

  // 4. Blood Penalty
  if (log.hasBlood) {
    xp += GAME_CONSTANTS.BLOOD_PENALTY;
  }

  // Ensure XP doesn't drop below 0
  return Math.max(0, xp);
};

export const calculateLevel = (totalXp: number): { level: number; progress: number; nextLevelXp: number } => {
  const level = Math.floor(totalXp / GAME_CONSTANTS.XP_PER_LEVEL) + 1;
  const currentLevelBaseXp = (level - 1) * GAME_CONSTANTS.XP_PER_LEVEL;
  const nextLevelXp = level * GAME_CONSTANTS.XP_PER_LEVEL;
  const progress = totalXp - currentLevelBaseXp;
  
  return {
    level,
    progress,
    nextLevelXp: GAME_CONSTANTS.XP_PER_LEVEL // Amount needed for one full level
  };
};