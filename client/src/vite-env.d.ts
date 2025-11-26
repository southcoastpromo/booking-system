/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global process for client-side compatibility
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test'
    [key: string]: string | undefined
  }
};
