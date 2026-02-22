from flask import Flask, jsonify, request
from flask_cors import CORS # Need to install frontend flask-cors

app = Flask(__name__)
# Allow CORS for localhost:5174
CORS(app)

@app.route('/webhook/ai-risk-assessment', methods=['POST', 'OPTIONS'])
def analyze():
    return jsonify({"report": "# Mock Analysis passed straight from n8n\n- Security: Good\n- Privacy: Good"})

@app.route('/webhook/save-risk-assessment', methods=['POST', 'OPTIONS'])
def save():
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(port=5679)
