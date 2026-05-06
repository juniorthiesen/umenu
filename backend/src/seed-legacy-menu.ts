import { menuData } from "../../legacy/supabase-version/src/data/menu";

const API_URL = process.env.API_URL || "http://localhost:3333";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@umenu.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me-admin-password";
const TENANT_SUBDOMAIN = process.argv[2] || process.env.TENANT_SUBDOMAIN || "salgados-cia-teste";

const pricingTypeMap = {
  unidade: "UNIT",
  cento: "HUNDRED",
  kg: "KG"
} as const;

const request = async <T>(path: string, token: string | null, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${path}: ${text}`);
  }

  return response.json() as Promise<T>;
};

const login = await request<{ token: string }>("/api/auth/login", null, {
  method: "POST",
  body: JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })
});

const establishments = await request<Array<{ id: string; subdomain: string }>>(
  "/api/admin/establishments",
  login.token
);

const establishment = establishments.find((item) => item.subdomain === TENANT_SUBDOMAIN);
if (!establishment) {
  throw new Error(`Tenant "${TENANT_SUBDOMAIN}" nao encontrado.`);
}

await request(`/api/admin/establishments/${establishment.id}/catalog`, login.token, {
  method: "DELETE"
});

let productCount = 0;

for (const [categoryIndex, category] of menuData.entries()) {
  const createdCategory = await request<{ id: string }>(
    `/api/admin/establishments/${establishment.id}/categories`,
    login.token,
    {
      method: "POST",
      body: JSON.stringify({
        name: category.name,
        displayOrder: categoryIndex + 1
      })
    }
  );

  for (const [productIndex, product] of category.products.entries()) {
    const effectivePrice = product.promotion?.isActive
      ? product.promotion.promotionalPrice
      : product.price;

    await request(`/api/admin/establishments/${establishment.id}/products`, login.token, {
      method: "POST",
      body: JSON.stringify({
        categoryId: createdCategory.id,
        name: product.name,
        description: product.description || "",
        price: effectivePrice,
        pricingType: pricingTypeMap[product.pricingType],
        minQuantity: product.minQuantity || 1,
        stepQuantity: product.step || 1,
        imageUrl: product.image,
        displayOrder: productIndex + 1
      })
    });

    productCount += 1;
  }
}

console.log(`Catalogo legado importado para ${TENANT_SUBDOMAIN}: ${menuData.length} categorias, ${productCount} produtos.`);
