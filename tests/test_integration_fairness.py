
import sys
import os
from pathlib import Path
from unittest.mock import MagicMock, patch

# Mock heavy dependencies BEFORE importing backend modules
sys.modules["fastapi"] = MagicMock()
# Configure APIRouter to return a decorator that returns the function as-is
def identity_decorator(*args, **kwargs):
    def wrapper(f):
        return f
    return wrapper
sys.modules["fastapi"].APIRouter.return_value.get.side_effect = identity_decorator

sys.modules["sqlalchemy"] = MagicMock()
sys.modules["sqlalchemy.orm"] = MagicMock()
sys.modules["lib.database"] = MagicMock()
sys.modules["pandas"] = MagicMock()
sys.modules["torch"] = MagicMock()
sys.modules["sentence_transformers"] = MagicMock()

# Mock base_model to avoid imports within it
mock_base_model = MagicMock()
sys.modules["models.base_model"] = mock_base_model

# Mock lib.models with explicit classes to avoid attribute errors
class MockModel:
    pass

class MockUser(MockModel):
    id = MagicMock()
    gender = MagicMock()
    age = MagicMock()
    interested_domain = MagicMock()
    projects = MagicMock()
    python_level = MagicMock()
    sql_level = MagicMock()
    java_level = MagicMock()
    profile_embedding = MagicMock()
    
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

class MockInteraction(MockModel):
    id = MagicMock()
    user_id = MagicMock()
    item_id = MagicMock()
    type = MagicMock()
    
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

mock_lib_models = MagicMock()
mock_lib_models.User = MockUser
mock_lib_models.Interaction = MockInteraction
sys.modules["lib.models"] = mock_lib_models

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from routers.recommendations import recommend
from lib.models import User, Interaction

def test_recommend_endpoint_logic():
    try:
        print("Testing recommend endpoint logic...")
        
        # Mock DB Session
        mock_db = MagicMock()
        
        # Mock User Instance
        mock_user_instance = MockUser(
            id=1,
            gender="Female",
            age=25,
            interested_domain="Data Science",
            projects=["Project A"],
            python_level="Strong",
            sql_level="Average",
            java_level="Weak",
            profile_embedding=None
        )
        
        # Mock DB queries
        # 1. Fetch User
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_instance
        
        # 2. Fetch Interactions (Seen jobs)
        # Return empty list for now
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        # 3. Exposure counts
        # This is a bit tricky because of the chained query in the code:
        # db.query(Interaction.item_id, func.count(Interaction.id)).filter(...).group_by(...).all()
        # We need to mock this chain.
        
        # Let's mock the final .all() return value
        # Return some fake exposure counts
        # We don't know the job IDs yet, but let's assume the model returns some.
        # The code does: candidate_ids = [c["job_id"] for c in candidates]
        # Then queries DB.
        
        # We can mock the model response too to control job IDs.
        # Since we mocked models.base_model, we can just configure it directly?
        # But recommend_from_text is imported into routers.recommendations namespace.
        
        # Let's use patch on the imported name in routers.recommendations
        with patch("routers.recommendations.recommend_from_text") as mock_rec_text:
            # Mock model returning 50 candidates
            mock_candidates = []
            for i in range(50):
                mock_candidates.append({
                    "job_id": str(i),
                    "title": f"Job {i}",
                    "company_bucket": "small" if i % 2 == 0 else "large",
                    "score": 0.9 - (i * 0.01)
                })
            
            mock_rec_text.return_value = (mock_candidates, [0.1]*384)
            
            # Mock exposure counts: Job 0 has 100 views, others 0
            mock_exposure_return = [("0", 100)]
            
            # We need to match the specific query structure for exposure counts
            # db.query(...).filter(...).group_by(...).all()
            # It's the 3rd query in the function (User, Interactions, Exposure)
            # But User is .first(), Interactions is .all(), Exposure is .all()
            
            # Simpler approach: Mock db.query side_effect
            def query_side_effect(*args):
                return mock_db # Return self to allow chaining
                
            mock_db.query.side_effect = query_side_effect
            
            # We need to handle the final .all() or .first()
            # This is getting complicated to mock perfectly with chained calls.
            # Let's just mock the specific calls we expect.
            
            # Reset side_effect and configure specific mocks
            mock_db.reset_mock()
            
            # User query
            mock_user_query = MagicMock()
            mock_user_query.filter.return_value.first.return_value = mock_user_instance
            
            # Interaction query (seen jobs)
            mock_interaction_query = MagicMock()
            mock_interaction_query.filter.return_value.all.return_value = []
            
            # Exposure query
            mock_exposure_query = MagicMock()
            mock_exposure_query.filter.return_value.group_by.return_value.all.return_value = mock_exposure_return
            
            # Dispatch based on args is hard.
            # Let's try to patch the DB session passed to the function?
            # Or just rely on the order of calls?
            
            # Order:
            # 1. db.query(User)
            # 2. db.query(Interaction) (seen)
            # 3. db.query(Interaction.item_id, ...) (exposure)
            
            mock_db.query.side_effect = [
                mock_user_query,
                mock_interaction_query,
                mock_exposure_query
            ]
            
            # Run the function
            response = recommend(user_id=1, db=mock_db)
            
            print(f"Response keys: {response.keys()}")
            print(f"Num recommendations: {response['num_recommendations']}")
            print("Top 3 recommendations:")
            for r in response['recommendations'][:3]:
                print(f" - {r['job_id']} (Score: {r.get('score')}, FairScore: {r.get('fair_score')}, Exposure: {r.get('exposure_count')})")
                
            # Verification
            # Job 0 had high score (0.9) but high exposure (100).
            # Job 1 had score 0.89 but 0 exposure.
            # Job 1 should likely be ranked higher than Job 0 due to coverage boost.
            
            recos = response['recommendations']
            job_0 = next((r for r in recos if r['job_id'] == '0'), None)
            job_1 = next((r for r in recos if r['job_id'] == '1'), None)
            
            if job_0 and job_1:
                print(f"Job 0 Fair Score: {job_0.get('fair_score')}")
                print(f"Job 1 Fair Score: {job_1.get('fair_score')}")
                
                if job_1['fair_score'] > job_0['fair_score']:
                    print("SUCCESS: Low exposure job boosted above high exposure job.")
                else:
                    print("WARNING: Coverage boost might not be strong enough.")
            
            assert len(recos) == 10
            print("Test passed!")

    except Exception:
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    test_recommend_endpoint_logic()
