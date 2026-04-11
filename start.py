#!/usr/bin/env python3
"""Start all Clarivo dev servers (frontend, backend-ai, backend-data)."""

import subprocess
import signal
import sys
import os

SERVERS = [
    {
        "name": "backend-data",
        "cmd": [sys.executable, "main.py"],
        "cwd": os.path.join(os.path.dirname(__file__), "backend-data"),
        "port": 8002,
    },
    {
        "name": "backend-ai",
        "cmd": [sys.executable, "main.py"],
        "cwd": os.path.join(os.path.dirname(__file__), "backend-ai"),
        "port": 8001,
    },
    {
        "name": "frontend",
        "cmd": ["npm", "run", "dev"],
        "cwd": os.path.join(os.path.dirname(__file__), "frontend"),
        "port": 3000,
    },
]

processes = []


def shutdown(signum=None, frame=None):
    print("\nShutting down all servers...")
    for name, proc in processes:
        try:
            proc.terminate()
            print(f"  Stopped {name}")
        except Exception:
            pass
    sys.exit(0)


signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)


def main():
    print("Starting Clarivo dev servers...\n")

    for server in SERVERS:
        print(f"  Starting {server['name']} on port {server['port']}...")
        proc = subprocess.Popen(
            server["cmd"],
            cwd=server["cwd"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        processes.append((server["name"], proc))

    print("\nAll servers running:")
    print("  frontend       -> http://localhost:3000")
    print("  backend-ai     -> http://localhost:8001")
    print("  backend-data   -> http://localhost:8002")
    print("\nPress Ctrl+C to stop all.\n")

    # Stream output from all processes
    import selectors

    sel = selectors.DefaultSelector()
    for name, proc in processes:
        sel.register(proc.stdout, selectors.EVENT_READ, name)

    try:
        while True:
            for key, _ in sel.select(timeout=1):
                line = key.fileobj.readline()
                if line:
                    print(f"[{key.data}] {line.decode(errors='replace')}", end="")
                else:
                    sel.unregister(key.fileobj)
            # Check if any process died
            for name, proc in processes:
                if proc.poll() is not None:
                    print(f"\n[{name}] exited with code {proc.returncode}")
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
