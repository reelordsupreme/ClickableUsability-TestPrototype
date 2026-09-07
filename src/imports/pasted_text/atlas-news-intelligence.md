# ADD: ATLAS NEWS INTELLIGENCE

Add a major **News** section to the existing Atlas prototype.

Do NOT redesign the rest of Atlas.

The News system should combine a broad financial news feed with **personalized watchlist intelligence powered by Atlas AI**.

The core idea is:

**Show all important market news, but prioritize and highlight stories that are most relevant to stocks the user owns or has on their watchlist.**

Atlas should not just tell users **what happened**.

Atlas should explain:

**Why it matters to them.**

---

# 1. ADD NEWS TO MAIN NAVIGATION

Add:

**News**

to the main Atlas sidebar.

Suggested navigation:

Dashboard
Markets
Portfolio
**News**
Journal
Atlas AI
Tournaments
Learn
Profile / Settings

Clicking News opens the full:

# Market Intelligence

page.

---

# 2. NEWS PAGE STRUCTURE

At the top display:

# Market Intelligence

Subtitle:

**Market-moving news, personalized to your portfolio and watchlist.**

Create navigation tabs:

**For You | Markets | Companies | Economy | Earnings | Technology**

Default:

**For You**

---

# 3. FOR YOU NEWS

This should be the default and most important feed.

Atlas should look at:

1. Stocks the user owns
2. Stocks on their watchlist
3. Industries represented in those stocks
4. Major macroeconomic events
5. Broad market events

Then rank stories based on relevance.

For the prototype, assume the user owns or watches:

* NVDA
* AAPL
* TSLA
* AMZN
* MSFT
* META

News involving these companies should receive priority.

However:

**DO NOT ONLY SHOW WATCHLIST NEWS.**

Continue showing major market news.

The feed should effectively behave like:

**All important financial news + personalized ranking.**

---

# 4. PERSONALIZED LABELS

Stories directly connected to the user's portfolio/watchlist should receive a small badge:

**WATCHLIST**

or

**IN YOUR PORTFOLIO**

Examples:

NVIDIA story:

**WATCHLIST • NVDA**

Apple story:

**IN YOUR PORTFOLIO • AAPL**

Fed story:

**MARKET-WIDE**

Oil story:

**SECTOR**

This lets users immediately understand why Atlas is showing them the story.

---

# 5. NEWS CARDS

Each news card should contain:

**Headline**

Short description

Publisher

Time published

Related ticker(s)

Category

Relevance badge

Example:

### NVIDIA announces next-generation AI infrastructure partnership

Reuters • 18 min ago

NVIDIA announced...

**NVDA • MSFT**

**WATCHLIST**

Then include:

**Atlas AI Impact**

---

# 6. ATLAS AI IMPACT

This is the key feature.

Every significant story should have an:

**Atlas AI Impact**

section.

Atlas AI should answer:

### What happened?

One concise explanation.

### Why does it matter?

Explain the financial significance in beginner-friendly language.

### Stocks potentially affected

Example:

**NVDA ↑**

**AMD ↑**

**MSFT ↑**

### Potential Market Impact

Use:

**Bullish**

**Bearish**

**Mixed**

**Neutral**

### Impact Level

Use:

**Low**

**Medium**

**High**

### Time Horizon

Use:

**Immediate**

**Short Term**

**Long Term**

### What to Watch

Provide 1–3 concrete things that could determine whether the story becomes more important.

---

# 7. PERSONALIZED IMPACT

Atlas should specifically explain how news relates to the user's investments.

Example:

# NVIDIA AI Chip Announcement

**Atlas AI Impact**

**Potential Impact: Bullish**

**Impact Level: High**

### Why this matters to you

**NVDA is on your watchlist.**

Stronger demand for NVIDIA's AI infrastructure could increase expectations for future revenue and data-center growth.

### Your stocks potentially affected

**NVDA — Direct impact**

**MSFT — Indirect impact**

**AMZN — Indirect impact**

### What to watch

* Customer demand
* Data-center spending
* NVIDIA guidance
* Competitor announcements

Include:

**Ask Atlas About This News**

---

# 8. CROSS-STOCK IMPACT

Atlas must understand that news about one company can affect other companies.

For example:

## NVIDIA earnings beat

Potentially affects:

NVDA
AMD
AVGO
MSFT
AMZN
GOOGL

