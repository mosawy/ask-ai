# FrappeInsight AI

FrappeInsight AI is an intelligent, conversational interface for [Frappe](https://frappeframework.com/) ERP systems. It uses Google's Gemini 2.5 Flash model to allow users to ask questions about their ERP data in natural language, automatically generating SQL-like queries, analyzing results, and rendering interactive visualizations.

## 🚀 Features

-   **Natural Language Querying:** Ask questions in any language (e.g., "Show me sales trends for the last 6 months" or "Who are the top 5 customers?").
-   **Agentic Workflow:** The AI autonomously:
    1.  **Scans** your available DocTypes to find relevant tables.
    2.  **Learns** the schema (fields/columns) of selected DocTypes.
    3.  **Generates** a precise database query.
    4.  **Visualizes** the results.
-   **Interactive Visualizations:**
    -   Automatically selects between Bar, Line, Area, and Pie charts.
    -   **Zoom & Pan:** Includes brush tools for detailed data exploration on time-series charts.
    -   Export charts to CSV or JSON.
-   **Memory System:**
    -   **Short-term:** Remembers conversation context (e.g., "Filter *that* by date").
    -   **Long-term:** User-defined facts (e.g., "Fiscal year starts in April") that persist across sessions and guide AI behavior.
-   **Dual Modes:**
    -   **Demo Mode:** Generates realistic mock data for testing without a database.
    -   **Connected Mode:** Connects to a live Frappe/ERPNext site via API.
-   **Frappe Integration:** Can run standalone or embedded directly inside the Frappe Desk.

---

## 🛠️ Prerequisites

1.  **Node.js** (v18 or higher)
2.  **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudiocdn.google.com/))
3.  **Frappe/ERPNext Site** (v13, v14, or v15) - *Optional if using Demo Mode*

---

## ⚡ Quick Start (Standalone)

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Set Environment Variables**
    Create a `.env` file in the root directory (or set it in your environment):
    ```env
    API_KEY=your_gemini_api_key_here
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

---

## 🔌 Connecting to Frappe

To connect the standalone app to your Frappe site, you must enable CORS on your Frappe server.

1.  **Configure CORS in Frappe**
    Edit your `site_config.json`:
    ```json
    {
     "allow_cors": "http://localhost:5173"
    }
    ```
    *Restart your bench after saving.*

2.  **Connect in App**
    -   Click **"Connect Database"** in the sidebar.
    -   Enter your **Site URL** (e.g., `https://mysite.frappe.cloud`).
    -   Enter an **API Key** and **API Secret** (generated from a User profile in Frappe).

---

## 📦 Integration: Embedding in Frappe Desk

To run this app *inside* your Frappe Admin Desk as a custom page:

1.  **Build the Project**
    Configure `vite.config.js` to output to your custom app's public folder:
    ```javascript
    // vite.config.js
    build: {
      outDir: '../your_frappe_app/your_frappe_app/public/js/insight_build',
      lib: { entry: 'index.tsx', name: 'FrappeInsight', fileName: 'frappe-insight' }
    }
    ```
    Run:
    ```bash
    npm run build
    ```

2.  **Create a Page in Frappe**
    Create a new Page (e.g., `insight`) and add the following to `insight.js`:
    ```javascript
    frappe.pages['insight'].on_page_load = function(wrapper) {
        var page = frappe.ui.make_app_page({
            parent: wrapper,
            title: 'AI Insights',
            single_column: true
        });

        // Mount point
        $(wrapper).find('.layout-main-section').append('<div id="root" style="height: 80vh;"></div>');

        // Load Script
        frappe.require('/assets/your_frappe_app/js/insight_build/frappe-insight.js');
    }
    ```

3.  **Automatic Auth:**
    The app detects `window.frappe` and automatically uses the browser's session cookies (CSRF token), skipping the API Key login screen.

---

## 🧠 Architecture

The application uses a 3-step RAG (Retrieval Augmented Generation) pipeline located in `services/geminiService.ts`:

1.  **Selector Agent:**
    -   Input: User Query + List of ALL DocTypes.
    -   Output: Top 1-3 relevant DocType names (e.g., `['Sales Invoice', 'Customer']`).

2.  **Query Agent:**
    -   Input: User Query + Schema (Fields) of selected DocTypes + Long-term Memory.
    -   Output: A structured JSON configuration for `frappe.client.get_list` (Filters, Fields, Order).

3.  **Analyst Agent:**
    -   Input: User Query + Real Data returned from DB.
    -   Output: Natural language answer + Visualization Config + Follow-up questions.

---

## 💾 Memory System

### Long-term Memory
Accessible via the Sidebar. Use this to teach the AI specific business rules.
-   *"Our fiscal year starts in April."*
-   *"Always exclude Cancelled invoices."*
-   *"Revenue is defined as Grand Total - Taxes."*

### Short-term Memory
The app automatically sends the last 6 messages to the AI. This allows for follow-up queries like:
1.  User: "Show sales by month."
2.  AI: (Shows chart)
3.  User: "Filter **that** for Customer A." (AI knows "that" refers to the sales query).

---

## 📁 Project Structure

```
├── components/
│   ├── ChartRenderer.tsx   # Recharts wrapper (Bar, Line, Area, Pie)
│   ├── ConnectModal.tsx    # Connection logic
│   ├── MessageBubble.tsx   # Chat UI & Actions
│   └── Sidebar.tsx         # Navigation & Memory Management
├── services/
│   ├── exportService.ts    # CSV/JSON handling
│   ├── frappeService.ts    # API calls (get_list, get_doc_info)
│   └── geminiService.ts    # AI Agent logic & Prompts
├── constants.ts            # Mock data for Demo Mode
├── types.ts                # TypeScript Interfaces
└── App.tsx                 # Main Controller & State
```