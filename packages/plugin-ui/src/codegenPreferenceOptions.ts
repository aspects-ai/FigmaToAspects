import { LocalCodegenPreferenceOptions, SelectPreferenceOptions } from "types";

export const preferenceOptions: LocalCodegenPreferenceOptions[] = [
  {
    itemType: "individual_select",
    propertyName: "useColorVariables",
    label: "Color Variables",
    description:
      "Export code using Figma variables as colors.",
    isDefault: true,
    includedLanguages: ["HTML"],
  },
  {
    itemType: "individual_select",
    propertyName: "embedVectors",
    label: "Embed Vectors",
    description:
      "Enable this to convert vector shapes to SVGs and embed them in the design. This can be a slow operation. If unchecked, shapes will be converted into rectangles.",
    isDefault: true,
    includedLanguages: ["HTML"],
  },
  {
    itemType: "individual_select",
    propertyName: "embedImages",
    label: "Embed Images",
    description:
      "Enable this to embed images directly in the code. If unchecked, image placeholders will be used instead.",
    isDefault: true,
    includedLanguages: ["HTML"],
  },
  {
    itemType: "individual_select",
    propertyName: "showLayerNames",
    label: "Layer names",
    description: "Include Figma layer names in classes.",
    isDefault: false,
    includedLanguages: ["HTML"],
  },
];

export const selectPreferenceOptions: SelectPreferenceOptions[] = [];
