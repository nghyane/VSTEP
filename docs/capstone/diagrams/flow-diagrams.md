# VSTEP Adaptive Learning System - Flow Diagrams

This document contains comprehensive Mermaid diagrams illustrating the core flows and architecture of the VSTEP Adaptive Learning System.

---

## 1. System Architecture Overview

This diagram shows the dual-module architecture (Practice Mode + Mock Test Mode) with AI grading, Human grading, and user roles.

```mermaid
flowchart TB
    subgraph Users["User Roles"]
        learner["Learner<br/>Practice, Mock Tests,<br/>Track Progress"]
        instructor["Instructor<br/>Human Grading,<br/>Student Management"]
        admin["Admin<br/>Content Management,<br/>User Management"]
    end

    subgraph Frontend["Frontend Layer"]
        web["Web Application<br/>React/Next.js"]
        pwa["PWA<br/>Progressive Web App"]
        mobile["Android App<br/>React Native"]
    end

    subgraph Gateway["API Gateway Layer"]
        auth["Authentication<br/>OAuth 2.0 + JWT<br/>Email/Password"]
        rate["Rate Limiting<br/>Request Throttling"]
        load["Load Balancer"]
    end

    subgraph Core["Core Services Layer"]
        practice["Practice Mode<br/>Adaptive Scaffolding<br/>Instant Feedback"]
        mocktest["Mock Test Mode<br/>Timed Simulation<br/>Full Scoring"]
        adaptive["Adaptive Engine<br/>Rule-based Logic<br/>Learning Path Gen"]
        progress["Progress Tracking<br/>Spider Chart<br/>Sliding Window"]
    end

    subgraph Grading["Grading Services Layer"]
        ai["AI Grading Engine<br/>LLM (GPT/Gemini)<br/>Speech-to-Text"]
        human["Human Review<br/>Instructor Portal<br/>Score Override"]
    end

    subgraph Data["Data Layer"]
        db["Database<br/>PostgreSQL/MongoDB<br/>Users, Questions, Progress"]
        cache["Redis Cache<br/>Session, Results<br/>Performance Optimized"]
        storage["Object Storage<br/>Audio Recordings<br/>Essay Submissions"]
    end

    %% Relationships
    Users --> Frontend
    Frontend --> Gateway
    Gateway --> load
    load --> auth
    auth --> rate
    rate --> Core
    Core --> Grading
    Grading --> Data
    
    Core <--> Grading
    practice <--> adaptive
    adaptive <--> progress

    %% Styling
    classDef users fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef gateway fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef core fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef grading fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef data fill:#eceff1,stroke:#455a64,stroke-width:2px

    class learner,instructor,admin users
    class web,pwa,mobile frontend
    class auth,rate,load gateway
    class practice,mocktest,adaptive,progress core
    class ai,human grading
    class db,cache,storage data
```

---

## 2. User Journey Flow

High-level flow from registration → placement test → practice/mock test → progress tracking.

```mermaid
flowchart LR
    subgraph Registration["Account Creation"]
        start(("Start"))
        register["Register<br/>Email/Password or Google OAuth"]
        login["Login<br/>JWT Token Generation"]
    end

    subgraph Onboarding["Onboarding Process"]
        profile["Profile Setup<br/>Name, Target Level, Timeline"]
        placement["Placement Test<br/>4-Skills Assessment"]
        initialize["Initialize Spider Chart<br/>Set Learning Goals"]
    end

    subgraph Learning["Learning Journey"]
        choice{"Choose Mode"}
        practice["Practice Mode<br/>Skill-focused, Adaptive"]
        mocktest["Mock Test Mode<br/>Full Simulation"]
        feedback["View Results<br/>AI + Human Feedback"]
    end

    subgraph Progress["Progress Tracking"]
        track["Track Progress<br/>Spider Chart, Sliding Window"]
        path["Learning Path<br/>Rule-based Recommendations"]
        adjust{"Adjust Learning?"}
    end

    subgraph Completion["Goal Completion"]
        achieve["Goal Achieved<br/>B1/B2/C1 Target"]
        continue["Continue Learning<br/>Set New Goals"]
    end

    %% Flow connections
    start --> register
    register --> login
    login --> profile
    profile --> placement
    placement --> initialize
    initialize --> choice
    choice --> practice
    choice --> mocktest
    practice --> feedback
    mocktest --> feedback
    feedback --> track
    track --> path
    path --> adjust
    adjust -->|Yes| choice
    adjust -->|Goal Met| achieve
    achieve --> continue
    continue --> choice

    %% Styling
    classDef start fill:#4caf50,stroke:#2e7d32,stroke-width:3px,color:#fff
    classDef process fill:#2196f3,stroke:#1565c0,stroke-width:2px
    classDef decision fill:#ff9800,stroke:#ef6c00,stroke-width:2px
    classDef outcome fill:#9c27b0,stroke:#6a1b9a,stroke-width:2px

    class start,achieve start
    class register,login,profile,placement,initialize,practice,mocktest,feedback,track,path,continue process
    class choice,adjust decision
    class achieve outcome
```

