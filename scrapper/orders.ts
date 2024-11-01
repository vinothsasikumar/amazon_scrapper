import { chromium, Page } from 'playwright';
import * as readline from 'readline';

const amazonUrl = 'https://www.amazon.in'; // Amazon India website URL

/**
 * Prompts the user for input via the terminal.
 * 
 * @param {string} query - The message to display when asking for input.
 * @returns {Promise<string>} - A promise that resolves with the user's input.
 */
export const promptUser = (query: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close(); // Close the input interface after receiving the answer.
        resolve(answer); // Resolve the promise with the user's input.
    }));
};

/**
 * Logs into the Amazon account using the provided username and password.
 * 
 * @param {Page} page - The Playwright page object used for browser interaction.
 * @param {string} username - Amazon username (email or mobile number).
 * @param {string} password - Amazon account password.
 */
export async function login(page: Page, username: string, password: string, retryCount: number = 3) {
    let attempt = 0;
    let isSuccess = false;

    while (attempt < retryCount && !isSuccess) {
        try {

            await page.goto(amazonUrl); // Navigate to Amazon home page

            // Hover over the account list menu and click on the "Sign In" button
            await page.hover('#nav-link-accountList');
            await page.click('#nav-flyout-ya-signin a');

            // Fill in the email/phone and password fields
            await page.fill('input#ap_email', username);
            await page.click('input#continue');

            await page.fill('input#ap_password', password);
            await page.click('input#signInSubmit');

            console.log('If MFA is required, please complete it manually in the browser.');
            console.log('Waiting for potential MFA completion (maximum wait time: 60 seconds).');

            // Wait until twotabsearchtextbox loaded to DOM for manual MFA if needed
            const loggedIn = await page.waitForSelector('#twotabsearchtextbox', { timeout: 60000 }).catch(() => null);
            if (!loggedIn) {
                throw new Error('Login failed: MFA required but not completed or other login issues.');
            }

            console.log('Logged in successfully');
            isSuccess = true;

        }
        catch (err) {
            attempt += 1;
            console.error(`Login attempt ${attempt} failed: with exception: `, err);

            if (attempt < retryCount) {
                console.log(`Retrying login... (${attempt + 1}/${retryCount})`);
                await page.waitForTimeout(5000);
            } else {
                console.error('Max login attempts reached. Could not log in.');
            }
        }
    }

    if (!isSuccess) {
        throw new Error('Failed to log in. Please try again later.');
    }

}

/**
 * Scrapes the order history from the Amazon account and returns the last 10 orders.
 * 
 * @param {Page} page - The Playwright page object used for browser interaction.
 * @returns {Promise<Array<{name: string, price: string, link: string}>>} - A promise that resolves with the order details.
 */
export async function scrapeOrderHistory(page: Page) {
    try {

        await page.goto(`${amazonUrl}/gp/your-account/order-history`); // Navigate to the order history page

        // Wait for the order history to load or log if no orders are found
        const ordersExist = await page.waitForSelector('.order', { timeout: 10000 }).catch(() => null);
        if (!ordersExist) {
            console.warn('No order history found.');
            return [];
        }

        // Extract the last 10 orders' details (name, price, and product link)
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

        return orders; // Return the scraped orders

    }
    catch (err) {
        console.error('Exception:', err);
        return [];
    }
}

/**
 * Scrapes the search results from Amazon for a given search string.
 * 
 * @param {Page} page - The Playwright page object used for browser interaction.
 * @param {string} searchString - The search string to query on Amazon.
 * @returns {Promise<Array<{name: string, price: string, link: string}>>} - A promise that resolves with the product search results.
 */
export async function scrapeSearchResults(page: Page, searchString: string) {
    try {

        await page.goto(`${amazonUrl}/s?k=${searchString}`); // Navigate to the search results page for the given search string

        // Wait for search results to load or handle if none are found
        const resultsExist = await page.waitForSelector('.s-main-slot', { timeout: 10000 }).catch(() => null);
        if (!resultsExist) {
            console.warn(`No results found for "${searchString}".`);
            return [];
        }

        // Extract product details such as name, price, and link
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

        return products; // Return the scraped search results

    }
    catch (err) {
        console.error('Exception: ', err);
    }
}

// Main execution block
(async () => {
    // Prompt the user to enter Amazon credentials
    const username = await promptUser('Please enter your Amazon Email or Mobile Number: ');
    const password = await promptUser('Please enter your Amazon Password: ');

    // Launch the Chromium browser in non-headless mode (visible UI)
    const browser = await chromium.launch(
        {
            headless: false,
            args: ['--start-maximized']
        });

    // Create a new browser context and page
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    try {
        // Log in to Amazon
        await login(page, username, password);

        // Scrape and print the order history
        const orders = await scrapeOrderHistory(page);
        console.log(JSON.stringify(orders, null, 2));

        // Prompt the user to enter a search string (comma-separated for multiple searches)
        const searchString = await promptUser('Enter the search string (comma-separated for multiple searches): ');
        const searchStrings = searchString.split(',').map(s => s.trim());

        // Perform the search for each search string
        for (const search of searchStrings) {
            console.log(`Search value: ${search}`);

            // Scrape and print the search results
            const results = await scrapeSearchResults(page, search);
            console.log(JSON.stringify(results, null, 2));
        }

    } catch (error) {
        console.error('Something went wrong, please check the error log:', error); // Log any errors encountered during execution
    } finally {
        await browser.close(); // Close the browser after the execution is complete
    }
})();
