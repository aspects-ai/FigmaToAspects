import "@figma/plugin-typings";
// Settings
export type Framework = "Flutter" | "SwiftUI" | "HTML" | "Tailwind" | "Compose";

// Image Upload Types
export interface ImageUploadRequest {
  nodeId: string;
  nodeName: string;
  width: number;
  height: number;
  format: 'PNG';
  timestamp: number;
}

export interface ImageUploadUrlResponse {
  /**
   * Pre-signed URL for uploading the image (PUT request)
   */
  uploadUrl: string;

  /**
   * Public URL for referencing the image in generated code
   */
  publicUrl: string;

  /**
   * Optional backend-provided metadata
   */
  metadata?: {
    expiresAt?: number;
    blobName?: string;
  };
}

export interface AspectsBackendConfig {
  /**
   * Base URL of the Aspects backend
   */
  baseUrl: string;

  /**
   * Bearer token for authentication (can be a function for dynamic tokens)
   * Optional - if not provided, requests will be unauthenticated for preview/anonymous uploads
   */
  getAuthToken?: (() => Promise<string>) | (() => string) | string;

  /**
   * Optional custom headers to include in requests
   */
  headers?: Record<string, string>;
}

// ============================================================================
// Auth Types
// ============================================================================

/**
 * User information returned from OAuth flow
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * OAuth tokens stored in clientStorage
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in seconds
}

/**
 * Auth state for UI
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

/**
 * Token response from OAuth endpoints
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until expiration
  tokenType: string; // "Bearer"
  user: AuthUser;
}

/**
 * User info response from /api/oauth/me
 */
export interface UserInfoResponse extends AuthUser {
  // Additional fields can be added here as needed
}

export interface HTMLSettings {
  showLayerNames: boolean;
  imageUploadMode: 'upload' | 'placeholder';
  embedVectors: boolean;
  useColorVariables: boolean;
  htmlGenerationMode: "html" | "jsx" | "styled-components" | "svelte";
}
export interface TailwindSettings extends HTMLSettings {
  tailwindGenerationMode: "html" | "jsx";
  roundTailwindValues: boolean;
  roundTailwindColors: boolean;
  useColorVariables: boolean;
  customTailwindPrefix?: string;
  embedVectors: boolean;
  baseFontSize: number;
  useTailwind4: boolean;
  thresholdPercent: number;
  baseFontFamily: string;
}
export interface FlutterSettings {
  flutterGenerationMode: "fullApp" | "stateless" | "snippet";
}
export interface SwiftUISettings {
  swiftUIGenerationMode: "preview" | "struct" | "snippet";
}
export interface ComposeSettings {
  composeGenerationMode: "snippet" | "composable" | "screen";
}
export interface PluginSettings
  extends HTMLSettings,
    TailwindSettings,
    FlutterSettings,
    SwiftUISettings,
    ComposeSettings {
  framework: Framework;
  useOldPluginVersion2025: boolean;
  responsiveRoot: boolean;
}
// Messaging
export interface ConversionData {
  code: string;
  settings: PluginSettings;
  htmlPreview: HTMLPreview;
  colors: SolidColorConversion[];
  gradients: LinearGradientConversion[];
  warnings: Warning[];
}

export type Warning = string;
export type Warnings = Set<Warning>;

export interface Message {
  type: string;
}
export interface UIMessage {
  pluginMessage: Message;
}
export type EmptyMessage = Message & { type: "empty" };
export type ConversionStartMessage = Message & { type: "conversionStarted" };
export type ConversionMessage = Message & {
  type: "code";
} & ConversionData;
export type SettingWillChangeMessage<T> = Message & {
  type: "pluginSettingWillChange";
  key: string;
  value: T;
};
export type SettingsChangedMessage = Message & {
  type: "pluginSettingsChanged";
  settings: PluginSettings;
};
export type ErrorMessage = Message & {
  type: "error";
  error: string;
};
export type PreviewRequestMessage = Message & { type: "preview-requested" };
export type ExportRequestMessage = Message & { type: "export-requested" };
export type SelectionStateMessage = Message & {
  type: "selection-state";
  hasSelection: boolean;
};
export type ConfigureImageUploadMessage = Message & {
  type: "configure-image-upload";
  config: AspectsBackendConfig;
};

