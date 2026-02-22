import os
import subprocess
import yaml
from crewai import Agent, LLM
from langchain_google_genai import ChatGoogleGenerativeAI
from logger import swarm_step_callback
from custom_tools import scrape_website, search_web

yaml_path = os.path.join(os.path.dirname(__file__), '..', 'prompts.yaml')
with open(yaml_path, 'r') as file:
    PROMPTS = yaml.safe_load(file)

def get_wsl_host_ip():
    try:
        result = subprocess.run(["ip", "route"], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if "default" in line:
                return line.split()[2]
    except Exception:
        pass
    return "localhost"

def get_ollama_llm():
    host_ip = get_wsl_host_ip()
    return LLM(
        model="ollama/hermes3:latest",
        base_url=f"http://{host_ip}:11434"
    )

def get_gemini_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        verbose=True, 
        temperature=0.5, 
        google_api_key=os.getenv("GEMINI_API_KEY")
    )

def get_llm(optimize: str):
    if optimize == "speed":
        return get_gemini_llm()
    return get_ollama_llm()

def create_security_analyst(optimize: str = "cost"):
    return Agent(
        role=PROMPTS['agents']['security']['role'],
        goal=PROMPTS['agents']['security']['goal'],
        backstory=PROMPTS['agents']['security']['backstory'],
        verbose=True,
        allow_delegation=False,
        llm=get_llm(optimize),
        step_callback=swarm_step_callback,
        tools=[scrape_website, search_web]
    )

def create_privacy_reviewer(optimize: str = "cost"):
    return Agent(
        role=PROMPTS['agents']['privacy']['role'],
        goal=PROMPTS['agents']['privacy']['goal'],
        backstory=PROMPTS['agents']['privacy']['backstory'],
        verbose=True,
        allow_delegation=False,
        llm=get_llm(optimize),
        step_callback=swarm_step_callback,
        tools=[scrape_website, search_web]
    )

def create_utility_evaluator(optimize: str = "cost"):
    return Agent(
        role=PROMPTS['agents']['utility']['role'],
        goal=PROMPTS['agents']['utility']['goal'],
        backstory=PROMPTS['agents']['utility']['backstory'],
        verbose=True,
        allow_delegation=False,
        llm=get_llm(optimize),
        step_callback=swarm_step_callback,
        tools=[scrape_website, search_web]
    )
