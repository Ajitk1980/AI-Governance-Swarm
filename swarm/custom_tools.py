import requests
from bs4 import BeautifulSoup
from crewai.tools import tool
from duckduckgo_search import DDGS

@tool("Scrape Website")
def scrape_website(url: str) -> str:
    """
    Scrapes the text content of a given URL. Useful for reading documentation, 
    privacy policies, or security whitepapers hosted online.
    """
    try:
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script, style, and navigation elements to slim down the text
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()
            
        text = soup.get_text()
        
        # Break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Return first 8000 characters to prevent context window overflow
        return text[:8000]
    except Exception as e:
        return f"Error scraping {url}: {str(e)}"

@tool("Web Search")
def search_web(query: str) -> str:
    """
    Searches the internet for information, news, customer reviews, or red flags 
    about a specific tool or topic. Use this to find external context.
    """
    try:
        results = []
        with DDGS() as ddgs:
            # Fetch top 5 results
            for r in ddgs.text(query, max_results=5):
                results.append(f"Title: {r['title']}\nSnippet: {r['body']}\nURL: {r['href']}\n")
                
        if not results:
            return f"No results found for query: {query}"
            
        return "\n".join(results)
    except Exception as e:
        return f"Error searching for '{query}': {str(e)}"
