// Script di tracking da iniettare nelle landing pages
// Cattura: click, scroll, mouse movement

export function generateTrackingScript(landingId: string, apiEndpoint: string): string {
  return `
(function() {
  const LANDING_ID = "${landingId}";
  const API_ENDPOINT = "${apiEndpoint}";
  const BATCH_SIZE = 10;
  const FLUSH_INTERVAL = 5000; // 5 secondi

  let eventQueue = [];
  let sessionId = generateSessionId();

  // Genera session ID univoco
  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Invia eventi al server
  async function flushEvents() {
    if (eventQueue.length === 0) return;

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    try {
      await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingId: LANDING_ID,
          sessionId: sessionId,
          events: eventsToSend,
        }),
      });
    } catch (error) {
      console.error('Tracking error:', error);
      // Rimetti gli eventi in coda se fallisce
      eventQueue = [...eventsToSend, ...eventQueue];
    }
  }

  // Aggiungi evento alla coda
  function trackEvent(type, data) {
    eventQueue.push({
      type,
      timestamp: Date.now(),
      ...data,
    });

    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    }
  }

  // Track CLICKS
  document.addEventListener('click', function(e) {
    const rect = document.body.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY + window.scrollY;

    trackEvent('click', {
      x: Math.round(x),
      y: Math.round(y),
      target: e.target.tagName,
      targetId: e.target.id || null,
      targetClass: e.target.className || null,
      pageWidth: document.body.scrollWidth,
      pageHeight: document.body.scrollHeight,
    });
  });

  // Track SCROLL
  let lastScrollY = 0;
  let scrollTimeout = null;

  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(function() {
      const scrollY = window.scrollY;
      const scrollPercentage = Math.round((scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

      // Track solo se scroll significativo (>5%)
      if (Math.abs(scrollY - lastScrollY) > window.innerHeight * 0.05) {
        trackEvent('scroll', {
          y: Math.round(scrollY),
          percentage: Math.min(100, scrollPercentage),
          pageHeight: document.body.scrollHeight,
          viewportHeight: window.innerHeight,
        });

        lastScrollY = scrollY;
      }
    }, 100);
  });

  // Track MOUSE MOVEMENT (campionato)
  let lastMouseTrack = 0;
  const MOUSE_TRACK_INTERVAL = 500; // Traccia ogni 500ms

  document.addEventListener('mousemove', function(e) {
    const now = Date.now();
    if (now - lastMouseTrack < MOUSE_TRACK_INTERVAL) return;

    lastMouseTrack = now;

    const rect = document.body.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY + window.scrollY;

    trackEvent('movement', {
      x: Math.round(x),
      y: Math.round(y),
      pageWidth: document.body.scrollWidth,
      pageHeight: document.body.scrollHeight,
    });
  });

  // Track SESSION INFO (device, screen)
  trackEvent('session_start', {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    referrer: document.referrer || 'direct',
    language: navigator.language,
  });

  // Flush periodico
  setInterval(flushEvents, FLUSH_INTERVAL);

  // Flush prima di uscire dalla pagina
  window.addEventListener('beforeunload', function() {
    if (eventQueue.length > 0) {
      // Usa sendBeacon per invio garantito
      navigator.sendBeacon(API_ENDPOINT, JSON.stringify({
        landingId: LANDING_ID,
        sessionId: sessionId,
        events: eventQueue,
      }));
    }
  });

  console.log('🔍 CRO Tracking attivo - Landing ID:', LANDING_ID);
})();
`;
}

// Genera tag <script> da inserire nell'HTML
export function getTrackingScriptTag(landingId: string): string {
  const apiEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/track`;
  const script = generateTrackingScript(landingId, apiEndpoint);

  return `<script>${script}</script>`;
}
