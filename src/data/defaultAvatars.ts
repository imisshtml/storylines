/**
 * Default Avatar Configuration
 * 
 * This file manages the 35 default avatar images that users can select from.
 * Images are stored locally in the app bundle for fast loading and offline access.
 */

export type DefaultAvatar = {
  id: string;
  name: string;
  category: 'warrior' | 'mage' | 'rogue' | 'cleric' | 'ranger' | 'general';
  imagePath: string;
  description: string;
};

// Default avatar collection - replace with your actual 35 images
export const DEFAULT_AVATARS: DefaultAvatar[] = [
  // Warriors
  {
    id: 'warrior-1',
    name: 'Knight Commander',
    category: 'warrior',
    imagePath: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A noble knight in shining armor'
  },
  {
    id: 'warrior-2',
    name: 'Battle Veteran',
    category: 'warrior',
    imagePath: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A seasoned warrior with battle scars'
  },
  {
    id: 'warrior-3',
    name: 'Barbarian Chief',
    category: 'warrior',
    imagePath: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A fierce tribal warrior'
  },
  {
    id: 'warrior-4',
    name: 'Paladin',
    category: 'warrior',
    imagePath: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A holy warrior of justice'
  },
  {
    id: 'warrior-5',
    name: 'Gladiator',
    category: 'warrior',
    imagePath: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'An arena champion'
  },

  // Mages
  {
    id: 'mage-1',
    name: 'Archmage',
    category: 'mage',
    imagePath: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A master of the arcane arts'
  },
  {
    id: 'mage-2',
    name: 'Fire Sorcerer',
    category: 'mage',
    imagePath: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A wielder of flame magic'
  },
  {
    id: 'mage-3',
    name: 'Ice Wizard',
    category: 'mage',
    imagePath: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A master of frost and ice'
  },
  {
    id: 'mage-4',
    name: 'Warlock',
    category: 'mage',
    imagePath: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A practitioner of dark magic'
  },
  {
    id: 'mage-5',
    name: 'Enchanter',
    category: 'mage',
    imagePath: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A master of illusion and charm'
  },

  // Rogues
  {
    id: 'rogue-1',
    name: 'Shadow Assassin',
    category: 'rogue',
    imagePath: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A master of stealth and daggers'
  },
  {
    id: 'rogue-2',
    name: 'Thief',
    category: 'rogue',
    imagePath: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A nimble pickpocket and burglar'
  },
  {
    id: 'rogue-3',
    name: 'Spy',
    category: 'rogue',
    imagePath: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A master of disguise and information'
  },
  {
    id: 'rogue-4',
    name: 'Ranger Scout',
    category: 'rogue',
    imagePath: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A wilderness tracker and hunter'
  },
  {
    id: 'rogue-5',
    name: 'Swashbuckler',
    category: 'rogue',
    imagePath: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A dashing duelist and adventurer'
  },

  // Clerics
  {
    id: 'cleric-1',
    name: 'High Priest',
    category: 'cleric',
    imagePath: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A devoted servant of the divine'
  },
  {
    id: 'cleric-2',
    name: 'Battle Cleric',
    category: 'cleric',
    imagePath: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A warrior-priest of war'
  },
  {
    id: 'cleric-3',
    name: 'Healer',
    category: 'cleric',
    imagePath: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A compassionate healer'
  },
  {
    id: 'cleric-4',
    name: 'Oracle',
    category: 'cleric',
    imagePath: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A seer of divine visions'
  },
  {
    id: 'cleric-5',
    name: 'Templar',
    category: 'cleric',
    imagePath: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A holy knight crusader'
  },

  // Rangers
  {
    id: 'ranger-1',
    name: 'Forest Guardian',
    category: 'ranger',
    imagePath: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A protector of the wilderness'
  },
  {
    id: 'ranger-2',
    name: 'Beast Master',
    category: 'ranger',
    imagePath: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A companion to wild creatures'
  },
  {
    id: 'ranger-3',
    name: 'Archer',
    category: 'ranger',
    imagePath: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A master of bow and arrow'
  },
  {
    id: 'ranger-4',
    name: 'Druid',
    category: 'ranger',
    imagePath: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A shapeshifter and nature mystic'
  },
  {
    id: 'ranger-5',
    name: 'Tracker',
    category: 'ranger',
    imagePath: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A skilled hunter and guide'
  },

  // General/Mixed
  {
    id: 'general-1',
    name: 'Noble',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A person of high birth and status'
  },
  {
    id: 'general-2',
    name: 'Merchant',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A traveling trader and entrepreneur'
  },
  {
    id: 'general-3',
    name: 'Scholar',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A learned academic and researcher'
  },
  {
    id: 'general-4',
    name: 'Bard',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A traveling musician and storyteller'
  },
  {
    id: 'general-5',
    name: 'Monk',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A martial artist and spiritual seeker'
  },
  {
    id: 'general-6',
    name: 'Pirate',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A seafaring adventurer and buccaneer'
  },
  {
    id: 'general-7',
    name: 'Alchemist',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A master of potions and transmutation'
  },
  {
    id: 'general-8',
    name: 'Artificer',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A creator of magical devices'
  },
  {
    id: 'general-9',
    name: 'Diplomat',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A skilled negotiator and ambassador'
  },
  {
    id: 'general-10',
    name: 'Explorer',
    category: 'general',
    imagePath: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'A brave discoverer of new lands'
  },
];

/**
 * Get avatars by category
 */
export const getAvatarsByCategory = (category: DefaultAvatar['category']): DefaultAvatar[] => {
  return DEFAULT_AVATARS.filter(avatar => avatar.category === category);
};

/**
 * Get avatar by ID
 */
export const getAvatarById = (id: string): DefaultAvatar | undefined => {
  return DEFAULT_AVATARS.find(avatar => avatar.id === id);
};

/**
 * Get random avatar from category
 */
export const getRandomAvatarFromCategory = (category: DefaultAvatar['category']): DefaultAvatar => {
  const categoryAvatars = getAvatarsByCategory(category);
  const randomIndex = Math.floor(Math.random() * categoryAvatars.length);
  return categoryAvatars[randomIndex] || DEFAULT_AVATARS[0];
};

/**
 * Get suggested avatars based on character class
 */
export const getSuggestedAvatars = (characterClass: string): DefaultAvatar[] => {
  const classToCategory: { [key: string]: DefaultAvatar['category'] } = {
    'Fighter': 'warrior',
    'Barbarian': 'warrior',
    'Paladin': 'warrior',
    'Wizard': 'mage',
    'Sorcerer': 'mage',
    'Warlock': 'mage',
    'Rogue': 'rogue',
    'Ranger': 'ranger',
    'Druid': 'ranger',
    'Cleric': 'cleric',
    'Bard': 'general',
    'Monk': 'general',
  };

  const primaryCategory = classToCategory[characterClass] || 'general';
  const primaryAvatars = getAvatarsByCategory(primaryCategory);
  
  // Add some general avatars for variety
  const generalAvatars = getAvatarsByCategory('general').slice(0, 3);
  
  return [...primaryAvatars, ...generalAvatars];
};

/**
 * Categories for filtering
 */
export const AVATAR_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎭' },
  { id: 'warrior', name: 'Warriors', icon: '⚔️' },
  { id: 'mage', name: 'Mages', icon: '🔮' },
  { id: 'rogue', name: 'Rogues', icon: '🗡️' },
  { id: 'cleric', name: 'Clerics', icon: '✨' },
  { id: 'ranger', name: 'Rangers', icon: '🏹' },
  { id: 'general', name: 'General', icon: '🎪' },
] as const;