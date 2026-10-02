export const ExecutionEnvironment: {
  readonly StoreClient: string;
  readonly Bare: string;
  readonly Standalone: string;
};

interface ConstantsType {
  expoConfig?: {
    version?: string;
    hostUri?: string;
  };
  /** @deprecated */
  expoGoConfig?: {
    debuggerHost?: string;
  };
  executionEnvironment?: string;
  experienceUrl?: string;
  __unsafeNoWarnManifest2?: unknown;
}

declare const Constants: ConstantsType;
export default Constants;
