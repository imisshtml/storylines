import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAtom } from 'jotai';
import {
  Zap,
  Sword,
  Shield,
  Search,
  MessageCircle,
  Clock,
  Star,
  Target
} from 'lucide-react-native';
import {
  playerActionsLoadingAtom,
  playerActionsErrorAtom,
  fetchPlayerActionsAtom,
  executePlayerActionAtom,
  initializePlayerActionsRealtimeAtom,
  cleanupExpiredActionsAtom,
  sortedPlayerActionsAtom,
  type PlayerAction,
} from '../atoms/playerActionsAtoms';

interface PlayerActionsPanelProps {
  campaignUid: string;
  userId: string;
  currentGameMode?: 'exploration' | 'combat' | 'social' | 'rest';
  onActionExecute?: (action: PlayerAction) => void;
  style?: any;
}

const PlayerActionsPanel: React.FC<PlayerActionsPanelProps> = ({
  campaignUid,
  userId,
  currentGameMode = 'exploration',
  onActionExecute,
  style
}) => {
  const [actions] = useAtom(sortedPlayerActionsAtom);
  const [isLoading] = useAtom(playerActionsLoadingAtom);
  const [error] = useAtom(playerActionsErrorAtom);
  const [, fetchActions] = useAtom(fetchPlayerActionsAtom);
  const [, executeAction] = useAtom(executePlayerActionAtom);
  const [, initializeRealtime] = useAtom(initializePlayerActionsRealtimeAtom);
  const [, cleanupExpired] = useAtom(cleanupExpiredActionsAtom);

  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!campaignUid || !userId) return;

    // Initial fetch
    fetchActions({ campaignUid, userId });

    // Initialize realtime subscription
    const initializeSubscription = async () => {
      try {
        const unsubscribe = await initializeRealtime({ campaignUid, userId });
        realtimeUnsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error initializing player actions realtime:', error);
      }
    };

    initializeSubscription();

    // Set up periodic cleanup of expired actions
    cleanupIntervalRef.current = setInterval(() => {
      cleanupExpired();
    }, 60000); // Clean up every minute

    return () => {
      if (realtimeUnsubscribeRef.current) {
        try {
          realtimeUnsubscribeRef.current();
          realtimeUnsubscribeRef.current = null;
        } catch (error) {
          console.error('Error during realtime cleanup:', error);
        }
      }

      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [campaignUid, userId, fetchActions, initializeRealtime, cleanupExpired]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'attack':
        return <Sword size={16} color="#fff" />;
      case 'spell':
        return <Zap size={16} color="#fff" />;
      case 'defensive':
        return <Shield size={16} color="#fff" />;
      case 'skill':
        return <Search size={16} color="#fff" />;
      case 'social':
        return <MessageCircle size={16} color="#fff" />;
      default:
        return <Target size={16} color="#fff" />;
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'attack':
        return '#e74c3c';
      case 'spell':
        return '#9b59b6';
      case 'defensive':
        return '#3498db';
      case 'skill':
        return '#f39c12';
      case 'social':
        return '#2ecc71';
      case 'rest':
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const getActionCategoryColor = (actionCategory: 'base' | 'llm_generated' | 'contextual') => {
    switch (actionCategory) {
      case 'base':
        return '#34495e';
      case 'llm_generated':
        return '#e67e22';
      case 'contextual':
        return '#1abc9c';
      default:
        return '#34495e';
    }
  };

  const handleActionPress = async (action: PlayerAction) => {
    try {
      const result = await executeAction({
        action,
        campaignId: campaignUid
      });

      if (result.success) {
        onActionExecute?.(action);
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const filteredActions = actions.filter(action =>
    action.game_mode === currentGameMode
  );

  const isActionExpired = (action: PlayerAction) => {
    if (!action.expires_at) return false;
    return new Date(action.expires_at) <= new Date();
  };

  const isActionAvailable = (action: PlayerAction) => {
    // Check if action meets requirements
    const requirements = action.action_data.requirements || [];

    // For now, we'll assume all actions are available
    // You can add more sophisticated requirement checking here
    return !isActionExpired(action);
  };

  if (isLoading && actions.length === 0) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading actions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Text style={styles.errorText}>Error loading actions: {error}</Text>
      </View>
    );
  }

  if (filteredActions.length === 0) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Text style={styles.noActionsText}>
          No actions available for {currentGameMode} mode
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Actions</Text>
        <Text style={styles.headerSubtitle}>
          {currentGameMode.charAt(0).toUpperCase() + currentGameMode.slice(1)} Mode
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {filteredActions.map((action) => {
          const isAvailable = isActionAvailable(action);
          const typeColor = getActionTypeColor(action.action_data.type);
          const categoryColor = getActionCategoryColor(action.action_type);

          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionCard,
                !isAvailable && styles.actionCardDisabled
              ]}
              onPress={() => isAvailable && handleActionPress(action)}
              disabled={!isAvailable}
              activeOpacity={0.7}
            >
              <View style={styles.actionHeader}>
                <View style={[styles.actionIcon, { backgroundColor: typeColor }]}>
                  {getActionIcon(action.action_data.type)}
                </View>

                <View style={styles.actionInfo}>
                  <Text style={[
                    styles.actionTitle,
                    !isAvailable && styles.actionTitleDisabled
                  ]}>
                    {action.action_data.title}
                  </Text>
                  <Text style={[
                    styles.actionDescription,
                    !isAvailable && styles.actionDescriptionDisabled
                  ]}>
                    {action.action_data.description}
                  </Text>
                </View>

                <View style={styles.actionMeta}>
                  {action.action_type === 'llm_generated' && (
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                      <Star size={10} color="#fff" />
                    </View>
                  )}

                  {action.expires_at && (
                    <View style={styles.expiryBadge}>
                      <Clock size={10} color="#95a5a6" />
                    </View>
                  )}
                </View>
              </View>

              {action.action_data.requirements.length > 0 && (
                <View style={styles.requirements}>
                  <Text style={styles.requirementsText}>
                    Requires: {action.action_data.requirements.join(', ')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f8f9fa',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  actionTitleDisabled: {
    color: '#95a5a6',
  },
  actionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  actionDescriptionDisabled: {
    color: '#bdc3c7',
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiryBadge: {
    padding: 4,
  },
  requirements: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  requirementsText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  noActionsText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default PlayerActionsPanel; 