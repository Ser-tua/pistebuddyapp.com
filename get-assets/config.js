// The ONLY place the store addresses live. get.html reads this; platform.test.js checks that the
// <noscript> links in get.html match it, so the two cannot drift apart.
//
// While a URL is '', that store shows "Coming soon for the 2026/27 season" and nobody is sent to it.
// Fill them in when the listings are PUBLIC (not internal testing):
//   appStoreUrl:  'https://apps.apple.com/app/id<Apple ID>'  (App Store Connect -> App Information -> Apple ID)
//   playStoreUrl: 'https://play.google.com/store/apps/details?id=com.pistebuddy.app'
//   appStoreProviderToken: the pt= value (App Store Connect -> Analytics -> Campaigns: the "pt" in a
//     generated campaign link). Leave '' to send no pt.
(function (root) {
  var config = {
    appStoreUrl: '',
    playStoreUrl: '',
    appStoreProviderToken: '',
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
  else root.PB_GET_CONFIG = config;
})(this);
