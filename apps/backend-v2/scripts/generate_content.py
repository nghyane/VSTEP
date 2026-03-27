"""
Generate reading passages and listening audio for VSTEP seed data.
Uses OpenAI for text generation and edge-tts for audio synthesis.
"""

import asyncio
import json
import os
import subprocess
from pathlib import Path

import edge_tts

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "database" / "seeders" / "data" / "questions"
AUDIO_DIR = BASE / "storage" / "app" / "listening"

# Voices for listening audio
VOICES = {
    "announcer": "en-US-GuyNeural",
    "male": "en-US-GuyNeural", 
    "female": "en-US-JennyNeural",
    "lecturer": "en-US-BrianNeural",
}


def generate_reading_passages():
    """Add passage text to reading questions using group context."""
    path = DATA / "reading.json"
    questions = json.loads(path.read_text())

    # Group by level+part (each group shares one passage)
    groups = {}
    for i, q in enumerate(questions):
        key = f"{q['level']}/P{q['part']}"
        groups.setdefault(key, []).append(i)

    passages = {
        "A2/P1": (
            "Greenfield Primary School — Spring Fair\n\n"
            "Dear Parents and Students,\n\n"
            "We are delighted to announce our annual Spring Fair on Saturday, 15 March, "
            "from 10:00 AM to 3:00 PM at the school playground. The event is free for all families. "
            "There will be games, food stalls, a book sale, and a talent show. "
            "The principal, Mrs. Johnson, invites everyone to come and enjoy the day. "
            "If you would like to help or need more information, please send an email to "
            "springfair@greenfield.edu. We look forward to seeing you there!"
        ),
        "B1/P1": (
            "Eating Well on a Student Budget\n\n"
            "Many students struggle to eat healthily because of their busy schedules and limited budgets. "
            "However, making small changes can have a big impact on your health. According to nutritionists, "
            "the most important step is to reduce processed food and eat more fresh vegetables and fruits. "
            "Cooking simple meals at home is not only cheaper but also more nutritious than eating out. "
            "Some students believe that organic food can cure diseases, but this is not supported by scientific evidence. "
            "The detrimental effects of a poor diet include low energy, difficulty concentrating, and long-term health problems. "
            "Exercise and good sleep also play important roles in staying healthy. "
            "This advice comes from a popular health magazine aimed at young adults."
        ),
        "B1/P2": (
            "Traffic Congestion in Modern Cities\n\n"
            "Traffic congestion has become one of the most serious problems affecting the quality of life in many cities. "
            "The primary cause is the rapid increase in car ownership, as more families can now afford private vehicles. "
            "The author takes a critical view of the current situation, arguing that governments have failed to act quickly enough. "
            "One promising solution is investing in public transport systems such as metro lines and bus rapid transit. "
            "Research shows that improving public transport can alleviate congestion by encouraging people to leave their cars at home. "
            "While no city has found a perfect solution, experts agree that the problem will only get worse without significant action. "
            "Some cities have already seen positive results from expanding their public transport networks."
        ),
        "B2/P2": (
            "The Remote Work Revolution\n\n"
            "The shift to remote work, accelerated by the global pandemic, has fundamentally transformed the modern workplace. "
            "Research cited by leading business schools indicates that remote workers generally report higher job satisfaction "
            "compared to their office-based counterparts, largely due to greater flexibility and reduced commuting time.\n\n"
            "However, the transition has proven to be a double-edged sword. While companies benefit from reduced overhead costs "
            "and access to a global talent pool, concerns about employee isolation and diminished team cohesion have emerged. "
            "Several studies acknowledge that remote work increases isolation, particularly for workers living alone.\n\n"
            "Looking ahead, most analysts predict that hybrid models will become standard, combining the flexibility of remote work "
            "with the collaborative benefits of office time. The word 'paramount' in describing work-life balance reflects its "
            "essential importance in this new paradigm. Organizations that fail to adapt risk losing their most talented employees "
            "to more progressive competitors."
        ),
        "B2/P3": (
            "Rethinking Education: Lessons from Finland\n\n"
            "Finland's education system has been widely praised as one of the most successful in the world. "
            "The author uses the example of Finland to illustrate how educational reform can lead to remarkable results "
            "without relying on standardized testing or excessive homework.\n\n"
            "The passage suggests that standardized testing has significant limitations, as it often fails to measure "
            "creativity, critical thinking, and social skills — qualities that are equally important for success in life. "
            "Critics of the current system describe it as a 'one-size-fits-all approach' — a universal but inflexible solution "
            "that ignores the diverse needs and talents of individual students.\n\n"
            "The fourth paragraph argues that balance is needed in policy-making: technology should complement traditional teaching, "
            "not replace it. The conclusion implies that more research is needed to understand how these principles "
            "can be adapted to different cultural and economic contexts."
        ),
        "C1/P4": (
            "Cross-Cultural Dimensions of Decision-Making\n\n"
            "The researcher's primary argument is that cultural context shapes decision-making processes in ways that "
            "traditional economic models fail to capture. Drawing on interdisciplinary perspectives from psychology, "
            "anthropology, and behavioral economics, the study challenges the assumption that cognitive biases operate "
            "uniformly across populations.\n\n"
            "The study's methodology has been criticized for relying on self-reported data, which may be subject to "
            "social desirability bias and cultural differences in response patterns. Nevertheless, the findings offer "
            "compelling evidence that what constitutes 'rational' decision-making varies significantly across cultures.\n\n"
            "The term 'epistemic humility' as used in the text refers to acknowledging the limits of one's knowledge — "
            "a quality the author argues is essential for cross-cultural research. What distinguishes the author's approach "
            "from earlier studies is that it incorporates interdisciplinary perspectives, moving beyond the narrow lens "
            "of any single academic discipline.\n\n"
            "The passage implies that future research should explore cross-cultural dimensions more thoroughly, "
            "particularly in non-Western contexts that remain underrepresented in the literature."
        ),
    }

    for key, indices in groups.items():
        passage = passages.get(key, "")
        if passage:
            for idx in indices:
                questions[idx]["content"]["passage"] = passage

    path.write_text(json.dumps(questions, indent=4, ensure_ascii=False))
    print(f"Reading: updated {len(questions)} questions with passages")


