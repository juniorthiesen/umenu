import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import bcrypt from "bcryptjs";
import Fastify from "fastify";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { UserRole } from "../generated/prisma/enums";
import { authPlugin } from "./auth";
import { prisma } from "./db";
import { env } from "./env";
import {
  assertSupportedImage,
  buildPublicImageUrl,
  fetchImageBuffer,
  improveFoodImageWithOpenAI,
  maxUploadBytes,
  storeOptimizedImage
} from "./services/images";
import { isValidSubdomain, slugify } from "./utils/slug";
import { PricingType } from "../generated/prisma/enums";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, "..", "..", env.UPLOAD_DIR);

const app = Fastify({
  logger: true
});

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin || env.CORS_ORIGIN === "*" || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed"), false);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

await app.register(multipart, {
  limits: {
    fileSize: maxUploadBytes(),
    files: 1
  }
});
await app.register(staticFiles, {
  root: uploadRoot,
  prefix: "/uploads/"
});
await app.register(authPlugin);

const requirePlatformAdmin = async (request: any, reply: any) => {
  await app.authenticate(request, reply);

  if (reply.sent) {
    return;
  }

  if (request.user.role !== "PLATFORM_ADMIN") {
    return reply.code(403).send({ error: "forbidden" });
  }
};

const requireAdminAccessToEstablishment = async (request: any, reply: any) => {
  await app.authenticate(request, reply);

  if (reply.sent) {
    return;
  }

  if (request.user.role === "PLATFORM_ADMIN") {
    return;
  }

  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);
  if (!request.user.establishmentIds.includes(establishmentId)) {
    return reply.code(403).send({ error: "forbidden" });
  }
};

const uniqueCategorySlug = async (establishmentId: string, name: string) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.category.findUnique({
      where: { establishmentId_slug: { establishmentId, slug } },
      select: { id: true }
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const uniqueProductSlug = async (establishmentId: string, name: string) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.product.findUnique({
      where: { establishmentId_slug: { establishmentId, slug } },
      select: { id: true }
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const establishmentCreateSchema = z.object({
  name: z.string().min(2),
  subdomain: z.string().min(3),
  whatsappPhone: z.string().min(10),
  address: z.string().optional(),
  admin: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8)
  })
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const categoryCreateSchema = z.object({
  name: z.string().min(2),
  displayOrder: z.number().int().default(0)
});

const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  isActive: z.boolean().optional()
});

const productCreateSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  pricingType: z.enum(["UNIT", "HUNDRED", "KG"]).default("UNIT"),
  minQuantity: z.coerce.number().positive().optional(),
  stepQuantity: z.coerce.number().positive().default(1),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().default(0)
});

const productUpdateSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  pricingType: z.enum(["UNIT", "HUNDRED", "KG"]).optional(),
  minQuantity: z.coerce.number().positive().optional(),
  stepQuantity: z.coerce.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
});

const establishmentUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  whatsappPhone: z.string().min(10).optional(),
  address: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().min(4).max(20).optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  minimumOrder: z.coerce.number().min(0).optional()
});

const aiCreditSchema = z.object({
  credits: z.number().int().min(0).max(10000)
});

const imageScopeSchema = z.object({
  scope: z.enum(["product", "logo", "banner"]).default("product"),
  nameHint: z.string().trim().max(120).optional()
});

const imageEnhanceSchema = z.object({
  prompt: z.string().max(1000).optional()
});

const publicOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative()
    })
  ),
  totalAmount: z.number().nonnegative(),
  whatsappUrl: z.string().optional()
});

app.get("/health", async () => ({
  ok: true,
  service: "umenu-api"
}));

app.post("/api/auth/login", async (request, reply) => {
  const input = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: {
      memberships: {
        select: { establishmentId: true }
      }
    }
  });

  if (!user) {
    return reply.code(401).send({ error: "invalid_credentials" });
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    return reply.code(401).send({ error: "invalid_credentials" });
  }

  const token = app.jwt.sign(
    {
      sub: user.id,
      role: user.role,
      establishmentIds: user.memberships.map((membership) => membership.establishmentId)
    },
    {
      expiresIn: "8h"
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      establishmentIds: user.memberships.map((membership) => membership.establishmentId)
    }
  };
});

