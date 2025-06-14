import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Send, ArrowLeft, Trash2, Settings, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';

type DevMessage = {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
};

export default function DevScreen() {
  const [messages, setMessages] = useState<DevMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Developer AI Testing Interface initialized. Set a campaign UUID and start testing!',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [campaignUuid, setCampaignUuid] = useState('test-campaign-123');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const addMessage = (type: 'user' | 'ai' | 'system', content: string) => {
    const newMessage: DevMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput.trim();
    setUserInput('');
    
    // Add user message
    addMessage('user', message);
    setIsLoading(true);

    try {
      // Create mock campaign context for testing
      const mockContext = {
        campaign: {
          id: campaignUuid,
          name: 'Dev Test Campaign',
          theme: 'fantasy',
          tone: 'serious',
          level: 1,
          exclude: [],
        },
        storyHistory: messages.filter(m => m.type !== 'system').slice(-5),
      };

      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaignUuid,
          message: `Dev test: ${message}`,
          context: mockContext,
          playerAction: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      addMessage('ai', data.response);

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('system', `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`);
      Alert.alert(
        'Connection Error',
        'Failed to get response from AI. Check your API key and connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: '1',
                type: 'system',
                content: 'Chat cleared. Ready for new testing session.',
                timestamp: new Date().toISOString(),
              }
            ]);
          }
        }
      ]
    );
  };

  const getMessageStyles = (type: 'user' | 'ai' | 'system') => {
    switch (type) {
      case 'user':
        return {
          container: styles.userMessage,
          text: styles.userMessageText,
          label: 'You',
          icon: '👤',
        };
      case 'ai':
        return {
          container: styles.aiMessage,
          text: styles.aiMessageText,
          label: 'AI DM',
          icon: '🎲',
        };
      case 'system':
        return {
          container: styles.systemMessage,
          text: styles.systemMessageText,
          label: 'System',
          icon: '⚙️',
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>AI Dev Testing</Text>
          <Text style={styles.subtitle}>OpenAI Integration Test</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Trash2 color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.configSection}>
        <View style={styles.configRow}>
          <Settings size={16} color="#4CAF50" />
          <Text style={styles.configLabel}>Campaign UUID:</Text>
        </View>
        <TextInput
          style={styles.uuidInput}
          value={campaignUuid}
          onChangeText={setCampaignUuid}
          placeholder="Enter campaign UUID for testing"
          placeholderTextColor="#666"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => {
            const messageStyles = getMessageStyles(message.type);
            return (
              <View key={message.id} style={[styles.messageContainer, messageStyles.container]}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageLabel}>
                    {messageStyles.icon} {messageStyles.label}
                  </Text>
                  <Text style={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </Text>
                </View>
                <Text style={[styles.messageText, messageStyles.text]}>
                  {message.content}
                </Text>
              </View>
            );
          })}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Type your message to test AI..."
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!userInput.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!userInput.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Send size={24} color={userInput.trim() ? '#fff' : '#666'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <MessageSquare size={16} color="#666" />
        <Text style={styles.footerText}>
          Messages: {messages.length} | Campaign: {campaignUuid}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  clearButton: {
    marginLeft: 16,
  },
  configSection: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  configLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  uuidInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  userMessage: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessage: {
    backgroundColor: '#2a2a2a',
    alignSelf: 'flex-start',
    maxWidth: '80%',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  aiMessageText: {
    color: '#fff',
  },
  systemMessage: {
    backgroundColor: '#1e3a8a',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  systemMessageText: {
    color: '#fff',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
});