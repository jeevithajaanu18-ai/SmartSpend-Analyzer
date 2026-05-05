import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

def predict_future_spending(csv_path):
    try:
        df = pd.read_csv(csv_path)
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Group by date to get daily totals
        daily_spending = df.groupby('Date')['Amount'].sum().reset_index()
        
        # Convert dates to ordinal numbers for regression
        daily_spending['Date_Ordinal'] = daily_spending['Date'].map(datetime.toordinal)
        
        X = daily_spending[['Date_Ordinal']].values
        y = daily_spending['Amount'].values
        
        if len(X) < 2:
            return {"error": "Not enough data for prediction"}
            
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict for the next 7 days
        last_date = daily_spending['Date'].max()
        future_dates = [last_date + timedelta(days=i) for i in range(1, 8)]
        future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
        
        predictions = model.predict(future_ordinals)
        
        result = []
        for i in range(len(future_dates)):
            result.append({
                "date": future_dates[i].strftime('%Y-%m-%d'),
                "predicted_amount": round(float(predictions[i]), 2)
            })
            
        return result
    except Exception as e:
        return {"error": str(e)}

def get_spending_insights(csv_path):
    try:
        df = pd.read_csv(csv_path)
        
        # Category breakdown
        category_totals = df.groupby('Category')['Amount'].sum().to_dict()
        
        # Total spending
        total_spending = df['Amount'].sum()
        
        # Average daily spending
        df['Date'] = pd.to_datetime(df['Date'])
        num_days = (df['Date'].max() - df['Date'].min()).days + 1
        avg_daily = total_spending / num_days if num_days > 0 else 0
        
        # Suggestions
        suggestions = []
        if category_totals.get('Food', 0) > total_spending * 0.3:
            suggestions.append("You're spending a lot on Food. Consider meal prepping to save money.")
        if category_totals.get('Entertainment', 0) > total_spending * 0.2:
            suggestions.append("Your entertainment budget is high. Look for free local activities.")
        if category_totals.get('Shopping', 0) > total_spending * 0.25:
            suggestions.append("Shopping expenses are significant. Try the 24-hour rule before making purchases.")
            
        return {
            "category_breakdown": category_totals,
            "total_spending": round(total_spending, 2),
            "avg_daily": round(avg_daily, 2),
            "suggestions": suggestions
        }
    except Exception as e:
        return {"error": str(e)}
