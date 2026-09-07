# ATLAS — MASTER PRODUCT BUILD PROMPT

You are now acting as the lead product engineer, senior fintech UX designer, backend architect, QA engineer, and product strategist for Atlas.

Atlas is no longer a clickable usability prototype.

We are transitioning the existing application into a polished, persistent, production-quality MVP while PRESERVING the existing Atlas product identity and visual design.

==================================================
0. PRIMARY DIRECTIVE
==================================================

DO NOT redesign Atlas from scratch.

DO NOT replace the current visual language.

DO NOT remove existing screens or functionality unless they are clearly broken or redundant.

DO NOT turn Atlas into a generic SaaS dashboard.

DO NOT create fake functionality that visually appears live without clearly treating it as demo/simulated data.

Instead:

1. Preserve the existing UI and navigation.
2. Preserve the existing dark financial-terminal aesthetic.
3. Turn mock interactions into real application logic.
4. Turn temporary state into persistent backend data.
5. Make every major button, control, flow, filter, form, and navigation element functional.
6. Improve architecture, reliability, performance, accessibility, responsiveness, and UX without unnecessarily changing the visual design.
7. Build Atlas incrementally so existing working functionality is not broken.

Before modifying an existing feature, inspect how it currently works and preserve its existing UX unless the requested backend/functionality requires a change.

==================================================
1. PRODUCT VISION
==================================================

Atlas is an investing education and simulated investing platform designed to make learning markets engaging, understandable, personalized, and interactive.

The experience should feel like the intersection of:

- a premium brokerage interface
- a financial research platform
- an intelligent investing coach
- an investing simulator
- an educational platform
- a competitive investing game

However, Atlas must maintain its own identity.

Atlas should feel:

- serious
- premium
- intelligent
- fast
- trustworthy
- modern
- clean
- data-driven
- beginner-friendly without looking childish

Avoid:

- excessive gradients
- unnecessary animations
- emojis as primary UI elements
- cartoon styling
- childish gamification
- huge rounded cards everywhere
- excessive whitespace
- generic AI-generated dashboard layouts
- visual clutter
- fake precision
- unexplained financial jargon

==================================================
2. EXISTING DESIGN SYSTEM — PRESERVE
==================================================

Preserve the established Atlas dark theme.

Core colors:

Background:
#0B0E11

Cards / primary surfaces:
#111418

Elevated surfaces:
#171A1F

Borders:
#252A31

Primary blue:
#2962FF

Primary text:
#F1F3F5

Secondary text:
#DCE3EA

Muted text:
#7D8794

Positive:
#089981 or the existing Atlas green

Negative:
#F23645

Maintain strong contrast and professional financial-product typography.

Continue using the project's existing components, spacing conventions, typography, buttons, inputs, cards, icons, tooltips, dialogs, tabs, tables, charts, and navigation patterns wherever possible.

Do not create visually inconsistent duplicate component systems.

Desktop should feel dense and efficient.

Mobile should feel deliberately redesigned for mobile rather than merely shrinking the desktop interface.

==================================================
3. AUTHENTICATION — CURRENT FOUNDATION
==================================================

Authentication architecture has already been created.

Current architecture includes:

- AuthContext
- AuthGate
- LoginScreen
- SignupScreen
- useAuthState()
- persistent authentication state
- user name displayed through auth state
- personalized dashboard greeting

The components consuming authentication are intended to remain backend-agnostic.

Current temporary/local auth behavior should be replaced with Supabase authentication.

Implement:

supabase.auth.signUp()

supabase.auth.signInWithPassword()

supabase.auth.getSession()

supabase.auth.onAuthStateChange()

supabase.auth.signOut()

Do not rewrite AuthContext or the existing screens unnecessarily.

Replace only the internal persistence/authentication mechanism where practical.

Support:

- email signup
- email login
- logout
- persistent sessions
- loading state
- invalid credentials
- duplicate email handling
- weak password feedback
- email verification state if enabled
- password reset
- expired sessions
- network failures
- user-friendly errors

Never expose service-role keys or secret API credentials in frontend code.

==================================================
4. SUPABASE BACKEND
==================================================

