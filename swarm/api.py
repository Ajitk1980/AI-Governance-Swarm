from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from main import run_swarm
import logger

app = Flask(__name__)
# Enable CORS for the React app port so EventSource connects directly
CORS(app, resources={r"/stream": {"origins": "http://localhost:5174"}})

@app.route('/stream', methods=['GET'])
def stream_logs():
    """Server-Sent Events endpoint connected directly to the React dashboard."""
    def generate():
        while True:
            # Block until a new log message is dropped into the queue by CrewAI
            message = logger.log_queue.get()
            if message == "DONE_SIGNAL":
                break
            # Format required by SSE
            yield f"data: {message}\n\n"
    return Response(generate(), mimetype='text/event-stream')

@app.route('/run', methods=['POST'])
def run_agent():
    data = request.json
    url = data.get('url')
    optimize = data.get('optimize', 'cost') # defaults to cost (ollama)
    assessments = data.get('assessments', ['security', 'privacy', 'utility']) # defaults to all
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400
        
    try:
        # Clear any stale logs from previous runs
        logger.clear_logs()
        
        # Run the actual CrewAI swarm with the requested optimization preference and selected agents
        result = run_swarm(url, optimize, assessments)
        
        # Signal the SSE endpoint to close the connection now that it's over
        logger.log_queue.put("DONE_SIGNAL")
        
        return jsonify({"success": True, "report": str(result.raw if hasattr(result, 'raw') else result)})
    except Exception as e:
        logger.log_queue.put("DONE_SIGNAL")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
