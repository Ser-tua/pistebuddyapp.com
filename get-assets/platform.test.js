// Run: node --test get-assets/platform.test.js   (Node 18+, no packages needed)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { detectPlatform, campaign, appStoreUrl, playStoreUrl, decide } = require('./platform.js');
const config = require('./config.js');

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  ipadAsMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; SM-A226B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  instagramIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 340.0.0',
};
const APP = 'https://apps.apple.com/app/id1234567890';
const PLAY = 'https://play.google.com/store/apps/details?id=com.pistebuddy.app';
const LIVE = { appStoreUrl: APP, playStoreUrl: PLAY, appStoreProviderToken: '123456' };

test('detects an iPhone', () => {
  assert.equal(detectPlatform({ userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5 }), 'ios');
  assert.equal(detectPlatform({ userAgent: UA.instagramIos, platform: 'iPhone', maxTouchPoints: 5 }), 'ios');
});

test('detects an iPad that reports itself as a Mac, by its touch points', () => {
  assert.equal(detectPlatform({ userAgent: UA.ipadAsMac, platform: 'MacIntel', maxTouchPoints: 5 }), 'ios');
});

test('a real Mac (no touch) is not an iPad', () => {
  assert.equal(detectPlatform({ userAgent: UA.ipadAsMac, platform: 'MacIntel', maxTouchPoints: 0 }), 'other');
});

test('detects Android', () => {
  assert.equal(detectPlatform({ userAgent: UA.android, platform: 'Linux armv8l', maxTouchPoints: 5 }), 'android');
});

test('desktop Chrome is other', () => {
  assert.equal(detectPlatform({ userAgent: UA.desktopChrome, platform: 'Win32', maxTouchPoints: 0 }), 'other');
});

test('an unknown or empty environment is other', () => {
  assert.equal(detectPlatform({}), 'other');
  assert.equal(detectPlatform(undefined), 'other');
  assert.equal(detectPlatform({ userAgent: 'curl/8.4.0' }), 'other');
});

test('campaign: read from ?src=, and refused when unusable', () => {
  assert.equal(campaign('?src=convention'), 'convention');
  assert.equal(campaign('?src=ski-show_2026'), 'ski-show_2026');
  assert.equal(campaign(''), '');
  assert.equal(campaign('?other=1'), '');
  assert.equal(campaign('?src=%3Cscript%3E'), '');
  assert.equal(campaign('?src=' + 'a'.repeat(41)), '');
});

test('App Store: ct=<src> and pt=<token> appended', () => {
  const u = new URL(appStoreUrl(APP, 'convention', '123456'));
  assert.equal(u.origin + u.pathname, APP);
  assert.equal(u.searchParams.get('ct'), 'convention');
  assert.equal(u.searchParams.get('pt'), '123456');
});

test('App Store: no campaign, no ct; no token, no pt', () => {
  assert.equal(appStoreUrl(APP, '', ''), APP);
  assert.equal(new URL(appStoreUrl(APP, 'convention', '')).searchParams.has('pt'), false);
});

test('Play: referrer=utm_source%3D<src>%26utm_medium%3Dqr, keeping the app id', () => {
  const url = playStoreUrl(PLAY, 'convention');
  assert.ok(url.includes('referrer=utm_source%3Dconvention%26utm_medium%3Dqr'), url);
  assert.equal(new URL(url).searchParams.get('id'), 'com.pistebuddy.app');
  assert.equal(playStoreUrl(PLAY, ''), PLAY);
});

test('decide: a phone whose store is live is redirected, with the campaign', () => {
  const ios = decide({ userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5 }, LIVE, '?src=convention');
  assert.equal(ios.action, 'redirect');
  assert.equal(new URL(ios.url).searchParams.get('ct'), 'convention');
  const android = decide({ userAgent: UA.android, maxTouchPoints: 5 }, LIVE, '?src=convention');
  assert.equal(android.action, 'redirect');
  assert.ok(android.url.includes('utm_source%3Dconvention'));
});

test('decide: a desktop gets the page with both links', () => {
  const d = decide({ userAgent: UA.desktopChrome, platform: 'Win32' }, LIVE, '?src=convention');
  assert.equal(d.action, 'page');
  assert.equal(d.platform, 'other');
  assert.ok(d.ios && d.android);
});

test('decide: a store not live yet is never redirected to -- the page shows "coming soon"', () => {
  const none = { appStoreUrl: '', playStoreUrl: '', appStoreProviderToken: '' };
  const d = decide({ userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5 }, none, '?src=convention');
  assert.deepEqual(d, { action: 'page', platform: 'ios', ios: '', android: '' });
  const half = decide({ userAgent: UA.android }, { ...none, appStoreUrl: APP }, '');
  assert.equal(half.action, 'page');
});

test('the <noscript> links in get/index.html match config.js', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'get', 'index.html'), 'utf8');
  const ns = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'));
  for (const [store, url] of [['ios', config.appStoreUrl], ['android', config.playStoreUrl]]) {
    const m = new RegExp(`<(a|span)[^>]*data-store="${store}"[^>]*>`).exec(ns);
    assert.ok(m, `no ${store} entry in <noscript>`);
    if (url) {
      assert.equal(m[1], 'a', `${store} is live in config.js but not linked in <noscript>`);
      assert.ok(m[0].includes(`href="${url}"`), `${store} <noscript> link differs from config.js`);
    } else {
      assert.equal(m[1], 'span', `${store} has no address in config.js but <noscript> links it`);
    }
  }
});
