export type ImagePickerAsset = { uri: string };
export type ImagePickerResult = { canceled: true; assets?: never } | { canceled: false; assets: ImagePickerAsset[] };
export function requestCameraPermissionsAsync(): Promise<{ granted: boolean; status: string }>;
export function launchCameraAsync(options?: unknown): Promise<ImagePickerResult>;
export function launchImageLibraryAsync(options?: unknown): Promise<ImagePickerResult>;
export const MediaTypeOptions: { Images: string };
