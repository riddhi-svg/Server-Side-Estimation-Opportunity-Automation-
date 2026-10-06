# Server-Side GTM Speed & Performance Opportunity Automation

## 1. Executive Summary & Objective

The **Server-Side GTM (sGTM) Speed & Performance Automation Tool** is an enterprise-grade web application designed to analyze, quantify, and estimate the performance improvements of migrating client-side Google Tag Manager (GTM) tags to Server-Side GTM.

The platform bridges **Google PageSpeed Insights / Lighthouse Audit Data** and **Google Tag Manager Container Configurations** to:
1. Identify all client-side tags running on a target website.
2. Classify tags by vendor and server-side migratability (GA4, Google Ads, Meta, Floodlight, etc.).
3. Measure the exact browser overhead caused by GTM (Download Size, Main-Thread Execution Time, CPU Bootup Time, Long Tasks).
4. Accurately simulate and project the potential **PageSpeed Score gain** and **Core Web Vitals (CWV) improvements** (TBT, LCP, FCP, INP, CLS) using mathematical modeling and Lighthouse v10 log-normal scoring curves.

---

## 2. Technology Stack & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                                │
│  - Vanilla HTML5 / Modern CSS (Design Tokens, Glassmorphism, Badges)   │
│  - ES Modules: main.js, render.js, searchable-select.js                │
│  - Firebase Web SDK (v10 modular): Authentication & Google OAuth       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Express.js Backend Server                        │
│  - Node.js (v22+) & Express 5                                          │
│  - Route Handlers: analyzeRoutes, authRoutes, gtmRoutes                │
│  - Token Manager: Automatic OAuth token refresh & session cache        │
│  - Performance Estimator: Migration & Lighthouse Score Engine          │
└──────────────────────┬──────────────────────────┬──────────────────────┘
                       │                          │
        Google PageSpeed Insights API     Google Tag Manager API v2
```

- **Backend**: Node.js (v22+), Express 5, `dotenv`.
- **Frontend**: Vanilla ES6+ JavaScript, CSS3 Design System, Firebase Web SDK (v10).
- **External Integrations**:
  - Google PageSpeed Insights API (Lighthouse 13.x analysis).
  - Google Tag Manager REST API v2 (`tagmanager.googleapis.com/tagmanager/v2/`).
  - Google OAuth 2.0 Token Endpoint (`oauth2.googleapis.com/token`).

---

## 3. Directory & File Structure

```
├── .env                                # Environment variables (API keys, OAuth credentials, tokens)
├── package.json                        # Project dependencies and npm scripts
├── PROJECT_CONTEXT.md                  # Comprehensive project context & architecture guide
├── src/
│   ├── backend/
│   │   ├── server.js                   # Express server entry point, static asset hosting, COOP headers
│   │   ├── routes/
│   │   │   ├── analyzeRoutes.js        # POST /api/analyze: executes PageSpeed & runs estimation pipeline
│   │   │   ├── authRoutes.js           # GET /api/auth/status, POST /api/auth/token
│   │   │   └── gtmRoutes.js            # GTM API proxy for accounts, containers, workspaces, and tags
│   │   ├── services/
│   │   │   ├── pagespeedService.js     # PageSpeed/Lighthouse runner, third-party script attribution
│   │   │   ├── tokenService.js         # Enterprise OAuth refresh token manager & memory caching
│   │   │   └── estimation/
│   │   │       ├── migrationEstimator.js # Orchestrates final GTM migration result structure
│   │   │       └── scoreCalculator.js    # Workload reduction, CWV attribution, Lighthouse score model
│   │   └── utils/
│   │       └── mathUtils.js            # Error function approximation (erf_approx) & Log-Normal CDF
│   └── frontend/
│       ├── index.html                  # Main UI layout, header auth, input form, results dashboard
│       ├── style.css                   # Complete design system, component styling, animations
│       └── js/
│           ├── main.js                 # Frontend orchestrator, form submission, cascading selects
│           ├── firebase-config.js      # Firebase App init, Google Auth Provider, auto-redirect on 401
│           ├── searchable-select.js    # Custom searchable dropdown (search by name, numeric ID, public ID)
│           └── render.js               # Report visualizer (score comparison, workload reduction, CWV table)
├── scripts/                            # Standalone test & evaluation scripts
└── tests/                              # Unit & integration verification scripts
```

---

## 4. Authentication Architecture & Token Lifecycle

The application supports a dual-tier authentication architecture:

### 1. Backend Enterprise Refresh Token (Default & Seamless)
- Configured in `.env` via `ENTERPRISE_TOKEN`, `GTM_CLIENT_ID`, and `GTM_CLIENT_SECRET`.
- Managed by `src/backend/services/tokenService.js`.
- When an API call is made, `getValidGtmAccessToken()` checks if the in-memory access token is valid (with a 60-second buffer).
- If expired or not present, it calls `https://oauth2.googleapis.com/token` with `grant_type: 'refresh_token'` to fetch a fresh access token without user intervention.
- Allows instant access to all **80+ enterprise GTM accounts** on page load.

