import subprocess
from crewai import Agent, Task, Crew, Process
from langchain_ollama import ChatOllama

def get_wsl_host_ip():
    try:
        result = subprocess.run(["ip", "route"], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if "default" in line:
                return line.split()[2]
    except Exception:
        pass
    return "localhost"

host_ip = get_wsl_host_ip()
my_llm = ChatOllama(model="hermes3:latest", base_url=f"http://{host_ip}:11434")

agent = Agent(role="Tester", goal="Say hi", backstory="You say hi.", llm=my_llm)
task = Task(description="Say Hello", expected_output="A greeting", agent=agent)
crew = Crew(agents=[agent], tasks=[task], process=Process.sequential)
print(crew.kickoff())
