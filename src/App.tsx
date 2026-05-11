import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Info,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  X
} from "lucide-react";
import { AdminApp } from "./admin/AdminApp";
import { LandingPage } from "./landing/LandingPage";
import { FullScreenLoading } from "./shared/components/FullScreenLoading";
import { Panel } from "./shared/components/Panel";
import { currency, includesSearchTerm, normalizeSearchText } from "./shared/utils/currency";
import { getTenantFromLocation, isPanelHost } from "./shared/utils/hostname";
import { ProductModal, type ProductModalProduct } from "./public-menu/ProductModal";
import { calculateUnitPrice, serializeSelections } from "./public-menu/pricing";
import { TemplateProvider, useTemplate } from "./public-menu/TemplateContext";
import { useTemplateTheme } from "./shared/templates/useTemplateTheme";
import type { PricingType, ProductOptionGroup, Template } from "./types";

type PublicMenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pricingType: PricingType;
  minQuantity: number | null;
  stepQuantity: number;
  imageUrl: string | null;
  allowsNotes: boolean;
  optionGroups: ProductOptionGroup[];
};

type CartLine = {
  cartId: string;
  product: PublicMenuProduct;
  unitPrice: number;
  quantity: number;
  selectedOptions: Array<{ groupId: string; groupName: string; itemIds: string[]; itemNames: string[] }>;
  notes: string;
};

const hasOptionsOrNotes = (product: PublicMenuProduct) =>
  (product.optionGroups && product.optionGroups.length > 0) || product.allowsNotes;

const getPricingLabel = (pricingType: PricingType) => {
  if (pricingType === "HUNDRED") return "cento";
  if (pricingType === "KG") return "kg";
  return "unidade";
};

const getProductMinimum = (product: PublicMenuProduct) =>
  product.minQuantity || (product.pricingType === "HUNDRED" ? 25 : 1);

const getProductStep = (product: PublicMenuProduct) =>
  product.stepQuantity || (product.pricingType === "HUNDRED" ? 25 : 1);

const normalizeQuantity = (value: number, product: PublicMenuProduct) => {
  const precision = product.pricingType === "KG" ? 3 : 0;
  return Number(Math.max(0, value).toFixed(precision));
};

const validatePublicQuantity = (product: PublicMenuProduct, quantity: number) => {
  if (quantity <= 0) return "A quantidade deve ser maior que zero.";

  const minimum = getProductMinimum(product);
  const step = getProductStep(product);
  if (quantity < minimum) {
    return product.pricingType === "KG"
      ? `O pedido mínimo é de ${minimum} kg.`
      : `O pedido mínimo é de ${minimum} unidade${minimum === 1 ? "" : "s"}.`;
  }

  const aboveMinimum = quantity - minimum;
  const remainder = aboveMinimum % step;
  const validStep = Math.abs(remainder) < 1e-9 || Math.abs(remainder - step) < 1e-9;
  if (!validStep) {
    return product.pricingType === "KG"
      ? `O incremento deve ser de ${step} kg.`
      : `O incremento deve ser de ${step} unidade${step === 1 ? "" : "s"}.`;
  }

  return null;
};

const changeQuantityByStep = (current: number, direction: 1 | -1, product: PublicMenuProduct) => {
  const minimum = getProductMinimum(product);
  const step = getProductStep(product);

  if (direction > 0) {
    return normalizeQuantity(current <= 0 ? minimum : current + step, product);
  }

  if (current <= minimum) {
    return 0;
  }

  return normalizeQuantity(Math.max(minimum, current - step), product);
};

function App() {
  const tenant = getTenantFromLocation();

  if (tenant) {
    return <PublicMenu tenant={tenant} />;
  }

  if (!isPanelHost()) {
    return <LandingPage />;
  }

  return <AdminApp />;
}