app.get("/api/auth/me", { preHandler: [app.authenticate] }, async (request) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      memberships: {
        select: { establishmentId: true }
      }
    }
  });

  return {
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          establishmentIds: user.memberships.map((membership) => membership.establishmentId)
        }
      : null
  };
});

app.get("/api/public/subdomains/:subdomain/availability", async (request, reply) => {
  const { subdomain } = z.object({ subdomain: z.string() }).parse(request.params);
  const normalized = slugify(subdomain);

  if (!isValidSubdomain(normalized)) {
    return reply.code(400).send({
      available: false,
      reason: "invalid_subdomain"
    });
  }

  const existing = await prisma.establishment.findUnique({
    where: { subdomain: normalized },
    select: { id: true }
  });

  return {
    available: !existing,
    subdomain: normalized
  };
});

app.get("/api/public/menu/:subdomain", async (request, reply) => {
  const { subdomain } = z.object({ subdomain: z.string() }).parse(request.params);

  const establishment = await prisma.establishment.findUnique({
    where: { subdomain: slugify(subdomain) },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: {
          products: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
          }
        }
      }
    }
  });

  if (!establishment || establishment.status !== "ACTIVE") {
    return reply.code(404).send({ error: "menu_not_found" });
  }

  return {
    establishment: {
      id: establishment.id,
      name: establishment.name,
      subdomain: establishment.subdomain,
      whatsappPhone: establishment.whatsappPhone,
      address: establishment.address,
      logoUrl: establishment.logoUrl,
      bannerUrl: establishment.bannerUrl,
      primaryColor: establishment.primaryColor,
      deliveryFee: Number(establishment.deliveryFee),
      minimumOrder: Number(establishment.minimumOrder),
      openingHours: establishment.openingHours
    },
    categories: establishment.categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        pricingType: product.pricingType,
        minQuantity: product.minQuantity ? Number(product.minQuantity) : null,
        stepQuantity: Number(product.stepQuantity),
        imageUrl: product.imageUrl
      }))
    }))
  };
});

app.post("/api/public/menu/:subdomain/visit", async (request, reply) => {
  const { subdomain } = z.object({ subdomain: z.string() }).parse(request.params);

  const establishment = await prisma.establishment.findUnique({
    where: { subdomain: slugify(subdomain) },
    select: { id: true, status: true }
  });

  if (!establishment || establishment.status !== "ACTIVE") {
    return reply.code(404).send({ error: "menu_not_found" });
  }

  await prisma.menuVisit.create({
    data: {
      establishmentId: establishment.id,
      source: request.headers.referer,
      userAgent: request.headers["user-agent"]
    }
  });

  return reply.code(201).send({ ok: true });
});

app.post("/api/public/menu/:subdomain/orders", async (request, reply) => {
  const { subdomain } = z.object({ subdomain: z.string() }).parse(request.params);
  const input = publicOrderSchema.parse(request.body);

  const establishment = await prisma.establishment.findUnique({
    where: { subdomain: slugify(subdomain) },
    select: { id: true, status: true }
  });

  if (!establishment || establishment.status !== "ACTIVE") {
    return reply.code(404).send({ error: "menu_not_found" });
  }

  const order = await prisma.order.create({
    data: {
      establishmentId: establishment.id,
      items: input.items,
      totalAmount: input.totalAmount,
      whatsappUrl: input.whatsappUrl
    },
    select: {
      id: true,
      createdAt: true
    }
  });

  return reply.code(201).send(order);
});

