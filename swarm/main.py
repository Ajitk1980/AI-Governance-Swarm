import os
import sys
from dotenv import load_dotenv
from crewai import Crew, Process
from agents.risk_agents import create_security_analyst, create_privacy_reviewer, create_utility_evaluator
from tasks.risk_tasks import create_security_task, create_privacy_task, create_utility_task
from logger import swarm_step_callback

# Load environment variables
load_dotenv()

def run_swarm(url: str, optimize: str = "cost", assessments: list = None):
    """
    Main entry point for the Automated AI Governance & Risk Assessor.
    This function will be triggered by n8n.
    """
    if assessments is None:
        assessments = ["security", "privacy", "utility"]

    print(f"🚀 Starting Governance Swarm Analysis for URL: {url} | Optimize: {optimize} | Assessments: {assessments}")
    
    agents = []
    tasks = []

    # Dynamically build the Crew based on user selection
    if "security" in assessments:
        print("[+] Adding Security Analyst to the Swarm")
        agent = create_security_analyst(optimize)
        agents.append(agent)
        tasks.append(create_security_task(agent, url))
        
    if "privacy" in assessments:
        print("[+] Adding Privacy Reviewer to the Swarm")
        agent = create_privacy_reviewer(optimize)
        agents.append(agent)
        tasks.append(create_privacy_task(agent, url))
        
    if "utility" in assessments:
        print("[+] Adding Utility Evaluator to the Swarm")
        agent = create_utility_evaluator(optimize)
        agents.append(agent)
        tasks.append(create_utility_task(agent, url))

    if not agents:
        return "❌ Error: No assessments were selected to run."

    # Form the Crew
    crew = Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
        step_callback=swarm_step_callback
    )
    
    print("\n[Swarm Execution Started]")
    try:
        # The agents will use default reasoning to analyze the url. 
        # In a fully fleshed out version they would use a Scraping tool.
        result = crew.kickoff()
        print("\n✅ Analysis Complete. Result:")
        print(result)
        return result
    except Exception as e:
        error_msg = f"❌ Error during swarm execution: {e}"
        print(error_msg)
        return error_msg

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
        optimize_mode = sys.argv[2] if len(sys.argv) > 2 else "cost"
        run_swarm(target_url, optimize_mode)
    else:
        print("Usage: python main.py <target_url>")
