import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { User, Crown, Info } from 'lucide-react-native';
import { CampaignMessage } from '../atoms/campaignHistoryAtoms';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import DiceRoll from './DiceRoll';

interface StoryEventItemProps {
  message: CampaignMessage;
}

export default function StoryEventItem({ message }: StoryEventItemProps) {

  // Generate consistent dice roll based on message ID (for testing)
  const getTestDiceRoll = () => {
    if (message.dice_roll) return message.dice_roll;
    if (message.message_type === 'player') {
      // Check if this is a message type that should NOT have dice rolls
      const messageContent = message.message.toLowerCase();
      const isOOC = messageContent.startsWith('[ooc]');
      const isAsk = messageContent.startsWith('[asks gm]');
      const isWhisper = messageContent.startsWith('[whispers to');

      // Don't generate dice rolls for OOC, Ask, or Whisper messages
      if (isOOC || isAsk || isWhisper) {
        return null;
      }
      
      // Use message ID as seed for consistent random number
      const seed = message.id;
      return ((seed * 9301 + 49297) % 233280) % 20 + 1;
    }
    return null;
  };

  const testDiceRoll = getTestDiceRoll();

  const getEventIcon = () => {
    switch (message.message_type) {
      case 'gm':
        return <Crown size={24} color="#FFD700" />;
      case 'player':
        // Show character avatar if available, otherwise default user icon
        if (message.character_avatar && message.character_avatar.trim() !== '') {
          // Create a mock character object to use with getCharacterAvatarUrl
          const mockCharacter = {
            avatar: message.character_avatar,
            name: message.character_name,
          };

          const avatarSource = getCharacterAvatarUrl(mockCharacter as any);

          return (
            <View style={styles.avatarContainer}>
              <Image
                source={avatarSource}
                style={styles.characterAvatar}
                onError={(error) => {
                  console.error('Avatar load error:', error);
                  console.log('Failed avatar URL:', message.character_avatar);
                }}
                onLoad={() => console.log('✅ Avatar loaded successfully')}
                onLoadStart={() => console.log('🔄 Avatar loading started')}
                resizeMode="cover"
              />
            </View>
          );
        }
        return <User size={24} color="#4CAF50" />;
      case 'system':
        return <Info size={24} color="#2196F3" />;
      default:
        return null;
    }
  };

  const getEventStyles = () => {
    switch (message.message_type) {
      case 'gm':
        return {
          container: styles.gmContainer,
          text: styles.gmText,
          header: styles.gmHeader,
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
          container: styles.gmContainer,
          text: styles.gmText,
          header: styles.gmHeader,
        };
    }
  };

  const eventStyles = getEventStyles();

  return (
    <View style={[styles.container, eventStyles.container]}>
      <View style={[styles.header, eventStyles.header]}>
        {getEventIcon()}
        <Text style={styles.headerText}>
          {message.message_type === 'gm' ? 'Storyteller' :
            message.message_type === 'player' ? (message.character_name || message.author) :
              'System'}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.content, eventStyles.text]}>
          {message.message}
        </Text>
        {testDiceRoll && (
          <View style={styles.diceContainer}>
            <DiceRoll
              rollResult={testDiceRoll}
              size={100}
              isRolling={false} // For now, always show result immediately for testing
              difficulty={message.difficulty || 10}
            />
          </View>
        )}
      </View>
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
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
  },
  characterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  contentContainer: {
    gap: 12,
  },
  content: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    width: 380
  },
  diceContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  // GM styles
  gmContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  gmHeader: {
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
  },
  gmText: {
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