Use Supabase as the primary backend/data layer.

Create a clean relational schema suitable for Atlas.

At minimum consider tables for:

profiles
user_preferences
watchlists
watchlist_items
paper_accounts
paper_orders
paper_positions
paper_transactions
portfolio_snapshots
journal_entries
saved_articles
notifications
notification_preferences
challenges
challenge_entries
challenge_positions
challenge_orders
achievements
user_achievements
learning_progress
ai_conversations
ai_messages

Use UUIDs and foreign keys appropriately.

Use created_at and updated_at timestamps where useful.

Create appropriate indexes.

Use Row Level Security.

A user must never be able to read or modify another user's private portfolio, journal, watchlist, AI history, preferences, or account information.

Do not trust client-provided user IDs for authorization.

Use auth.uid() policies.

==================================================
5. USER PROFILE
==================================================

Create a real Atlas profile tied to the authenticated Supabase user.

Store:

- display name
- first name
- optional avatar
- account creation date
- investing experience level
- learning preferences
- risk-education preference
- onboarding completion
- optional interests/sectors
- notification preferences

Do not require unnecessary sensitive information for the simulated MVP.

Profile information should persist between devices.

==================================================
6. ONBOARDING
==================================================

Create a short premium onboarding experience after signup.

Keep it fast.

Do not make users complete 15 screens before seeing Atlas.

Suggested onboarding:

1. Welcome to Atlas
2. Investing experience:
   - New
   - Some experience
   - Experienced
3. Main goal:
   - Learn investing
   - Practice trading
   - Understand markets
   - Build better habits
4. Interests:
   - Technology
   - AI
   - Energy
   - Consumer
   - Healthcare
   - Finance
   - ETFs
   - Broad market
5. Create initial watchlist
6. Enter Atlas

Use onboarding answers to personalize:

- Learn
- News
- Atlas AI
- dashboard suggestions
- watchlist recommendations

Allow onboarding to be skipped where appropriate.

==================================================
7. DASHBOARD
==================================================

Turn the dashboard into the user's command center.

Use persistent/live data where available.

Include:

- greeting using authenticated user's first name
- simulated account value
- daily simulated P/L
- total return
- watchlist movement
- portfolio highlights
- relevant market news
- upcoming earnings/events
- recent paper trades
- journal reminders
- learning progress
- active challenge status
- Atlas AI insight

Do not overload the screen.

Prioritize information based on relevance.

Create proper states for:

- brand-new user
- user with no holdings
- user with no watchlist
- active paper trader
- challenge participant

==================================================
8. MARKET DATA ARCHITECTURE
==================================================

Create a provider/service abstraction for market data.

Do not scatter API calls throughout UI components.

Use a structure conceptually similar to:

marketDataService
quoteService
historicalDataService
companyService
searchService
newsService

This allows the market-data provider to be replaced later without rewriting Atlas.

Support when provider/API capabilities allow:

- ticker search
- company name
- current/most recent price
- price change
- percentage change
- OHLC candles
- historical charts
- market status
- company metadata
- sector / industry
- market cap
- volume
- average volume
- 52-week range
- basic fundamentals

Clearly distinguish:

REAL-TIME
DELAYED
END-OF-DAY
SIMULATED

depending on what the connected provider actually supplies.

Never falsely label delayed data as live.

==================================================
9. MARKETS
==================================================

Make the Markets section fully functional.

Support:

- ticker search
- watchlist
- market movers
- indices
- sectors
- stock screener
- charts
- company research
- alerts UI
- stock detail navigation

Ticker search should support:

- symbol
- company name
- keyboard navigation
- loading
- no-results state
- errors

Clicking a stock should open a reusable stock-detail page rather than an NVDA-only hard-coded experience.

All supported securities should reuse the same stock detail component.

==================================================
10. STOCK DETAIL PAGE
==================================================

Build a dynamic StockDetailPage driven by ticker data.

Include:

Header:
- ticker
- company name
- price
- absolute move
- percentage move
- market status

Chart:
- 1D
- 5D
- 1M
- 3M
- 6M
- YTD
- 1Y
- 5Y
- MAX when supported

