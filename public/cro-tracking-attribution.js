/**
 * CRO Tracking + Attribution Script (Unified)
 *
 * Single script that handles BOTH:
 *   - Attribution: persistent user ID, first/last touch, UTM, referrer, conversions
 *   - CRO Tracking: clicks, scroll, mouse heatmap, rage/dead clicks, forms, exit intent, time
 *
 * Install:
 *   <script>window.funnelId="YOUR_FUNNEL_ID"; window.funnelStep="Landing Page";</script>
 *   <script src="https://yoursite.com/cro-tracking-attribution.js"></script>
 *
 * API:
 *   window.CROTracker.trackConversion(type, name, value)
 *   window.CROTracker.identify(externalId, traits)
 *   window.CROTracker.trackEvent(eventName, data)
 *   window.CROTracker.getUserId()
 *   window.CROTracker.getSessionId()
 *   window.CROTracker.getAttribution()
 *   window.CROTracker.flush()
 */
(function () {
  'use strict';

  if (window.CROTracker) return;

  try {

  // ═══════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════
  var CONFIG = {
    SUPABASE_URL: 'https://dohrkonencbwvvmklzuo.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHJrb25lbmNid3Z2bWtsenVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTAwNTUsImV4cCI6MjA4MzI2NjA1NX0.k2N-H_p-a4FHaOvq7V4u_uXkx45XIY-LZt0RoIJpjmU',
    API_ENDPOINT: null,

    USER_STORAGE_KEY: 'cro_user_id',
    USER_COOKIE_NAME: 'cro_uid',
    SESSION_STORAGE_KEY: 'cro_session_id',
    ATTRIBUTION_KEY: 'cro_attribution',

    COOKIE_EXPIRY_DAYS: 730,
    BATCH_SIZE: 20,
    FLUSH_INTERVAL: 5000,
    MOUSE_THROTTLE_MS: 500,
    SCROLL_THRESHOLD_PCT: 25,
    RAGE_CLICK_WINDOW_MS: 1000,
    RAGE_CLICK_MIN: 3,
    TIME_INTERVAL_S: 30,
    ENGAGEMENT_TIMEOUT_MS: 30000
  };
  CONFIG.API_ENDPOINT = CONFIG.SUPABASE_URL + '/functions/v1/track-event';

  // ═══════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════

  function generateId(prefix) {
    var ts = Date.now().toString(36);
    var rand = Math.random().toString(36).substring(2, 11);
    var extra = '';
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        extra = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      }
    } catch (_) {}
    if (!extra) extra = Math.random().toString(36).substring(2, 10);
    return prefix + '_' + ts + '_' + rand + extra;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax' + secure;
  }

  function getCookie(name) {
    var eq = name + '=';
    var parts = document.cookie.split(';');
    for (var i = 0; i < parts.length; i++) {
      var c = parts[i].trim();
      if (c.indexOf(eq) === 0) return decodeURIComponent(c.substring(eq.length));
    }
    return null;
  }

  function ls(key, value) {
    try {
      if (arguments.length === 1) return localStorage.getItem(key);
      localStorage.setItem(key, value);
      return true;
    } catch (_) { return null; }
  }

  function ss(key, value) {
    try {
      if (arguments.length === 1) return sessionStorage.getItem(key);
      sessionStorage.setItem(key, value);
      return true;
    } catch (_) { return null; }
  }

  // ═══════════════════════════════════════════
  // USER ID  (persistent: localStorage → cookie → new)
  // ═══════════════════════════════════════════

  function getOrCreateUserId() {
    var id = ls(CONFIG.USER_STORAGE_KEY) || getCookie(CONFIG.USER_COOKIE_NAME) || (window.croUserId || null);
    var isNew = !id;
    if (!id) id = generateId('usr');
    ls(CONFIG.USER_STORAGE_KEY, id);
    setCookie(CONFIG.USER_COOKIE_NAME, id, CONFIG.COOKIE_EXPIRY_DAYS);
    return { userId: id, isNewUser: isNew };
  }

  // ═══════════════════════════════════════════
  // SESSION ID  (per-tab: sessionStorage → new)
  // ═══════════════════════════════════════════

  function getOrCreateSessionId() {
    var id = ss(CONFIG.SESSION_STORAGE_KEY);
    var isNew = !id;
    if (!id) { id = generateId('sess'); ss(CONFIG.SESSION_STORAGE_KEY, id); }
    return { sessionId: id, isNewSession: isNew };
  }

  // ═══════════════════════════════════════════
  // DEVICE DETECTION
  // ═══════════════════════════════════════════

  function detectDevice() {
    var ua = navigator.userAgent;
    var mob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    var tab = /iPad|Android(?!.*Mobile)/i.test(ua);

    function browser() {
      if (ua.indexOf('Firefox') > -1) return 'Firefox';
      if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung';
      if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
      if (ua.indexOf('Trident') > -1) return 'IE';
      if (ua.indexOf('Edg') > -1) return 'Edge';
      if (ua.indexOf('Chrome') > -1) return 'Chrome';
      if (ua.indexOf('Safari') > -1) return 'Safari';
      return 'Unknown';
    }

    function os() {
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
      if (ua.indexOf('Android') > -1) return 'Android';
      if (ua.indexOf('Win') > -1) return 'Windows';
      if (ua.indexOf('Mac') > -1) return 'MacOS';
      if (ua.indexOf('Linux') > -1) return 'Linux';
      return 'Unknown';
    }

    var tz = 'unknown';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) {}

    return {
      device_type: mob ? 'mobile' : tab ? 'tablet' : 'desktop',
      browser: browser(),
      os: os(),
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      language: navigator.language || 'unknown',
      timezone: tz
    };
  }

  function generateFingerprint(dev) {
    var gl, vendor = 'unknown';
    try {
      var c = document.createElement('canvas');
      gl = c.getContext('webgl');
      if (gl) vendor = gl.getParameter(gl.VENDOR);
    } catch (_) {}
    var str = [dev.browser, dev.os, dev.screen_width + 'x' + dev.screen_height,
      dev.timezone, dev.language, navigator.hardwareConcurrency || 'u', vendor].join('|');
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; }
    return 'fp_' + Math.abs(h).toString(36);
  }

  // ═══════════════════════════════════════════
  // ATTRIBUTION DATA
  // ═══════════════════════════════════════════

  function extractUTMParams() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source'),
      utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
      utm_content: p.get('utm_content'),
      utm_term: p.get('utm_term'),
      gclid: p.get('gclid'),
      fbclid: p.get('fbclid'),
      ttclid: p.get('ttclid')
    };
  }

  function parseReferrer() {
    var ref = document.referrer;
    if (!ref) return { source: 'direct', medium: 'none', referrer: null };
    try {
      var h = new URL(ref).hostname.toLowerCase();
      var map = [
        [['facebook.com','fb.com'], 'facebook', 'social'],
        [['instagram.com'], 'instagram', 'social'],
        [['twitter.com','x.com'], 'twitter', 'social'],
        [['linkedin.com'], 'linkedin', 'social'],
        [['tiktok.com'], 'tiktok', 'social'],
        [['youtube.com'], 'youtube', 'social'],
        [['pinterest.com'], 'pinterest', 'social'],
        [['google.'], 'google', 'organic'],
        [['bing.com'], 'bing', 'organic'],
        [['yahoo.com'], 'yahoo', 'organic'],
        [['duckduckgo.com'], 'duckduckgo', 'organic'],
        [['mail.google.com','outlook.'], null, 'email']
      ];
      for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i][0].length; j++) {
          if (h.includes(map[i][0][j])) {
            return { source: map[i][1] || h, medium: map[i][2], referrer: ref };
          }
        }
      }
      return { source: h, medium: 'referral', referrer: ref };
    } catch (_) { return { source: 'unknown', medium: 'referral', referrer: ref }; }
  }

  function buildAttribution() {
    var utm = extractUTMParams();
    var ref = parseReferrer();
    var hasUtm = utm.utm_source || utm.utm_medium;
    return {
      source: utm.utm_source || ref.source || 'direct',
      medium: utm.utm_medium || ref.medium || 'none',
      campaign: utm.utm_campaign || null,
      content: utm.utm_content || null,
      term: utm.utm_term || null,
      referrer: ref.referrer || document.referrer || null,
      landing_page: window.location.href,
      landing_path: window.location.pathname,
      gclid: utm.gclid || null,
      fbclid: utm.fbclid || null,
      ttclid: utm.ttclid || null
    };
  }

  function loadFirstTouch() {
    var s = ls(CONFIG.ATTRIBUTION_KEY);
    if (s) try { return JSON.parse(s); } catch (_) {}
    return null;
  }

  function saveFirstTouch(a) { ls(CONFIG.ATTRIBUTION_KEY, JSON.stringify(a)); }

  // ═══════════════════════════════════════════
  // INIT STATE
  // ═══════════════════════════════════════════

  var user = getOrCreateUserId();
  var userId = user.userId;
  var isNewUser = user.isNewUser;

  var session = getOrCreateSessionId();
  var sessionId = session.sessionId;
  var isNewSession = session.isNewSession;

  var deviceInfo = detectDevice();
  var fingerprint = generateFingerprint(deviceInfo);
  var currentAttribution = buildAttribution();

  var firstTouchAttribution = loadFirstTouch();
  if (!firstTouchAttribution) {
    firstTouchAttribution = currentAttribution;
    saveFirstTouch(currentAttribution);
  }

  // Funnel config
  var FUNNEL_ID = window.funnelId || ss('funnel_id') || null;
  var FUNNEL_STEP = window.funnelStep || null;
  if (FUNNEL_ID) ss('funnel_id', FUNNEL_ID);

  function getStepName() {
    if (FUNNEL_STEP) return FUNNEL_STEP;
    var p = new URLSearchParams(window.location.search);
    var s = p.get('step');
    if (s) return s;
    return document.title || 'Page ' + window.location.pathname;
  }
  FUNNEL_STEP = getStepName();

  // Tracking state
  var eventQueue = [];
  var touchpointOrder = 0;
  var sessionStartTime = Date.now();
  var lastActivityTime = Date.now();
  var maxScrollDepth = 0;
  var lastScrollPct = 0;
  var lastClickTime = 0;
  var lastClickTarget = null;
  var clickCount = 0;
  var engaged = false;

  // ═══════════════════════════════════════════
  // TRACK EVENT  (core — flat snake_case)
  // ═══════════════════════════════════════════

  function trackEvent(type, data) {
    lastActivityTime = Date.now();
    engaged = true;
    touchpointOrder++;

    var evt = {
      user_id: userId,
      session_id: sessionId,
      is_new_user: isNewUser,
      is_new_session: isNewSession,
      device_fingerprint: fingerprint,

      type: type,
      touchpoint_order: touchpointOrder,
      timestamp: Date.now(),

      url: window.location.href,
      path: window.location.pathname,
      title: document.title,

      first_touch_source: firstTouchAttribution.source,
      first_touch_medium: firstTouchAttribution.medium,
      first_touch_campaign: firstTouchAttribution.campaign,
      first_touch_content: firstTouchAttribution.content,
      first_touch_term: firstTouchAttribution.term,

      source: currentAttribution.source,
      medium: currentAttribution.medium,
      campaign: currentAttribution.campaign,
      content: currentAttribution.content,
      term: currentAttribution.term,
      referrer: currentAttribution.referrer,
      gclid: currentAttribution.gclid,
      fbclid: currentAttribution.fbclid,
      ttclid: currentAttribution.ttclid,

      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
      language: deviceInfo.language,
      timezone: deviceInfo.timezone,

      funnel_id: FUNNEL_ID,
      funnel_step_name: FUNNEL_STEP
    };

    if (data) {
      var keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) evt[keys[i]] = data[keys[i]];
    }

    eventQueue.push(evt);

    if (eventQueue.length >= CONFIG.BATCH_SIZE) flushEvents();
  }

  // ═══════════════════════════════════════════
  // FLUSH TO SERVER
  // ═══════════════════════════════════════════

  function flushEvents() {
    if (eventQueue.length === 0) return;
    var batch = eventQueue.slice();
    eventQueue = [];
    var payload = JSON.stringify({ events: batch });

    try {
      fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY
        },
        body: payload,
        keepalive: true
      }).then(function (r) {
        if (!r.ok) {
          console.error('[CRO] Send failed HTTP', r.status);
          eventQueue = batch.concat(eventQueue);
        }
      }).catch(function () {
        eventQueue = batch.concat(eventQueue);
      });
    } catch (_) {
      try {
        var blob = new Blob([payload], { type: 'application/json' });
        if (!navigator.sendBeacon(CONFIG.API_ENDPOINT, blob)) {
          eventQueue = batch.concat(eventQueue);
        }
      } catch (__) {
        eventQueue = batch.concat(eventQueue);
      }
    }
  }

  // ═══════════════════════════════════════════
  // AUTOMATIC TRACKING: ATTRIBUTION EVENTS
  // ═══════════════════════════════════════════

  // Pageview
  trackEvent('pageview', {});

  // Funnel step
  if (FUNNEL_ID && FUNNEL_STEP) {
    trackEvent('funnel_step', {
      step_name: FUNNEL_STEP,
      step_order: window.funnelStepOrder || 0
    });
  }

  // ═══════════════════════════════════════════
  // AUTOMATIC TRACKING: CRO BEHAVIORAL EVENTS
  // ═══════════════════════════════════════════

  // --- Clicks (heatmap + CTA detection + rage/dead) ---
  document.addEventListener('click', function (e) {
    var x = typeof e.pageX === 'number' ? e.pageX : e.clientX + (window.scrollX || 0);
    var y = typeof e.pageY === 'number' ? e.pageY : e.clientY + (window.scrollY || 0);
    var el = e.target;
    var isCta = el.tagName === 'BUTTON' || el.tagName === 'A' ||
      (el.closest && (el.closest('button') !== null || el.closest('a') !== null));
    var text = (el.innerText || '').substring(0, 100);
    var href = el.href || (el.closest && el.closest('a') ? el.closest('a').href : null);

    var clickData = {
      click_x: Math.round(x),
      click_y: Math.round(y),
      element: el.tagName,
      element_id: el.id || null,
      element_class: (typeof el.className === 'string' ? el.className : '') || null,
      element_text: text,
      is_cta_click: isCta,
      href: href || null
    };

    trackEvent(isCta ? 'cta_click' : 'click', clickData);

    // Rage click detection
    var now = Date.now();
    if (lastClickTarget === el && (now - lastClickTime) < CONFIG.RAGE_CLICK_WINDOW_MS) {
      clickCount++;
      if (clickCount >= CONFIG.RAGE_CLICK_MIN) {
        trackEvent('rage_click', {
          click_x: Math.round(x),
          click_y: Math.round(y),
          element: el.tagName,
          element_id: el.id || null,
          element_text: text,
          click_count: clickCount
        });
        clickCount = 0;
      }
    } else {
      clickCount = 1;
    }
    lastClickTime = now;
    lastClickTarget = el;

    // Dead click detection
    if (!isCta && el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA') {
      var interactive = el.onclick || (el.style && el.style.cursor === 'pointer') ||
        el.getAttribute('role') === 'button' || el.getAttribute('tabindex');
      if (!interactive) {
        trackEvent('dead_click', {
          click_x: Math.round(x),
          click_y: Math.round(y),
          element: el.tagName,
          element_id: el.id || null,
          element_class: (typeof el.className === 'string' ? el.className : '') || null,
          element_text: text
        });
      }
    }
  }, true);

  // --- Scroll depth ---
  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return;
    var pct = Math.round((scrollY / docH) * 100);
    if (pct > maxScrollDepth) maxScrollDepth = pct;

    if (Math.abs(pct - lastScrollPct) >= CONFIG.SCROLL_THRESHOLD_PCT) {
      trackEvent('scroll', {
        scroll_depth: Math.round(scrollY),
        scroll_percentage: Math.min(100, pct),
        max_scroll_depth: maxScrollDepth
      });
      lastScrollPct = pct;
    }
  });

  // --- Mouse movement (heatmap) ---
  var lastMouseTs = 0;
  document.addEventListener('mousemove', function (e) {
    var now = Date.now();
    if (now - lastMouseTs < CONFIG.MOUSE_THROTTLE_MS) return;
    lastMouseTs = now;

    var mx = typeof e.pageX === 'number' ? e.pageX : e.clientX + (window.scrollX || 0);
    var my = typeof e.pageY === 'number' ? e.pageY : e.clientY + (window.scrollY || 0);
    var speed = Math.round(Math.sqrt((e.movementX || 0) * (e.movementX || 0) +
      (e.movementY || 0) * (e.movementY || 0)));

    trackEvent('mousemove', {
      mouse_x: Math.round(mx),
      mouse_y: Math.round(my),
      mouse_speed: speed
    });
  });

  // --- Form tracking ---
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      var form = el.closest ? el.closest('form') : null;
      trackEvent('form_interaction', {
        form_id: form ? (form.id || null) : null,
        form_name: form ? (form.name || null) : null,
        field_name: el.name || el.id || null,
        field_type: el.type || el.tagName.toLowerCase(),
        form_action: 'focus'
      });
    }
  }, true);

  document.addEventListener('submit', function (e) {
    if (e.target.tagName === 'FORM') {
      trackEvent('form_submit', {
        form_id: e.target.id || null,
        form_name: e.target.name || null,
        form_action_url: e.target.action || null
      });
    }
  }, true);

  // --- Exit intent ---
  var exitTracked = false;
  document.addEventListener('mouseout', function (e) {
    if (!exitTracked && e.clientY < 0) {
      exitTracked = true;
      trackEvent('exit_intent', {});
      setTimeout(function () { exitTracked = false; }, 5000);
    }
  });

  // --- Time on page ---
  setInterval(function () {
    var t = Math.round((Date.now() - sessionStartTime) / 1000);
    var isEngaged = engaged && (Date.now() - lastActivityTime) < CONFIG.ENGAGEMENT_TIMEOUT_MS;
    trackEvent('time_on_page', {
      time_on_page: t,
      engaged: isEngaged,
      max_scroll_depth: maxScrollDepth
    });
  }, CONFIG.TIME_INTERVAL_S * 1000);

  // ═══════════════════════════════════════════
  // FLUSH LIFECYCLE
  // ═══════════════════════════════════════════

  setInterval(flushEvents, CONFIG.FLUSH_INTERVAL);

  window.addEventListener('beforeunload', function () {
    if (eventQueue.length > 0) {
      try {
        var blob = new Blob([JSON.stringify({ events: eventQueue })], { type: 'application/json' });
        navigator.sendBeacon(CONFIG.API_ENDPOINT + '?apikey=' + CONFIG.SUPABASE_ANON_KEY, blob);
      } catch (_) {
        flushEvents();
      }
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) flushEvents();
  });

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  window.croTrackConversion = function (conversionType, conversionName, conversionValue) {
    trackEvent('conversion', {
      conversion_type: conversionType || 'purchase',
      conversion_name: conversionName || 'Conversion',
      conversion_value: parseFloat(conversionValue) || 0,
      is_conversion: true
    });
    flushEvents();
  };

  window.croIdentify = function (externalId, traits) {
    trackEvent('identify', {
      external_id: externalId,
      traits: traits || {}
    });
    flushEvents();
  };

  window.croTrackEvent = function (eventName, eventData) {
    trackEvent('custom', {
      event_name: eventName,
      event_data: eventData || {}
    });
  };

  window.CROTracker = {
    getUserId: function () { return userId; },
    getSessionId: function () { return sessionId; },
    getAttribution: function () { return currentAttribution; },
    getFirstTouch: function () { return firstTouchAttribution; },
    getDeviceInfo: function () { return deviceInfo; },
    getFunnelId: function () { return FUNNEL_ID; },
    getFunnelStep: function () { return FUNNEL_STEP; },
    trackConversion: window.croTrackConversion,
    identify: window.croIdentify,
    trackEvent: window.croTrackEvent,
    flush: flushEvents,
    isReady: true
  };

  window.dispatchEvent(new Event('cro-tracker-ready'));

  console.log('[CRO] Tracking + Attribution initialized');
  console.log('[CRO] User:', userId, '| Session:', sessionId);
  console.log('[CRO] First touch:', firstTouchAttribution.source + '/' + firstTouchAttribution.medium);
  console.log('[CRO] Current:', currentAttribution.source + '/' + currentAttribution.medium);
  console.log('[CRO] Device:', deviceInfo.device_type, '/', deviceInfo.browser);
  if (FUNNEL_ID) console.log('[CRO] Funnel:', FUNNEL_ID, '→', FUNNEL_STEP);

  } catch (err) {
    console.error('[CRO] Init failed:', err);
  }
})();
