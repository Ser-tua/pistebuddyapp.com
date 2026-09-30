// The "get the app" redirect's logic, with no dependencies, shared by get.html (browser) and
// platform.test.js (node --test). Pure functions: nothing here reads the page or the window.
(function (root) {
  'use strict';

  /**
   * 'ios' | 'android' | 'other', from what the browser says about itself.
   * iPadOS 13+ reports itself as a Mac ("Macintosh" in the user agent, platform "MacIntel"); a real
   * Mac has no touch screen, so a Mac-looking browser with more than one touch point is an iPad.
   */
  function detectPlatform(env) {
    var ua = String((env && env.userAgent) || '');
    var platform = String((env && env.platform) || '');
    var touch = Number((env && env.maxTouchPoints) || 0);
    if (/android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/.test(ua) || /^(iPhone|iPad|iPod)/.test(platform)) return 'ios';
    if ((platform === 'MacIntel' || /Macintosh/.test(ua)) && touch > 1) return 'ios';
    return 'other';
  }

  /**
   * The campaign name from ?src=, or '' when absent or unusable. Letters, digits, '-' and '_' only
   * (it ends up in two store URLs), at most 40 characters -- Apple's limit for a campaign token.
   */
  function campaign(search) {
    var raw = '';
    try { raw = new URLSearchParams(search || '').get('src') || ''; } catch (e) { raw = ''; }
    raw = raw.trim();
    return /^[A-Za-z0-9_-]{1,40}$/.test(raw) ? raw : '';
  }

  /** The App Store URL with ct=<src> and the provider token pt=, each only when there is one. */
  function appStoreUrl(base, src, providerToken) {
    if (!base) return '';
    var u = new URL(base);
    if (providerToken) u.searchParams.set('pt', providerToken);
    if (src) u.searchParams.set('ct', src);
    return u.toString();
  }

  /**
   * The Play URL with the install referrer, only when there is a campaign. Play reads `referrer` as
   * one URL-encoded query string: referrer=utm_source%3D<src>%26utm_medium%3Dqr.
   */
  function playStoreUrl(base, src) {
    if (!base) return '';
    var u = new URL(base);
    if (src) u.searchParams.set('referrer', 'utm_source=' + src + '&utm_medium=qr');
    return u.toString();
  }

  /**
   * What the page does. A phone whose store is live is sent there; everything else -- a desktop, an
   * unknown device, or a phone whose store is not live yet -- gets the page, never a dead link.
   */
  function decide(env, config, search) {
    var src = campaign(search);
    var ios = appStoreUrl(config.appStoreUrl, src, config.appStoreProviderToken);
    var android = playStoreUrl(config.playStoreUrl, src);
    var platform = detectPlatform(env);
    if (platform === 'ios' && ios) return { action: 'redirect', url: ios, platform: platform };
    if (platform === 'android' && android) return { action: 'redirect', url: android, platform: platform };
    return { action: 'page', platform: platform, ios: ios, android: android };
  }

  var api = { detectPlatform: detectPlatform, campaign: campaign, appStoreUrl: appStoreUrl, playStoreUrl: playStoreUrl, decide: decide };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PBGet = api;
})(this);
