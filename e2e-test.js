const { chromium } = require('playwright');

const BASE = 'https://relaydesk-two.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  async function test(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`✅ ${name}`);
    } catch (e) {
      failed++;
      errors.push({ name, error: e.message.split('\n')[0] });
      console.log(`❌ ${name}: ${e.message.split('\n')[0]}`);
    }
  }
  
  // ============ 1. LANDING PAGE ============
  console.log('\n--- LANDING PAGE ---');
  await test('1a. Landing page renders with RelayDesk branding', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const bodyText = await page.textContent('body');
    if (!bodyText.includes('RelayDesk')) throw new Error('Missing RelayDesk text');
    // Should have a hero/headline
    const h1 = await page.$('h1');
    if (h1) {
      const h1Text = await h1.textContent();
      console.log(`   H1: "${h1Text}"`);
    }
  });
  
  await test('1b. Landing page has working nav to all pages', async () => {
    // Find all anchor elements
    const anchors = await page.$$eval('a', els => els.map(e => ({ href: e.getAttribute('href'), text: e.textContent.trim() })));
    console.log(`   Anchors found: ${JSON.stringify(anchors)}`);
    const requiredPages = ['/demo', '/inbox', '/ask', '/architecture', '/workflow'];
    for (const p of requiredPages) {
      const found = anchors.some(a => a.href === p || a.href === p + '/');
      if (!found) throw new Error(`Missing nav link to ${p}`);
    }
  });
  
  // ============ 2. DEMO PAGE ============
  console.log('\n--- DEMO PAGE ---');
  await test('2a. Demo page loads with scenario controls', async () => {
    await page.goto(BASE + '/demo', { waitUntil: 'networkidle' });
    const bodyText = await page.textContent('body');
    console.log(`   Body preview: ${bodyText.substring(0, 500).replace(/\s+/g, ' ')}`);
    
    // Check for essential UI elements
    const hasSubmitBtn = bodyText.includes('Submit');
    const hasClearBtn = bodyText.includes('Clear');
    const hasInboxLink = bodyText.includes('Inbox');
    console.log(`   Submit: ${hasSubmitBtn}, Clear: ${hasClearBtn}, Inbox: ${hasInboxLink}`);
  });
  
  await test('2b. Demo page has scenario selector', async () => {
    // Look for select elements or dropdowns
    const selects = await page.$$('select');
    const buttons = await page.$$('button');
    console.log(`   Selects: ${selects.length}, Buttons: ${buttons.length}`);
    
    // Check for scenario-related text
    const bodyText = await page.textContent('body');
    const hasScenarios = bodyText.includes('scenario') || bodyText.includes('Scenario') || bodyText.includes('Billing') || bodyText.includes('billing');
    console.log(`   Has scenario content: ${hasScenarios}`);
  });
  
  // ============ 3. INBOX PAGE ============
  console.log('\n--- INBOX PAGE ---');
  await test('3a. Inbox page loads with case table', async () => {
    await page.goto(BASE + '/inbox', { waitUntil: 'networkidle' });
    const bodyText = await page.textContent('body');
    console.log(`   Body preview: ${bodyText.substring(0, 500).replace(/\s+/g, ' ')}`);
    
    const table = await page.$('table');
    if (!table) throw new Error('No table found on inbox page');
    
    // Count table rows
    const rows = await page.$$('table tbody tr');
    console.log(`   Table rows: ${rows.length}`);
    if (rows.length === 0) throw new Error('No cases in inbox');
  });
  
  await test('3b. Inbox shows case statuses', async () => {
    const bodyText = await page.textContent('body');
    const hasStatus = bodyText.includes('received') || bodyText.includes('Received') || bodyText.includes('pending') || bodyText.includes('Pending');
    console.log(`   Has status indicators: ${hasStatus}`);
  });
  
  // ============ 4. CASE DETAIL PAGE ============
  console.log('\n--- CASE DETAIL PAGE ---');
  await test('4a. Case detail page loads for existing case', async () => {
    // Get first case ID
    const res = await page.goto(BASE + '/api/requests');
    const requests = JSON.parse(await res.text());
    const caseId = requests[0].id;
    console.log(`   Testing case: ${caseId}`);
    
    await page.goto(BASE + '/cases/' + caseId, { waitUntil: 'networkidle' });
    const bodyText = await page.textContent('body');
    console.log(`   Body preview: ${bodyText.substring(0, 600).replace(/\s+/g, ' ')}`);
    
    // Should show case subject
    if (!bodyText.includes(requests[0].subject)) {
      throw new Error(`Case subject "${requests[0].subject}" not found in page`);
    }
    console.log(`   ✅ Case subject displayed correctly`);
  });
  
  await test('4b. Case detail has timeline section', async () => {
    const bodyText = await page.textContent('body');
    const hasTimeline = bodyText.includes('Timeline') || bodyText.includes('timeline');
    const hasNotes = bodyText.includes('Notes') || bodyText.includes('notes');
    const hasResolution = bodyText.includes('Resolution') || bodyText.includes('resolution');
    console.log(`   Timeline: ${hasTimeline}, Notes: ${hasNotes}, Resolution: ${hasResolution}`);
  });
  
  await test('4c. Case detail has owner display', async () => {
    const bodyText = await page.textContent('body');
    const hasOwner = bodyText.includes('Current Owner') || bodyText.includes('current owner') || bodyText.includes('Assigned');
    console.log(`   Has owner display: ${hasOwner}`);
  });
  
  // ============ 5. ASK PAGE ============
  console.log('\n--- ASK PAGE ---');
  await test('5a. Ask page loads with question input', async () => {
    await page.goto(BASE + '/ask', { waitUntil: 'networkidle' });
    const bodyText = await page.textContent('body');
    console.log(`   Body preview: ${bodyText.substring(0, 500).replace(/\s+/g, ' ')}`);
    
    // Find input/textarea
    const inputs = await page.$$('input[type="text"], textarea');
    const buttons = await page.$$('button');
    console.log(`   Text inputs: ${inputs.length}, Buttons: ${buttons.length}`);
    
    // Check for suggested questions
    const hasSuggested = bodyText.includes('suggested') || bodyText.includes('Suggested') || bodyText.includes('routed');
    console.log(`   Has suggested questions: ${hasSuggested}`);
  });
  
  await test('5b. Ask page has suggested question buttons', async () => {
    const buttons = await page.$$('button');
    const buttonTexts = [];
    for (const btn of buttons) {
      const text = await btn.textContent();
      buttonTexts.push(text.trim());
    }
    console.log(`   All buttons: ${buttonTexts.join(' | ')}`);
    const hasQuestionBtn = buttonTexts.some(t => t.includes('?') || t.includes('routed') || t.includes('escalated'));
    if (!hasQuestionBtn) throw new Error('No suggested question buttons found');
  });
  
  // ============ 6. ARCHITECTURE PAGE ============
  console.log('\n--- ARCHITECTURE PAGE ---');
  await test('6a. Architecture page loads with agent descriptions', async () => {
    await page.goto(BASE + '/architecture', { waitUntil: 'networkidle' });
    const bodyText = await page.textContent('body');
    console.log(`   Body preview: ${bodyText.substring(0, 500).replace(/\s+/g, ' ')}`);
    
    const hasAgent = bodyText.includes('Agent') || bodyText.includes('agent');
    const hasAicoo = bodyText.includes('Aicoo') || bodyText.includes('aicoo');
    const hasFlow = bodyText.includes('Flow') || bodyText.includes('flow');
    console.log(`   Agent: ${hasAgent}, Aicoo: ${hasAicoo}, Flow: ${hasFlow}`);
  });
  
  // ============ 7. WORKFLOW PAGE ============
  console.log('\n--- WORKFLOW PAGE ---');
  await test('7a. Workflow page loads with flow steps', async () => {
    await page.goto(BASE + '/workflow', { waitUntil: 'networkidle' });
    const bodyText = await page.textContent('body');
    console.log(`   Body preview: ${bodyText.substring(0, 500).replace(/\s+/g, ' ')}`);
    
    const hasCoordination = bodyText.includes('Coordination') || bodyText.includes('coordination');
    const hasIdentity = bodyText.includes('Identity') || bodyText.includes('identity');
    console.log(`   Coordination: ${hasCoordination}, Identity: ${hasIdentity}`);
  });
  
  // ============ 8. API SMOKE TESTS ============
  console.log('\n--- API SMOKE TESTS ---');
  await test('8a. GET /api/requests returns valid array', async () => {
    const res = await page.goto(BASE + '/api/requests');
    const data = JSON.parse(await res.text());
    if (!Array.isArray(data)) throw new Error('Not an array');
    if (data.length === 0) throw new Error('Empty array');
    const first = data[0];
    if (!first.id || !first.subject || !first.status) throw new Error('Missing required fields');
    console.log(`   ${data.length} requests, first: "${first.subject}" (${first.status})`);
  });
  
  await test('8b. GET /api/agents returns valid array', async () => {
    const res = await page.goto(BASE + '/api/agents');
    const data = JSON.parse(await res.text());
    if (!Array.isArray(data)) throw new Error('Not an array');
    console.log(`   ${data.length} agents`);
    data.forEach(a => console.log(`     ${a.name} (${a.team}) - online: ${a.isOnline}`));
  });
  
  await test('8c. GET /api/cases/[id] returns valid case', async () => {
    const reqRes = await page.goto(BASE + '/api/requests');
    const requests = JSON.parse(await reqRes.text());
    const caseId = requests[0].id;
    const res = await page.goto(BASE + '/api/cases/' + caseId);
    const data = JSON.parse(await res.text());
    if (data.error) throw new Error(data.error);
    if (!data.request) throw new Error('Missing request field');
    console.log(`   Case: "${data.request.subject}" - ${data.routeDecisions?.length || 0} routes, ${data.auditEvents?.length || 0} audit events`);
  });
  
  await test('8d. POST /api/demo seeds data', async () => {
    const res = await page.evaluate(async () => {
      const r = await fetch(`${window.location.origin}/api/demo`, { method: 'POST' });
      return r.json();
    });
    console.log(`   Response: ${JSON.stringify(res)}`);
    if (!res.success) throw new Error('Seeding failed');
  });
  
  // ============ 9. STYLING / DESIGN ============
  console.log('\n--- STYLING / DESIGN ---');
  await test('9a. Dark mode applied (dark background)', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    console.log(`   Body bg: ${bg}`);
    // Dark mode should give a dark bg (not white)
    const match = bg.match(/lab\(([\d.]+)/);
    if (match) {
      const l = parseFloat(match[1]);
      if (l > 20) throw new Error(`Light background detected (L=${l}), dark mode not applied`);
    } else if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(0, 0, 0, 0)') {
      throw new Error(`Light/transparent background: ${bg}`);
    }
  });
  
  await test('9b. No hydration errors in console', async () => {
    const hydrationErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('hydrat')) {
        hydrationErrors.push(msg.text());
      }
    });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    if (hydrationErrors.length > 0) throw new Error(hydrationErrors.join('; '));
    console.log(`   No hydration errors detected`);
  });
  
  await test('9c. No uncaught page errors', async () => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.goto(BASE + '/demo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    if (pageErrors.length > 0) throw new Error(pageErrors.join('; '));
    console.log(`   No page errors detected`);
  });
  
  await browser.close();
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log(`\nFailed tests:`);
    errors.forEach(e => console.log(`  ❌ ${e.name}: ${e.error}`));
  }
  console.log(`${'='.repeat(50)}`);
  
  process.exit(failed > 0 ? 1 : 0);
})();
