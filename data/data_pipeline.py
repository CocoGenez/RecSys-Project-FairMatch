import pandas as pd
import numpy as np
import re
from pathlib import Path


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


def bucket_age(a):
    a = str(a)
    try:
        a_num = float(a)
        return "under35" if a_num < 35 else "35plus"
    except:
        if "<35" in a:
            return "under35"
        if ">35" in a:
            return "35plus"
        return "unknown"


# -------------------------
# Paths
# -------------------------
project_root = Path(__file__).parent
data_dir = project_root / "data"

students_path = data_dir / "cs_students.csv"
jobs_path = data_dir / "job_descriptions.csv"

out_students_path = project_root / "students.parquet"
out_jobs_path = project_root / "jobs.parquet"


# -------------------------
# Load datasets
# -------------------------
students_raw = pd.read_csv(students_path)
jobs_raw = pd.read_csv(jobs_path)

print("Students shape:", students_raw.shape)
print("Jobs shape:", jobs_raw.shape)
print(students_raw.head(2))
print(jobs_raw.head(2))


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

students["AgeBucket"] = students["Age"].apply(bucket_age)

def build_profile(row):
    return (
        f"gender {row.Gender}, age {row.AgeBucket}, "
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
