import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, Crown, Info } from 'lucide-react-native';
import { StoryEvent } from '../hooks/useStoryAI';

interface StoryEventItemProps {
  event: StoryEvent;
}

export default function StoryEventItem({ event }: StoryEventItemProps) {
  const getEventIcon = () => {
    switch (event.type) {
      case 'dm':
        return <Crown size={16} color="#FFD700" />;
      case 'player':
        return <User size={16} color="#4CAF50" />;
      case 'system':
        return <Info size={16} color="#2196F3" />;
      default:
        return null;
    }
  };

  const getEventStyles = () => {
    switch (event.type) {
      case 'dm':
        return {
          container: styles.dmContainer,
          text: styles.dmText,
          header: styles.dmHeader,
        };
      case 'player':
        return {
          container: styles.playerContainer,
          text: styles.playerText,
          header: styles.playerHeader,
        };
      case 'system':
        return {
          container: styles.systemContainer,
          text: styles.systemText,
          header: styles.systemHeader,
        };
      default:
        return {
          container: styles.dmContainer,
          text: styles.dmText,
          header: styles.dmHeader,
        };
    }
  };

  const eventStyles = getEventStyles();

  return (
    <View style={[styles.container, eventStyles.container]}>
      <View style={[styles.header, eventStyles.header]}>
        {getEventIcon()}
        <Text style={styles.headerText}>
          {event.type === 'dm' ? 'Dungeon Master' : 
           event.type === 'player' ? (event.playerName || 'Player') : 
           'System'}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(event.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      <Text style={[styles.content, eventStyles.text]}>
        {event.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  content: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  // DM styles
  dmContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  dmHeader: {
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
  },
  dmText: {
    color: '#1a1a1a',
  },
  // Player styles
  playerContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  playerHeader: {
    borderBottomColor: 'rgba(76, 175, 80, 0.3)',
  },
  playerText: {
    color: '#1a1a1a',
  },
  // System styles
  systemContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  systemHeader: {
    borderBottomColor: 'rgba(33, 150, 243, 0.3)',
  },
  systemText: {
    color: '#1a1a1a',
    fontStyle: 'italic',
  },
});