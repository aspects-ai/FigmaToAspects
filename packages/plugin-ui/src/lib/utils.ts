import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const createCanvasImageUrl = (width: number, height: number): string => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return `https://placehold.co/${width}x${height}`;
  }

  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, width, height);

  const fontSize = Math.max(12, Math.floor(width * 0.15));
  ctx.font = `bold ${fontSize}px Inter, Arial, Helvetica, sans-serif`;
  ctx.fillStyle = "#888888";

  const text = `${width} x ${height}`;
  const textWidth = ctx.measureText(text).width;
  const x = (width - textWidth) / 2;
  const y = (height + fontSize) / 2;

  ctx.fillText(text, x, y);

  return canvas.toDataURL();
};

export function replaceExternalImagesWithCanvas(html: string): string {
  return html.replace(
    /https:\/\/placehold\.co\/(\d+)x(\d+)/g,
    (_match, width, height) => {
      return createCanvasImageUrl(parseInt(width), parseInt(height));
    }
  );
}

/**
 * Triggers a file download in the browser
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/html"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a timestamped filename for HTML exports
 */
export function generateHtmlFilename(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19); // YYYY-MM-DDTHH-MM-SS
  return `figma-export-${timestamp}.html`;
}