app.post("/api/admin/establishments", { preHandler: [requirePlatformAdmin] }, async (request, reply) => {
  const input = establishmentCreateSchema.parse(request.body);
  const subdomain = slugify(input.subdomain);

  if (!isValidSubdomain(subdomain)) {
    return reply.code(400).send({ error: "invalid_subdomain" });
  }

  const existing = await prisma.establishment.findUnique({
    where: { subdomain },
    select: { id: true }
  });

  if (existing) {
    return reply.code(409).send({ error: "subdomain_unavailable" });
  }

  const passwordHash = await bcrypt.hash(input.admin.password, 12);

  const establishment = await prisma.establishment.create({
    data: {
      name: input.name,
      slug: subdomain,
      subdomain,
      whatsappPhone: input.whatsappPhone,
      address: input.address,
      users: {
        create: {
          user: {
            connectOrCreate: {
              where: { email: input.admin.email.toLowerCase() },
              create: {
                name: input.admin.name,
                email: input.admin.email.toLowerCase(),
                passwordHash,
                role: UserRole.ESTABLISHMENT_ADMIN
              }
            }
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      subdomain: true,
      status: true,
      aiImageCredits: true
    }
  });

  return reply.code(201).send({
    establishment,
    publicUrl:
      env.APP_DOMAIN === "localhost"
        ? `http://localhost:5173?tenant=${establishment.subdomain}`
        : `https://${establishment.subdomain}.${env.APP_DOMAIN}`
  });
});

app.get("/api/admin/establishments", { preHandler: [app.authenticate] }, async (request) => {
  if (request.user.role !== "PLATFORM_ADMIN") {
    return prisma.establishment.findMany({
      where: {
        users: {
          some: { userId: request.user.sub }
        }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        whatsappPhone: true,
        aiImageCredits: true,
        createdAt: true
      }
    });
  }

  return prisma.establishment.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      subdomain: true,
      status: true,
      whatsappPhone: true,
      aiImageCredits: true,
      createdAt: true
    }
  });
});

app.get("/api/admin/establishments/:establishmentId", { preHandler: [requireAdminAccessToEstablishment] }, async (request, reply) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);

  const establishment = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    include: {
      categories: {
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: {
          products: {
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
          }
        }
      }
    }
  });

  if (!establishment) {
    return reply.code(404).send({ error: "establishment_not_found" });
  }

  return {
    ...establishment,
    deliveryFee: Number(establishment.deliveryFee),
    minimumOrder: Number(establishment.minimumOrder),
    categories: establishment.categories.map((category) => ({
      ...category,
      products: category.products.map((product) => ({
        ...product,
        price: Number(product.price),
        minQuantity: product.minQuantity ? Number(product.minQuantity) : null,
        stepQuantity: Number(product.stepQuantity)
      }))
    }))
  };
});

