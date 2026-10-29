import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db
from app.models.exercise import CatalogExercise

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def ensure_catalog_seeded():
    db_gen = app.dependency_overrides.get(get_db, get_db)()
    db = next(db_gen) if hasattr(db_gen, "__next__") else db_gen
    try:
        count = db.query(CatalogExercise).count()
        if count == 0:
            bind = db.get_bind()
            session_factory = sessionmaker(autocommit=False, autoflush=False, bind=bind)
            from scripts.import_exercises import run_import
            run_import(target_engine=bind, target_session_factory=session_factory)
    finally:
        if hasattr(db_gen, "close"):
            db_gen.close()


def test_exercise_catalogue_list_and_pagination():
    response = client.get("/api/v1/exercises/?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1900
    assert len(data["items"]) == 10
    assert data["page"] == 1
    assert data["pages"] > 100

    first = data["items"][0]
    assert "id" in first
    assert "name" in first
    assert "source" in first
    assert "has_animation" in first
    assert "has_image" in first


def test_exercise_filters_and_search():
    # 1. Get filter options
    r_filters = client.get("/api/v1/exercises/filters")
    assert r_filters.status_code == 200
    filters = r_filters.json()
    assert len(filters["categories"]) > 0
    assert len(filters["equipment"]) > 0
    assert len(filters["difficulties"]) > 0

    # 2. Search for 'press'
    r_search = client.get("/api/v1/exercises/?search=press&limit=5")
    assert r_search.status_code == 200
    search_data = r_search.json()
    assert search_data["total"] > 0
    for item in search_data["items"]:
        # Should match name, muscle, or equipment
        text = f"{item['name']} {item.get('target_muscle') or ''} {item.get('equipment') or ''}".lower()
        assert "press" in text

    # 3. Filter by has_animation=true
    r_anim = client.get("/api/v1/exercises/?has_animation=true&limit=5")
    assert r_anim.status_code == 200
    for item in r_anim.json()["items"]:
        assert item["has_animation"] is True


def test_exercise_detail_and_static_media():
    # 1. Fetch an exercise with animation and image
    r_list = client.get("/api/v1/exercises/?limit=20")
    assert r_list.status_code == 200
    items = r_list.json()["items"]

    # Test RepDB detail
    rep_item = next((it for it in items if it["source"] in ("RepDB", "Both") and it["has_image"]), None)
    assert rep_item is not None
    r_rep_detail = client.get(f"/api/v1/exercises/{rep_item['id']}")
    assert r_rep_detail.status_code == 200
    rep_detail = r_rep_detail.json()
    assert len(rep_detail["instructions"]) > 0
    assert rep_detail["attribution"] != ""
    assert rep_detail["image_url"] is not None

    # Verify RepDB static image streaming
    r_img = client.get(rep_detail["image_url"])
    assert r_img.status_code == 200
    assert "image/webp" in r_img.headers.get("content-type", "")
    assert len(r_img.content) > 1000

    # Test Flow detail with animation
    r_flow_list = client.get("/api/v1/exercises/?has_animation=true&limit=1")
    flow_item = r_flow_list.json()["items"][0]
    r_flow_detail = client.get(f"/api/v1/exercises/{flow_item['id']}")
    assert r_flow_detail.status_code == 200
    flow_detail = r_flow_detail.json()
    assert flow_detail["has_animation"] is True
    assert flow_detail["animation_frames"] is not None
    assert len(flow_detail["animation_frames"]) >= 2
    assert flow_detail["frame_duration_ms"] > 0

    # Verify Flow SVG frame streaming
    first_frame = flow_detail["animation_frames"][0]
    r_svg = client.get(first_frame)
    assert r_svg.status_code == 200
    assert "image/svg+xml" in r_svg.headers.get("content-type", "")
    assert len(r_svg.content) > 500


def test_workout_logging_from_catalog():
    # Login user
    login_payload = {"email": "testuser@example.com", "password": "Password123!"}
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    if login_res.status_code != 200:
        reg = client.post(
            "/api/v1/auth/register",
            json={"email": "workout_catalog_user@example.com", "password": "Password123!", "full_name": "Alex Fit"},
        )
        token = reg.json()["access_token"]
    else:
        token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # Pick an exercise from catalog
    r_cat = client.get("/api/v1/exercises/?limit=1")
    ex = r_cat.json()["items"][0]

    # Log workout with this exercise
    cal_burned = round(ex["met"] * 30 * 1.05)
    log_data = {
        "activity_type": ex["name"],
        "duration_minutes": 30,
        "calories_burned": cal_burned,
        "intensity": ex.get("difficulty") or "Moderate",
        "notes": f"Logged from catalog exercise ID: {ex['id']}",
    }
    r_log = client.post("/api/v1/workouts/", json=log_data, headers=headers)
    assert r_log.status_code == 201
    logged = r_log.json()
    assert logged["activity_type"] == ex["name"]
    assert logged["duration_minutes"] == 30
    assert logged["calories_burned"] == cal_burned

    # Verify stats
    r_stats = client.get("/api/v1/workouts/stats", headers=headers)
    assert r_stats.status_code == 200
    stats = r_stats.json()
    assert stats["weekly_active_minutes"] >= 30
    assert stats["total_calories_burned"] >= cal_burned