function PublicMenu({ tenant }: { tenant: string }) {
  const [menu, setMenu] = useState<{
    establishment: {
      name: string;
      subdomain: string;
      whatsappPhone: string;
      address: string | null;
      logoUrl: string | null;
      bannerUrl: string | null;
      template: Template;
      primaryColor: string;
      accentColor: string | null;
      surfaceColor: string | null;
      deliveryFee: number;
      minimumOrder: number;
    };
    categories: Array<{
      id: string;
      name: string;
      products: PublicMenuProduct[];
    }>;
  } | null>(null);

  useTemplateTheme(
    menu
      ? {
          template: menu.establishment.template,
          primaryColor: menu.establishment.primaryColor,
          accentColor: menu.establishment.accentColor,
          surfaceColor: menu.establishment.surfaceColor
        }
      : null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<PublicMenuProduct | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3333"}/api/public/menu/${tenant}`)
      .then((response) => {
        if (!response.ok) throw new Error("menu_not_found");
        return response.json();
      })
      .then(setMenu)
      .catch(() => setError("Cardápio não encontrado."))
      .finally(() => setLoading(false));
  }, [tenant]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3333"}/api/public/menu/${tenant}/visit`, {
      method: "POST"
    }).catch(() => undefined);
  }, [tenant]);

  useEffect(() => {
    if (!menu) return;

    const title = `${menu.establishment.name} | Cardápio online`;
    const description = `Cardápio online de ${menu.establishment.name}. Escolha seus produtos e envie o pedido pelo WhatsApp.`;
    document.title = title;

    const setMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.head.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(property ? "property" : "name", name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    if (menu.establishment.bannerUrl || menu.establishment.logoUrl) {
      setMeta("og:image", menu.establishment.bannerUrl || menu.establishment.logoUrl || "", true);
    }
  }, [menu]);

  const normalizedSearchTerm = normalizeSearchText(searchTerm);

  const filteredCategories =
    menu?.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => {
          if (!normalizedSearchTerm) return true;
          return (
            includesSearchTerm(product.name, normalizedSearchTerm) ||
            includesSearchTerm(product.description, normalizedSearchTerm) ||
            includesSearchTerm(category.name, normalizedSearchTerm)
          );
        })
      }))
      .filter((category) => category.products.length > 0) || [];

  const lineTotal = (line: CartLine) => {
    if (line.product.pricingType === "HUNDRED") {
      return (line.unitPrice / 100) * line.quantity;
    }
    return line.unitPrice * line.quantity;
  };

  const total = cart.reduce((sum, line) => sum + lineTotal(line), 0);
  const cartCount = cart.length;

  const cartQuantityForProduct = (productId: string) =>
    cart.filter((line) => line.product.id === productId).reduce((sum, line) => sum + line.quantity, 0);

  const addQuickItem = (product: PublicMenuProduct, quantity: number) => {
    setCart((current) => [
      ...current,
      {
        cartId: crypto.randomUUID(),
        product,
        unitPrice: product.price,
        quantity,
        selectedOptions: [],
        notes: ""
      }
    ]);
  };

  const addModalItem = (
    product: PublicMenuProduct,
    submission: { selectedOptions: Record<string, string[]>; quantity: number; notes: string }
  ) => {
    const unitPrice = calculateUnitPrice(product, submission.selectedOptions);
    const serialized = serializeSelections(product.optionGroups, submission.selectedOptions);
    setCart((current) => [
      ...current,
      {
        cartId: crypto.randomUUID(),
        product,
        unitPrice,
        quantity: submission.quantity,
        selectedOptions: serialized,
        notes: submission.notes
      }
    ]);
    setModalProduct(null);
  };

  const removeCartLine = (cartId: string) => {
    setCart((current) => current.filter((line) => line.cartId !== cartId));
  };

  const adjustCartLine = (cartId: string, direction: 1 | -1) => {
    setCart((current) =>
      current
        .map((line) => {
          if (line.cartId !== cartId) return line;
          const nextQuantity = changeQuantityByStep(line.quantity, direction, line.product);
          return { ...line, quantity: nextQuantity };
        })
        .filter((line) => line.quantity > 0)
    );
  };

  const formatCartLineDetails = (line: CartLine): string[] => {
    const out: string[] = [];
    for (const sel of line.selectedOptions) {
      out.push(`  ${sel.groupName}: ${sel.itemNames.join(", ")}`);
    }
    if (line.notes) {
      out.push(`  Obs: ${line.notes}`);
    }
    return out;
  };

  const sendWhatsApp = () => {
    if (!menu || cart.length === 0) return;

    const lines: string[] = [
      `Ola! Gostaria de fazer um pedido em ${menu.establishment.name}:`,
      ""
    ];

    for (const line of cart) {
      lines.push(`${line.quantity}x ${line.product.name}`);
      lines.push(...formatCartLineDetails(line));
      lines.push(`  Subtotal: ${currency.format(lineTotal(line))}`);
    }

    lines.push("");
    lines.push(`Total: ${currency.format(total)}`);

    const message = encodeURIComponent(lines.join("\n"));
    const whatsappUrl = `https://wa.me/${menu.establishment.whatsappPhone}?text=${message}`;

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3333"}/api/public/menu/${tenant}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((line) => ({
          productId: line.product.id,
          name: line.product.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          selectedOptions: line.selectedOptions,
          notes: line.notes || undefined
        })),
        totalAmount: total,
        whatsappUrl
      })
    }).catch(() => undefined);

    window.open(whatsappUrl, "_blank");
  };

  useEffect(() => {
    const onScroll = () => {
      const categoryIds = filteredCategories.map((category) => category.id);
      let current: string | undefined;
      for (let index = categoryIds.length - 1; index >= 0; index -= 1) {
        const id = categoryIds[index];
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 160) {
          current = id;
          break;
        }
      }
      if (current) setActiveCategory(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [filteredCategories]);

  if (loading) return <FullScreenLoading label="Carregando cardápio" />;

  if (error || !menu) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f0] px-6">
        <Panel>
          <h1 className="text-xl font-semibold">Cardápio não encontrado</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </Panel>
      </main>
    );
  }

  const menuContent = (
    <main className="min-h-screen bg-surface pb-16 text-slate-700">
      <header className="sticky top-0 z-40 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-brand shadow-md">
                {menu.establishment.logoUrl ? (
                  <img src={menu.establishment.logoUrl} alt={`Logo ${menu.establishment.name}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <Store className="h-5 w-5" />
                  </div>
                )}
              </div>
              <h1 className="font-display text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
                {menu.establishment.name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-64 rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative rounded-full p-2 transition-colors hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                aria-label={`Ver carrinho com ${cartCount} itens`}
              >
                <ShoppingCart className="text-brand" size={28} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-600 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="pb-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm transition-colors focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="relative bg-slate-800 text-white">
        <img
          src={menu.establishment.bannerUrl || "https://placehold.co/1200x400/a57d65/FFFFFF?text=Banner+do+Cardapio"}
          alt={`Cardápio de ${menu.establishment.name}`}
          className="h-48 w-full object-cover opacity-30 md:h-64"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-shadow md:text-5xl">
            {menu.establishment.name}
          </h2>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
            {menu.establishment.address && (
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-slate-300" />
                <span className="font-medium">{menu.establishment.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Aberto Agora
            </div>
            <button className="flex items-center gap-2 rounded-full bg-slate-100/10 px-3 py-1 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-100/20">
              <Info size={16} />
              Mais informações
            </button>
          </div>
        </div>
      </section>

      <nav className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-5 overflow-x-auto whitespace-nowrap py-3 text-sm font-medium text-slate-600 sm:gap-8">
            {filteredCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className={`border-b-2 pb-2 transition-all duration-300 ${
                  activeCategory === category.id
                    ? "border-brand text-brand"
                    : "border-transparent hover:text-brand"
                }`}
              >
                {category.name} {searchTerm.trim() && `(${category.products.length})`}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <section>
        {menu.categories.length === 0 ? (
          <div className="container mx-auto px-4 py-10">
            <Panel>
              <p className="text-sm text-slate-500">Este cardápio ainda não possui produtos.</p>
            </Panel>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="container mx-auto px-4 py-16 text-center">
            <h3 className="text-xl font-semibold text-slate-800">Nenhum produto encontrado</h3>
            <p className="mt-2 text-slate-500">Tente buscar por outro nome ou categoria.</p>
          </div>
        ) : (
          <CategorySections
            categories={filteredCategories}
            cartQuantityForProduct={cartQuantityForProduct}
            addQuickItem={addQuickItem}
            setModalProduct={setModalProduct}
          />
        )}
      </section>

      <PublicCartDrawer
        isOpen={isCartOpen}
        close={() => setIsCartOpen(false)}
        cart={cart}
        total={total}
        lineTotal={lineTotal}
        adjustLine={adjustCartLine}
        removeLine={removeCartLine}
        clearCart={() => setCart([])}
        sendWhatsApp={sendWhatsApp}
      />

      {modalProduct && (
        <ProductModal
          product={modalProduct as ProductModalProduct}
          onClose={() => setModalProduct(null)}
          onAdd={(submission) => addModalItem(modalProduct, submission)}
        />
      )}

      <footer className="mt-16 bg-slate-800 py-8 text-slate-300">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} {menu.establishment.name}. Todos os direitos reservados.</p>
          <p className="mt-2 text-xs text-slate-400">Desenvolvido por UMenu</p>
        </div>
      </footer>
    </main>
  );

  return <TemplateProvider template={menu.establishment.template}>{menuContent}</TemplateProvider>;
}

function CategorySections({
  categories,
  cartQuantityForProduct,
  addQuickItem,
  setModalProduct
}: {
  categories: Array<{ id: string; name: string; products: PublicMenuProduct[] }>;
  cartQuantityForProduct: (productId: string) => number;
  addQuickItem: (product: PublicMenuProduct, quantity: number) => void;
  setModalProduct: (product: PublicMenuProduct) => void;
}) {
  const { publicLayout, cardStyle } = useTemplate();

  if (publicLayout === "subcategory-sections") {
    return (
      <>
        {categories.map((category) => (
          <section key={category.id} id={category.id} className="scroll-mt-24 py-12 md:py-16">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="mb-10 flex flex-col items-center text-center">
                <span className="h-px w-12 bg-brand" />
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {category.name}
                </h2>
                <p className="mt-2 text-sm text-slate-500">{category.products.length} {category.products.length === 1 ? "item" : "itens"}</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                {category.products.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={cartQuantityForProduct(product.id)}
                    addQuickItem={addQuickItem}
                    onChoose={hasOptionsOrNotes(product) ? () => setModalProduct(product) : undefined}
                    cardStyle={cardStyle}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}
      </>
    );
  }

  return (
    <>
      {categories.map((category) => (
        <section key={category.id} id={category.id} className="scroll-mt-24 py-8 md:py-10">
          <div className="container mx-auto px-4">
            <h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              {category.name}
            </h2>
            <div className="mb-8 h-1 w-20 bg-brand sm:mb-10 sm:w-24" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {category.products.map((product) => (
                <PublicProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={cartQuantityForProduct(product.id)}
                  addQuickItem={addQuickItem}
                  onChoose={hasOptionsOrNotes(product) ? () => setModalProduct(product) : undefined}
                  cardStyle={cardStyle}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

function PublicProductCard({
  product,
  quantityInCart,
  addQuickItem,
  onChoose,
  cardStyle = "compact"
}: {
  product: PublicMenuProduct;
  quantityInCart: number;
  addQuickItem: (product: PublicMenuProduct, quantity: number) => void;
  onChoose?: () => void;
  cardStyle?: "compact" | "tall";
}) {
  const [draftQuantity, setDraftQuantity] = useState(0);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const minimum = getProductMinimum(product);
  const step = getProductStep(product);

  const addToCart = () => {
    const validation = validatePublicQuantity(product, draftQuantity);
    if (validation) {
      setError(validation);
      return;
    }

    addQuickItem(product, draftQuantity);
    setDraftQuantity(0);
    setError("");
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const changeDraft = (direction: 1 | -1) => {
    setError("");
    setDraftQuantity((value) => changeQuantityByStep(value, direction, product));
  };

  const handleDraftInput = (value: string) => {
    setError("");
    setDraftQuantity(normalizeQuantity(Number(value), product));
  };

  const imageAspect = cardStyle === "tall" ? "sm:aspect-[4/5]" : "sm:aspect-square";

  return (
    <div className="relative flex flex-row overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:flex-col">
      <div className="relative w-1/3 flex-shrink-0 bg-slate-100 sm:w-full">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={`h-full w-full object-cover ${imageAspect}`} />
        ) : (
          <div className={`flex h-full min-h-36 items-center justify-center text-slate-400 ${imageAspect}`}>
            <Package className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className={`text-base font-bold leading-tight tracking-tight text-slate-800 sm:text-lg ${cardStyle === "tall" ? "font-display" : ""}`}>
          {product.name}
        </h3>
        <p className="mt-1 hidden flex-grow text-xs text-slate-600 sm:block sm:text-sm">
          {product.description || "Produto do cardápio"}
        </p>

        <div className="mt-2 sm:mt-4">
          <p className="text-lg font-extrabold text-slate-900 sm:text-2xl">
            {currency.format(product.price)}
            <span className="ml-1.5 text-xs font-medium text-slate-500 sm:text-sm">
              / {getPricingLabel(product.pricingType)}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Mínimo {minimum}{product.pricingType === "KG" ? " kg" : " un."}
            {step !== minimum ? ` Incremento ${step}${product.pricingType === "KG" ? " kg" : " un."}` : ""}
          </p>
          {quantityInCart > 0 && (
            <p className="mt-1 text-xs font-medium text-green-700">No carrinho: {quantityInCart}</p>
          )}
        </div>

        <div className="mt-auto pt-2 sm:mt-6 sm:border-t sm:border-slate-100 sm:pt-4">
          {onChoose ? (
            <button
              onClick={onChoose}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-strong"
            >
              <ShoppingCart size={16} /> Personalizar
            </button>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => changeDraft(-1)}
                  className="rounded-full bg-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-300"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={14} />
                </button>

                <input
                  type="number"
                  value={draftQuantity}
                  min="0"
                  step={step}
                  onFocus={() => {
                    if (draftQuantity === 0) setDraftQuantity(minimum);
                  }}
                  onChange={(event) => handleDraftInput(event.target.value)}
                  className="w-16 rounded-lg border-2 border-slate-200 text-center text-base font-bold text-slate-800 transition focus:border-brand focus:ring-2 focus:ring-brand sm:w-20 sm:text-lg"
                  aria-label="Quantidade"
                />

                <button
                  onClick={() => changeDraft(1)}
                  className="rounded-full bg-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-300"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={14} />
                </button>
              </div>

              {error && <p className="mt-2 text-center text-xs font-medium text-red-600">{error}</p>}

              <button
                onClick={addToCart}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 disabled:bg-slate-300 disabled:text-slate-500 sm:mt-4 sm:py-3 ${
                  added ? "bg-green-600" : "bg-brand hover:bg-brand-strong"
                }`}
                disabled={draftQuantity <= 0 || added}
              >
                {added ? (
                  <>
                    <CheckCircle2 size={18} /> Adicionado!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} /> Adicionar
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PublicCartDrawer({
  isOpen,
  close,
  cart,
  total,
  lineTotal,
  adjustLine,
  removeLine,
  clearCart,
  sendWhatsApp
}: {
  isOpen: boolean;
  close: () => void;
  cart: CartLine[];
  total: number;
  lineTotal: (line: CartLine) => number;
  adjustLine: (cartId: string, direction: 1 | -1) => void;
  removeLine: (cartId: string) => void;
  clearCart: () => void;
  sendWhatsApp: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-colors duration-300 ${
        isOpen ? "bg-black/50" : "pointer-events-none bg-transparent"
      }`}
      onClick={close}
    >
      <div
        className={`fixed right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-xl font-bold text-slate-800">O seu Carrinho</h2>
          <button onClick={close} className="rounded-full p-2 hover:bg-slate-100" aria-label="Fechar carrinho">
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-grow flex-col items-center justify-center p-5 text-center">
            <ShoppingCart size={56} className="mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700">O seu carrinho está vazio</h3>
            <p className="mt-2 text-slate-500">Adicione produtos do cardápio para começar.</p>
          </div>
        ) : (
          <>
            <div className="flex-grow space-y-5 overflow-y-auto p-5">
              {cart.map((line) => (
                <div key={line.cartId} className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {line.product.imageUrl ? (
                      <img src={line.product.imageUrl} alt={line.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <h4 className="font-semibold text-slate-800">{line.product.name}</h4>
                    {line.selectedOptions.map((sel) => (
                      <p key={sel.groupId} className="mt-0.5 text-xs text-slate-500">
                        <span className="font-semibold">{sel.groupName}:</span> {sel.itemNames.join(", ")}
                      </p>
                    ))}
                    {line.notes && (
                      <p className="mt-0.5 text-xs italic text-slate-500">Obs: {line.notes}</p>
                    )}
                    <p className="mt-1 font-bold text-brand">{currency.format(lineTotal(line))}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {line.quantity} {line.product.pricingType === "KG" ? "kg" : "un."} · {currency.format(line.unitPrice)} / {getPricingLabel(line.product.pricingType)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => adjustLine(line.cartId, -1)}
                        className="rounded-full bg-slate-100 p-1 hover:bg-slate-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-bold text-slate-700">{line.quantity}</span>
                      <button
                        onClick={() => adjustLine(line.cartId, 1)}
                        className="rounded-full bg-slate-100 p-1 hover:bg-slate-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLine(line.cartId)}
                    className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remover ${line.product.name} do carrinho`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-medium text-slate-600">Total</span>
                <span className="text-2xl font-bold text-slate-900">{currency.format(total)}</span>
              </div>

              <button
                onClick={sendWhatsApp}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3.5 text-lg font-bold text-white transition-colors hover:bg-green-700"
              >
                Finalizar Pedido no WhatsApp
              </button>

              <button
                onClick={clearCart}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} /> Esvaziar Carrinho
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
