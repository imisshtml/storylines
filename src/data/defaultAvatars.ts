/**
 * Default Avatar Configuration
 * 
 * This file manages the 35 default avatar images that users can select from.
 * Images are stored locally in the app bundle for fast loading and offline access.
 */

export type DefaultAvatar = {
  id: string;
  name: string;
  category: 'fantasy' | 'medieval' | 'mystical' | 'heroic' | 'general';
  imagePath: any; // Using require() for local images
  description: string;
};

// Default avatar collection using your actual 35 images
export const DEFAULT_AVATARS: DefaultAvatar[] = [
  // Fantasy Characters
  {
    id: 'avatar-1',
    name: 'Brave Adventurer',
    category: 'fantasy',
    imagePath: require('../../assets/images/avatars/bbbjkk.jpg'),
    description: 'A courageous explorer ready for adventure'
  },
  {
    id: 'avatar-2',
    name: 'Noble Warrior',
    category: 'heroic',
    imagePath: require('../../assets/images/avatars/bbgfjjkk.jpg'),
    description: 'A distinguished fighter with honor'
  },
  {
    id: 'avatar-3',
    name: 'Wise Sage',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/cccc.jpg'),
    description: 'A learned scholar of ancient wisdom'
  },
  {
    id: 'avatar-4',
    name: 'Swift Scout',
    category: 'fantasy',
    imagePath: require('../../assets/images/avatars/ddffddff.jpg'),
    description: 'A nimble pathfinder and tracker'
  },
  {
    id: 'avatar-5',
    name: 'Mysterious Wanderer',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/dfsdfsdf.jpg'),
    description: 'A enigmatic traveler with hidden depths'
  },
  {
    id: 'avatar-6',
    name: 'Stalwart Guardian',
    category: 'heroic',
    imagePath: require('../../assets/images/avatars/dtfjhk.jpg'),
    description: 'A steadfast protector of the innocent'
  },
  {
    id: 'avatar-7',
    name: 'Cunning Strategist',
    category: 'medieval',
    imagePath: require('../../assets/images/avatars/ghghg.jpg'),
    description: 'A clever tactician and planner'
  },
  {
    id: 'avatar-8',
    name: 'Fierce Champion',
    category: 'heroic',
    imagePath: require('../../assets/images/avatars/ghlkkk.jpg'),
    description: 'A formidable competitor in any challenge'
  },
  {
    id: 'avatar-9',
    name: 'Graceful Diplomat',
    category: 'general',
    imagePath: require('../../assets/images/avatars/gyfjkk.jpg'),
    description: 'A skilled negotiator and peacemaker'
  },
  {
    id: 'avatar-10',
    name: 'Bold Explorer',
    category: 'fantasy',
    imagePath: require('../../assets/images/avatars/hlhgg.jpg'),
    description: 'An intrepid discoverer of new realms'
  },
  {
    id: 'avatar-11',
    name: 'Ancient Keeper',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/hyyyyu.jpg'),
    description: 'A guardian of forgotten knowledge'
  },
  {
    id: 'avatar-12',
    name: 'Loyal Companion',
    category: 'general',
    imagePath: require('../../assets/images/avatars/iiouuyyg.jpg'),
    description: 'A faithful friend and ally'
  },
  {
    id: 'avatar-13',
    name: 'Seasoned Veteran',
    category: 'medieval',
    imagePath: require('../../assets/images/avatars/iiuub.jpg'),
    description: 'An experienced warrior with many tales'
  },
  {
    id: 'avatar-14',
    name: 'Clever Artisan',
    category: 'general',
    imagePath: require('../../assets/images/avatars/jjkjhkh.jpg'),
    description: 'A skilled craftsperson and inventor'
  },
  {
    id: 'avatar-15',
    name: 'Daring Rogue',
    category: 'fantasy',
    imagePath: require('../../assets/images/avatars/jjkjkds.jpg'),
    description: 'A quick-witted and agile adventurer'
  },
  {
    id: 'avatar-16',
    name: 'Noble Leader',
    category: 'heroic',
    imagePath: require('../../assets/images/avatars/jkyyuy.jpg'),
    description: 'An inspiring commander and guide'
  },
  {
    id: 'avatar-17',
    name: 'Mystical Oracle',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/jyybnn.jpg'),
    description: 'A seer with visions of the future'
  },
  {
    id: 'avatar-18',
    name: 'Steadfast Knight',
    category: 'medieval',
    imagePath: require('../../assets/images/avatars/kgkhkll.jpg'),
    description: 'A chivalrous defender of justice'
  },
  {
    id: 'avatar-19',
    name: 'Free Spirit',
    category: 'general',
    imagePath: require('../../assets/images/avatars/kkknnnnn.jpg'),
    description: 'An independent soul following their own path'
  },
  {
    id: 'avatar-20',
    name: 'Wise Mentor',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/lgibjbjk.jpg'),
    description: 'A teacher and guide for young heroes'
  },
  {
    id: 'avatar-21',
    name: 'Brave Heart',
    category: 'heroic',
    imagePath: require('../../assets/images/avatars/lhlhlh.jpg'),
    description: 'A courageous soul who faces any danger'
  },
  {
    id: 'avatar-22',
    name: 'Skilled Ranger',
    category: 'fantasy',
    imagePath: require('../../assets/images/avatars/liiuuiiu.jpg'),
    description: 'A master of wilderness survival'
  },
  {
    id: 'avatar-23',
    name: 'Court Noble',
    category: 'medieval',
    imagePath: require('../../assets/images/avatars/lkjjjjvvv.jpg'),
    description: 'A person of refinement and status'
  },
  {
    id: 'avatar-24',
    name: 'Wandering Minstrel',
    category: 'general',
    imagePath: require('../../assets/images/avatars/ohoho.jpg'),
    description: 'A traveling performer and storyteller'
  },
  {
    id: 'avatar-25',
    name: 'Shadow Walker',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/ooiiouoi.jpg'),
    description: 'A mysterious figure who moves unseen'
  },
  {
    id: 'avatar-26',
    name: 'Determined Fighter',
    category: 'heroic',
    imagePath: require('../../assets/images/avatars/poipi.jpg'),
    description: 'A resolute warrior who never gives up'
  },
  {
    id: 'avatar-27',
    name: 'Peaceful Healer',
    category: 'general',
    imagePath: require('../../assets/images/avatars/reserg.jpg'),
    description: 'A compassionate caregiver and mender'
  },
  {
    id: 'avatar-28',
    name: 'Royal Guard',
    category: 'medieval',
    imagePath: require('../../assets/images/avatars/resgbhj.jpg'),
    description: 'An elite protector of the crown'
  },
  {
    id: 'avatar-29',
    name: 'Wild Adventurer',
    category: 'fantasy',
    imagePath: require('../../assets/images/avatars/rnbhhj.jpg'),
    description: 'An untamed spirit seeking excitement'
  },
  {
    id: 'avatar-30',
    name: 'Learned Scholar',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/rtstrjkj.jpg'),
    description: 'A dedicated researcher and academic'
  },
  {
    id: 'avatar-31',
    name: 'Humble Pilgrim',
    category: 'general',
    imagePath: require('../../assets/images/avatars/sadasd.jpg'),
    description: 'A spiritual seeker on a sacred journey'
  },
  {
    id: 'avatar-32',
    name: 'Elite Warrior',
    category: 'heroic',
    imagePath: require('../../assets/images/avatars/sdfsdf.jpg'),
    description: 'A master of combat and strategy'
  },
  {
    id: 'avatar-33',
    name: 'Merchant Trader',
    category: 'medieval',
    imagePath: require('../../assets/images/avatars/ssest.jpg'),
    description: 'A savvy businessperson and negotiator'
  },
  {
    id: 'avatar-34',
    name: 'Arcane Student',
    category: 'mystical',
    imagePath: require('../../assets/images/avatars/ukgiugiug.jpg'),
    description: 'A young apprentice learning the magical arts'
  },
  {
    id: 'avatar-35',
    name: 'Village Hero',
    category: 'general',
    imagePath: require('../../assets/images/avatars/uyyuy.jpg'),
    description: 'A local champion beloved by their community'
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
 * Get a random selection of avatars for general use
 */
export const getRandomAvatarSelection = (count: number = 12): DefaultAvatar[] => {
  const shuffled = [...DEFAULT_AVATARS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Categories for filtering
 */
export const AVATAR_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎭' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙' },
  { id: 'heroic', name: 'Heroic', icon: '⚔️' },
  { id: 'mystical', name: 'Mystical', icon: '🔮' },
  { id: 'medieval', name: 'Medieval', icon: '🏰' },
  { id: 'general', name: 'General', icon: '👤' },
] as const;