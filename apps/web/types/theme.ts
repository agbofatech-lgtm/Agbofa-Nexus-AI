export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = Exclude<Theme, "system">;

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}
