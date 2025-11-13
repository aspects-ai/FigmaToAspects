import {
  AltNode,
  ExportableNode,
  ImageUploadRequest,
} from "types";
import { exportAsyncProxy } from "./exportAsyncProxy";
import { addWarning } from "./commonConversionWarnings";
import { getPlaceholderImage } from "./images";
import { AspectsBackendClient } from "./aspectsBackendClient";

interface UploadedImage {
  url: string;
  nodeId: string;
  uploadedAt: number;
}

class ImageUploadCache {
  private cache: Map<string, UploadedImage> = new Map();

  get(nodeId: string): string | undefined {
    return this.cache.get(nodeId)?.url;
  }

  set(nodeId: string, url: string): void {
    this.cache.set(nodeId, {
      url,
      nodeId,
      uploadedAt: Date.now(),
    });
  }

  has(nodeId: string): boolean {
    return this.cache.has(nodeId);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()),
    };
  }
}

export class ImageUploadService {
  private static instance: ImageUploadService;
  private cache: ImageUploadCache;
  private client: AspectsBackendClient | null = null;

  private constructor() {
    this.cache = new ImageUploadCache();
  }

  static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  configure(client: AspectsBackendClient): void {
    this.client = client;
  }

  isConfigured(): boolean {
    return this.client !== null && this.client.isConfigured();
  }

  /**
   * Export node as PNG bytes and upload to storage
   * Returns cached URL if already uploaded
   */
  async uploadNodeImage(
    node: AltNode<ExportableNode>,
    excludeChildren: boolean = false,
  ): Promise<string> {
    // Check cache first
    const cachedUrl = this.cache.get(node.id);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Ensure client is configured
    if (!this.isConfigured()) {
      return getPlaceholderImage(node.width, node.height);
    }

    try {
      // 1. Export node as PNG bytes
      const bytes = await this.exportNodeAsBytes(node, excludeChildren);

      // 2. Prepare request for backend
      const request: ImageUploadRequest = {
        nodeId: node.id,
        nodeName: node.name,
        width: node.width,
        height: node.height,
        format: "PNG",
        timestamp: Date.now(),
      };

      // 3. Request upload URL from backend
      const { uploadUrl, publicUrl } =
        await this.client!.requestUploadUrl(request);

      // 4. Upload image to pre-signed URL
      await this.client!.uploadImage(uploadUrl, bytes);

      // 5. Cache the public URL
      this.cache.set(node.id, publicUrl);

      addWarning(`Images uploaded to external storage`);

      return publicUrl;
    } catch (error) {
      addWarning(`Failed to upload some images, using placeholders`);

      // Fallback to placeholder
      return getPlaceholderImage(node.width, node.height);
    }
  }

  /**
   * Export node as PNG bytes (extracted from exportNodeAsBase64PNG)
   */
  private async exportNodeAsBytes(
    node: AltNode<ExportableNode>,
    excludeChildren: boolean,
  ): Promise<Uint8Array> {
    const n: ExportableNode = node;

    // Handle hiding children if needed
    const temporarilyHideChildren =
      excludeChildren && "children" in n && n.children.length > 0;
    const parent = n as ChildrenMixin;
    const originalVisibility = new Map<SceneNode, boolean>();

    if (temporarilyHideChildren) {
      parent.children.forEach((child: SceneNode) => {
        originalVisibility.set(child, child.visible);
        child.visible = false;
      });
    }

    // Export as PNG bytes
    const exportSettings: ExportSettingsImage = {
      format: "PNG",
      constraint: { type: "SCALE", value: 1 },
    };
    const bytes = await exportAsyncProxy(n, exportSettings);

    // Restore visibility
    if (temporarilyHideChildren) {
      parent.children.forEach((child) => {
        child.visible = originalVisibility.get(child) ?? false;
      });
    }

    return bytes;
  }

  /**
   * Clear the upload cache (useful between sessions or on reset)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

// Export singleton instance
export const imageUploadService = ImageUploadService.getInstance();
