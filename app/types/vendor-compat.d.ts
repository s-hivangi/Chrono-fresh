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
  export const ExecutionEnvironment: {
    readonly StoreClient: string;
    readonly Bare: string;
    readonly Standalone: string;
  };
  const Constants: {
    expoConfig?: { version?: string; hostUri?: string };
    /** @deprecated */ expoGoConfig?: { debuggerHost?: string };
    executionEnvironment?: string;
  };
  export default Constants;
}
declare module 'expo-notifications' {
  export type PermissionStatus = 'granted' | 'denied' | 'undetermined';
  export const AndroidImportance: { DEFAULT: number };
  export const SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' };
  export function getPermissionsAsync(): Promise<{ status: PermissionStatus }>;
  export function requestPermissionsAsync(): Promise<{ status: PermissionStatus }>;
  export function setNotificationChannelAsync(id: string, options: unknown): Promise<unknown>;
  export function scheduleNotificationAsync(options: unknown): Promise<string>;
}
declare module 'expo-linear-gradient' {
  import type { ComponentType } from 'react';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export interface LinearGradientProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    // Accept any style value — matches real expo-linear-gradient behaviour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style?: any;
    children?: React.ReactNode;
  }
  export const LinearGradient: ComponentType<LinearGradientProps>;
}
declare module 'react-native-reanimated';
declare module 'react-native-svg' {
  import React from 'react';
  interface CommonProps {
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    opacity?: number;
    children?: React.ReactNode;
  }
  interface SvgProps extends CommonProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
  }
  interface PathProps extends CommonProps { d: string; fillRule?: string; clipRule?: string; }
  interface CircleProps extends CommonProps { cx?: number | string; cy?: number | string; r?: number | string; }
  interface RectProps extends CommonProps { x?: number | string; y?: number | string; width?: number | string; height?: number | string; rx?: number | string; ry?: number | string; }
  interface LineProps extends CommonProps { x1?: number | string; y1?: number | string; x2?: number | string; y2?: number | string; }
  export const Svg: React.FC<SvgProps>;
  export const Path: React.FC<PathProps>;
  export const Circle: React.FC<CircleProps>;
  export const Rect: React.FC<RectProps>;
  export const Line: React.FC<LineProps>;
  export const G: React.FC<CommonProps>;
  export default Svg;
}
declare module 'expo-router/html' {
  import type { ComponentType } from 'react';
  export const ScrollViewStyleReset: ComponentType;
}

interface Window {
  $$EXPO_INITIAL_PROPS?: unknown;
}
