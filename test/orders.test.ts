import { Page } from 'playwright';
import { login, scrapeOrderHistory, scrapeSearchResults, promptUser } from '../scrapper/orders'; // Assuming the original file is named amazon.ts

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
                    $$eval: jest.fn(),
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

describe('Test Script', () => {
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

    test('should login to Amazon', async () => {
        await login(page, 'testuser', 'testpassword');

        expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}`);
        expect(page.hover).toHaveBeenCalledWith('#nav-link-accountList');
        expect(page.click).toHaveBeenCalledWith('#nav-flyout-ya-signin a');
        expect(page.fill).toHaveBeenCalledWith('input#ap_email', 'testuser');
        expect(page.click).toHaveBeenCalledWith('input#continue');
        expect(page.fill).toHaveBeenCalledWith('input#ap_password', 'testpassword');
        expect(page.click).toHaveBeenCalledWith('input#signInSubmit');
    });

    test('should scrape order history', async () => {
        const mockOrders = [
            {
                name: 'Test Product 1',
                price: '₹1000',
                link: `${amazonUrl}/test-product-1`,
            },
        ];

        (page.$$eval as jest.Mock).mockResolvedValue(mockOrders);

        const orders = await scrapeOrderHistory(page);

        expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}/gp/your-account/order-history`);
        expect(page.waitForSelector).toHaveBeenCalledWith('.order');
        expect(orders).toEqual(mockOrders);
    });

    test('should scrape search results', async () => {
        const mockResults = [
            {
                name: 'Test Search Product 1',
                price: '₹5000',
                link: `${amazonUrl}/test-search-product-1`,
            },
        ];

        (page.$$eval as jest.Mock).mockResolvedValue(mockResults);

        const searchString = 'laptop';
        const results = await scrapeSearchResults(page, searchString);

        expect(page.goto).toHaveBeenCalledWith(`${amazonUrl}/s?k=${searchString}`);
        expect(page.waitForSelector).toHaveBeenCalledWith('.s-main-slot');
        expect(results).toEqual(mockResults);
    });

    test('should prompt user for input', async () => {
        const input = await promptUser('Please enter your name: ');
        expect(input).toBe('test input');
    });
});
