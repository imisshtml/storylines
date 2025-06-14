import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image, ScrollView } from 'react-native';
import { LogOut, X, User, Info, UserPlus, Plus, Handshake, Binary, Users, UserCog } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { signOutAtom, userAtom } from '../atoms/authAtoms';
import { router } from 'expo-router';
import { friendRequestsReceivedAtom } from '../atoms/friendsAtoms';
import { currentCampaignAtom } from '../atoms/campaignAtoms';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface SidebarMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onJoinCampaign?: () => void;
}

export default function SidebarMenu({ isVisible, onClose, onJoinCampaign }: SidebarMenuProps) {
  const [user] = useAtom(userAtom);
  const [, signOut] = useAtom(signOutAtom);
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [imageError, setImageError] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const [friendRequestsReceived] = useAtom(friendRequestsReceivedAtom);
  const friendRequestCount = friendRequestsReceived.length;

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitial = () => {
    const name = user?.username || user?.email || 'A';
    return name.charAt(0).toUpperCase();
  };

  const handleCreateCampaign = () => {
    onClose();
    setCurrentCampaign(null);
    setTimeout(() => {
      router.push('/create');
    }, 50);
  };

  const handleJoinCampaign = () => {
    onClose();
    if (onJoinCampaign) {
      onJoinCampaign();
    }
  };

  const menuItems = [
    {
      icon: <Users size={24} color="#fff" />,
      title: 'My Characters',
      subtitle: 'Create a new Character',
      onPress: handleCreateCampaign,
    },
    {
      icon: <Plus size={24} color="#fff" />,
      title: 'Create Campaign',
      subtitle: 'Start a new adventure',
      onPress: handleCreateCampaign,
    },
    {
      icon: <Binary size={24} color="#fff" />,
      title: 'Join via Code',
      subtitle: 'Join an existing campaign',
      onPress: handleJoinCampaign,
    },
    {
      icon: <UserPlus size={24} color="#fff" />,
      title: 'Create Character',
      subtitle: 'Build a new 5e character',
      onPress: () => {
        onClose();
        router.push('/creation');
      },
    },
    {
      icon: <Handshake size={24} color="#fff" />,
      title: 'Friends',
      subtitle: 'Every Hero needs a fellowship',
      onPress: () => {
        onClose();
        router.push('/friends');
      },
      badge: friendRequestCount > 0 ? friendRequestCount : undefined,
    },
    {
      icon: <UserCog size={24} color="#fff" />,
      title: 'Account & Settings',
      subtitle: 'Manage your account',
      onPress: () => {
        onClose();
        router.push('/profile');
      },
    },
    {
      icon: <Info size={24} color="#fff" />,
      title: 'About',
      subtitle: 'App information',
      onPress: () => {
        onClose();
        router.push('/about');
      },
    },
  ];

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.username || user?.email || 'Adventurer'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  {item.icon}
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {/* Logout Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={24} color="#fff" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#4CAF50',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
});