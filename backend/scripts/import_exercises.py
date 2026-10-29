import os
import sys
import json
import re
from pathlib import Path

# Add backend to path so we can import app modules
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base, engine, SessionLocal
from app.models.exercise import CatalogExercise

WORKSPACE_DIR = BACKEND_DIR.parent

candidates_repdb = [
    Path(os.environ["REPDB_DIR"]) if os.environ.get("REPDB_DIR") else None,
    WORKSPACE_DIR / "exercise-dataset-main" / "exercise-dataset-main",
    WORKSPACE_DIR / "exercise-dataset-main",
    Path(r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\healthmatee\datasets\RepDB\exercise-dataset-main"),
]
REPDB_DIR = next((p for p in candidates_repdb if p and p.is_dir()), None)

candidates_flow = [
    Path(os.environ["FLOW_DIR"]) if os.environ.get("FLOW_DIR") else None,
    BACKEND_DIR / "static" / "exercises" / "flow",
    WORKSPACE_DIR / "datasets" / "Flow" / "flow-exercise-dataset-main",
    Path(r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\healthmatee\datasets\Flow\flow-exercise-dataset-main"),
]
FLOW_DIR = next((p for p in candidates_flow if p and p.is_dir()), None)

def normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())

def determine_met(category: str, equipment: str, body_part: str) -> float:
    c = (category or "").lower()
    eq = (equipment or "").lower()
    bp = (body_part or "").lower()

    if "cardio" in c or "hiit" in c or "plyo" in c:
        return 7.5
    if "stretching" in c or "yoga" in c or "mobility" in c:
        return 2.5
    if "barbell" in eq or "dumbbell" in eq or "kettlebell" in eq:
        return 5.5
    if "machine" in eq or "cable" in eq:
        return 4.5
    if "core" in c or "waist" in bp:
        return 3.8
    if "bodyweight" in eq or "body weight" in eq:
        return 4.0
    return 4.5

def run_import(target_engine=None, target_session_factory=None):
    print("=== STARTING EXERCISE CATALOGUE IMPORT ===")
    active_engine = target_engine or engine
    active_session_factory = target_session_factory or SessionLocal

    # 1. Load RepDB
    repdb_json_path = REPDB_DIR / "exercises.json"
    if not repdb_json_path.exists():
        raise FileNotFoundError(f"RepDB exercises.json not found at {repdb_json_path}")

    with open(repdb_json_path, "r", encoding="utf-8") as f:
        repdb_raw = json.load(f)["exercises"]
    print(f"Loaded {len(repdb_raw)} records from RepDB.")

    # 2. Load Flow
    flow_json_path = FLOW_DIR / "data" / "exercises.json"
    if not flow_json_path.exists():
        raise FileNotFoundError(f"Flow exercises.json not found at {flow_json_path}")

    with open(flow_json_path, "r", encoding="utf-8") as f:
        flow_raw = json.load(f)
    print(f"Loaded {len(flow_raw)} records from Flow.")

    # Build maps by normalized name
    repdb_by_norm = {}
    for r in repdb_raw:
        norm = normalize_name(r.get("name_en", ""))
        if norm:
            repdb_by_norm[norm] = r

    flow_by_norm = {}
    for fl in flow_raw:
        norm = normalize_name(fl.get("name", ""))
        if norm:
            flow_by_norm[norm] = fl

    exact_matches = set(repdb_by_norm.keys()) & set(flow_by_norm.keys())
    print(f"Detected {len(exact_matches)} exact normalized matches across datasets.")

    unified_records = []
    processed_repdb_norms = set()
    processed_flow_norms = set()

    # A. Process Exact Matches (Merged)
    for norm in exact_matches:
        r = repdb_by_norm[norm]
        fl = flow_by_norm[norm]
        processed_repdb_norms.add(norm)
        processed_flow_norms.add(norm)

        # RepDB Image
        img_dict = r.get("images", {}).get("flat", {})
        rel_img = img_dict.get("main") or img_dict.get("start") or img_dict.get("peak")
        image_url = None
        if rel_img:
            # Stored as "images/flat/<filename>.webp" -> serve at /static/exercises/repdb/<filename>.webp
            fname = Path(rel_img).name
            image_url = f"/static/exercises/repdb/{fname}"

        # Flow Animation
        anim = fl.get("animation")
        animation_frames = None
        animation_sequence = None
        frame_duration_ms = 180
        if anim and anim.get("frames"):
            animation_frames = [f"/static/exercises/flow/{f}" for f in anim["frames"]]
            animation_sequence = anim.get("sequence", [0, 1, 2, 1])
            frame_duration_ms = anim.get("frameDurationMs", 180)

        # Merge muscles
        p_muscles = r.get("primary_muscles") or []
        fl_target = fl.get("target")
        if fl_target and fl_target not in p_muscles:
            p_muscles = p_muscles + [fl_target]

        s_muscles = list(set((r.get("secondary_muscles") or []) + (fl.get("secondaryMuscles") or [])))

        # Instructions (prefer RepDB if available, else Flow)
        instructions = r.get("instructions_en") or fl.get("instructions") or []

        rec = CatalogExercise(
            id=f"unified_{r['id']}",
            name=r.get("name_en", fl["name"].title()),
            slug=norm,
            category=(r.get("category") or fl.get("movementPattern") or "Strength").capitalize(),
            body_part=(r.get("body_part") or fl.get("bodyPart") or "Full Body").title(),
            target_muscle=(p_muscles[0] if p_muscles else fl_target or "Full Body").title(),
            secondary_muscles=[m.title() for m in s_muscles],
            equipment=(r.get("equipment") or fl.get("equipment") or "Bodyweight").title(),
            difficulty=(r.get("difficulty") or "Intermediate").capitalize(),
            force_type=r.get("force_type"),
            mechanic=r.get("mechanic"),
            is_bodyweight=bool(r.get("is_bodyweight") or "body weight" in (fl.get("equipment") or "").lower()),
            met=float(r.get("met") or determine_met(r.get("category"), r.get("equipment"), r.get("body_part"))),
            description=r.get("description_en"),
            instructions=instructions,
            tips=r.get("tips_en") or [],
            image_url=image_url,
            animation_frames=animation_frames,
            animation_sequence=animation_sequence,
            frame_duration_ms=frame_duration_ms,
            has_animation=bool(animation_frames),
            has_image=bool(image_url),
            source="Both",
            source_id_repdb=r["id"],
            source_id_flow=fl["id"],
            attribution=(
                "Illustrated by RepDB (repdb.co). Motion animation and exercise instructions "
                "from Flow Exercise Dataset (CC0-1.0 / MIT by Hasan Emir Yıldırım)."
            ),
        )
        unified_records.append(rec)

    # B. Process Remaining RepDB Standalone Records
    for norm, r in repdb_by_norm.items():
        if norm in processed_repdb_norms:
            continue

        img_dict = r.get("images", {}).get("flat", {})
        rel_img = img_dict.get("main") or img_dict.get("start") or img_dict.get("peak")
        image_url = None
        if rel_img:
            fname = Path(rel_img).name
            image_url = f"/static/exercises/repdb/{fname}"

        p_muscles = r.get("primary_muscles") or []
        s_muscles = r.get("secondary_muscles") or []

        rec = CatalogExercise(
            id=f"repdb_{r['id']}",
            name=r.get("name_en", "Unnamed Exercise"),
            slug=norm,
            category=(r.get("category") or "Strength").capitalize(),
            body_part=(r.get("body_part") or "Full Body").title(),
            target_muscle=(p_muscles[0] if p_muscles else "General").title(),
            secondary_muscles=[m.title() for m in s_muscles],
            equipment=(r.get("equipment") or ("Bodyweight" if r.get("is_bodyweight") else "Equipment")).title(),
            difficulty=(r.get("difficulty") or "Intermediate").capitalize(),
            force_type=r.get("force_type"),
            mechanic=r.get("mechanic"),
            is_bodyweight=bool(r.get("is_bodyweight")),
            met=float(r.get("met") or determine_met(r.get("category"), r.get("equipment"), r.get("body_part"))),
            description=r.get("description_en"),
            instructions=r.get("instructions_en") or [],
            tips=r.get("tips_en") or [],
            image_url=image_url,
            animation_frames=None,
            animation_sequence=None,
            frame_duration_ms=180,
            has_animation=False,
            has_image=bool(image_url),
            source="RepDB",
            source_id_repdb=r["id"],
            source_id_flow=None,
            attribution="Exercise data and illustration by RepDB (repdb.co). Free tier license.",
        )
        unified_records.append(rec)

    # C. Process Remaining Flow Standalone Records
    for norm, fl in flow_by_norm.items():
        if norm in processed_flow_norms:
            continue

        anim = fl.get("animation")
        animation_frames = None
        animation_sequence = None
        frame_duration_ms = 180
        if anim and anim.get("frames"):
            animation_frames = [f"/static/exercises/flow/{f}" for f in anim["frames"]]
            animation_sequence = anim.get("sequence", [0, 1, 2, 1])
            frame_duration_ms = anim.get("frameDurationMs", 180)

        # Use frame-00 as static thumbnail if animation exists
        static_frame_thumb = animation_frames[0] if animation_frames else None

        rec = CatalogExercise(
            id=f"flow_{fl['id']}",
            name=fl.get("name", "Unnamed Exercise").title(),
            slug=norm,
            category=(fl.get("movementPattern") or "Strength").capitalize(),
            body_part=(fl.get("bodyPart") or "Full Body").title(),
            target_muscle=(fl.get("target") or "General").title(),
            secondary_muscles=[m.title() for m in fl.get("secondaryMuscles", [])],
            equipment=(fl.get("equipment") or "Bodyweight").title(),
            difficulty="Intermediate",
            force_type=None,
            mechanic=None,
            is_bodyweight="body weight" in (fl.get("equipment") or "").lower(),
            met=determine_met(fl.get("movementPattern"), fl.get("equipment"), fl.get("bodyPart")),
            description=None,
            instructions=fl.get("instructions") or [],
            tips=[],
            image_url=static_frame_thumb,
            animation_frames=animation_frames,
            animation_sequence=animation_sequence,
            frame_duration_ms=frame_duration_ms,
            has_animation=bool(animation_frames),
            has_image=bool(static_frame_thumb),
            source="Flow",
            source_id_repdb=None,
            source_id_flow=fl["id"],
            attribution=(
                "Exercise data and SVG animation from Flow Exercise Dataset (CC0-1.0 / MIT). "
                "Derived from Hasan Emir Yıldırım's exercises-dataset."
            ),
        )
        unified_records.append(rec)

    # 3. Save to database
    Base.metadata.create_all(bind=active_engine)
    db = active_session_factory()
    try:
        # Clear existing catalog to allow idempotent refresh
        deleted_count = db.query(CatalogExercise).delete()
        print(f"Cleared {deleted_count} previous catalog entries.")

        # Bulk insert
        db.bulk_save_objects(unified_records)
        db.commit()
        print(f"Successfully saved {len(unified_records)} exercises to database!")
    finally:
        db.close()

    total_with_anim = sum(1 for e in unified_records if e.has_animation)
    total_with_img = sum(1 for e in unified_records if e.has_image)
    print("\n=== IMPORT SUMMARY ===")
    print(f"- Total Unique Exercises in Catalogue: {len(unified_records)}")
    print(f"- Merged Duplicates (Dual Source): {len(exact_matches)}")
    print(f"- Standalone RepDB Exercises: {len(repdb_by_norm) - len(exact_matches)}")
    print(f"- Standalone Flow Exercises: {len(flow_by_norm) - len(exact_matches)}")
    print(f"- Exercises with Animated Demonstration: {total_with_anim}")
    print(f"- Exercises with Image/Visual Illustration: {total_with_img}")
    print("======================================\n")

if __name__ == "__main__":
    run_import()
