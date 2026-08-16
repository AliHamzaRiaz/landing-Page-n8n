const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
// Keep Expo's React inside apps/mobile so it cannot collide with the web app's React 19.2.x.
config.resolver.disableHierarchicalLookup = true

module.exports = config
