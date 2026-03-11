/**
 * CRO Quiz Funnel Tracker v2
 *
 * Tracks user interactions in multi-step quiz funnels:
 *   - Step views and transitions
 *   - Answer clicks with timing
 *   - Hesitation detection (long pauses before answering)
 *   - Dropoff detection (abandonment, tab switch, exit intent)
 *   - Answer changes and back navigation
 *   - Option hover analysis
 *   - Scroll depth per step
 *   - Session resume on page refresh
 *
 * Sends to BOTH:
 *   1. Next.js /api/track  (main CRO tracking pipeline — always works)
 *   2. Supabase Edge Function /functions/v1/track-quiz-event (quiz-specific — optional)
 *
 * Install (minimal — only needs APP_URL):
 *   <script>
 *     window.quizConfig = {
 *       funnelSlug: "weight-loss-quiz"
 *     };
 *   </script>
 *   <script src="https://yoursite.com/cro-quiz-tracker.js"></script>
 *
 * Install (full — with Supabase for quiz-specific analytics):
 *   <script>
 *     window.quizConfig = {
 *       funnelSlug: "weight-loss-quiz",
 *       supabaseUrl: "https://xxx.supabase.co",
 *       supabaseKey: "your-anon-key"
 *     };
 *   </script>
 *   <script src="https://yoursite.com/cro-quiz-tracker.js"></script>
 *
 * DOM Integration (auto-detect):
 *   - Steps: [data-quiz-step="1"], [data-quiz-step="2"], ...
 *   - Answers: [data-quiz-answer="answer_id"] inside each step
 *   - Question text: [data-quiz-question] or first h2/h3 in step
 *   - Next/Back buttons: [data-quiz-next], [data-quiz-back]
 *   - Progress bar: [data-quiz-progress]
 *   - Skip button: [data-quiz-skip]
 *   - Complete trigger: [data-quiz-complete]
 *
 * Manual API:
 *   window.QuizTracker.start(funnelSlug)
 *   window.QuizTracker.stepView(stepOrder, stepName)
 *   window.QuizTracker.answerClick(stepOrder, answerId, answerText, answerValue)
 *   window.QuizTracker.complete(score, result)
 *   window.QuizTracker.abandon(reason)
 *   window.QuizTracker.setFunnel(funnelSlug)
 *   window.QuizTracker.getState()
 *   window.QuizTracker.getStats()
 *   window.QuizTracker.flush()
 */
