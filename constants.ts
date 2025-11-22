import { BristolType, PoopSize } from './types';
import React from 'react';

export const BRISTOL_SCALE_DATA = [
  {
    type: BristolType.Type1,
    label: 'Type 1',
    description: 'Separate hard lumps, like nuts (hard to pass)',
    color: 'bg-stone-800',
    icon: '🥜',
    health: 'Constipation',
  },
  {
    type: BristolType.Type2,
    label: 'Type 2',
    description: 'Sausage-shaped, but lumpy',
    color: 'bg-stone-700',
    icon: '🌭',
    health: 'Mild Constipation',
  },
  {
    type: BristolType.Type3,
    label: 'Type 3',
    description: 'Like a sausage but with cracks on its surface',
    color: 'bg-amber-800',
    icon: '🥖',
    health: 'Normal',
  },
  {
    type: BristolType.Type4,
    label: 'Type 4',
    description: 'Like a sausage or snake, smooth and soft',
    color: 'bg-amber-700',
    icon: '🐍',
    health: 'Ideal',
  },
  {
    type: BristolType.Type5,
    label: 'Type 5',
    description: 'Soft blobs with clear cut edges (passed easily)',
    color: 'bg-amber-600',
    icon: '🍪',
    health: 'Lacking Fiber',
  },
  {
    type: BristolType.Type6,
    label: 'Type 6',
    description: 'Fluffy pieces with ragged edges, a mushy stool',
    color: 'bg-amber-500',
    icon: '🍦',
    health: 'Mild Diarrhea',
  },
  {
    type: BristolType.Type7,
    label: 'Type 7',
    description: 'Watery, no solid pieces, entirely liquid',
    color: 'bg-yellow-700',
    icon: '💧',
    health: 'Diarrhea',
  },
];

export const POOP_SIZES = [
  { value: PoopSize.Small, label: 'Small', multiplier: 1.0 },
  { value: PoopSize.Medium, label: 'Medium', multiplier: 1.2 },
  { value: PoopSize.Large, label: 'Large', multiplier: 1.5 },
  { value: PoopSize.Massive, label: 'Massive', multiplier: 2.0 },
];

// Rewards healthy poops (Type 3 & 4) with 1.5x XP
export const TYPE_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.5, // Ideal
  4: 1.5, // Ideal
  5: 1.1,
  6: 1.0,
  7: 1.0
};

export const GAME_CONSTANTS = {
  BASE_XP: 50,
  BLOOD_PENALTY: -50,
  XP_PER_LEVEL: 500,
  PRESTIGE_LEVEL_REQ: 55,
  WEIGHT_MULTIPLIER: 0.2, // 0.2 XP per gram
};