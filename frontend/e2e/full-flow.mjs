// End-to-end test of the main user journey, through the real UI and the real backend:
// register -> login -> dashboard -> create workout -> add exercise -> complete workout
// -> check in/out -> add water -> add weight -> view history -> logout/login.
//
// Needs the backend (port 8000) and the frontend (npm run dev, port 5173) running.
//   npm run e2e
// Options (env vars): APP_URL (default http://localhost:5173), BROWSER_CHANNEL (msedge | chrome), HEADED=1
import { chromium } from 'playwright-core'

const APP = process.env.APP_URL || 'http://localhost:5173'
const CHANNEL = process.env.BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chrome')
const stamp = Date.now()
const user = { first: 'E2E', last: 'Tester', email: `e2e_${stamp}@example.com`, password: 'e2e-pass-123' }
const workoutName = `E2E workout ${stamp % 100000}`

const results = []
function check(label, ok, extra = '') {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${extra ? `  (${extra})` : ''}`)
}
async function waitForPath(page, re, timeout = 8000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (re.test(new URL(page.url()).pathname)) return true
    await page.waitForTimeout(100)
  }
  return false
}
const visible = (page, selector, timeout = 8000) =>
  page.waitForSelector(selector, { timeout }).then(() => true).catch(() => false)

async function logIn(page) {
  await page.goto(`${APP}/login`)
  await page.fill('#email', user.email)
  await page.fill('#password', user.password)
  await page.click('button:has-text("Log in")')
  return waitForPath(page, /^\/$/)
}

const browser = await chromium.launch({ channel: CHANNEL, headless: !process.env.HEADED })
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } })
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

try {
  // 1. Register
  await page.goto(`${APP}/register`)
  await page.fill('#first_name', user.first)
  await page.fill('#last_name', user.last)
  await page.fill('#email', user.email)
  await page.fill('#password', user.password)
  await page.fill('#confirm', user.password)
  await page.click('button:has-text("Create account")')
  check('1. register', (await waitForPath(page, /^\/login/)) && (await visible(page, 'text=Account created')))

  // 2. Login
  await page.fill('#password', user.password)
  await page.click('button:has-text("Log in")')
  check('2. login', await waitForPath(page, /^\/$/))

  // 3. Dashboard
  check('3. dashboard loads', await visible(page, `h1:has-text("Your activity, ${user.first}")`) && await visible(page, 'text=No records yet.'))

  // 4. Create workout
  await page.click('.sidebar a:has-text("Workout plans")')
  await page.click('a:has-text("New workout")')
  await visible(page, '.picker__item')
  await page.fill('#name', workoutName)
  await page.fill('#duration', '45')

  // 5. Add exercise(s)
  for (const [query, sets, reps, kg] of [['Squat', '5', '5', '100'], ['Pull-up', '3', '8', '']]) {
    await page.fill('input[aria-label="Search exercises"]', query)
    await page.locator(`.picker__item:has(span:text-is("${query}"))`).click()
    await page.fill('#sets', sets)
    await page.fill('#reps', reps)
    await page.fill('#weight', kg)
    await page.click('button:has-text("Add exercise")')
  }
  await page.click('button:has-text("Create workout")')
  const created = await waitForPath(page, /^\/workouts\/\d+$/)
  const workoutPath = new URL(page.url()).pathname
  check('4. create workout', created && await visible(page, `h1:has-text("${workoutName}")`))
  check('5. add exercises', await visible(page, 'td:has-text("Squat")') && (await page.locator('.table tbody tr').count()) === 2)

  // 6. Complete workout
  await page.click('button:has-text("Complete workout")')
  check('6. complete workout', await visible(page, 'text=Workout completed') && (await page.locator('.badge--completed').count()) === 1)

  // 7. Check in / out
  await page.click('.sidebar a:has-text("Gym sessions")')
  await page.click('button:has-text("Check in")')
  await visible(page, 'button:has-text("Check out")')
  await page.click('button:has-text("Check out")')
  check('7. check in / out', await visible(page, 'text=Checked out.') && (await page.locator('.table tbody tr').count()) === 1)

  // 8. Add water
  await page.click('.sidebar a:has-text("Water tracking")')
  await page.click('.quick-add__btn:has-text("500 ml")')
  check('8. add water', await visible(page, 'text=Added 500 ml.') && await visible(page, '.water-today .stat__value:has-text("500 ml")'))

  // 9. Add weight
  await page.click('.sidebar a:has-text("Weight tracking")')
  await page.fill('#kg', '71.3')
  await page.click('button:has-text("Save weight")')
  check('9. add weight', await visible(page, 'text=Saved 71.3 kg.'))

  // 10. View history
  await page.click('.sidebar a:has-text("Workout history")')
  await page.click(`.history__head:has-text("${workoutName}")`)
  check('10. history shows the workout and its exercises', await visible(page, '.history__body td:has-text("Squat")'))

  // 11. Logout / login, then everything is still there (in a fresh browser context too)
  await page.click('.sidebar__logout')
  check('11a. logout', await waitForPath(page, /^\/login/))
  const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 850 } })
  const page2 = await ctx2.newPage()
  check('11b. login again (new browser session)', await logIn(page2))
  await visible(page2, '.stat:has-text("Water intake") .stat__value:has-text("500 ml")')
  check('11c. dashboard: water 500 ml', await page2.isVisible('.stat:has-text("Water intake") .stat__value:has-text("500 ml")'))
  check('11d. dashboard: weight 71.3 kg', await page2.isVisible('.stat__value:has-text("71.3 kg")'))
  check('11e. dashboard: 1 workout this month', (await page2.innerText('.stat:has-text("This month") .stat__value')) === '1')
  check('11f. dashboard: recent workout listed', await page2.isVisible(`td a:has-text("${workoutName}")`))
  await page2.goto(`${APP}${workoutPath}`)
  check('11g. workout still completed with 2 exercises',
    await visible(page2, 'td:has-text("Pull-up")') && (await page2.locator('.badge--completed').count()) === 1)
  await ctx2.close()
} catch (err) {
  check('no unexpected error', false, err.message.split('\n')[0])
} finally {
  await browser.close()
}

if (pageErrors.length) console.log('Page errors:', pageErrors)
const failed = results.filter((r) => !r).length
console.log(failed || pageErrors.length ? `\nRESULT: ${failed} FAILED` : `\nRESULT: ALL ${results.length} PASSED`)
console.log(`Test account: ${user.email} / ${user.password}`)
process.exit(failed || pageErrors.length ? 1 : 0)
