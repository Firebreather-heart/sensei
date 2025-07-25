#!/usr/bin/env python3
"""
Test runner script for Sensei Code Sharing Platform
"""

import sys
import subprocess
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def run_tests():
    """Run all tests with coverage"""

    print("🧪 Running Sensei Test Suite...")
    print("=" * 50)

    # Install test dependencies if needed
    try:
        import pytest
        import httpx
        import coverage
    except ImportError:
        print("📦 Installing test dependencies...")
        subprocess.run([
            sys.executable, "-m", "pip", "install",
            "pytest", "httpx", "pytest-asyncio", "coverage", "pytest-cov"
        ])

    # Run tests with coverage
    test_commands = [
        # Run tests with coverage
        [
            sys.executable, "-m", "pytest",
            "tests/",
            "-v",
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term",
            "--asyncio-mode=auto"
        ],

        # Run specific test categories
        [
            sys.executable, "-m", "pytest",
            "tests/test_auth.py",
            "-v",
            "--asyncio-mode=auto"
        ],

        [
            sys.executable, "-m", "pytest",
            "tests/test_filesystem.py",
            "-v",
            "--asyncio-mode=auto"
        ],

        [
            sys.executable, "-m", "pytest",
            "tests/test_integration.py",
            "-v",
            "--asyncio-mode=auto"
        ]
    ]

    for i, cmd in enumerate(test_commands):
        print(f"\n🚀 Running test command {i+1}/{len(test_commands)}...")
        print(f"Command: {' '.join(cmd)}")

        result = subprocess.run(cmd, cwd=project_root)

        if result.returncode != 0:
            print(
                f"❌ Test command {i+1} failed with exit code {result.returncode}")
            return False
        else:
            print(f"✅ Test command {i+1} passed!")

    print("\n🎉 All tests completed successfully!")
    print("\n📊 Coverage report generated in htmlcov/index.html")
    return True


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
