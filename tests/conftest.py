import os
import pytest

# Ensure all automated test runs use deterministic synthetic fixtures
os.environ["PRIMARY_DATA_PROVIDER"] = "synthetic"
