// banner.html é gerado pelo build do banner e carregado como asset (metro.config.js).
declare module '*.html' {
  const assetId: number;
  export default assetId;
}
