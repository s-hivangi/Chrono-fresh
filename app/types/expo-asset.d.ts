export class Asset {
  uri: string;
  static fromModule(moduleId: number): Asset;
}

export type AssetMetadata = Record<string, unknown>;
