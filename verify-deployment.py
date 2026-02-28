#!/usr/bin/env python3
"""
Pre-deployment verification script.
Run this before deploying to catch common issues.
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists."""
    if Path(filepath).exists():
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ MISSING {description}: {filepath}")
        return False

def check_directory_exists(dirpath, description):
    """Check if a directory exists."""
    if Path(dirpath).exists() and Path(dirpath).is_dir():
        print(f"✅ {description}: {dirpath}")
        return True
    else:
        print(f"❌ MISSING {description}: {dirpath}")
        return False

def main():
    print("=" * 60)
    print("🔍 SupportDesk AI - Pre-Deployment Verification")
    print("=" * 60)
    print()
    
    issues = []
    
    # Check root structure
    print("📁 Checking project structure...")
    if not check_file_exists("render.yaml", "Render blueprint"):
        issues.append("render.yaml")
    if not check_file_exists("RENDER_DEPLOYMENT.md", "Deployment guide"):
        issues.append("RENDER_DEPLOYMENT.md")
    print()
    
    # Check backend
    print("🐍 Checking backend...")
    if not check_directory_exists("backend", "Backend directory"):
        issues.append("backend/")
    if not check_file_exists("backend/requirements.txt", "Requirements"):
        issues.append("backend/requirements.txt")
    if not check_file_exists("backend/src/api/app.py", "Main app"):
        issues.append("backend/src/api/app.py")
    if not check_directory_exists("backend/models", "Models directory"):
        issues.append("backend/models/")
    if not check_file_exists("backend/models/ticket_model.pkl", "ML Model"):
        issues.append("backend/models/ticket_model.pkl")
    if not check_file_exists("backend/models/tfidf_vectorizer.pkl", "Vectorizer"):
        issues.append("backend/models/tfidf_vectorizer.pkl")
    if not check_file_exists("backend/.env.example", "Backend env example"):
        issues.append("backend/.env.example")
    print()
    
    # Check frontend
    print("⚛️  Checking frontend...")
    if not check_directory_exists("frontend", "Frontend directory"):
        issues.append("frontend/")
    if not check_file_exists("frontend/package.json", "Package.json"):
        issues.append("frontend/package.json")
    if not check_file_exists("frontend/vite.config.ts", "Vite config"):
        issues.append("frontend/vite.config.ts")
    if not check_directory_exists("frontend/src", "Source directory"):
        issues.append("frontend/src/")
    if not check_file_exists("frontend/.env.example", "Frontend env example"):
        issues.append("frontend/.env.example")
    print()
    
    # Check git
    print("📦 Checking git...")
    if check_directory_exists(".git", "Git repository"):
        # Check if there are uncommitted changes
        import subprocess
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                check=True
            )
            if result.stdout.strip():
                print("⚠️  WARNING: You have uncommitted changes")
                print("   Run 'git status' to see them")
            else:
                print("✅ No uncommitted changes")
        except:
            print("⚠️  Could not check git status")
    else:
        issues.append(".git/")
    print()
    
    # Final report
    print("=" * 60)
    if issues:
        print(f"❌ VERIFICATION FAILED - {len(issues)} issue(s) found:")
        for issue in issues:
            print(f"   • {issue}")
        print()
        print("Please fix these issues before deploying.")
        print("=" * 60)
        return 1
    else:
        print("✅ ALL CHECKS PASSED!")
        print()
        print("Next steps:")
        print("1. Commit and push to GitHub")
        print("2. Follow RENDER_DEPLOYMENT.md")
        print("3. Configure environment variables in Render")
        print("=" * 60)
        return 0

if __name__ == "__main__":
    sys.exit(main())