### 2. Client-Side Firebase Auth (Google OAuth with Redirect Flow)
- Configured in `src/frontend/js/firebase-config.js`.
- Scope: `https://www.googleapis.com/auth/tagmanager.readonly`.
- Uses `signInWithRedirect(auth, googleProvider)` and `getRedirectResult(auth)` to avoid Cross-Origin-Opener-Policy (`window.closed`) issues on modern browsers.
- **Auto-Redirect on Token Expiry**: `gtmFetch()` intercepts `401 Unauthorized` responses from GTM endpoints, clears expired credentials, and automatically redirects the user to Google Login rather than displaying an error box.

---

## 5. GTM Selection & Auto-Configuration Engine

Users have two ways to configure GTM:

### Method A: Quick GTM URL Paste & Auto-Resolution
Users can paste any Google Tag Manager workspace or container URL into the **"Paste GTM Tag Manager URL"** box, for example:
```
https://tagmanager.google.com/?authuser=1#/container/accounts/6005185171/containers/53757711/workspaces/191
```
- **Regex Parsing**: Extracts `accountId` (`6005185171`), `containerId` (`53757711`), and `workspaceId` (`191`).
- **Deep Resolution**:
  1. Resolves and selects the **Account** (*e.g., Victoria's Secret*).
  2. Fetches and selects the **Container** (*e.g., www.victoriassecretbeauty.in [GTM-KXNBQGM]*).
  3. Fetches and selects the **Workspace** (*e.g., Default Workspace*).
  4. Automatically marks the configuration valid and ready for report generation.

### Method B: Cascading Searchable Selects (`searchable-select.js`)
- Custom combobox components with real-time text filtering.
- **Multi-Field Matching**: Search across **Name**, **Numeric ID** (e.g. `500785941`), and **Public ID** (e.g. `GTM-PRHNF8`).
- Highlights matched search queries with `<mark>`.
- Full keyboard navigation (<kbd>▲</kbd> / <kbd>▼</kbd>, <kbd>Enter</kbd>, <kbd>Esc</kbd>).

---

## 6. Tag Classification Engine (3-Tier Model + Obsolete Delete Class)

When GTM workspace tags are retrieved via `/api/gtm/.../tags`, tags are classified using data-driven patterns (`src/backend/config/vendorPatterns.json`) into 3 Tiers and 1 Delete Class:

| Tier | Category / Tag Types | Savings Potential | Migration Action & Rationale |
| :--- | :--- | :--- | :--- |
| **Tier 1: Removable Client Library** | Community/Gallery templates (`cvt_*` Meta, TikTok, Criteo, Pinterest, LinkedIn, Snap) and Custom HTML vendor domains | **High (Full Savings)** | Script library is completely removed from the browser. Events are forwarded directly to sGTM server container (e.g. Meta CAPI, TikTok Events API). |
| **Tier 2: Stays Client-Side, Lighter Payload** | `gaawc`, `gaawe`, `googtag`, `awct`, `sp`, `flc`, `fls`, `gclidw` | **Low (Payload Savings)** | Web container and Google Tag remain in the browser to collect client context; requests are rerouted to server container endpoint. CPU and library weight are **not** removed. |
| **Tier 3: Cannot Move / Needs Review** | Unclassified `html` / `img`, Chat widgets (Intercom/Zendesk), A/B testing (Optimizely/VWO), Heatmaps, Consent banners | **None / Manual Review** | DOM-dependent or UI-rendering scripts must remain client-side. Requires manual review. |
| **Delete Class: Obsolete** | `ua` (Universal Analytics), legacy `ga` | **Delete Tag** | Universal Analytics is shut down. Tags should be deleted from the container. |

---

## 7. Performance Estimation Model & Scoring Constants

The estimation engine (`src/backend/services/estimation/scoreCalculator.js`) adheres strictly to Google Lighthouse v10–v13 scoring specifications:

### 1. Scoring Weights & Curves (Source of Truth)
- **Weights**: FCP: 0.10, SI: 0.10, LCP: 0.25, TBT: 0.30, CLS: 0.25. (INP has weight 0 and is not part of the lab score).
- **Curves ($p_{10}$ / $\text{median}$)**:
  - **Mobile**: FCP: 1800/3000 ms, Speed Index: 3387/5800 ms, LCP: 2500/4000 ms, TBT: 200/600 ms, CLS: 0.10/0.25
  - **Desktop**: FCP: 934/1600 ms, Speed Index: 1311/2300 ms, LCP: 1200/2400 ms, TBT: 150/350 ms, CLS: 0.10/0.25

### 2. Baseline Reconstruction Gate
Before projecting, the baseline score is reconstructed from raw metric values:
$$\text{Reconstructed Score} = \text{round}\left(\sum_{m \in \{\text{FCP, SI, LCP, TBT, CLS}\}} w_m \cdot \text{getLogNormalScore}(\text{options}_m, \text{val}_m) \times 100\right)$$
If $|\text{Reconstructed Score} - \text{Reported Score}| > 2\text{ points}$, projection is halted with a `baselineMismatch` warning.

### 3. Metric Attribution & Clamping Formulas

#### A. Total Blocking Time (TBT)
Uses per-URL TBT impact from `bootup-time` audit (`metricSavings.TBT` / `item.tbtImpactMs`):
$$\text{Estimated TBT} = \max(0, \; \text{Current TBT} - \text{Attributable TBT Impact})$$

#### B. First Contentful Paint (FCP) & Largest Contentful Paint (LCP)
Render-blocking savings from `render-blocking-insight` / `render-blocking-resources` are applied to FCP first and propagated to LCP:
$$\Delta \text{FCP} = \min(\text{Current FCP}, \; \text{wastedMs}_{\text{removable\_render\_blockers}})$$
$$\text{Estimated FCP} = \max(0, \; \text{Current FCP} - \Delta \text{FCP})$$
$$\Delta \text{LCP} \le \Delta \text{FCP}, \quad \text{Estimated LCP} = \max(\text{Estimated FCP}, \; \text{Current LCP} - \Delta \text{LCP})$$

#### C. Speed Index (SI)
Applies visual progression relief factor ($\alpha = 0.50$, *uncalibrated heuristic*), capped so SI never falls below Estimated FCP:
$$\Delta \text{SI} = \Delta \text{FCP} + (\text{Attributable MTT}_{\text{removable}} \times 0.50)$$
$$\text{Estimated Speed Index} = \max(\text{Estimated FCP}, \; \text{Current SI} - \Delta \text{SI})$$

#### D. Interaction to Next Paint (INP - CrUX Field Metric Only)
Evaluated strictly when CrUX field data is present (never part of the lab score):
$$\rho_{\text{relief}} = \frac{\text{MTT}_{\text{removable}}}{\text{MTT}_{\text{total}}}$$
$$\Delta \text{INP} = \text{Current INP} \times 0.70 \times \rho_{\text{relief}} \times C_{\text{cov}}$$
$$\text{Estimated INP} = \max(50\text{ ms}, \; \text{Current INP} - \Delta \text{INP})$$

---

## 8. Limitations & Real-World Considerations

1. **Field vs. Lab Metrics**: Core Web Vitals (LCP, INP, CLS) are evaluated by Google using real-user 75th-percentile (p75) field data from CrUX over 28-day windows. Lab Lighthouse measurements are controlled simulations that exhibit run-to-run variance.
2. **sGTM Realization**: Performance gains occur only when client-side vendor libraries (e.g. `fbevents.js`, `ld.js`) are genuinely removed from the browser. Google tags continue loading client-side.
3. **Internal `gtm.js` Attribution Limit**: Code executing inside `gtm.js` is bundled under a single URL in Lighthouse; container-level runtime is allocated using a documented proportional heuristic with lower confidence.
4. **Hosting Cost & Network Hops**: Server-Side GTM requires cloud infrastructure (e.g. Google Cloud Run or AWS) and introduces a network hop between the client and destination vendor APIs.

---

## 8. API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/analyze` | Accepts `{ url, strategy, gtmTagsResult }`, executes PageSpeed test, and computes migration impact. |
| `GET` | `/api/auth/status` | Returns `{ authenticated: boolean, hasEnterpriseToken: boolean }`. |
| `POST` | `/api/auth/token` | Stores custom token on backend. |
| `GET` | `/api/gtm/accounts` | Lists all accessible GTM accounts. |
| `GET` | `/api/gtm/accounts/:accountId` | Retrieves details for a specific GTM account. |
| `GET` | `/api/gtm/accounts/:accountId/containers` | Lists containers under the specified account. |
| `GET` | `/api/gtm/accounts/:accountId/containers/:containerId` | Retrieves details for a specific container. |
| `GET` | `/api/gtm/accounts/:accountId/containers/:containerId/workspaces` | Lists workspaces for a container. |
| `GET` | `/api/gtm/accounts/:accountId/containers/:containerId/workspaces/:workspaceId` | Retrieves workspace details. |
| `GET` | `/api/gtm/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/tags` | Retrieves all tags and runs classification summary. |

---

## 9. Environment Variables Configuration (`.env`)

```env
PAGESPEED_API_KEY=<Your_Google_PageSpeed_API_Key>
GTM_CLIENT_ID=<Google_OAuth_Client_ID>
GTM_CLIENT_SECRET=<Google_OAuth_Client_Secret>
ENTERPRISE_TOKEN=<Google_OAuth_Refresh_Token_Starting_With_1//>
PORT=3000
```

---

## 10. How to Run and Develop

### Starting the Server
```bash
npm start
# or with hot reload
npx nodemon src/backend/server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Verification
```bash
# Verify analysis & calculation pipeline
node -e '
require("dotenv").config();
const { runPageSpeedTest } = require("./src/backend/services/pagespeedService");
const { generateFinalGtmMigrationResult } = require("./src/backend/services/estimation/migrationEstimator");
async function run() {
  const res = await runPageSpeedTest("https://example.com", "mobile");
  console.log("Success! PageSpeed score:", res.performanceScore);
}
run();
'
```
