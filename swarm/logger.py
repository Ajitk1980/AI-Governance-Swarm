import queue
import time
from datetime import datetime
import logging
import traceback
import os

# Setup persistent file logging for backend debugging
log_file_path = os.path.join(os.path.dirname(__file__), 'execution.log')
logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
backend_logger = logging.getLogger("SwarmBackend")

# Global message queue to hold logs
# Using a queue allows the background CrewAI thread to safely pass messages 
# to the main Flask thread handling the SSE stream.
log_queue = queue.Queue()
introduced_agents = set()

def clear_logs():
    """Empty the queue before a new run."""
    with log_queue.mutex:
        log_queue.queue.clear()
    introduced_agents.clear()
    backend_logger.info("--- New Swarm Run Started ---")
    
def log_error(e, context=""):
    """Log full tracebacks to the execution.log file"""
    error_msg = f"Error in {context}: {str(e)}\n{traceback.format_exc()}"
    backend_logger.error(error_msg)
    print(error_msg)
    introduced_agents.clear()

def swarm_step_callback(agent_output):
    """
    CrewAI triggers this callback after every Agent step.
    agent_output contains the AgentAction or AgentFinish object.
    We extract the thought process and push it to theSSE stream queue.
    """
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    # Extract the Agent's name if available, fallback to "Agent"
    agent_name = "Agent"
    if hasattr(agent_output, 'agent'):
        agent_name = agent_output.agent
        
    # Introduce the agent if it's their first action
    if agent_name not in introduced_agents:
        intro_msg = f"[{timestamp}] [{agent_name}] 👋 Hello! I am the {agent_name}. I am now starting my analysis..."
        print(f"📡 {intro_msg}")
        log_queue.put(intro_msg)
        introduced_agents.add(agent_name)
        
    # Extract the actual thought or action
    log_text = ""
    
    if hasattr(agent_output, 'thought') and agent_output.thought:
        log_text = agent_output.thought
    elif hasattr(agent_output, 'log') and agent_output.log:
        log_text = agent_output.log
    elif hasattr(agent_output, 'text') and agent_output.text:
        log_text = agent_output.text
        
    if hasattr(agent_output, 'tool') and agent_output.tool:
        log_text += f"\nUsing tool: {agent_output.tool}"
        
    if not log_text and hasattr(agent_output, 'output') and agent_output.output:
        log_text = "Task completed."
        
    if not log_text:
        log_text = str(agent_output)
        
    # Clean up formatting for UI display
    clean_text = log_text.strip().replace("\n", " ")
    if len(clean_text) > 150:
        clean_text = clean_text[:147] + "..."
        
    formatted_message = f"[{timestamp}] [{agent_name}] {clean_text}"
    print(f"📡 {formatted_message}") # Print to console for server debugging
    backend_logger.info(formatted_message)
    
    # Push to queue for the SSE stream
    log_queue.put(formatted_message)
