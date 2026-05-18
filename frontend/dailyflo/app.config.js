/**
 * expo reads this file when you run metro, prebuild, or eas — it merges the static fields from `app.json`
 * with whatever we add here. google sign-in on ios needs a url scheme that looks like
 * `com.googleusercontent.apps.<prefix>` where <prefix> is the **ios oauth client id without** the
 * `.apps.googleusercontent.com` suffix. that value is also `REVERSED_CLIENT_ID` in GoogleService-Info.plist.
 *
 * eas injects secrets **before** "read app config", so `EXPO_PUBLIC_GOOGLE_CLIENT_ID` from eas matches
 * what `GoogleSignin.configure` sees at runtime — the native redirect scheme must be the same.
 *
 * if you create a **new** firebase project, replace `GoogleService-Info.plist` **and** set the eas secret /
 * `.env` to the **same** `CLIENT_ID` string that appears in that new plist (not an old google cloud ios id).
 */

const fs = require('fs');
const path = require('path');

/** turn ios oauth client id into the reversed scheme ios uses for the google sign-in callback */
function reversedClientIdFromIosOAuthClientId(clientId) {
  if (
    !clientId ||
    typeof clientId !== 'string' ||
    !clientId.endsWith('.apps.googleusercontent.com')
  ) {
    return null;
  }
  const prefix = clientId.replace(/\.apps\.googleusercontent\.com$/i, '');
  return `com.googleusercontent.apps.${prefix}`;
}

/** if env is missing (local shell without .env), fall back to plist so `expo prebuild` still works */
function readReversedClientIdFromPlist(projectRoot) {
  const plistPath = path.join(projectRoot, 'GoogleService-Info.plist');
  if (!fs.existsSync(plistPath)) return null;
  const xml = fs.readFileSync(plistPath, 'utf8');
  const m = xml.match(
    /<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/,
  );
  return m ? m[1].trim() : null;
}

function getIosGoogleUrlScheme(projectRoot) {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const fromEnvReversed = reversedClientIdFromIosOAuthClientId(fromEnv);
  if (fromEnvReversed) return fromEnvReversed;
  return readReversedClientIdFromPlist(projectRoot);
}

function withGoogleSignInPlugin(plugins, iosUrlScheme) {
  if (!iosUrlScheme || !Array.isArray(plugins)) return plugins;
  return plugins.map((entry) => {
    if (entry === '@react-native-google-signin/google-signin') {
      return [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme },
      ];
    }
    if (
      Array.isArray(entry) &&
      entry[0] === '@react-native-google-signin/google-signin'
    ) {
      const opts =
        typeof entry[1] === 'object' && entry[1] !== null ? entry[1] : {};
      return [
        '@react-native-google-signin/google-signin',
        { ...opts, iosUrlScheme },
      ];
    }
    return entry;
  });
}

module.exports = ({ config }) => {
  const projectRoot = __dirname;
  const iosUrlScheme = getIosGoogleUrlScheme(projectRoot);
  const scheme = typeof config.scheme === 'string' ? config.scheme : 'dailyflo';
  const urlSchemes = [scheme];
  if (iosUrlScheme) urlSchemes.push(iosUrlScheme);

  return {
    ...config,
    plugins: withGoogleSignInPlugin(config.plugins, iosUrlScheme),
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        CFBundleURLTypes: [{ CFBundleURLSchemes: urlSchemes }],
      },
    },
  };
};