---

## 3. Practice Mode Flow with Adaptive Scaffolding

Shows how adaptive scaffolding works for Writing and Listening skills.

### 3A. Writing Adaptive Scaffolding Flow

```mermaid
flowchart TB
    subgraph Input["User Input"]
        select["Select Writing Task<br/>Task 1: Email or Task 2: Essay"]
    end

    subgraph Assessment["Level Assessment"]
        level{"Learner Level?"}
        beginner["Beginner (A1-A2)<br/>High Support Needed"]
        intermediate["Intermediate (B1-B2)<br/>Moderate Support"]
        advanced["Advanced (C1)<br/>Minimal Support"]
    end

    subgraph Scaffold["Adaptive Scaffolding Stages"]
        stage1["Stage 1: Template<br/>Structured Framework<br/>Fill-in-the-blanks"]
        stage2["Stage 2: Keywords<br/>Key Phrases & Vocabulary<br/>Hints & Prompts"]
        stage3["Stage 3: Free Writing<br/>Independent Composition<br/>No Scaffolding"]
    end

    subgraph Submission["Submission & Feedback"]
        submit["Submit Response"]
        ai["AI Instant Grading<br/>Grammar, Vocabulary,<br/>Coherence, Task Achievement"]
        human{"Human Review?"}
        feedback["Detailed Feedback<br/>Improvement Suggestions"]
    end

    subgraph Progression["Skill Progression"]
        improve{"Improvement Detected?"}
        next["Next Level<br/>Reduce Scaffolding"]
        repeat["Same Level<br/>More Practice"]
        reset["Previous Level<br/>Increase Support"]
    end

    %% Flow connections
    select --> level
    level -->|Low| beginner
    level -->|Medium| intermediate
    level -->|High| advanced
    
    beginner --> stage1
    intermediate --> stage1
    intermediate --> stage2
    advanced --> stage2
    advanced --> stage3
    
    stage1 --> submit
    stage2 --> submit
    stage3 --> submit
    
    submit --> ai
    ai --> human
    human -->|Yes| feedback
    human -->|No| feedback
    feedback --> improve
    
    improve -->|Yes| next
    improve -->|No - Stagnant| repeat
    improve -->|Declining| reset

    %% Styling
    classDef input fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef assessment fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef scaffold fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef feedback fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef progression fill:#ede7f6,stroke:#5e35b1,stroke-width:2px

    class select input
    class level,beginner,intermediate,advanced assessment
    class stage1,stage2,stage3 scaffold
    class submit,ai,human,feedback feedback
    class improve,next,repeat,reset progression
```

### 3B. Listening Adaptive Scaffolding Flow

