from fastmcp import FastMCP
import random

# Initialize FastMCP server
mcp = FastMCP("Weather-Service")

@mcp.tool()
async def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    weathers = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy"]
    return f"The weather in {city} is {random.choice(weathers)} with a temperature of {random.randint(10, 35)}°C."

@mcp.tool()
async def calculate_sum(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

@mcp.resource("config://app")
def get_config() -> str:
    """Get the application configuration."""
    return "API_KEY=12345\nDEBUG=True"

if __name__ == "__main__":
    mcp.run()
