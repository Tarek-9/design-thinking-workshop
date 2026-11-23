/// <reference types="vite/client" />

/** Without this, import.meta.env.VITE_* is any and strict lint rules cannot see through it. */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
