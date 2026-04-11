#!/usr/bin/env python3
"""Start all Clarivo dev servers (frontend, backend-ai, backend-data)."""

import subprocess
import signal
import sys
import os
import time
import requests

root_dir = os.path.dirname(__file__)

SERVERS = [
    {
        "name": "backend-data",
        "cmd": [sys.executable, "main.py"],
        "cwd": os.path.join(root_dir, "backend-data"),
        "port": 8002,
        "health_url": "http://localhost:8002/health",
        "wait_for_startup": True,
    },
    {
        "name": "backend-ai",
        "cmd": [sys.executable, "main.py"],
        "cwd": os.path.join(root_dir, "backend-ai"),
        "port": 8001,
        "health_url": "http://localhost:8001/health",
        "wait_for_startup": True,
    },
    {
        "name": "frontend",
        "cmd": ["npm", "run", "dev"],
        "cwd": os.path.join(root_dir, "frontend"),
        "port": 3000,
        "health_url": None,
        "wait_for_startup": False,
    },
]

processes = []


def shutdown(signum=None, frame=None):
    print("\nShutting down all servers...")
    for name, proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=5)
            print(f"  Stopped {name}")
        except Exception:
            try:
                proc.kill()
            except:
                pass
    sys.exit(0)


signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)


def ensure_npm_dependencies():
    """Ensure npm dependencies are installed and build cache is clean."""
    frontend_dir = os.path.join(root_dir, "frontend")
    node_modules = os.path.join(frontend_dir, "node_modules")
    tailwindcss_path = os.path.join(node_modules, "tailwindcss")
    next_cache = os.path.join(frontend_dir, ".next")

    # Clean Next.js build cache to fix module resolution issues
    if os.path.exists(next_cache):
        import shutil
        print("Cleaning Next.js build cache...")
        try:
            shutil.rmtree(next_cache)
        except Exception as e:
            print(f"Warning: Could not clean .next: {e}")

    # Check if tailwindcss specifically is installed
    if not os.path.exists(tailwindcss_path):
        print("Installing frontend dependencies...")

        # First try standard npm install
        result = subprocess.run(
            ["npm", "install"],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
        )

        # If it fails or tailwindcss still missing, try with legacy peer deps
        if result.returncode != 0 or not os.path.exists(tailwindcss_path):
            print("Retrying with --legacy-peer-deps flag...")
            result = subprocess.run(
                ["npm", "install", "--legacy-peer-deps"],
                cwd=frontend_dir,
                capture_output=True,
                text=True,
            )

        if result.returncode != 0:
            print(f"npm install failed:")
            print(result.stdout)
            print(result.stderr)
            return False

        if not os.path.exists(tailwindcss_path):
            print("Error: tailwindcss still not installed after npm install")
            return False

        print("Frontend dependencies installed.\n")
    return True


def wait_for_service(url, timeout=30, interval=0.5):
    """Wait for a service to be ready."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            response = requests.get(url, timeout=1)
            if response.status_code == 200:
                return True
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            time.sleep(interval)
    return False


def main():
    print("Starting Clarivo dev servers...\n")

    # Check npm dependencies first
    if not ensure_npm_dependencies():
        sys.exit(1)

    # Start servers with health check
    for server in SERVERS:
        print(f"Starting {server['name']} on port {server['port']}...")

        env = os.environ.copy()
        proc = subprocess.Popen(
            server["cmd"],
            cwd=server["cwd"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env=env,
        )
        processes.append((server["name"], proc))

        # Wait for service to be ready
        if server["wait_for_startup"] and server["health_url"]:
            print(f"  Waiting for {server['name']} to be ready...")
            if wait_for_service(server["health_url"]):
                print(f"  ✓ {server['name']} is ready\n")
            else:
                print(f"  ⚠ {server['name']} did not respond (continuing anyway)\n")

    print("=" * 60)
    print("All servers running:")
    print("  frontend       -> http://localhost:3000")
    print("  backend-ai     -> http://localhost:8001")
    print("  backend-data   -> http://localhost:8002")
    print("=" * 60)
    print("Press Ctrl+C to stop all.\n")

    # Stream output from all processes
    import selectors

    sel = selectors.DefaultSelector()
    for name, proc in processes:
        if proc.stdout:
            sel.register(proc.stdout, selectors.EVENT_READ, name)

    try:
        while True:
            for key, _ in sel.select(timeout=1):
                try:
                    line = key.fileobj.readline()
                    if line:
                        print(f"[{key.data}] {line}", end="")
                    else:
                        sel.unregister(key.fileobj)
                except Exception:
                    pass

            # Check if any process died
            for name, proc in processes:
                if proc.poll() is not None:
                    print(f"\n⚠ [{name}] exited with code {proc.returncode}")
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
