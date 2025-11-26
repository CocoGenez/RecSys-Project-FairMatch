"""
Script pour réinitialiser la base de données avec les nouvelles colonnes.
ATTENTION: Ce script supprime toutes les données existantes !
"""
from lib.database import engine, Base
from lib.models import User

def reset_database():
    """Supprime et recrée toutes les tables"""
    print("ATTENTION: Toutes les donnees seront supprimees!")
    print("Suppression des tables existantes...")
    
    # Supprimer toutes les tables
    Base.metadata.drop_all(bind=engine)
    
    print("Creation des nouvelles tables...")
    
    # Recréer toutes les tables avec la nouvelle structure
    Base.metadata.create_all(bind=engine)
    
    print("Base de donnees reinitialisee avec succes!")
    print("Les nouvelles colonnes sont maintenant disponibles.")

if __name__ == "__main__":
    reset_database()

