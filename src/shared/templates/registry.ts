import type { PricingRule, PricingType, SelectionType, Template } from "../../types";

export type CardStyle = "compact" | "tall";
export type PublicLayout = "grid" | "subcategory-sections";

export interface PresetOptionItem {
  name: string;
  priceDelta: number;
  isDefault?: boolean;
}

export interface PresetOptionGroup {
  name: string;
  selectionType: SelectionType;
  pricingRule: PricingRule;
  required: boolean;
  maxSelections?: number;
  items: PresetOptionItem[];
}

export interface ProductPreset {
  key: string;
  label: string;
  description: string;
  allowsNotes: boolean;
  groups: PresetOptionGroup[];
}

export interface TemplateDef {
  id: Template;
  label: string;
  description: string;
  defaults: {
    primaryColor: string;
    accentColor: string;
    surfaceColor: string;
  };
  displayFont: string;
  cardStyle: CardStyle;
  publicLayout: PublicLayout;
  productDefaults: {
    pricingType: PricingType;
    minQuantity: number;
    stepQuantity: number;
    allowsNotes: boolean;
  };
  productPresets: ProductPreset[];
}

const INTER = "Inter, ui-sans-serif, system-ui, sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export const TEMPLATES: Record<Template, TemplateDef> = {
  SALGADERIA: {
    id: "SALGADERIA",
    label: "Salgaderia",
    description: "Salgados, festas, encomenda por cento. Visual laranja, vibrante.",
    defaults: {
      primaryColor: "#f97316",
      accentColor: "#16a34a",
      surfaceColor: "#f6f6f0"
    },
    displayFont: INTER,
    cardStyle: "compact",
    publicLayout: "grid",
    productDefaults: {
      pricingType: "HUNDRED",
      minQuantity: 25,
      stepQuantity: 25,
      allowsNotes: false
    },
    productPresets: []
  },
  DOCERIA: {
    id: "DOCERIA",
    label: "Doceria",
    description: "Brigadeiros, doces finos, encomenda por cento. Visual rosa, delicado.",
    defaults: {
      primaryColor: "#db2777",
      accentColor: "#be185d",
      surfaceColor: "#fdf2f8"
    },
    displayFont: PLAYFAIR,
    cardStyle: "tall",
    publicLayout: "subcategory-sections",
    productDefaults: {
      pricingType: "HUNDRED",
      minQuantity: 25,
      stepQuantity: 25,
      allowsNotes: false
    },
    productPresets: [
      {
        key: "brigadeiro",
        label: "Brigadeiro / doce de festa",
        description: "Cento, com opções de formato",
        allowsNotes: false,
        groups: [
          {
            name: "Formato",
            selectionType: "MULTIPLE",
            pricingRule: "SUM",
            required: false,
            items: [
              { name: "Tradicional", priceDelta: 0, isDefault: true },
              { name: "Coração", priceDelta: 0.5 },
              { name: "Flor", priceDelta: 0.5 }
            ]
          }
        ]
      },
      {
        key: "doce-especial",
        label: "Doce especial / gourmet",
        description: "Doce com cobertura ou adicional",
        allowsNotes: true,
        groups: [
          {
            name: "Adicionais",
            selectionType: "MULTIPLE",
            pricingRule: "SUM",
            required: false,
            items: [
              { name: "Coco", priceDelta: 2 },
              { name: "Castanha", priceDelta: 3 },
              { name: "Pistache", priceDelta: 4 }
            ]
          }
        ]
      }
    ]
  },
  BOLARIA: {
    id: "BOLARIA",
    label: "Bolaria / Confeitaria",
    description: "Bolos, tortas, sobremesas. Visual marrom artesanal.",
    defaults: {
      primaryColor: "#714d3b",
      accentColor: "#a57d65",
      surfaceColor: "#fcf9f5"
    },
    displayFont: PLAYFAIR,
    cardStyle: "tall",
    publicLayout: "subcategory-sections",
    productDefaults: {
      pricingType: "UNIT",
      minQuantity: 1,
      stepQuantity: 1,
      allowsNotes: true
    },
    productPresets: [
      {
        key: "bolo",
        label: "Bolo (P / M / G)",
        description: "Bolo com 3 tamanhos e cobertura opcional",
        allowsNotes: true,
        groups: [
          {
            name: "Tamanho",
            selectionType: "SINGLE",
            pricingRule: "REPLACE",
            required: true,
            items: [
              { name: "P (até 15 fatias)", priceDelta: 60 },
              { name: "M (até 25 fatias)", priceDelta: 90, isDefault: true },
              { name: "G (até 40 fatias)", priceDelta: 130 }
            ]
          },
          {
            name: "Cobertura",
            selectionType: "SINGLE",
            pricingRule: "SUM",
            required: false,
            items: [
              { name: "Sem cobertura", priceDelta: 0, isDefault: true },
              { name: "Chantilly", priceDelta: 15 },
              { name: "Brigadeiro", priceDelta: 15 },
              { name: "Ganache", priceDelta: 20 }
            ]
          }
        ]
      },
      {
        key: "torta",
        label: "Torta gelada",
        description: "Torta com tamanho fixo, opcional finalização",
        allowsNotes: true,
        groups: [
          {
            name: "Tamanho",
            selectionType: "SINGLE",
            pricingRule: "REPLACE",
            required: true,
            items: [
              { name: "P (15cm)", priceDelta: 80 },
              { name: "M (20cm)", priceDelta: 120, isDefault: true },
              { name: "G (25cm)", priceDelta: 160 }
            ]
          }
        ]
      }
    ]
  },
  PIZZARIA: {
    id: "PIZZARIA",
    label: "Pizzaria",
    description: "Pizza, borda, meio-a-meio. Visual vermelho intenso.",
    defaults: {
      primaryColor: "#dc2626",
      accentColor: "#f59e0b",
      surfaceColor: "#fef2f2"
    },
    displayFont: INTER,
    cardStyle: "compact",
    publicLayout: "grid",
    productDefaults: {
      pricingType: "UNIT",
      minQuantity: 1,
      stepQuantity: 1,
      allowsNotes: true
    },
    productPresets: [
      {
        key: "pizza",
        label: "Pizza tamanho + borda",
        description: "Pizza tradicional com tamanho, borda e adicionais",
        allowsNotes: true,
        groups: [
          {
            name: "Tamanho",
            selectionType: "SINGLE",
            pricingRule: "REPLACE",
            required: true,
            items: [
              { name: "Pequena (4 fatias)", priceDelta: 30 },
              { name: "Grande (8 fatias)", priceDelta: 55, isDefault: true },
              { name: "Família (12 fatias)", priceDelta: 75 }
            ]
          },
          {
            name: "Borda",
            selectionType: "SINGLE",
            pricingRule: "SUM",
            required: false,
            items: [
              { name: "Sem borda recheada", priceDelta: 0, isDefault: true },
              { name: "Catupiry", priceDelta: 8 },
              { name: "Cheddar", priceDelta: 10 }
            ]
          },
          {
            name: "Adicionais",
            selectionType: "MULTIPLE",
            pricingRule: "SUM",
            required: false,
            items: [
              { name: "Calabresa extra", priceDelta: 5 },
              { name: "Queijo extra", priceDelta: 6 },
              { name: "Bacon", priceDelta: 7 }
            ]
          }
        ]
      }
    ]
  }
};

export const TEMPLATE_LIST: TemplateDef[] = Object.values(TEMPLATES);

export const resolveTheme = (input: {
  template?: Template;
  primaryColor?: string | null;
  accentColor?: string | null;
  surfaceColor?: string | null;
}) => {
  const template = TEMPLATES[input.template || "SALGADERIA"];
  return {
    primary: input.primaryColor || template.defaults.primaryColor,
    accent: input.accentColor || template.defaults.accentColor,
    surface: input.surfaceColor || template.defaults.surfaceColor,
    displayFont: template.displayFont,
    cardStyle: template.cardStyle,
    publicLayout: template.publicLayout
  };
};
