const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "app",
  "blog",
  "dashboard",
  "ftp",
  "mail",
  "shop",
  "store",
  "www"
]);

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const isValidSubdomain = (value: string) => {
  const subdomain = value.trim().toLowerCase();
  const pattern = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$/;

  return pattern.test(subdomain) && !RESERVED_SUBDOMAINS.has(subdomain);
};
