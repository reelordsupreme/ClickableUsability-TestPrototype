ATLAS — PROFESSIONAL BROKERAGE UI REDESIGN

Redesign the VISUAL APPEARANCE of the existing Atlas application.

IMPORTANT:
DO NOT rebuild Atlas from scratch.
DO NOT remove, rename, or replace existing features.
DO NOT change the application architecture, Supabase integration, navigation logic, authentication, or functionality.
DO NOT remove the live market/stock ticker bar.
DO NOT change what Atlas does.

This is primarily a VISUAL DESIGN SYSTEM overhaul.

The goal is to transform Atlas from a trendy AI-generated fintech dashboard into a serious, trustworthy, professional investing platform.

DESIGN INSPIRATION:
Use established brokerage platforms such as Fidelity as inspiration for:
- professionalism
- information density
- typography
- hierarchy
- financial tables
- restrained colors
- navigation
- trust

DO NOT copy Fidelity branding, logo, exact layouts, proprietary assets, or exact color system.

Atlas must remain its own brand.

==================================================
1. CORE DESIGN DIRECTION
==================================================

The current design feels too much like an AI-generated fintech template.

REMOVE the following visual tendencies:

- excessive rounded cards
- giant border radiuses
- glowing elements
- neon/electric blue
- excessive dark-on-dark panels
- floating cards everywhere
- oversized headings
- excessive bold typography
- gradients
- glassmorphism
- decorative effects
- excessive pills
- huge empty spaces
- overly futuristic typography
- “crypto app” styling
- generic AI dashboard appearance

The new Atlas should feel like:

Fidelity
+
Bloomberg-lite
+
modern online brokerage
+
professional financial education platform

Think:

SERIOUS
CLEAN
TRUSTWORTHY
FINANCIAL
PRECISE
DATA-DRIVEN
MATURE
ESTABLISHED

It should look like a company someone would trust with financial information.

==================================================
2. COLOR SYSTEM
==================================================

Replace the current near-black/electric-blue aesthetic.

PRIMARY APP BACKGROUND:

#F5F6F7

MAIN CONTENT SURFACES:

#FFFFFF

PRIMARY TEXT:

#1F2933

SECONDARY TEXT:

#5F6B76

MUTED TEXT:

#7A8590

BORDERS:

#D8DDE3

SUBTLE DIVIDERS:

#E7EAED

PRIMARY ATLAS BRAND COLOR:

#173B57

SECONDARY BRAND BLUE:

#24577A

INTERACTIVE BLUE:

#246B9C

VERY LIGHT BLUE BACKGROUND:

#EEF4F8

POSITIVE / MARKET GREEN:

#16834B

NEGATIVE / MARKET RED:

#C93636

WARNING:

#A76A13

DO NOT use bright electric blue like #2962FF.

DO NOT use gradients.

DO NOT use glowing blue shadows.

Color should be restrained.

Most of the interface should be:

white
light gray
charcoal
navy

Green and red should primarily communicate financial movement.

==================================================
3. TYPOGRAPHY — EXTREMELY IMPORTANT
==================================================

The current typography contributes heavily to the AI-generated appearance.

REMOVE Space Grotesk from the application UI.

Do not use futuristic, geometric, startup-style fonts.

Use a professional system-style financial UI font stack:

Inter,
Arial,
Helvetica Neue,
Segoe UI,
sans-serif

If Inter is available, use Inter as the primary UI font.

TYPOGRAPHY RULES:

Normal body:
14px
font-weight 400

Navigation:
14px
font-weight 500

Table text:
13px–14px
font-weight 400–500

Labels:
12px–13px
font-weight 500

Section headings:
16px–18px
font-weight 600

Page titles:
24px–28px
font-weight 600

Large financial values:
28px–34px
font-weight 500–600

Avoid font-weight 700 except when genuinely necessary.

DO NOT make every heading bold.

DO NOT use excessive letter spacing.

Financial numbers should feel clean and compact.

Where appropriate, use tabular numerals for:
stock prices
percentages
portfolio values
market data
P/L values

==================================================
4. KEEP THE MARKET TICKER BAR
==================================================

IMPORTANT:

KEEP the existing horizontal stock/index ticker bar.

This is one of the strongest elements of the current Atlas design.

Improve it rather than removing it.

The ticker should feel like a professional brokerage market strip.

Example:

S&P 500
5,648.40
+0.42%

NASDAQ
17,862.23
+0.61%

DOW
41,142.15
-0.18%

AAPL
$228.31
+1.24%

NVDA
$174.52
+2.08%

Ticker styling:

white or very light gray background
thin top/bottom borders
compact height
small professional typography
tabular numbers
green/red percentage movement
no oversized cards
no glowing elements

