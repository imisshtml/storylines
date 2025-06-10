/**
 * Default Avatar Configuration
 * 
 * This file manages the 35 default avatar images that users can select from.
 * Images are stored locally in the app bundle for fast loading and offline access.
 */

export type DefaultAvatar = {
  id: string;
  imagePath: any; // Using require() for local images
};

// Default avatar collection using your actual 35 images
export const DEFAULT_AVATARS: DefaultAvatar[] = [
  {
    id: 'avatar-1',
    imagePath: require('../../assets/images/avatars/bbbjkk.jpg'),
  },
  {
    id: 'avatar-2',
    imagePath: require('../../assets/images/avatars/bbgfjjkk.jpg'),
  },
  {
    id: 'avatar-3',
    imagePath: require('../../assets/images/avatars/cccc.jpg'),
  },
  {
    id: 'avatar-4',
    imagePath: require('../../assets/images/avatars/ddffddff.jpg'),
  },
  {
    id: 'avatar-5',
    imagePath: require('../../assets/images/avatars/dfsdfsdf.jpg'),
  },
  {
    id: 'avatar-6',
    imagePath: require('../../assets/images/avatars/dtfjhk.jpg'),
  },
  {
    id: 'avatar-7',
    imagePath: require('../../assets/images/avatars/ghghg.jpg'),
  },
  {
    id: 'avatar-8',
    imagePath: require('../../assets/images/avatars/ghlkkk.jpg'),
  },
  {
    id: 'avatar-9',
    imagePath: require('../../assets/images/avatars/gyfjkk.jpg'),
  },
  {
    id: 'avatar-10',
    imagePath: require('../../assets/images/avatars/hlhgg.jpg'),
  },
  {
    id: 'avatar-11',
    imagePath: require('../../assets/images/avatars/hyyyyu.jpg'),
  },
  {
    id: 'avatar-12',
    imagePath: require('../../assets/images/avatars/iiouuyyg.jpg'),
  },
  {
    id: 'avatar-13',
    imagePath: require('../../assets/images/avatars/iiuub.jpg'),
  },
  {
    id: 'avatar-14',
    imagePath: require('../../assets/images/avatars/jjkjhkh.jpg'),
  },
  {
    id: 'avatar-15',
    imagePath: require('../../assets/images/avatars/jjkjkds.jpg'),
  },
  {
    id: 'avatar-16',
    imagePath: require('../../assets/images/avatars/jkyyuy.jpg'),
  },
  {
    id: 'avatar-17',
    imagePath: require('../../assets/images/avatars/jyybnn.jpg'),
  },
  {
    id: 'avatar-18',
    imagePath: require('../../assets/images/avatars/kgkhkll.jpg'),
  },
  {
    id: 'avatar-19',
    imagePath: require('../../assets/images/avatars/kkknnnnn.jpg'),
  },
  {
    id: 'avatar-20',
    imagePath: require('../../assets/images/avatars/lgibjbjk.jpg'),
  },
  {
    id: 'avatar-21',
    imagePath: require('../../assets/images/avatars/lhlhlh.jpg'),
  },
  {
    id: 'avatar-22',
    imagePath: require('../../assets/images/avatars/liiuuiiu.jpg'),
  },
  {
    id: 'avatar-23',
    imagePath: require('../../assets/images/avatars/lkjjjjvvv.jpg'),
  },
  {
    id: 'avatar-24',
    imagePath: require('../../assets/images/avatars/ohoho.jpg'),
  },
  {
    id: 'avatar-25',
    imagePath: require('../../assets/images/avatars/ooiiouoi.jpg'),
  },
  {
    id: 'avatar-26',
    imagePath: require('../../assets/images/avatars/poipi.jpg'),
  },
  {
    id: 'avatar-27',
    imagePath: require('../../assets/images/avatars/reserg.jpg'),
  },
  {
    id: 'avatar-28',
    imagePath: require('../../assets/images/avatars/resgbhj.jpg'),
  },
  {
    id: 'avatar-29',
    imagePath: require('../../assets/images/avatars/rnbhhj.jpg'),
  },
  {
    id: 'avatar-30',
    imagePath: require('../../assets/images/avatars/rtstrjkj.jpg'),
  },
  {
    id: 'avatar-31',
    imagePath: require('../../assets/images/avatars/sadasd.jpg'),
  },
  {
    id: 'avatar-32',
    imagePath: require('../../assets/images/avatars/sdfsdf.jpg'),
  },
  {
    id: 'avatar-33',
    imagePath: require('../../assets/images/avatars/ssest.jpg'),
  },
  {
    id: 'avatar-34',
    imagePath: require('../../assets/images/avatars/ukgiugiug.jpg'),
  },
  {
    id: 'avatar-35',
    imagePath: require('../../assets/images/avatars/uyyuy.jpg'),
  },
];

/**
 * Get avatar by ID
 */
export const getAvatarById = (id: string): DefaultAvatar | undefined => {
  return DEFAULT_AVATARS.find(avatar => avatar.id === id);
};

/**
 * Get a random selection of avatars for general use
 */
export const getRandomAvatarSelection = (count: number = 12): DefaultAvatar[] => {
  const shuffled = [...DEFAULT_AVATARS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};