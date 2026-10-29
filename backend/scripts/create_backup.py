import os
import sys
import shutil
import hashlib
import sqlite3
import datetime
from pathlib import Path

SOURCE_ROOT = Path(r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\stitch_healthmate_ai_wellness_companion").resolve()
BACKUP_BASE = Path(r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\HealthMate-AI-Backups").resolve()

timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
BACKUP_DEST = BACKUP_BASE / f"backup_{timestamp_str}"

EXCLUDED_DIR_NAMES = {
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".vite",
    "dist",
    ".venv",
    "venv",
}

EXCLUDED_FILE_EXTENSIONS = {
    ".pyc",
    ".pyo",
}

def calculate_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def is_excluded(path: Path) -> bool:
    for part in path.parts:
        if part in EXCLUDED_DIR_NAMES:
            return True
    if path.suffix in EXCLUDED_FILE_EXTENSIONS:
        return True
    return False

def run_backup():
    print(f"--- STARTING COMPLETE BACKUP ---")
    print(f"Source: {SOURCE_ROOT}")
    print(f"Destination: {BACKUP_DEST}")

    BACKUP_DEST.mkdir(parents=True, exist_ok=True)

    copied_files = []
    failed_files = []
    skipped_files = []

    # 1. Walk through all files in SOURCE_ROOT
    for root, dirs, files in os.walk(SOURCE_ROOT):
        # Modify dirs in-place to avoid descending into excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIR_NAMES]

        for file in files:
            src_file = Path(root) / file
            rel_path = src_file.relative_to(SOURCE_ROOT)

            if is_excluded(rel_path):
                skipped_files.append(rel_path)
                continue

            dst_file = BACKUP_DEST / rel_path
            dst_file.parent.mkdir(parents=True, exist_ok=True)

            try:
                # Handle SQLite databases safely using sqlite3 backup API
                if src_file.suffix.lower() == ".db":
                    try:
                        src_conn = sqlite3.connect(f"file:{src_file}?mode=ro", uri=True)
                        dst_conn = sqlite3.connect(dst_file)
                        with dst_conn:
                            src_conn.backup(dst_conn)
                        dst_conn.close()
                        src_conn.close()
                    except Exception as db_err:
                        # Fallback to copy2 if not a standard sqlite db
                        shutil.copy2(src_file, dst_file)
                else:
                    shutil.copy2(src_file, dst_file)

                copied_files.append(rel_path)
            except Exception as e:
                failed_files.append((rel_path, str(e)))

    print(f"Copied {len(copied_files)} files. Skipped {len(skipped_files)} excluded items.")
    if failed_files:
        print(f"FAILED to copy {len(failed_files)} files!")
        for f, err in failed_files:
            print(f"  - {f}: {err}")
        return False

    # 2. Verify all copied files using SHA-256 (except databases which might differ in free-page compaction)
    print("--- VERIFYING FILE INTEGRITY (SHA-256 & SQLite PRAGMA) ---")
    verification_mismatches = []
    verified_count = 0

    for rel_path in copied_files:
        src_file = SOURCE_ROOT / rel_path
        dst_file = BACKUP_DEST / rel_path

        if not dst_file.exists():
            verification_mismatches.append((rel_path, "Destination file does not exist"))
            continue

        if rel_path.suffix.lower() == ".db":
            # Verify SQLite integrity check
            try:
                conn = sqlite3.connect(dst_file)
                cursor = conn.cursor()
                cursor.execute("PRAGMA integrity_check;")
                result = cursor.fetchone()[0]
                conn.close()
                if result == "ok":
                    verified_count += 1
                else:
                    verification_mismatches.append((rel_path, f"SQLite integrity check failed: {result}"))
            except Exception as e:
                verification_mismatches.append((rel_path, f"SQLite verification error: {e}"))
        else:
            src_hash = calculate_sha256(src_file)
            dst_hash = calculate_sha256(dst_file)
            if src_hash == dst_hash:
                verified_count += 1
            else:
                verification_mismatches.append((rel_path, f"Hash mismatch: src={src_hash} != dst={dst_hash}"))

    if verification_mismatches:
        print(f"VERIFICATION FAILED for {len(verification_mismatches)} files!")
        for f, reason in verification_mismatches:
            print(f"  - {f}: {reason}")
        return False

    print(f"SUCCESS: All {verified_count} files verified 100% matched!")

    # 3. Create BACKUP-INFO.txt
    backup_info_path = BACKUP_DEST / "BACKUP-INFO.txt"
    info_content = (
        f"HealthMate AI - Complete Verified Backup\n"
        f"=========================================\n"
        f"Timestamp: {timestamp_str}\n"
        f"Date: {datetime.datetime.now().isoformat()}\n"
        f"Source Project Path: {SOURCE_ROOT}\n"
        f"Backup Destination: {BACKUP_DEST}\n"
        f"\n"
        f"Summary:\n"
        f"- Total Files Backed Up: {len(copied_files)}\n"
        f"- Total Files Verified (SHA-256 / SQLite): {verified_count}\n"
        f"- Total Files Failed: {len(failed_files)}\n"
        f"- Total Excluded Items: {len(skipped_files)}\n"
        f"\n"
        f"Exclusions Applied:\n"
        f"- Directories: {', '.join(sorted(EXCLUDED_DIR_NAMES))}\n"
        f"- File extensions: {', '.join(sorted(EXCLUDED_FILE_EXTENSIONS))}\n"
        f"\n"
        f"Database Verification:\n"
        f"- All SQLite .db files backed up using native atomic backup API.\n"
        f"- 'PRAGMA integrity_check' executed on all backup databases: PASSED (ok)\n"
        f"\n"
        f"Status: COMPLETE & VERIFIED\n"
    )

    with open(backup_info_path, "w", encoding="utf-8") as f:
        f.write(info_content)

    print(f"BACKUP-INFO.txt created at: {backup_info_path}")
    return True

if __name__ == "__main__":
    success = run_backup()
    sys.exit(0 if success else 1)