def generate_listening_scripts():
    """Add scripts to listening questions and return audio generation tasks."""
    path = DATA / "listening.json"
    questions = json.loads(path.read_text())

    groups = {}
    for i, q in enumerate(questions):
        key = f"{q['level']}/P{q['part']}"
        groups.setdefault(key, []).append(i)

    scripts = {
        # Part 1: Announcements (1 speaker)
        "A2/P1": {
            "type": "announcement",
            "script": (
                "Attention please. This is an announcement for all passengers at the airport. "
                "Flight BA two forty-five to London has been delayed by approximately twenty minutes. "
                "Please check the departure screen for updated information. "
                "The gift shop on the second floor will close at seven PM today instead of the usual time. "
                "This message is for hotel guests: breakfast will be served from six thirty to nine thirty. "
                "Thank you for your attention."
            ),
        },
        "B1/P1": {
            "type": "announcement",
            "script": (
                "Good morning, everyone. Welcome to the annual technology conference. "
                "The purpose of this announcement is to inform you about a policy change regarding registration. "
                "All visitors should register at the reception desk before entering the main hall. "
                "Please note that the opening ceremony will begin in fifteen minutes. "
                "We would also like to announce that the conference schedule has changed. "
                "New opening hours for the exhibition area are from nine AM to six PM. "
                "Thank you for your cooperation."
            ),
        },
        "B2/P1": {
            "type": "announcement",
            "script": (
                "This is an important announcement regarding a safety regulation update that will affect all departments. "
                "The new policy will require additional staff training on emergency procedures. "
                "We have been experiencing some technical difficulties with the building's fire alarm system, "
                "which our maintenance team is currently working to resolve. "
                "According to the updated guidelines, all employees should submit their safety compliance reports by Friday. "
                "As you may be aware, the organization is expanding rapidly, "
                "and these measures are essential to maintaining our safety standards. "
                "Further details will be provided in next week's departmental meetings."
            ),
        },
        # Part 2: Conversations (2 speakers)
        "A2/P2": {
            "type": "conversation",
            "script": [
                ("male", "Hi Sarah! What are you doing this weekend? I was thinking about our holiday plan."),
                ("female", "Oh, I'd love to go somewhere! But first, I need to figure out how to get to work tomorrow. I think I'll take the car."),
                ("male", "Good idea. Hey, what should we do for dinner tonight? I suggest going to that new restaurant on Main Street."),
                ("female", "I'm a bit upset actually. I missed the bus this morning and was late for everything."),
                ("male", "Oh no! Well, don't worry. Let me check the map for a better route for you."),
                ("female", "Thanks! By the way, I need to go to the shop later. I want to buy some new shoes."),
                ("male", "Sure. Shall we meet Tuesday afternoon to discuss the holiday details?"),
                ("female", "Perfect! Tuesday afternoon works for me."),
            ],
        },
        "B1/P2": {
            "type": "conversation",
            "script": [
                ("male", "So, have you heard back from the job interview yet?"),
                ("female", "Not yet. I'm a new employee here, so I'm still learning the ropes."),
                ("male", "I see. By the way, about the Johnson project — it needs more funding if we want to finish on time."),
                ("female", "I know, that's my concern too. The deadline is too tight for the current budget."),
                ("male", "I disagree about hiring more people though. I think it's too expensive. We should find another way."),
                ("female", "What do you think we should do next then?"),
                ("male", "Let's check the schedule first and see where we can save time. I'm a bit skeptical about the new proposal, to be honest."),
                ("female", "Fair enough. But we both agree we need more data before making any decisions, right?"),
                ("male", "Absolutely. Let's gather the numbers first."),
            ],
        },
        "B2/P2": {
            "type": "conversation",
            "script": [
                ("female", "I've been reviewing the environmental impact assessment for the new policy. It's the primary concern we need to address."),
                ("male", "I agree. But what about the previous approach? I think it lacked proper planning, which is why it failed."),
                ("female", "That's true. I suggest we conduct more research before committing to any specific plan."),
                ("male", "The main challenge we're facing is internal disagreements about the direction we should take."),
                ("female", "Well, I think the woman — I mean, I'm more optimistic than you about this. The data shows promise."),
                ("male", "Perhaps. But we can conclude that we need a more unified approach. What should our next step be?"),
                ("female", "I think gathering stakeholder feedback is essential. We need to hear from everyone affected."),
                ("male", "Agreed. Let's set up those meetings this week."),
            ],
        },
        # Part 3: Lectures (1 speaker)
        "B1/P3": {
            "type": "lecture",
            "script": (
                "Good afternoon, class. Today we'll be discussing modern education methods "
                "and how they are changing the way students learn around the world. "
                "According to research, the biggest challenge facing education systems today "
                "is the lack of trained teachers, particularly in developing countries. "
                "Let me give you an example. Finland is often mentioned as a model of educational reform. "
                "The Finnish system focuses on teacher quality rather than standardized testing. "
                "So what should be done? Many experts suggest we should invest in teacher training "
                "as the most effective way to improve education outcomes. "
                "My tone today is optimistic because I believe positive changes are happening. "
                "Now, regarding technology in education — it is best viewed as a useful supplement "
                "to traditional teaching, not a replacement for qualified teachers. "
                "Any questions?"
            ),
        },
        "B2/P3": {
            "type": "lecture",
            "script": (
                "In today's lecture, we'll examine the relationship between urbanization and public health, "
                "a topic that has gained increasing attention in recent years. "
                "Research consistently shows that urbanization has led to increased mental health issues, "
                "particularly among young adults living in densely populated areas. "
                "According to the data presented in our textbook, population density and pollution "
                "show the strongest correlation among the variables studied. "
                "I want to criticize the current approach to urban planning because it focuses too much "
                "on short-term solutions rather than addressing the root causes of these health problems. "
                "My recommendation is implementing green space requirements in all new urban developments. "
                "A fascinating study mentioned in your reading materials found that "
                "access to parks reduces stress levels significantly — by up to forty percent "
                "in some populations. This has important implications for how we design our cities going forward."
            ),
        },
        "C1/P3": {
            "type": "lecture",
            "script": (
                "Welcome to our seminar on globalization and cultural identity. "
                "My main thesis today is that globalization has fundamentally altered cultural identity "
                "in ways that are far more complex than simple homogenization theories suggest. "
                "Consider the concept of glocalization — this refers to global companies adapting products "
                "to local markets, creating hybrid cultural forms that are neither purely global nor purely local. "
                "Take Japanese cuisine as an example. It beautifully illustrates the adaptation of foreign elements "
                "into local traditions — ramen, originally Chinese, has become quintessentially Japanese. "
                "Now, I must raise a criticism about previous research in this field. "
                "Much of the earlier work generalized findings from limited samples, "
                "typically focusing on Western consumer cultures while ignoring the rich diversity "
                "of cultural responses in other parts of the world. "
                "The most significant implication of our analysis is the need for new theoretical frameworks "
                "that can accommodate the complexity of cultural exchange in the twenty-first century."
            ),
        },
    }

    audio_tasks = []
    for key, indices in groups.items():
        info = scripts.get(key)
        if not info:
            continue
        
        audio_filename = f"{questions[indices[0]]['level'].lower()}_part{questions[indices[0]]['part']}.wav"
        audio_path = f"listening/{audio_filename}"

        for idx in indices:
            questions[idx]["content"]["script"] = info["script"] if isinstance(info["script"], str) else [
                {"speaker": s, "text": t} for s, t in info["script"]
            ]
            questions[idx]["content"]["audio_path"] = audio_path

        audio_tasks.append({
            "key": key,
            "type": info["type"],
            "script": info["script"],
            "filename": audio_filename,
        })

    path.write_text(json.dumps(questions, indent=4, ensure_ascii=False))
    print(f"Listening: updated {len(questions)} questions with scripts")
    return audio_tasks


