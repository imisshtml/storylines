import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, ScrollView, Dimensions } from 'react-native';
import { LogOut, X } from 'lucide-react-native';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { signOutAtom, userAtom } from '@/atoms/authAtoms';
import { router } from 'expo-router';
import { friendRequestsReceivedAtom } from '@/atoms/friendsAtoms';
import { currentCampaignAtom } from '@/atoms/campaignAtoms';
import { useLimitEnforcement } from '@/hooks/useLimitEnforcement';
import Constants from 'expo-constants';
import styles from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface SidebarMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

const SidebarMenu = ({ isVisible, onClose }: SidebarMenuProps) => {
  const user = useAtomValue(userAtom);
  const signOut = useSetAtom(signOutAtom);
  const setCurrentCampaign = useSetAtom(currentCampaignAtom);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [friendRequestsReceived] = useAtom(friendRequestsReceivedAtom);
  const friendRequestCount = friendRequestsReceived.length;
  const { checkCampaignLimit } = useLimitEnforcement();
  const appVersion = (Constants.expoConfig as any)?.version ?? (Constants.expoConfig as any)?.version ?? 'dev';
  const buildNumber = Constants.nativeBuildVersion ?? 'dev';

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleCreateCampaign = async () => {
    const canCreate = await checkCampaignLimit();
    if (canCreate) {
      onClose();
      setCurrentCampaign(null);
      setTimeout(() => {
        router.push('/create');
      }, 50);
    } else {
      onClose();
    }
  };

  const handleJoinCampaign = () => {
    onClose();
    router.push('/join');
  };

  const menuItems = [
    {
      icon: <Image source={require('@/assets/images/market.png')} style={styles.img} />,
      title: "The Goblin's Market",
      subtitle: 'Enhance your adventure',
      onPress: () => {
        onClose();
        router.push('/shop');
      },
    },
    {
      icon: <Image source={require('@/assets/images/friends.png')} style={styles.img} />,
      title: 'Friends',
      subtitle: 'Every Hero needs a fellowship',
      onPress: () => {
        onClose();
        router.push('/friends');
      },
      badge: friendRequestCount > 0 ? friendRequestCount : undefined,
    },
    {
      icon: <Image source={require('@/assets/images/characters.png')} style={styles.img} />,
      title: 'My Characters',
      subtitle: 'View and Create 5e characters',
      onPress: () => {
        onClose();
        router.push('/characters');
      },
    },
    {
      icon: <Image source={require('@/assets/images/create.png')} style={styles.img} />,
      title: 'Create Campaign',
      subtitle: 'Start a new adventure',
      onPress: handleCreateCampaign,
    },
    {
      icon: <Image source={require('@/assets/images/join.png')} style={styles.img} />,
      title: 'Join a Campaign',
      subtitle: 'Join an existing campaign',
      onPress: handleJoinCampaign,
    },
    {
      icon: <Image source={require('@/assets/images/account.png')} style={styles.img} />,
      title: 'Account & Settings',
      subtitle: 'Manage your account',
      onPress: () => {
        onClose();
        router.push('/profile');
      },
    },
    {
      icon: <Image source={require('@/assets/images/about.png')} style={styles.img} />,
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
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.menuSubtitle}>{`Version ${appVersion} (${buildNumber})`}</Text>
        </View>
        {/* Logout Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={24} color="#fff" />
            <Text style={styles.logoutText}>{'Log Out'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default SidebarMenu;