Overview:
- market cap
- volume
- average volume
- 52-week high
- 52-week low
- sector
- industry

Research:
- company description
- major statistics
- earnings/event data when available

News:
- ticker-related articles

Atlas intelligence:
- beginner-friendly explanation
- relevant catalysts
- portfolio exposure when applicable

Actions:
- Add/remove watchlist
- Paper Buy
- Paper Sell when position exists
- Ask Atlas

Charts must resize correctly.

Do not fabricate data that isn't returned by the selected provider.

==================================================
11. WATCHLIST
==================================================

Watchlists must become persistent.

Allow users to:

- add ticker
- remove ticker
- search ticker
- see price
- see daily percentage change
- open stock detail
- receive related news
- optionally create alerts

Avoid duplicate symbols.

Optimistically update where safe.

Show loading/error feedback.

==================================================
12. PAPER TRADING ENGINE
==================================================

This is one of the most important systems in Atlas.

Create a proper simulated trading engine.

Users start with configurable simulated buying power such as:

$100,000

Paper trading must never execute real brokerage orders.

Maintain:

- cash
- buying power
- positions
- quantity
- average cost
- market value
- unrealized gain/loss
- realized gain/loss
- account equity
- trade history

Support initial MVP order type:

MARKET PAPER ORDER

Then architecture should be capable of adding:

LIMIT
STOP
STOP LIMIT

later.

Validate:

- ticker exists
- quantity > 0
- sufficient simulated buying power
- sufficient shares for sells
- numeric inputs
- price availability

When buying:

cash decreases
position quantity increases
weighted average cost updates
transaction is recorded

When selling:

position quantity decreases
cash increases
realized P/L updates
transaction is recorded

If quantity reaches zero:
close/remove active position while preserving transaction history.

Use database transactions / RPC / server-side logic where appropriate to prevent inconsistent account state.

==================================================
13. PAPER ORDER UX
==================================================

Preserve the existing flow:

Stock
→ Buy
→ Review Order
→ Place Paper Trade
→ Order Filled
→ Journal Trade

Make each step real.

Review screen should show:

- symbol
- estimated execution price
- shares
- estimated total
- remaining simulated buying power
- paper-trading disclaimer

After execution, confirmation should use the actual order result.

Never display a successful fill if the backend transaction failed.

==================================================
14. PORTFOLIO
==================================================

Make Portfolio / Account Value completely data-driven.

Display:

- simulated total account value
- cash
- invested value
- daily P/L
- total P/L
- return percentage

Positions table:

- ticker
- company
- shares
- average cost
- current price
- market value
- daily change
- total gain/loss
- gain/loss percentage

Portfolio chart:

Track portfolio snapshots so charts can display meaningful historical simulated account value.

Support ranges such as:

1D
1W
1M
3M
YTD
1Y
ALL

Create useful empty-state onboarding when there are no positions.

==================================================
15. JOURNAL
==================================================

Turn the trade journal into one of Atlas's differentiating features.

Persist journal entries.

A journal entry may include:

- related paper order
- ticker
- buy/sell
- thesis
- reason for entry
- catalyst
- target
- risk
- confidence
- expected timeframe
- emotions
- mistakes
- lessons learned
- created date
- later reflection

Allow:

- create
- edit
- delete
- filter
- search
- sort

Provide post-trade reflection.

Atlas AI should eventually analyze journal history to find behavioral patterns.

Examples:

- chasing momentum
- repeatedly selling winners early
- oversized positions
- ignoring thesis invalidation
- strong discipline
- improving risk management

Avoid making definitive claims when data is insufficient.

==================================================
16. ATLAS AI
==================================================

Atlas AI should become a context-aware investing education assistant.

It should understand relevant user context such as:

- watchlist
- simulated portfolio
- paper trades
- journal
- learning level
- selected ticker
- relevant market news

However:

Atlas AI should focus on education, explanation, scenario analysis, and decision-process improvement.

It must not pretend to guarantee returns.

Examples of useful questions:

