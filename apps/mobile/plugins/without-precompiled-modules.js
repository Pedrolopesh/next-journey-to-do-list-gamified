const { withPodfileProperties } = require('expo/config-plugins');

/**
 * Turns off the precompiled Expo modules on iOS. With Xcode 26.2 the device build fails in ExpoCrypto
 * ("Declaration name ... is not covered by macro 'Record'") when they are on. Writing the flag here keeps
 * it across `expo prebuild` and `pod install`, instead of exporting EXPO_USE_PRECOMPILED_MODULES=0 by hand.
 * Remove this plugin once an Expo SDK release fixes the build.
 */
module.exports = function withoutPrecompiledModules(config) {
  return withPodfileProperties(config, (podfileConfig) => {
    podfileConfig.modResults.EXPO_USE_PRECOMPILED_MODULES = 'false';
    return podfileConfig;
  });
};
