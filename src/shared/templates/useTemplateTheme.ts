import { useEffect } from "react";
import type { Template } from "../../types";
import { resolveTheme } from "./registry";

export function useTemplateTheme(input: {
  template?: Template;
  primaryColor?: string | null;
  accentColor?: string | null;
  surfaceColor?: string | null;
} | null) {
  useEffect(() => {
    const root = document.documentElement;

    if (!input) {
      root.removeAttribute("data-template");
      root.style.removeProperty("--color-primary");
      root.style.removeProperty("--color-accent");
      root.style.removeProperty("--color-surface");
      root.style.removeProperty("--font-display");
      return;
    }

    const theme = resolveTheme(input);
    root.dataset.template = input.template || "SALGADERIA";
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-accent", theme.accent);
    root.style.setProperty("--color-surface", theme.surface);
    root.style.setProperty("--font-display", theme.displayFont);
  }, [input?.template, input?.primaryColor, input?.accentColor, input?.surfaceColor]);
}