```mermaid
flowchart TB
    subgraph Input["User Input"]
        selectL["Select Listening Exercise<br/>Dictation, MCQ, or Summary"]
    end

    subgraph AssessmentL["Level Assessment"]
        levelL{"Learner Level?"}
        beginnerL["Beginner (A1-A2)<br/>High Support Needed"]
        intermediateL["Intermediate (B1-B2)<br/>Moderate Support"]
        advancedL["Advanced (C1)<br/>Minimal Support"]
    end

    subgraph ScaffoldL["Adaptive Scaffolding Stages"]
        stage1L["Stage 1: Full Text<br/>Show Transcript<br/>Highlight Key Words"]
        stage2L["Stage 2: Highlights<br/>Partial Transcript<br/>Key Phrase Emphasis"]
        stage3L["Stage 3: Pure Audio<br/>No Transcript<br/>Full Listening Practice"]
    end

    subgraph SubmissionL["Submission & Feedback"]
        answer["Submit Answers"]
        aiL["AI Grading<br/>Accuracy Check, Explanation"]
        humanL{"Complex Cases?"}
        feedbackL["Feedback & Tips<br/>Listening Strategies"]
    end

    subgraph ProgressionL["Skill Progression"]
        improveL{"Improvement Detected?"}
        nextL["Next Level<br/>Reduce Scaffolding"]
        repeatL["Same Level<br/>More Practice"]
        resetL["Previous Level<br/>Increase Support"]
    end

    %% Flow connections
    selectL --> levelL
    levelL -->|Low| beginnerL
    levelL -->|Medium| intermediateL
    levelL -->|High| advancedL
    
    beginnerL --> stage1L
    intermediateL --> stage1L
    intermediateL --> stage2L
    advancedL --> stage2L
    advancedL --> stage3L
    
    stage1L --> answer
    stage2L --> answer
    stage3L --> answer
    
    answer --> aiL
    aiL --> humanL
    humanL -->|Complex Case| feedbackL
    humanL -->|Standard| feedbackL
    feedbackL --> improveL
    
    improveL -->|Yes| nextL
    improveL -->|No - Stagnant| repeatL
    improveL -->|Declining| resetL

    %% Styling
    classDef input fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef assessment fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef scaffold fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef feedback fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef progression fill:#ede7f6,stroke:#5e35b1,stroke-width:2px

    class selectL input
    class levelL,beginnerL,intermediateL,advancedL assessment
    class stage1L,stage2L,stage3L scaffoldL
    class answer,aiL,humanL,feedbackL feedback
    class improveL,nextL,repeatL,resetL progression
```

---

## 4. Mock Test Flow

Complete mock test flow with timer, 4 skills assessment, scoring, and detailed results.

```mermaid
flowchart TB
    subgraph Setup["Test Setup"]
        startM{"Start Mock Test?"}
        selectM["Select Test Format<br/>B1-B2 or B2-C1"]
        intro["Test Instructions<br/>Timing, Format, Rules"]
    end

    subgraph Listening["Listening Section (40 min)"]
        l1["Part 1: Photographs<br/>2 questions"]
        l2["Part 2: Response<br/>3 questions"]
        l3["Part 3: Conversation<br/>4 questions"]
        l4["Part 4: Talk<br/>5 questions"]
        ltimerL["40 minutes total"]
    end

    subgraph Reading["Reading Section (60 min)"]
        r1["Part 5: Gap-fill<br/>4 questions"]
        r2["Part 6: Text Completion<br/>4 questions"]
        r3["Part 7: Passage<br/>8 questions"]
        rtimerR["60 minutes total"]
    end

    subgraph Writing["Writing Section (60 min)"]
        w1["Task 1: Email/Letter<br/>~100 words<br/>15 min"]
        w2["Task 2: Essay<br/>~200 words<br/>45 min"]
        wtimerW["60 minutes total"]
    end

    subgraph Speaking["Speaking Section (12 min)"]
        s1["Part 1: Interview<br/>Warm-up questions<br/>3 min"]
        s2["Part 2: Mini-presentation<br/>Cue card<br/>4 min"]
        s3["Part 3: Discussion<br/>Follow-up questions<br/>5 min"]
        stimerS["12 minutes total"]
    end

    subgraph Submission["Test Submission"]
        review{"Review All Answers?"}
        submitM["Submit Test"]
        timer{"Time Remaining?"}
        warning["Time Warning<br/>5 minutes left"]
    end

    subgraph Scoring["Scoring Process"]
        auto["Auto-score MC<br/>Listening & Reading"]
        aiM["AI Score Writing<br/>Task Achievement, Coherence,<br/>Grammar, Vocabulary"]
        aiS["AI Score Speaking<br/>Pronunciation, Fluency,<br/>Content, Grammar"]
        humanM{"Human Review<br/>Writing & Speaking?"}
    end

    subgraph Results["Results & Report"]
        score["Calculate Scores<br/>Per Skill & Overall"]
        report["Detailed Report<br/>Band Score (1-10 each skill)"]
        chart["Spider Chart<br/>4-Skill Visualization"]
        compare["Compare to<br/>Previous Tests"]
        recommend["Learning Recommendations<br/>Priority Skills"]
    end

    %% Flow connections
    startM --> selectM
    selectM --> intro
    intro --> Listening
    Listening --> Reading
    Reading --> Writing
    Writing --> Speaking
    Speaking --> Submission
    
    Submission --> review
    review -->|Yes| Listening
    review -->|No| submitM
    submitM --> timer
    timer -->|Time Up| submitM
    timer -->|Time Left| warning
    
    submitM --> Scoring
    Scoring --> auto
    auto --> aiM
    aiM --> aiS
    aiS --> humanM
    humanM -->|Yes| Results
    humanM -->|No| Results
    
    Results --> score
    score --> report
    report --> chart
    chart --> compare
    compare --> recommend

    %% Styling
    classDef start fill:#4caf50,stroke:#2e7d32,stroke-width:3px,color:#fff
    classDef section fill:#2196f3,stroke:#1565c0,stroke-width:2px,color:#fff
    classDef submission fill:#ff9800,stroke:#ef6c00,stroke-width:2px
    classDef scoring fill:#9c27b0,stroke:#6a1b9a,stroke-width:2px,color:#fff
    classDef results fill:#607d8b,stroke:#37474f,stroke-width:2px,color:#fff

    class startM start
    class Listening,Reading,Writing,Speaking section
    class review,submitM,timer,warning submission
    class auto,aiM,aiS,humanM scoring
    class score,report,chart,compare,recommend results
```

