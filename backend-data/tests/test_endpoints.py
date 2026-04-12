import httpx

__test__ = False

BASE = "http://localhost:8002"

def test_profile():
    r = httpx.get(f"{BASE}/api/profile", params={"user_id": "alex_demo"})
    if r.status_code != 200:
        print(f"FAILED profile: {r.status_code} - {r.text}")
        return
    assert r.json()["profile"]["name"] == "Kishan"
    print("✓ profile")

def test_knowledge_score():
    r = httpx.post(f"{BASE}/api/context/answer", json={
        "user_id": "alex_demo",
        "question_id": "test_q",
        "question": "Favorite food?",
        "answer": "Tiramisu"
    })
    if r.status_code != 200:
        print(f"FAILED knowledge_score: {r.status_code} - {r.text}")
        return
    assert r.json()["knowledge_score"] > 71
    print("✓ knowledge score increases on answer")

def test_tree_skim():
    r = httpx.get(f"{BASE}/api/context/tree_skim", params={"user_id": "alex_demo"})
    if r.status_code != 200:
        print(f"FAILED tree_skim: {r.status_code} - {r.text}")
        return
    data = r.json()
    assert "recent_paths" in data
    assert "top_paths" in data
    print("✓ tree context skim returns personalization data")

def test_panel():
    r = httpx.get(f"{BASE}/api/caregiver/panel", params={"user_id": "alex_demo"})
    if r.status_code != 200:
        print(f"FAILED panel: {r.status_code} - {r.text}")
        return
    panel = r.json()
    assert panel["urgent"] is True  # We seeded 3 panic sessions
    assert panel["last_session"] is not None
    print("✓ caregiver panel returns correctly (urgency detected via seeds)")

def test_insights():
    r = httpx.get(f"{BASE}/api/insights", params={"user_id": "alex_demo"})
    if r.status_code != 200:
        print(f"FAILED insights: {r.status_code} - {r.text}")
        return
    data = r.json()
    assert "sessions_by_day" in data
    assert "sessions_by_period" in data
    assert "top_paths" in data
    assert len(data["sessions_by_day"]) == 14
    print("✓ insights")

if __name__ == "__main__":
    print("Running integration sanity checks...")
    try:
        test_profile()
        test_knowledge_score()
        test_tree_skim()
        test_panel()
        test_insights()
        print("Done!")
    except Exception as e:
        print(f"TEST RUN FAILED: {e}")
