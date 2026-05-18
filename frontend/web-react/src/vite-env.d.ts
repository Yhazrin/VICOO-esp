/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 手机扫码可访问的前端站点根 URL（无尾部斜杠），不设则用 window.location.origin */
  readonly VITE_PUBLIC_SITE_ORIGIN?: string;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

