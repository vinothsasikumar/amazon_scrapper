import { chromium, Page } from 'playwright';
import * as readline from 'readline';

const amazonUrl = 'https://www.amazon.in';

export const promptUser = (query: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }));
};

export async function login(page: Page, username: string, password: string) {
    await page.goto(amazonUrl);

    await page.hover('#nav-link-accountList');
    await page.click('#nav-flyout-ya-signin a');

    await page.fill('input#ap_email', username);
    await page.click('input#continue');

    await page.fill('input#ap_password', password);
    await page.click('input#signInSubmit');

    console.log('If MFA is required, please complete it manually in the browser and the program waits for 25 seconds.');

    await page.waitForTimeout(25000);

    console.log('Logged in successfully');
}

export async function scrapeOrderHistory(page: Page) {
    await page.goto(`${amazonUrl}/gp/your-account/order-history`);

    await page.waitForSelector('.order');

    const orders = await page.$$eval('.order', (orderElements) => {
        return orderElements.slice(0, 10).map(order => {
            const orderElement = order.querySelectorAll('.shipment .a-row .a-link-normal')[1];
            const priceElement = order.querySelector('.currencyINR')?.parentElement;

            const name = orderElement ? orderElement.textContent?.trim() : 'No data available';
            const price = priceElement ? priceElement.textContent?.trim() : 'No data available';
            const link = orderElement ? (orderElement as HTMLLinkElement).href : 'No data available';

            return {
                name,
                price,
                link
            };
        });
    });

    return orders;
}

export async function scrapeSearchResults(page: Page, searchString: string) {
    await page.goto(`${amazonUrl}/s?k=${searchString}`);

    await page.waitForSelector('.s-main-slot');

    const products = await page.$$eval('.s-main-slot .s-result-item', (items) => {
        return items.slice(0, 10).map(item => {
            const nameElement = item.querySelector('h2 a span') as HTMLElement;
            const priceElement = item.querySelector('.a-price-whole') as HTMLElement;
            const linkElement = item.querySelector('h2 a') as HTMLLinkElement;

            const name = nameElement ? nameElement.innerText : 'No data available';
            const price = priceElement ? priceElement.innerText : 'No data available';
            const link = linkElement ? linkElement.href : 'No data available';

            return { name, price, link };
        });
    });

    return products;
}

(async () => {
    const username = await promptUser('Please enter your Amazon Email or Mobile Number: ');
    const password = await promptUser('Please enter your Amazon Password: ');

    const browser = await chromium.launch(
        {
            headless: false,
            args: ['--start-maximized']
        });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    try {

        await login(page, username, password);
        const orders = await scrapeOrderHistory(page);
        console.log(JSON.stringify(orders, null, 2));

        const searchString = await promptUser('Enter the search string (comma-separated for multiple searches): ');
        const searchStrings = searchString.split(',').map(s => s.trim());

        for (const search of searchStrings) {
            console.log(`Search value: ${search}`);

            const results = await scrapeSearchResults(page, search);
            console.log(JSON.stringify(results, null, 2));
        }

    } catch (error) {
        console.error('Something went wrong, please check the error log:', error);
    } finally {
        await browser.close();
    }
})();
