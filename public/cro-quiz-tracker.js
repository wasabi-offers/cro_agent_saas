/**
 * CRO Quiz Funnel Tracker
 *
 * Tracks user interactions in multi-step quiz funnels:
 *   - Step views and transitions
 *   - Answer clicks with timing
 *   - Hesitation detection (long pauses before answering)
 *   - Dropoff detection (abandonment, tab switch, exit intent)
 *   - Answer changes and back navigation
 *
 * Install:
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
 *
 * Manual API:
 *   window.QuizTracker.stepView(stepOrder, stepName)
 *   window.QuizTracker.answerClick(stepOrder, answerId, answerText, answerValue)
 *   window.QuizTracker.complete(score, result)
 *   window.QuizTracker.abandon(reason)
 *   window.QuizTracker.setFunnel(funnelSlug)
 *   window.QuizTracker.getStats()
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

  var APP_BASE_URL = '';
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
  if (!APP_BASE_URL) APP_BASE_URL = 'https://cro-agent.vercel.app';

  var CONFIG = {
    TRACK_ENDPOINT: SUPABASE_URL + '/functions/v1/track-quiz-event',
    AI_ANALYZE_ENDPOINT: SUPABASE_URL + '/functions/v1/ai-quiz-analyze',

    FUNNEL_SLUG: quizConfig.funnelSlug || null,

    USER_STORAGE_KEY: 'cro_user_id',
    USER_COOKIE_NAME: 'cro_uid',
    SESSION_STORAGE_KEY: 'cro_session_id',
    QUIZ_SESSION_KEY: 'cro_quiz_session',

    COOKIE_EXPIRY_DAYS: 730,
    BATCH_SIZE: 10,
    FLUSH_INTERVAL: 3000,

    HESITATION_THRESHOLD_MS: 8000,
    INACTIVITY_ABANDON_MS: 180000, // 3 minutes
    TAB_SWITCH_TIMEOUT_MS: 60000,  // 1 minute tab away = abandon

    AI_ENABLED: !!(SUPABASE_URL && SUPABASE_KEY),
    AI_AUTO_ANALYZE: quizConfig.aiAutoAnalyze !== false
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
      os: os()
    };
  }

  function extractUTM() {
    var p = new URLSearchParams(window.location.search);
    return {
      source: p.get('utm_source') || 'direct',
      medium: p.get('utm_medium') || 'none',
      campaign: p.get('utm_campaign') || null
    };
  }

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════

  var userId = ls(CONFIG.USER_STORAGE_KEY) || getCookie(CONFIG.USER_COOKIE_NAME) || generateId('usr');
  ls(CONFIG.USER_STORAGE_KEY, userId);
  setCookie(CONFIG.USER_COOKIE_NAME, userId, CONFIG.COOKIE_EXPIRY_DAYS);

  var sessionId = ss(CONFIG.SESSION_STORAGE_KEY) || generateId('sess');
  ss(CONFIG.SESSION_STORAGE_KEY, sessionId);

  var deviceInfo = detectDevice();
  var utmData = extractUTM();

  var quizState = {
    funnelSlug: CONFIG.FUNNEL_SLUG,
    quizSessionId: null,
    currentStep: 0,
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

  var savedQuizSession = ss(CONFIG.QUIZ_SESSION_KEY);
  if (savedQuizSession) {
    try {
      var parsed = JSON.parse(savedQuizSession);
      if (parsed.funnelSlug === CONFIG.FUNNEL_SLUG && !parsed.isCompleted && !parsed.isAbandoned) {
        quizState = Object.assign(quizState, parsed);
        quizState.lastActivityTime = Date.now();
      }
    } catch (_) {}
  }

  var eventQueue = [];

  function saveState() {
    ss(CONFIG.QUIZ_SESSION_KEY, JSON.stringify({
      funnelSlug: quizState.funnelSlug,
      quizSessionId: quizState.quizSessionId,
      currentStep: quizState.currentStep,
      startTime: quizState.startTime,
      stepsViewed: quizState.stepsViewed,
      answersGiven: quizState.answersGiven,
      isCompleted: quizState.isCompleted,
      isAbandoned: quizState.isAbandoned
    }));
  }

  // ═══════════════════════════════════════════
  // EVENT TRACKING CORE
  // ═══════════════════════════════════════════

  function trackQuizEvent(eventType, data) {
    quizState.lastActivityTime = Date.now();

    var timeSinceStart = quizState.startTime
      ? (Date.now() - quizState.startTime) / 1000
      : 0;

    var timeOnStep = quizState.stepStartTime
      ? (Date.now() - quizState.stepStartTime) / 1000
      : 0;

    var evt = {
      funnel_slug: quizState.funnelSlug,
      quiz_session_id: quizState.quizSessionId,
      user_id: userId,
      session_id: sessionId,
      event_type: eventType,
      step_order: quizState.currentStep,
      time_on_step_seconds: Math.round(timeOnStep * 100) / 100,
      time_since_start_seconds: Math.round(timeSinceStart * 100) / 100,
      device_type: deviceInfo.device_type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      source: utmData.source,
      medium: utmData.medium,
      campaign: utmData.campaign,
      url: window.location.href,
      timestamp: Date.now()
    };

    if (data) {
      var keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) evt[keys[i]] = data[keys[i]];
    }

    eventQueue.push(evt);
    if (eventQueue.length >= CONFIG.BATCH_SIZE) flushEvents();
  }

  function flushEvents() {
    if (eventQueue.length === 0) return;
    if (!CONFIG.AI_ENABLED) return;

    var batch = eventQueue.slice();
    eventQueue = [];

    var payload = JSON.stringify({ events: batch });

    try {
      fetch(CONFIG.TRACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'apikey': SUPABASE_KEY
        },
        body: payload,
        keepalive: true
      }).then(function (r) {
        if (!r.ok) eventQueue = batch.concat(eventQueue);
      }).catch(function () {
        eventQueue = batch.concat(eventQueue);
      });
    } catch (_) {
      try {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(CONFIG.TRACK_ENDPOINT, blob);
      } catch (__) {
        eventQueue = batch.concat(eventQueue);
      }
    }
  }

  setInterval(flushEvents, CONFIG.FLUSH_INTERVAL);

  // ═══════════════════════════════════════════
  // QUIZ LIFECYCLE
  // ═══════════════════════════════════════════

  function startQuiz(funnelSlug) {
    if (funnelSlug) quizState.funnelSlug = funnelSlug;
    if (!quizState.funnelSlug) {
      console.warn('[QuizTracker] No funnel slug configured');
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

    trackQuizEvent('quiz_start', {
      funnel_slug: quizState.funnelSlug
    });

    saveState();
    console.log('[QuizTracker] Quiz started:', quizState.funnelSlug, '| Session:', quizState.quizSessionId);
  }

  function viewStep(stepOrder, stepName) {
    quizState.currentStep = stepOrder;
    quizState.stepStartTime = Date.now();

    if (quizState.stepsViewed.indexOf(stepOrder) === -1) {
      quizState.stepsViewed.push(stepOrder);
    }

    trackQuizEvent('step_view', {
      step_order: stepOrder,
      step_name: stepName || 'Step ' + stepOrder,
      total_steps_viewed: quizState.stepsViewed.length
    });

    startHesitationTimer(stepOrder);
    saveState();
  }

  function answerClick(stepOrder, answerId, answerText, answerValue) {
    clearHesitationTimer(stepOrder);

    var timeOnStep = quizState.stepStartTime
      ? (Date.now() - quizState.stepStartTime) / 1000
      : 0;

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
      answer_id: answerId,
      answer_text: answerText,
      answer_value: answerValue,
      previous_answer_id: previousAnswer ? previousAnswer.answerId : null,
      time_on_step_seconds: Math.round(timeOnStep * 100) / 100,
      hesitation_detected: timeOnStep > (CONFIG.HESITATION_THRESHOLD_MS / 1000),
      hesitation_duration_ms: timeOnStep > (CONFIG.HESITATION_THRESHOLD_MS / 1000)
        ? Math.round(timeOnStep * 1000)
        : 0
    });

    saveState();
  }

  function stepBack(fromStep, toStep) {
    trackQuizEvent('step_back', {
      step_order: fromStep,
      target_step: toStep
    });
  }

  function stepSkip(stepOrder) {
    trackQuizEvent('step_skip', {
      step_order: stepOrder
    });
  }

  function completeQuiz(score, result) {
    if (quizState.isCompleted) return;
    quizState.isCompleted = true;
    quizState.totalTimeMs = Date.now() - (quizState.startTime || Date.now());

    trackQuizEvent('quiz_complete', {
      quiz_score: score || 0,
      quiz_result: result || null,
      total_time_seconds: Math.round(quizState.totalTimeMs / 1000),
      total_steps_answered: Object.keys(quizState.answersGiven).length,
      answers_summary: quizState.answersGiven
    });

    flushEvents();
    saveState();
    console.log('[QuizTracker] Quiz completed. Score:', score, '| Result:', result);
  }

  function abandonQuiz(reason) {
    if (quizState.isAbandoned || quizState.isCompleted) return;
    quizState.isAbandoned = true;
    quizState.totalTimeMs = Date.now() - (quizState.startTime || Date.now());

    trackQuizEvent('quiz_abandon', {
      dropoff_step: quizState.currentStep,
      dropoff_reason: reason || 'unknown',
      total_time_seconds: Math.round(quizState.totalTimeMs / 1000),
      total_steps_answered: Object.keys(quizState.answersGiven).length,
      last_step_reached: quizState.currentStep,
      completion_percentage: quizState.stepsViewed.length > 0
        ? Math.round((Object.keys(quizState.answersGiven).length / quizState.stepsViewed.length) * 100)
        : 0
    });

    flushEvents();
    saveState();
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
        hesitation_detected: true,
        hesitation_duration_ms: CONFIG.HESITATION_THRESHOLD_MS,
        time_on_step_seconds: (Date.now() - quizState.stepStartTime) / 1000
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
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (quizState.isCompleted || quizState.isAbandoned || !quizState.startTime) return;

    inactivityTimer = setTimeout(function () {
      abandonQuiz('timeout');
    }, CONFIG.INACTIVITY_ABANDON_MS);
  }

  document.addEventListener('click', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
  document.addEventListener('mousemove', function () {
    quizState.lastActivityTime = Date.now();
  });

  var tabSwitchTime = null;

  document.addEventListener('visibilitychange', function () {
    if (quizState.isCompleted || quizState.isAbandoned || !quizState.startTime) return;

    if (document.hidden) {
      tabSwitchTime = Date.now();
      trackQuizEvent('tab_switch_away', {
        step_order: quizState.currentStep
      });
      flushEvents();
    } else {
      if (tabSwitchTime) {
        var awayMs = Date.now() - tabSwitchTime;
        trackQuizEvent('tab_switch_back', {
          step_order: quizState.currentStep,
          away_duration_ms: awayMs
        });

        if (awayMs > CONFIG.TAB_SWITCH_TIMEOUT_MS) {
          abandonQuiz('tab_switch');
        }
        tabSwitchTime = null;
      }
    }
  });

  var exitIntentTracked = false;
  document.addEventListener('mouseout', function (e) {
    if (quizState.isCompleted || quizState.isAbandoned || !quizState.startTime) return;
    if (!exitIntentTracked && e.clientY < 0) {
      exitIntentTracked = true;
      trackQuizEvent('exit_intent_on_step', {
        step_order: quizState.currentStep
      });
      setTimeout(function () { exitIntentTracked = false; }, 10000);
    }
  });

  window.addEventListener('beforeunload', function () {
    if (quizState.startTime && !quizState.isCompleted && !quizState.isAbandoned) {
      abandonQuiz('navigation');
    }
    flushEvents();
    if (eventQueue.length > 0) {
      try {
        var blob = new Blob([JSON.stringify({ events: eventQueue })], { type: 'application/json' });
        navigator.sendBeacon(CONFIG.TRACK_ENDPOINT, blob);
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

    if (!quizState.startTime) {
      startQuiz(CONFIG.FUNNEL_SLUG);
    }

    var observer = new MutationObserver(function () {
      detectVisibleStep();
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    for (var i = 0; i < steps.length; i++) {
      bindStepAnswers(steps[i]);
    }

    var nextBtns = document.querySelectorAll('[data-quiz-next]');
    for (var n = 0; n < nextBtns.length; n++) {
      nextBtns[n].addEventListener('click', function () {
        var nextStep = parseInt(this.getAttribute('data-quiz-next')) || quizState.currentStep + 1;
        viewStep(nextStep, getStepName(nextStep));
      });
    }

    var backBtns = document.querySelectorAll('[data-quiz-back]');
    for (var b = 0; b < backBtns.length; b++) {
      backBtns[b].addEventListener('click', function () {
        var backTo = parseInt(this.getAttribute('data-quiz-back')) || quizState.currentStep - 1;
        stepBack(quizState.currentStep, backTo);
        viewStep(backTo, getStepName(backTo));
      });
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
        scroll_percentage: Math.min(100, scrollPct)
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
    flush: flushEvents,

    setFunnel: function (slug) {
      CONFIG.FUNNEL_SLUG = slug;
      quizState.funnelSlug = slug;
    },

    getState: function () {
      return {
        funnelSlug: quizState.funnelSlug,
        quizSessionId: quizState.quizSessionId,
        currentStep: quizState.currentStep,
        stepsViewed: quizState.stepsViewed.slice(),
        answersGiven: Object.assign({}, quizState.answersGiven),
        isCompleted: quizState.isCompleted,
        isAbandoned: quizState.isAbandoned,
        totalTimeSeconds: quizState.startTime
          ? Math.round((Date.now() - quizState.startTime) / 1000)
          : 0
      };
    },

    getStats: function () {
      var totalAnswered = Object.keys(quizState.answersGiven).length;
      var totalViewed = quizState.stepsViewed.length;
      return {
        totalStepsViewed: totalViewed,
        totalAnswered: totalAnswered,
        completionPct: totalViewed > 0 ? Math.round((totalAnswered / totalViewed) * 100) : 0,
        avgTimePerStep: totalAnswered > 0
          ? Math.round(Object.values(quizState.answersGiven).reduce(function (s, a) {
              return s + (a.timeSeconds || 0);
            }, 0) / totalAnswered)
          : 0,
        currentStep: quizState.currentStep
      };
    },

    getUserId: function () { return userId; },
    getSessionId: function () { return sessionId; },
    isReady: true
  };

  window.dispatchEvent(new Event('quiz-tracker-ready'));

  console.log('[QuizTracker] Initialized');
  console.log('[QuizTracker] User:', userId, '| Session:', sessionId);
  console.log('[QuizTracker] Funnel:', CONFIG.FUNNEL_SLUG || 'NOT SET (use QuizTracker.setFunnel("slug"))');
  console.log('[QuizTracker] AI:', CONFIG.AI_ENABLED ? 'ENABLED' : 'DISABLED');

  } catch (err) {
    console.error('[QuizTracker] Init failed:', err);
  }
})();
