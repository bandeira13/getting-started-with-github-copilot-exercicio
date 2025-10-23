import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_redirect_root():
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307  # Status code for temporary redirect
    assert response.headers["location"].endswith("/static/index.html")

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    assert "Chess Club" in activities
    assert "Programming Class" in activities
    
    # Verify activity structure
    chess_club = activities["Chess Club"]
    assert "description" in chess_club
    assert "schedule" in chess_club
    assert "max_participants" in chess_club
    assert "participants" in chess_club
    assert isinstance(chess_club["participants"], list)

def test_signup_for_activity_success():
    activity_name = "Chess Club"
    email = "test@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Signed up {email} for {activity_name}"
    
    # Verify the student was actually added
    activities_response = client.get("/activities")
    activities = activities_response.json()
    assert email in activities[activity_name]["participants"]

def test_signup_for_nonexistent_activity():
    response = client.post("/activities/NonexistentClub/signup?email=test@mergington.edu")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Activity not found"

def test_signup_duplicate_student():
    activity_name = "Programming Class"
    email = "emma@mergington.edu"  # This email is already in the participants list
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Student already signed up for this activity"

def test_activities_structure():
    response = client.get("/activities")
    activities = response.json()
    
    for activity_name, details in activities.items():
        assert isinstance(activity_name, str)
        assert isinstance(details, dict)
        assert all(key in details for key in ["description", "schedule", "max_participants", "participants"])
        assert isinstance(details["description"], str)
        assert isinstance(details["schedule"], str)
        assert isinstance(details["max_participants"], int)
        assert isinstance(details["participants"], list)
        assert all(isinstance(email, str) for email in details["participants"])