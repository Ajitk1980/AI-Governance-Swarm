import os
import yaml
from crewai import Task

yaml_path = os.path.join(os.path.dirname(__file__), '..', 'prompts.yaml')
with open(yaml_path, 'r') as file:
    PROMPTS = yaml.safe_load(file)

def create_security_task(agent, url):
    return Task(
        description=PROMPTS['tasks']['security']['description'].format(url=url),
        expected_output=PROMPTS['tasks']['security']['expected_output'],
        agent=agent
    )

def create_privacy_task(agent, url):
    return Task(
        description=PROMPTS['tasks']['privacy']['description'].format(url=url),
        expected_output=PROMPTS['tasks']['privacy']['expected_output'],
        agent=agent
    )

def create_utility_task(agent, url):
    return Task(
        description=PROMPTS['tasks']['utility']['description'].format(url=url),
        expected_output=PROMPTS['tasks']['utility']['expected_output'],
        agent=agent
    )
