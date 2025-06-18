import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import {
  ChevronRight,
  Sword,
  MessageCircle,
  Package,
  Zap,
  Search,
  Bed,
  Target,
  Sparkles,
  X,
} from 'lucide-react-native';

interface ActionChoice {
  id: string;
  title: string;
  description: string;
  category: ActionCategory;
  requirements?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  icon?: React.ReactNode;
}

type ActionCategory = 'combat' | 'magic' | 'social' | 'exploration' | 'utility' | 'rest';
type CompactCategory = 'combat' | 'social' | 'misc';

interface CategoryConfig {
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const CATEGORY_CONFIG: Record<ActionCategory, CategoryConfig> = {
  combat: {
    title: 'Combat Actions',
    icon: <Sword size={20} color="#fff" />,
    color: '#e74c3c',
    description: 'Attack, defend, and tactical maneuvers',
  },
  magic: {
    title: 'Spells & Magic',
    icon: <Zap size={20} color="#fff" />,
    color: '#9b59b6',
    description: 'Cast spells and use magical abilities',
  },
  social: {
    title: 'Social Interactions',
    icon: <MessageCircle size={20} color="#fff" />,
    color: '#2ecc71',
    description: 'Talk, persuade, and interact with others',
  },
  exploration: {
    title: 'Exploration',
    icon: <Search size={20} color="#fff" />,
    color: '#f39c12',
    description: 'Investigate, search, and discover',
  },
  utility: {
    title: 'Items & Tools',
    icon: <Package size={20} color="#fff" />,
    color: '#3498db',
    description: 'Use items and tools from your inventory',
  },
  rest: {
    title: 'Rest & Recovery',
    icon: <Bed size={20} color="#fff" />,
    color: '#95a5a6',
    description: 'Take breaks and recover resources',
  },
};

const COMPACT_CATEGORY_CONFIG: Record<CompactCategory, CategoryConfig> = {
  combat: {
    title: 'Combat',
    icon: <Sword size={18} color="#fff" />,
    color: '#e74c3c',
    description: 'Attack, defend, and tactical maneuvers',
  },
  social: {
    title: 'Social',
    icon: <MessageCircle size={18} color="#fff" />,
    color: '#2ecc71',
    description: 'Talk, persuade, and interact with others',
  },
  misc: {
    title: 'Misc',
    icon: <Package size={18} color="#fff" />,
    color: '#3498db',
    description: 'Magic, exploration, items, and other actions',
  },
};

interface EnhancedStoryChoicesProps {
  choices: string[];
  onChoiceSelect: (choice: string) => void;
  disabled?: boolean;
}

export default function EnhancedStoryChoices({
  choices,
  onChoiceSelect,
  disabled = false,
}: EnhancedStoryChoicesProps) {
  const [selectedModal, setSelectedModal] = useState<CompactCategory | null>(null);

  // Convert simple choices to structured actions
  const organizedActions = organizeChoicesIntoActions(choices);
  
  // Group actions into compact categories
  const compactActions = {
    combat: organizedActions.combat,
    social: organizedActions.social,
    misc: [
      ...organizedActions.magic,
      ...organizedActions.exploration,
      ...organizedActions.utility,
      ...organizedActions.rest,
    ],
  };

  const handleActionSelect = (action: ActionChoice) => {
    setSelectedModal(null);
    onChoiceSelect(action.title);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return '#2ecc71';
      case 'medium':
        return '#f39c12';
      case 'hard':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  if (choices.length === 0) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Choose your next move</Text>
        </View>

        <View style={styles.compactButtonsContainer}>
          {Object.entries(compactActions).map(([category, actions]) => {
            const categoryConfig = COMPACT_CATEGORY_CONFIG[category as CompactCategory];
            const actionCount = actions.length;

            if (actionCount === 0) return null;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.compactButton,
                  { backgroundColor: categoryConfig.color },
                  disabled && styles.compactButtonDisabled,
                ]}
                onPress={() => setSelectedModal(category as CompactCategory)}
                disabled={disabled}
                activeOpacity={0.8}
              >
                <View style={styles.compactButtonIcon}>
                  {categoryConfig.icon}
                </View>
                <Text style={styles.compactButtonTitle}>{categoryConfig.title}</Text>
                <View style={styles.compactButtonCount}>
                  <Text style={styles.compactButtonCountText}>{actionCount}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Action Modal */}
      {selectedModal && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[
                styles.modalHeader,
                { backgroundColor: COMPACT_CATEGORY_CONFIG[selectedModal].color }
              ]}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalHeaderIcon}>
                    {COMPACT_CATEGORY_CONFIG[selectedModal].icon}
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>
                      {COMPACT_CATEGORY_CONFIG[selectedModal].title} Actions
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {COMPACT_CATEGORY_CONFIG[selectedModal].description}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedModal(null)}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {compactActions[selectedModal].map((action, index) => (
                  <TouchableOpacity
                    key={`${action.id}-${index}`}
                    style={[
                      styles.modalActionCard,
                      disabled && styles.modalActionCardDisabled,
                    ]}
                    onPress={() => handleActionSelect(action)}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalActionHeader}>
                      <View style={styles.modalActionIconContainer}>
                        {action.icon || <Target size={16} color={CATEGORY_CONFIG[action.category].color} />}
                      </View>
                      <View style={styles.modalActionContent}>
                        <Text style={styles.modalActionTitle}>{action.title}</Text>
                        <Text style={styles.modalActionDescription}>
                          {action.description}
                        </Text>
                      </View>
                      {action.difficulty && (
                        <View
                          style={[
                            styles.modalDifficultyBadge,
                            { backgroundColor: getDifficultyColor(action.difficulty) },
                          ]}
                        >
                          <Text style={styles.modalDifficultyText}>
                            {action.difficulty.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {action.requirements && action.requirements.length > 0 && (
                      <View style={styles.modalRequirementsContainer}>
                        <Text style={styles.modalRequirementsLabel}>Requires:</Text>
                        <Text style={styles.modalRequirementsText}>
                          {action.requirements.join(', ')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// Helper function to organize choices into structured actions
function organizeChoicesIntoActions(choices: string[]): Record<ActionCategory, ActionChoice[]> {
  const organized: Record<ActionCategory, ActionChoice[]> = {
    combat: [],
    magic: [],
    social: [],
    exploration: [],
    utility: [],
    rest: [],
  };

  choices.forEach((choice, index) => {
    const action = categorizeChoice(choice, index);
    organized[action.category].push(action);
  });

  return organized;
}

function categorizeChoice(choice: string, index: number): ActionChoice {
  const lowerChoice = choice.toLowerCase();
  
  // Combat actions
  if (
    lowerChoice.includes('attack') ||
    lowerChoice.includes('strike') ||
    lowerChoice.includes('fight') ||
    lowerChoice.includes('defend') ||
    lowerChoice.includes('block') ||
    lowerChoice.includes('parry') ||
    lowerChoice.includes('weapon') ||
    lowerChoice.includes('sword') ||
    lowerChoice.includes('bow')
  ) {
    return {
      id: `combat-${index}`,
      title: choice,
      description: getActionDescription(choice, 'combat'),
      category: 'combat',
      icon: <Sword size={16} color="#e74c3c" />,
      difficulty: getDifficultyFromChoice(choice),
    };
  }

  // Magic actions
  if (
    lowerChoice.includes('cast') ||
    lowerChoice.includes('spell') ||
    lowerChoice.includes('magic') ||
    lowerChoice.includes('enchant') ||
    lowerChoice.includes('summon') ||
    lowerChoice.includes('ritual') ||
    lowerChoice.includes('arcane')
  ) {
    return {
      id: `magic-${index}`,
      title: choice,
      description: getActionDescription(choice, 'magic'),
      category: 'magic',
      icon: <Zap size={16} color="#9b59b6" />,
      requirements: ['has_spells'],
      difficulty: getDifficultyFromChoice(choice),
    };
  }

  // Social actions
  if (
    lowerChoice.includes('talk') ||
    lowerChoice.includes('speak') ||
    lowerChoice.includes('persuade') ||
    lowerChoice.includes('convince') ||
    lowerChoice.includes('negotiate') ||
    lowerChoice.includes('intimidate') ||
    lowerChoice.includes('charm') ||
    lowerChoice.includes('ask') ||
    lowerChoice.includes('tell')
  ) {
    return {
      id: `social-${index}`,
      title: choice,
      description: getActionDescription(choice, 'social'),
      category: 'social',
      icon: <MessageCircle size={16} color="#2ecc71" />,
      difficulty: getDifficultyFromChoice(choice),
    };
  }

  // Utility/Items actions
  if (
    lowerChoice.includes('use') ||
    lowerChoice.includes('drink') ||
    lowerChoice.includes('eat') ||
    lowerChoice.includes('item') ||
    lowerChoice.includes('potion') ||
    lowerChoice.includes('tool') ||
    lowerChoice.includes('rope') ||
    lowerChoice.includes('torch')
  ) {
    return {
      id: `utility-${index}`,
      title: choice,
      description: getActionDescription(choice, 'utility'),
      category: 'utility',
      icon: <Package size={16} color="#3498db" />,
      requirements: ['has_items'],
      difficulty: getDifficultyFromChoice(choice),
    };
  }

  // Rest actions
  if (
    lowerChoice.includes('rest') ||
    lowerChoice.includes('sleep') ||
    lowerChoice.includes('camp') ||
    lowerChoice.includes('recover') ||
    lowerChoice.includes('heal') ||
    lowerChoice.includes('meditate')
  ) {
    return {
      id: `rest-${index}`,
      title: choice,
      description: getActionDescription(choice, 'rest'),
      category: 'rest',
      icon: <Bed size={16} color="#95a5a6" />,
      difficulty: 'easy',
    };
  }

  // Default to exploration
  return {
    id: `exploration-${index}`,
    title: choice,
    description: getActionDescription(choice, 'exploration'),
    category: 'exploration',
    icon: <Search size={16} color="#f39c12" />,
    difficulty: getDifficultyFromChoice(choice),
  };
}

function getActionDescription(choice: string, category: ActionCategory): string {
  const descriptions = {
    combat: 'Engage in combat or defensive maneuvers',
    magic: 'Use magical abilities and spells',
    social: 'Interact with characters and NPCs',
    exploration: 'Investigate and explore your surroundings',
    utility: 'Use items and tools from your inventory',
    rest: 'Take time to rest and recover',
  };

  return descriptions[category];
}

function getDifficultyFromChoice(choice: string): 'easy' | 'medium' | 'hard' {
  const lowerChoice = choice.toLowerCase();
  
  if (
    lowerChoice.includes('carefully') ||
    lowerChoice.includes('slowly') ||
    lowerChoice.includes('simple') ||
    lowerChoice.includes('basic')
  ) {
    return 'easy';
  }
  
  if (
    lowerChoice.includes('dangerous') ||
    lowerChoice.includes('risky') ||
    lowerChoice.includes('difficult') ||
    lowerChoice.includes('complex')
  ) {
    return 'hard';
  }
  
  return 'medium';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 16,
    marginVertical: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  compactButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  compactButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  compactButtonDisabled: {
    opacity: 0.5,
  },
  compactButtonIcon: {
    marginBottom: 8,
  },
  compactButtonTitle: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  compactButtonCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  compactButtonCountText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 20,
  },
  modalActionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalActionCardDisabled: {
    opacity: 0.5,
  },
  modalActionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalActionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalActionContent: {
    flex: 1,
  },
  modalActionTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  modalActionDescription: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  modalDifficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  modalDifficultyText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  modalRequirementsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalRequirementsLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  modalRequirementsText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});