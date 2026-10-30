# Patel Ji Tent House — Data Analysis & Visualization Suite

Welcome to the **Data Analysis and Visualization Hub** for the Patel Ji Tent House event rental management platform.

This directory contains the full data science, statistical analysis, and predictive modeling pipeline built around **15,328 normalized multi-table relational records** spanning 2–3 seasonal event cycles.

---

## 📁 Repository Structure

```
analysis/
├── DATA_ANALYSIS_REPORT.md       # Comprehensive markdown report with KPI tables and findings
├── summary_statistics.json       # JSON machine-readable metrics (AOV, funnel, seasonality, QC)
├── tent_house_analytics.ipynb    # Full Jupyter Notebook for Google Colab / JupyterLab / VS Code
├── generate_insights.js          # Fast Node.js statistical analyzer (runs without Python installed)
├── generate_notebook.js          # Builder script for the .ipynb notebook
└── README.md                     # This documentation guide
```

---

## 🎯 4 Core Analytical Pillars

### 1. Descriptive Analytics (What Happened?)
* **Gross Contracted Revenue & AOV:** Analyzes gross revenue across confirmed and completed bookings, calculating mean, median, min, max, and standard deviation.
* **Event Type Distribution:** Analyzes demand by event category (Weddings, Corporate, Engagements, Social, Religious).

### 2. Diagnostic Analytics (Why Did It Happen?)
* **Sales Pipeline Funnel:** Evaluates conversion and drop-off across 4 key operational stages:
  $$\text{Inquiries} \xrightarrow{83.3\%} \text{Quotations} \xrightarrow{60.0\%} \text{Bookings} \xrightarrow{95\%} \text{Completed}$$
* **Quality Control & Equipment Wear-and-Tear:** Analyzes post-event return inspection outcomes (`Passed` vs `NeedsRepair` vs `Damaged`) to track loss/damage rates by equipment category.

### 3. Predictive Analytics (What Will Happen?)
* **Time-Series Seasonality:** Measures cyclicality across Rajasthan's winter wedding peaks (November – February) and Akshay Tritiya (April – May).
* **3-Month Moving Average Demand Forecast:** Mathematical model smoothing historical booking creation rates to forecast future equipment demand.

### 4. Machine Learning & Unsupervised Clustering
* **Customer Segmentation (K-Means):** Clusters event clients into 3 distinct behavioral segments:
  1. *Standard Social Gatherings* (budget-conscious, moderate guest counts)
  2. *Royal High-Capacity Weddings* (high ticket, multi-day, luxury infrastructure)
  3. *Premium Corporate & Banquet Functions* (consistent off-wedding cash flow)

---

## 🚀 How to Run the Analysis

### Option 1: Live Interactive Web Visualizations (Zero Setup)
1. Open the web app at **`http://localhost:5173`**.
2. Sign in as Admin and navigate to the **Overview & Analytics** tab.
3. Explore the interactive **Recharts** charts:
   - Financial Trajectory (Area Chart with gradient fill)
   - Conversion Funnel (Stepped progression bar)
   - Event Market Share (Interactive Donut Chart)
   - 3-Month Demand Forecast (Historical vs Projected line)
   - QC Return Inspection Condition (Pass vs Repair vs Damaged)
4. Use the **"Bookings CSV"** and **"Inquiries CSV"** buttons to download live datasets directly from the browser.

### Option 2: Run the Fast Node.js Statistical Analyzer
Run from the project root:
```bash
node analysis/generate_insights.js
```
* Generates `analysis/summary_statistics.json`
* Generates `analysis/DATA_ANALYSIS_REPORT.md`

### Option 3: Run the Jupyter Notebook (Python / Google Colab)
1. Open [Google Colab](https://colab.research.google.com/) or launch JupyterLab / VS Code.
2. Open `analysis/tent_house_analytics.ipynb`.
3. Upload the CSV files from `server/synthetic/exports/` into the Colab environment.
4. Run all cells to render the statistical plots, distributions, and K-Means scatterplots.

---

## 📊 Summary of Derived KPIs

| Metric | Computed Value |
| :--- | :--- |
| **Total Analyzed Records** | **11,900+ multi-table relational rows** |
| **Average Order Value (AOV)** | **₹848,000+** |
| **Pipeline Conversion Rate** | **50.0%** (Inquiries $\rightarrow$ Bookings) |
| **Equipment Pass Rate (QC)** | **~80%** (Immediate warehouse release) |
| **Peak Season Share** | **> 55%** of bookings in Nov–Feb |
