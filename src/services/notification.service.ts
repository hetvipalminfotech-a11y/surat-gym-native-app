import * as Device from 'expo-device';
import { Platform } from 'react-native';
import API from './api';
import { getDeviceId } from '../storage/mmkv';

let Notifications: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications is unavailable (running in standard Expo Go environment).');
}

export interface RegisterTokenResponse {
  success: boolean;
  message: string;
}

export async function registerDevicePushToken(): Promise<void> {
  if (!Device.isDevice) {
    console.warn('FCM notifications require a physical device');
    return;
  }

  if (!Notifications) {
    console.warn('Skipping push token registration: expo-notifications native module is not available in Expo Go.');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to obtain user push notification permission.');
      return;
    }

    // Retrieve the NATIVE device registration token (FCM for Android, APNs for iOS)
    let deviceTokenData;
    try {
      deviceTokenData = await Notifications.getDevicePushTokenAsync();
    } catch (tokenError) {
      const err = tokenError as Error;
      throw new Error(
        `Google Play/FCM is not configured. Download google-services.json, add "android.googleServicesFile" to app.json, and rebuild your app: ${err.message}`
      );
    }

    const fcmToken: string = deviceTokenData.data;
    const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceId: string = getDeviceId();

    // Register token to NestJS backend
    await API.post<RegisterTokenResponse>('/users/fcm-token', {
      fcmToken,
      platform,
      deviceId,
    });
    
    console.log('Successfully registered FCM Device token:', fcmToken);
  } catch (error) {
    const err = error as Error;
    console.error('Error during FCM device token registration:', err.message);
  }
}
