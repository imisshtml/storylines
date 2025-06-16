import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import {
  ChevronRight,
  ChevronDown,
  Sword,
  Shield,
  Zap,
  Search,
  MessageCircle,
  Package,
  Bed,
  Eye,
  Users,
  Target,
  Sparkles,
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
  const [expandedCategories, setExpandedCategories] = useState<Set<ActionCategory>>(
    new Set(['combat', 'magic', 'social']) // Start with some categories expanded
  );

  // Convert simple choices to structured actions
  const organizedActions = organizeChoicesIntoActions(choices);

  const toggleCategory = (category: ActionCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleActionSelect = (action: ActionChoice) => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={20} color="#FFD700" />
        <Text style={styles.headerTitle}>Available Actions</Text>
        <Text style={styles.headerSubtitle}>Choose your next move</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {Object.entries(organizedActions).map(([category, actions]) => {
          const categoryConfig = CATEGORY_CONFIG[category as ActionCategory];
          const isExpanded = expandedCategories.has(category as ActionCategory);
          const hasActions = actions.length > 0;

          if (!hasActions) return null;

          return (
            <View key={category} style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryHeader,
                  { backgroundColor: categoryConfig.color },
                  !hasActions && styles.categoryHeaderDisabled,
                ]}
                onPress={() => toggleCategory(category as ActionCategory)}
                disabled={!hasActions}
                activeOpacity={0.8}
              >
                <View style={styles.categoryHeaderLeft}>
                  <View style={styles.categoryIcon}>
                    {categoryConfig.icon}
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{categoryConfig.title}</Text>
                    <Text style={styles.categoryDescription}>
                      {categoryConfig.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryHeaderRight}>
                  <View style={styles.actionCount}>
                    <Text style={styles.actionCountText}>{actions.length}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronDown size={20} color="#fff" />
                  ) : (
                    <ChevronRight size={20} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.actionsContainer}>
                  {actions.map((action, index) => (
                    <TouchableOpacity
                      key={`${action.id}-${index}`}
                      style={[
                        styles.actionCard,
                        disabled && styles.actionCardDisabled,
                      ]}
                      onPress={() => handleActionSelect(action)}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <View style={styles.actionHeader}>
                        <View style={styles.actionIconContainer}>
                          {action.icon || <Target size={16} color={categoryConfig.color} />}
                        </View>
                        <View style={styles.actionContent}>
                          <Text style={styles.actionTitle}>{action.title}</Text>
                          <Text style={styles.actionDescription}>
                            {action.description}
                          </Text>
                        </View>
                        {action.difficulty && (
                          <View
                            style={[
                              styles.difficultyBadge,
                              { backgroundColor: getDifficultyColor(action.difficulty) },
                            ]}
                          >
                            <Text style={styles.difficultyText}>
                              {action.difficulty.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      {action.requirements && action.requirements.length > 0 && (
                        <View style={styles.requirementsContainer}>
                          <Text style={styles.requirementsLabel}>Requires:</Text>
                          <Text style={styles.requirementsText}>
                            {action.requirements.join(', ')}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
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
  scrollView: {
    maxHeight: 400,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryHeaderDisabled: {
    opacity: 0.5,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  actionCountText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  actionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  actionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  requirementsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementsLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  requirementsText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});