app.get("/api/admin/establishments/:establishmentId/analytics", { preHandler: [requireAdminAccessToEstablishment] }, async (request) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [
    visitsToday,
    visits7d,
    ordersToday,
    orders7d,
    revenueToday,
    revenue7d,
    productCount,
    activeProductCount,
    categoryCount
  ] = await Promise.all([
    prisma.menuVisit.count({ where: { establishmentId, createdAt: { gte: today } } }),
    prisma.menuVisit.count({ where: { establishmentId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.order.count({ where: { establishmentId, createdAt: { gte: today } } }),
    prisma.order.count({ where: { establishmentId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.order.aggregate({
      where: { establishmentId, createdAt: { gte: today } },
      _sum: { totalAmount: true }
    }),
    prisma.order.aggregate({
      where: { establishmentId, createdAt: { gte: sevenDaysAgo } },
      _sum: { totalAmount: true }
    }),
    prisma.product.count({ where: { establishmentId } }),
    prisma.product.count({ where: { establishmentId, isActive: true } }),
    prisma.category.count({ where: { establishmentId } })
  ]);

  const conversionToday = visitsToday > 0 ? ordersToday / visitsToday : 0;
  const conversion7d = visits7d > 0 ? orders7d / visits7d : 0;

  return {
    visitsToday,
    visits7d,
    ordersToday,
    orders7d,
    revenueToday: Number(revenueToday._sum.totalAmount || 0),
    revenue7d: Number(revenue7d._sum.totalAmount || 0),
    conversionToday,
    conversion7d,
    productCount,
    activeProductCount,
    categoryCount,
    funnel: [
      { label: "Acessos", value: visits7d },
      { label: "Pedidos WhatsApp", value: orders7d },
      { label: "Conversao", value: Math.round(conversion7d * 100) }
    ]
  };
});

app.patch("/api/admin/establishments/:establishmentId", { preHandler: [requireAdminAccessToEstablishment] }, async (request, reply) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);
  const input = establishmentUpdateSchema.parse(request.body);

  const establishment = await prisma.establishment.update({
    where: { id: establishmentId },
    data: input
  });

  return reply.send({
    ...establishment,
    deliveryFee: Number(establishment.deliveryFee),
    minimumOrder: Number(establishment.minimumOrder)
  });
});

app.post("/api/admin/establishments/:establishmentId/ai-credits", { preHandler: [requirePlatformAdmin] }, async (request) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);
  const input = aiCreditSchema.parse(request.body);

  const establishment = await prisma.establishment.update({
    where: { id: establishmentId },
    data: { aiImageCredits: input.credits },
    select: { id: true, aiImageCredits: true }
  });

  return establishment;
});

app.post("/api/admin/establishments/:establishmentId/images", { preHandler: [requireAdminAccessToEstablishment] }, async (request, reply) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);
  const query = imageScopeSchema.parse(request.query);
  const file = await request.file();

  if (!file) {
    return reply.code(400).send({ error: "image_required" });
  }

  try {
    assertSupportedImage(file.mimetype);
    const buffer = await file.toBuffer();
    const stored = await storeOptimizedImage({
      input: buffer,
      uploadRoot,
      establishmentId,
      scope: query.scope,
      nameHint: query.nameHint
    });
    const protocol = String(request.headers["x-forwarded-proto"] || "http").split(",")[0];

    return reply.code(201).send({
      url: buildPublicImageUrl(stored.publicPath, request.headers.host || "localhost", protocol),
      path: stored.publicPath,
      width: stored.width,
      height: stored.height,
      size: stored.size,
      format: stored.format
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "image_processing_failed";
    return reply.code(message === "unsupported_image_type" ? 415 : 400).send({ error: message });
  }
});

app.post("/api/admin/establishments/:establishmentId/categories", { preHandler: [requireAdminAccessToEstablishment] }, async (request, reply) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);
  const input = categoryCreateSchema.parse(request.body);
  const slug = await uniqueCategorySlug(establishmentId, input.name);

  const category = await prisma.category.create({
    data: {
      establishmentId,
      name: input.name,
      slug,
      displayOrder: input.displayOrder
    }
  });

  return reply.code(201).send(category);
});

app.delete("/api/admin/establishments/:establishmentId/catalog", { preHandler: [requireAdminAccessToEstablishment] }, async (request, reply) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);

  await prisma.product.deleteMany({
    where: { establishmentId }
  });

  await prisma.category.deleteMany({
    where: { establishmentId }
  });

  return reply.send({ ok: true });
});

app.patch("/api/admin/categories/:categoryId", { preHandler: [app.authenticate] }, async (request, reply) => {
  const { categoryId } = z.object({ categoryId: z.string().uuid() }).parse(request.params);
  const input = categoryUpdateSchema.parse(request.body);

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return reply.code(404).send({ error: "category_not_found" });
  }

  if (
    request.user.role !== "PLATFORM_ADMIN" &&
    !request.user.establishmentIds.includes(category.establishmentId)
  ) {
    return reply.code(403).send({ error: "forbidden" });
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...input,
      slug: input.name ? slugify(input.name) : undefined
    }
  });

  return updated;
});

