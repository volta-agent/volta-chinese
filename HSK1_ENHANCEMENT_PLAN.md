# HSK1 Course Enhancement Plan

## Current State Analysis

### What volta-chinese Already Has
- **Vocabulary Flashcards** - HSK1-5 words with hanzi, pinyin, definitions
- **Writing Practice** - Hanzi Writer integration for stroke detection
- **Dialogues** - 5 HSK1 dialogues with speaker lines (Greetings, Restaurant, Directions, Shopping, Family)
- **Sentence Practice** - Example sentences for each vocabulary word
- **Audio** - Web Speech API text-to-speech
- **Progress Tracking** - LocalStorage

### What HSK1 Textbook Contains (149 pages)
Based on OCR extraction of `/home/volta/projects/archives/dropbox/HSK1.pdf`:

**Structure per lesson:**
1. **课文 Text** - Dialogue with pinyin and English
2. **生词 New Words** - Vocabulary with part of speech
3. **注释 Notes** - Grammar and usage explanations
4. **拼音规则 Pinyin Rules** - Tone marking, abbreviations
5. **汉字笔顺 Stroke Order** - Character writing rules
6. **练习 Exercises** - Pair work, group activities

**HSK1 Content (15 lessons):**
- Lesson 1: 你好 (Greetings) - 你、好、您、你们、对不起、没关系
- Lesson 2-15: Progressively introducing ~150 HSK1 words
- Final appendix: Complete vocabulary list with lesson references

### Gap Analysis

| Feature | Current | Needed |
|---------|---------|--------|
| Vocabulary | 150 words (HSK1) | Already covered |
| Dialogues | 5 dialogues | 15 textbook dialogues |
| Grammar | None | 15 grammar points |
| Stroke Order | Hanzi Writer | Correct, but no explicit lessons |
| Pinyin Rules | None | Tone marking, abbreviations |
| Exercises | None | Interactive practice |
| Lesson Structure | Flat | Sequential learning path |
| Listening | TTS only | Native audio recordings |

---

## Enhancement Plan

### Phase 1: Content Extraction (Manual + OCR)

**Task 1.1: Extract Dialogues**
- OCR all 15 lesson dialogues from PDF pages 15-60
- Format: `{ speaker, chinese, pinyin, english }`
- Store in `src/lib/data/textbook_dialogues_hsk1.json`

**Task 1.2: Extract Grammar Points**
- OCR grammar explanations from each lesson
- Format: `{ lesson, topic, explanation, examples[] }`
- Store in `src/lib/data/grammar_hsk1.json`

**Task 1.3: Extract Pinyin Rules**
- Already identified: tone marking, abbreviation (iu, ui, un)
- Format: `{ rule, explanation, examples[] }`
- Store in `src/lib/data/pinyin_rules.json`

**Task 1.4: Extract Stroke Order Rules**
- Pages show rules like "horizontal preceding vertical"
- Format: `{ rule, characters[] }`
- Store in `src/lib/data/stroke_rules.json`

### Phase 2: Lesson-Based Learning Path

**Task 2.1: Create Lesson Structure**
```
/learn/1 → Lesson 1: Greetings
  - Dialogue (with audio)
  - Vocabulary (from this lesson only)
  - Grammar point
  - Practice exercises
  - Quiz to unlock next lesson
```

**Task 2.2: Progressive Unlocking**
- Lessons unlock sequentially
- Must pass quiz (80%+) to proceed
- Spaced review of previous lessons

**Task 2.3: Lesson Data Structure**
```json
{
  "lesson": 1,
  "title": "你好",
  "dialogue": [...],
  "vocabulary": ["你", "好", "您", ...],
  "grammar": { "topic": "Basic greetings", ... },
  "exercises": [...],
  "quiz": [...]
}
```

### Phase 3: Grammar Explanations

**Task 3.1: Grammar Cards**
- Expandable cards showing grammar point
- Example sentences with highlighting
- Practice: fill-in-blank, sentence construction

**Task 3.2: Pattern Recognition**
- Highlight patterns in dialogues
- E.g., "你好" → "您好" (polite form)

### Phase 4: Interactive Exercises

**Task 4.1: Exercise Types**
1. **Listening** - Play audio, select correct text
2. **Reading** - Read dialogue, answer questions
3. **Writing** - Write characters from pinyin prompt
4. **Speaking** - Record and compare (future)

**Task 4.2: Pair/Group Simulations**
- Simulate textbook pair work activities
- "You are A, respond to B's question"
- Multiple choice or free response

### Phase 5: Audio Enhancement

**Task 5.1: Native Audio Integration**
- Current TTS is acceptable but not ideal
- Options:
  - Forvo API for native pronunciations
  - Google Cloud TTS (paid)
  - User recordings (crowdsourced)

**Task 5.2: Dialogue Audio**
- Record or synthesize full dialogue audio
- Play at different speeds (0.75x, 1x, 1.25x)

