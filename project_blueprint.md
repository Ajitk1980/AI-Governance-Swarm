# The Automated AI Governance & Risk Assessor - Project Blueprint

Welcome to the project! Since you're new to development, this blueprint will break down how we organize the code, why we do it this way, and the step-by-step setup process.

## 1. Project Organization (The "Folder Structure")

A clean folder structure is like keeping your kitchen organized: you want your ingredients (code) in predictable places so you don't make a mess when cooking (building the app). Here is the structure we will build:

```text
ai-governance-swarm/                  # The root project folder (we are here)
│
├── dashboard/                        # 1. THE FRONTEND (React + Tailwind)
│   ├── public/                       # Static files like images and icons
│   ├── src/                          # Where your React code lives
│   │   ├── components/               # Reusable UI parts (e.g., buttons, forms)
│   │   ├── App.jsx                   # The main screen of your app
│   │   └── index.css                 # Tailwind CSS styles
│   └── package.json                  # Lists the Javascript packages your dashboard needs
│
├── swarm/                            # 2. THE BACKEND BRAIN (Python + CrewAI)
│   ├── agents/                       # Definitions for your AI agents (e.g., "Risk Assessor")
│   ├── tasks/                        # Specific jobs the agents perform
│   ├── tools/                        # Tools agents use (e.g., web scrapers)
│   ├── main.py                       # The entry point to run your CrewAI swarm
│   └── requirements.txt              # Lists the Python packages your swarm needs
│
├── n8n-workflows/                    # 3. THE TRAFFIC COP (n8n)
│   └── webhook_to_sheets.json        # Exported n8n workflows for safekeeping
│
├── .gitignore                        # Tells Git which files to ignore (like passwords)
└── README.md                         # A general guide to your project
```

### Why this structure?
- **Separation of Concerns:** We keep the React dashboard (JavaScript) separate from the CrewAI swarm (Python). This way, if you break the dashboard, the AI agents still work, and vice versa. It makes learning and debugging much easier.
- **Easy Deployment:** Later on, you might host the dashboard on one platform and the Python code on another. Keeping them in separate folders makes this easy.

---

## 2. Step-by-Step Setup Guide

Here is exactly how we will set this up. We will take it one piece at a time so it doesn't get overwhelming.

### Phase 1: Set up the Project Home & Version Control
Before writing code, we need a place to store it and track changes.
1. **Create the main folder:** We will use the terminal to create the `ai-governance-swarm` folder (already done!).
2. **Initialize Git:** Git is a "save game" system for code. We will turn this folder into a Git repository so you can always undo mistakes.

### Phase 2: Build the Frontend (Dashboard)
We will use Vite, a tool that quickly creates modern React projects.
1. **Create React App:** We will run a command to generate the `dashboard` folder with React.
2. **Install Tailwind CSS:** We will add Tailwind, which lets us style the app quickly using pre-made utility classes (like `text-center` or `bg-blue-500`) instead of writing complex CSS files.
3. **Run the Dashboard:** We will start a local server to see your blank dashboard in the browser to confirm it works.

### Phase 3: Build the Backend Swarm (CrewAI)
Python uses "virtual environments" to keep its packages isolated. Think of it like a sandbox so your project's dependencies don't mess up your computer's system Python.
1. **Create the Environment:** We will create a virtual environment inside the `swarm` folder.
2. **Install Packages:** We will install `crewai`, `langchain`, and other necessary AI libraries.
3. **Write the Agents:** We will create the Python scripts that define your AI agents and their roles (e.g., Security Analyst, Privacy Reviewer, Utility Evaluator).

### Phase 4: Configure the Traffic Cop & Ledger (n8n + Google Sheets)
n8n is a visual workflow builder that connects everything together without writing a lot of glue code.
1. **Setup Google Sheets:** You will create a new Google Sheet to act as your database (Ledger).
2. **Create the n8n Workflow:**
   - **Trigger:** A "Webhook" node that waits for your React dashboard to send a URL.
   - **Action 1:** A "Google Sheets" node that logs the URL.
   - **Action 2:** An "Execute Command" node that triggers your Python CrewAI script.
3. **Connect React to n8n:** We will add a simple text input and button in React that sends the target URL to your n8n workflow.

## Summary of How It All Flows
1. **User Action:** You paste a URL into the **React Dashboard** and click "Analyze".
2. **Hand-off:** React sends that URL to an **n8n webkbook**.
3. **Logging & Triggering:** n8n saves the URL in **Google Sheets**, then tells the **CrewAI Swarm** to start running locally.
4. **The Work:** CrewAI visits the URL, reads policies, evaluates risks, and generates a structured report.
5. **The Result:** The report is sent back (via n8n or an API) to be saved in Sheets and displayed on your Dashboard.