- Why did NVDA move today?
- Explain this earnings report simply.
- What risks exist in my simulated portfolio?
- Why is my portfolio down?
- Explain P/E ratio using one of my holdings.
- What was weak about my trade thesis?
- What news matters most to my watchlist?
- Explain this chart.
- What should I learn before understanding options?

Use server-side functions for AI API requests.

Never expose model/API secret keys in the browser.

Store conversation history appropriately.

Allow new conversation and clear conversation.

Provide loading, retry, and error states.

==================================================
17. NEWS / MARKET INTELLIGENCE
==================================================

Keep the existing Atlas Market Intelligence philosophy.

News should not just show headlines.

Atlas should explain:

WHAT HAPPENED

WHY IT MATTERS

WHY IT MAY MATTER TO THIS USER

Build categories such as:

For You
Markets
Companies
Economy
Earnings
Technology / AI where useful

Features:

- search
- ticker filtering
- category filtering
- relevant ticker chips
- article timestamp
- publisher/source
- save article
- related companies
- external article link where allowed
- Atlas summary
- relevance explanation

Personalization should rank stories using:

- portfolio holdings
- watchlist
- sectors
- challenge holdings
- major market relevance

Critical rule:

Do NOT copy, scrape, or redistribute copyrighted full articles from services Atlas does not have redistribution rights for.

Store/reference permitted metadata and summaries according to provider licensing.

Do not imply that a personal subscription to another financial-news platform grants Atlas redistribution rights.

==================================================
18. LEARN
==================================================

Turn Learn into a structured educational product.

Possible tracks:

1. Investing Basics
2. Understanding Stocks
3. ETFs
4. Reading Charts
5. Company Fundamentals
6. Earnings
7. Portfolio Construction
8. Risk
9. Market Psychology
10. Advanced Topics

Each lesson should be:

- short
- interactive
- practical
- connected to real market examples
- understandable by beginners

Track:

- lesson completion
- module completion
- quiz results
- streak/progress when useful

Do not make the learning UI childish.

Connect learning to the rest of Atlas.

Example:

If a user encounters market cap in Markets:
"Learn what market cap means."

If a user is about to place their first trade:
"Understand market orders."

==================================================
19. CHALLENGES / TOURNAMENTS
==================================================

Make simulated challenges persistent and functional.

Challenges can include:

- starting virtual cash
- start date
- end date
- allowed securities
- participant count
- ranking method
- rules

Users should be able to:

- view challenge
- read rules
- join
- receive challenge paper account
- place challenge-specific simulated trades
- view leaderboard
- view own ranking
- view performance

Keep challenge portfolios separate from the main paper account.

Leaderboard calculations must use actual stored challenge account data rather than static demo rankings.

Support states:

upcoming
open
active
completed

==================================================
20. NOTIFICATIONS
==================================================

Create an in-app notification system.

Potential notification types:

- relevant watchlist news
- earnings reminder
- challenge started
- challenge ending
- leaderboard movement
- learning milestone
- journal reminder
- portfolio event
- alert triggered

Create notification center.

Support:

- unread count
- mark read
- mark all read
- notification preferences

Do not spam the user.

==================================================
21. SEARCH
==================================================

Create coherent global search where appropriate.

Search may support:

- securities
- news
- lessons

Use debounce.

Support keyboard interaction.

Handle empty/loading/error states.

==================================================
22. RESPONSIVENESS
==================================================

Audit every screen at:

375px
430px
768px
1024px
1440px
1920px

Nothing should:

- overflow horizontally unintentionally
- clip important information
- create unusably tiny controls
- create giant empty areas
- hide critical actions

Desktop can use dense tables.

Mobile should convert tables into practical mobile layouts/cards where necessary.

Navigation must remain usable on mobile.

Charts must resize correctly.

==================================================
23. ACCESSIBILITY
==================================================

Improve accessibility without changing Atlas's identity.

Implement:

- semantic buttons
- labels for inputs
- keyboard navigation
- visible focus states
- aria-label where required
- accessible dialogs
- sufficient contrast
- accessible form errors

Do not rely only on red/green color to communicate gains and losses.

==================================================
24. LOADING / EMPTY / ERROR STATES
==================================================

Every async system needs:

