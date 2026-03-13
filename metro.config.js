const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support .securevault file extension for import/export
config.resolver.assetExts.push('securevault');

module.exports = config;
