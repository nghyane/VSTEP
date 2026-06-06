#!/usr/bin/env python3
"""Seed 1 full exam session for demo learner via real API — MCQ sync, Writing/Speaking LLM thật."""

import json, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:8000/api/v1"
EMAIL = "learner@vstep.test"
PASSWORD = "password"
EXAM_ID = sys.argv[1] if len(sys.argv) > 1 else "019da080-5445-70bb-8182-4516af651a77"  # default: VSTEP Practice Test 1
AUDIO_BASE = Path("/var/folders/x1/r04qqrfx21n5ty0tpj5dcydw0000gn/T/opencode")
AUDIO_FILES = {1: AUDIO_BASE / "speaking-part1.wav", 2: AUDIO_BASE / "speaking-part2.wav", 3: AUDIO_BASE / "speaking-part3.wav"}

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
    data = None
    if payload is not None:
        h["Content-Type"] = "application/json"
        data = json.dumps(payload).encode()
    if token:
        h["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise SystemExit(f"{method} {path} -> {e.code}: {body[:500]}")


def wc(text):
    return len(text.split())


def run_worker():
    for _ in range(5):
        rc = subprocess.run(
            ["php", "artisan", "queue:work", "--once", "--timeout=240", "--tries=1", "--queue=default"],
            cwd=".", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=270,
        ).returncode
        if rc != 0:
            break
    return True


def upload_audio(token, profile_id, part):
    """Presign upload → PUT WAV to R2 → return audio_key."""
    _, presign = api("POST", "/audio/presign-upload", token=token, payload={
        "context": "exam_speaking", "content_type": "audio/wav", "extension": "wav",
    })
    upload_url = presign["data"]["upload_url"]
    audio_key = presign["data"]["audio_key"]
    audio_path = AUDIO_FILES[part]
    audio_bytes = audio_path.read_bytes()
    req = urllib.request.Request(upload_url, data=audio_bytes, headers={"Content-Type": "audio/wav"}, method="PUT")
    with urllib.request.urlopen(req, timeout=120) as r:
        pass
    assert r.status == 200, f"Upload failed: {r.status}"
    return audio_key


def poll_job(token, job_id, label, timeout_sec=240):
    """Poll until ready or failed."""
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            _, jd = api("GET", f"/assessment-jobs/{job_id}", token=token, timeout=30)
        except SystemExit:
            time.sleep(4)
            continue
        st = jd["data"]["status"]
        if st == "ready":
            s = jd["data"]["scores"]
            return {"job": job_id[:8], "label": label, "status": "ready",
                    "band": s["overall_band"], "display": s["display"]["status"],
                    "criteria": {r["key"]: r["score"] for r in s["criterion_scores"]},
                    "word_count": s["diagnostics"]["summary"]["word_count"],
                    "strengths": len(s["feedback"]["strengths"]),
                    "improvements": len(s["feedback"]["improvements"])}
        if st == "failed":
            return {"job": job_id[:8], "label": label, "status": "failed",
                    "error": jd["data"].get("error", "?")}
        time.sleep(4)
    return {"job": job_id[:8], "label": label, "status": "timeout"}


# ── 1. Login ──
print("1. Login")
_, login = api("POST", "/auth/login", payload={"email": EMAIL, "password": PASSWORD})
token = login["data"]["access_token"]
profile_id = login["data"]["profile"]["id"]

# ── 2. Start full session ──
print("2. Start full exam session")
_, sess = api("POST", f"/exams/{EXAM_ID}/sessions", token=token, payload={"mode": "full"})
session_id = sess["data"]["session_id"]
print(f"   session_id={session_id}")

# ── 3. Load room ──
print("3. Load exam room")
_, room = api("GET", f"/exam-sessions/{session_id}/room", token=token)
version = room["data"]["version"]
listening_items = []
for sec in version.get("listening_sections", []):
    for item in sec.get("items", []):
        item["_ref_type"] = "exam_listening_item"
        listening_items.append(item)
reading_items = []
for psg in version.get("reading_passages", []):
    for item in psg.get("items", []):
        item["_ref_type"] = "exam_reading_item"
        reading_items.append(item)
writing_tasks = sorted(version["writing_tasks"], key=lambda t: t["part"])
speaking_parts = sorted(version["speaking_parts"], key=lambda p: p["part"])
print(f"   listening={len(listening_items)}  reading={len(reading_items)}  writing={len(writing_tasks)}  speaking={len(speaking_parts)}")

# ── 4. Upload speaking audio (3 parts with different content) ──
print("4. Upload speaking audio for all parts (Edge TTS B2 responses)")
AUDIO_DURATIONS = {1: 48, 2: 68, 3: 80}
audio_keys = {}
for sp in speaking_parts:
    key = upload_audio(token, profile_id, sp["part"])
    audio_keys[sp["part"]] = key
    print(f"   part {sp['part']}: {key[:40]}... ({AUDIO_DURATIONS[sp['part']]}s)")

# ── 5. Submit full exam ──
print("5. Submit exam with MCQ + Writing + Speaking")
mcq_answers = []
for item in listening_items:
    mcq_answers.append({"item_ref_type": item["_ref_type"], "item_ref_id": item["id"], "selected_index": item.get("correct_index", 0)})
for item in reading_items:
    mcq_answers.append({"item_ref_type": item["_ref_type"], "item_ref_id": item["id"], "selected_index": item.get("correct_index", 0)})

writing_answers = []
for t in writing_tasks:
    text = LETTER if t["part"] == 1 else ESSAY
    writing_answers.append({"task_id": t["id"], "text": text, "word_count": wc(text)})

speaking_answers = []
for sp in speaking_parts:
    speaking_answers.append({"part_id": sp["id"], "audio_key": audio_keys[sp["part"]], "duration_seconds": AUDIO_DURATIONS[sp["part"]]})

payload = {"mcq_answers": mcq_answers, "writing_answers": writing_answers, "speaking_answers": speaking_answers}
_, sub = api("POST", f"/exam-sessions/{session_id}/submit", token=token, payload=payload)
mcq = sub["data"]["mcq"]
writing_jobs = sub["data"]["writing_jobs"]
speaking_jobs = sub["data"]["speaking_jobs"]
print(f"   mcq: {mcq['score']}/{mcq['total']}")
print(f"   writing jobs: {len(writing_jobs)}")
print(f"   speaking jobs: {len(speaking_jobs)}")

# ── 6. Process all grading jobs ──
print("6. Process queue workers")
run_worker()
time.sleep(2)
run_worker()

# ── 7. Poll results ──
print("7. Poll results")
all_jobs = (
    [(j["job_id"], f"writing P1") for j in writing_jobs if "1" in str(j.get("task_id",""))[:20] or "6" in str(j.get("submission_id",""))[:20]] +
    [(j["job_id"], f"writing P2") for j in writing_jobs] +
    [(j["job_id"], f"speaking P{i+1}") for i, j in enumerate(speaking_jobs)]
)
# deduplicate
seen = set()
uniq_jobs = []
for jid, label in all_jobs:
    if jid not in seen:
        uniq_jobs.append((jid, label))
        seen.add(jid)
results = [poll_job(token, jid, label) for jid, label in uniq_jobs]
for r in results:
    if r["status"] == "ready":
        print(f"   {r['label']:15s} band={r['band']}  {r['display']}  words={r.get('word_count','?')}  +{r['strengths']} -{r['improvements']}")
    else:
        print(f"   {r['label']:15s} {r['status']}  {r.get('error','')[:80]}")

# ── 8. Fix MCQ answers (correct_index hidden in room) ──
print("8. Fix MCQ answers from DB")
fix_cmd = (
    '$s=App\\Models\\ExamSession::with("mcqAnswers")->find("' + session_id + '");'
    '$items=App\\Models\\ExamVersionListeningItem::whereIn("section_id",function($q)use($s){'
    '$q->select("id")->from("exam_version_listening_sections")->where("exam_version_id",$s->exam_version_id);'
    '})->get();'
    '$rids=App\\Models\\ExamVersionReadingItem::whereIn("passage_id",function($q)use($s){'
    '$q->select("id")->from("exam_version_reading_passages")->where("exam_version_id",$s->exam_version_id);'
    '})->get();'
    '$correct=[];'
    'foreach($items as $i){$correct["exam_listening_item:".$i->id]=$i->correct_index;}'
    'foreach($rids as $i){$correct["exam_reading_item:".$i->id]=$i->correct_index;}'
    '$sc=0;$tc=0;'
    'foreach($s->mcqAnswers as $a){'
    '$k=$a->item_ref_type.":".$a->item_ref_id;'
    '$ans=$correct[$k]??null;'
    'if($ans!==null){$a->update(["selected_index"=>$ans,"is_correct"=>true]);$sc++;}'
    '$tc++;'
    '}'
    'echo $sc."/".$tc."\\n";'
)
subprocess.run(["php", "artisan", "tinker", "--execute", fix_cmd],
               cwd=".", stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30, check=True)
print(f"   fixed")

# ── 9. Session results ──
print("\n9. Session results")
_, sr = api("GET", f"/exam-sessions/{session_id}/results", token=token)
d = sr["data"]
print(f"   score_status={d['summary']['score_status']}  feedback={d['summary']['feedback_status']}")
print(f"   overall band={d['summary']['overall']['band']}  score_on_10={d['summary']['overall']['score_on_10']}")
print(f"   listening={d['session']['scores']['listening']}  reading={d['session']['scores']['reading']}")
print(f"   writing={d['session']['scores']['writing']}  speaking={d['session']['scores']['speaking']}")
