import puppeteer from 'puppeteer';

console.log("Starting Puppeteer test for Real-Time SSE Log Streaming...");

try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Inject mock fetch to intercept API calls
    await page.evaluateOnNewDocument(() => {
        const originalFetch = window.fetch;
        const OriginalEventSource = window.EventSource;

        // Mock EventSource for real-time streaming
        class MockEventSource {
            constructor(url) {
                this.url = url;
                // Simulate real-time pulses every 500ms
                setTimeout(() => this.onmessage({ data: "[12:00:01] [Security Analyst] Analyzing url architecture..." }), 500);
                setTimeout(() => this.onmessage({ data: "[12:00:02] [Security Analyst] Task completed." }), 1000);
                setTimeout(() => this.onmessage({ data: "[12:00:03] [Privacy Reviewer] Reviewing data collection points..." }), 1500);
            }
            close() {
                console.log("MockEventSource closed correctly by frontend!");
            }
        }
        window.EventSource = MockEventSource;

        window.fetch = async (...args) => {
            const url = args[0];
            if (typeof url === 'string' && url.includes('ai-risk-assessment')) {
                // Mock a 2s delay total to give SSE time to stream 3 messages
                await new Promise(r => setTimeout(r, 2000));
                return new Response('# Mock Analysis Report\n\n- Security: Low Risk', {
                    status: 200, headers: { 'Content-Type': 'text/plain' }
                });
            }
            return originalFetch(...args);
        };
    });

    console.log("Navigating to dashboard...");
    await page.goto('http://localhost:5174');

    await page.waitForSelector('input[type="url"]');
    await page.type('input[type="url"]', 'https://fast-test.com');

    console.log("Clicking Analyze...");
    await page.click('button[type="submit"]');

    // Verify that the Terminal window appears IMMEDIATELY while loading
    console.log("Waiting for Terminal block to appear...");
    await page.waitForXPath("//span[contains(text(), 'CREWAI_AGENT_ACTIVITY_LOG')]", { timeout: 2000 });
    console.log("✅ Terminal window spawned correctly!");

    // Verify the chunks are streaming onto the screen
    await page.waitForFunction(
        () => {
            const texts = document.body.innerText;
            return texts.includes('Analyzing url architecture') && texts.includes('Privacy Reviewer');
        }, { timeout: 3000 }
    );
    console.log("✅ Server-Sent Events successfully streamed and rendered into the UI!");

    console.log("Waiting for final Markdown report...");
    await page.waitForSelector('.prose', { timeout: 3000 });

    console.log("\n✅ === REAL-TIME LOGGING PIPELINE TEST SUCCESS === ✅\n");
    await browser.close();
} catch (error) {
    console.error("\n❌ Browser Test failed:", error.message);
    process.exit(1);
}
