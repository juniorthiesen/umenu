export const getRootDomain = (hostname: string) => {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  if (hostname.endsWith(".com.br") && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
};

export const getTenantFromLocation = () => {
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

export const isPanelHost = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname.startsWith("127.")) return true;

  const rootDomain = getRootDomain(hostname);
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) return false;

  const subdomain = hostname.slice(0, -(rootDomain.length + 1)).split(".")[0];
  return subdomain === "app" || subdomain === "admin";
};

export const panelUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname.startsWith("127.")) return window.location.origin;

  const rootDomain = getRootDomain(hostname);
  return `${window.location.protocol}//app.${rootDomain}`;
};

export const publicUrlFor = (subdomain: string) => {
  if (window.location.hostname === "localhost" || window.location.hostname.startsWith("127.")) {
    return `${window.location.origin}?tenant=${subdomain}`;
  }

  const domain = getRootDomain(window.location.hostname);
  return `${window.location.protocol}//${subdomain}.${domain}`;
};