### Phase 6: Progress & Gamification

**Task 6.1: Enhanced Progress Tracking**
- Per-lesson progress
- Vocabulary mastery per word
- Grammar point completion
- Streak tracking

**Task 6.2: Review System**
- Spaced repetition for vocabulary
- Grammar reviews
- Mixed review across lessons

---

## Implementation Priority

### MVP (Minimum Viable Product)
1. Extract 15 textbook dialogues (highest impact)
2. Create lesson-based navigation
3. Add vocabulary from each lesson (not all 150 at once)
4. Basic quizzes per lesson

### Nice to Have
1. Grammar explanations
2. Pinyin rules section
3. Stroke order lessons
4. Native audio

### Future
1. Speech recognition
2. User recordings
3. Social features

---

## Technical Considerations

### Data Files to Create
```
src/lib/data/
  textbook_dialogues_hsk1.json  (15 dialogues)
  lessons_hsk1.json             (lesson structure)
  grammar_hsk1.json             (grammar points)
  exercises_hsk1.json           (exercises by lesson)
  pinyin_rules.json             (pinyin rules)
```

### UI Components to Add
```
src/lib/components/
  LessonCard.svelte
  DialoguePlayer.svelte
  GrammarCard.svelte
  ExercisePlayer.svelte
  QuizComponent.svelte
  LessonProgress.svelte
```

### Routes to Add
```
/learn          → Lesson list
/learn/1        → Lesson 1
/learn/1/quiz   → Lesson 1 quiz
/grammar        → Grammar reference
```

---

## Next Steps

1. **User confirms plan** - Proceed or modify?
2. **Manual extraction** - OCR quality is poor, may need manual correction
3. **Start with dialogues** - Highest value, clearest structure
4. **Iterate** - Add features based on usage feedback

---

## Estimated Effort

| Task | Effort | Notes |
|------|--------|-------|
| Extract dialogues | 4-6 hours | OCR + manual correction |
| Create lesson structure | 2-3 hours | Data modeling |
| Build lesson UI | 3-4 hours | Components |
| Add exercises | 4-5 hours | Per lesson |
| Grammar content | 3-4 hours | Writing explanations |
| Testing & polish | 2-3 hours | |

**Total: ~20-25 hours for MVP**

---

## User Decisions (Confirmed)

1. **Replace dialogues** - Use textbook dialogues instead of custom ones
2. **User choice** - Offer both "Sequential" and "Free" navigation modes
3. **Native audio** - Prioritize authentic recordings over TTS
4. **Expand later** - Plan for HSK2-5 content

## Native Audio Options

| Source | Pros | Cons | Cost |
|--------|------|------|------|
| **Web Speech API** | Already implemented, zero cost | Quality varies by browser | Free |
| **Azure TTS** | Neural voices, very natural | Requires API key | Free 500k chars/month |
| **Google Cloud TTS** | High quality, natural | Not truly native | $4/1M chars |
| **Forvo API** | Actual native recordings | Single words only, API key | Free tier |
| **User recordings** | Authentic, community-driven | Requires users | Free |

### Decision: Hybrid Approach
1. **Vocabulary** - Use Azure TTS (neural voices, free tier covers HSK1-5 easily)
2. **Dialogues** - Use Azure TTS with different speaker voices
3. **Future** - Add user recording feature for community contribution

### Implementation
- Store audio as pre-generated MP3s in `/static/audio/`
- Fallback to Web Speech API if offline
- Consider Forvo integration for word-level native audio later

## Next Steps

1. ~~Begin dialogue extraction from PDF (manual OCR correction needed)~~ ✓ Partial
2. ~~Research Forvo API integration~~ ✓ Done - Using Azure TTS instead
3. ~~Update data structure to support HSK1-5~~ ✓ Done
4. Build lesson navigation with mode toggle

### Progress Log

**2026-04-03:**
- ✅ Created `textbook_dialogues_hsk1.json` with 5 lessons (1-5, 7)
- ✅ Created `lessons_hsk1.json` with all 15 lesson metadata
- ✅ Researched audio options - decided on Azure TTS (free tier)
- ⏳ Need to extract remaining dialogues (lessons 6, 8-15)
- ⏳ Need to build lesson UI components

### Remaining Work

1. **Complete dialogue extraction** - OCR pages for lessons 6, 8-15
2. **Build lesson components:**
   - `LessonCard.svelte` - Lesson selection UI
   - `DialoguePlayer.svelte` - Audio + text display
   - `GrammarCard.svelte` - Grammar explanations
   - `QuizComponent.svelte` - Lesson quizzes
3. **Add navigation modes:**
   - Sequential mode (unlock by quiz)
   - Free mode (browse any lesson)
4. **Integrate audio:**
   - Set up Azure TTS API
   - Generate MP3 files for vocabulary/dialogues
