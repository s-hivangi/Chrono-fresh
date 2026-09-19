// Compatibility declarations for untyped internals referenced by Expo SDK 57.
declare module 'react-native/Libraries/Image/AssetSourceResolver';
declare module 'react-native/Libraries/Image/resolveAssetSource';
declare module '@react-native/assets-registry/registry';
declare module 'invariant';

declare module 'expo-font' {
  export function useFonts(fonts: Record<string, unknown>): [boolean, Error | null];
}
declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<void>;
  export function hideAsync(): Promise<void>;
}
declare module 'expo-image-picker' {
  export type ImagePickerAsset = { uri: string };
  export type ImagePickerResult = { canceled: true; assets?: never } | { canceled: false; assets: ImagePickerAsset[] };
  export function requestCameraPermissionsAsync(): Promise<{ granted: boolean; status: string }>;
  export function launchCameraAsync(options?: unknown): Promise<ImagePickerResult>;
  export function launchImageLibraryAsync(options?: unknown): Promise<ImagePickerResult>;
  export const MediaTypeOptions: { Images: string };
}
declare module 'expo-image-manipulator' {
  export const SaveFormat: { JPEG: string };
  export function manipulateAsync(uri: string, actions: unknown[], options?: unknown): Promise<{ uri: string }>;
}
declare module 'expo-constants' {
  const Constants: { expoConfig?: { version?: string } };
  export default Constants;
}
declare module 'expo-notifications' {
  export const AndroidImportance: { DEFAULT: number };
  export const SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' };
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function setNotificationChannelAsync(id: string, options: unknown): Promise<unknown>;
  export function scheduleNotificationAsync(options: unknown): Promise<string>;
}
declare module 'react-native-reanimated';
declare module 'expo-router/html' {
  import type { ComponentType } from 'react';
  export const ScrollViewStyleReset: ComponentType;
}

interface Window {
  $$EXPO_INITIAL_PROPS?: unknown;
}
