import { createContext, useContext, type ReactNode } from "react";
import { TEMPLATES, type CardStyle, type PublicLayout } from "../shared/templates/registry";
import type { Template } from "../types";

interface TemplateContextValue {
  template: Template;
  cardStyle: CardStyle;
  publicLayout: PublicLayout;
}

const TemplateCtx = createContext<TemplateContextValue>({
  template: "SALGADERIA",
  cardStyle: "compact",
  publicLayout: "grid"
});

export function TemplateProvider({
  template,
  children
}: {
  template: Template;
  children: ReactNode;
}) {
  const def = TEMPLATES[template];
  return (
    <TemplateCtx.Provider
      value={{ template, cardStyle: def.cardStyle, publicLayout: def.publicLayout }}
    >
      {children}
    </TemplateCtx.Provider>
  );
}

export const useTemplate = () => useContext(TemplateCtx);
