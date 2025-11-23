from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Literal
import os
import json
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

# 2. Get API Key
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found. Please check your .env file.")

# 3. Initialize the Client GLOBALLY (This was likely missing or out of scope)
client = genai.Client(api_key=api_key)

# 4. Define the Schema
class ResumeSchema(BaseModel):
    Age: int = Field(..., description="Estimated age of the candidate. Default to 22 if unknown.")
    Projects: List[str] = Field(..., description="List of key technical projects mentioned.")
    Future_Career: Literal[
        "Machine Learning Researcher", 
        "Data Scientist", 
        "Software Engineer", 
        "Web Developer", 
        "Information Security Analyst", 
        "Database Administrator", 
        "Game Developer", 
        "AI Engineer", 
        "Network Security Engineer"
    ] = Field(..., description="The specific career path that best matches the candidate's profile.")
    Python_Level: Literal["Strong", "Average", "Weak"]
    SQL_Level: Literal["Strong", "Average", "Weak"]
    Java_Level: Literal["Strong", "Average", "Weak"]

# 5. The Parsing Function
def parse_resume_with_gemini(resume_text: str, interested_domain: str):
    """
    Parses resume text using the new google-genai SDK.
    """
    
    prompt = f"""
    Analyze the following Resume text and extract structured data for a Career Prediction Model.
    
    CONTEXT:
    - Candidate Interested Domain: "{interested_domain}"
    
    INSTRUCTIONS:
    - Map "Future_Career" to the closest valid option from the allowed list.
    - Rate skills (Python, SQL, Java) as Strong/Average/Weak based on evidence (years of exp, complex projects).
    - If a skill is not mentioned, mark it as "Weak".
    
    RESUME TEXT:
    {resume_text}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", 
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResumeSchema, 
            ),
        )
        
        # Parse and return JSON
        # Depending on the SDK version, response.text might already be a dict if schema is strict,
        # but json.loads is the safest way to ensure valid Python dict.
        return json.loads(response.text)

    except Exception as e:
        # This will print the specific error if something else goes wrong
        print(f"Gemini Parsing Error: {e}")
        return None