It should resemble a real financial market data strip.

==================================================
5. LEFT NAVIGATION
==================================================

Keep the existing Atlas navigation structure and destinations.

Dashboard
Markets
Portfolio
News
Journal
Atlas AI
Tournaments
Learn
Profile / Settings

Redesign the sidebar.

Use:

white background
thin right border
approximately 220–240px width

Atlas logo at top.

Navigation rows:

height approximately 40px
small icon
14px label
minimal styling

Inactive:
dark gray text

Hover:
#F3F5F7 background

Active:
very light blue background
dark navy text
subtle 3px Atlas-blue left indicator

NO giant rounded navigation pills.

NO glowing icons.

NO large blue boxes.

The sidebar should feel like professional brokerage software.

==================================================
6. TOP HEADER
==================================================

Create a compact professional application header.

Include:

page context
search
notifications
account/profile controls

Use:

white background
thin bottom border
approximately 56–64px height

Search should look like a real brokerage security search.

Placeholder:

"Search stocks, ETFs, news..."

Avoid giant search bars.

==================================================
7. DASHBOARD
==================================================

Make Dashboard look like an actual brokerage account overview.

Reduce the number of isolated floating cards.

Create clear information regions.

Suggested structure:

TOP:

Good afternoon, [Name]

Portfolio Value
$24,582.14

Today
+$286.42 (+1.18%)

Buying Power
$4,210.00

SECOND ROW:

Portfolio Performance chart

Watchlist

THIRD ROW:

Positions / Holdings

Market News

Learning Progress

Use professional tables wherever possible instead of cards.

For holdings table:

Symbol
Company
Shares
Price
Day %
Market Value
Total Return

Tables should use:

white background
thin horizontal separators
compact rows
right-aligned numbers
subtle hover state

Do not place every holding inside an individual card.

==================================================
8. CARDS AND PANELS
==================================================

Stop using large rounded cards everywhere.

NEW RULE:

border-radius:
4px to 6px maximum for most panels.

Some buttons may use 4px–6px.

Avoid 12px, 16px, 20px+ rounded containers unless absolutely necessary.

Panels:

background #FFFFFF
border 1px solid #D8DDE3
very subtle or NO shadow

Preferred:

border
not shadow

Use whitespace and typography for hierarchy instead of decorative containers.

==================================================
9. BUTTONS
==================================================

Buttons should look institutional.

PRIMARY:

background #173B57
white text
4px–6px radius
medium font weight

SECONDARY:

white background
#173B57 text
1px border #B9C3CC

Avoid:

pills
glows
gradients
huge buttons
excessive icons

==================================================
10. MARKETS PAGE
==================================================

Make Markets feel significantly more like professional market software.

Create clear sections:

Market Overview

Major Indexes

Top Movers

Most Active

Watchlist

Sectors

Market News

Use dense tables.

Example:

SYMBOL     PRICE       CHANGE      CHANGE %
AAPL       $228.31     +2.81       +1.24%
NVDA       $174.52     +3.56       +2.08%
MSFT       $506.44     -1.21       -0.24%

Use green/red primarily on numbers.

Do not turn every stock into a colorful card.

==================================================
11. STOCK DETAIL PAGE
==================================================

This page should look particularly professional.

HEADER:

AAPL
Apple Inc.

$228.31
+$2.81 (+1.24%)

Watchlist button
Trade button

Then navigation tabs:

Overview
Chart
News
Financials
Analysis

CHART should be the visual focus.

Below chart:

Open
High
Low
Previous Close
Volume
Market Cap
P/E Ratio
52 Week Range

Use a compact financial metrics grid.

NO giant cards.

NO excessive rounded containers.

==================================================
12. PORTFOLIO
==================================================

Portfolio should resemble a real brokerage portfolio screen.

Primary hierarchy:

Portfolio Value

Day Change

Total Return

Performance chart

Positions

Allocation

Orders / Activity

Positions should be primarily TABLE BASED.

Numbers aligned correctly.

Use tabular numerals.

Do not create oversized cards for every metric.

==================================================
13. NEWS
==================================================

Keep Atlas Market Intelligence and personalized news features.

However, redesign the visual presentation to resemble a professional financial newsroom.

Use:

headline
source
timestamp
related tickers
small relevance indicator

Articles should primarily be separated by thin borders.

Avoid putting every article in a giant rounded card.

Atlas AI explanations can appear in a subtle light-blue information panel.

Label:

WHY THIS MATTERS TO YOU

Keep this useful but visually restrained.

==================================================
14. ATLAS AI
==================================================

