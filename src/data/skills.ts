import { type DnDSkill } from '../atoms/characterAtoms';

export const SKILLS: DnDSkill[] = [
  {
    name: 'Acrobatics',
    ability: 'dexterity',
    description: 'Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you\'re trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship\'s deck.'
  },
  {
    name: 'Animal Handling',
    ability: 'wisdom',
    description: 'When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal\'s intentions, the DM might call for a Wisdom (Animal Handling) check.'
  },
  {
    name: 'Arcana',
    ability: 'intelligence',
    description: 'Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.'
  },
  {
    name: 'Athletics',
    ability: 'strength',
    description: 'Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.'
  },
  {
    name: 'Deception',
    ability: 'charisma',
    description: 'Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.'
  },
  {
    name: 'History',
    ability: 'intelligence',
    description: 'Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.'
  },
  {
    name: 'Insight',
    ability: 'wisdom',
    description: 'Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone\'s next move.'
  },
  {
    name: 'Intimidation',
    ability: 'charisma',
    description: 'When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check.'
  },
  {
    name: 'Investigation',
    ability: 'intelligence',
    description: 'When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check.'
  },
  {
    name: 'Medicine',
    ability: 'wisdom',
    description: 'A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness.'
  },
  {
    name: 'Nature',
    ability: 'intelligence',
    description: 'Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles.'
  },
  {
    name: 'Perception',
    ability: 'wisdom',
    description: 'Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses.'
  },
  {
    name: 'Performance',
    ability: 'charisma',
    description: 'Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment.'
  },
  {
    name: 'Persuasion',
    ability: 'charisma',
    description: 'When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check.'
  },
  {
    name: 'Religion',
    ability: 'intelligence',
    description: 'Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults.'
  },
  {
    name: 'Sleight of Hand',
    ability: 'dexterity',
    description: 'Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check.'
  },
  {
    name: 'Stealth',
    ability: 'dexterity',
    description: 'Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard.'
  },
  {
    name: 'Survival',
    ability: 'wisdom',
    description: 'The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, identify signs that owlbears live nearby, predict the weather, or avoid quicksand and other natural hazards.'
  }
]; 