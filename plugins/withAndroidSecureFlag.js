/**
 * Expo Config Plugin: withAndroidSecureFlag
 *
 * Adds FLAG_SECURE to MainActivity to prevent screenshots and
 * screen recordings. This is a critical security measure for a
 * card vault application.
 */
const { withMainActivity } = require('@expo/config-plugins');

const FLAG_SECURE_JAVA = `    // FLAG_SECURE: Prevents screenshots and screen recordings of sensitive card data
    getWindow().setFlags(
      android.view.WindowManager.LayoutParams.FLAG_SECURE,
      android.view.WindowManager.LayoutParams.FLAG_SECURE
    );`;

const FLAG_SECURE_KOTLIN = `    // FLAG_SECURE: Prevents screenshots and screen recordings of sensitive card data
    window.setFlags(
      android.view.WindowManager.LayoutParams.FLAG_SECURE,
      android.view.WindowManager.LayoutParams.FLAG_SECURE
    )`;

const withAndroidSecureFlag = (config) => {
  return withMainActivity(config, (mod) => {
    const { contents, language } = mod.modResults;

    const flagCode =
      language === 'kt' ? FLAG_SECURE_KOTLIN : FLAG_SECURE_JAVA;

    // Insert after super.onCreate call
    const anchor =
      language === 'kt'
        ? 'super.onCreate(savedInstanceState)'
        : 'super.onCreate(null)';

    if (contents.includes('FLAG_SECURE')) {
      // Already patched
      return mod;
    }

    mod.modResults.contents = contents.replace(
      anchor,
      `${anchor}\n${flagCode}`,
    );

    return mod;
  });
};

module.exports = withAndroidSecureFlag;
