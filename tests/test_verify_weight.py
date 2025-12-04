
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

# Mock base_model to verify the call arguments
mock_base_model = MagicMock()
sys.modules["models.base_model"] = mock_base_model

# Mock lib.models with explicit classes
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

def test_hybrid_weight_passed():
    print("Testing if hybrid_weight=0.05 is passed to base_model...")
    
    # Mock DB Session
    mock_db = MagicMock()
    
    # Mock User Instance (no embedding, so uses recommend_from_text)
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
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user_instance
    mock_db.query.return_value.filter.return_value.all.return_value = [] # seen
    mock_db.query.return_value.filter.return_value.group_by.return_value.all.return_value = [] # exposure
    
    # Mock recommend_from_text
    with patch("routers.recommendations.recommend_from_text") as mock_rec_text:
        mock_rec_text.return_value = ([], [0.1]*384)
        
        # Run
        try:
            recommend(user_id=1, db=mock_db)
        except Exception:
            pass # We don't care about the rest of the function failing due to mocks
            
        # Check call args
        args, kwargs = mock_rec_text.call_args
        print(f"Call args: {kwargs}")
        
        if kwargs.get("hybrid_weight") == 0.05:
            print("SUCCESS: hybrid_weight=0.05 passed correctly.")
        else:
            print(f"FAILURE: hybrid_weight not passed or incorrect. Got: {kwargs.get('hybrid_weight')}")

if __name__ == "__main__":
    test_hybrid_weight_passed()