## Tesla delivery numbers

Potentially affects:

TSLA
RIVN
GM
F

## Apple supplier problems

Potentially affects:

AAPL
QCOM
TSM

## Federal Reserve rate decision

Potentially affects:

Nearly the entire market, particularly:

Technology
Banks
Real Estate
Growth Stocks

This relationship analysis is a major part of Atlas AI.

---

# 9. MARKET-WIDE NEWS

Do not limit Atlas to individual companies.

Include:

* Federal Reserve
* Interest rates
* Inflation
* CPI
* PPI
* Jobs reports
* GDP
* Treasury yields
* Oil
* Geopolitical developments
* Regulation
* Major earnings
* AI industry developments
* Semiconductor industry
* Banking
* Consumer spending

Atlas should explain why macroeconomic events affect stocks.

---

# 10. EXAMPLE FED STORY

### Federal Reserve signals rates could remain elevated

**MARKET-WIDE**

### Atlas AI Impact

**Potential Impact: Mixed**

**Impact Level: High**

### Why markets care

Higher interest rates can make borrowing more expensive and can reduce the present value investors assign to future corporate earnings.

Growth companies can therefore be particularly sensitive to changes in rate expectations.

### Relevant to your watchlist

**NVDA — Medium relevance**

**AAPL — Medium relevance**

**MSFT — Medium relevance**

**AMZN — Medium relevance**

### What to watch

Treasury yields

Next inflation report

Fed commentary

Market expectations for the next rate decision

---

# 11. NEWS DETAIL PAGE

Clicking any story should open a full:

# News Analysis

page.

Structure:

### Original News

Headline

Publisher

Published time

Image if available

Brief summary

Button:

**Read Original Article**

---

### Atlas Summary

Explain the story in approximately 3–5 concise sentences.

---

### Atlas AI Market Impact

Show:

**Bullish / Bearish / Mixed / Neutral**

**Impact: Low / Medium / High**

---

### Why It Matters

Provide a beginner-friendly explanation.

---

### Stocks Affected

Create a table:

| Stock | Relationship | Potential Impact |
| ----- | ------------ | ---------------- |
| NVDA  | Direct       | Bullish          |
| AMD   | Competitor   | Mixed            |
| MSFT  | AI Customer  | Bullish          |
| AMZN  | AI Customer  | Bullish          |

---

### YOUR WATCHLIST

Highlight affected stocks that the user actually follows.

---

### What To Watch Next

Show upcoming catalysts that could change the interpretation.

---

### Ask Atlas

Button:

**Ask Atlas About This News**

---

# 12. ASK ATLAS ABOUT NEWS

Clicking:

**Ask Atlas About This News**

should open Atlas AI with the article already attached as context.

Display:

**Discussing: [News Headline]**

Suggested questions:

**Why could this move NVDA?**

**Is this bullish or bearish?**

**Which stocks are most affected?**

**Does this affect my portfolio?**

**Explain this simply.**

**What should I watch next?**

For the prototype, use realistic simulated AI responses.

---

# 13. NEWS SEARCH

Add a search bar:

**Search companies, tickers, topics, or news...**

Support prototype searches such as:

NVDA
NVIDIA
Tesla
TSLA
Apple
AAPL
Federal Reserve
Interest Rates
AI
Semiconductors
Earnings

Search results should update accordingly.

---

# 14. FILTERS

Include filters:

**All**

**Watchlist**

**Portfolio**

**Market Moving**

**Earnings**

**Macro**

Allow users to combine relevant filters where practical.

Example:

Selecting:

**Watchlist**

should primarily display stories related to watched companies.

---

# 15. RELEVANCE RANKING

Simulate an Atlas relevance algorithm.

Rank stories based on:

### Highest Priority

Direct news about stocks the user owns.

### Very High Priority

Direct news about watchlist stocks.

### High Priority

News affecting the same industry.

### Medium Priority

Macroeconomic news likely to affect those stocks.

### Standard Priority

Other important financial-market news.

The feed should still contain major stories outside the user's watchlist.

Atlas is personalizing **priority**, not creating an information bubble.

---

# 16. RELEVANCE SCORE

Internally simulate a:

**Relevance Score: 0–100**

Example:

NVDA earnings when NVDA is owned:

**98**

Semiconductor regulation:

