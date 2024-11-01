import { Page } from 'playwright';
import { promptUser, login, scrapeOrderHistory, scrapeSearchResults } from '../scrapper/orders'; // Update the import path as necessary

const amazonUrl = 'https://www.amazon.in';

jest.mock('playwright', () => ({
    chromium: {
        launch: jest.fn().mockResolvedValue({
            newContext: jest.fn().mockResolvedValue({
                newPage: jest.fn().mockResolvedValue({
                    goto: jest.fn(),
                    hover: jest.fn(),
                    click: jest.fn(),
                    fill: jest.fn(),
                    waitForTimeout: jest.fn(),
                    waitForSelector: jest.fn(),
                    $$eval: jest.fn(), // Ensure $$eval is properly mocked here
                }),
            }),
            close: jest.fn(),
        }),
    },
}));

jest.mock('readline', () => ({
    createInterface: jest.fn().mockReturnValue({
        question: jest.fn((_, callback) => callback('test input')),
        close: jest.fn(),
    }),
}));

describe('Amazon Scraper Tests', () => {
    let page: Page;

    beforeEach(async () => {
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        const context = await browser.newContext();
        page = await context.newPage();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('promptUser function', () => {
        test('should prompt user and return input', async () => {
            const input = await promptUser('Please enter your name: ');
            expect(input).toBe('test input');
        });
    });

    describe('login function', () => {
        test('should login to Amazon successfully with retry', async () => {
            (page.waitForSelector as jest.Mock)
                .mockRejectedValueOnce(new Error('Timeout'))
                .mockResolvedValueOnce(true);

            await login(page, 'testuser', 'testpassword');

            expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}`);
            expect(page.hover).toHaveBeenCalledWith('#nav-link-accountList');
            expect(page.click).toHaveBeenCalledWith('#nav-flyout-ya-signin a');
            expect(page.fill).toHaveBeenCalledWith('input#ap_email', 'testuser');
            expect(page.click).toHaveBeenCalledWith('input#continue');
            expect(page.fill).toHaveBeenCalledWith('input#ap_password', 'testpassword');
            expect(page.click).toHaveBeenCalledWith('input#signInSubmit');
            expect(page.waitForSelector).toHaveBeenCalledWith('#twotabsearchtextbox', { timeout: 60000 });
        });

        test('should retry login and fail after max attempts', async () => {
            (page.waitForSelector as jest.Mock).mockRejectedValue(new Error('Timeout'));

            await expect(login(page, 'testuser', 'testpassword', 2)).rejects.toThrow(
                'Failed to log in. Please try again later.'
            );
            expect(page.goto).toHaveBeenCalledTimes(2);
        });
    });

    describe('scrapeOrderHistory function', () => {
        test('should return orders when present', async () => {
            const mockOrders = [
                { name: 'Product 1', price: '₹1000', link: `${amazonUrl}/product-1` },
                { name: 'Product 2', price: '₹2000', link: `${amazonUrl}/product-2` },
            ];

            (page.goto as jest.Mock).mockResolvedValue(undefined);
            (page.$$eval as jest.Mock).mockResolvedValue(mockOrders);

            const orders = await scrapeOrderHistory(page);

            expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}/gp/your-account/order-history`);
            expect(page.waitForSelector).toHaveBeenCalledWith('.order', { timeout: 10000 });
            expect(orders).toEqual(mockOrders);
        });

        test('should return empty array when no orders found', async () => {
            (page.$$eval as jest.Mock).mockResolvedValue([]);
            (page.waitForSelector as jest.Mock).mockRejectedValue(new Error('No order history found'));

            const orders = await scrapeOrderHistory(page);

            expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}/gp/your-account/order-history`);
            expect(orders).toEqual([]);
        });
    });

    fdescribe('scrapeSearchResults function', () => {
        test('should return search results when products are found', async () => {            
            const mockResults = [
                { name: 'Search Product 1', price: '₹5000', link: `${amazonUrl}/search-product-1` },
                { name: 'Search Product 2', price: '₹3000', link: `${amazonUrl}/search-product-2` },
            ];

            (page.goto as jest.Mock).mockResolvedValue(undefined);
            (page.$$eval as jest.Mock).mockResolvedValue(mockResults);

            const searchString = 'laptop';
            const results = await scrapeSearchResults(page, searchString);

            expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}/s?k=${searchString}`);
            expect(page.waitForSelector).toHaveBeenCalledWith('.s-main-slot', { timeout: 10000 });

            console.log('results:', results);
            console.log('mock: ', mockResults);
            expect(results).toEqual(mockResults);
        });

        test('should return empty array when no search results are found', async () => {
            (page.$$eval as jest.Mock).mockResolvedValue([]);
            (page.waitForSelector as jest.Mock).mockRejectedValue(new Error('No results found'));

            const searchString = 'nonexistentproduct';
            const results = await scrapeSearchResults(page, searchString);

            expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}/s?k=${searchString}`);
            expect(results).toEqual([]);
        });
    });
});
