import puppeteer, { Browser } from "puppeteer-core";

export type DeviceType = "desktop" | "mobile";

const VIEWPORTS: Record<DeviceType, { width: number; height: number }> = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

const USER_AGENTS: Record<DeviceType, string> = {
  desktop:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

async function launchBrowser(device: DeviceType = "desktop"): Promise<Browser> {
  const viewport = VIEWPORTS[device];

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = await import("@sparticuz/chromium");
    return puppeteer.launch({
      args: chromium.default.args,
      defaultViewport: viewport,
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
    defaultViewport: viewport,
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

export async function captureScreenshot(
  url: string,
  device: DeviceType = "desktop"
): Promise<string> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  let browser: Browser | null = null;

  try {
    browser = await launchBrowser(device);
    const page = await browser.newPage();

    await page.setUserAgent(USER_AGENTS[device]);

    if (device === "mobile") {
      await page.emulate({
        viewport: { ...VIEWPORTS.mobile, isMobile: true, hasTouch: true },
        userAgent: USER_AGENTS.mobile,
      });
    }

    await page.goto(normalizedUrl, {
      waitUntil: "networkidle2",
      timeout: 45000,
    });

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

export async function captureScreenshotBothDevices(
  url: string
): Promise<{ desktop: string; mobile: string }> {
  const [desktop, mobile] = await Promise.all([
    captureScreenshot(url, "desktop"),
    captureScreenshot(url, "mobile"),
  ]);
  return { desktop, mobile };
}