**87**

Federal Reserve rate decision:

**82**

AMD product announcement:

**74**

Oil inventory report:

**31**

Do not necessarily display the numeric score prominently to users.

Use it primarily to determine feed ranking.

---

# 17. MARKET-MOVING INDICATOR

Important stories should receive:

**MARKET MOVING**

Only use this for genuinely significant simulated stories.

Do not label every article market-moving.

---

# 18. BREAKING NEWS

Create a subtle:

**BREAKING**

state.

Breaking stories can temporarily move toward the top of the feed.

If the story affects a watchlist stock, show:

**BREAKING • WATCHLIST**

Example:

**BREAKING • WATCHLIST • NVDA**

---

# 19. DASHBOARD NEWS WIDGET

Add:

# News For You

to the main Dashboard.

Show approximately 3 high-relevance stories.

Prioritize:

1. Portfolio
2. Watchlist
3. Major market events

Each story should show:

Headline

Ticker

Time

AI Impact

Example:

**NVDA announces new AI partnership**

NVDA • 14m

**Atlas Impact: Bullish • High**

Clicking it opens the complete News Analysis page.

Include:

**View All News →**

---

# 20. STOCK PAGE NEWS

Each Stock Detail page should contain:

# Latest News

Only show stories relevant to that company.

For NVDA:

Show NVIDIA and semiconductor/AI stories.

Each should include a small:

**Atlas Impact**

indicator.

Example:

**Bullish • High**

Clicking opens the full Atlas News Analysis.

---

# 21. WATCHLIST NEWS ALERTS

Create simulated alerts when important news affects a watched company.

Example notification:

# NVDA — High Impact News

NVIDIA released updated revenue guidance.

**Atlas Impact: Bullish • High**

Button:

**View Analysis**

Do not overwhelm users with low-impact stories.

Prioritize Medium and High impact alerts.

---

# 22. NEWS + PORTFOLIO CONNECTION

If news affects an owned stock, Atlas should explicitly state:

**You own this stock**

Example:

### Portfolio Impact

You currently own:

**8 NVDA shares**

This story has a **High** relevance to your NVDA position.

Then explain why.

Do NOT calculate or promise how much money the user will make or lose.

---

# 23. EDUCATIONAL SAFETY

Atlas AI must distinguish:

**Potential impact**

from

**Certain outcome.**

Never say:

"This will make NVDA go up."

Instead use:

"This development could be bullish for NVDA because..."

or:

"Investors may interpret this positively because..."

Markets can react differently than expected.

Atlas should teach users to think about catalysts rather than blindly trade headlines.

---

# 24. PROTOTYPE TEST FLOW

The following exact scenario must work:

1. User opens Atlas.
2. Dashboard displays **News For You**.
3. NVDA-related story appears because NVDA is on the user's watchlist/portfolio.
4. User clicks the story.
5. News Analysis opens.
6. User reads Atlas Summary.
7. User sees **Potential Impact: Bullish**.
8. User sees **Impact Level: High**.
9. User sees affected stocks.
10. User sees which affected stocks are on their watchlist.
11. User clicks **Ask Atlas About This News**.
12. Atlas AI opens with the story attached.
13. User asks **Why could this affect NVDA?**
14. Atlas provides a simulated explanation.
15. User returns to News.
16. User selects **Market Moving**.
17. Feed changes.
18. User selects **Watchlist**.
19. Feed prioritizes watched companies.
20. User searches **Federal Reserve**.
21. Macro stories appear.
22. User opens a Fed story.
23. Atlas explains why interest rates could affect the user's technology stocks.

EVERY STEP SHOULD WORK.

---

# FINAL OBJECTIVE

Atlas News should answer four questions extremely quickly:

**WHAT HAPPENED?**

**WHY DOES IT MATTER?**

**WHICH STOCKS COULD IT AFFECT?**

**WHY DOES IT MATTER TO ME?**

The major differentiator is personalization.

A normal financial news app gives everyone essentially the same feed.

**Atlas should understand the user's portfolio and watchlist, prioritize the news most relevant to them, and use Atlas AI to explain how and why each event could matter.**

Keep the existing Atlas visual identity.

Do not redesign the application.

Integrate this News Intelligence system into the existing Dashboard, sidebar, stock pages, notifications, watchlist, portfolio, and Atlas AI experience.