---

## 5. Hybrid Grading Flow

AI grading (instant) → Human grading (optional override) for Writing and Speaking.

```mermaid
flowchart TB
    subgraph Submission["Submission Entry"]
        input{"Submission Type?"}
        writing["Writing Submission<br/>Task 1 or Task 2"]
        speaking["Speaking Submission<br/>Audio Recording"]
    end

    subgraph AI["AI Grading Pipeline"]
        preprocess["Preprocessing<br/>Text extraction/Audio conversion"]
        stt["Speech-to-Text<br/>For speaking submissions"]
        criteria["Analyze Criteria<br/>VSTEP Rubric Assessment"]
        grammar["Grammar Analysis<br/>Error Detection & Correction"]
        vocab["Vocabulary Assessment<br/>Range, Appropriateness"]
        coherence["Coherence & Cohesion<br/>Logical Flow, Transitions"]
        task["Task Achievement<br/>Task fulfillment check"]
        content["Content Relevance<br/>Topic coverage, Ideas"]
        pronunciation["Pronunciation (Speaking)<br/>Fluency, Intonation"]
    end

    subgraph AIScoring["AI Scoring"]
        aiResult["AI Score<br/>Band 1-10 per criterion"]
        confidence{"Confidence Level?"}
        highConf["High Confidence<br/>>85% accuracy"]
        lowConf["Low Confidence<br/>Human review recommended"]
    end

    subgraph Human["Human Review Process"]
        queue["Review Queue<br/>Assigned to Instructors"]
        assign["Assign Instructor<br/>Based on expertise"]
        reviewH["Human Evaluation<br/>VSTEP Rubric Scoring"]
        comment["Add Comments<br/>Detailed feedback"]
        override{"Score Override?"}
    end

    subgraph Final["Final Result"]
        merge["Merge Scores<br/>AI + Human (if applicable)"]
        finalScore["Final Band Score<br/>1-10 scale"]
        feedbackF["Comprehensive Feedback<br/>Improvement suggestions"]
        record["Save to Database<br/>Progress tracking"]
    end

    %% Flow connections
    input -->|Writing| writing
    input -->|Speaking| speaking
    writing --> preprocess
    speaking --> stt
    stt --> preprocess
    preprocess --> criteria
    criteria --> grammar
    criteria --> vocab
    criteria --> coherence
    criteria --> task
    criteria --> content
    criteria --> pronunciation
    grammar --> aiResult
    vocab --> aiResult
    coherence --> aiResult
    task --> aiResult
    content --> aiResult
    pronunciation --> aiResult
    aiResult --> confidence
    confidence -->|High| merge
    confidence -->|Low| Human
    Human --> queue
    queue --> assign
    assign --> reviewH
    reviewH --> comment
    comment --> override
    override -->|Yes| finalScore
    override -->|No| aiResult
    merge --> finalScore
    finalScore --> feedbackF
    feedbackF --> record

    %% Styling
    classDef submission fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef ai fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef scoring fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef human fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef final fill:#ede7f6,stroke:#5e35b1,stroke-width:2px

    class input,writing,speaking submission
    class preprocess,stt,criteria,grammar,vocab,coherence,task,content,pronunciation ai
    class aiResult,confidence,highConf,lowConf scoring
    class queue,assign,reviewH,comment,override human
    class merge,finalScore,feedbackF,record final
```

