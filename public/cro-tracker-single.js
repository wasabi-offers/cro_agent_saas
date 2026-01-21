/**
 * CRO Agent - Single Universal Tracker
 * Install ONCE (via Google Tag Manager or in site header)
 * Automatically tracks ALL pages
 */
(function() {
  'use strict';

  // Check if already loaded
  if (window.CROTracker) return;

  try {

  // Configuration - AUTO-DETECT from URL
  const API_ENDPOINT = "https://cro-agent-saas.vercel.app/api/track";
  const BATCH_SIZE = 20;
  const FLUSH_INTERVAL = 5000;
  const SESSION_STORAGE_KEY = 'cro_session_id';

  // Auto-detect funnel from URL/domain
  function autoDetectFunnel() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Map domains/paths to funnels (configure this in your dashboard)
    const funnelMappings = {
      'codiceamazon26.com': { funnelId: 'codiceamazon26', stepName: 'Landing' },
      'www.codiceamazon26.com': { funnelId: 'codiceamazon26', stepName: 'Landing' },
    };

    // Check for exact domain match
    if (funnelMappings[hostname]) {
      return funnelMappings[hostname];
    }

    // Check for subdomain/path patterns
    for (const [pattern, config] of Object.entries(funnelMappings)) {
      if (hostname.includes(pattern)) {
        return config;
      }
    }

    // Check if config exists in window (manual override)
    if (window.CROTrackerConfig) {
      return window.CROTrackerConfig;
    }

    // No funnel detected
    return null;
  }

  const funnelConfig = autoDetectFunnel();
  const FUNNEL_ID = funnelConfig?.funnelId || null;
  const FUNNEL_STEP = funnelConfig?.stepName || 'Unknown';
  const ENABLE_HEATMAP = true;

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
  const utmParams = extractUTMParams();

  function getOrCreateSessionId() {
    try {
      let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!id) {
        id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, id);
        } catch (e) {}
      }
      return id;
    } catch (e) {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

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

  function trackEvent(event) {
    engaged = true;
    lastActivityTime = Date.now();

    const baseEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: sessionId,
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer || 'direct',
      ...utmParams,
      ...deviceInfo
    };

    eventQueue.push(baseEvent);

    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    }
  }

  async function flushEvents() {
    if (eventQueue.length === 0) return;

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    const payload = JSON.stringify({ events: eventsToSend });

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);
    } catch (error) {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon && navigator.sendBeacon(API_ENDPOINT, blob)) {
          console.log('[CRO] Sent via sendBeacon');
        } else {
          throw new Error('sendBeacon failed');
        }
      } catch (beaconError) {
        eventQueue = [...eventsToSend, ...eventQueue];
      }
    }
  }

  // Track pageview
  trackEvent({ type: 'pageview' });

  // Track funnel step if detected
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

    const element = e.target;
    const elementText = element.textContent?.trim().substring(0, 50) || '';
    const isCTA = element.tagName === 'BUTTON' || element.tagName === 'A' ||
                   element.classList.contains('cta') || element.classList.contains('btn') ||
                   element.type === 'submit';

    // Rage click detection
    const now = Date.now();
    if (lastClickTarget === element && now - lastClickTime < 1000) {
      clickCount++;
      if (clickCount >= 3) {
        trackEvent({
          type: 'rage_click',
          clickData: {
            x: Math.round(x), y: Math.round(y),
            element: element.tagName,
            elementId: element.id || undefined,
            elementClass: element.className || undefined,
            elementText: elementText,
            isCtaClick: isCTA
          }
        });
        clickCount = 0;
      }
    } else {
      clickCount = 1;
    }

    lastClickTarget = element;
    lastClickTime = now;

    // Regular click
    trackEvent({
      type: isCTA ? 'cta_click' : 'click',
      clickData: {
        x: Math.round(x), y: Math.round(y),
        element: element.tagName,
        elementId: element.id || undefined,
        elementClass: element.className || undefined,
        elementText: elementText,
        isCtaClick: isCTA
      },
      funnelData: FUNNEL_ID ? { funnelId: FUNNEL_ID, stepName: FUNNEL_STEP, stepOrder: 0 } : undefined
    });

    // Dead click detection
    if (!isCTA && !['INPUT','SELECT','TEXTAREA'].includes(element.tagName)) {
      const isInteractive = element.onclick || element.style.cursor === 'pointer';
      if (!isInteractive) {
        trackEvent({
          type: 'dead_click',
          clickData: {
            x: Math.round(x), y: Math.round(y),
            element: element.tagName,
            elementId: element.id || undefined,
            elementClass: element.className || undefined,
            elementText: elementText,
            isCtaClick: false
          }
        });
      }
    }
  }, true);

  // Scroll tracking
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      const scrollY = window.scrollY;
      const docHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollPercentage = Math.round((scrollY / (docHeight - viewportHeight)) * 100);

      if (scrollPercentage > maxScrollDepth) {
        maxScrollDepth = scrollPercentage;
        trackEvent({
          type: 'scroll',
          scrollData: {
            depth: Math.round(scrollY),
            percentage: Math.min(100, scrollPercentage),
            maxDepth: maxScrollDepth
          },
          funnelData: FUNNEL_ID ? { funnelId: FUNNEL_ID, stepName: FUNNEL_STEP, stepOrder: 0 } : undefined
        });
      }
    }, 150);
  });

  // Mouse movement (heatmap)
  if (ENABLE_HEATMAP) {
    let lastMouseTrack = 0;
    document.addEventListener('mousemove', function(e) {
      const now = Date.now();
      if (now - lastMouseTrack < 500) return;

      lastMouseTrack = now;
      const rect = document.body.getBoundingClientRect();
      const x = e.clientX - rect.left + window.scrollX;
      const y = e.clientY - rect.top + window.scrollY;

      mouseMovements.push({ x, y, t: now });
      if (mouseMovements.length > 10) mouseMovements.shift();

      let speed = 0;
      if (mouseMovements.length >= 2) {
        const last = mouseMovements[mouseMovements.length - 1];
        const prev = mouseMovements[mouseMovements.length - 2];
        const dist = Math.sqrt(Math.pow(last.x - prev.x, 2) + Math.pow(last.y - prev.y, 2));
        const time = (last.t - prev.t) / 1000;
        speed = time > 0 ? Math.round(dist / time) : 0;
      }

      trackEvent({
        type: 'mousemove',
        mouseData: { x: Math.round(x), y: Math.round(y), movementSpeed: speed },
        funnelData: FUNNEL_ID ? { funnelId: FUNNEL_ID, stepName: FUNNEL_STEP, stepOrder: 0 } : undefined
      });
    });
  }

  // Form tracking
  document.addEventListener('focusin', function(e) {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) {
      const form = e.target.closest('form');
      trackEvent({
        type: 'form_interaction',
        formData: {
          formId: form?.id || undefined,
          formName: form?.name || undefined,
          fieldName: e.target.name || e.target.id || undefined,
          fieldType: e.target.type || e.target.tagName,
          action: 'focus'
        }
      });
    }
  }, true);

  document.addEventListener('submit', function(e) {
    trackEvent({
      type: 'form_submit',
      formData: {
        formId: e.target.id || undefined,
        formName: e.target.name || undefined,
        action: 'submit'
      }
    });
  }, true);

  // Exit intent
  document.addEventListener('mouseout', function(e) {
    if (!e.relatedTarget && !e.toElement && e.clientY < 10) {
      trackEvent({ type: 'exit_intent' });
    }
  });

  // Time on page (every 30s)
  setInterval(function() {
    const timeOnPage = Math.round((Date.now() - sessionStartTime) / 1000);
    const isEngaged = engaged && (Date.now() - lastActivityTime) < 30000;
    trackEvent({
      type: 'time_on_page',
      timeData: { timeOnPage: timeOnPage, engaged: isEngaged }
    });
  }, 30000);

  // Periodic flush
  setInterval(flushEvents, FLUSH_INTERVAL);

  // Flush on unload
  window.addEventListener('beforeunload', function() {
    if (eventQueue.length > 0) {
      navigator.sendBeacon(API_ENDPOINT, JSON.stringify({ events: eventQueue }));
    }
  });

  // Flush on visibility change
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) flushEvents();
  });

  // Export API
  window.CROTracker = {
    track: trackEvent,
    flush: flushEvents,
    getSessionId: () => sessionId,
    getFunnelId: () => FUNNEL_ID,
    getStepName: () => FUNNEL_STEP
  };

  console.log('[CRO] Tracking initialized - Funnel:', FUNNEL_ID || 'AUTO-DETECT', 'Step:', FUNNEL_STEP);

  } catch (error) {
    console.error('[CRO] Init failed:', error);
  }
})();
