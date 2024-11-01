"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptUser = void 0;
exports.login = login;
exports.scrapeOrderHistory = scrapeOrderHistory;
exports.scrapeSearchResults = scrapeSearchResults;
var playwright_1 = require("playwright");
var readline = require("readline");
var amazonUrl = 'https://www.amazon.in'; // Amazon India website URL
/**
 * Prompts the user for input via the terminal.
 *
 * @param {string} query - The message to display when asking for input.
 * @returns {Promise<string>} - A promise that resolves with the user's input.
 */
var promptUser = function (query) {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(function (resolve) { return rl.question(query, function (answer) {
        rl.close(); // Close the input interface after receiving the answer.
        resolve(answer); // Resolve the promise with the user's input.
    }); });
};
exports.promptUser = promptUser;
/**
 * Logs into the Amazon account using the provided username and password.
 *
 * @param {Page} page - The Playwright page object used for browser interaction.
 * @param {string} username - Amazon username (email or mobile number).
 * @param {string} password - Amazon account password.
 */
function login(page_1, username_1, password_1) {
    return __awaiter(this, arguments, void 0, function (page, username, password, retryCount) {
        var attempt, isSuccess, loggedIn, err_1;
        if (retryCount === void 0) { retryCount = 3; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attempt = 0;
                    isSuccess = false;
                    _a.label = 1;
                case 1:
                    if (!(attempt < retryCount && !isSuccess)) return [3 /*break*/, 16];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 11, , 15]);
                    return [4 /*yield*/, page.goto(amazonUrl)];
                case 3:
                    _a.sent(); // Navigate to Amazon home page
                    // Hover over the account list menu and click on the "Sign In" button
                    return [4 /*yield*/, page.hover('#nav-link-accountList')];
                case 4:
                    // Hover over the account list menu and click on the "Sign In" button
                    _a.sent();
                    return [4 /*yield*/, page.click('#nav-flyout-ya-signin a')];
                case 5:
                    _a.sent();
                    // Fill in the email/phone and password fields
                    return [4 /*yield*/, page.fill('input#ap_email', username)];
                case 6:
                    // Fill in the email/phone and password fields
                    _a.sent();
                    return [4 /*yield*/, page.click('input#continue')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, page.fill('input#ap_password', password)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, page.click('input#signInSubmit')];
                case 9:
                    _a.sent();
                    console.log('If MFA is required, please complete it manually in the browser.');
                    console.log('Waiting for potential MFA completion (maximum wait time: 60 seconds).');
                    return [4 /*yield*/, page.waitForSelector('#twotabsearchtextbox', { timeout: 60000 }).catch(function () { return null; })];
                case 10:
                    loggedIn = _a.sent();
                    if (!loggedIn) {
                        throw new Error('Login failed: MFA required but not completed or other login issues.');
                    }
                    console.log('Logged in successfully');
                    isSuccess = true;
                    return [3 /*break*/, 15];
                case 11:
                    err_1 = _a.sent();
                    attempt += 1;
                    console.error("Login attempt ".concat(attempt, " failed: with exception: "), err_1);
                    if (!(attempt < retryCount)) return [3 /*break*/, 13];
                    console.log("Retrying login... (".concat(attempt + 1, "/").concat(retryCount, ")"));
                    return [4 /*yield*/, page.waitForTimeout(5000)];
                case 12:
                    _a.sent();
                    return [3 /*break*/, 14];
                case 13:
                    console.error('Max login attempts reached. Could not log in.');
                    _a.label = 14;
                case 14: return [3 /*break*/, 15];
                case 15: return [3 /*break*/, 1];
                case 16:
                    if (!isSuccess) {
                        throw new Error('Failed to log in. Please try again later.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Scrapes the order history from the Amazon account and returns the last 10 orders.
 *
 * @param {Page} page - The Playwright page object used for browser interaction.
 * @returns {Promise<Array<{name: string, price: string, link: string}>>} - A promise that resolves with the order details.
 */
function scrapeOrderHistory(page) {
    return __awaiter(this, void 0, void 0, function () {
        var ordersExist, orders, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, page.goto("".concat(amazonUrl, "/gp/your-account/order-history"))];
                case 1:
                    _a.sent(); // Navigate to the order history page
                    return [4 /*yield*/, page.waitForSelector('.order', { timeout: 10000 }).catch(function () { return null; })];
                case 2:
                    ordersExist = _a.sent();
                    if (!ordersExist) {
                        console.warn('No order history found.');
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, page.$$eval('.order', function (orderElements) {
                            return orderElements.slice(0, 10).map(function (order) {
                                var _a, _b, _c;
                                var orderElement = order.querySelectorAll('.shipment .a-row .a-link-normal')[1];
                                var priceElement = (_a = order.querySelector('.currencyINR')) === null || _a === void 0 ? void 0 : _a.parentElement;
                                var name = orderElement ? (_b = orderElement.textContent) === null || _b === void 0 ? void 0 : _b.trim() : 'No data available';
                                var price = priceElement ? (_c = priceElement.textContent) === null || _c === void 0 ? void 0 : _c.trim() : 'No data available';
                                var link = orderElement ? orderElement.href : 'No data available';
                                return {
                                    name: name,
                                    price: price,
                                    link: link
                                };
                            });
                        })];
                case 3:
                    orders = _a.sent();
                    return [2 /*return*/, orders]; // Return the scraped orders
                case 4:
                    err_2 = _a.sent();
                    console.error('Exception:', err_2);
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Scrapes the search results from Amazon for a given search string.
 *
 * @param {Page} page - The Playwright page object used for browser interaction.
 * @param {string} searchString - The search string to query on Amazon.
 * @returns {Promise<Array<{name: string, price: string, link: string}>>} - A promise that resolves with the product search results.
 */
function scrapeSearchResults(page, searchString) {
    return __awaiter(this, void 0, void 0, function () {
        var resultsExist, products, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, page.goto("".concat(amazonUrl, "/s?k=").concat(searchString))];
                case 1:
                    _a.sent(); // Navigate to the search results page for the given search string
                    return [4 /*yield*/, page.waitForSelector('.s-main-slot', { timeout: 10000 }).catch(function () { return null; })];
                case 2:
                    resultsExist = _a.sent();
                    if (!resultsExist) {
                        console.warn("No results found for \"".concat(searchString, "\"."));
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, page.$$eval('.s-main-slot .s-result-item', function (items) {
                            return items.slice(0, 10).map(function (item) {
                                var nameElement = item.querySelector('h2 a span');
                                var priceElement = item.querySelector('.a-price-whole');
                                var linkElement = item.querySelector('h2 a');
                                var name = nameElement ? nameElement.innerText : 'No data available';
                                var price = priceElement ? priceElement.innerText : 'No data available';
                                var link = linkElement ? linkElement.href : 'No data available';
                                return { name: name, price: price, link: link };
                            });
                        })];
                case 3:
                    products = _a.sent();
                    return [2 /*return*/, products]; // Return the scraped search results
                case 4:
                    err_3 = _a.sent();
                    console.error('Exception: ', err_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Main execution block
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var username, password, browser, context, page, orders, searchString, searchStrings, _i, searchStrings_1, search, results, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.promptUser)('Please enter your Amazon Email or Mobile Number: ')];
            case 1:
                username = _a.sent();
                return [4 /*yield*/, (0, exports.promptUser)('Please enter your Amazon Password: ')];
            case 2:
                password = _a.sent();
                return [4 /*yield*/, playwright_1.chromium.launch({
                        headless: false,
                        args: ['--start-maximized']
                    })];
            case 3:
                browser = _a.sent();
                return [4 /*yield*/, browser.newContext({ viewport: null })];
            case 4:
                context = _a.sent();
                return [4 /*yield*/, context.newPage()];
            case 5:
                page = _a.sent();
                _a.label = 6;
            case 6:
                _a.trys.push([6, 14, 15, 17]);
                // Log in to Amazon
                return [4 /*yield*/, login(page, username, password)];
            case 7:
                // Log in to Amazon
                _a.sent();
                return [4 /*yield*/, scrapeOrderHistory(page)];
            case 8:
                orders = _a.sent();
                console.log(JSON.stringify(orders, null, 2));
                return [4 /*yield*/, (0, exports.promptUser)('Enter the search string (comma-separated for multiple searches): ')];
            case 9:
                searchString = _a.sent();
                searchStrings = searchString.split(',').map(function (s) { return s.trim(); });
                _i = 0, searchStrings_1 = searchStrings;
                _a.label = 10;
            case 10:
                if (!(_i < searchStrings_1.length)) return [3 /*break*/, 13];
                search = searchStrings_1[_i];
                console.log("Search value: ".concat(search));
                return [4 /*yield*/, scrapeSearchResults(page, search)];
            case 11:
                results = _a.sent();
                console.log(JSON.stringify(results, null, 2));
                _a.label = 12;
            case 12:
                _i++;
                return [3 /*break*/, 10];
            case 13: return [3 /*break*/, 17];
            case 14:
                error_1 = _a.sent();
                console.error('Something went wrong, please check the error log:', error_1); // Log any errors encountered during execution
                return [3 /*break*/, 17];
            case 15: return [4 /*yield*/, browser.close()];
            case 16:
                _a.sent(); // Close the browser after the execution is complete
                return [7 /*endfinally*/];
            case 17: return [2 /*return*/];
        }
    });
}); })();
