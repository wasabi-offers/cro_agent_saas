/**
 * Quiz Tracking Script Generator
 *
 * Generates the <script> tags needed to install quiz tracking
 * on external quiz funnel pages.
 */

export interface QuizTrackingOptions {
  funnelSlug: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  appUrl?: string;
  hesitationThreshold?: number;
  inactivityTimeout?: number;
  tabSwitchTimeout?: number;
}

export function getQuizTrackingScriptTag(options: QuizTrackingOptions): string {
  const appUrl = options.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://cro-agent.vercel.app';

  const configParts: string[] = [
    `funnelSlug: "${options.funnelSlug}"`,
    `appUrl: "${appUrl}"`,
  ];

  if (options.supabaseUrl) {
    configParts.push(`supabaseUrl: "${options.supabaseUrl}"`);
  }
  if (options.supabaseKey) {
    configParts.push(`supabaseKey: "${options.supabaseKey}"`);
  }
  if (options.hesitationThreshold) {
    configParts.push(`hesitationThreshold: ${options.hesitationThreshold}`);
  }
  if (options.inactivityTimeout) {
    configParts.push(`inactivityTimeout: ${options.inactivityTimeout}`);
  }
  if (options.tabSwitchTimeout) {
    configParts.push(`tabSwitchTimeout: ${options.tabSwitchTimeout}`);
  }

  return `<!-- CRO Quiz Funnel Tracker -->
<script>
window.quizConfig = {
  ${configParts.join(',\n  ')}
};
</script>
<script src="${appUrl}/cro-quiz-tracker.js"></script>`;
}

export function getQuizTrackingScriptTagMinimal(funnelSlug: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cro-agent.vercel.app';
  return `<!-- CRO Quiz Funnel Tracker -->
<script>window.quizConfig={funnelSlug:"${funnelSlug}"};</script>
<script src="${appUrl}/cro-quiz-tracker.js"></script>`;
}

export function generateQuizDOMExample(steps: Array<{ name: string; answers: Array<{ id: string; text: string }> }>): string {
  let html = '';
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;
    const display = i === 0 ? '' : ' style="display:none"';
    html += `<div data-quiz-step="${stepNum}"${display}>\n`;
    html += `  <h2 data-quiz-question>${step.name}</h2>\n`;
    for (const answer of step.answers) {
      html += `  <button data-quiz-answer="${answer.id}">${answer.text}</button>\n`;
    }
    if (i > 0) {
      html += `  <button data-quiz-back="${stepNum - 1}">Back</button>\n`;
    }
    if (i < steps.length - 1) {
      html += `  <button data-quiz-next="${stepNum + 1}">Next</button>\n`;
    } else {
      html += `  <button data-quiz-complete data-quiz-score="0">Get Results</button>\n`;
    }
    html += `</div>\n\n`;
  }
  return html.trim();
}
