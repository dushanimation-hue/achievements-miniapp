import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  console.log('Starting server...');
  const server = spawn('npx', ['next', 'start', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: 'pipe'
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  // Verify
  try {
    const res = await fetch('http://localhost:3000/');
    console.log('Server status:', res.status);
  } catch(e) {
    console.log('Waiting more...');
    await new Promise(r => setTimeout(r, 3000));
  }
  
  const browser = await chromium.launch({
    executablePath: '/home/z/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page = await context.newPage();
  
  // 1: Login
  console.log('Screenshot 1: Login...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/z/my-project/download/01_login_screen.png' });
  
  // 2: Fill admin
  const adminBtn = await page.$('button:has-text("admin")');
  if (adminBtn) await adminBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/z/my-project/download/02_login_filled.png' });
  
  // 3: Login
  await page.click('button:has-text("Войти")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/z/my-project/download/03_home_admin.png' });
  
  // 4: Achievements tab
  try {
    const achTab = await page.$('button:has-text("Достижения")');
    if (achTab) { await achTab.click(); await page.waitForTimeout(2000); }
  } catch(e) {}
  await page.screenshot({ path: '/home/z/my-project/download/04_achievements.png' });
  
  // 5: Rating
  try {
    const ratTab = await page.$('button:has-text("Рейтинг")');
    if (ratTab) { await ratTab.click(); await page.waitForTimeout(2000); }
  } catch(e) {}
  await page.screenshot({ path: '/home/z/my-project/download/05_rating.png' });
  
  // 6: Profile
  try {
    const profTab = await page.$('button:has-text("Профиль")');
    if (profTab) { await profTab.click(); await page.waitForTimeout(2000); }
  } catch(e) {}
  await page.screenshot({ path: '/home/z/my-project/download/06_profile.png' });
  
  // 7: Now logout and login as student
  try {
    const logoutBtn = await page.$('button:has-text("Профиль")');
    if (logoutBtn) { await logoutBtn.click(); await page.waitForTimeout(1000); }
    const logout = await page.$('[aria-label="logout"], button:has(svg) >> nth=0');
  } catch(e) {}
  
  await browser.close();
  server.kill('SIGTERM');
  console.log('All screenshots done!');
}

main().catch(e => { console.error(e); process.exit(1); });
