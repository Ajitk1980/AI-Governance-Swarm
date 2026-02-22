import puppeteer from 'puppeteer';

console.log("Starting Puppeteer test for Save button state persistence...");

try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Inject mock fetch to intercept API calls
    await page.evaluateOnNewDocument(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            if (typeof url === 'string' && url.includes('ai-risk-assessment')) {
                // Mock a 1s delay to test loading state nicely
                await new Promise(r => setTimeout(r, 1000));
                return new Response('# Mock Analysis Report\n\n- Security: Low Risk\n- Privacy: Moderate\n- Utility: High', {
                    status: 200, headers: { 'Content-Type': 'text/plain' }
                });
            }
            if (typeof url === 'string' && url.includes('save-risk-assessment')) {
                await new Promise(r => setTimeout(r, 500));
                return new Response(JSON.stringify({ success: true }), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                });
            }
            return originalFetch(...args);
        };
    });

    console.log("Navigating to dashboard...");
    await page.goto('http://localhost:5174');

    // Run 1: Analyze and Save
    console.log("Run 1: Input URL and Analyze...");
    await page.waitForSelector('input[type="url"]');
    // Clear any existing value properly for React
    await page.click('input[type="url"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="url"]', 'https://example.com/one');

    await page.click('button[type="submit"]');

    console.log("Waiting for the mock report to render...");
    await page.waitForSelector('.prose');

    console.log("Clicking Save to Sheets...");
    let buttons = await page.$$('button');
    let saveButton = null;
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.includes('Save to Sheets')) { saveButton = btn; break; }
    }

    if (!saveButton) throw new Error("Could not find the Save button for Run 1");
    await saveButton.click();

    console.log("Waiting for state to turn to 'Saved'...");
    await page.waitForFunction(
        () => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.some(b => b.innerText.includes('Saved') || b.innerText.includes('✓ Saved'));
        }
    );
    console.log("✅ Run 1 saved successfully!");

    // Run 2: Analyze a new URL and verify button resets to "Save to Sheets"
    console.log("Run 2: Input new URL and Analyze...");
    // Clear input properly for React
    await page.click('input[type="url"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="url"]', 'https://example.com/two');

    await page.click('button[type="submit"]');

    // As soon as we submit, the save button should either disappear or reset. Wait for report again.
    console.log("Waiting for new report...");
    await page.waitForSelector('.prose');

    console.log("Checking the Save button state...");
    buttons = await page.$$('button');
    let freshSaveButtonFound = false;
    let savedButtonFound = false;

    for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.includes('Save to Sheets')) freshSaveButtonFound = true;
        if (text.includes('✓ Saved') || text.includes('Saved')) savedButtonFound = true;
    }

    if (savedButtonFound && !freshSaveButtonFound) {
        throw new Error("❌ The Save button is STILL 'Saved' from Run 1! Persistence bug detected.");
    }

    if (freshSaveButtonFound) {
        console.log("✅ The Save button successfully reverted to 'Save to Sheets'!");
    }

    console.log("\n✅ === BUTTON PERSISTENCE TEST SUCCESS === ✅\n");
    await browser.close();
} catch (error) {
    console.error("\n❌ Browser Test failed:", error.message);
    process.exit(1);
}
