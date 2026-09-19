declare module 'expo-router' {
  import type { ComponentType, ReactNode } from 'react';
  export const Stack: ComponentType<any> & { Screen: ComponentType<any> };
  export const Tabs: ComponentType<any> & { Screen: ComponentType<any> };
  export const Link: ComponentType<any>;
  export const ErrorBoundary: ComponentType<any>;
  export function useRouter(): {
    push(path: any): void;
    replace(path: any): void;
    back(): void;
  };
  export function useLocalSearchParams<T extends object = Record<string, string>>(): T;
}