// Auth Messages (UI -> Plugin)
export type AuthInitiateMessage = Message & {
  type: "auth-initiate";
  challenge: string; // PKCE code challenge
};

export type LogoutMessage = Message & {
  type: "logout";
};

// Auth Messages (Plugin -> UI)
export type AuthCompleteMessage = Message & {
  type: "auth-complete";
  user: AuthUser;
};

export type AuthErrorMessage = Message & {
  type: "auth-error";
  error: string;
};

export type AuthStatusMessage = Message & {
  type: "auth-status";
  authState: AuthState;
};

export type AuthPollingStatusMessage = Message & {
  type: "auth-polling-status";
  status: string;
};

// Nodes
export type ParentNode = BaseNode & ChildrenMixin;

export type AltNodeMetadata<T extends BaseNode> = {
  originalNode: T;
  canBeFlattened: boolean;
  svg?: string;
  base64?: string;
};
export type AltNode<T extends BaseNode> = T & AltNodeMetadata<T>;

export type ExportableNode = SceneNode & ExportMixin & MinimalFillsMixin;

// Styles & Conversions

export type LayoutMode =
  | ""
  | "Absolute"
  | "TopStart"
  | "TopCenter"
  | "TopEnd"
  | "CenterStart"
  | "Center"
  | "CenterEnd"
  | "BottomStart"
  | "BottomCenter"
  | "BottomEnd";

export interface BoundingRect {
  x: number;
  y: number;
}

interface AllSides {
  all: number;
}
interface Sides {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
interface Corners {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}
interface HorizontalAndVertical {
  horizontal: number;
  vertical: number;
}

export type PaddingType = Sides | AllSides | HorizontalAndVertical;
export type BorderSide = AllSides | Sides;
export type CornerRadius = AllSides | Corners;

export type SizeValue = number | "fill" | null;
export interface Size {
  readonly width: SizeValue;
  readonly height: SizeValue;
}

export type StyledTextSegmentSubset = Omit<
  StyledTextSegment,
  "listSpacing" | "paragraphIndent" | "paragraphSpacing" | "textStyleOverrides"
>;

export type FontWeightNumber =
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ColorSpec = {
  source: string;
  rgb: RGB;
};

export type SolidColorConversion = {
  hex: string;
  colorName: string;
  exportValue: string;
  contrastWhite: number;
  contrastBlack: number;
  meta?: string;
};
export type LinearGradientConversion = {
  cssPreview: string;
  exportValue: string;
};

// Framework Specific

export interface HTMLPreview {
  size: { width: number; height: number };
  content: string;
}

export interface TailwindTextConversion {
  name: string;
  attr: string;
  full: string;
  style: string;
  contrastBlack: number;
}

export type TailwindColorType = "text" | "bg" | "border" | "outline";

export type SwiftUIModifier = [
  string,
  string | SwiftUIModifier | SwiftUIModifier[],
];

// UI

export interface PreferenceOptions {
  itemType: string;
  label: string;
  propertyName: string;
  includedLanguages?: Framework[];
}
export interface SelectPreferenceOptions extends PreferenceOptions {
  itemType: "select";
  propertyName: Exclude<keyof PluginSettings, "framework">;
  options: { label: string; value: string; isDefault?: boolean }[];
}

export interface LocalCodegenPreferenceOptions extends PreferenceOptions {
  itemType: "individual_select";
  propertyName: Exclude<
    keyof PluginSettings,
    "framework" | "flutterGenerationMode" | "swiftUIGenerationMode"
  >;
  description: string;
  value?: boolean;
  isDefault?: boolean;
}