---

## 6. Progress Tracking & Learning Path Flow

Spider Chart, Sliding Window, and rule-based learning path generation.

```mermaid
flowchart TB
    subgraph DataCollection["Data Collection"]
        exercises["Exercise Completions<br/>Practice & Mock Test Results"]
        scores["Score Records<br/>Per skill, Per attempt"]
        timestamps["Timestamps<br/>When exercises completed"]
        patterns["Usage Patterns<br/>Frequency, Duration"]
    end

    subgraph SpiderChart["Spider Chart Visualization"]
        skills["4 Skills Assessment<br/>Listening, Speaking,<br/>Reading, Writing"]
        levels["Current Levels<br/>A1/A2/B1/B2/C1"]
        gaps["Skill Gaps<br/>Identify weak areas"]
        radar["Radar Chart<br/>Multi-dimensional view"]
    end

    subgraph SlidingWindow["Sliding Window Analytics"]
        window["Window Size<br/>Last 10 exercises"]
        average["Calculate Average<br/>Moving average score"]
        trend["Trend Analysis<br/>Improving, Stable, Declining"]
        volatility["Volatility Check<br/>Score stability"]
    end

    subgraph LearningPath["Learning Path Generation"]
        priority{"Priority Determination?"}
        lowestSkill["Identify Lowest Skill<br/>Focus area"]
        gaps2["Analyze Gaps<br/>Specific sub-skills"]
        recommend["Generate Recommendations<br/>Exercises, Resources"]
        timeline["Timeline Estimation<br/>Goal achievement projection"]
    end

    subgraph Visualization["Progress Visualization"]
        dashboard["Dashboard<br/>All metrics at a glance"]
        history["History Timeline<br/>Progress over time"]
        goals["Goal Tracking<br/>Progress toward target"]
        alerts["Alerts & Reminders<br/>Consistency, Milestones"]
    end

    %% Flow connections
    exercises --> DataCollection
    scores --> DataCollection
    timestamps --> DataCollection
    patterns --> DataCollection
    
    DataCollection --> SpiderChart
    DataCollection --> SlidingWindow
    
    SpiderChart --> skills
    SpiderChart --> levels
    SpiderChart --> gaps
    skills --> radar
    levels --> radar
    gaps --> radar
    
    SlidingWindow --> window
    SlidingWindow --> average
    SlidingWindow --> trend
    SlidingWindow --> volatility
    average --> dashboard
    trend --> dashboard
    volatility --> dashboard
    
    SpiderChart --> LearningPath
    SlidingWindow --> LearningPath
    
    LearningPath --> priority
    priority --> lowestSkill
    lowestSkill --> gaps2
    gaps2 --> recommend
    recommend --> timeline
    
    SpiderChart --> Visualization
    SlidingWindow --> Visualization
    LearningPath --> Visualization
    
    Visualization --> dashboard
    Visualization --> history
    Visualization --> goals
    Visualization --> alerts

    %% Styling
    classDef data fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef spider fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef sliding fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef path fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef viz fill:#ede7f6,stroke:#5e35b1,stroke-width:2px

    class exercises,scores,timestamps,patterns data
    class skills,levels,gaps,radar spider
    class window,average,trend,volatility sliding
    class priority,lowestSkill,gaps2,recommend,timeline path
    class dashboard,history,goals,alerts viz
```

---

## 7. User Authentication & Role-based Access

Authentication flow with roles (Learner, Instructor, Admin).