async def generate_audio(tasks):
    """Generate audio files using edge-tts."""
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    for task in tasks:
        output = AUDIO_DIR / task["filename"]
        print(f"  Generating {task['key']} → {task['filename']}...", end=" ")
        
        if task["type"] == "conversation":
            # Multi-speaker: generate each line, concat
            parts = []
            for i, (speaker, text) in enumerate(task["script"]):
                part_file = AUDIO_DIR / f"_part_{i}.mp3"
                voice = VOICES[speaker]
                comm = edge_tts.Communicate(text, voice, rate="-5%")
                await comm.save(str(part_file))
                parts.append(str(part_file))
            
            # Concat with ffmpeg
            list_file = AUDIO_DIR / "_concat.txt"
            list_file.write_text("\n".join(f"file '{p}'" for p in parts))
            subprocess.run(
                ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
                 "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le", str(output)],
                capture_output=True,
            )
            # Cleanup
            for p in parts:
                os.remove(p)
            list_file.unlink()
        else:
            # Single speaker
            voice = VOICES.get(task["type"], VOICES["announcer"])
            mp3_file = AUDIO_DIR / f"_temp.mp3"
            comm = edge_tts.Communicate(task["script"], voice, rate="-5%")
            await comm.save(str(mp3_file))
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(mp3_file),
                 "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le", str(output)],
                capture_output=True,
            )
            mp3_file.unlink()
        
        size_kb = output.stat().st_size / 1024
        print(f"{size_kb:.0f}KB")


async def main():
    print("=== Generating Reading Passages ===")
    generate_reading_passages()
    
    print("\n=== Generating Listening Scripts ===")
    audio_tasks = generate_listening_scripts()
    
    print(f"\n=== Generating {len(audio_tasks)} Audio Files ===")
    await generate_audio(audio_tasks)
    
    print("\n=== Done ===")


if __name__ == "__main__":
    asyncio.run(main())
