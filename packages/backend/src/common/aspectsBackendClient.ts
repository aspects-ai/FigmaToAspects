import {
  AspectsBackendConfig,
  ImageUploadRequest,
  ImageUploadUrlResponse,
} from "types";

export class AspectsBackendClient {
  private config: AspectsBackendConfig;

  constructor(config: AspectsBackendConfig) {
    this.config = config;
  }

  /**
   * Request a time-limited upload URL from the backend
   */
  async requestUploadUrl(
    request: ImageUploadRequest,
  ): Promise<ImageUploadUrlResponse> {
    const authToken = await this.getAuthToken();

    const response = await fetch(
      `${this.config.baseUrl}/api/figma/imageUploadUrl`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Failed to request upload URL: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  }

  /**
   * Upload image data to the pre-signed URL
   */
  async uploadImage(uploadUrl: string, imageData: Uint8Array): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/png",
        "x-ms-blob-type": "BlockBlob", // Azure-specific header
      },
      body: imageData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to upload image: ${response.status} ${errorText}`);
    }
  }

  /**
   * Helper to get auth token (handles string or function)
   */
  private async getAuthToken(): Promise<string> {
    const token = this.config.getAuthToken;

    if (typeof token === "string") {
      return token;
    } else if (typeof token === "function") {
      return await token();
    }

    throw new Error("Invalid getAuthToken configuration");
  }

  isConfigured(): boolean {
    return !!(this.config.baseUrl && this.config.getAuthToken);
  }
}
