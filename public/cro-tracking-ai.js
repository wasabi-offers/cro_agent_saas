/**
 * CRO Tracking + Attribution + AI Intelligence Script
 *
 * Extends the unified tracker with:
 *   - Semantic context collection (what user is reading, not just coordinates)
 *   - AI-powered real-time interventions (popups, CTA highlights, personalization)
 *   - Behavioral analysis pipeline (sends data to AI for intent classification)
 *
 * Install:
 *   <script>window.funnelId="YOUR_FUNNEL_ID"; window.funnelStep="Landing Page";</script>
 *   <script src="https://yoursite.com/cro-tracking-ai.js"></script>
 *
 * API:
 *   window.CROTracker.trackConversion(type, name, value)
 *   window.CROTracker.identify(externalId, traits)
 *   window.CROTracker.trackEvent(eventName, data)
 *   window.CROTracker.getUserId()
 *   window.CROTracker.getSessionId()
 *   window.CROTracker.getAttribution()
 *   window.CROTracker.getAIInsight()
 *   window.CROTracker.flush()
 */
(function () {
  'use strict';

  if (window.CROTracker) return;

  try {

  // ═══════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════

  var APP_BASE_URL = '';
  try {
    var currentScriptSrc = '';
    if (document.currentScript && document.currentScript.src) {
      currentScriptSrc = document.currentScript.src;
    } else {
      var allScripts = document.getElementsByTagName('script');
      for (var si = allScripts.length - 1; si >= 0; si--) {
        if (allScripts[si].src && allScripts[si].src.indexOf('cro-tracking-ai') > -1) {
          currentScriptSrc = allScripts[si].src;
          break;
        }
      }
    }
    if (currentScriptSrc) {
      var parsedUrl = new URL(currentScriptSrc);
      APP_BASE_URL = parsedUrl.origin;
    }
  } catch (_) {}
  if (!APP_BASE_URL) APP_BASE_URL = 'https://cro-agent.vercel.app';

  var SUPABASE_URL = window.croSupabaseUrl || '';
  var SUPABASE_ANON_KEY = window.croSupabaseKey || '';

  var CONFIG = {
    API_ENDPOINT: APP_BASE_URL + '/api/track',
    AI_ANALYZE_ENDPOINT: SUPABASE_URL + '/functions/v1/ai-analyze-behavior',
    AI_RECOMMEND_ENDPOINT: SUPABASE_URL + '/functions/v1/ai-recommend',

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
    ENGAGEMENT_TIMEOUT_MS: 30000,

    AI_ANALYZE_INTERVAL: 20000,
    AI_RECOMMEND_INTERVAL: 15000,
    AI_MIN_EVENTS_FOR_ANALYSIS: 5,
    AI_ENABLED: !!(SUPABASE_URL && SUPABASE_ANON_KEY)
  };

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
  // USER ID & SESSION
  // ═══════════════════════════════════════════

  function getOrCreateUserId() {
    var id = ls(CONFIG.USER_STORAGE_KEY) || getCookie(CONFIG.USER_COOKIE_NAME) || (window.croUserId || null);
    var isNew = !id;
    if (!id) id = generateId('usr');
    ls(CONFIG.USER_STORAGE_KEY, id);
    setCookie(CONFIG.USER_COOKIE_NAME, id, CONFIG.COOKIE_EXPIRY_DAYS);
    return { userId: id, isNewUser: isNew };
  }

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
  // SEMANTIC CONTEXT COLLECTOR (AI layer)
  // ═══════════════════════════════════════════

  var sectionTimers = {};
  var currentVisibleSection = null;

  function getVisibleSections() {
    var sections = document.querySelectorAll('section, [data-section], article, .section, [data-track-section]');
    var visible = [];
    var vpTop = window.scrollY;
    var vpBottom = vpTop + window.innerHeight;

    for (var i = 0; i < sections.length; i++) {
      var rect = sections[i].getBoundingClientRect();
      var elTop = rect.top + vpTop;
      var elBottom = elTop + rect.height;

      if (elBottom > vpTop && elTop < vpBottom) {
        var overlapTop = Math.max(vpTop, elTop);
        var overlapBottom = Math.min(vpBottom, elBottom);
        var visibility = (overlapBottom - overlapTop) / window.innerHeight;

        var heading = sections[i].querySelector('h1,h2,h3');
        var sectionId = sections[i].id || sections[i].dataset.section || sections[i].dataset.trackSection ||
                        (heading ? heading.textContent.trim().substring(0, 80) : 'section-' + i);

        visible.push({
          id: sectionId,
          visibility: Math.round(visibility * 100),
          element: sections[i]
        });
      }
    }

    return visible.sort(function(a, b) { return b.visibility - a.visibility; });
  }

  function trackSectionTime() {
    var sections = getVisibleSections();
    var topSection = sections.length > 0 ? sections[0] : null;
    var topId = topSection ? topSection.id : null;

    if (topId !== currentVisibleSection) {
      currentVisibleSection = topId;
    }

    if (topId) {
      if (!sectionTimers[topId]) sectionTimers[topId] = 0;
      sectionTimers[topId] += 1;
    }
  }

  setInterval(trackSectionTime, 1000);

  function captureSemanticContext() {
    var sections = getVisibleSections();
    var topSection = sections.length > 0 ? sections[0] : null;

    var priceEls = document.querySelectorAll('[data-price], .price, .pricing, [class*="price"]');
    var visiblePrice = null;
    for (var i = 0; i < priceEls.length; i++) {
      var r = priceEls[i].getBoundingClientRect();
      if (r.top >= 0 && r.top < window.innerHeight) {
        visiblePrice = priceEls[i].textContent.trim().substring(0, 50);
        break;
      }
    }

    var testimonialEls = document.querySelectorAll('[data-testimonial], .testimonial, .review, [class*="testimonial"]');
    var testimonialVisible = false;
    for (var j = 0; j < testimonialEls.length; j++) {
      var tr = testimonialEls[j].getBoundingClientRect();
      if (tr.top >= 0 && tr.top < window.innerHeight) {
        testimonialVisible = true;
        break;
      }
    }

    var formEls = document.querySelectorAll('form');
    var formVisible = false;
    for (var k = 0; k < formEls.length; k++) {
      var fr = formEls[k].getBoundingClientRect();
      if (fr.top >= 0 && fr.top < window.innerHeight) {
        formVisible = true;
        break;
      }
    }

    var visibleText = '';
    if (topSection && topSection.element) {
      var textNodes = topSection.element.querySelectorAll('p, li, h1, h2, h3, h4, span');
      var parts = [];
      for (var t = 0; t < Math.min(textNodes.length, 5); t++) {
        var txt = textNodes[t].textContent.trim();
        if (txt.length > 10) parts.push(txt.substring(0, 100));
      }
      visibleText = parts.join(' | ');
    }

    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var readingProgress = docH > 0 ? Math.round((window.scrollY / docH) * 100) : 0;

    return {
      current_section: topSection ? topSection.id : null,
      section_visibility: topSection ? topSection.visibility : 0,
      visible_content: visibleText.substring(0, 500),
      price_visible: !!visiblePrice,
      price_value: visiblePrice,
      testimonial_visible: testimonialVisible,
      form_visible: formVisible,
      reading_progress: Math.min(100, readingProgress),
      section_times: Object.assign({}, sectionTimers),
      sections_count: sections.length
    };
  }

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

  var eventQueue = [];
  var eventHistory = [];
  var touchpointOrder = 0;
  var sessionStartTime = Date.now();
  var lastActivityTime = Date.now();
  var maxScrollDepth = 0;
  var lastScrollPct = 0;
  var lastClickTime = 0;
  var lastClickTarget = null;
  var clickCount = 0;
  var engaged = false;

  var sessionCounters = {
    total_clicks: 0,
    cta_clicks: 0,
    rage_clicks: 0,
    dead_clicks: 0,
    form_interactions: 0,
    exit_intents: 0
  };

  var latestAIInsight = null;

  // ═══════════════════════════════════════════
  // TRACK EVENT (core)
  // ═══════════════════════════════════════════

  function trackEvent(type, data) {
    lastActivityTime = Date.now();
    engaged = true;
    touchpointOrder++;

    if (type === 'click' || type === 'cta_click') sessionCounters.total_clicks++;
    if (type === 'cta_click') sessionCounters.cta_clicks++;
    if (type === 'rage_click') sessionCounters.rage_clicks++;
    if (type === 'dead_click') sessionCounters.dead_clicks++;
    if (type === 'form_interaction' || type === 'form_submit') sessionCounters.form_interactions++;
    if (type === 'exit_intent') sessionCounters.exit_intents++;

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

    // Attach semantic context to significant events
    if (type === 'cta_click' || type === 'scroll' || type === 'form_submit' ||
        type === 'exit_intent' || type === 'conversion') {
      var ctx = captureSemanticContext();
      evt.section_topic = ctx.current_section;
      evt.visible_content = ctx.visible_content;
      evt.price_visible = ctx.price_visible;
      evt.price_value = ctx.price_value;
      evt.testimonial_visible = ctx.testimonial_visible;
      evt.form_visible = ctx.form_visible;
      evt.reading_progress = ctx.reading_progress;
    }

    eventQueue.push(evt);
    eventHistory.push({
      type: type,
      timestamp: evt.timestamp,
      click_x: evt.click_x,
      click_y: evt.click_y,
      element: evt.element,
      element_text: evt.element_text,
      scroll_percentage: evt.scroll_percentage,
      form_id: evt.form_id,
      field_name: evt.field_name,
      form_action: evt.form_action,
      section_topic: evt.section_topic
    });

    if (eventHistory.length > 100) eventHistory = eventHistory.slice(-100);
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
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).then(function (r) {
        if (!r.ok) {
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

  trackEvent('pageview', {});

  if (FUNNEL_ID && FUNNEL_STEP) {
    trackEvent('funnel_step', {
      step_name: FUNNEL_STEP,
      step_order: window.funnelStepOrder || 0
    });
  }

  // ═══════════════════════════════════════════
  // AUTOMATIC TRACKING: CRO BEHAVIORAL EVENTS
  // ═══════════════════════════════════════════

  // --- Clicks ---
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

  // --- Scroll ---
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

  // --- Mouse movement ---
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
  // AI: BEHAVIORAL ANALYSIS PIPELINE
  // ═══════════════════════════════════════════

  var lastAnalysisTime = 0;

  function sendToAIAnalysis() {
    if (!CONFIG.AI_ENABLED) return;
    if (eventHistory.length < CONFIG.AI_MIN_EVENTS_FOR_ANALYSIS) return;

    var now = Date.now();
    if (now - lastAnalysisTime < CONFIG.AI_ANALYZE_INTERVAL) return;
    lastAnalysisTime = now;

    var timeOnPage = Math.round((now - sessionStartTime) / 1000);
    var semantic = captureSemanticContext();

    var payload = {
      session_id: sessionId,
      user_id: userId,
      events: eventHistory.slice(-30),
      session_summary: {
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        source: currentAttribution.source,
        medium: currentAttribution.medium,
        campaign: currentAttribution.campaign,
        time_on_page: timeOnPage,
        max_scroll: maxScrollDepth,
        total_clicks: sessionCounters.total_clicks,
        cta_clicks: sessionCounters.cta_clicks,
        rage_clicks: sessionCounters.rage_clicks,
        dead_clicks: sessionCounters.dead_clicks,
        form_interactions: sessionCounters.form_interactions,
        exit_intents: sessionCounters.exit_intents
      },
      semantic_context: semantic
    };

    fetch(CONFIG.AI_ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    }).then(function(r) { return r.json(); }).then(function(data) {
      if (data.analysis) {
        latestAIInsight = data.analysis;
        console.log('[CRO AI] Analysis:', data.analysis.intent, '|', data.analysis.segment,
          '| Engagement:', data.analysis.engagement_score,
          '| Prediction:', data.analysis.predicted_action);
      }
    }).catch(function(err) {
      console.warn('[CRO AI] Analysis failed:', err.message || err);
    });
  }

  if (CONFIG.AI_ENABLED) {
    setInterval(sendToAIAnalysis, CONFIG.AI_ANALYZE_INTERVAL);
    setTimeout(sendToAIAnalysis, 10000);
  }

  // ═══════════════════════════════════════════
  // AI: REAL-TIME RECOMMENDATION POLLING
  // ═══════════════════════════════════════════

  var lastInterventionId = null;
  var interventionCooldown = {};

  function pollAIRecommendation() {
    if (!CONFIG.AI_ENABLED) return;

    var timeOnPage = Math.round((Date.now() - sessionStartTime) / 1000);

    fetch(CONFIG.AI_RECOMMEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        time_on_page: timeOnPage,
        scroll_depth: maxScrollDepth,
        cta_clicks: sessionCounters.cta_clicks,
        exit_intents: sessionCounters.exit_intents,
        rage_clicks: sessionCounters.rage_clicks,
        current_section: currentVisibleSection
      })
    }).then(function(r) { return r.json(); }).then(function(data) {
      if (data.action && data.action !== 'none') {
        var actionKey = data.action;
        var now = Date.now();

        if (interventionCooldown[actionKey] && (now - interventionCooldown[actionKey]) < 60000) {
          return;
        }

        interventionCooldown[actionKey] = now;
        executeIntervention(data.action, data.params || {}, data.source || 'unknown');
      }
    }).catch(function() {});
  }

  if (CONFIG.AI_ENABLED) {
    setInterval(pollAIRecommendation, CONFIG.AI_RECOMMEND_INTERVAL);
    setTimeout(pollAIRecommendation, 20000);
  }

  // ═══════════════════════════════════════════
  // AI: INTERVENTION EXECUTOR
  // ═══════════════════════════════════════════

  function executeIntervention(action, params, source) {
    console.log('[CRO AI] Executing intervention:', action, params, '(source:', source + ')');

    trackEvent('ai_intervention', {
      intervention_type: action,
      intervention_params: params,
      intervention_source: source
    });

    switch (action) {
      case 'show_social_proof':
        showSocialProofToast(params);
        break;
      case 'highlight_cta':
        highlightCTA(params);
        break;
      case 'show_exit_offer':
        showExitOfferModal(params);
        break;
      case 'show_urgency':
        showUrgencyBanner(params);
        break;
      case 'show_guarantee':
        showGuaranteeBadge(params);
        break;
      case 'show_help':
        showHelpWidget(params);
        break;
      default:
        console.log('[CRO AI] Unknown intervention:', action);
    }
  }

  function injectStyles() {
    if (document.getElementById('cro-ai-styles')) return;
    var style = document.createElement('style');
    style.id = 'cro-ai-styles';
    style.textContent = [
      '.cro-ai-toast{position:fixed;bottom:20px;left:20px;background:#fff;border-radius:12px;',
      'box-shadow:0 8px 32px rgba(0,0,0,.15);padding:16px 20px;max-width:320px;z-index:99999;',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:#333;',
      'transform:translateY(120%);transition:transform .4s cubic-bezier(.22,1,.36,1);border-left:4px solid #4f46e5}',
      '.cro-ai-toast.show{transform:translateY(0)}',
      '.cro-ai-toast-close{position:absolute;top:8px;right:12px;background:none;border:none;',
      'font-size:18px;cursor:pointer;color:#999;line-height:1}',
      '.cro-ai-toast-title{font-weight:600;margin-bottom:4px;font-size:13px;color:#4f46e5}',
      '.cro-ai-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;',
      'background:rgba(0,0,0,.5);z-index:99998;display:flex;align-items:center;justify-content:center;',
      'opacity:0;transition:opacity .3s}',
      '.cro-ai-modal-overlay.show{opacity:1}',
      '.cro-ai-modal{background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;',
      'text-align:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;',
      'transform:scale(.9);transition:transform .3s}',
      '.cro-ai-modal-overlay.show .cro-ai-modal{transform:scale(1)}',
      '.cro-ai-modal h3{margin:0 0 8px;font-size:22px;color:#111}',
      '.cro-ai-modal p{margin:0 0 20px;color:#555;font-size:15px}',
      '.cro-ai-modal-btn{display:inline-block;background:#4f46e5;color:#fff;border:none;',
      'padding:12px 28px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;',
      'transition:background .2s}',
      '.cro-ai-modal-btn:hover{background:#4338ca}',
      '.cro-ai-modal-dismiss{display:block;margin-top:12px;background:none;border:none;',
      'color:#999;font-size:13px;cursor:pointer}',
      '@keyframes cro-pulse{0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,.4)}',
      '50%{box-shadow:0 0 0 12px rgba(79,70,229,0)}}',
      '.cro-ai-pulse{animation:cro-pulse 1.5s ease-in-out 3}',
      '.cro-ai-banner{position:fixed;top:0;left:0;width:100%;background:#fef3c7;',
      'color:#92400e;text-align:center;padding:10px 16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;',
      'font-size:14px;font-weight:500;z-index:99997;transform:translateY(-100%);transition:transform .3s}',
      '.cro-ai-banner.show{transform:translateY(0)}'
    ].join('');
    document.head.appendChild(style);
  }

  function showSocialProofToast(params) {
    injectStyles();
    var toast = document.createElement('div');
    toast.className = 'cro-ai-toast';
    toast.innerHTML = '<button class="cro-ai-toast-close" aria-label="Close">&times;</button>' +
      '<div class="cro-ai-toast-title">' + (params.title || 'Recent Activity') + '</div>' +
      '<div>' + (params.message || 'Someone just made a purchase!') + '</div>';
    document.body.appendChild(toast);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() { toast.classList.add('show'); });
    });

    toast.querySelector('.cro-ai-toast-close').addEventListener('click', function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 400);
      trackEvent('ai_intervention_response', { intervention_type: 'show_social_proof', response: 'dismissed' });
    });

    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 400);
    }, 8000);
  }

  function highlightCTA(params) {
    injectStyles();
    var selector = params.selector || 'button, a.cta, [class*="cta"], [data-cta]';
    var targets = document.querySelectorAll(selector);
    var scrollY = window.scrollY;
    var vpHeight = window.innerHeight;

    for (var i = 0; i < targets.length; i++) {
      var rect = targets[i].getBoundingClientRect();
      var elTop = rect.top + scrollY;
      if (elTop >= scrollY && elTop <= scrollY + vpHeight) {
        targets[i].classList.add('cro-ai-pulse');
        (function(el) {
          setTimeout(function() { el.classList.remove('cro-ai-pulse'); }, 5000);
        })(targets[i]);
        break;
      }
    }
  }

  function showExitOfferModal(params) {
    injectStyles();
    if (document.querySelector('.cro-ai-modal-overlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'cro-ai-modal-overlay';
    overlay.innerHTML =
      '<div class="cro-ai-modal">' +
        '<h3>' + (params.headline || 'Wait! Special Offer') + '</h3>' +
        '<p>' + (params.message || 'Get 10% off your order today.') + '</p>' +
        '<button class="cro-ai-modal-btn">' + (params.cta_text || 'Claim Offer') + '</button>' +
        '<button class="cro-ai-modal-dismiss">No thanks</button>' +
      '</div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() { overlay.classList.add('show'); });
    });

    overlay.querySelector('.cro-ai-modal-btn').addEventListener('click', function() {
      trackEvent('ai_intervention_response', { intervention_type: 'show_exit_offer', response: 'accepted' });
      overlay.classList.remove('show');
      setTimeout(function() { overlay.remove(); }, 300);
    });

    overlay.querySelector('.cro-ai-modal-dismiss').addEventListener('click', function() {
      trackEvent('ai_intervention_response', { intervention_type: 'show_exit_offer', response: 'dismissed' });
      overlay.classList.remove('show');
      setTimeout(function() { overlay.remove(); }, 300);
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        setTimeout(function() { overlay.remove(); }, 300);
      }
    });
  }

  function showUrgencyBanner(params) {
    injectStyles();
    if (document.querySelector('.cro-ai-banner')) return;

    var banner = document.createElement('div');
    banner.className = 'cro-ai-banner';
    banner.innerHTML = (params.message || 'Limited time offer - ends soon!') +
      ' <button style="background:none;border:none;color:#92400e;font-weight:700;cursor:pointer;text-decoration:underline;font-size:14px">' +
      (params.cta_text || 'Get it now') + '</button>';
    document.body.appendChild(banner);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() { banner.classList.add('show'); });
    });

    setTimeout(function() {
      banner.classList.remove('show');
      setTimeout(function() { banner.remove(); }, 300);
    }, 15000);
  }

  function showGuaranteeBadge(params) {
    injectStyles();
    showSocialProofToast({
      title: 'Your Purchase is Protected',
      message: params.message || '30-day money-back guarantee. No questions asked.'
    });
  }

  function showHelpWidget(params) {
    injectStyles();
    showSocialProofToast({
      title: 'Need Help?',
      message: params.message || 'Click here to chat with our support team.'
    });
  }

  // ═══════════════════════════════════════════
  // FLUSH LIFECYCLE
  // ═══════════════════════════════════════════

  setInterval(flushEvents, CONFIG.FLUSH_INTERVAL);

  window.addEventListener('beforeunload', function () {
    if (eventQueue.length > 0) {
      try {
        var remaining = eventQueue.slice();
        eventQueue = [];
        var blob = new Blob([JSON.stringify({ events: remaining })], { type: 'application/json' });
        navigator.sendBeacon(CONFIG.API_ENDPOINT, blob);
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
    getAIInsight: function () { return latestAIInsight; },
    getSessionCounters: function () { return Object.assign({}, sessionCounters); },
    trackConversion: window.croTrackConversion,
    identify: window.croIdentify,
    trackEvent: window.croTrackEvent,
    flush: flushEvents,
    isReady: true,
    aiEnabled: CONFIG.AI_ENABLED
  };

  window.dispatchEvent(new Event('cro-tracker-ready'));

  console.log('[CRO AI] Tracking + Attribution + AI initialized');
  console.log('[CRO AI] API:', CONFIG.API_ENDPOINT);
  console.log('[CRO AI] User:', userId, '| Session:', sessionId);
  console.log('[CRO AI] Source:', currentAttribution.source + '/' + currentAttribution.medium);
  console.log('[CRO AI] AI:', CONFIG.AI_ENABLED ? 'ENABLED' : 'DISABLED (set window.croSupabaseUrl & window.croSupabaseKey)');
  if (FUNNEL_ID) console.log('[CRO AI] Funnel:', FUNNEL_ID, '→', FUNNEL_STEP);

  } catch (err) {
    console.error('[CRO AI] Init failed:', err);
  }
})();
