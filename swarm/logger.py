import queue
import time
from datetime import datetime

# Global message queue to hold logs
# Using a queue allows the background CrewAI thread to safely pass messages 
# to the main Flask thread handling the SSE stream.
log_queue = queue.Queue()

def clear_logs():
    """Empty the queue before a new run."""
    with log_queue.mutex:
        log_queue.queue.clear()

def swarm_step_callback(agent_output):
    """
    CrewAI triggers this callback after every Agent step.
    agent_output contains the AgentAction or AgentFinish object.
    We extract the thought process and push it to theSSE stream queue.
    """
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    print(f"DEBUG: agent_output type: {type(agent_output)}", flush=True)
    print(f"DEBUG: agent_output dir: {dir(agent_output)}", flush=True)
    try:
        if isinstance(agent_output, list) and len(agent_output) > 0:
            print(f"DEBUG: list item 0 type: {type(agent_output[0])}", flush=True)
            print(f"DEBUG: list item 0 dir: {dir(agent_output[0])}", flush=True)
    except Exception as e:
        print(f"DEBUG: error inspecting agent_output: {e}", flush=True)

    # Extract the Agent's name if available, fallback to "Agent"
    agent_name = "Agent"
    if hasattr(agent_output, 'agent'):
        agent_name = agent_output.agent
        
    # Extract the actual thought or action
    log_text = str(agent_output)
    if hasattr(agent_output, 'log'):
        log_text = agent_output.log
    elif hasattr(agent_output, 'tool'):
        log_text = f"Using tool: {agent_output.tool}"
    elif hasattr(agent_output, 'output'):
        log_text = "Task completed."
        
    # Clean up formatting for UI display
    clean_text = log_text.strip().replace("\n", " ")
    if len(clean_text) > 150:
        clean_text = clean_text[:147] + "..."
        
    formatted_message = f"[{timestamp}] [{agent_name}] {clean_text}"
    print(f"📡 {formatted_message}") # Print to console for server debugging
    
    # Push to queue for the SSE stream
    log_queue.put(formatted_message)
