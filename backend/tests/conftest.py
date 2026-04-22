import sys
import os

# Add backend/ directory to sys.path so tests can import server directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))