```mermaid
flowchart TB
    subgraph Auth["Authentication"]
        entry{"Entry Point"}
        login["Login<br/>Email + Password"]
        oauth["OAuth 2.0<br/>Google Sign-In"]
        mfa{"MFA Required?"}
        token["JWT Token<br/>Access + Refresh"]
    end

    subgraph Verification["Verification"]
        validate["Validate Credentials<br/>Database Check"]
        verify["Verify MFA<br/>If enabled"]
        session["Create Session<br/>Redis/Session Store"]
    end

    subgraph RBAC["Role-Based Access Control"]
        roles{"User Role?"}
        learner["Learner<br/>Practice, Mock Tests,<br/>Progress Tracking"]
        instructor["Instructor<br/>Grade Submissions,<br/>Student Management"]
        admin["Admin<br/>Content Management,<br/>System Settings"]
    end

    subgraph Permissions["Permission Matrix"]
        learnerPerms["View Content<br/>Take Tests<br/>Track Progress<br/>Create Content<br/>Grade"]
        instructorPerms["View Content<br/>Take Tests<br/>Grade Submissions<br/>View Analytics<br/>Admin"]
        adminPerms["Full Access<br/>User Management<br/>Content Management<br/>System Settings"]
    end

    subgraph Protected["Protected Resources"]
        practiceMode["Practice Mode<br/>Learner: Yes<br/>Instructor: Yes<br/>Admin: No"]
        mockTestMode["Mock Test Mode<br/>Learner: Yes<br/>Instructor: Yes<br/>Admin: No"]
        gradingPortal["Grading Portal<br/>Learner: No<br/>Instructor: Yes<br/>Admin: Yes"]
        adminPanel["Admin Panel<br/>Learner: No<br/>Instructor: No<br/>Admin: Yes"]
    end

    subgraph Session["Session Management"]
        refresh["Token Refresh<br/>Before expiry"]
        logout["Logout<br/>Clear Session"]
        revoke["Session Revoke<br/>Security violation"]
    end

    %% Flow connections
    entry --> login
    entry --> oauth
    login --> validate
    oauth --> validate
    validate --> mfa
    mfa -->|Yes| verify
    mfa -->|No| token
    verify --> token
    token --> session
    session --> RBAC
    
    RBAC --> roles
    roles -->|Learner| learner
    roles -->|Instructor| instructor
    roles -->|Admin| admin
    
    learner --> learnerPerms
    instructor --> instructorPerms
    admin --> adminPerms
    
    learnerPerms --> Protected
    instructorPerms --> Protected
    adminPerms --> Protected
    
    Protected --> practiceMode
    Protected --> mockTestMode
    Protected --> gradingPortal
    Protected --> adminPanel
    
    token --> Session
    Session --> refresh
    Session --> logout
    Session --> revoke

    %% Styling
    classDef auth fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef verify fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef rbac fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef permissions fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef resources fill:#ede7f6,stroke:#5e35b1,stroke-width:2px
    classDef session fill:#ffebee,stroke:#c62828,stroke-width:2px

    class entry,login,oauth,mfa,token auth
    class validate,verify,session verify
    class roles,learner,instructor,admin rbac
    class learnerPerms,instructorPerms,adminPerms permissions
    class practiceMode,mockTestMode,gradingPortal,adminPanel resources
    class refresh,logout,revoke session
```

---

## Diagram Summary

| Diagram | Purpose | Key Components |
|---------|---------|----------------|
| **System Architecture** | High-level system design | Frontend, API Gateway, Core Services, Grading, Data Layer |
| **User Journey** | Learner lifecycle | Registration → Placement → Practice/Mock Test → Progress |
| **Practice Mode - Writing** | Writing skill scaffolding | Template → Keywords → Free Writing |
| **Practice Mode - Listening** | Listening skill scaffolding | Full Text → Highlights → Pure Audio |
| **Mock Test Flow** | Full exam simulation | 4 Sections, Timer, Scoring, Results Report |
| **Hybrid Grading** | AI + Human evaluation | AI Instant → Human Override → Final Score |
| **Progress Tracking** | Analytics & visualization | Spider Chart, Sliding Window, Learning Path |
| **Authentication & RBAC** | Security & access control | JWT, OAuth, Role-based permissions |

---

*Document generated for VSTEP Adaptive Learning System (SP26SE145)*
