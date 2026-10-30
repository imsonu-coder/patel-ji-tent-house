# Data Analytics & Predictive Visualization Lab
## Patel Ji Tent House - Research & Internship Portfolio

This directory contains the computational data science scripts, statistical models, and Jupyter notebook for the **Patel Ji Tent House** event rental platform.

---

### Contents
1. **`Patel_Tent_House_Data_Analytics.ipynb`**:
   - Complete Jupyter Notebook ready for presentation.
   - Contains Exploratory Data Analysis (EDA), Central Tendency & Dispersion analysis, Pearson correlation testing, and Holt-Winters seasonal exponential smoothing.
2. **`eda_analysis.py`**:
   - Standalone Python analytics script that runs without external complex dependencies.
   - Outputs descriptive summary statistics, regression equations, and forecast tables directly to the console.

---

### How to Run for Your Teacher

#### Option A: Running the Standalone Python Script
In your terminal, navigate to this folder and run:
```powershell
cd server/analytics_lab
python eda_analysis.py
```

#### Option B: Opening the Interactive Jupyter Notebook
Open the file `Patel_Tent_House_Data_Analytics.ipynb` directly in **VS Code** (or Google Colab / JupyterLab).
- Click **"Run All"** to generate all charts, regression lines, and tables live.

---

### Key Analytical Takeaways to Present
1. **Seasonal Demand Surge**:
   - Peak wedding demand in Rajasthan occurs across **November to February** and **May (Akshay Tritiya)** with an average of $165–185$ bookings per month, compared to off-peak monsoon months ($34–42$ bookings in July/August).
2. **Advance Lead Time vs Deal Value Correlation**:
   - Strong positive Pearson correlation ($r = +0.72$, $R^2 = 0.52$).
   - Clients planning more than 60 days ahead invest $3.2\times$ more into premium mandaps, ambient lighting, and German hangar tents.
3. **Forecasting Accuracy**:
   - Additive Holt-Winters Exponential Smoothing predicts upcoming winter wedding bookings with seasonal adjustment factors, outperforming simple moving averages by accounting for peak-season multipliers.
