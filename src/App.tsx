import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  Upload,
  Wand2,
  X
} from "lucide-react";
import { api, ApiError } from "./api";
import type {
  Category,
  EstablishmentDetail,
  EstablishmentAnalytics,
  EstablishmentSummary,
  PricingType,
  Product,
  SessionUser
} from "./types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const normalizeSearchText = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const includesSearchTerm = (value: string | null | undefined, normalizedTerm: string) =>
  normalizeSearchText(value).includes(normalizedTerm);

type PublicMenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pricingType: PricingType;
  minQuantity: number | null;
  stepQuantity: number;
  imageUrl: string | null;
};

const publicUrlFor = (subdomain: string) => {
  if (window.location.hostname === "localhost" || window.location.hostname.startsWith("127.")) {
    return `${window.location.origin}?tenant=${subdomain}`;
  }

  const domain = getRootDomain(window.location.hostname);
  return `${window.location.protocol}//${subdomain}.${domain}`;
};

const getRootDomain = (hostname: string) => {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  if (hostname.endsWith(".com.br") && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
};

const getTenantFromLocation = () => {
  const queryTenant = new URLSearchParams(window.location.search).get("tenant");
  if (queryTenant) return queryTenant;

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname.startsWith("127.")) return null;

  const rootDomain = getRootDomain(hostname);
  if (hostname === rootDomain) return null;

  const subdomain = hostname.slice(0, -(rootDomain.length + 1)).split(".")[0];
  const reservedSubdomains = new Set(["app", "admin", "www"]);
  return subdomain && !reservedSubdomains.has(subdomain) ? subdomain : null;
};

const isPanelHost = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname.startsWith("127.")) return true;

  const rootDomain = getRootDomain(hostname);
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) return false;

  const subdomain = hostname.slice(0, -(rootDomain.length + 1)).split(".")[0];
  return subdomain === "app" || subdomain === "admin";
};

const panelUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname.startsWith("127.")) return window.location.origin;

  const rootDomain = getRootDomain(hostname);
  return `${window.location.protocol}//app.${rootDomain}`;
};

const emptyProduct = {
  name: "",
  description: "",
  price: "0",
  pricingType: "UNIT" as PricingType,
  minQuantity: "1",
  stepQuantity: "1",
  imageUrl: "",
  categoryId: ""
};

const getPricingLabel = (pricingType: PricingType) => {
  if (pricingType === "HUNDRED") return "cento";
  if (pricingType === "KG") return "kg";
  return "unidade";
};

const getProductMinimum = (product: PublicMenuProduct) => product.minQuantity || (product.pricingType === "HUNDRED" ? 25 : 1);

const getProductStep = (product: PublicMenuProduct) => product.stepQuantity || (product.pricingType === "HUNDRED" ? 25 : 1);

const normalizeQuantity = (value: number, product: PublicMenuProduct) => {
  const precision = product.pricingType === "KG" ? 3 : 0;
  return Number(Math.max(0, value).toFixed(precision));
};

