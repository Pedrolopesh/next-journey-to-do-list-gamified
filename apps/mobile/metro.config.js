const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O banner.html (gerado por apps/banner) é carregado como asset e entregue ao WebView.
config.resolver.assetExts.push('html');

module.exports = config;
