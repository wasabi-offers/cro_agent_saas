import puppeteer, { Browser } from "puppeteer-core";

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 900;

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = await import("@sparticuz/chromium");
    return puppeteer.launch({
      args: chromium.default.args,
      defaultViewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless as boolean,
    });
  }

  const localPaths: Record<string, string> = {
    darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    linux: "/usr/bin/google-chrome",
  };

  const executablePath = localPaths[process.platform] || localPaths.linux;

  return puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--no-first-run",
    ],
  });
}

export async function captureScreenshot(url: string): Promise<string> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(normalizedUrl, {
      waitUntil: "networkidle2",
      timeout: 45000,
    });

    // Scroll the entire page to trigger lazy-loaded images, animations, sticky elements
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 150);
      });
    });

    // Wait for lazy content to finish rendering after scroll
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const screenshotBuffer = await page.screenshot({
      type: "jpeg",
      quality: 90,
      fullPage: true,
    });

    return Buffer.from(screenshotBuffer).toString("base64");
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
