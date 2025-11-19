import numpy as np
from collections import Counter

class EvaluationHarness:
    def __init__(self, k=10):
        """
        Initializes the Evaluation Harness.
        :param k: The cut-off rank for metrics (e.g., NDCG@10, Top-10 for Fairness)
        """
        self.k = k

    def calculate_ndcg(self, recommended_ids, ground_truth_ids):
        """
        Calculates Normalized Discounted Cumulative Gain (NDCG) at K.
        
        Ref: Project Description - Relevance Metric
        Used to measure the quality of the ranking.
        """
        k = self.k
        # 1. Calculate DCG (Discounted Cumulative Gain)
        # relevance is binary here: 1 if the student/job is in ground_truth, 0 otherwise
        relevance = [1 if item in ground_truth_ids else 0 for item in recommended_ids[:k]]
        
        if sum(relevance) == 0:
            return 0.0

        # DCG formula: sum(rel_i / log2(i+1)) -> we use i+2 because index starts at 0
        dcg = sum([rel / np.log2(idx + 2) for idx, rel in enumerate(relevance)])
        
        # 2. Calculate IDCG (Ideal DCG)
        # The ideal ordering has all relevant items (1s) at the very top
        ideal_relevance = sorted(relevance, reverse=True)
        idcg = sum([rel / np.log2(idx + 2) for idx, rel in enumerate(ideal_relevance)])
        
        return dcg / idcg if idcg > 0 else 0.0

    def calculate_cdp(self, recommended_ids, candidate_attributes, sensitive_attr='gender', target_group_val='Female'):
        """
        Calculates Conditional Demographic Parity (CDP) / Selection Rate.
        
        Ref: 'Mapping Stakeholder Needs' Paper - Group Fairness (Student) [cite: 91, 92]
        Goal: Ensure the proportion of the protected group in the Top-K recommendations 
              reflects their proportion in the qualified pool (or is explicitly balanced).
        
        :param recommended_ids: List of candidate IDs recommended to a recruiter.
        :param candidate_attributes: Dictionary {student_id: {'gender': 'Female', ...}}
        :param sensitive_attr: The attribute to check (e.g., 'gender', 'age').
        :param target_group_val: The value of the protected group (e.g., 'Female').
        :return: The proportion of the target group in the top-k.
        """
        top_k_ids = recommended_ids[:self.k]
        if not top_k_ids:
            return 0.0

        # Count how many in the top-k belong to the target group
        count_target = 0
        for uid in top_k_ids:
            # Safely get attribute, default to None if missing
            attr_val = candidate_attributes.get(uid, {}).get(sensitive_attr)
            if attr_val == target_group_val:
                count_target += 1
        
        # Return the ratio (e.g., 0.4 means 40% of the recs are Female)
        return count_target / len(top_k_ids)

    def calculate_coverage(self, all_recommendations, total_unique_candidates):
        """
        Calculates Coverage (Individual Fairness).
        
        Ref: Project Plan - Page 3 [cite: 53, 95]
        Goal: % of total qualified candidates that are recommended at least once.
        """
        unique_recommended = set()
        for recs in all_recommendations.values():
            unique_recommended.update(recs[:self.k])
        
        if total_unique_candidates == 0:
            return 0.0
            
        return len(unique_recommended) / total_unique_candidates

    def run_benchmark(self, predictions, ground_truth, candidate_attributes):
        """
        Runs the full evaluation suite on a set of predictions.
        :param predictions: Dict {recruiter_id: [student_id1, student_id2...]}
        :param ground_truth: Dict {recruiter_id: [student_id_correct...]}
        :param candidate_attributes: Dict {student_id: attributes}
        """
        metrics = {
            f"NDCG@{self.k}": [],
            f"CDP_{self.k}": []
        }

        for user_id, recs in predictions.items():
            # 1. Relevance (NDCG)
            truth = ground_truth.get(user_id, [])
            ndcg = self.calculate_ndcg(recs, truth)
            metrics[f"NDCG@{self.k}"].append(ndcg)

            # 2. Fairness (CDP - Gender)
            # We check the proportion of 'Female' in the recommendations
            cdp = self.calculate_cdp(recs, candidate_attributes, sensitive_attr='gender', target_group_val='Female')
            metrics[f"CDP_{self.k}"].append(cdp)

        # Aggregated Results
        results = {
            "Mean_NDCG": np.mean(metrics[f"NDCG@{self.k}"]),
            "Mean_CDP_Female_Ratio": np.mean(metrics[f"CDP_{self.k}"]),
            "Coverage": self.calculate_coverage(predictions, len(candidate_attributes))
        }
        
        return results

# --- MOCK TEST FOR WEEK 2 REPORT (Q3) ---
if __name__ == "__main__":
    print("Initializing Evaluation Harness...")
    
    # 1. Define Mock Data (as if it came from your model)
    # Recruiter 1 gets 3 recommended students: 101 (M), 102 (F), 103 (M)
    mock_preds = {
        "recruiter_1": [101, 102, 103, 104, 105],
        "recruiter_2": [102, 105, 106, 107, 108]
    }
    
    # Ground Truth (Recruiter 1 actually hired 101)
    mock_truth = {
        "recruiter_1": [101], 
        "recruiter_2": [109] # 109 was not recommended -> NDCG should be 0 for this user
    }
    
    # Attributes for Fairness Check
    mock_attributes = {
        101: {'gender': 'Male'},
        102: {'gender': 'Female'},
        103: {'gender': 'Male'},
        104: {'gender': 'Female'},
        105: {'gender': 'Male'},
        106: {'gender': 'Female'},
        107: {'gender': 'Male'},
        108: {'gender': 'Male'},
        109: {'gender': 'Female'}
    }
    
    # 2. Run Harness
    harness = EvaluationHarness(k=5)
    results = harness.run_benchmark(mock_preds, mock_truth, mock_attributes)
    
    print("\n--- MOCK EVALUATION RESULTS ---")
    print(results)
    print("-------------------------------")
    print("Status: SUCCESS. Harness is functional.")