app.post("/api/admin/establishments/:establishmentId/products", { preHandler: [requireAdminAccessToEstablishment] }, async (request, reply) => {
  const { establishmentId } = z.object({ establishmentId: z.string().uuid() }).parse(request.params);
  const input = productCreateSchema.parse(request.body);
  const slug = await uniqueProductSlug(establishmentId, input.name);

  const product = await prisma.product.create({
    data: {
      establishmentId,
      categoryId: input.categoryId,
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      pricingType: input.pricingType as PricingType,
      minQuantity: input.minQuantity,
      stepQuantity: input.stepQuantity,
      imageUrl: input.imageUrl,
      displayOrder: input.displayOrder
    }
  });

  return reply.code(201).send(product);
});

app.patch("/api/admin/products/:productId", { preHandler: [app.authenticate] }, async (request, reply) => {
  const { productId } = z.object({ productId: z.string().uuid() }).parse(request.params);
  const input = productUpdateSchema.parse(request.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return reply.code(404).send({ error: "product_not_found" });
  }

  if (
    request.user.role !== "PLATFORM_ADMIN" &&
    !request.user.establishmentIds.includes(product.establishmentId)
  ) {
    return reply.code(403).send({ error: "forbidden" });
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...input,
      slug: input.name ? slugify(input.name) : undefined,
      pricingType: input.pricingType as PricingType | undefined
    }
  });

  return {
    ...updated,
    price: Number(updated.price),
    minQuantity: updated.minQuantity ? Number(updated.minQuantity) : null,
    stepQuantity: Number(updated.stepQuantity)
  };
});

app.post("/api/admin/products/:productId/image/enhance", { preHandler: [app.authenticate] }, async (request, reply) => {
  const { productId } = z.object({ productId: z.string().uuid() }).parse(request.params);
  const input = imageEnhanceSchema.parse(request.body || {});

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { establishment: { select: { id: true, aiImageCredits: true } } }
  });

  if (!product) {
    return reply.code(404).send({ error: "product_not_found" });
  }

  if (
    request.user.role !== "PLATFORM_ADMIN" &&
    !request.user.establishmentIds.includes(product.establishmentId)
  ) {
    return reply.code(403).send({ error: "forbidden" });
  }

  if (!product.imageUrl) {
    return reply.code(400).send({ error: "product_image_required" });
  }

  const reserved = await prisma.establishment.updateMany({
    where: {
      id: product.establishmentId,
      aiImageCredits: { gt: 0 }
    },
    data: {
      aiImageCredits: { decrement: 1 }
    }
  });

  if (reserved.count === 0) {
    return reply.code(402).send({ error: "ai_credits_required" });
  }

  try {
    const sourceBuffer = await fetchImageBuffer(product.imageUrl);
    const improved = await improveFoodImageWithOpenAI({
      image: sourceBuffer,
      productName: product.name,
      prompt: input.prompt
    });
    const stored = await storeOptimizedImage({
      input: improved,
      uploadRoot,
      establishmentId: product.establishmentId,
      scope: "ai",
      nameHint: product.name
    });
    const protocol = String(request.headers["x-forwarded-proto"] || "http").split(",")[0];
    const imageUrl = buildPublicImageUrl(stored.publicPath, request.headers.host || "localhost", protocol);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { imageUrl }
    });
    const credits = await prisma.establishment.findUnique({
      where: { id: product.establishmentId },
      select: { aiImageCredits: true }
    });

    return {
      product: {
        ...updated,
        price: Number(updated.price),
        minQuantity: updated.minQuantity ? Number(updated.minQuantity) : null,
        stepQuantity: Number(updated.stepQuantity)
      },
      image: {
        url: imageUrl,
        path: stored.publicPath,
        width: stored.width,
        height: stored.height,
        size: stored.size,
        format: stored.format
      },
      aiImageCredits: credits?.aiImageCredits ?? 0
    };
  } catch (error) {
    await prisma.establishment.update({
      where: { id: product.establishmentId },
      data: { aiImageCredits: { increment: 1 } }
    });
    const message = error instanceof Error ? error.message : "image_enhance_failed";
    return reply.code(message === "openai_not_configured" ? 503 : 400).send({ error: message });
  }
});

const start = async () => {
  try {
    await app.listen({ host: env.API_HOST, port: env.API_PORT });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

await start();
