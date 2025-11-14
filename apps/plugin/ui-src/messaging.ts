import {
  Message,
  SettingWillChangeMessage,
  UIMessage,
  AuthInitiateMessage,
  LogoutMessage,
} from "types";

if (!parent || !parent.postMessage) {
  throw new Error("parent.postMessage() is not defined");
}
const postMessage = (message: UIMessage, options?: WindowPostMessageOptions) =>
  parent.postMessage(message, options);

export const postUIMessage = (
  message: Message,
  options?: WindowPostMessageOptions,
) => postMessage({ pluginMessage: message }, options);

export const postUISettingsChangingMessage = <T>(
  key: string,
  value: T,
  options?: WindowPostMessageOptions,
) => {
  const message: SettingWillChangeMessage<T> = {
    type: "pluginSettingWillChange",
    key,
    value,
  };
  postUIMessage(message, options);
};

export const postPreviewRequest = (options?: WindowPostMessageOptions) => {
  const message: Message = {
    type: "preview-requested",
  };
  postUIMessage(message, options);
};

export const postExportRequest = (options?: WindowPostMessageOptions) => {
  const message: Message = {
    type: "export-requested",
  };
  postUIMessage(message, options);
};

// Auth message helpers
export const postAuthInitiate = (
  challenge: string,
  options?: WindowPostMessageOptions,
) => {
  const message: AuthInitiateMessage = {
    type: "auth-initiate",
    challenge,
  };
  postUIMessage(message, options);
};

export const postLogout = (options?: WindowPostMessageOptions) => {
  const message: LogoutMessage = {
    type: "logout",
  };
  postUIMessage(message, options);
};

export const postAuthStatusRequest = (options?: WindowPostMessageOptions) => {
  const message: Message = {
    type: "auth-status-request",
  };
  postUIMessage(message, options);
};
