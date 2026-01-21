/**
 * CRO Agent Advanced Tracking Script
 * Loaded externally to avoid CORS issues
 */
(function() {
  'use strict';

  // Global error handler
  try {

  // Configuration from global window variables
  const SUPABASE_URL = "https://dohrkonencbwvvmklzuo.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaHJrb25lbmNid3Z2bWtsenVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTAwNTUsImV4cCI6MjA4MzI2NjA1NX0.k2N-H_p-a4FHaOvq7V4u_uXkx45XIY-LZt0RoIJpjmU";
  const API_ENDPOINT = SUPABASE_URL + "/functions/v1/track-event";
  const FUNNEL_ID = window.croFunnelId || window.funnelId || null;
  const FUNNEL_STEP = window.croFunnelStep || null;
  const ENABLE_HEATMAP = window.croEnableHeatmap !== false;
  const BATCH_SIZE = 20;
  const FLUSH_INTERVAL = 5000;
  const SESSION_STORAGE_KEY = 'cro_session_id';

  // State
  let eventQueue = [];
  let sessionId = getOrCreateSessionId();
  let sessionStartTime = Date.now();
  let lastActivityTime = Date.now();
  let clickCount = 0;
  let lastClickTime = 0;
  let lastClickTarget = null;
  let maxScrollDepth = 0;
  let mouseMovements = [];
  let engaged = false;

  // Device detection
  const deviceInfo = detectDevice();

  // UTM parameters
  const utmParams = extractUTMParams();

  // Session management with fallback
  function getOrCreateSessionId() {
    try {
      let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!id) {
        id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, id);
        } catch (e) {
          console.warn('[CRO Tracking] sessionStorage blocked');
        }
      }
      return id;
    } catch (e) {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  // Device detection
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
      language: navigator.language || 'unknown'
    };
  }

  function detectBrowser(ua) {
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'IE';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Unknown';
  }

  function detectOS(ua) {
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iOS') > -1) return 'iOS';
    return 'Unknown';
  }

  // Extract UTM parameters
  function extractUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined
    };
  }

  // Track event
  function trackEvent(event) {
    engaged = true;
    lastActivityTime = Date.now();

    const baseEvent = {
      type: event.type,
      timestamp: Date.now(),
      sessionId: sessionId,
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      ...utmParams,
      deviceType: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screenWidth: deviceInfo.screenWidth,
      screenHeight: deviceInfo.screenHeight,
      viewportWidth: deviceInfo.viewportWidth,
      viewportHeight: deviceInfo.viewportHeight,
      language: deviceInfo.language,
      ...event
    };

    eventQueue.push(baseEvent);

    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    }
  }

  // Send events to server (with sendBeacon fallback)
  async function flushEvents() {
    if (eventQueue.length === 0) return;

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    const payload = JSON.stringify({ events: eventsToSend });

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        },
        body: payload,
        keepalive: true
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      console.log('[CRO Tracking] ✅ Sent', eventsToSend.length, 'events');
    } catch (error) {
      console.error('[CRO Tracking] ❌ Send failed:', error);
      eventQueue = [...eventsToSend, ...eventQueue];
    }
  }

  // Page view tracking
  trackEvent({
    type: 'pageview'
  });

  // Funnel step tracking
  if (FUNNEL_ID && FUNNEL_STEP) {
    trackEvent({
      type: 'funnel_step',
      funnelData: {
        funnelId: FUNNEL_ID,
        stepName: FUNNEL_STEP,
        stepOrder: 0
      }
    });
  }

  // Click tracking
  document.addEventListener('click', function(e) {
    const rect = document.body.getBoundingClientRect();
    const x = e.clientX - rect.left + window.scrollX;
    const y = e.clientY - rect.top + window.scrollY;

    const isCtaClick = e.target.tagName === 'BUTTON' ||
                       e.target.tagName === 'A' ||
                       e.target.closest('button') !== null ||
                       e.target.closest('a') !== null;

    trackEvent({
      type: isCtaClick ? 'cta_click' : 'click',
      clickData: {
        x: Math.round(x),
        y: Math.round(y),
        element: e.target.tagName,
        elementId: e.target.id || undefined,
        elementClass: e.target.className || undefined,
        elementText: e.target.innerText?.substring(0, 100) || undefined,
        isCtaClick: isCtaClick
      }
    });

    // Rage click detection
    const now = Date.now();
    if (lastClickTarget === e.target && (now - lastClickTime) < 1000) {
      clickCount++;
      if (clickCount >= 3) {
        trackEvent({
          type: 'rage_click',
          clickData: {
            x: Math.round(x),
            y: Math.round(y),
            element: e.target.tagName,
            clickCount: clickCount
          }
        });
        clickCount = 0;
      }
    } else {
      clickCount = 1;
    }
    lastClickTime = now;
    lastClickTarget = e.target;
  });

  // Scroll tracking
  let lastScrollPercentage = 0;
  window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.round((scrollTop / docHeight) * 100);

    if (scrollPercentage > maxScrollDepth) {
      maxScrollDepth = scrollPercentage;
    }

    if (Math.abs(scrollPercentage - lastScrollPercentage) >= 25) {
      trackEvent({
        type: 'scroll',
        scrollData: {
          depth: Math.round(scrollTop),
          percentage: Math.min(100, scrollPercentage),
          maxDepth: maxScrollDepth
        }
      });
      lastScrollPercentage = scrollPercentage;
    }
  });

  // Mouse movement tracking (for heatmap)
  if (ENABLE_HEATMAP) {
    let lastMouseTrack = 0;
    document.addEventListener('mousemove', function(e) {
      const now = Date.now();
      if (now - lastMouseTrack < 500) return;
      lastMouseTrack = now;

      const rect = document.body.getBoundingClientRect();
      trackEvent({
        type: 'mousemove',
        mouseData: {
          x: Math.round(e.clientX - rect.left + window.scrollX),
          y: Math.round(e.clientY - rect.top + window.scrollY),
          movementSpeed: Math.round(Math.sqrt(e.movementX**2 + e.movementY**2))
        }
      });
    });
  }

  // Form tracking
  document.addEventListener('focus', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      trackEvent({
        type: 'form_interaction',
        formData: {
          formId: e.target.form?.id || undefined,
          formName: e.target.form?.name || undefined,
          fieldName: e.target.name || e.target.id || undefined,
          fieldType: e.target.type || undefined,
          action: 'focus'
        }
      });
    }
  }, true);

  document.addEventListener('submit', function(e) {
    if (e.target.tagName === 'FORM') {
      trackEvent({
        type: 'form_submit',
        formData: {
          formId: e.target.id || undefined,
          formName: e.target.name || undefined,
          action: 'submit'
        }
      });
    }
  }, true);

  // Exit intent
  document.addEventListener('mouseout', function(e) {
    if (e.clientY < 0) {
      trackEvent({
        type: 'exit_intent'
      });
    }
  });

  // Time on page tracking
  setInterval(function() {
    const timeOnPage = Math.round((Date.now() - sessionStartTime) / 1000);
    const isEngaged = engaged && (Date.now() - lastActivityTime) < 30000;

    trackEvent({
      type: 'time_on_page',
      timeData: {
        timeOnPage: timeOnPage,
        engaged: isEngaged
      }
    });
  }, 30000);

  // Periodic flush
  setInterval(flushEvents, FLUSH_INTERVAL);

  // Flush on page unload
  window.addEventListener('beforeunload', function() {
    if (eventQueue.length > 0) {
      flushEvents();
    }
  });

  // Visibility change tracking
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      flushEvents();
    }
  });

  console.log('[CRO Tracking] Initialized - Session:', sessionId);
  if (FUNNEL_ID && FUNNEL_STEP) {
    console.log('[Funnel Tracker] Started - Funnel:', FUNNEL_ID, 'Step:', FUNNEL_STEP);
  }

  } catch (globalError) {
    console.error('[CRO Tracking] Failed:', globalError);
  }
})();
