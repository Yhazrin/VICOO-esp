/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  interface Html2Pdf {
    set(options: Record<string, unknown>): Html2Pdf;
    from(element: HTMLElement): Html2Pdf;
    save(): Promise<void>;
  }
  function html2pdf(): Html2Pdf;
  export default html2pdf;
}
