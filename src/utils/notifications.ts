import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface NotificationResult {
  success: boolean;
  error?: string;
  permissionStatus?: NotificationPermissionStatus;
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<NotificationResult> {
  try {
    if (Platform.OS === 'web') {
      // Web notifications require different handling
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return {
          success: permission === 'granted',
          permissionStatus: permission as NotificationPermissionStatus,
        };
      } else {
        return {
          success: false,
          error: 'Notifications not supported in this browser',
        };
      }
    }

    // Mobile platforms
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return {
      success: finalStatus === 'granted',
      permissionStatus: finalStatus as NotificationPermissionStatus,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request permissions',
    };
  }
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  try {
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        return Notification.permission as NotificationPermissionStatus;
      }
      return 'denied';
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status as NotificationPermissionStatus;
  } catch (error) {
    console.error('Error getting notification permission status:', error);
    return 'denied';
  }
}

/**
 * Send a test push notification to the current device
 */
export async function sendTestNotification(): Promise<NotificationResult> {
  try {
    // Check permissions first
    const permissionStatus = await getNotificationPermissionStatus();
    
    if (permissionStatus !== 'granted') {
      const permissionResult = await requestNotificationPermissions();
      if (!permissionResult.success) {
        return {
          success: false,
          error: 'Notification permissions not granted',
          permissionStatus: permissionResult.permissionStatus,
        };
      }
    }

    if (Platform.OS === 'web') {
      // Web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Storylines Test Notification', {
          body: 'This is a test notification from Storylines! 🎲',
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: 'storylines-test',
        });
        
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Web notifications not available or permission denied',
        };
      }
    }

    // Mobile notification using Expo Notifications
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Storylines Test Notification 🎲',
        body: 'This is a test notification from Storylines! Your adventures await.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      },
      trigger: null, // Send immediately
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error sending test notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification',
    };
  }
}

/**
 * Send a campaign-related notification
 */
export async function sendCampaignNotification(
  title: string,
  body: string,
  campaignId?: string
): Promise<NotificationResult> {
  try {
    const permissionStatus = await getNotificationPermissionStatus();
    
    if (permissionStatus !== 'granted') {
      return {
        success: false,
        error: 'Notification permissions not granted',
        permissionStatus,
      };
    }

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: campaignId ? `campaign-${campaignId}` : 'storylines-campaign',
          data: {
            campaignId,
            type: 'campaign',
            timestamp: new Date().toISOString(),
          },
        });
        
        return { success: true };
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            campaignId,
            type: 'campaign',
            timestamp: new Date().toISOString(),
          },
        },
        trigger: null,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending campaign notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification',
    };
  }
}

/**
 * Initialize notification listeners
 */
export function initializeNotificationListeners() {
  if (Platform.OS === 'web') {
    // Web notification click handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
          // Handle notification click
          console.log('Notification clicked:', event.data);
        }
      });
    }
  } else {
    // Mobile notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap
      const data = response.notification.request.content.data;
      if (data?.campaignId) {
        // Navigate to campaign or handle campaign-specific action
        console.log('Campaign notification tapped:', data.campaignId);
      }
    });

    // Return cleanup function
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }
}