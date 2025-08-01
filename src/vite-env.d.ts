/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_META_PIXEL_ID: string
  readonly VITE_GOOGLE_ANALYTICS_ID: string
  readonly VITE_WHATSAPP_PHONE: string
  readonly VITE_BUSINESS_PHONE: string
  readonly VITE_BUSINESS_NAME: string
  readonly VITE_BUSINESS_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