LOADING
SUCCESS
EMPTY
ERROR

Use polished skeletons rather than layout jumps.

Examples:

News unavailable:
"Market news couldn't be loaded."

No watchlist:
"Build your watchlist to personalize Atlas."

No holdings:
"Your paper portfolio is empty."

API unavailable:
provide Retry.

Never leave blank white/black regions when a request fails.

==================================================
25. PERFORMANCE
==================================================

Optimize Atlas for speed.

Avoid unnecessary rerenders.

Use:

- memoization where meaningful
- request caching
- debounced searches
- lazy-loading for heavy screens where appropriate
- pagination/infinite loading where appropriate

Do not fetch the same quote separately from five components.

Centralize shared market data and cache intelligently.

==================================================
26. APPLICATION ARCHITECTURE
==================================================

The current app should gradually be refactored away from oversized monolithic files.

Do this incrementally without breaking UI.

Recommended organization:

components/
features/
  auth/
  dashboard/
  markets/
  portfolio/
  trading/
  journal/
  news/
  ai/
  learn/
  challenges/
  profile/
services/
hooks/
lib/
types/

Create reusable types.

Avoid repeated inline mock arrays once real data exists.

Avoid one enormous App.tsx containing the whole product.

However:

DO NOT perform a massive rewrite all at once.

Refactor feature-by-feature.

==================================================
27. DATA INTEGRITY
==================================================

Financial calculations must have one source of truth.

Do not independently calculate account equity differently on Dashboard, Portfolio, and Trading.

Create shared utilities/services.

Use consistent definitions for:

cash
market value
account equity
daily P/L
unrealized P/L
realized P/L
buying power

Handle decimal values carefully.

==================================================
28. SECURITY
==================================================

Never put private API secrets in:

frontend source
localStorage
client-visible environment variables

Use secure server-side functions.

Use Supabase RLS.

Validate input server-side.

Sanitize user-generated text.

Rate-limit sensitive endpoints where possible.

Do not rely on hidden UI controls as authorization.

==================================================
29. PRIVACY
==================================================

Collect only data required for the current product.

Provide:

- delete-account pathway architecture
- privacy settings
- clear user-data separation

Never expose private portfolio/journal information publicly unless a future feature explicitly allows the user to opt in.

==================================================
30. YOUTH / PARENT ARCHITECTURE
==================================================

Atlas may later support teen users and parent-linked experiences.

Prepare architecture for:

account_role:
- standard
- teen
- parent

Potential parent/teen relationship data should be architecturally possible.

However:

DO NOT invent legal rules.

DO NOT claim that the current MVP legally permits minors to open brokerage accounts.

DO NOT implement real-money brokerage functionality as part of this build.

For now, keep the system educational and simulated.

Design the schema so a future legally reviewed parent/teen system can be added without rebuilding the entire product.

==================================================
31. REAL MONEY TRADING
==================================================

DO NOT enable real-money trading in this phase.

DO NOT submit live brokerage orders.

DO NOT create UI that misleads users into believing paper trades are real trades.

Every simulated execution flow should clearly identify itself as:

PAPER TRADING
SIMULATED
PRACTICE

depending on context.

Architecture may allow a regulated brokerage integration in the future, but that is outside the current MVP.

==================================================
32. PRODUCT ANALYTICS ARCHITECTURE
==================================================

Prepare clean event hooks for future analytics.

Useful events:

signup_completed
onboarding_completed
ticker_searched
ticker_viewed
watchlist_added
paper_order_started
paper_order_completed
journal_created
news_opened
ai_message_sent
lesson_started
lesson_completed
challenge_joined

Do not send private journal text or sensitive data to analytics unnecessarily.

==================================================
33. QUALITY BAR
==================================================

Atlas should feel closer to a startup's real beta product than a generated prototype.

Every screen should pass the question:

"If an actual user clicked this, would it behave the way they expect?"

Fix:

dead buttons
fake links
buttons with no response
hard-coded stock symbols where dynamic data belongs
static account values
static portfolio calculations
static leaderboard values
fake loading
broken responsive layouts
inconsistent spacing
duplicated components
misleading data
unhandled errors

