/**
 * Expo Config Plugin: withReleaseOptimizations
 *
 * Enables Proguard minification and resource shrinking for Android release builds.
 * These flags reduce the final download size by dead-code eliminating unused
 * Java/Kotlin bytecode and stripping unused Android resources.
 *
 * This plugin runs on every `expo prebuild` so the settings survive clean builds.
 */
const { withGradleProperties } = require('@expo/config-plugins');

const OPTIMIZATION_PROPERTIES = [
  // Proguard is disabled: it strips FabricUIManager.mBinding which is accessed
  // from C++ via JNI (not Java reflection), breaking the New Architecture at runtime.
  // Security comes from AES-256/PBKDF2 encryption, not code obfuscation.
  { key: 'android.enableProguardInReleaseBuilds', value: 'false' },
  { key: 'android.enableShrinkResourcesInReleaseBuilds', value: 'false' },
];

const withReleaseOptimizations = (config) => {
  return withGradleProperties(config, (mod) => {
    const properties = mod.modResults;

    // Remove any existing entries for these keys first
    const keysToSet = new Set(OPTIMIZATION_PROPERTIES.map((p) => p.key));
    const filtered = properties.filter(
      (item) => !(item.type === 'property' && keysToSet.has(item.key)),
    );

    // Add the optimization flags
    for (const { key, value } of OPTIMIZATION_PROPERTIES) {
      filtered.push({ type: 'property', key, value });
    }

    mod.modResults = filtered;
    return mod;
  });
};

module.exports = withReleaseOptimizations;
