import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Info,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Trash2,
  X
} from "lucide-react";
import { AdminApp } from "./admin/AdminApp";
import { FullScreenLoading } from "./shared/components/FullScreenLoading";
import { Panel } from "./shared/components/Panel";
import { currency, includesSearchTerm, normalizeSearchText } from "./shared/utils/currency";
import { getTenantFromLocation, isPanelHost, panelUrl } from "./shared/utils/hostname";
import type { PricingType } from "./types";

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

const calculateLineTotal = (
  product: Pick<PublicMenuProduct, "price" | "pricingType">,
  quantity: number
) => {
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
  const total = selectedItems.reduce(
    (sum, item) => sum + calculateLineTotal(item.product, item.quantity),
    0
  );

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

export default App;
