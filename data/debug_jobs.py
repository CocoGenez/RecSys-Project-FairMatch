import pandas as pd

jobs = pd.read_parquet("jobs_sample.parquet")
print(jobs["skills"].head(20))
print(jobs["skills"].nunique())
print(jobs["skills"].value_counts().head(10))
