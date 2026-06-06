#!/usr/bin/env python3
"""Seed demo writing assessment via real API — LLM chấm thật. Uses VSTEP Practice Test 1."""

import json, subprocess, sys, time, urllib.error, urllib.request

BASE = "http://127.0.0.1:8000/api/v1"
EMAIL = "learner@vstep.test"
PASSWORD = "password"
EXAM_ID = "019da080-5445-70bb-8182-4516af651a77"  # VSTEP Practice Test 1 (slug=vstep-demo-1)

# B2 responses matching the prompts of VSTEP Practice Test 1:
#   Part 1: letter thanking manager for training course
#   Part 2: essay about technology pros/cons

LETTER = """Dear Mr. Johnson,

I am writing to express my sincere gratitude for the opportunity to attend the Business Communication training course last week. The experience was both valuable and eye-opening.

During the three-day programme, I learned several practical techniques for writing clear professional emails, managing difficult conversations with clients, and delivering concise presentations. The role-play exercises with real business scenarios were particularly helpful because they gave me immediate feedback on my communication style. I have already started applying the email structuring method to my daily correspondence, and I can see a noticeable improvement in response rates from our partners.

If I may suggest one improvement, it would be helpful to include more case studies from our specific industry rather than generic examples. A follow-up session in six months would also help reinforce the skills we learned.

Thank you again for investing in my professional development.

Yours sincerely,
Minh Nguyen"""

ESSAY = """In recent decades, technology has transformed nearly every aspect of our lives, from how we work to how we communicate and entertain ourselves. While many people argue that these changes have made life significantly easier, others believe that technology has introduced new sources of stress and complication. This essay will examine both perspectives before presenting my own view.

On the one hand, technology has undeniably improved convenience and efficiency in daily life. Smartphones allow us to stay connected with family and colleagues regardless of distance, while the internet provides instant access to information that once required hours in a library. In the workplace, automation tools have reduced the time needed for repetitive tasks such as data entry and scheduling, freeing employees to focus on more creative work. Furthermore, medical technology has extended life expectancy and improved the quality of care through early diagnosis and minimally invasive procedures.

On the other hand, critics point to several negative consequences of rapid technological advancement. The constant connectivity enabled by smartphones and social media can lead to burnout, as employees feel pressure to respond to messages outside working hours. Privacy concerns have also grown, with personal data being collected and monetised on an unprecedented scale. Moreover, automation threatens job security in many sectors, creating anxiety among workers who fear being replaced by machines.

In my opinion, while technology does create genuine challenges, the benefits outweigh the drawbacks when used thoughtfully. The key lies not in rejecting technology but in developing healthier relationships with it. For example, companies can establish clear boundaries around after-hours communication, and individuals can practise digital detoxes on weekends. Governments also have a role to play in regulating data privacy and supporting workers through retraining programmes.

In conclusion, technology has made life both easier and more complex. The challenge for society is to harness its advantages while minimising its harmful effects through sensible policies and personal discipline."""


def api(method, path, token=None, payload=None, timeout=60):
    url = path if path.startswith("http") else BASE + path
    h = {"Accept": "application/json"}
    if payload is not None:
        h["Content-Type"] = "application/json"
        data = json.dumps(payload).encode()
    else:
        data = None
    if token:
        h["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise SystemExit(f"{method} {path} -> {e.code}: {body[:800]}")


def wc(text):
    return len(text.split())


# 1. Login
print("1. Login demo learner")
_, login = api("POST", "/auth/login", payload={"email": EMAIL, "password": PASSWORD})
token = login["data"]["access_token"]
print(f"   ok")

# 2. Start writing-only session
print("2. Start writing session on VSTEP Practice Test 1")
_, sess = api("POST", f"/exams/{EXAM_ID}/sessions", token=token,
              payload={"mode": "custom", "selected_skills": ["writing"]})
session_id = sess["data"]["session_id"]
print(f"   session_id={session_id}")

# 3. Get room to discover writing task IDs
print("3. Load exam room")
_, room = api("GET", f"/exam-sessions/{session_id}/room", token=token)
tasks = sorted(room["data"]["version"]["writing_tasks"], key=lambda t: t["part"])
for t in tasks:
    print(f"   part={t['part']}  task_id={t['id']}  prompt={t['prompt'][:70]}...")

# 4. Submit
print("4. Submit writing answers")
answers = []
for t in tasks:
    text = LETTER if t["part"] == 1 else ESSAY
    answers.append({"task_id": t["id"], "text": text, "word_count": wc(text)})
_, sub = api("POST", f"/exam-sessions/{session_id}/submit", token=token,
             payload={"writing_answers": answers})
jobs = sub["data"]["writing_jobs"]
for j in jobs:
    print(f"   job_id={j['job_id']}  attempt_id={j['attempt_id']}")

# 5. Process
print("5. Run queue worker")
for attempt in range(3):
    rc = subprocess.run(
        ["php", "artisan", "queue:work", "--once", "--timeout=240", "--tries=1", "--queue=default"],
        cwd=".", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=270
    ).returncode
    print(f"   attempt {attempt+1}: rc={rc}")
    if rc == 0:
        break
    time.sleep(2)

# 6. Poll
print("6. Poll results")
for j in jobs:
    jid = j["job_id"]
    for _ in range(20):
        _, jd = api("GET", f"/assessment-jobs/{jid}", token=token, timeout=30)
        st = jd["data"]["status"]
        if st in ("ready", "failed"):
            break
        time.sleep(4)

    if st == "ready":
        s = jd["data"]["scores"]
        print(f"\n   job={jid[:8]}...  band={s['overall_band']}  status={s['display']['status']}")
        print(f"   criteria: { {r['key']: r['score'] for r in s['criterion_scores']} }")
        d = s["diagnostics"]["summary"]
        print(f"   words={d['word_count']}  grammar_errors={d['grammar_error_count']}  unique_ratio={d['unique_ratio']}")
        fb = s["feedback"]
        print(f"   strengths={len(fb['strengths'])}  improvements={len(fb['improvements'])}")
    else:
        print(f"\n   job={jid[:8]}...  FAILED: {jd['data'].get('error','?')}")

# 7. Session results
print("\n7. Session results")
_, sr = api("GET", f"/exam-sessions/{session_id}/results", token=token)
for fb in sr["data"]["writing_feedback"]:
    print(f"   task={fb['task_id'][:8]}...  band={fb['overall_band']}  score={fb['score_status']}  feedback={fb['feedback_status']}")
