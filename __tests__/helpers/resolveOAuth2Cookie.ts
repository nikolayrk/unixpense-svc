import { chromium } from '@playwright/test';
import Constants from '@shared/constants';

const resolveOAuth2CookieAsync = async () => {
  const url = `${Constants.baseUrl}/swagger`;
  const username = "user";
  const claims = { email: "user@example.com" };

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('input[name="username"]');
    await page.fill('input[name="username"]', username);

    await page.waitForSelector('textarea[name="claims"]');
    await page.fill('textarea[name="claims"]', JSON.stringify(claims));

    await page.waitForSelector('input[type="submit"][value="Sign-in"]');
    await page.click('input[type="submit"][value="Sign-in"]');

    const cookies = await page.context().cookies();
    const cookie = cookies.find(cookie => cookie.name === Constants.cookieName);

    if (!cookie) {
      const content = await page.content();

      throw new Error('OAuth2 proxy cookie not found after authentication');
    }

    return cookie;
  } finally {
    await context.close();
    await browser.close();
  }
}

export { resolveOAuth2CookieAsync }