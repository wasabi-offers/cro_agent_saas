/**
 * CRO Agent Attribution Tracking Script
 * First-Party Data with Persistent User ID
 * 
 * Features:
 * - Persistent User ID (localStorage + first-party cookie)
 * - Multi-touch attribution tracking
 * - UTM parameter capture
 * - Cross-session user identification
 * - Conversion tracking
 */
(function() {
  'use strict';

  try {
    console.log('[CRO Attribution] 🚀 Initializing...');

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
      SUPABASE_URL: "https://dohrkonencbwvvmklzuo.supabase.co",
      SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHJrb25lbmNid3Z2bWtsenVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTAwNTUsImV4cCI6MjA4MzI2NjA1NX0.k2N-H_p-a4FHaOvq7V4u_uXkx45XIY-LZt0RoIJpjmU",
      API_ENDPOINT: null, // Set below
      
      // Storage keys
      USER_STORAGE_KEY: 'cro_user_id',
      USER_COOKIE_NAME: 'cro_uid',
      SESSION_STORAGE_KEY: 'cro_session_id',
      ATTRIBUTION_KEY: 'cro_attribution',
      
      // Cookie settings
      COOKIE_EXPIRY_DAYS: 730, // 2 years
      
      // Batching
      BATCH_SIZE: 20,
      FLUSH_INTERVAL: 5000,
      
      // Features
      ENABLE_HEATMAP: true,
      ENABLE_SCROLL: true,
      ENABLE_FORMS: true
    };
    
    CONFIG.API_ENDPOINT = CONFIG.SUPABASE_URL + "/functions/v1/track-event";

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    // Generate unique ID
    function generateId(prefix) {
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 11);
      const cryptoRandom = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID().replace(/-/g, '').substring(0, 8)
        : Math.random().toString(36).substring(2, 10);
      return prefix + '_' + timestamp + '_' + randomPart + cryptoRandom;
    }

    // Cookie management
    function setCookie(name, value, days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + date.toUTCString();
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax" + secure;
    }

    function getCookie(name) {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i].trim();
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length));
        }
      }
      return null;
    }

    // LocalStorage with fallback
    function getStorage(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    }

    function setStorage(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    }

    function getSessionStorage(key) {
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        return null;
      }
    }

    function setSessionStorage(key, value) {
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    }

    // ============================================
    // USER ID MANAGEMENT (Persistent)
    // ============================================
    
    function getOrCreateUserId() {
      // 1. Try localStorage first
      let userId = getStorage(CONFIG.USER_STORAGE_KEY);
      
      // 2. Try cookie as fallback
      if (!userId) {
        userId = getCookie(CONFIG.USER_COOKIE_NAME);
      }
      
      // 3. Check if passed via window
      if (!userId && window.croUserId) {
        userId = window.croUserId;
      }
      
      // 4. Generate new if not found
      const isNewUser = !userId;
      if (!userId) {
        userId = generateId('usr');
        console.log('[CRO Attribution] 🆕 New user created:', userId);
      } else {
        console.log('[CRO Attribution] 👤 Existing user:', userId);
      }
      
      // 5. Save in both localStorage and cookie (redundancy)
      setStorage(CONFIG.USER_STORAGE_KEY, userId);
      setCookie(CONFIG.USER_COOKIE_NAME, userId, CONFIG.COOKIE_EXPIRY_DAYS);
      
      return { userId, isNewUser };
    }

    // ============================================
    // SESSION ID MANAGEMENT (Per-session)
    // ============================================
    
    function getOrCreateSessionId() {
      let sessionId = getSessionStorage(CONFIG.SESSION_STORAGE_KEY);
      
      const isNewSession = !sessionId;
      if (!sessionId) {
        sessionId = generateId('sess');
        setSessionStorage(CONFIG.SESSION_STORAGE_KEY, sessionId);
        console.log('[CRO Attribution] 🔄 New session:', sessionId);
      }
      
      return { sessionId, isNewSession };
    }

    // ============================================
    // ATTRIBUTION DATA
    // ============================================
    
    function extractUTMParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        utm_source: params.get('utm_source') || null,
        utm_medium: params.get('utm_medium') || null,
        utm_campaign: params.get('utm_campaign') || null,
        utm_content: params.get('utm_content') || null,
        utm_term: params.get('utm_term') || null,
        gclid: params.get('gclid') || null, // Google Ads
        fbclid: params.get('fbclid') || null, // Facebook
        ttclid: params.get('ttclid') || null, // TikTok
      };
    }

    function parseReferrer() {
      const referrer = document.referrer;
      if (!referrer) return { source: 'direct', medium: 'none', referrer: null };
      
      try {
        const url = new URL(referrer);
        const hostname = url.hostname.toLowerCase();
        
        // Social networks
        if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
          return { source: 'facebook', medium: 'social', referrer };
        }
        if (hostname.includes('instagram.com')) {
          return { source: 'instagram', medium: 'social', referrer };
        }
        if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
          return { source: 'twitter', medium: 'social', referrer };
        }
        if (hostname.includes('linkedin.com')) {
          return { source: 'linkedin', medium: 'social', referrer };
        }
        if (hostname.includes('tiktok.com')) {
          return { source: 'tiktok', medium: 'social', referrer };
        }
        if (hostname.includes('youtube.com')) {
          return { source: 'youtube', medium: 'social', referrer };
        }
        if (hostname.includes('pinterest.com')) {
          return { source: 'pinterest', medium: 'social', referrer };
        }
        
        // Search engines
        if (hostname.includes('google.')) {
          return { source: 'google', medium: 'organic', referrer };
        }
        if (hostname.includes('bing.com')) {
          return { source: 'bing', medium: 'organic', referrer };
        }
        if (hostname.includes('yahoo.com')) {
          return { source: 'yahoo', medium: 'organic', referrer };
        }
        if (hostname.includes('duckduckgo.com')) {
          return { source: 'duckduckgo', medium: 'organic', referrer };
        }
        
        // Email clients
        if (hostname.includes('mail.google.com') || hostname.includes('outlook.')) {
          return { source: hostname, medium: 'email', referrer };
        }
        
        // Default: referral
        return { source: hostname, medium: 'referral', referrer };
      } catch (e) {
        return { source: 'unknown', medium: 'referral', referrer };
      }
    }

    function getAttributionData() {
      const utmParams = extractUTMParams();
      const referrerData = parseReferrer();
      
      // UTM takes priority over referrer detection
      const hasUtm = utmParams.utm_source || utmParams.utm_medium;
      
      return {
        source: utmParams.utm_source || referrerData.source || 'direct',
        medium: utmParams.utm_medium || referrerData.medium || 'none',
        campaign: utmParams.utm_campaign || null,
        content: utmParams.utm_content || null,
        term: utmParams.utm_term || null,
        referrer: referrerData.referrer || document.referrer || null,
        landing_page: window.location.href,
        landing_path: window.location.pathname,
        gclid: utmParams.gclid,
        fbclid: utmParams.fbclid,
        ttclid: utmParams.ttclid
      };
    }

    function getFirstTouchAttribution() {
      // Check if we have stored first-touch
      const stored = getStorage(CONFIG.ATTRIBUTION_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
      return null;
    }

    function saveFirstTouchAttribution(attribution) {
      setStorage(CONFIG.ATTRIBUTION_KEY, JSON.stringify(attribution));
    }

    // ============================================
    // DEVICE DETECTION
    // ============================================
    
    function detectDevice() {
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);

      return {
        type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        browser: detectBrowser(ua),
        os: detectOS(ua),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        language: navigator.language || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
      };
    }

    function detectBrowser(ua) {
      if (ua.indexOf('Firefox') > -1) return 'Firefox';
      if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung';
      if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
      if (ua.indexOf('Trident') > -1) return 'IE';
      if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) return 'Edge';
      if (ua.indexOf('Chrome') > -1) return 'Chrome';
      if (ua.indexOf('Safari') > -1) return 'Safari';
      return 'Unknown';
    }

    function detectOS(ua) {
      if (ua.indexOf('Win') > -1) return 'Windows';
      if (ua.indexOf('Mac') > -1) return 'MacOS';
      if (ua.indexOf('Linux') > -1) return 'Linux';
      if (ua.indexOf('Android') > -1) return 'Android';
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
      return 'Unknown';
    }

    // Generate device fingerprint (privacy-respecting)
    function generateFingerprint() {
      const device = detectDevice();
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      const glVendor = gl ? gl.getParameter(gl.VENDOR) : 'unknown';
      
      const components = [
        device.browser,
        device.os,
        device.screenWidth + 'x' + device.screenHeight,
        device.timezone,
        navigator.language,
        navigator.hardwareConcurrency || 'unknown',
        glVendor
      ];
      
      // Simple hash
      let hash = 0;
      const str = components.join('|');
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return 'fp_' + Math.abs(hash).toString(36);
    }

    // ============================================
    // INITIALIZE STATE
    // ============================================
    
    const { userId, isNewUser } = getOrCreateUserId();
    const { sessionId, isNewSession } = getOrCreateSessionId();
    const deviceInfo = detectDevice();
    const fingerprint = generateFingerprint();
    const currentAttribution = getAttributionData();
    
    // Handle first-touch attribution
    let firstTouchAttribution = getFirstTouchAttribution();
    if (!firstTouchAttribution) {
      firstTouchAttribution = currentAttribution;
      saveFirstTouchAttribution(currentAttribution);
      console.log('[CRO Attribution] 📍 First touch saved:', firstTouchAttribution.source);
    }

    // Funnel tracking (optional)
    const FUNNEL_ID = window.funnelId || getSessionStorage('funnel_id') || null;
    const FUNNEL_STEP = window.funnelStep || null;
    if (FUNNEL_ID) {
      setSessionStorage('funnel_id', FUNNEL_ID);
    }

    // Event queue
    let eventQueue = [];
    let touchpointOrder = 0;
    let sessionStartTime = Date.now();
    let lastActivityTime = Date.now();
    let maxScrollDepth = 0;

    // ============================================
    // TRACK EVENT
    // ============================================
    
    function trackEvent(eventData) {
      lastActivityTime = Date.now();
      touchpointOrder++;
      
      const event = {
        // User & Session
        user_id: userId,
        session_id: sessionId,
        is_new_user: isNewUser,
        is_new_session: isNewSession,
        device_fingerprint: fingerprint,
        
        // Event type
        type: eventData.type,
        touchpoint_order: touchpointOrder,
        timestamp: Date.now(),
        
        // Page info
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        
        // Attribution - First Touch
        first_touch_source: firstTouchAttribution.source,
        first_touch_medium: firstTouchAttribution.medium,
        first_touch_campaign: firstTouchAttribution.campaign,
        first_touch_content: firstTouchAttribution.content,
        first_touch_term: firstTouchAttribution.term,
        
        // Attribution - Current/Last Touch
        source: currentAttribution.source,
        medium: currentAttribution.medium,
        campaign: currentAttribution.campaign,
        content: currentAttribution.content,
        term: currentAttribution.term,
        referrer: currentAttribution.referrer,
        gclid: currentAttribution.gclid,
        fbclid: currentAttribution.fbclid,
        
        // Device
        device_type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screen_width: deviceInfo.screenWidth,
        screen_height: deviceInfo.screenHeight,
        viewport_width: deviceInfo.viewportWidth,
        viewport_height: deviceInfo.viewportHeight,
        language: deviceInfo.language,
        timezone: deviceInfo.timezone,
        
        // Funnel (if set)
        funnel_id: FUNNEL_ID,
        funnel_step_name: FUNNEL_STEP,
        
        // Additional data
        ...eventData.data
      };

      console.log('[CRO Attribution] 📊 Event:', event.type, { user: userId.substring(0, 15) + '...', session: sessionId.substring(0, 15) + '...' });
      
      eventQueue.push(event);
      
      if (eventQueue.length >= CONFIG.BATCH_SIZE) {
        flushEvents();
      }
    }

    // ============================================
    // FLUSH EVENTS TO SERVER
    // ============================================
    
    async function flushEvents() {
      if (eventQueue.length === 0) return;
      
      const eventsToSend = [...eventQueue];
      eventQueue = [];
      
      const payload = JSON.stringify({ events: eventsToSend });
      
      try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY
          },
          body: payload,
          keepalive: true
        });

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        
        console.log('[CRO Attribution] ✅ Sent', eventsToSend.length, 'events');
      } catch (error) {
        console.error('[CRO Attribution] ❌ Send failed:', error.message);
        // Re-queue events for retry
        eventQueue = [...eventsToSend, ...eventQueue];
      }
    }

    // ============================================
    // CONVERSION TRACKING
    // ============================================
    
    window.croTrackConversion = function(conversionType, conversionName, conversionValue) {
      console.log('[CRO Attribution] 💰 Conversion:', conversionType, conversionName, conversionValue);
      
      trackEvent({
        type: 'conversion',
        data: {
          conversion_type: conversionType || 'purchase',
          conversion_name: conversionName || 'Conversion',
          conversion_value: parseFloat(conversionValue) || 0,
          is_conversion: true
        }
      });
      
      // Flush immediately for conversions
      flushEvents();
    };

    // ============================================
    // CUSTOM EVENT TRACKING
    // ============================================
    
    window.croTrackEvent = function(eventName, eventData) {
      trackEvent({
        type: 'custom',
        data: {
          event_name: eventName,
          event_data: eventData
        }
      });
    };

    // ============================================
    // IDENTIFY USER (optional - for logged-in users)
    // ============================================
    
    window.croIdentify = function(externalId, traits) {
      console.log('[CRO Attribution] 🏷️ Identify:', externalId);
      
      trackEvent({
        type: 'identify',
        data: {
          external_id: externalId,
          traits: traits || {}
        }
      });
    };

    // ============================================
    // AUTOMATIC TRACKING
    // ============================================
    
    // Page view
    trackEvent({ type: 'pageview', data: {} });

    // Funnel step (if configured)
    if (FUNNEL_ID && FUNNEL_STEP) {
      trackEvent({
        type: 'funnel_step',
        data: {
          funnel_id: FUNNEL_ID,
          step_name: FUNNEL_STEP
        }
      });
    }

    // Click tracking
    document.addEventListener('click', function(e) {
      const x = e.pageX || (e.clientX + window.scrollX);
      const y = e.pageY || (e.clientY + window.scrollY);
      
      const target = e.target;
      const isCtaClick = target.tagName === 'BUTTON' ||
                         target.tagName === 'A' ||
                         target.closest('button') !== null ||
                         target.closest('a') !== null;

      trackEvent({
        type: isCtaClick ? 'cta_click' : 'click',
        data: {
          click_x: Math.round(x),
          click_y: Math.round(y),
          element: target.tagName,
          element_id: target.id || null,
          element_class: target.className || null,
          element_text: (target.innerText || '').substring(0, 100),
          is_cta_click: isCtaClick,
          href: target.href || target.closest('a')?.href || null
        }
      });
    });

    // Scroll tracking
    if (CONFIG.ENABLE_SCROLL) {
      let lastScrollPercentage = 0;
      window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = Math.round((scrollTop / docHeight) * 100);

        if (scrollPercentage > maxScrollDepth) {
          maxScrollDepth = scrollPercentage;
        }

        // Track every 25%
        if (Math.abs(scrollPercentage - lastScrollPercentage) >= 25) {
          trackEvent({
            type: 'scroll',
            data: {
              scroll_depth: Math.round(scrollTop),
              scroll_percentage: Math.min(100, scrollPercentage),
              max_scroll_depth: maxScrollDepth
            }
          });
          lastScrollPercentage = scrollPercentage;
        }
      });
    }

    // Mouse movement (for heatmap)
    if (CONFIG.ENABLE_HEATMAP) {
      let lastMouseTrack = 0;
      document.addEventListener('mousemove', function(e) {
        const now = Date.now();
        if (now - lastMouseTrack < 500) return;
        lastMouseTrack = now;

        trackEvent({
          type: 'mousemove',
          data: {
            mouse_x: Math.round(e.pageX || (e.clientX + window.scrollX)),
            mouse_y: Math.round(e.pageY || (e.clientY + window.scrollY))
          }
        });
      });
    }

    // Form tracking
    if (CONFIG.ENABLE_FORMS) {
      document.addEventListener('submit', function(e) {
        if (e.target.tagName === 'FORM') {
          trackEvent({
            type: 'form_submit',
            data: {
              form_id: e.target.id || null,
              form_name: e.target.name || null,
              form_action: e.target.action || null
            }
          });
        }
      }, true);
    }

    // Exit intent
    document.addEventListener('mouseout', function(e) {
      if (e.clientY < 0) {
        trackEvent({ type: 'exit_intent', data: {} });
      }
    });

    // Time on page (every 30s)
    setInterval(function() {
      const timeOnPage = Math.round((Date.now() - sessionStartTime) / 1000);
      const isEngaged = (Date.now() - lastActivityTime) < 30000;

      trackEvent({
        type: 'time_on_page',
        data: {
          time_on_page: timeOnPage,
          engaged: isEngaged,
          max_scroll_depth: maxScrollDepth
        }
      });
    }, 30000);

    // Periodic flush
    setInterval(flushEvents, CONFIG.FLUSH_INTERVAL);

    // Flush on page unload
    window.addEventListener('beforeunload', flushEvents);
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) flushEvents();
    });

    // ============================================
    // EXPOSE API
    // ============================================
    
    window.CROAttribution = {
      getUserId: function() { return userId; },
      getSessionId: function() { return sessionId; },
      getAttribution: function() { return currentAttribution; },
      getFirstTouch: function() { return firstTouchAttribution; },
      trackEvent: window.croTrackEvent,
      trackConversion: window.croTrackConversion,
      identify: window.croIdentify,
      flush: flushEvents
    };

    console.log('=====================================');
    console.log('[CRO Attribution] ✅ INITIALIZED');
    console.log('[CRO Attribution] User ID:', userId);
    console.log('[CRO Attribution] Session ID:', sessionId);
    console.log('[CRO Attribution] First Touch:', firstTouchAttribution.source + '/' + firstTouchAttribution.medium);
    console.log('[CRO Attribution] Current:', currentAttribution.source + '/' + currentAttribution.medium);
    console.log('[CRO Attribution] Device:', deviceInfo.type, '/', deviceInfo.browser);
    if (FUNNEL_ID) {
      console.log('[CRO Attribution] Funnel:', FUNNEL_ID, '→', FUNNEL_STEP);
    }
    console.log('=====================================');

  } catch (globalError) {
    console.error('[CRO Attribution] ❌ Fatal:', globalError);
  }
})();
