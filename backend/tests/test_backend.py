import os
import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Use isolated SQLite test database
TEST_DB_FILE = "./test_healthmate.db"
if os.path.exists(TEST_DB_FILE):
    os.remove(TEST_DB_FILE)

test_engine = create_engine(f"sqlite:///{TEST_DB_FILE}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_auth_and_profile_flow():
    # 1. Register user
    reg_payload = {
        "email": "testuser@example.com",
        "password": "Password123!",
        "full_name": "Sarah Connor",
    }
    r = client.post("/api/v1/auth/register", json=reg_payload)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testuser@example.com"
    token = data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Duplicate registration should fail
    r_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert r_dup.status_code == 400

    # 3. Login
    login_payload = {
        "email": "testuser@example.com",
        "password": "Password123!",
    }
    r_login = client.post("/api/v1/auth/login", json=login_payload)
    assert r_login.status_code == 200
    assert "access_token" in r_login.json()

    # 4. Get Current User /me
    r_me = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r_me.status_code == 200
    assert r_me.json()["full_name"] == "Sarah Connor"

    # 5. Update Profile
    prof_update = {
        "gender": "Female",
        "height": 168.0,
        "weight": 62.5,
        "dietary_preference": "Vegetarian",
        "allergies": "None",
        "target_water_ml": 3000,
    }
    r_prof = client.put("/api/v1/auth/profile", json=prof_update, headers=auth_headers)
    assert r_prof.status_code == 200
    assert r_prof.json()["profile"]["target_water_ml"] == 3000


def test_vitals_flow():
    # Login to get token
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create BP measurement
    bp_data = {
        "type": "blood_pressure",
        "value_primary": 118.0,
        "value_secondary": 78.0,
        "unit": "mmHg",
        "notes": "Morning resting BP",
    }
    r_bp = client.post("/api/v1/vitals/measurements", json=bp_data, headers=headers)
    assert r_bp.status_code == 201
    bp_id = r_bp.json()["id"]

    # Create Sleep measurement
    sleep_data = {
        "type": "sleep",
        "value_primary": 8.0,
        "unit": "hours",
        "notes": "Deep restful sleep",
    }
    client.post("/api/v1/vitals/measurements", json=sleep_data, headers=headers)

    # Create Water measurement
    water_data = {
        "type": "water",
        "value_primary": 2200.0,
        "unit": "ml",
    }
    client.post("/api/v1/vitals/measurements", json=water_data, headers=headers)

    # List measurements
    r_list = client.get("/api/v1/vitals/measurements", headers=headers)
    assert r_list.status_code == 200
    assert len(r_list.json()) >= 3

    # Analytics
    r_analytics = client.get("/api/v1/vitals/analytics", headers=headers)
    assert r_analytics.status_code == 200
    summaries = r_analytics.json()
    assert any(s["type"] == "blood_pressure" and s["latest_value_primary"] == 118.0 for s in summaries)


def test_medicines_and_reminders():
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    med_data = {
        "name": "Vitamin D3",
        "dosage": "2000 IU",
        "form": "Softgel",
        "instructions": "Take after breakfast",
        "frequency": "Daily",
        "schedule_times": "09:00",
        "start_date": "2026-10-01",
    }
    r_med = client.post("/api/v1/medicines/", json=med_data, headers=headers)
    assert r_med.status_code == 201
    med_id = r_med.json()["id"]

    # Check today's doses
    r_doses = client.get("/api/v1/medicines/today-doses", headers=headers)
    assert r_doses.status_code == 200
    doses = r_doses.json()
    assert len(doses) >= 1
    dose_id = doses[0]["id"]

    # Mark dose as taken
    r_status = client.post(f"/api/v1/medicines/doses/{dose_id}/status", json={"status": "taken"}, headers=headers)
    assert r_status.status_code == 200
    assert r_status.json()["status"] == "taken"


def test_routines_and_ai_suggest():
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    routine_data = {
        "title": "Morning 500ml Water",
        "category": "Morning",
        "target_time": "07:30",
        "recurrence": "daily",
        "icon": "water_drop",
    }
    r_routine = client.post("/api/v1/routines/", json=routine_data, headers=headers)
    assert r_routine.status_code == 201
    r_id = r_routine.json()["id"]

    # Toggle completion
    r_toggle = client.post(f"/api/v1/routines/{r_id}/toggle", headers=headers)
    assert r_toggle.status_code == 200
    assert r_toggle.json()["completed_today"] == True

    # AI routine suggestion
    r_suggest = client.post("/api/v1/routines/ai-suggest", json={"goal_prompt": "Improve heart health and cardio"}, headers=headers)
    assert r_suggest.status_code == 200
    assert len(r_suggest.json()["proposed_routines"]) >= 1


def test_chat_and_emergency_detection():
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create conversation
    r_convo = client.post("/api/v1/chat/conversations", json={"title": "Wellness Consultation"}, headers=headers)
    assert r_convo.status_code == 201
    convo_id = r_convo.json()["id"]

    # Send general question
    r_msg = client.post(
        f"/api/v1/chat/conversations/{convo_id}/messages",
        json={"content": "How can I improve my sleep quality naturally?"},
        headers=headers,
    )
    assert r_msg.status_code == 200
    data = r_msg.json()
    assert "sleep" in data["assistant_message"]["content"].lower()
    assert data["is_emergency"] == False

    # Send emergency symptom message
    r_emerg = client.post(
        f"/api/v1/chat/conversations/{convo_id}/messages",
        json={"content": "I am experiencing sudden severe chest pain and shortness of breath"},
        headers=headers,
    )
    assert r_emerg.status_code == 200
    emerg_data = r_emerg.json()
    assert emerg_data["is_emergency"] == True
    assert "112" in emerg_data["emergency_guidance"] or "911" in emerg_data["emergency_guidance"]


def test_dashboard_summary():
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.get("/api/v1/dashboard/summary", headers=headers)
    assert r.status_code == 200
    dash = r.json()
    assert "vitality" in dash
    assert "total_score" in dash["vitality"]
    assert dash["vitality"]["total_score"] > 0
    assert "today_doses" in dash
    assert "today_routines" in dash


def test_documents_flow_and_ownership():
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload sample medical text report
    fake_file_content = b"Complete Blood Count (CBC) Results:\nHemoglobin: 14.5 g/dL (Normal: 13.8 - 17.2)\nWBC: 6,200 /mcL\nPlatelets: 250,000 /mcL\nOverall: Normal healthy values."
    files = {"file": ("blood_test.txt", fake_file_content, "text/plain")}
    data = {
        "title": "Annual Blood Panel",
        "category": "Lab Report",
        "document_date": "2026-10-25",
        "description": "Comprehensive metabolic and CBC panel",
    }
    r_up = client.post("/api/v1/documents/upload", files=files, data=data, headers=headers)
    assert r_up.status_code == 201
    doc_id = r_up.json()["id"]

    # Retrieve document detail
    r_doc = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert r_doc.status_code == 200
    doc_detail = r_doc.json()
    assert doc_detail["title"] == "Annual Blood Panel"
    assert doc_detail["ai_summary"] is not None
    assert len(doc_detail["ai_summary"]) > 10

    # Ask AI question about report
    r_q = client.post(
        f"/api/v1/documents/{doc_id}/question",
        json={"question": "What is my hemoglobin level?"},
        headers=headers,
    )
    assert r_q.status_code == 200
    assert "answer" in r_q.json()

    # Download document
    r_dl = client.get(f"/api/v1/documents/{doc_id}/download", headers=headers)
    assert r_dl.status_code == 200
    assert b"Complete Blood Count" in r_dl.content

    # Cross-user unauthorized access test
    # Register second user
    second_user = {
        "email": "intruder@example.com",
        "password": "Password123!",
        "full_name": "Intruder User",
    }
    r_reg2 = client.post("/api/v1/auth/register", json=second_user)
    token2 = r_reg2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Intruder tries to access first user's document metadata and file
    r_unauth = client.get(f"/api/v1/documents/{doc_id}", headers=headers2)
    assert r_unauth.status_code == 404

    r_dl_unauth = client.get(f"/api/v1/documents/{doc_id}/download", headers=headers2)
    assert r_dl_unauth.status_code == 404


def test_nutrition_flow():
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Log breakfast
    meal_data = {
        "meal_type": "breakfast",
        "food_name": "Oatmeal with Almonds & Blueberries",
        "portion": "1 bowl (300g)",
        "calories": 380,
        "protein_g": 12.0,
        "carbs_g": 58.0,
        "fat_g": 9.0,
        "notes": "Healthy breakfast",
    }
    r_meal = client.post("/api/v1/nutrition/meals", json=meal_data, headers=headers)
    assert r_meal.status_code == 201

    # Get daily summary
    today_str = datetime.date.today().isoformat()
    r_sum = client.get(f"/api/v1/nutrition/daily-summary?date={today_str}", headers=headers)
    assert r_sum.status_code == 200
    summary = r_sum.json()
    assert summary["total_calories"] >= 380
    assert "breakfast" in summary["meals_by_type"]
    assert len(summary["meals_by_type"]["breakfast"]) >= 1


def test_workouts_and_meditation():
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Log workout
    workout = {
        "activity_type": "Walking",
        "duration_minutes": 35,
        "calories_burned": 160,
        "intensity": "moderate",
        "notes": "Evening neighborhood brisk walk",
    }
    r_work = client.post("/api/v1/workouts/", json=workout, headers=headers)
    assert r_work.status_code == 201

    # List workouts
    r_list = client.get("/api/v1/workouts/", headers=headers)
    assert r_list.status_code == 200
    assert len(r_list.json()) >= 1

    # Log meditation completion
    meditation = {
        "session_name": "4-7-8 Breathing Relaxation",
        "session_type": "Breathing",
        "duration_minutes": 10,
        "notes": "Felt grounded and calm",
    }
    r_med = client.post("/api/v1/meditation/complete", json=meditation, headers=headers)
    assert r_med.status_code == 201

    # List history
    r_hist = client.get("/api/v1/meditation/history", headers=headers)
    assert r_hist.status_code == 200
    assert len(r_hist.json()) >= 1


def test_data_export_and_account_deletion():
    # Register temporary user for deletion test
    del_user = {
        "email": "to_be_deleted@example.com",
        "password": "Password123!",
        "full_name": "Temporary User",
    }
    r_reg = client.post("/api/v1/auth/register", json=del_user)
    token = r_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Export user data
    r_export = client.get("/api/v1/auth/export", headers=headers)
    assert r_export.status_code == 200
    export_json = r_export.json()
    assert export_json["user"]["email"] == "to_be_deleted@example.com"
    assert "profile" in export_json

    # Delete account
    r_del = client.delete("/api/v1/auth/account", headers=headers)
    assert r_del.status_code == 200

    # Ensure account can no longer log in
    r_login = client.post("/api/v1/auth/login", json={"email": "to_be_deleted@example.com", "password": "Password123!"})
    assert r_login.status_code == 401


def test_goals_and_auth_security():
    # 1. Unauthenticated requests are rejected
    r_unauth = client.get("/api/v1/auth/me")
    assert r_unauth.status_code in [401, 403]

    # 2. Wrong password is rejected
    r_bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "WrongPassword999!"},
    )
    assert r_bad_login.status_code == 401

    # 3. Authenticate valid user
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    token = client.post("/api/v1/auth/login", json=login_payload).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Create a health goal
    goal_payload = {
        "title": "Drink 3 Liters Daily",
        "category": "hydration",
        "target_value": 3000.0,
        "current_value": 1500.0,
        "unit": "ml",
        "deadline": "2026-12-31",
    }
    r_goal = client.post("/api/v1/goals/", json=goal_payload, headers=headers)
    assert r_goal.status_code == 201
    goal_id = r_goal.json()["id"]

    # 5. List goals
    r_list = client.get("/api/v1/goals/", headers=headers)
    assert r_list.status_code == 200
    assert any(g["id"] == goal_id for g in r_list.json())

    # 6. Update goal
    r_update = client.put(
        f"/api/v1/goals/{goal_id}",
        json={"current_value": 2500.0},
        headers=headers,
    )
    assert r_update.status_code == 200
    assert r_update.json()["current_value"] == 2500.0

    # 7. Delete goal
    r_del = client.delete(f"/api/v1/goals/{goal_id}", headers=headers)
    assert r_del.status_code == 200
