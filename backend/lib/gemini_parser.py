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
    # Informations personnelles
    name: str = Field(default="", description="Prénom du candidat si mentionné dans le CV")
    surname: str = Field(default="", description="Nom de famille du candidat si mentionné dans le CV")
    Email: str = Field(default="", description="Adresse email du candidat si mentionnée")
    phone: str = Field(default="", description="Numéro de téléphone si mentionné")
    Address: str = Field(default="", description="Adresse si mentionnée")
    
    # Informations de base
    Age: int = Field(..., description="Estimated age of the candidate. Default to 22 if unknown.")
    description: str = Field(default="", description="Description/résumé professionnel du candidat")
    
    # Projets et carrière
    Projects: List[str] = Field(default_factory=list, description="List of key technical projects mentioned.")
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
    
    # Compétences techniques
    Hard_Skills: List[str] = Field(default_factory=list, description="Liste des compétences techniques (ex: ['Python', 'SQL', 'Docker', 'AWS']) séparées par /")
    Python_Level: Literal["Strong", "Average", "Weak"] = Field(default="Weak")
    SQL_Level: Literal["Strong", "Average", "Weak"] = Field(default="Weak")
    Java_Level: Literal["Strong", "Average", "Weak"] = Field(default="Weak")
    
    # Compétences comportementales
    Soft_Skills: List[str] = Field(default_factory=list, description="Liste des compétences comportementales (ex: ['Leadership', 'Communication']) séparées par /")
    
    # Langues
    Languages: List[str] = Field(default_factory=list, description="Liste des langues avec niveau (ex: ['Français: Natif', 'Anglais: B2']) séparées par /")
    
    # Formation et expérience
    Education: List[str] = Field(default_factory=list, description="Liste des formations/études séparées par /")
    Work_Experience: List[str] = Field(default_factory=list, description="Liste des expériences professionnelles séparées par /")
    
    # Certifications et intérêts
    Certifications: List[str] = Field(default_factory=list, description="Liste des certifications séparées par /")
    Interests: List[str] = Field(default_factory=list, description="Liste des hobbies et centres d'intérêt séparés par /")

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
    - Extract all available information: name, surname, email, phone, address, description, languages, hard skills, soft skills, education, work experience, certifications, interests.
    - For lists (Languages, Hard_Skills, Soft_Skills, Education, Work_Experience, Certifications, Interests), separate items with "/" if multiple items are found.
    - For Languages, include proficiency level (e.g., "Français: Natif", "Anglais: B2").
    - Return empty strings or empty lists for fields not found in the resume.
    
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