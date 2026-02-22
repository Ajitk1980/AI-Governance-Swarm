import puppeteer from 'puppeteer';

console.log("Starting Puppeteer end-to-end browser test...");

try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    console.log("Navigating to http://localhost:5174 ...");
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });

    console.log("Locating the URL input field...");
    await page.type('input[type="url"]', 'https://fast-test.com');

    console.log("Clicking the 'Analyze Risk' button...");
    await page.click('button[type="submit"]');

    console.log("Waiting for the mock report to render...");
    await page.waitForSelector('.prose', { timeout: 10000 });
    const reportText = await page.$eval('.prose', el => el.innerText);
    console.log("Report rendered correctly:");
    console.log(reportText);

    console.log("\nTesting the new Save functionality...");

    // Puppeteer query to find the button
    // Inject mock fetch to intercept API calls without breaking Vite!
    await page.evaluateOnNewDocument(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            if (typeof url === 'string' && url.includes('ai-risk-assessment')) {
                return new Response('# Mock Analysis Report\n\n- Security: Low Risk\n- Privacy: Moderate\n- Utility: High', {
                    status: 200, headers: { 'Content-Type': 'text/plain' }
                });
            }
            if (typeof url === 'string' && url.includes('save-risk-assessment')) {
                return new Response(JSON.stringify({ success: true }), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                });
            }
            return originalFetch(...args);
        };
    });
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    let saveButton = null;
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.includes('Save to Sheets')) {
            saveButton = btn;
            break;
        }
    }

    if (saveButton) {
        console.log("Found the 'Save to Sheets' button. Clicking it...");
        await saveButton.click();

        // Wait for the button text to change
        await page.waitForFunction(
            () => {
                const btns = Array.from(document.querySelectorAll('button'));
                return btns.some(b => b.innerText.includes('Saved') || b.innerText.includes('✓ Saved'));
            }
        );

        console.log("✅ The Save button transitioned to 'Saved' state correctly!");
    } else {
        throw new Error("Could not find the Save button");
    }

    console.log("\n✅ === END-TO-END V3 TEST SUCCESS === ✅\n");
    await browser.close();
} catch (error) {
    console.error("\n❌ Browser Test failed:", error.message);
    process.exit(1);
}