==================================================
34. DO NOT DESTROY THE EXISTING APP
==================================================

This is critical.

Before each major implementation:

1. inspect existing behavior
2. identify dependencies
3. preserve working screens
4. make the smallest architectural change necessary
5. test affected flows
6. proceed to the next phase

Do not rebuild Atlas in one giant uncontrolled pass.

==================================================
35. IMPLEMENTATION ORDER
==================================================

Follow this sequence.

PHASE 1 — BACKEND FOUNDATION
- Supabase connection
- real authentication
- profiles
- RLS
- onboarding
- shared backend client
- loading/error handling

PHASE 2 — MARKET DATA FOUNDATION
- provider abstraction
- ticker search
- quote retrieval
- dynamic stock pages
- charts
- watchlist persistence

PHASE 3 — PAPER TRADING
- paper account
- cash
- positions
- orders
- transaction history
- calculations
- buy/review/fill workflow

PHASE 4 — PORTFOLIO
- dynamic holdings
- account metrics
- portfolio snapshots
- portfolio chart
- transaction history

PHASE 5 — JOURNAL
- persistent journal
- edit/delete/filter/search
- paper-order relationships

PHASE 6 — NEWS
- news provider
- ticker news
- Market Intelligence feed
- personalization
- saved stories

PHASE 7 — ATLAS AI
- secure server-side AI
- contextual responses
- portfolio/watchlist/journal context
- conversation persistence

PHASE 8 — LEARN
- curriculum
- lesson pages
- progress tracking
- contextual education

PHASE 9 — CHALLENGES
- persistent challenges
- separate challenge accounts
- simulated orders
- leaderboard

PHASE 10 — PRODUCT POLISH
- notifications
- profile/settings
- accessibility
- responsive audit
- loading/empty/error states
- performance
- QA

==================================================
36. DEVELOPMENT RULE FOR EACH PHASE
==================================================

For every phase:

FIRST:
Explain what currently exists.

SECOND:
Explain exactly what needs to change.

THIRD:
Identify database schema/API requirements.

FOURTH:
Implement the feature.

FIFTH:
Test the feature.

SIXTH:
Report:

- what was changed
- files/components created
- files/components modified
- database tables added
- environment variables required
- external APIs required
- known limitations
- what remains mocked
- what is now genuinely functional

Do not silently pretend external integrations exist.

If credentials or setup from me are required, clearly stop at that point and tell me exactly what I need to provide.

==================================================
37. REGRESSION TEST CHECKLIST
==================================================

After every major phase verify:

Authentication:
✓ signup
✓ login
✓ refresh session
✓ logout

Navigation:
✓ every sidebar route
✓ back navigation
✓ mobile navigation

Markets:
✓ search
✓ ticker detail
✓ watchlist
✓ charts

Paper trading:
✓ buy
✓ review
✓ fill
✓ portfolio update
✓ insufficient funds
✓ invalid quantity

Portfolio:
✓ totals
✓ positions
✓ P/L

Journal:
✓ create
✓ save
✓ reopen

News:
✓ feed
✓ ticker filtering

AI:
✓ send
✓ loading
✓ response
✓ error

Challenges:
✓ join
✓ challenge account
✓ ranking

Responsive:
✓ desktop
✓ tablet
✓ mobile

==================================================
38. CURRENT TASK
==================================================

Begin with PHASE 1.

Do not attempt all phases simultaneously.

Audit the existing authentication implementation first.

Then replace the temporary localStorage authentication internals with Supabase while preserving the existing:

AuthContext
AuthGate
LoginScreen
SignupScreen
sidebar user identity
dashboard greeting
Atlas design

Then create the profiles backend, RLS policies, onboarding foundation, session loading states, password reset pathway, and reliable auth error handling.

Do not modify Markets, News, Portfolio, Journal, Atlas AI, Challenges, Learn, or their visual designs during Phase 1 unless required to fix an authentication-related integration issue.

When Phase 1 is complete, STOP.

Give me a structured implementation report and tell me exactly what should be built in Phase 2.

Do not automatically begin Phase 2 until I approve it.