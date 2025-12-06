import {
  AspectsBackendConfig,
  Conversation,
  FileAttachment,
  ImageUploadRequest,
  ImageUploadUrlResponse,
  Project,
  ProjectDimensions,
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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };

    // Only include Authorization header if token is available
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `${this.config.baseUrl}/figma/imageUploadUrl`,
      {
        method: "POST",
        headers,
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
   * Upload multiple files as attachments to the backend
   * Note: Works in Figma plugin sandbox by manually constructing multipart form data
   */
  async uploadFiles(
    files: Array<{ data: Uint8Array; filename: string; description: string }>,
  ): Promise<FileAttachment[]> {
    const authToken = await this.getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required to upload files");
    }

    if (files.length === 0) {
      throw new Error("No files to upload");
    }

    // Manually construct multipart/form-data since FormData is not available in Figma sandbox
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;

    // Build the multipart body manually
    // Format for each part: --boundary\r\nheaders\r\n\r\ncontent\r\n
    const textEncoder = (str: string) => new Uint8Array(Array.from(str).map(c => c.charCodeAt(0)));
    const CRLF = textEncoder('\r\n');

    const bodyParts: Uint8Array[] = [];

    // Add each file
    for (const file of files) {
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.filename}"\r\nContent-Type: text/html\r\n\r\n`;
      bodyParts.push(textEncoder(header));
      bodyParts.push(file.data);
      bodyParts.push(CRLF);
    }

    // Add descriptions as a single CSV-joined field (API expects comma-separated values)
    const allDescriptions = files.map(f => f.description).join(',');
    const descHeader = `--${boundary}\r\nContent-Disposition: form-data; name="descriptions"\r\n\r\n`;
    bodyParts.push(textEncoder(descHeader));
    bodyParts.push(textEncoder(allDescriptions));
    bodyParts.push(CRLF);

    // End boundary
    bodyParts.push(textEncoder(`--${boundary}--\r\n`));

    // Combine all parts
    const totalLength = bodyParts.reduce((sum, part) => sum + part.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of bodyParts) {
      body.set(part, offset);
      offset += part.length;
    }

    const headers: Record<string, string> = {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${authToken}`,
      ...this.config.headers,
    };

    const response = await fetch(`${this.config.baseUrl}/files`, {
      method: "POST",
      headers,
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Failed to upload file: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  }

  /**
   * Helper to get auth token (handles string or function)
   * Returns null if no token is configured (for anonymous uploads)
   */
  private async getAuthToken(): Promise<string | null> {
    const token = this.config.getAuthToken;

    if (!token) {
      return null;
    }

    if (typeof token === "string") {
      return token;
    } else if (typeof token === "function") {
      return await token() || null;
    }

    throw new Error("Invalid getAuthToken configuration");
  }

  /**
   * Create a new project
   */
  async createProject(
    name: string,
    description: string,
    dimensions: ProjectDimensions,
    userId: string,
  ): Promise<Project> {
    const authToken = await this.getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required to create projects");
    }

    // All required fields must be provided per the schema
    const projectData = {
      id: "10295ce5-47d7-4be5-8304-0550cb0cbf6f",
      userId,
      name,
      description,
      createdAt: new Date().toISOString(),
      attachments: [],
      presentationType: "marketingAsset",
      frames: [],
      dimensions,
      needsInitialGeneration: true,
    };

    const response = await fetch(`${this.config.baseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...this.config.headers,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Failed to create project: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    projectId: string,
    userId: string,
    name: string,
  ): Promise<Conversation> {
    const authToken = await this.getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required to create conversations");
    }

    const conversationData = {
      id: "",
      projectId,
      name,
      userId,
      messages: [],
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${this.config.baseUrl}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...this.config.headers,
      },
      body: JSON.stringify(conversationData),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Failed to create conversation: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  }

  /**
   * Start AI inference for a project
   */
  async performInference(
    projectId: string,
    conversationId: string,
    userMessage: string,
    attachmentIds: string[],
    inferenceContext: string,
  ): Promise<void> {
    const authToken = await this.getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required to perform inference");
    }

    const inferenceData = {
      userMessage,
      inferenceContext,
      chatMode: "edit",
      conversationId,
      projectId,
      attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
    };

    const response = await fetch(`${this.config.baseUrl}/infer/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...this.config.headers,
      },
      body: JSON.stringify(inferenceData),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `Failed to start inference: ${response.status} ${errorText}`,
      );
    }
  }

  isConfigured(): boolean {
    return !!this.config.baseUrl;
  }
}
