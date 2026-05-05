from flask import Flask, jsonify, request, send_from_directory
import pandas as pd
import os
import sys

# Add parent directory to path to import model
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from model.predictor import predict_future_spending, get_spending_insights

app = Flask(__name__, static_folder='../frontend', static_url_path='')

DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/expenses.csv'))

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    if not os.path.exists(DATA_FILE):
        return jsonify([])
    df = pd.read_csv(DATA_FILE)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.json
    new_expense = pd.DataFrame([data])
    
    if os.path.exists(DATA_FILE):
        df = pd.read_csv(DATA_FILE)
        df = pd.concat([df, new_expense], ignore_index=True)
    else:
        df = new_expense
        
    df.to_csv(DATA_FILE, index=False)
    return jsonify({"status": "success", "message": "Expense added successfully"})

@app.route('/api/insights', methods=['GET'])
def get_insights():
    insights = get_spending_insights(DATA_FILE)
    return jsonify(insights)

@app.route('/api/predict', methods=['GET'])
def get_predictions():
    predictions = predict_future_spending(DATA_FILE)
    return jsonify(predictions)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
