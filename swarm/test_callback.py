from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from crewai.tools import tool
from dotenv import load_dotenv
import os

load_dotenv()

def my_step_callback(step_output):
    print(f"!!! STEP CALLBACK FIRED !!!")
    print(f"Type: {type(step_output)}")
    print(f"Content: {step_output}")
    try:
        from crewai.agents.parser import AgentAction, AgentFinish
        if isinstance(step_output, AgentAction):
            print(f"Action Thought: {step_output.thought}")
            print(f"Action Tool: {step_output.tool}")
            print(f"Action Tool Input: {step_output.tool_input}")
        elif isinstance(step_output, AgentFinish):
            print(f"Finish output: {step_output.output}")
            print(f"Finish thought: {step_output.thought}")
    except Exception as e:
        pass

@tool("Multiplier")
def multiply_tool(x: int, y: int) -> int:
    """Multiplies two numbers."""
    return x * y

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    verbose=True, 
    google_api_key=os.getenv("GEMINI_API_KEY")
)

agent = Agent(
    role="Calculator",
    goal="Calculate math equations by using the tool.",
    backstory="You are a math genius. You always think step by step before providing the final answer.",
    allow_delegation=False,
    verbose=True,
    llm=llm,
    tools=[multiply_tool],
    step_callback=my_step_callback
)

task = Task(
    description="What is 15 * 25?",
    expected_output="A number",
    agent=agent
)

crew = Crew(
    agents=[agent],
    tasks=[task],
    process=Process.sequential,
    step_callback=my_step_callback
)

print("Starting crew kickoff...")
result = crew.kickoff()
print("Result:", result)
