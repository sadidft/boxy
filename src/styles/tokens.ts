// GENERATED FILE. Do not edit. Source: brand/tokens.json (npm run brand).
export const themeNames = ["dark","light","hc"] as const;
export type ThemeName = (typeof themeNames)[number];
export const labelColors = ["mint","cyan","violet","pink","salmon","amber","lime","slate"] as const;
export type LabelColor = (typeof labelColors)[number];
export const labelHex: Record<LabelColor, string> = {
  "mint": "#5ddfa8",
  "cyan": "#00dbf1",
  "violet": "#cdaeff",
  "pink": "#ff9ddb",
  "salmon": "#ff9d90",
  "amber": "#f9b350",
  "lime": "#bbce5e",
  "slate": "#8fa3b8"
};
export const themeColors = {
  "dark": {
    "bg": "#0a1628",
    "accent": "#00e5a0",
    "text": "#e0e6ed"
  },
  "light": {
    "bg": "#f4f7f9",
    "accent": "#007a56",
    "text": "#0a1628"
  },
  "hc": {
    "bg": "#000000",
    "accent": "#33ebb3",
    "text": "#ffffff"
  }
} as const;
export const logoFills = ["#00E5A0","#00E49F","#00E4A0","#01E39F","#00E39E","#00E29E"] as const;