(function () {
  'use strict';

  if (window.QuizTracker) return;

  try {

  // ═══════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════

  var quizConfig = window.quizConfig || {};

  var SUPABASE_URL = quizConfig.supabaseUrl || window.croSupabaseUrl || '';
  var SUPABASE_KEY = quizConfig.supabaseKey || window.croSupabaseKey || '';

  // Auto-detect base URL from script src
  var APP_BASE_URL = quizConfig.appUrl || '';
  if (!APP_BASE_URL) {
    try {
      var currentScriptSrc = '';
      if (document.currentScript && document.currentScript.src) {
        currentScriptSrc = document.currentScript.src;
      } else {
        var allScripts = document.getElementsByTagName('script');
        for (var si = allScripts.length - 1; si >= 0; si--) {
          if (allScripts[si].src && allScripts[si].src.indexOf('cro-quiz-tracker') > -1) {
            currentScriptSrc = allScripts[si].src;
            break;
          }
        }
      }
      if (currentScriptSrc) {
        APP_BASE_URL = new URL(currentScriptSrc).origin;
      }
    } catch (_) {}
  }
  if (!APP_BASE_URL) APP_BASE_URL = 'https://cro-agent.vercel.app';

  var HAS_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

  var CONFIG = {
    TRACK_API_ENDPOINT: APP_BASE_URL + '/api/track',
    TRACK_QUIZ_ENDPOINT: APP_BASE_URL + '/api/track-quiz',
    SUPABASE_QUIZ_ENDPOINT: HAS_SUPABASE
      ? SUPABASE_URL + '/functions/v1/track-quiz-event'
      : null,

    FUNNEL_SLUG: quizConfig.funnelSlug || null,

    USER_STORAGE_KEY: 'cro_user_id',
    USER_COOKIE_NAME: 'cro_uid',
    SESSION_STORAGE_KEY: 'cro_session_id',
    QUIZ_SESSION_KEY: 'cro_quiz_session',
    ATTRIBUTION_KEY: 'cro_attribution',

    COOKIE_EXPIRY_DAYS: 730,
    BATCH_SIZE: 10,
    FLUSH_INTERVAL: 3000,

    HESITATION_THRESHOLD_MS: quizConfig.hesitationThreshold || 8000,
    INACTIVITY_ABANDON_MS: quizConfig.inactivityTimeout || 180000,
    TAB_SWITCH_TIMEOUT_MS: quizConfig.tabSwitchTimeout || 60000
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

  function detectDevice() {
    var ua = navigator.userAgent;
    var mob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    var tab = /iPad|Android(?!.*Mobile)/i.test(ua);
    function browser() {
      if (ua.indexOf('Firefox') > -1) return 'Firefox';
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
      return 'Unknown';
    }
    return {
      device_type: mob ? 'mobile' : tab ? 'tablet' : 'desktop',
      browser: browser(),
      os: os(),
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      language: navigator.language || 'unknown'
    };
  }

  function extractUTM() {
    var p = new URLSearchParams(window.location.search);
    return {
      source: p.get('utm_source') || 'direct',
      medium: p.get('utm_medium') || 'none',
      campaign: p.get('utm_campaign') || null,
      content: p.get('utm_content') || null,
      term: p.get('utm_term') || null,
      gclid: p.get('gclid') || null,
      fbclid: p.get('fbclid') || null
    };
  }

  function parseReferrer() {
    var ref = document.referrer;
    if (!ref) return { source: 'direct', medium: 'none', referrer: null };
    try {
      var h = new URL(ref).hostname.toLowerCase();
      var map = [
        [['facebook.com', 'fb.com'], 'facebook', 'social'],
        [['instagram.com'], 'instagram', 'social'],
        [['twitter.com', 'x.com'], 'twitter', 'social'],
        [['tiktok.com'], 'tiktok', 'social'],
        [['youtube.com'], 'youtube', 'social'],
        [['google.'], 'google', 'organic'],
        [['bing.com'], 'bing', 'organic'],
        [['yahoo.com'], 'yahoo', 'organic']
      ];
      for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i][0].length; j++) {
          if (h.indexOf(map[i][0][j]) > -1) {
            return { source: map[i][1], medium: map[i][2], referrer: ref };
          }
        }
      }
      return { source: h, medium: 'referral', referrer: ref };
    } catch (_) { return { source: 'unknown', medium: 'referral', referrer: ref }; }
  }

  // ═══════════════════════════════════════════
  // IDENTITY (shared with cro-tracking-attribution.js)
  // ═══════════════════════════════════════════

  var userId = ls(CONFIG.USER_STORAGE_KEY) || getCookie(CONFIG.USER_COOKIE_NAME);
  var isNewUser = !userId;
  if (!userId) userId = generateId('usr');
  ls(CONFIG.USER_STORAGE_KEY, userId);
  setCookie(CONFIG.USER_COOKIE_NAME, userId, CONFIG.COOKIE_EXPIRY_DAYS);

  var sessionId = ss(CONFIG.SESSION_STORAGE_KEY);
  var isNewSession = !sessionId;
  if (!sessionId) { sessionId = generateId('sess'); ss(CONFIG.SESSION_STORAGE_KEY, sessionId); }

  var deviceInfo = detectDevice();
  var utmData = extractUTM();
  var referrerData = parseReferrer();

  // Build attribution (use UTM if present, else referrer)
  var attribution = {
    source: utmData.source !== 'direct' ? utmData.source : referrerData.source,
    medium: utmData.medium !== 'none' ? utmData.medium : referrerData.medium,
    campaign: utmData.campaign,
    content: utmData.content,
    term: utmData.term,
    referrer: referrerData.referrer || document.referrer || null,
    gclid: utmData.gclid,
    fbclid: utmData.fbclid
  };

  // Load first-touch attribution
  var firstTouch = null;
  try { firstTouch = JSON.parse(ls(CONFIG.ATTRIBUTION_KEY) || 'null'); } catch (_) {}
  if (!firstTouch) {
    firstTouch = { source: attribution.source, medium: attribution.medium, campaign: attribution.campaign };
    ls(CONFIG.ATTRIBUTION_KEY, JSON.stringify(firstTouch));
  }

  // ═══════════════════════════════════════════
  // QUIZ STATE
  // ═══════════════════════════════════════════

  var quizState = {
    funnelSlug: CONFIG.FUNNEL_SLUG,
    quizSessionId: null,
    currentStep: 0,
    totalSteps: 0,
    startTime: null,
    stepStartTime: null,
    stepsViewed: [],
    answersGiven: {},
    isCompleted: false,
    isAbandoned: false,
    totalTimeMs: 0,
    hesitationTimers: {},
    lastActivityTime: Date.now()
  };

  // Restore from sessionStorage if same funnel and still active
  var savedQuizSession = ss(CONFIG.QUIZ_SESSION_KEY);
  if (savedQuizSession) {
    try {
      var parsed = JSON.parse(savedQuizSession);
      if (parsed.funnelSlug === CONFIG.FUNNEL_SLUG && !parsed.isCompleted && !parsed.isAbandoned) {
        quizState = Object.assign(quizState, parsed);
        quizState.lastActivityTime = Date.now();
        quizState.hesitationTimers = {};
      }
    } catch (_) {}
  }

  function saveState() {
    ss(CONFIG.QUIZ_SESSION_KEY, JSON.stringify({
      funnelSlug: quizState.funnelSlug,
      quizSessionId: quizState.quizSessionId,
      currentStep: quizState.currentStep,
      totalSteps: quizState.totalSteps,
      startTime: quizState.startTime,
      stepsViewed: quizState.stepsViewed,
      answersGiven: quizState.answersGiven,
      isCompleted: quizState.isCompleted,
      isAbandoned: quizState.isAbandoned
    }));
  }

  // ═══════════════════════════════════════════
  // DUAL-ENDPOINT EVENT DISPATCH
  // ═══════════════════════════════════════════

  var mainQueue = [];
  var quizQueue = [];

  function trackQuizEvent(eventType, data) {
    quizState.lastActivityTime = Date.now();

    var timeSinceStart = quizState.startTime
      ? (Date.now() - quizState.startTime) / 1000 : 0;
    var timeOnStep = quizState.stepStartTime
      ? (Date.now() - quizState.stepStartTime) / 1000 : 0;

    var basePayload = {
      funnel_slug: quizState.funnelSlug,
      quiz_session_id: quizState.quizSessionId,
      user_id: userId,
      session_id: sessionId,
      is_new_user: isNewUser,
      is_new_session: isNewSession,
      event_type: eventType,
      step_order: quizState.currentStep,
      time_on_step_seconds: Math.round(timeOnStep * 100) / 100,
      time_since_start_seconds: Math.round(timeSinceStart * 100) / 100,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
      language: deviceInfo.language,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      content: attribution.content,
      term: attribution.term,
      referrer: attribution.referrer,
      gclid: attribution.gclid,
      fbclid: attribution.fbclid,
      first_touch_source: firstTouch.source,
      first_touch_medium: firstTouch.medium,
      first_touch_campaign: firstTouch.campaign,
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      timestamp: Date.now()
    };

    if (data) {
      var keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) basePayload[keys[i]] = data[keys[i]];
    }

    // 1) Main CRO pipeline: map to standard event format for /api/track
    var mainEvt = {
      user_id: userId,
      session_id: sessionId,
      is_new_user: isNewUser,
      is_new_session: isNewSession,
      type: mapToMainEventType(eventType),
      timestamp: basePayload.timestamp,
      url: basePayload.url,
      path: basePayload.path,
      title: basePayload.title,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      content: attribution.content,
      term: attribution.term,
      referrer: attribution.referrer,
      first_touch_source: firstTouch.source,
      first_touch_medium: firstTouch.medium,
      first_touch_campaign: firstTouch.campaign,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screen_width: deviceInfo.screen_width,
      screen_height: deviceInfo.screen_height,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
      language: deviceInfo.language,
      funnel_id: quizState.funnelSlug,
      funnel_step_name: data && data.step_name ? data.step_name : 'Step ' + quizState.currentStep,
      step_order: quizState.currentStep,
      quiz_event_type: eventType,
      quiz_session_id: quizState.quizSessionId
    };

    if (data) {
      if (data.answer_id) mainEvt.element_text = data.answer_text || data.answer_id;
      if (data.quiz_score !== undefined) mainEvt.conversion_value = data.quiz_score;
      if (eventType === 'quiz_complete') {
        mainEvt.is_conversion = true;
        mainEvt.conversion_type = 'quiz_complete';
        mainEvt.conversion_name = 'Quiz: ' + (quizState.funnelSlug || 'unknown');
      }
    }

    mainQueue.push(mainEvt);

    // 2) Quiz-specific pipeline (Supabase Edge Function or /api/track-quiz)
    quizQueue.push(basePayload);

    if (mainQueue.length >= CONFIG.BATCH_SIZE) flushMain();
    if (quizQueue.length >= CONFIG.BATCH_SIZE) flushQuiz();
  }

  function mapToMainEventType(quizEventType) {
    var map = {
      'quiz_start': 'funnel_step',
      'step_view': 'funnel_step',
      'answer_click': 'cta_click',
      'answer_change': 'cta_click',
      'quiz_complete': 'conversion',
      'quiz_abandon': 'custom',
      'hesitation': 'custom',
      'step_back': 'custom',
      'step_skip': 'custom',
      'exit_intent_on_step': 'exit_intent',
      'tab_switch_away': 'custom',
      'tab_switch_back': 'custom',
      'scroll_on_step': 'scroll',
      'option_hover': 'custom'
    };
    return map[quizEventType] || 'custom';
  }

  // ── Flush to /api/track (main CRO pipeline — always available)
  function flushMain() {
    if (mainQueue.length === 0) return;
    var batch = mainQueue.slice();
    mainQueue = [];
    sendBatch(CONFIG.TRACK_API_ENDPOINT, batch, null, function () {
      mainQueue = batch.concat(mainQueue);
    });
  }

  // ── Flush to quiz endpoint (Supabase Edge Function or /api/track-quiz)
  function flushQuiz() {
    if (quizQueue.length === 0) return;
    var batch = quizQueue.slice();
    quizQueue = [];

    var endpoint = CONFIG.SUPABASE_QUIZ_ENDPOINT || CONFIG.TRACK_QUIZ_ENDPOINT;
    var headers = null;
    if (CONFIG.SUPABASE_QUIZ_ENDPOINT) {
      headers = {
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'apikey': SUPABASE_KEY
      };
    }

    sendBatch(endpoint, batch, headers, function () {
      quizQueue = batch.concat(quizQueue);
    });
  }

  function sendBatch(endpoint, batch, extraHeaders, onError) {
    var payload = JSON.stringify({ events: batch });
    var hdrs = { 'Content-Type': 'application/json' };
    if (extraHeaders) {
      var keys = Object.keys(extraHeaders);
      for (var i = 0; i < keys.length; i++) hdrs[keys[i]] = extraHeaders[keys[i]];
    }

    try {
      fetch(endpoint, {
        method: 'POST',
        headers: hdrs,
        body: payload,
        keepalive: true
      }).then(function (r) {
        if (!r.ok && onError) onError();
      }).catch(function () {
        if (onError) onError();
      });
    } catch (_) {
      try {
        var blob = new Blob([payload], { type: 'application/json' });
        if (!navigator.sendBeacon(endpoint, blob)) {
          if (onError) onError();
        }
      } catch (__) {
        if (onError) onError();
      }
    }
  }

  // Periodic flush
  setInterval(function () { flushMain(); flushQuiz(); }, CONFIG.FLUSH_INTERVAL);

  // ═══════════════════════════════════════════
  // QUIZ LIFECYCLE
  // ═══════════════════════════════════════════

  function startQuiz(funnelSlug) {
    if (funnelSlug) quizState.funnelSlug = funnelSlug;
    if (!quizState.funnelSlug) {
      console.warn('[QuizTracker] No funnel slug configured — use QuizTracker.start("my-slug") or set window.quizConfig.funnelSlug');
      return;
    }

    quizState.quizSessionId = generateId('qsess');
    quizState.startTime = Date.now();
    quizState.stepStartTime = Date.now();
    quizState.currentStep = 0;
    quizState.stepsViewed = [];
    quizState.answersGiven = {};
    quizState.isCompleted = false;
    quizState.isAbandoned = false;

    // Detect total steps from DOM
    var domSteps = document.querySelectorAll('[data-quiz-step]');
    if (domSteps.length > 0) quizState.totalSteps = domSteps.length;

    trackQuizEvent('quiz_start', {
      funnel_slug: quizState.funnelSlug,
      total_steps: quizState.totalSteps
    });

    saveState();
    resetInactivityTimer();
    console.log('[QuizTracker] Quiz started:', quizState.funnelSlug, '| Session:', quizState.quizSessionId);
  }

  function viewStep(stepOrder, stepName) {
    if (!quizState.startTime) startQuiz(quizState.funnelSlug);

    quizState.currentStep = stepOrder;
    quizState.stepStartTime = Date.now();

    if (quizState.stepsViewed.indexOf(stepOrder) === -1) {
      quizState.stepsViewed.push(stepOrder);
    }

    trackQuizEvent('step_view', {
      step_order: stepOrder,
      step_name: stepName || 'Step ' + stepOrder,
      total_steps_viewed: quizState.stepsViewed.length,
      total_steps: quizState.totalSteps,
      completion_percentage: quizState.totalSteps > 0
        ? Math.round((stepOrder / quizState.totalSteps) * 100) : 0
    });

    startHesitationTimer(stepOrder);
    resetInactivityTimer();
    saveState();
  }

  function answerClick(stepOrder, answerId, answerText, answerValue) {
    clearHesitationTimer(stepOrder);

    var timeOnStep = quizState.stepStartTime
      ? (Date.now() - quizState.stepStartTime) / 1000 : 0;

    var previousAnswer = quizState.answersGiven[stepOrder];
    var isChange = !!previousAnswer && previousAnswer.answerId !== answerId;

    quizState.answersGiven[stepOrder] = {
      answerId: answerId,
      answerText: answerText,
      answerValue: answerValue,
      timeSeconds: timeOnStep
    };

    trackQuizEvent(isChange ? 'answer_change' : 'answer_click', {
      step_order: stepOrder,
      step_name: getStepName(stepOrder),
      answer_id: answerId,
      answer_text: answerText,
      answer_value: answerValue,
      previous_answer_id: previousAnswer ? previousAnswer.answerId : null,
      time_on_step_seconds: Math.round(timeOnStep * 100) / 100,
      hesitation_detected: timeOnStep > (CONFIG.HESITATION_THRESHOLD_MS / 1000),
      hesitation_duration_ms: timeOnStep > (CONFIG.HESITATION_THRESHOLD_MS / 1000)
        ? Math.round(timeOnStep * 1000) : 0
    });

    resetInactivityTimer();
    saveState();
  }

  function stepBack(fromStep, toStep) {
    trackQuizEvent('step_back', {
      step_order: fromStep,
      target_step: toStep,
      step_name: getStepName(fromStep)
    });
  }

  function stepSkip(stepOrder) {
    trackQuizEvent('step_skip', {
      step_order: stepOrder,
      step_name: getStepName(stepOrder)
    });
  }

  function completeQuiz(score, result) {
    if (quizState.isCompleted) return;
    quizState.isCompleted = true;
    quizState.totalTimeMs = Date.now() - (quizState.startTime || Date.now());

    var answersArr = [];
    var stepKeys = Object.keys(quizState.answersGiven);
    for (var i = 0; i < stepKeys.length; i++) {
      var k = stepKeys[i];
      var a = quizState.answersGiven[k];
      answersArr.push({
        step_order: parseInt(k),
        answer_id: a.answerId,
        answer_text: a.answerText,
        time_seconds: a.timeSeconds
      });
    }

    trackQuizEvent('quiz_complete', {
      quiz_score: score || 0,
      quiz_result: result || null,
      total_time_seconds: Math.round(quizState.totalTimeMs / 1000),
      total_steps_answered: stepKeys.length,
      total_steps_viewed: quizState.stepsViewed.length,
      total_steps: quizState.totalSteps,
      answers_summary: answersArr,
      completion_percentage: 100
    });

    flushMain();
    flushQuiz();
    saveState();
    clearInactivityTimer();
    console.log('[QuizTracker] Quiz completed. Score:', score, '| Result:', result);
  }

  function abandonQuiz(reason) {
    if (quizState.isAbandoned || quizState.isCompleted) return;
    quizState.isAbandoned = true;
    quizState.totalTimeMs = Date.now() - (quizState.startTime || Date.now());

    var answeredCount = Object.keys(quizState.answersGiven).length;

    trackQuizEvent('quiz_abandon', {
      dropoff_step: quizState.currentStep,
      dropoff_reason: reason || 'unknown',
      dropoff_step_name: getStepName(quizState.currentStep),
      total_time_seconds: Math.round(quizState.totalTimeMs / 1000),
      total_steps_answered: answeredCount,
      total_steps_viewed: quizState.stepsViewed.length,
      last_step_reached: quizState.currentStep,
      completion_percentage: quizState.totalSteps > 0
        ? Math.round((answeredCount / quizState.totalSteps) * 100) : 0
    });

    flushMain();
    flushQuiz();
    saveState();
    clearInactivityTimer();
    console.log('[QuizTracker] Quiz abandoned at step', quizState.currentStep, '| Reason:', reason);
  }

  // ═══════════════════════════════════════════
  // HESITATION DETECTION
  // ═══════════════════════════════════════════

  function startHesitationTimer(stepOrder) {
    clearHesitationTimer(stepOrder);
    quizState.hesitationTimers[stepOrder] = setTimeout(function () {
      trackQuizEvent('hesitation', {
        step_order: stepOrder,
        step_name: getStepName(stepOrder),
        hesitation_detected: true,
        hesitation_duration_ms: CONFIG.HESITATION_THRESHOLD_MS,
        time_on_step_seconds: quizState.stepStartTime
          ? (Date.now() - quizState.stepStartTime) / 1000 : 0
      });
    }, CONFIG.HESITATION_THRESHOLD_MS);
  }

  function clearHesitationTimer(stepOrder) {
    if (quizState.hesitationTimers[stepOrder]) {
      clearTimeout(quizState.hesitationTimers[stepOrder]);
      delete quizState.hesitationTimers[stepOrder];
    }
  }

  // ═══════════════════════════════════════════
  // AUTOMATIC ABANDONMENT DETECTION
  // ═══════════════════════════════════════════

  var inactivityTimer = null;

  function resetInactivityTimer() {
    clearInactivityTimer();
    if (quizState.isCompleted || quizState.isAbandoned || !quizState.startTime) return;
    inactivityTimer = setTimeout(function () {
      abandonQuiz('timeout');
    }, CONFIG.INACTIVITY_ABANDON_MS);
  }

  function clearInactivityTimer() {
    if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
  }

  document.addEventListener('click', function () {
    if (quizState.startTime && !quizState.isCompleted && !quizState.isAbandoned) {
      resetInactivityTimer();
    }
  });

  document.addEventListener('scroll', function () {
    if (quizState.startTime && !quizState.isCompleted && !quizState.isAbandoned) {
      resetInactivityTimer();
    }
  });

  // Tab switch detection
  var tabSwitchTime = null;

  document.addEventListener('visibilitychange', function () {
    if (quizState.isCompleted || quizState.isAbandoned || !quizState.startTime) return;

    if (document.hidden) {
      tabSwitchTime = Date.now();
      trackQuizEvent('tab_switch_away', {
        step_order: quizState.currentStep,
        step_name: getStepName(quizState.currentStep)
      });
      flushMain();
      flushQuiz();
    } else {
      if (tabSwitchTime) {
        var awayMs = Date.now() - tabSwitchTime;
        trackQuizEvent('tab_switch_back', {
          step_order: quizState.currentStep,
          step_name: getStepName(quizState.currentStep),
          away_duration_ms: awayMs
        });
        if (awayMs > CONFIG.TAB_SWITCH_TIMEOUT_MS) {
          abandonQuiz('tab_switch');
        }
        tabSwitchTime = null;
      }
    }
  });

  // Exit intent
  var exitIntentTracked = false;
  document.addEventListener('mouseout', function (e) {
    if (quizState.isCompleted || quizState.isAbandoned || !quizState.startTime) return;
    if (!exitIntentTracked && e.clientY < 0) {
      exitIntentTracked = true;
      trackQuizEvent('exit_intent_on_step', {
        step_order: quizState.currentStep,
        step_name: getStepName(quizState.currentStep)
      });
      setTimeout(function () { exitIntentTracked = false; }, 10000);
    }
  });

  // Page unload
  window.addEventListener('beforeunload', function () {
    if (quizState.startTime && !quizState.isCompleted && !quizState.isAbandoned) {
      abandonQuiz('navigation');
    }

    // Force-flush remaining events via sendBeacon
    if (mainQueue.length > 0) {
      try {
        var blob = new Blob([JSON.stringify({ events: mainQueue })], { type: 'application/json' });
        navigator.sendBeacon(CONFIG.TRACK_API_ENDPOINT, blob);
        mainQueue = [];
      } catch (_) {}
    }
    if (quizQueue.length > 0) {
      var qEndpoint = CONFIG.SUPABASE_QUIZ_ENDPOINT || CONFIG.TRACK_QUIZ_ENDPOINT;
      try {
        var blob2 = new Blob([JSON.stringify({ events: quizQueue })], { type: 'application/json' });
        navigator.sendBeacon(qEndpoint, blob2);
        quizQueue = [];
      } catch (_) {}
    }
  });

  // ═══════════════════════════════════════════
  // DOM AUTO-DETECTION
  // ═══════════════════════════════════════════

  function autoDetectQuiz() {
    var steps = document.querySelectorAll('[data-quiz-step]');
    if (steps.length === 0) return;

    console.log('[QuizTracker] Auto-detected', steps.length, 'quiz steps');
    quizState.totalSteps = steps.length;

    if (!quizState.startTime) {
      startQuiz(CONFIG.FUNNEL_SLUG);
    }

    // Watch for step visibility changes (show/hide based quizzes)
    var observer = new MutationObserver(function () { detectVisibleStep(); });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    for (var i = 0; i < steps.length; i++) {
      bindStepAnswers(steps[i]);
    }

    // Next buttons
    var nextBtns = document.querySelectorAll('[data-quiz-next]');
    for (var n = 0; n < nextBtns.length; n++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var nextStep = parseInt(btn.getAttribute('data-quiz-next')) || quizState.currentStep + 1;
          viewStep(nextStep, getStepName(nextStep));
        });
      })(nextBtns[n]);
    }

    // Back buttons
    var backBtns = document.querySelectorAll('[data-quiz-back]');
    for (var b = 0; b < backBtns.length; b++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var backTo = parseInt(btn.getAttribute('data-quiz-back')) || quizState.currentStep - 1;
          stepBack(quizState.currentStep, backTo);
          viewStep(backTo, getStepName(backTo));
        });
      })(backBtns[b]);
    }

    // Skip buttons
    var skipBtns = document.querySelectorAll('[data-quiz-skip]');
    for (var s = 0; s < skipBtns.length; s++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          stepSkip(quizState.currentStep);
          var nextStep = parseInt(btn.getAttribute('data-quiz-skip')) || quizState.currentStep + 1;
          viewStep(nextStep, getStepName(nextStep));
        });
      })(skipBtns[s]);
    }

    // Complete triggers
    var completeBtns = document.querySelectorAll('[data-quiz-complete]');
    for (var c = 0; c < completeBtns.length; c++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var score = parseFloat(btn.getAttribute('data-quiz-score')) || 0;
          var result = btn.getAttribute('data-quiz-result') || null;
          completeQuiz(score, result);
        });
      })(completeBtns[c]);
    }

    detectVisibleStep();
  }

  function bindStepAnswers(stepEl) {
    var stepOrder = parseInt(stepEl.getAttribute('data-quiz-step'));
    var answers = stepEl.querySelectorAll('[data-quiz-answer]');

    for (var a = 0; a < answers.length; a++) {
      (function (answerEl) {
        answerEl.addEventListener('click', function () {
          var aid = answerEl.getAttribute('data-quiz-answer');
          var text = answerEl.getAttribute('data-quiz-answer-text') ||
                     answerEl.innerText.trim().substring(0, 200);
          var value = answerEl.getAttribute('data-quiz-answer-value') || aid;
          answerClick(stepOrder, aid, text, value);
        });

        answerEl.addEventListener('mouseenter', function () {
          trackQuizEvent('option_hover', {
            step_order: stepOrder,
            step_name: getStepName(stepOrder),
            answer_id: answerEl.getAttribute('data-quiz-answer'),
            answer_text: (answerEl.innerText || '').trim().substring(0, 200)
          });
        });
      })(answers[a]);
    }
  }

  function detectVisibleStep() {
    var steps = document.querySelectorAll('[data-quiz-step]');
    for (var i = 0; i < steps.length; i++) {
      var stepEl = steps[i];
      var isVisible = stepEl.offsetParent !== null &&
                      getComputedStyle(stepEl).display !== 'none' &&
                      getComputedStyle(stepEl).visibility !== 'hidden';

      if (isVisible) {
        var stepOrder = parseInt(stepEl.getAttribute('data-quiz-step'));
        if (stepOrder !== quizState.currentStep) {
          viewStep(stepOrder, getStepName(stepOrder));
        }
        break;
      }
    }
  }

  function getStepName(stepOrder) {
    var stepEl = document.querySelector('[data-quiz-step="' + stepOrder + '"]');
    if (!stepEl) return 'Step ' + stepOrder;

    var questionEl = stepEl.querySelector('[data-quiz-question]');
    if (questionEl) return questionEl.textContent.trim().substring(0, 200);

    var heading = stepEl.querySelector('h1, h2, h3, h4');
    if (heading) return heading.textContent.trim().substring(0, 200);

    return stepEl.getAttribute('data-quiz-step-name') || 'Step ' + stepOrder;
  }

  // ═══════════════════════════════════════════
  // SCROLL TRACKING PER STEP
  // ═══════════════════════════════════════════

  var lastStepScroll = 0;
  window.addEventListener('scroll', function () {
    if (!quizState.startTime || quizState.isCompleted || quizState.isAbandoned) return;

    var scrollPct = Math.round(
      (window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)) * 100
    );

    if (Math.abs(scrollPct - lastStepScroll) >= 25) {
      trackQuizEvent('scroll_on_step', {
        step_order: quizState.currentStep,
        step_name: getStepName(quizState.currentStep),
        scroll_percentage: Math.min(100, scrollPct),
        scroll_depth: Math.round(window.scrollY)
      });
      lastStepScroll = scrollPct;
    }
  });

  // ═══════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoDetectQuiz);
  } else {
    autoDetectQuiz();
  }

  if (quizState.startTime && !quizState.isCompleted && !quizState.isAbandoned) {
    resetInactivityTimer();
  }

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  window.QuizTracker = {
    start: startQuiz,
    stepView: viewStep,
    answerClick: answerClick,
    stepBack: stepBack,
    stepSkip: stepSkip,
    complete: completeQuiz,
    abandon: abandonQuiz,
    flush: function () { flushMain(); flushQuiz(); },

    setFunnel: function (slug) {
      CONFIG.FUNNEL_SLUG = slug;
      quizState.funnelSlug = slug;
    },

    getState: function () {
      return {
        funnelSlug: quizState.funnelSlug,
        quizSessionId: quizState.quizSessionId,
        currentStep: quizState.currentStep,
        totalSteps: quizState.totalSteps,
        stepsViewed: quizState.stepsViewed.slice(),
        answersGiven: JSON.parse(JSON.stringify(quizState.answersGiven)),
        isCompleted: quizState.isCompleted,
        isAbandoned: quizState.isAbandoned,
        totalTimeSeconds: quizState.startTime
          ? Math.round((Date.now() - quizState.startTime) / 1000) : 0
      };
    },

    getStats: function () {
      var totalAnswered = Object.keys(quizState.answersGiven).length;
      var totalViewed = quizState.stepsViewed.length;
      var avgTime = 0;
      if (totalAnswered > 0) {
        var totalTime = 0;
        var answers = quizState.answersGiven;
        var keys = Object.keys(answers);
        for (var i = 0; i < keys.length; i++) totalTime += (answers[keys[i]].timeSeconds || 0);
        avgTime = Math.round(totalTime / totalAnswered);
      }
      return {
        totalStepsViewed: totalViewed,
        totalSteps: quizState.totalSteps,
        totalAnswered: totalAnswered,
        completionPct: quizState.totalSteps > 0
          ? Math.round((totalAnswered / quizState.totalSteps) * 100)
          : (totalViewed > 0 ? Math.round((totalAnswered / totalViewed) * 100) : 0),
        avgTimePerStep: avgTime,
        currentStep: quizState.currentStep,
        isCompleted: quizState.isCompleted,
        isAbandoned: quizState.isAbandoned
      };
    },

    getUserId: function () { return userId; },
    getSessionId: function () { return sessionId; },
    isReady: true
  };

  window.dispatchEvent(new Event('quiz-tracker-ready'));

  console.log('[QuizTracker] v2 Initialized');
  console.log('[QuizTracker] User:', userId, '| Session:', sessionId);
  console.log('[QuizTracker] Funnel:', CONFIG.FUNNEL_SLUG || 'NOT SET (use QuizTracker.start("slug"))');
  console.log('[QuizTracker] Main API:', CONFIG.TRACK_API_ENDPOINT);
  console.log('[QuizTracker] Quiz API:', CONFIG.SUPABASE_QUIZ_ENDPOINT || CONFIG.TRACK_QUIZ_ENDPOINT);
  console.log('[QuizTracker] Supabase:', HAS_SUPABASE ? 'CONNECTED' : 'NOT CONFIGURED (using /api/track-quiz fallback)');

  } catch (err) {
    console.error('[QuizTracker] Init failed:', err);
  }
})();
