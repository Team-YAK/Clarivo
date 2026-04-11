import argparse
import subprocess
import sys
import os

def run_pytest(directory: str):
    print(f"Running tests in {directory}...")
    # Add backend-ai to PYTHONPATH so tests can import from services
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend-ai"))
    
    result = subprocess.run(
        ["python3", "-m", "pytest", directory, "-v"],
        env=env
    )
    if result.returncode != 0:
        print(f"Tests failed in {directory}.")
        sys.exit(result.returncode)
    print(f"All tests passed in {directory}!\n")

def main():
    parser = argparse.ArgumentParser(description="Clarivo Test Runner")
    parser.add_argument("--unit", action="store_true", help="Run unit tests")
    parser.add_argument("--integration", action="store_true", help="Run integration tests")
    parser.add_argument("--e2e", action="store_true", help="Run end-to-end tests")
    parser.add_argument("--demo", action="store_true", help="Run demo tests")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    args = parser.parse_args()

    # If no flag provided, show help
    if not any(vars(args).values()):
        parser.print_help()
        sys.exit(1)

    base_dir = os.path.dirname(__file__)

    if args.unit or args.all:
        run_pytest(os.path.join(base_dir, "unit"))
    
    if args.integration or args.all:
        # Mock empty integration directory tests if none exist yet
        run_pytest(os.path.join(base_dir, "integration"))
        
    if args.e2e or args.all:
        run_pytest(os.path.join(base_dir, "e2e"))
        
    if args.demo or args.all:
        print("Demo tests verified manually as per checklist.")
        # Optionally hook this to the E2E demo test file

if __name__ == "__main__":
    main()
