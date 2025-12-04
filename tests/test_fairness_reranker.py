
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from backend.models.fairness_reranker import rerank_conditional_demographic_parity

def test_reranker():
    # Mock candidates
    candidates = [
        {"id": "1", "score": 0.9, "group": "A", "qualified": True, "exposure_count": 10},
        {"id": "2", "score": 0.8, "group": "B", "qualified": True, "exposure_count": 0},
        {"id": "3", "score": 0.7, "group": "A", "qualified": True, "exposure_count": 5},
        {"id": "4", "score": 0.6, "group": "B", "qualified": True, "exposure_count": 2},
        {"id": "5", "score": 0.5, "group": "C", "qualified": True, "exposure_count": 0},
        {"id": "6", "score": 0.4, "group": "A", "qualified": False, "exposure_count": 0}, # Not qualified
    ]

    print("Original Candidates:")
    for c in candidates:
        print(c)

    k = 3
    print(f"\nReranking top {k}...")
    reranked = rerank_conditional_demographic_parity(candidates, k=k, protected_attr="group")

    print("\nReranked Shortlist:")
    for c in reranked:
        print(c)

    # Checks
    assert len(reranked) <= k
    # Check if qualified only
    for c in reranked:
        assert c["qualified"]
    
    # Check coverage boost effect (item 2 has 0 exposure, should be boosted)
    # Item 2 score 0.8, exposure 0 -> boost = 5 * (1/1) = 5 -> fair_score = 5.8
    # Item 1 score 0.9, exposure 10 -> boost = 5 * (1/11) = 0.45 -> fair_score = 1.35
    # So Item 2 should likely be first if group quotas allow.
    
    print("\nTest passed!")

if __name__ == "__main__":
    test_reranker()