Atlas AI should NOT look like ChatGPT.

It should feel like a brokerage research assistant.

Use terminology such as:

Atlas Research Assistant

Suggested questions:

"Why did NVDA move today?"

"Explain my portfolio risk."

"What news affects my watchlist?"

"Compare AAPL and MSFT fundamentals."

Interface should be clean and professional.

No glowing AI orb.

No gradient.

No neon purple.

No oversized chatbot bubbles.

AI answers should resemble research notes.

==================================================
15. JOURNAL
==================================================

Make Journal resemble a trading journal rather than a social media feed.

Use columns and structured information:

Date
Symbol
Side
Entry
Exit
P/L
Strategy
Notes

Selecting a trade can open detailed notes.

Use tables and structured panels.

==================================================
16. TOURNAMENTS / CHALLENGES
==================================================

Keep the competitive system.

But reduce the gaming/arcade appearance.

Leaderboard:

Rank
Trader
Return
Portfolio Value
Trades

Use a professional ranking table.

Gold/silver/bronze accents may be used subtly for top three positions.

Avoid huge trophy graphics.

==================================================
17. LEARN
==================================================

Keep Atlas education engaging but mature the visual presentation.

Course cards can remain, but make them restrained.

Use:

small thumbnail/icon
course title
difficulty
duration
progress

Progress bars should be thin.

Avoid oversized colorful lesson cards.

==================================================
18. INFORMATION DENSITY
==================================================

Increase useful information density approximately 20–30%.

The interface currently uses too much space per element.

Reduce:

padding
giant gaps
oversized headings
huge cards

Professional trading software displays more useful information per screen.

However:

DO NOT make the application cramped.

Maintain approximately:

16–24px page margins
16–20px panel padding
8–12px related-element spacing
24–32px major-section spacing

==================================================
19. ICONS
==================================================

Continue using simple line icons.

Lucide icons are appropriate.

Use icons sparingly.

Typical icon size:

16px–18px

Do not place every icon inside a colored rounded square.

Icons should support navigation, not dominate it.

==================================================
20. REMOVE THE "AI GENERATED" LOOK
==================================================

This is one of the most important requirements.

Avoid common AI-generated dashboard patterns:

four giant statistic cards in a row
random gradients
blue/purple glow
rounded everything
floating glass cards
giant hero typography inside application screens
unnecessary motivational text
excessive emojis
decorative blobs
huge empty spaces
generic SaaS layouts
identical card grids
oversized icons
random badges

Atlas should look intentionally designed by a fintech product team.

Every element should have a functional reason to exist.

==================================================
21. RESPONSIVE DESIGN
==================================================

Desktop is the primary brokerage experience.

Desktop should support:

1440px
1280px
1024px

Tablet and mobile should remain usable.

On mobile:

collapse sidebar
preserve market ticker with horizontal scrolling
convert wide tables intelligently
prioritize portfolio value, market data, watchlist and news

==================================================
22. DO NOT BREAK FUNCTIONALITY
==================================================

CRITICAL:

This is a visual redesign.

Preserve:

existing React application
existing components where practical
Supabase
authentication
user state
portfolio logic
market data
charts
news
Atlas AI
journal
tournaments
learning system
onboarding
buttons
filters
navigation
forms
existing interactions

Do not replace working components with static mockups.

Do not remove working functionality just to simplify the design.

==================================================
23. DESIGN CONSISTENCY
==================================================

Apply this design system ACROSS THE ENTIRE AUTHENTICATED ATLAS APPLICATION.

Dashboard
Markets
Stock Detail
Portfolio
News
Journal
Atlas AI
Tournaments
Learn
Profile
Settings
Onboarding
Modals
Dropdowns
Forms
Search
Tables

Everything should feel like one cohesive financial product.

==================================================
24. FINAL QUALITY CHECK
==================================================

Before finishing, inspect every major Atlas screen.

Ask:

Does this look like a legitimate brokerage/financial platform?

Would a parent trust this?

Would an investor think this is a real fintech company?

Does this look manually designed rather than AI generated?

Is financial data easier to scan?

Are there too many rounded cards?

Is the typography professional?

Is the blue restrained?

Are tables used where tables make more sense than cards?

Is the market ticker still prominent?

If any screen still looks like a generic AI-generated fintech dashboard, redesign that screen until it does not.

FINAL TARGET:

Atlas should feel like a modern professional brokerage platform built specifically for learning and simulated investing — not a crypto app, not a gaming dashboard, and not an AI-generated SaaS template.

PRESERVE ATLAS'S PRODUCT IDENTITY AND ALL FUNCTIONALITY.

CHANGE THE VISUAL LANGUAGE.