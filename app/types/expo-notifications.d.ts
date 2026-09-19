export const AndroidImportance: { DEFAULT: number };
export const SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' };
export function getPermissionsAsync(): Promise<{ status: string }>;
export function requestPermissionsAsync(): Promise<{ status: string }>;
export function setNotificationChannelAsync(id: string, options: unknown): Promise<unknown>;
export function scheduleNotificationAsync(options: unknown): Promise<string>;
