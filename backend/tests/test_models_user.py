import pytest
from app.models.user import User


def test_user_creates_with_required_fields():
    u = User(name="Hà", email="ha@test.com", password_hash="$argon2id$...")
    assert u.email == "ha@test.com"
    assert u.id is None