const calculateLineTotal = (product: Pick<PublicMenuProduct, "price" | "pricingType">, quantity: number) => {
  if (product.pricingType === "HUNDRED") {
    return (product.price / 100) * quantity;
  }

  return product.price * quantity;
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
  const [token, setToken] = useState(() => window.localStorage.getItem("umenu_token"));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));

  if (tenant) {
    return <PublicMenu tenant={tenant} />;
  }

  if (!isPanelHost()) {
    return <LandingPage />;
  }

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }

    api
      .me()
      .then((response) => setUser(response.user))
      .catch(() => {
        window.localStorage.removeItem("umenu_token");
        setToken(null);
      })
      .finally(() => setAuthLoading(false));
  }, [token]);

  const handleLogin = (nextToken: string, nextUser: SessionUser) => {
    window.localStorage.setItem("umenu_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("umenu_token");
    setToken(null);
    setUser(null);
  };

  if (authLoading) {
    return <FullScreenLoading label="Verificando sessão" />;
  }

  if (!token || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <AdminApp user={user} onLogout={handleLogout} />;
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
      deliveryFee: number;
      minimumOrder: number;
    };
    categories: Array<{
      id: string;
      name: string;
      products: PublicMenuProduct[];
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  const products = menu?.categories.flatMap((category) => category.products) || [];
  const selectedItems = products
    .map((product) => ({ product, quantity: cart[product.id] || 0 }))
    .filter((item) => item.quantity > 0);
  const total = selectedItems.reduce((sum, item) => sum + calculateLineTotal(item.product, item.quantity), 0);

  const addQuantity = (product: PublicMenuProduct, quantity: number) => {
    setCart((current) => ({
      ...current,
      [product.id]: normalizeQuantity((current[product.id] || 0) + quantity, product)
    }));
  };

  const setProductQuantity = (product: PublicMenuProduct, quantity: number) => {
    setCart((current) => ({
      ...current,
      [product.id]: normalizeQuantity(quantity, product)
    }));
  };

  const adjustCartQuantity = (product: PublicMenuProduct, direction: 1 | -1) => {
    setCart((current) => ({
      ...current,
      [product.id]: changeQuantityByStep(current[product.id] || 0, direction, product)
    }));
  };

  const sendWhatsApp = () => {
    if (!menu || selectedItems.length === 0) return;

    const lines = [
      `Ola! Gostaria de fazer um pedido em ${menu.establishment.name}:`,
      "",
      ...selectedItems.flatMap((item) => [
        `${item.quantity}x ${item.product.name}`,
        `Subtotal: ${currency.format(calculateLineTotal(item.product, item.quantity))}`
      ]),
      "",
      `Total: ${currency.format(total)}`
    ];

    const message = encodeURIComponent(lines.join("\n"));
    const whatsappUrl = `https://wa.me/${menu.establishment.whatsappPhone}?text=${message}`;

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3333"}/api/public/menu/${tenant}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: selectedItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price
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

  return (
    <main className="min-h-screen bg-slate-50 pb-16 text-slate-700">
      <header className="sticky top-0 z-40 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-orange-500 shadow-md">
                {menu.establishment.logoUrl ? (
                  <img src={menu.establishment.logoUrl} alt={`Logo ${menu.establishment.name}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <Store className="h-5 w-5" />
                  </div>
                )}
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 sm:text-xl">
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
                  className="w-64 rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative rounded-full p-2 transition-colors hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                aria-label={`Ver carrinho com ${selectedItems.length} itens`}
              >
                <ShoppingCart className="text-orange-600" size={28} />
                {selectedItems.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-600 text-xs font-bold text-white">
                    {selectedItems.length}
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
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
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
          <h2 className="text-3xl font-extrabold tracking-tight text-shadow md:text-5xl">
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
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent hover:text-orange-500"
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
          filteredCategories.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-24 py-8 md:py-10">
              <div className="container mx-auto px-4">
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                  {category.name}
                </h2>
                <div className="mb-8 h-1 w-20 bg-orange-500 sm:mb-10 sm:w-24" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {category.products.map((product) => (
                    <PublicProductCard
                      key={product.id}
                      product={product}
                      quantity={cart[product.id] || 0}
                      addQuantity={addQuantity}
                    />
                  ))}
                </div>
              </div>
            </section>
          ))
        )}
      </section>

      <PublicCartDrawer
        isOpen={isCartOpen}
        close={() => setIsCartOpen(false)}
        selectedItems={selectedItems}
        total={total}
        adjustQuantity={adjustCartQuantity}
        setQuantity={setProductQuantity}
        clearCart={() => setCart({})}
        sendWhatsApp={sendWhatsApp}
      />

      <footer className="mt-16 bg-slate-800 py-8 text-slate-300">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} {menu.establishment.name}. Todos os direitos reservados.</p>
          <p className="mt-2 text-xs text-slate-400">Desenvolvido por UMenu</p>
        </div>
      </footer>
    </main>
  );
}

function PublicProductCard({
  product,
  quantity,
  addQuantity
}: {
  product: PublicMenuProduct;
  quantity: number;
  addQuantity: (product: PublicMenuProduct, quantity: number) => void;
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

    addQuantity(product, draftQuantity);
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

  return (
    <div className="relative flex flex-row overflow-hidden rounded-xl bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:flex-col">
      <div className="relative w-1/3 flex-shrink-0 bg-slate-100 sm:w-full">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover sm:aspect-square" />
        ) : (
          <div className="flex h-full min-h-36 items-center justify-center text-slate-400 sm:aspect-square">
            <Package className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-bold leading-tight tracking-tight text-slate-800 sm:text-lg">
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
          {quantity > 0 && (
            <p className="mt-1 text-xs font-medium text-green-700">No carrinho: {quantity}</p>
          )}
        </div>

        <div className="mt-auto pt-2 sm:mt-6 sm:border-t sm:border-slate-100 sm:pt-4">
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
              className="w-16 rounded-lg border-2 border-slate-200 text-center text-base font-bold text-slate-800 transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:w-20 sm:text-lg"
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
              added ? "bg-green-600" : "bg-orange-500 hover:bg-orange-600"
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
        </div>
      </div>
    </div>
  );
}

function PublicCartDrawer({
  isOpen,
  close,
  selectedItems,
  total,
  adjustQuantity,
  setQuantity,
  clearCart,
  sendWhatsApp
}: {
  isOpen: boolean;
  close: () => void;
  selectedItems: Array<{
    product: PublicMenuProduct;
    quantity: number;
  }>;
  total: number;
  adjustQuantity: (product: PublicMenuProduct, direction: 1 | -1) => void;
  setQuantity: (product: PublicMenuProduct, quantity: number) => void;
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

        {selectedItems.length === 0 ? (
          <div className="flex flex-grow flex-col items-center justify-center p-5 text-center">
            <ShoppingCart size={56} className="mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700">O seu carrinho está vazio</h3>
            <p className="mt-2 text-slate-500">Adicione produtos do cardápio para começar.</p>
          </div>
        ) : (
          <>
            <div className="flex-grow space-y-5 overflow-y-auto p-5">
              {selectedItems.map((item) => (
                <div key={item.product.id} className="flex items-start gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-lg bg-slate-100">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-slate-800">{item.product.name}</h4>
                    <p className="mt-1 font-bold text-orange-600">
                      {currency.format(calculateLineTotal(item.product, item.quantity))}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.quantity} {item.product.pricingType === "KG" ? "kg" : "un."} - {currency.format(item.product.price)} / {getPricingLabel(item.product.pricingType)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => adjustQuantity(item.product, -1)}
                        className="rounded-full bg-slate-100 p-1 hover:bg-slate-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-bold text-slate-700">{item.quantity}</span>
                      <button
                        onClick={() => adjustQuantity(item.product, 1)}
                        className="rounded-full bg-slate-100 p-1 hover:bg-slate-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuantity(item.product, 0)}
                    className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remover ${item.product.name} do carrinho`}
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

function LandingPage() {
  const dashboardUrl = panelUrl();
  const demoUrl = `${window.location.origin}/?tenant=feitoemcasa`;

  const features = [
    {
      icon: <Store className="h-5 w-5" />,
      title: "Cardápio por subdomínio",
      description: "Cada cliente ganha um endereço próprio, como feitoemcasa.umenu.com.br."
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Pedido direto no WhatsApp",
      description: "O cliente monta o carrinho e envia uma mensagem pronta para o estabelecimento."
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Painel simples",
      description: "Cadastre estabelecimentos, categorias, produtos, preços, fotos e disponibilidade."
    }
  ];

  return (
    <main className="min-h-screen bg-[#f7f7f1] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7f7f1]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="UMenu">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">UMenu</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#produto" className="transition hover:text-slate-950">Produto</a>
            <a href="#operacao" className="transition hover:text-slate-950">Operação</a>
            <a href="#venda" className="transition hover:text-slate-950">Venda</a>
          </nav>
          <a
            href={dashboardUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Entrar no painel
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Cardápios digitais que vendem pelo WhatsApp
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
            O UMenu entrega uma vitrine online rápida para restaurantes, confeitarias e negócios locais, com gestão de produtos no painel e pedidos enviados direto para o WhatsApp.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={dashboardUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
            >
              Abrir painel
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={demoUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Ver cardápio exemplo
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-6">
            <LandingMetric value="5 min" label="para publicar" />
            <LandingMetric value="100%" label="responsivo" />
            <LandingMetric value="WhatsApp" label="como checkout" />
          </div>
        </div>

        <div id="produto" className="relative">
          <div className="absolute -left-6 top-10 hidden h-28 w-28 rounded-full bg-orange-200/70 blur-3xl lg:block" />
          <div className="absolute -right-8 bottom-8 hidden h-32 w-32 rounded-full bg-green-200/70 blur-3xl lg:block" />
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-950">Feito em Casa</p>
                <p className="text-xs text-slate-500">feitoemcasa.umenu.com.br</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Aberto agora</span>
            </div>
            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
              <aside className="border-b border-slate-200 bg-slate-950 p-5 text-white md:border-b-0 md:border-r">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600">
                  <Store className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-2xl font-black leading-tight">Cardápio pronto para receber pedidos</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">Categorias, produtos e valores aparecem em uma experiência simples para celular.</p>
              </aside>
              <div className="bg-slate-50 p-5">
                <div className="mb-4 flex gap-2 overflow-hidden">
                  {["Fritos", "Doces", "Bolos"].map((category, index) => (
                    <span
                      key={category}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${index === 0 ? "bg-orange-600 text-white" : "bg-white text-slate-600"}`}
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Pastel", "R$ 110,00 / cento", "bg-orange-100"],
                    ["Brigadeiro", "R$ 160,00 / cento", "bg-pink-100"],
                    ["Caseirinho", "R$ 90,00 / unidade", "bg-amber-100"],
                    ["Lasanha", "R$ 50,00 / kg", "bg-red-100"]
                  ].map(([name, price, bg]) => (
                    <div key={name} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className={`flex aspect-square items-center justify-center rounded-xl ${bg}`}>
                        <Package className="h-8 w-8 text-slate-700" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-950">{name}</p>
                      <p className="mt-1 text-xs font-semibold text-orange-700">{price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="operacao" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Uma operação enxuta para vender sem loja virtual complexa
            </h2>
            <p className="text-lg leading-8 text-slate-600">
              O sistema foi feito para negócios que já fecham pedidos por conversa, mas precisam de uma vitrine organizada, bonita e fácil de manter.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 bg-[#f7f7f1] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="venda" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Do anúncio ao pedido em poucos cliques
          </h2>
          <div className="mt-8 space-y-5">
            {[
              "Divulgue o link do estabelecimento em bio, tráfego pago ou QR Code.",
              "O cliente escolhe os produtos e monta o carrinho pelo celular.",
              "O pedido chega formatado no WhatsApp do negócio."
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <p className="text-base leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/50">
          <BarChart3 className="h-10 w-10 text-orange-400" />
          <p className="mt-8 text-3xl font-black leading-tight">Venda com uma estrutura leve, sem travar o atendimento no dia a dia.</p>
          <a
            href={dashboardUrl}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-50"
          >
            Acessar app.umenu.com.br
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  );
}

function LandingMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function FullScreenLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
        {label}
      </div>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (token: string, user: SessionUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login(email, password);
      onLogin(response.token, response.user);
    } catch (err) {
      setError(err instanceof ApiError ? "Credenciais inválidas." : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f7f2] text-slate-950 lg:grid-cols-[1fr_480px]">
      <section className="hidden flex-col justify-between border-r border-slate-200 bg-slate-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Store className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold">UMenu</span>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Painel operacional para cardápios digitais.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Controle estabelecimentos, produtos, preços e fotos em uma interface direta para operação diária.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
          <Metric label="URLs" value="Wildcard" />
          <Metric label="Pedidos" value="WhatsApp" />
          <Metric label="Banco" value="Postgres" />
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-white">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">UMenu Admin</h1>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Entrar no painel</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use suas credenciais da plataforma ou do estabelecimento.
          </p>

          <label className="mt-8 block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Senha
            <div className="mt-2 flex rounded-lg border border-slate-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200">
              <input
                className="min-w-0 flex-1 rounded-lg px-3 py-3 text-sm outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="px-3 text-slate-500 hover:text-slate-900"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function AdminApp({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [establishments, setEstablishments] = useState<EstablishmentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selected, setSelected] = useState<EstablishmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const loadEstablishments = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.listEstablishments();
      setEstablishments(list);
      setSelectedId((current) => current || list[0]?.id || "");
    } catch {
      setError("Não foi possível carregar os estabelecimentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadSelected = async (id: string) => {
    if (!id) {
      setSelected(null);
      return;
    }

    setDetailLoading(true);
    try {
      setSelected(await api.getEstablishment(id));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadSelected(selectedId);
  }, [selectedId]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    return establishments.filter((item) =>
      normalizeSearchText(`${item.name} ${item.subdomain}`).includes(normalizedQuery)
    );
  }, [establishments, query]);

  const isPlatformAdmin = user.role === "PLATFORM_ADMIN";
  const roleLabel = isPlatformAdmin ? "Admin da plataforma" : "Admin do estabelecimento";
  const goToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const navItems = [
    { id: "overview", label: "Visão geral", icon: <LayoutDashboard /> },
    {
      id: "establishments",
      label: isPlatformAdmin ? "Estabelecimentos" : "Meu estabelecimento",
      icon: <Store />
    },
    { id: "products", label: "Produtos", icon: <Package /> },
    { id: "settings", label: "Configurações", icon: <Settings /> }
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f3ec] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950 p-4 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold leading-none">UMenu</p>
            <p className="mt-1 text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1 text-sm">
          <SidebarItem
            icon={<LayoutDashboard />}
            label="Visão geral"
            active={activeSection === "overview"}
            onClick={() => goToSection("overview")}
          />
          {isPlatformAdmin ? (
            <SidebarItem
              icon={<Store />}
              label="Estabelecimentos"
              active={activeSection === "establishments"}
              onClick={() => goToSection("establishments")}
            />
          ) : (
            <SidebarItem
              icon={<Store />}
              label="Meu estabelecimento"
              active={activeSection === "establishments"}
              onClick={() => goToSection("establishments")}
            />
          )}
          <SidebarItem
            icon={<Package />}
            label="Produtos"
            active={activeSection === "products"}
            onClick={() => goToSection("products")}
          />
          <SidebarItem
            icon={<Settings />}
            label="Configurações"
            active={activeSection === "settings"}
            onClick={() => goToSection("settings")}
          />
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="mt-1 text-xs text-slate-400">{user.email}</p>
          <p className="mt-2 inline-flex rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">
            {roleLabel}
          </p>
          <button
            className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <section className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f4f3ec]/95 px-3 py-3 backdrop-blur sm:px-4 lg:px-6">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold leading-none">UMenu</p>
                  <p className="mt-1 text-xs text-slate-500">{roleLabel}</p>
                </div>
              </div>
              <button
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm text-slate-500">Operação</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isPlatformAdmin ? "Admin de cardápios" : "Meu cardápio"}
              </h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 sm:w-72"
                  placeholder="Buscar estabelecimento"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium hover:bg-slate-50"
                onClick={loadEstablishments}
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          </div>
            <nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSection(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                    activeSection === item.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { className: "h-3.5 w-3.5" })}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1500px] gap-4 p-3 sm:p-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:p-6 xl:p-8">
          <section id="establishments" className="scroll-mt-24 space-y-4">
            {isPlatformAdmin && (
              <CreateEstablishmentCard onCreated={(id) => loadEstablishments().then(() => setSelectedId(id))} />
            )}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
              <div className="border-b border-slate-200 p-4">
                <h2 className="font-semibold">{isPlatformAdmin ? "Estabelecimentos" : "Acesso do tenant"}</h2>
                <p className="mt-1 text-sm text-slate-500">{filtered.length} registros</p>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando
                </div>
              ) : error ? (
                <p className="p-4 text-sm text-red-700">{error}</p>
              ) : (
                <div className="max-h-[560px] overflow-y-auto p-2">
                  {filtered.length === 0 && (
                    <p className="p-3 text-sm text-slate-500">
                      Nenhum estabelecimento vinculado a este usuário.
                    </p>
                  )}
                  {filtered.map((establishment) => (
                    <button
                      key={establishment.id}
                      className={`w-full rounded-lg p-3 text-left transition ${
                        selectedId === establishment.id
                          ? "bg-orange-50 text-orange-950 ring-1 ring-orange-200"
                          : "hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedId(establishment.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{establishment.name}</p>
                        <StatusPill status={establishment.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{establishment.subdomain}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0">
            {detailLoading ? (
              <Panel>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando detalhes
                </div>
              </Panel>
            ) : selected ? (
              <EstablishmentWorkspace
                establishment={selected}
                reload={() => loadSelected(selected.id)}
                canManageCredits={isPlatformAdmin}
              />
            ) : (
              <Panel>
                <p className="text-sm text-slate-500">Crie ou selecione um estabelecimento.</p>
              </Panel>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        active ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
      {status}
    </span>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5 ${className}`}>{children}</div>;
}

function CreateEstablishmentCard({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    subdomain: "",
    whatsappPhone: "",
    address: "",
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await api.createEstablishment({
        name: form.name,
        subdomain: form.subdomain,
        whatsappPhone: form.whatsappPhone,
        address: form.address || undefined,
        admin: {
          name: form.adminName,
          email: form.adminEmail,
          password: form.adminPassword
        }
      });
      setOpen(false);
      setForm({
        name: "",
        subdomain: "",
        whatsappPhone: "",
        address: "",
        adminName: "",
        adminEmail: "",
        adminPassword: ""
      });
      onCreated(response.establishment.id);
    } catch (err) {
      setError(err instanceof ApiError && err.message === "subdomain_unavailable" ? "URL indisponivel." : "Erro ao criar.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Novo estabelecimento
      </button>
    );
  }

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Novo estabelecimento</h2>
          <button type="button" className="text-sm text-slate-500" onClick={() => setOpen(false)}>
            Fechar
          </button>
        </div>
        <Input label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Input label="Subdomínio" value={form.subdomain} onChange={(value) => setForm({ ...form, subdomain: value })} required />
        <Input label="WhatsApp" value={form.whatsappPhone} onChange={(value) => setForm({ ...form, whatsappPhone: value })} required />
        <Input label="Endereço" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        <div className="grid gap-3 border-t border-slate-200 pt-3">
          <Input label="Admin nome" value={form.adminName} onChange={(value) => setForm({ ...form, adminName: value })} required />
          <Input label="Admin email" type="email" value={form.adminEmail} onChange={(value) => setForm({ ...form, adminEmail: value })} required />
          <Input label="Admin senha" type="password" value={form.adminPassword} onChange={(value) => setForm({ ...form, adminPassword: value })} required />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Criar
        </button>
      </form>
    </Panel>
  );
}

function EstablishmentWorkspace({
  establishment,
  reload,
  canManageCredits
}: {
  establishment: EstablishmentDetail;
  reload: () => Promise<void> | void;
  canManageCredits: boolean;
}) {
  const totalProducts = establishment.categories.reduce((sum, category) => sum + category.products.length, 0);
  const activeProducts = establishment.categories.reduce(
    (sum, category) => sum + category.products.filter((product) => product.isActive).length,
    0
  );
  const [analytics, setAnalytics] = useState<EstablishmentAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      setAnalytics(await api.getAnalytics(establishment.id));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [establishment.id]);

  return (
    <div className="min-w-0 space-y-5">
      <div id="overview" className="scroll-mt-24">
        <DashboardOverview
          analytics={analytics}
          loading={analyticsLoading}
          fallback={{
            totalProducts,
            activeProducts,
            categories: establishment.categories.length
          }}
          refresh={loadAnalytics}
        />
      </div>

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{establishment.name}</h2>
              <StatusPill status={establishment.status} />
            </div>
            <p className="mt-2 break-all text-sm text-slate-500">{publicUrlFor(establishment.subdomain)}</p>
          </div>
          <a
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            href={publicUrlFor(establishment.subdomain)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir cardápio
          </a>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryStat icon={<Tag />} label="Categorias" value={String(establishment.categories.length)} />
          <SummaryStat icon={<Package />} label="Produtos ativos" value={`${activeProducts}/${totalProducts}`} />
          <SummaryStat icon={<Store />} label="WhatsApp" value={establishment.whatsappPhone} />
        </div>
      </Panel>

      <AiCreditsPanel
        establishment={establishment}
        canManage={canManageCredits}
        reload={reload}
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div id="settings" className="scroll-mt-24">
          <SettingsPanel establishment={establishment} reload={reload} />
        </div>
        <div id="products" className="scroll-mt-24">
          <CatalogPanel establishment={establishment} reload={reload} />
        </div>
      </div>
    </div>
  );
}

function DashboardOverview({
  analytics,
  loading,
  fallback,
  refresh
}: {
  analytics: EstablishmentAnalytics | null;
  loading: boolean;
  fallback: { totalProducts: number; activeProducts: number; categories: number };
  refresh: () => void;
}) {
  const conversion = analytics ? `${Math.round(analytics.conversion7d * 100)}%` : "0%";

  return (
    <Panel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dashboard do restaurante</h2>
          <p className="mt-1 text-sm text-slate-500">Acessos, pedidos via WhatsApp e funil dos últimos 7 dias.</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar métricas
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryStat icon={<Eye />} label="Acessos 7 dias" value={String(analytics?.visits7d ?? 0)} />
        <SummaryStat icon={<ShoppingCart />} label="Pedidos 7 dias" value={String(analytics?.orders7d ?? 0)} />
        <SummaryStat icon={<BarChart3 />} label="Conversão" value={conversion} />
        <SummaryStat icon={<Tag />} label="Faturamento 7 dias" value={currency.format(analytics?.revenue7d ?? 0)} />
      </div>

      <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Funil de vendas</h3>
            <span className="text-xs text-slate-500">7 dias</span>
          </div>
          <FunnelRow label="Acessos ao cardápio" value={analytics?.visits7d ?? 0} max={Math.max(analytics?.visits7d ?? 1, 1)} />
          <FunnelRow label="Pedidos enviados" value={analytics?.orders7d ?? 0} max={Math.max(analytics?.visits7d ?? 1, 1)} />
          <FunnelRow label="Conversão (%)" value={Math.round((analytics?.conversion7d ?? 0) * 100)} max={100} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold">Operação</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Categorias</span>
              <strong>{analytics?.categoryCount ?? fallback.categories}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Produtos ativos</span>
              <strong>{analytics?.activeProductCount ?? fallback.activeProducts}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Produtos totais</span>
              <strong>{analytics?.productCount ?? fallback.totalProducts}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pedidos hoje</span>
              <strong>{analytics?.ordersToday ?? 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.max(4, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 text-orange-500">{React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}</div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold">{value}</p>
    </div>
  );
}

function AiCreditsPanel({
  establishment,
  canManage,
  reload
}: {
  establishment: EstablishmentDetail;
  canManage: boolean;
  reload: () => Promise<void> | void;
}) {
  const [credits, setCredits] = useState(String(establishment.aiImageCredits));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCredits(String(establishment.aiImageCredits));
  }, [establishment.aiImageCredits]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.setAiCredits(establishment.id, Number(credits));
      setMessage("Créditos atualizados.");
      await reload();
    } catch {
      setMessage("Não foi possível atualizar os créditos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-semibold">Créditos de imagem com IA</h3>
          <p className="mt-1 text-sm text-slate-500">
            Cada melhoria de foto consome 1 crédito do estabelecimento.
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-orange-700">Saldo atual</p>
          <p className="text-2xl font-semibold text-orange-950">{establishment.aiImageCredits}</p>
        </div>
      </div>

      {canManage && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,280px)_auto] sm:items-end">
          <Input label="Definir saldo" type="number" value={credits} onChange={setCredits} />
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar créditos
          </button>
          {message && <p className="text-sm text-slate-500 sm:col-span-2">{message}</p>}
        </form>
      )}
    </Panel>
  );
}

function SettingsPanel({ establishment, reload }: { establishment: EstablishmentDetail; reload: () => Promise<void> | void }) {
  const [form, setForm] = useState({
    name: establishment.name,
    whatsappPhone: establishment.whatsappPhone,
    address: establishment.address || "",
    logoUrl: establishment.logoUrl || "",
    bannerUrl: establishment.bannerUrl || "",
    primaryColor: establishment.primaryColor,
    deliveryFee: String(establishment.deliveryFee),
    minimumOrder: String(establishment.minimumOrder)
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: establishment.name,
      whatsappPhone: establishment.whatsappPhone,
      address: establishment.address || "",
      logoUrl: establishment.logoUrl || "",
      bannerUrl: establishment.bannerUrl || "",
      primaryColor: establishment.primaryColor,
      deliveryFee: String(establishment.deliveryFee),
      minimumOrder: String(establishment.minimumOrder)
    });
  }, [establishment]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    await api.updateEstablishment(establishment.id, {
      ...form,
      address: form.address || null,
      logoUrl: form.logoUrl || null,
      bannerUrl: form.bannerUrl || null,
      deliveryFee: Number(form.deliveryFee),
      minimumOrder: Number(form.minimumOrder)
    });
    await reload();
    setSaved(true);
    setSaving(false);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-4">
        <h3 className="font-semibold">Configurações</h3>
        <Input label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Input label="WhatsApp" value={form.whatsappPhone} onChange={(value) => setForm({ ...form, whatsappPhone: value })} />
        <Input label="Endereço" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        <Input label="Logo URL" value={form.logoUrl} onChange={(value) => setForm({ ...form, logoUrl: value })} />
        <ImageUploadControl
          label="Enviar logo"
          establishmentId={establishment.id}
          scope="logo"
          nameHint={`${establishment.name} logo`}
          onUploaded={(url) => setForm((current) => ({ ...current, logoUrl: url }))}
        />
        <Input label="Banner URL" value={form.bannerUrl} onChange={(value) => setForm({ ...form, bannerUrl: value })} />
        <ImageUploadControl
          label="Enviar banner"
          establishmentId={establishment.id}
          scope="banner"
          nameHint={`${establishment.name} banner`}
          onUploaded={(url) => setForm((current) => ({ ...current, bannerUrl: url }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Entrega" type="number" value={form.deliveryFee} onChange={(value) => setForm({ ...form, deliveryFee: value })} />
          <Input label="Pedido min." type="number" value={form.minimumOrder} onChange={(value) => setForm({ ...form, minimumOrder: value })} />
        </div>
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Salvo" : "Salvar"}
        </button>
      </form>
    </Panel>
  );
}

function CatalogPanel({ establishment, reload }: { establishment: EstablishmentDetail; reload: () => Promise<void> | void }) {
  const [categoryName, setCategoryName] = useState("");
  const [productForm, setProductForm] = useState({ ...emptyProduct });
  const [saving, setSaving] = useState("");

  useEffect(() => {
    setProductForm((current) => ({
      ...current,
      categoryId: current.categoryId || establishment.categories[0]?.id || ""
    }));
  }, [establishment.categories]);

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setSaving("category");
    await api.createCategory(establishment.id, {
      name: categoryName,
      displayOrder: establishment.categories.length + 1
    });
    setCategoryName("");
    await reload();
    setSaving("");
  };

  const addProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving("product");
    await api.createProduct(establishment.id, {
      ...productForm,
      price: Number(productForm.price),
      minQuantity: productForm.minQuantity ? Number(productForm.minQuantity) : undefined,
      stepQuantity: Number(productForm.stepQuantity),
      imageUrl: productForm.imageUrl || undefined
    });
    setProductForm({ ...emptyProduct, categoryId: productForm.categoryId });
    await reload();
    setSaving("");
  };

  const toggleProduct = async (product: Product) => {
    await api.updateProduct(product.id, { isActive: !product.isActive });
    await reload();
  };

  return (
    <div className="min-w-0 space-y-5">
      <Panel>
        <div className="grid min-w-0 gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={addCategory} className="space-y-3">
            <h3 className="font-semibold">Nova categoria</h3>
            <Input label="Nome" value={categoryName} onChange={setCategoryName} />
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white sm:w-auto">
              {saving === "category" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar categoria
            </button>
          </form>

          <form onSubmit={addProduct} className="space-y-3">
            <h3 className="font-semibold">Novo produto</h3>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              value={productForm.categoryId}
              onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
              required
            >
              <option value="">Selecione a categoria</option>
              {establishment.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Input label="Nome" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} required />
              <Input label="Preço" type="number" value={productForm.price} onChange={(value) => setProductForm({ ...productForm, price: value })} required />
            </div>
            <Input label="Descrição" value={productForm.description} onChange={(value) => setProductForm({ ...productForm, description: value })} />
            <Input label="Foto URL" value={productForm.imageUrl} onChange={(value) => setProductForm({ ...productForm, imageUrl: value })} />
            <ImageUploadControl
              label="Enviar foto do produto"
              establishmentId={establishment.id}
              scope="product"
              nameHint={productForm.name || "produto"}
              onUploaded={(url) => setProductForm((current) => ({ ...current, imageUrl: url }))}
            />
            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                value={productForm.pricingType}
                onChange={(event) => setProductForm({ ...productForm, pricingType: event.target.value as PricingType })}
              >
                <option value="UNIT">Unidade</option>
                <option value="HUNDRED">Cento</option>
                <option value="KG">Kg</option>
              </select>
              <Input label="Min." type="number" value={productForm.minQuantity} onChange={(value) => setProductForm({ ...productForm, minQuantity: value })} />
              <Input label="Passo" type="number" value={productForm.stepQuantity} onChange={(value) => setProductForm({ ...productForm, stepQuantity: value })} />
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white sm:w-auto">
              {saving === "product" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar produto
            </button>
          </form>
        </div>
      </Panel>

      <Panel className="p-0">
        <div className="border-b border-slate-200 p-5">
          <h3 className="font-semibold">Catálogo</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {establishment.categories.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
          ) : (
            establishment.categories.map((category) => (
              <CategoryBlock
                key={category.id}
                category={category}
                categories={establishment.categories}
                aiImageCredits={establishment.aiImageCredits}
                reload={reload}
                toggleProduct={toggleProduct}
              />
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function CategoryBlock({
  category,
  categories,
  aiImageCredits,
  reload,
  toggleProduct
}: {
  category: Category;
  categories: Category[];
  aiImageCredits: number;
  reload: () => Promise<void> | void;
  toggleProduct: (product: Product) => Promise<void>;
}) {
  const [editingName, setEditingName] = useState(category.name);

  const saveCategory = async () => {
    await api.updateCategory(category.id, { name: editingName });
    await reload();
  };

  return (
    <section className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            className="w-full rounded-lg border border-transparent bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200"
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
          />
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:translate-y-px"
            onClick={saveCategory}
            aria-label={`Salvar categoria ${category.name}`}
            title="Salvar categoria"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
        <p className="text-sm text-slate-500">{category.products.length} produtos</p>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        {category.products.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Categoria sem produtos.</p>
        ) : (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {category.products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categories={categories}
                  aiImageCredits={aiImageCredits}
                  reload={reload}
                  toggleProduct={toggleProduct}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function ProductRow({
  product,
  categories,
  aiImageCredits,
  reload,
  toggleProduct
}: {
  product: Product;
  categories: Category[];
  aiImageCredits: number;
  reload: () => Promise<void> | void;
  toggleProduct: (product: Product) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <tr className="transition hover:bg-slate-50/70">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Package className="h-4 w-4" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="max-w-[260px] truncate text-xs text-slate-500">{product.description || "Sem descrição"}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 font-medium">{currency.format(product.price)}</td>
        <td className="px-4 py-3 text-slate-500">{product.pricingType}</td>
        <td className="px-4 py-3">
          <span className={`rounded-md px-2 py-1 text-xs font-medium ${product.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {product.isActive ? "Ativo" : "Oculto"}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 active:translate-y-px"
              onClick={() => setEditing(true)}
              aria-label={`Editar produto ${product.name}`}
              title="Editar produto"
            >
              <Edit3 className="h-4 w-4" />
              Editar
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:translate-y-px"
              onClick={() => toggleProduct(product)}
              aria-label={`${product.isActive ? "Ocultar" : "Exibir"} produto ${product.name}`}
              title={product.isActive ? "Ocultar produto" : "Exibir produto"}
            >
              {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {product.isActive ? "Ocultar" : "Exibir"}
            </button>
          </div>
        </td>
      </tr>

      {editing &&
        createPortal(
          <ProductEditModal
            product={product}
            categories={categories}
            aiImageCredits={aiImageCredits}
            close={() => setEditing(false)}
            onSaved={async () => {
              setEditing(false);
              await reload();
            }}
          />,
          document.body
        )}
    </>
  );
}

function ProductEditModal({
  product,
  categories,
  aiImageCredits,
  close,
  onSaved
}: {
  product: Product;
  categories: Category[];
  aiImageCredits: number;
  close: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    categoryId: product.categoryId,
    name: product.name,
    description: product.description || "",
    price: String(product.price),
    pricingType: product.pricingType,
    minQuantity: String(product.minQuantity || 1),
    stepQuantity: String(product.stepQuantity || 1),
    imageUrl: product.imageUrl || "",
    isActive: product.isActive
  });
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [localCredits, setLocalCredits] = useState(aiImageCredits);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.updateProduct(product.id, {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        pricingType: form.pricingType,
        minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
        stepQuantity: Number(form.stepQuantity),
        imageUrl: form.imageUrl || undefined,
        isActive: form.isActive
      });
      await onSaved();
    } catch {
      setError("Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  const enhanceImage = async () => {
    if (form.imageUrl !== (product.imageUrl || "")) {
      setError("Salve a foto enviada antes de melhorar com IA.");
      return;
    }

    setEnhancing(true);
    setError("");
    setNotice("");
    try {
      const result = await api.enhanceProductImage(product.id);
      setForm((current) => ({ ...current, imageUrl: result.image.url }));
      setLocalCredits(result.aiImageCredits);
      setNotice("Imagem melhorada com IA e salva no produto.");
    } catch (error) {
      const message = error instanceof ApiError && error.status === 402
        ? "Este estabelecimento não tem créditos de IA."
        : "Não foi possível melhorar a imagem com IA.";
      setError(message);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold">Editar produto</h2>
            <p className="mt-1 text-sm text-slate-500">Altere preço, descrição, categoria, foto e disponibilidade.</p>
          </div>
          <button type="button" onClick={close} className="rounded-full p-2 transition hover:bg-slate-100" aria-label="Fechar edição">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt={form.name || product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{form.name || "Nome do produto"}</p>
            <p className="mt-1 text-sm text-slate-500">{currency.format(Number(form.price) || 0)}</p>
            <span className={`mt-3 inline-flex rounded-md px-2 py-1 text-xs font-medium ${form.isActive ? "bg-green-50 text-green-700" : "bg-slate-200 text-slate-600"}`}>
              {form.isActive ? "Visível no cardápio" : "Oculto do cardápio"}
            </span>
          </aside>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <label className="block text-sm font-medium text-slate-700">
              Categoria
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Preço" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
            <label className="block text-sm font-medium text-slate-700">
              Tipo de preço
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                value={form.pricingType}
                onChange={(event) => setForm({ ...form, pricingType: event.target.value as PricingType })}
              >
                <option value="UNIT">Unidade</option>
                <option value="HUNDRED">Cento</option>
                <option value="KG">Kg</option>
              </select>
            </label>
            <Input label="Quantidade mínima" type="number" value={form.minQuantity} onChange={(value) => setForm({ ...form, minQuantity: value })} />
            <Input label="Incremento" type="number" value={form.stepQuantity} onChange={(value) => setForm({ ...form, stepQuantity: value })} />
            <div className="md:col-span-2">
              <Input label="Foto URL temporária" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
            </div>
            <div className="md:col-span-2 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              <ImageUploadControl
                label="Enviar nova foto"
                establishmentId={product.establishmentId}
                scope="product"
                nameHint={form.name || product.name}
                onUploaded={(url) => {
                  setForm((current) => ({ ...current, imageUrl: url }));
                  setNotice("Foto otimizada. Salve o produto para aplicar.");
                }}
              />
              <div>
                <button
                  type="button"
                  onClick={enhanceImage}
                  disabled={enhancing || localCredits <= 0 || !product.imageUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {enhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Melhorar com IA
                </button>
                <p className="mt-1 text-xs text-slate-500">
                  Saldo: {localCredits} crédito{localCredits === 1 ? "" : "s"}. Custo: 1 por imagem.
                </p>
              </div>
            </div>
            <label className="md:col-span-2 block text-sm font-medium text-slate-700">
              Descrição
              <textarea
                className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Produto visível no cardápio
            </label>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {notice && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={close} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 active:translate-y-px">
            Cancelar
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:translate-y-px disabled:bg-slate-400" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar produto
          </button>
        </div>
      </form>
    </div>
  );
}

function ImageUploadControl({
  label,
  establishmentId,
  scope,
  nameHint,
  onUploaded
}: {
  label: string;
  establishmentId: string;
  scope: "product" | "logo" | "banner";
  nameHint?: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    try {
      const image = await api.uploadImage(establishmentId, file, scope, nameHint);
      onUploaded(image.url);
      setMessage(`WebP ${image.width}x${image.height}, ${Math.round(image.size / 1024)} KB.`);
    } catch {
      setMessage("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando" : "Escolher arquivo"}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={handleFile}
          disabled={uploading}
          className="sr-only"
        />
      </div>
      {message && <p className="mt-1 text-xs text-slate-500">{message}</p>}
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        step={type === "number" ? "0.01" : undefined}
      />
    </label>
  );
}

export default App;
