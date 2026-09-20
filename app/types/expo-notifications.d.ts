export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export const AndroidImportance: { DEFAULT: number };
export const SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' };
export function getPermissionsAsync(): Promise<{ status: PermissionStatus }>;
export function requestPermissionsAsync(): Promise<{ status: PermissionStatus }>;
export function setNotificationChannelAsync(id: string, options: unknown): Promise<unknown>;
export function scheduleNotificationAsync(options: unknown): Promise<string>;
