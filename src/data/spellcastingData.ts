export type SpellcastingInfo = {
  cantripsKnown: number;
  spellsKnown?: number; // Only for some classes like Bard, Ranger, Sorcerer
  spellSlots: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
    7: number;
    8: number;
    9: number;
  };
};

export type SpellcastingByLevel = {
  [key: number]: SpellcastingInfo;
};

export const SPELLCASTING_BY_CLASS: { [key: string]: SpellcastingByLevel } = {
  bard: {
    1: { cantripsKnown: 2, spellsKnown: 4, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 2, spellsKnown: 5, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 2, spellsKnown: 6, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 3, spellsKnown: 7, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 3, spellsKnown: 8, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 3, spellsKnown: 9, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 3, spellsKnown: 10, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 3, spellsKnown: 11, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 3, spellsKnown: 12, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 4, spellsKnown: 14, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 4, spellsKnown: 15, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 4, spellsKnown: 15, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 4, spellsKnown: 16, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    14: { cantripsKnown: 4, spellsKnown: 18, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    15: { cantripsKnown: 4, spellsKnown: 19, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    16: { cantripsKnown: 4, spellsKnown: 19, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    17: { cantripsKnown: 4, spellsKnown: 20, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    18: { cantripsKnown: 4, spellsKnown: 22, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    19: { cantripsKnown: 4, spellsKnown: 22, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 } },
    20: { cantripsKnown: 4, spellsKnown: 22, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1 } },
  },
  cleric: {
    1: { cantripsKnown: 3, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 3, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    14: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    15: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    16: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    17: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    18: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    19: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 } },
    20: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1 } },
  },
  druid: {
    1: { cantripsKnown: 2, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 2, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 2, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    14: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    15: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    16: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    17: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    18: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    19: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 } },
    20: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1 } },
  },
  paladin: {
    1: { cantripsKnown: 0, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 0, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 0, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 0, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    14: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    15: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    16: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    17: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    18: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    19: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    20: { cantripsKnown: 0, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
  },
  ranger: {
    1: { cantripsKnown: 0, spellsKnown: 0, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 0, spellsKnown: 2, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 0, spellsKnown: 3, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 0, spellsKnown: 3, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 0, spellsKnown: 4, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 0, spellsKnown: 4, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 0, spellsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 0, spellsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 0, spellsKnown: 6, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 0, spellsKnown: 6, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 0, spellsKnown: 7, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 0, spellsKnown: 7, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 0, spellsKnown: 8, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    14: { cantripsKnown: 0, spellsKnown: 8, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    15: { cantripsKnown: 0, spellsKnown: 9, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    16: { cantripsKnown: 0, spellsKnown: 9, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    17: { cantripsKnown: 0, spellsKnown: 10, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    18: { cantripsKnown: 0, spellsKnown: 10, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    19: { cantripsKnown: 0, spellsKnown: 11, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    20: { cantripsKnown: 0, spellsKnown: 11, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
  },
  sorcerer: {
    1: { cantripsKnown: 4, spellsKnown: 2, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 4, spellsKnown: 3, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 4, spellsKnown: 4, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 5, spellsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 5, spellsKnown: 6, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 5, spellsKnown: 7, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 5, spellsKnown: 8, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 5, spellsKnown: 9, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 5, spellsKnown: 10, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 6, spellsKnown: 11, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 6, spellsKnown: 12, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 6, spellsKnown: 12, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 6, spellsKnown: 13, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    14: { cantripsKnown: 6, spellsKnown: 13, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    15: { cantripsKnown: 6, spellsKnown: 14, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    16: { cantripsKnown: 6, spellsKnown: 14, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    17: { cantripsKnown: 6, spellsKnown: 15, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    18: { cantripsKnown: 6, spellsKnown: 15, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    19: { cantripsKnown: 6, spellsKnown: 15, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 } },
    20: { cantripsKnown: 6, spellsKnown: 15, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1 } },
  },
  warlock: {
    1: { cantripsKnown: 2, spellsKnown: 2, spellSlots: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 2, spellsKnown: 3, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 2, spellsKnown: 4, spellSlots: { 1: 0, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 3, spellsKnown: 5, spellSlots: { 1: 0, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 3, spellsKnown: 6, spellSlots: { 1: 0, 2: 0, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 3, spellsKnown: 7, spellSlots: { 1: 0, 2: 0, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 3, spellsKnown: 8, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 3, spellsKnown: 9, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 3, spellsKnown: 10, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 4, spellsKnown: 10, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 4, spellsKnown: 11, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 3, 6: 0, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 4, spellsKnown: 11, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 3, 6: 0, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 4, spellsKnown: 12, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 3, 6: 0, 7: 0, 8: 0, 9: 0 } },
    14: { cantripsKnown: 4, spellsKnown: 12, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 3, 6: 0, 7: 0, 8: 0, 9: 0 } },
    15: { cantripsKnown: 4, spellsKnown: 13, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 3, 6: 0, 7: 0, 8: 0, 9: 0 } },
    16: { cantripsKnown: 4, spellsKnown: 13, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 3, 6: 0, 7: 0, 8: 0, 9: 0 } },
    17: { cantripsKnown: 4, spellsKnown: 14, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 4, 6: 0, 7: 0, 8: 0, 9: 0 } },
    18: { cantripsKnown: 4, spellsKnown: 14, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 4, 6: 0, 7: 0, 8: 0, 9: 0 } },
    19: { cantripsKnown: 4, spellsKnown: 15, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 4, 6: 0, 7: 0, 8: 0, 9: 0 } },
    20: { cantripsKnown: 4, spellsKnown: 15, spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 4, 6: 0, 7: 0, 8: 0, 9: 0 } },
  },
  wizard: {
    1: { cantripsKnown: 3, spellSlots: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    2: { cantripsKnown: 3, spellSlots: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    3: { cantripsKnown: 3, spellSlots: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    4: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    5: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    6: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    7: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    8: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } },
    9: { cantripsKnown: 4, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 } },
    10: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 } },
    11: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    12: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 } },
    13: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    14: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 } },
    15: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    16: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 } },
    17: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    18: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
    19: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 } },
    20: { cantripsKnown: 5, spellSlots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1 } },
  },
};

// Helper function to get spellcasting info for a class at a specific level
export const getSpellcastingInfo = (className: string, level: number): SpellcastingInfo | null => {
  const classData = SPELLCASTING_BY_CLASS[className.toLowerCase()];
  if (!classData) return null;
  return classData[level] || null;
};

// Helper function to check if a class has spellcasting at a specific level
export const hasSpellcastingAtLevel = (className: string, level: number): boolean => {
  const info = getSpellcastingInfo(className, level);
  if (!info) return false;
  return info.cantripsKnown > 0 || Object.values(info.spellSlots).some(slots => slots > 0);
};

// Helper function to get maximum spell level available at a specific class level
export const getMaxSpellLevel = (className: string, level: number): number => {
  const info = getSpellcastingInfo(className, level);
  if (!info) return 0;
  
  for (let i = 9; i >= 1; i--) {
    if (info.spellSlots[i as keyof typeof info.spellSlots] > 0) {
      return i;
    }
  }
  return 0;
}; 