#!/usr/bin/env python3
"""Generate B2-level speaking audio for VSTEP Practice Test 1 using Edge TTS."""

import asyncio, os, sys, edge_tts

OUT = "/var/folders/x1/r04qqrfx21n5ty0tpj5dcydw0000gn/T/opencode"

SCRIPTS = {
    1: """Well, let me tell you about my typical day. I usually wake up around six thirty in the morning because I like to start my day early. After having a light breakfast, I spend about an hour reviewing English vocabulary and grammar before heading to work. In the evenings, I normally go to the gym for about forty-five minutes, then have dinner with my family. We usually watch the news together and discuss current events. As for weekends, I try to balance productivity and relaxation. On Saturday mornings I attend an English speaking club where we practise conversations on various topics. Sunday is my rest day, so I often read books, go for a walk in the park, or meet up with close friends for coffee. I find this routine helps me stay organised while still having time for the things I enjoy.""",

    2: """In my opinion, improving public transport is the best solution to tackle traffic congestion in our city. I believe this approach offers the most long-term benefits compared to the other two options. The main advantage of investing in buses and a metro system is that it can move a large number of people efficiently while reducing the number of private cars on the road. For example, a single metro train can carry hundreds of passengers, which would otherwise require dozens of cars. Additionally, better public transport is more environmentally friendly because it reduces carbon emissions and air pollution. It is also more affordable for residents, especially students and elderly people who may not be able to afford congestion charges or the costs of driving. Of course, there are some disadvantages to consider. Building a metro system requires significant initial investment and may cause disruption during construction. However, I think the long-term benefits far outweigh these short-term challenges. Unlike building more roads, which often encourages more people to drive, improving public transport creates a sustainable solution that benefits everyone in the community.""",

    3: """I would like to discuss the impact of social media on modern society, which I believe has both significant benefits and serious drawbacks. On the positive side, social media has revolutionised the way we communicate and share information. Platforms like Facebook and Instagram allow us to stay connected with family and friends regardless of geographical distance. During the recent pandemic, these tools proved essential for maintaining relationships and accessing important updates. Moreover, social media has given a voice to people who might otherwise go unheard, enabling social movements and community organising on an unprecedented scale. However, we must also acknowledge the negative effects. Research has shown a clear link between heavy social media use and increased rates of anxiety and depression, particularly among young people. The constant comparison with carefully curated online personas can damage self-esteem and create unrealistic expectations. Furthermore, the spread of misinformation on these platforms has become a serious threat to public discourse and even democratic processes. In my view, the key is not to reject social media entirely but to use it more mindfully. Individuals should limit their screen time and verify information before sharing it, while governments and tech companies need to work together to create healthier online environments."""
}

async def generate(part, text, output_path):
    communicate = edge_tts.Communicate(text, "en-US-JennyNeural", rate="+5%")
    await communicate.save(output_path)
    size = os.path.getsize(output_path)
    print(f"  Part {part}: {size//1024}KB  -> {output_path}")

async def main():
    for part in [1, 2, 3]:
        path = f"{OUT}/speaking-part{part}.mp3"
        await generate(part, SCRIPTS[part], path)

asyncio.run(main())
