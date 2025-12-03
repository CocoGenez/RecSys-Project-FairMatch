import pandas as pd
import numpy as np
import re
from pathlib import Path
from dotenv import load_dotenv
import kagglehub
from kagglehub import KaggleDatasetAdapter
from google import genai
import time

request_count = 0
REQUEST_LIMIT = 15
RESET_INTERVAL = 60  # seconds

# -------------------------
# Utils
# -------------------------
def clean_text(x):
    if pd.isna(x):
        return ""
    x = str(x)
    x = x.replace("\n", " ").replace("\r", " ")
    x = re.sub(r"[^\x00-\x7F]+", " ", x)  # remove weird chars
    x = " ".join(x.split())              # remove multi spaces
    return x

def extract_min_experience(exp_str):
    """Extract minimum years from 'X to Z Years' format."""
    if pd.isna(exp_str):
        return None
    try:
        exp_str = str(exp_str).strip()
        # parse "X to Z Years"
        parts = exp_str.split(" to ")
        if len(parts) >= 1:
            min_years = int(parts[0].strip())
            return min_years
    except Exception:
        pass
    return None

def _rewrite_description_gemini(description, job_title, company=None, benefits=None, responsibilities=None, company_profile=None):
    """Use Gemini API to rewrite a job description using full context."""
    global request_count, last_reset_time
    try:
        # Use your specific API Key here
        api_key = "AIzaSyA9QZnBmVbU2N4oa055xMXbG32rn5WK1i4" 
        
        if not api_key:
            return description

        # Rate limiting logic
        current_time = time.time()
        if current_time - last_reset_time >= RESET_INTERVAL:
            request_count = 0
            last_reset_time = current_time
        
        if request_count >= REQUEST_LIMIT:
            wait_time = RESET_INTERVAL - (current_time - last_reset_time) + 5
            print(f"[Rate Limit] Reached 15 requests. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
            request_count = 0
            last_reset_time = time.time()
        
        # Build a context string from available data
        context_details = ""
        if company and str(company).lower() != "nan":
            context_details += f"Company Name: {company}\n"
        if company_profile and str(company_profile).lower() != "nan":
            context_details += f"About the Company: {company_profile}\n"
        if responsibilities and str(responsibilities).lower() != "nan":
            context_details += f"Key Responsibilities: {responsibilities}\n"
        if benefits and str(benefits).lower() != "nan":
            context_details += f"Key Benefits: {benefits}\n"

        # Construct the Prompt
        client = genai.Client(api_key=api_key)
        prompt = (
            f"Act as a professional recruiter. Write a cohesive, concise job description (2-3 sentences) "
            f"for a {job_title} role.\n\n"
            f"Synthesize the following details into the description:\n"
            f"{context_details}\n"
            f"Original Draft: {description}\n\n"
            f"IMPORTANT: Output ONLY the raw paragraph text. Do not output 'Here is the description' or quotes."
        )
        
        response = client.models.generate_content(model="gemini-2.5-flash-lite", contents=prompt)
        request_count += 1
        print(f"[Gemini] Request {request_count}/15 - {job_title}")
        
        result = response.text.strip() if response else description
        return result.strip('"').strip("'")
        
    except Exception as e:
        print(f"Gemini rewrite failed: {e}")
        return description

def _perturb_skills(skills_str, drop_prob=0.2, add_variance=True):
    """Randomly drop or shuffle skills for diversity.
    Skills end with lowercase/paren and start with capital letter (after space).
    """
    if pd.isna(skills_str) or not skills_str:
        return skills_str
    skills_str = str(skills_str).strip()
    import re
    # Split on: (lowercase or closing paren) + space + (capital letter)
    # Don't split if inside parentheses
    skills = []
    current_skill = ""
    paren_depth = 0
    for i, char in enumerate(skills_str):
        if char == '(':
            paren_depth += 1
            current_skill += char
        elif char == ')':
            paren_depth -= 1
            current_skill += char
        elif (char == ' ' and paren_depth == 0 and 
              i > 0 and (skills_str[i-1].islower() or skills_str[i-1] == ')') and
              i + 1 < len(skills_str) and skills_str[i + 1].isupper()):
            # Split boundary found
            if current_skill.strip():
                skills.append(current_skill.strip())
            current_skill = ""
        else:
            current_skill += char
    # Add last skill
    if current_skill.strip():
        skills.append(current_skill.strip())
    # randomly drop some skills
    skills = [s for s in skills if np.random.random() > drop_prob]
    # optionally shuffle order
    if add_variance and len(skills) > 1:
        np.random.shuffle(skills)
    return " ".join(skills) if skills else skills_str

# -------------------------
# Paths
# -------------------------
# Load .env from backend folder
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Verify API key is loaded
# api_key = os.getenv("GOOGLE_API_KEY")
api_key = "AIzaSyCPmvAz2qUYxrz3hmYLLdw_4GHe5t-fJn4"
if not api_key:
    print("WARNING: GOOGLE_API_KEY not found in .env")
else:
    print(f"✓ GOOGLE_API_KEY loaded.")

project_root = Path(__file__).parent
data_dir = project_root / "data"

students_path = "cs_students.csv"
jobs_path = "job_descriptions.csv"

out_students_path = project_root / "students.parquet"
out_jobs_path = project_root / "jobs.parquet"


# -------------------------
# Load datasets
# -------------------------
students_raw = kagglehub.dataset_load(
  KaggleDatasetAdapter.PANDAS,
  "devildyno/computer-science-students-career-prediction",
  students_path
)

print("Downloading jobs dataset...")
# 1. Download the raw files (returns a folder path)
jobs_folder = kagglehub.dataset_download("ravindrasinghrana/job-description-dataset")

# 2. Construct path to the actual CSV file
# The file inside the zip is usually named 'job_descriptions.csv'
csv_file_path = Path(jobs_folder) / "job_descriptions.csv"

print(f"Reading CSV from: {csv_file_path}")

# 3. Read manually with robust settings
jobs_raw = pd.read_csv(
    csv_file_path,
    encoding="utf-8",       # Try utf-8 first for clean CSVs
    on_bad_lines="skip",    # Skip corrupted lines
    engine="python"         # Robust parser
)

print("Students shape:", students_raw.shape)
print("Jobs shape:", jobs_raw.shape)


# -------------------------
# CLEAN STUDENTS
# -------------------------
students = students_raw.copy()

keep_cols = [
    "Student ID",
    "Gender",
    "Age",
    "GPA",
    "Major",
    "Interested Domain",
    "Projects",
    "Python",
    "SQL",
    "Java"
]

students = students[keep_cols].copy()

students.columns = [
    "StudentId",
    "Gender",
    "Age",
    "Gpa",
    "Major",
    "InterestedDomain",
    "Projects",
    "PythonSkill",
    "SqlSkill",
    "JavaSkill"
]

students["Gender"] = (
    students["Gender"]
    .astype(str)
    .str.strip()
    .str.lower()
    .map({"male": "M", "female": "F"})
    .fillna("Other")
)

def build_profile(row):
    return (
        f"gender {row.Gender}, age {row.Age}, "
        f"major {row.Major}, interested domain {row.InterestedDomain}, "
        f"projects {row.Projects}, "
        f"skills python {row.PythonSkill}, sql {row.SqlSkill}, java {row.JavaSkill}."
    )

students["ProfileText"] = students.apply(build_profile, axis=1).apply(clean_text)

students["UserId"] = range(len(students))
students = students.set_index("UserId")

print("\nClean students preview:")
print(students.head(3))

students.to_parquet(out_students_path)
print(f"Saved students -> {out_students_path}")


# -------------------------
# CLEAN JOBS
# -------------------------
jobs = jobs_raw.copy()

# normalize column names: lowercase + strip spaces
jobs.columns = jobs.columns.str.lower().str.strip()

print("\nJobs columns:", jobs.columns.tolist())

# text columns that exist in YOUR dataset
text_cols = [
    "job description",
    "benefits",
    "skills",
    "responsibilities",
    "company profile",
    "job title",
    "role"
]

for col in text_cols:
    if col in jobs.columns:
        jobs[col] = jobs[col].apply(clean_text)

# FILTER BY EXPERIENCE: keep only 0-2 years minimum
if "experience" in jobs.columns:
    jobs["min_experience"] = jobs["experience"].apply(extract_min_experience)
    print(f"\nBefore experience filter: {len(jobs)} jobs")
    print(f"Experience distribution:\n{jobs['min_experience'].value_counts().sort_index()}")
    
    # keep only 0, 1, 2 years minimum experience
    jobs = jobs[jobs["min_experience"].isin([0, 1, 2])].copy()
    print(f"After experience filter (0-2 years): {len(jobs)} jobs")
    jobs = jobs.drop(columns=["min_experience"])
else:
    print("Warning: 'experience' column not found in jobs dataset")

# FILTER BY JOB TITLE: keep only CS-related roles
cs_job_titles = {
    "UX/UI Designer",
    "Software Engineer",
    "Data Analyst",
    "Java Developer",
    "UX Researcher",
    "Network Security Specialist",
    "Data Engineer",
    "Front-End Developer",
    "Web Developer",
    "Database Administrator",
    "Software Developer",
    "Data Scientist",
    "Back-End Developer"
}

if "job title" in jobs.columns:
    print(f"\nBefore job title filter: {len(jobs)} jobs")
    print(f"Unique job titles: {jobs['job title'].nunique()}")
    
    # keep only if job title is in the CS set (case-insensitive match)
    jobs = jobs[jobs["job title"].str.strip().isin(cs_job_titles)].copy()
    print(f"After job title filter (CS-related only): {len(jobs)} jobs")
else:
    print("Warning: 'job title' column not found in jobs dataset")

# DIVERSIFY JOBS: dedup + Gemini rewrites + skill perturbation (keep 50 per group)

print(f"\nBefore dedup: {len(jobs)} jobs")
print(f"Unique job titles: {jobs['job title'].nunique()}")

# Keep up to 50 samples per content group
# Apply Gemini rewrites + skill perturbation to 2nd+ copies
jobs_deduplicated = []
last_reset_time = time.time()
for job_title, group in jobs.groupby("job title"):
    group = group.reset_index(drop=True)
    # keep up to 50 samples from this group
    keep_count = min(50, len(group))
    for idx in range(keep_count):
        row = group.iloc[idx].copy()
        if idx == 0:
            # keep first copy as-is
            jobs_deduplicated.append(row)
        else:
            if "job description" in row:
                c_val = row["company"] if "company" in row else ""
                b_val = row["benefits"] if "benefits" in row else ""
                r_val = row["responsibilities"] if "responsibilities" in row else ""
                cp_val = row["company profile"] if "company profile" in row else ""

                row["job description"] = _rewrite_description_gemini(
                    description=row["job description"],
                    job_title=row.get("job title", "Position"),
                    company=c_val,
                    benefits=b_val,
                    responsibilities=r_val,
                    company_profile=cp_val
                )
            if "skills" in row:
                row["skills"] = _perturb_skills(row["skills"], drop_prob=0.15)
            jobs_deduplicated.append(row)

jobs = pd.DataFrame(jobs_deduplicated).reset_index(drop=True)
jobs = jobs.drop(columns=["content_hash"], errors='ignore')

print(f"After dedup & rewrite (50 per group): {len(jobs)} jobs")

# company bucket (fairness on company side)
jobs["companybucket"] = np.random.choice(
    ["small", "mid", "large"],
    size=len(jobs),
    p=[0.4, 0.4, 0.2]
)

# create continuous job id
jobs["jobid"] = range(len(jobs))
jobs = jobs.set_index("jobid")

print("\nClean jobs preview:")
print(jobs.head(3))

jobs.to_parquet(out_jobs_path)
print(f"Saved jobs -> {out_jobs_path}")


# -------------------------
# PREVIEW: Print first 10 jobs
# -------------------------
print("\n" + "="*80)
print("FIRST 10 JOBS PREVIEW")
print("="*80)

cols_to_show = ["job title", "skills", "job description", "company", "experience"]
# filter to columns that exist
cols_to_show = [c for c in cols_to_show if c in jobs.columns]

for idx, (job_id, row) in enumerate(jobs.head(10).iterrows()):
    print(f"\n--- Job {idx + 1} (ID: {job_id}) ---")
    for col in cols_to_show:
        val = row[col] if col in row else "N/A"
        # truncate long text for readability
        if isinstance(val, str) and len(val) > 200:
            val = val[:200] + "..."
        print(f"{col.upper()}: {val}")