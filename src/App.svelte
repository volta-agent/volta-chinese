<script>
 import { onMount } from 'svelte';
 import HanziWriter from 'hanzi-writer';
 import { speakWord, speakDialogueLine, initVoices } from './lib/utils/audio-service.js';
 import hsk1 from './lib/data/hsk1.json';
 import hsk2 from './lib/data/hsk2.json';
 import hsk3 from './lib/data/hsk3.json';
 import hsk4 from './lib/data/hsk4.json';
 import hsk5 from './lib/data/hsk5.json';
 import sentences1 from './lib/data/sentences_hsk1.json';
 import sentences2 from './lib/data/sentences_hsk2.json';
 import sentences3 from './lib/data/sentences_hsk3.json';
 import sentences4 from './lib/data/sentences_hsk4.json';
 import sentences5 from './lib/data/sentences_hsk5.json';
 import dialogues1 from './lib/data/dialogues_hsk1.json';
 import dialogues2 from './lib/data/dialogues_hsk2.json';
 import dialogues3 from './lib/data/dialogues_hsk3.json';
 import dialogues4 from './lib/data/dialogues_hsk4.json';
 import dialogues5 from './lib/data/dialogues_hsk5.json';
 import textbookDialogues1 from './lib/data/textbook_dialogues_hsk1.json';
 import textbookDialogues2 from './lib/data/textbook_dialogues_hsk2.json';
 
 import LessonCard from './lib/components/LessonCard.svelte';
 import DialoguePlayer from './lib/components/DialoguePlayer.svelte';
 
 const HSK_DATA = { 1: hsk1, 2: hsk2, 3: hsk3, 4: hsk4, 5: hsk5 };
 const SENTENCE_DATA = { 1: sentences1, 2: sentences2, 3: sentences3, 4: sentences4, 5: sentences5 };
 const DIALOGUE_DATA = { 1: dialogues1, 2: dialogues2, 3: dialogues3, 4: dialogues4, 5: dialogues5 };
 const TEXTBOOK_DIALOGUES = { 1: textbookDialogues1, 2: textbookDialogues2 };
 
 let currentView = $state('home');
 let currentLevel = $state(1);
 let showPinyin = $state(true);
	let progress = $state({});
	let audioStatus = $state('');
 
 // Flashcard state
 let currentCard = $state(null);
 let cardIndex = $state(0);
 let showAnswer = $state(false);
 let studyCards = $state([]);
 
 // Writing state
 let writingCard = $state(null);
 let writingIndex = $state(0);
 let writingCards = $state([]);
 let writingMode = $state('character'); // 'character' or 'word'
 let currentCharIndex = $state(0); // For multi-char words, which char we're on
 let hanziWriterInstance = $state(null);
 let strokeFeedback = $state('');
 
 // Sentence state
 let sentenceCards = $state([]);
 let sentenceIndex = $state(0);
 let currentSentence = $state(null);
 let showSentenceAnswer = $state(false);
let currentSentenceWord = $state(null); // The word being studied

 // Dialogue state
 let currentDialogue = $state(null);
 let dialogueLineIndex = $state(0);
 let showDialogueTranslation = $state(false);

 // Lesson state (textbook dialogues)
 let navigationMode = $state('free'); // 'free' or 'sequential'
 let currentLesson = $state(null);
 let currentLessonLevel = $state(1);
 let lessonProgress = $state({}); // { lessonId: { completed: bool, progress: 0-100 } }
 let dialoguePlayerRef = $state(null);

 const LEVELS = [
 { level: 1, name: 'HSK 1', count: hsk1.length, desc: 'Beginner' },
 { level: 2, name: 'HSK 2', count: hsk2.length, desc: 'Elementary' },
 { level: 3, name: 'HSK 3', count: hsk3.length, desc: 'Intermediate' },
 { level: 4, name: 'HSK 4', count: hsk4.length, desc: 'Upper Intermediate' },
 { level: 5, name: 'HSK 5', count: hsk5.length, desc: 'Advanced' }
 ];
 
 // Separate words by character count
 function getSingleCharWords(level) {
 const words = HSK_DATA[level] || [];
 return words.filter(w => w.hanzi.length === 1);
 }
 
 function getMultiCharWords(level) {
 const words = HSK_DATA[level] || [];
 return words.filter(w => w.hanzi.length > 1);
 }
 
	onMount(() => {
		loadProgress();
		initVoices(); // Initialize speech synthesis voices
	});
 
 function loadProgress() {
 try {
 const saved = localStorage.getItem('volta-chinese-progress');
 if (saved) progress = JSON.parse(saved);
 } catch (e) {}
 }
 
 function saveProgress() {
 localStorage.setItem('volta-chinese-progress', JSON.stringify(progress));
 }
 
 // Spaced repetition functions (SM-2 inspired)
 function getDueCards(level) {
 const words = getWordsForLevel(level);
 const now = Date.now();
 
 return words.filter(word => {
 const p = progress[word.hanzi];
 if (!p) return true; // Never studied = due now
 if (!p.nextReview) return true; // No next review set = due now
 return p.nextReview <= now; // Past due date = due now
 });
 }
 
 function getReviewPriority(word) {
 const p = progress[word.hanzi];
 if (!p) return 0; // New words = highest priority
 if (!p.nextReview) return 0;
 const overdue = Date.now() - p.nextReview;
 return Math.max(0, overdue / (1000 * 60 * 60)); // Hours overdue
 }
 
 function updateSpacedRepetition(hanzi, known) {
 if (!progress[hanzi]) {
 progress[hanzi] = { known: 0, unknown: 0, interval: 1, easeFactor: 2.5, nextReview: Date.now() };
 }
 
 const p = progress[hanzi];
 if (known) {
 p.known++;
 // SM-2: increase interval based on ease factor
 if (p.interval === 1) {
 p.interval = 1; // 1 day
 } else if (p.interval === 2) {
 p.interval = 6; // 6 days
 } else {
 p.interval = Math.round(p.interval * p.easeFactor);
 }
 p.easeFactor = Math.max(1.3, p.easeFactor + 0.1);
 } else {
 p.unknown++;
 // Reset on failure
 p.interval = 1;
 p.easeFactor = Math.max(1.3, p.easeFactor - 0.2);
 }
 
 // Set next review time
 p.nextReview = Date.now() + (p.interval * 24 * 60 * 60 * 1000);
 saveProgress();
 }
 
 function getStudyCards(level, mode = 'due') {
 const words = mode === 'due' ? getDueCards(level) : getWordsForLevel(level);
 
 // Sort by priority (overdue first, then new, then scheduled)
 const sorted = words.sort((a, b) => {
 const pa = getReviewPriority(a);
 const pb = getReviewPriority(b);
 return pb - pa;
 });
 
 return sorted;
}

	function exportProgress() {
 const data = {
 progress: progress,
 exportDate: new Date().toISOString(),
 version: '1.0'
 };
 const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `volta-chinese-progress-${new Date().toISOString().split('T')[0]}.json`;
 a.click();
 URL.revokeObjectURL(url);
 }
 
 function importProgress(event) {
 const file = event.target.files[0];
 if (!file) return;
 
 const reader = new FileReader();
 reader.onload = (e) => {
 try {
 const data = JSON.parse(e.target.result);
 if (data.progress) {
 progress = data.progress;
 saveProgress();
 alert('Progress imported successfully!');
 }
 } catch (err) {
 alert('Invalid file format');
 }
 };
 reader.readAsText(file);
 }
 
 // Sentence practice functions
 function startSentencePractice(level) {
 currentLevel = level;
 const sentences = SENTENCE_DATA[level] || [];
 // Shuffle and pick 10
 const shuffled = [...sentences].sort(() => Math.random() - 0.5);
 sentenceCards = shuffled.slice(0, 10);
 sentenceIndex = 0;
 if (sentenceCards.length > 0) {
 currentSentenceWord = sentenceCards[0];
 // Pick a random sentence from the word's sentences
 const idx = Math.floor(Math.random() * currentSentenceWord.c.length);
 currentSentence = {
 chinese: currentSentenceWord.c[idx],
 english: currentSentenceWord.e[idx],
 word: currentSentenceWord.w
 };
 }
 showSentenceAnswer = false;
 currentView = 'sentence';
 }
 
 function nextSentenceCard() {
 sentenceIndex++;
 if (sentenceIndex < sentenceCards.length) {
 currentSentenceWord = sentenceCards[sentenceIndex];
 const idx = Math.floor(Math.random() * currentSentenceWord.c.length);
 currentSentence = {
 chinese: currentSentenceWord.c[idx],
 english: currentSentenceWord.e[idx],
 word: currentSentenceWord.w
 };
 showSentenceAnswer = false;
 } else {
 currentView = 'home';
 }
 }

 function startDialoguePractice(level) {
 currentLevel = level;
 const dialogues = DIALOGUE_DATA[level];
 if (dialogues && dialogues.length > 0) {
 currentDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
 dialogueLineIndex = 0;
 showDialogueTranslation = false;
 currentView = 'dialogue';
 }
 }

 function nextDialogueLine() {
 if (dialogueLineIndex < currentDialogue.lines.length - 1) {
 dialogueLineIndex++;
 showDialogueTranslation = false;
 } else {
 currentView = 'home';
 }
 }

 function prevDialogueLine() {
    if (dialogueLineIndex > 0) {
      dialogueLineIndex--;
      showDialogueTranslation = false;
    }
 }

	// Lesson navigation functions
	function startLessons(level) {
		currentLessonLevel = level;
		loadLessonProgress(level);
		currentView = 'lessons';
		setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
	}

 function loadLessonProgress(level) {
    try {
      const saved = localStorage.getItem(`volta-chinese-lessons-${level}`);
      if (saved) {
        lessonProgress = JSON.parse(saved);
      } else {
        lessonProgress = {};
      }
    } catch (e) {
      lessonProgress = {};
    }
 }

 function saveLessonProgress() {
    localStorage.setItem(`volta-chinese-lessons-${currentLessonLevel}`, JSON.stringify(lessonProgress));
 }

 function getLessonsForLevel(level) {
    return TEXTBOOK_DIALOGUES[level] || [];
 }

 function isLessonLocked(lesson) {
    if (navigationMode === 'free') return false;
    // In sequential mode, must complete previous lessons
    const lessons = getLessonsForLevel(currentLessonLevel);
    const idx = lessons.findIndex(l => l.id === lesson.id);
    if (idx === 0) return false;
    const prevLesson = lessons[idx - 1];
    return !lessonProgress[prevLesson.id]?.completed;
 }

 function getLessonProgress(lesson) {
    return lessonProgress[lesson.id]?.progress || 0;
 }

 function isLessonCompleted(lesson) {
    return lessonProgress[lesson.id]?.completed || false;
 }

 function startLesson(lesson) {
    if (isLessonLocked(lesson)) return;
    currentLesson = lesson;
    currentView = 'lesson-player';
 }

 function onLessonLineChange(event) {
    // Update progress as user goes through lines
    const { line } = event.detail;
    const totalLines = currentLesson.lines.length;
    const progress = Math.round(((line + 1) / totalLines) * 100);
    
    if (!lessonProgress[currentLesson.id]) {
      lessonProgress[currentLesson.id] = { completed: false, progress: 0 };
    }
    lessonProgress[currentLesson.id].progress = Math.max(
      lessonProgress[currentLesson.id].progress,
      progress
    );
    saveLessonProgress();
 }

 function onLessonComplete() {
    if (!lessonProgress[currentLesson.id]) {
      lessonProgress[currentLesson.id] = { completed: false, progress: 0 };
    }
    lessonProgress[currentLesson.id].completed = true;
    lessonProgress[currentLesson.id].progress = 100;
    saveLessonProgress();
    
    // In sequential mode, go to next lesson
    if (navigationMode === 'sequential') {
      const lessons = getLessonsForLevel(currentLessonLevel);
      const idx = lessons.findIndex(l => l.id === currentLesson.id);
      if (idx < lessons.length - 1) {
        currentLesson = lessons[idx + 1];
        // Reset handled by DialoguePlayer
        currentView = 'lesson-player';
        return;
      }
    }
    currentView = 'lessons';
 }

 function toggleNavigationMode() {
    navigationMode = navigationMode === 'free' ? 'sequential' : 'free';
 }
 
 function speak(text) {
    audioStatus = 'Loading...';
    
    // Use audio service which prioritizes pre-generated MP3s, then Azure TTS, then Web Speech
    speakWord(text)
        .then(() => {
        audioStatus = '';
        })
        .catch((e) => {
        console.log('Speech error:', e);
        audioStatus = '';
        });
 }
 
 function getWordsForLevel(level) {
 return HSK_DATA[level] || [];
 }
 
 function shuffleArray(array) {
 for (let i = array.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [array[i], array[j]] = [array[j], array[i]];
 }
 return array;
 }
 
 function startFlashcards(level) {
 currentLevel = level;
 const words = getStudyCards(level, 'due');
 studyCards = words.slice(0, 20);
 cardIndex = 0;
 currentCard = studyCards[0];
 showAnswer = false;
 currentView = 'flashcard';
 }
 
 function startMistakeReview(level) {
 currentLevel = level;
 const words = getWordsForLevel(level);
 // Filter to words that have been marked wrong more than right
 const mistakes = words.filter(w => {
 const p = progress[w.hanzi];
 if (!p) return false;
 return p.unknown > p.known;
 });
 studyCards = mistakes.slice(0, 20);
 if (studyCards.length === 0) {
 alert('No mistakes to review! Keep practicing and mistakes will appear here.');
 return;
 }
 cardIndex = 0;
 currentCard = studyCards[0];
 showAnswer = false;
 currentView = 'flashcard';
 }
 
 function startCharacterWriting(level) {
 writingMode = 'character';
 const words = getSingleCharWords(level);
 writingCards = shuffleArray([...words]).slice(0, 15);
 writingIndex = 0;
 currentCharIndex = 0;
 writingCard = writingCards[0];
 hanziWriterInstance = null;
 strokeFeedback = '';
 currentView = 'writing';
 }
 
 function startWordWriting(level) {
 writingMode = 'word';
 const words = getMultiCharWords(level);
 writingCards = shuffleArray([...words]).slice(0, 10);
 writingIndex = 0;
 currentCharIndex = 0;
 writingCard = writingCards[0];
 hanziWriterInstance = null;
 strokeFeedback = '';
 currentView = 'writing';
 }
 
 function nextCard() {
 cardIndex++;
 if (cardIndex < studyCards.length) {
 currentCard = studyCards[cardIndex];
 showAnswer = false;
 } else {
 currentView = 'complete';
 }
 }
 
 // Get current character to write (for multi-char, it's one at a time)
 function getCurrentChar() {
 if (!writingCard) return null;
 if (writingMode === 'character') {
 return writingCard.hanzi;
 }
 return writingCard.hanzi[currentCharIndex];
 }
 
 function getTotalChars() {
 if (!writingCard) return 1;
 return writingCard.hanzi.length;
 }
 
 function nextWritingChar() {
 if (writingMode === 'character') {
 // Single char mode - move to next word
 nextWritingCard();
 } else {
 // Multi-char mode - check if more chars in current word
 if (currentCharIndex < writingCard.hanzi.length - 1) {
 // More chars in this word
 currentCharIndex++;
 hanziWriterInstance = null;
 strokeFeedback = '';
 } else {
 // Word complete, move to next word
 nextWritingCard();
 }
 }
 }
 
 function nextWritingCard() {
 writingIndex++;
 if (writingIndex < writingCards.length) {
 writingCard = writingCards[writingIndex];
 currentCharIndex = 0;
 hanziWriterInstance = null;
 strokeFeedback = '';
 } else {
 currentView = 'complete';
 }
 }
 
 function initHanziWriter() {
 if (!writingCard) return;
 
 const char = getCurrentChar();
 if (!char) return;
 
 setTimeout(() => {
 const targetEl = document.getElementById('hanzi-writer-target');
 if (!targetEl) {
 console.log('Hanzi Writer target not found');
 return;
 }
 
 try {
 targetEl.innerHTML = '';
 
 hanziWriterInstance = HanziWriter.create('hanzi-writer-target', char, {
 width: 200,
 height: 200,
 showOutline: true,
 showCharacter: false,
 strokeColor: '#ff6b6b',
 outlineColor: '#4a5568',
 drawingColor: '#ffd93d',
 padding: 5,
 radicalColor: '#ff9999',
 });
 
 // Start quiz mode for drawing practice
 hanziWriterInstance.quiz({
 onMistake: (strokeData) => {
 strokeFeedback = `Try again! Stroke ${strokeData.strokeNum + 1}`;
 },
 onCorrect: (strokeData) => {
 strokeFeedback = `Good! Stroke ${strokeData.strokeNum + 1}`;
 },
 onComplete: (summaryData) => {
 console.log('Quiz complete:', summaryData);
 strokeFeedback = 'Complete! ✓';
 }
 });
 } catch (e) {
 console.error('Hanzi Writer error:', e);
 }
 }, 50);
 }
 
 function showStrokeHint() {
 if (hanziWriterInstance) {
 hanziWriterInstance.showCharacter();
 hanziWriterInstance.animateCharacter({
 onComplete: () => {
 hanziWriterInstance.hideCharacter();
 hanziWriterInstance.quiz({
 onMistake: (strokeData) => {
 strokeFeedback = `Try again! Stroke ${strokeData.strokeNum + 1}`;
 },
 onCorrect: (strokeData) => {
 strokeFeedback = `Good! Stroke ${strokeData.strokeNum + 1}`;
 },
 onComplete: (summaryData) => {
 console.log('Quiz complete:', summaryData);
 strokeFeedback = 'Complete! ✓';
 }
 });
 }
 });
 }
 }
 
 function markKnown() {
 if (!currentCard) return;
 updateSpacedRepetition(currentCard.hanzi, true);
 nextCard();
 }
 
 function markUnknown() {
 if (!currentCard) return;
 updateSpacedRepetition(currentCard.hanzi, false);
 nextCard();
 }
 
 // Initialize Hanzi Writer when entering writing view or changing char
 $effect(() => {
 if (currentView === 'writing' && writingCard) {
 initHanziWriter();
 }
 });
</script>

<main>
 <nav class="navbar">
 <div class="nav-brand" onclick={() => currentView = 'home'} role="button">
 <span class="logo">汉</span>
 <span class="brand-text">Volta Chinese</span>
 </div>
		<div class="nav-controls">
			<label class="toggle">
				<input type="checkbox" bind:checked={showPinyin}>
				<span class="toggle-label">Pinyin</span>
			</label>
			<button type="button" class="btn-settings" onclick={() => currentView = 'settings'}>
				⚙
			</button>
		</div>
	</nav>

 {#if currentView === 'home'}
 <section class="hero">
 <h1>Volta Chinese</h1>
 <p class="subtitle">
 Master HSK 1-5 vocabulary with flashcards, writing, sentences, and dialogues.
 </p>
 <div class="hero-stats">
 <span>1500+ words</span>
 <span>25 dialogues</span>
 <span>500+ sentences</span>
 </div>
 </section>

 <section class="practice-section">
 <h2>Study by Level</h2>
 <div class="level-grid">
 {#each LEVELS as lvl}
		<div class="level-card">
 <div class="level-header">
 <span class="level-badge">HSK {lvl.level}</span>
 <span class="level-words">{lvl.count} words</span>
 </div>
 <p class="level-desc">{lvl.desc}</p>
 <div class="practice-buttons">
    <button 
    type="button"
			class="btn-primary"
				onclick={() => startFlashcards(lvl.level)}
			>
    Flashcards
    </button>
    <button 
    type="button"
			class="btn-secondary"
				onclick={() => startCharacterWriting(lvl.level)}
			>
				Writing
			</button>
			<button 
				type="button"
				class="btn-secondary"
				onclick={() => startSentencePractice(lvl.level)}
			>
				Sentences
			</button>
			<button 
				type="button"
				class="btn-secondary"
				onclick={() => startDialoguePractice(lvl.level)}
			>
				Dialogues
    </button>
			{#if TEXTBOOK_DIALOGUES[lvl.level]}
				<button 
					type="button"
					class="btn-lessons"
					onclick={() => startLessons(lvl.level)}
				>
					Lessons
				</button>
			{/if}
    </div>
 {#if progress[lvl.level]?.reviewCount > 0}
 <button 
 type="button"
			class="btn-review"
				onclick={() => startMistakeReview(lvl.level)}
			>
 Review {progress[lvl.level].reviewCount} mistakes
 </button>
 {/if}
 </div>
 {/each}
 </div>
 </section>

 {:else if currentView === 'flashcard' && currentCard}
 <div class="flashcard-view">
 <button type="button" class="back-btn" onclick={() => currentView = 'home'}>
 ← Back
 </button>
 
 <div class="progress-bar">
 <div class="progress-fill" style="width: {(cardIndex / studyCards.length) * 100}%"></div>
 </div>
 <p class="progress-text">{cardIndex + 1} / {studyCards.length}</p>

 <div class="card-container">
 <div 
 class="flashcard" 
 onclick={() => showAnswer = !showAnswer}
 role="button"
 >
 <div class="card-hanzi">{currentCard.hanzi}</div>
 {#if showPinyin && showAnswer}
 <div class="card-pinyin">{currentCard.pinyin}</div>
 {/if}
 {#if showAnswer}
 <div class="card-meaning">{currentCard.meaning}</div>
 {:else}
 <p class="card-hint">Tap to reveal</p>
 {/if}
 </div>
 </div>

 <div class="card-actions">
 <button 
 type="button" 
 class="btn-unknown"
 onclick={() => markUnknown()}
 >
 Don't Know
 </button>
 <button 
 type="button"
 class="btn-audio" 
 onclick={() => speak(currentCard.hanzi)}
 title="Play audio"
 >
 🔊
 </button>
 <button 
 type="button" 
 class="btn-known"
 onclick={() => markKnown()}
 >
 Know It
 </button>
 </div>
 {#if audioStatus}
 <p class="audio-status">{audioStatus}</p>
 {/if}
 </div>

 {:else if currentView === 'writing' && writingCard}
 <div class="writing-view">
 <button type="button" class="back-btn" onclick={() => currentView = 'home'}>
 ← Back
 </button>
 
 <div class="progress-bar">
 <div class="progress-fill" style="width: {(writingIndex / writingCards.length) * 100}%"></div>
 </div>
 <p class="progress-text">
 {#if writingMode === 'word'}
 Character {currentCharIndex + 1}/{getTotalChars()} · Word {writingIndex + 1}/{writingCards.length}
 {:else}
 {writingIndex + 1} / {writingCards.length}
 {/if}
 </p>

 <div class="writing-container">
 <div class="writing-prompt">
 {#if writingMode === 'word'}
 <p class="prompt-label">Write character {currentCharIndex + 1} of:</p>
 <p class="prompt-word">{writingCard.hanzi.split('').join(' ')}</p>
 {:else}
 <p class="prompt-label">Write this character:</p>
 {/if}
 <p class="prompt-meaning">{writingCard.meaning}</p>
 {#if showPinyin}
 <p class="prompt-pinyin">{writingCard.pinyin}</p>
 {/if}
 </div>
 
 <div class="writing-area">
 <div class="writing-grid" id="hanzi-writer-target">
 <p class="writing-hint">Loading...</p>
 </div>
 </div>
 
 {#if strokeFeedback}
 <p class="stroke-feedback">{strokeFeedback}</p>
 {/if}
 
 <div class="writing-actions">
 <button 
 type="button"
 class="btn-audio" 
 onclick={() => speak(getCurrentChar())}
 title="Play audio"
 >
 🔊
 </button>
 <button 
 type="button"
 class="btn-secondary" 
 onclick={showStrokeHint}
 >
 Show Strokes
 </button>
 <button type="button" class="btn-primary" onclick={nextWritingChar}>
 {#if writingMode === 'word' && currentCharIndex < writingCard.hanzi.length - 1}
 Next Character
 {:else}
 Next
 {/if}
 </button>
 </div>
 </div>
 </div>

 {:else if currentView === 'complete'}
 <div class="complete-view">
 <h1>Great Job!</h1>
 <p>You've completed this study session.</p>
 <button type="button" class="btn-primary" onclick={() => currentView = 'home'}>
 Continue Learning
 </button>
 </div>

 {:else if currentView === 'sentence' && currentSentence}
 <div class="sentence-view">
 <button type="button" class="back-btn" onclick={() => currentView = 'home'}>
 ← Back
 </button>
 
 <div class="progress-bar">
 <div class="progress-fill" style="width: {(sentenceIndex / sentenceCards.length) * 100}%"></div>
 </div>
 <p class="progress-text">{sentenceIndex + 1} / {sentenceCards.length}</p>

 <div class="sentence-container">
 <div class="sentence-word">
 <span class="word-label">Word:</span>
 <span class="word-hanzi">{currentSentence.word}</span>
 </div>
 
 <div 
 class="sentence-card"
 onclick={() => showSentenceAnswer = !showSentenceAnswer}
 role="button"
 >
 <div class="sentence-chinese">{currentSentence.chinese}</div>
 {#if showSentenceAnswer}
 <div class="sentence-english">{currentSentence.english}</div>
 {:else}
 <p class="card-hint">Tap to reveal translation</p>
 {/if}
 </div>
 </div>

 <div class="sentence-actions">
 <button 
 type="button"
 class="btn-audio" 
 onclick={() => speak(currentSentence.chinese)}
 title="Play audio"
 >
 🔊
 </button>
 <button 
 type="button" 
 class="btn-primary"
 onclick={nextSentenceCard}
 >
 Next Sentence
 </button>
 </div>
 {#if audioStatus}
 <p class="audio-status">{audioStatus}</p>
 {/if}
 </div>

 {:else if currentView === 'dialogue' && currentDialogue}
 <div class="dialogue-view">
 <button type="button" class="back-btn" onclick={() => currentView = 'home'}>
 ← Back
 </button>
 
 <div class="dialogue-header">
 <h2>{currentDialogue.title}</h2>
 <p class="dialogue-level">HSK {currentDialogue.level}</p>
 </div>

 <div class="dialogue-progress">
 {#each currentDialogue.lines as line, i}
 <div 
 class="dialogue-line {i === dialogueLineIndex ? 'active' : ''} {i < dialogueLineIndex ? 'completed' : ''}"
>
 {#if i <= dialogueLineIndex}
 <div class="speaker">{line.speaker}</div>
 <div class="line-chinese" onclick={() => speak(line.chinese)}>{line.chinese}</div>
 {#if showDialogueTranslation || i < dialogueLineIndex}
 <div class="line-english">{line.english}</div>
 <div class="line-pinyin">{line.pinyin}</div>
 {:else}
 <button 
 type="button"
 class="btn-hint"
 onclick={() => showDialogueTranslation = true}
 >
 Show Translation
 </button>
 {/if}
 {:else}
 <div class="line-locked">???</div>
 {/if}
 </div>
 {/each}
 </div>

 <div class="dialogue-nav">
 <button 
 type="button"
 class="btn-secondary"
 onclick={prevDialogueLine}
 disabled={dialogueLineIndex === 0}
 >
 ← Previous
 </button>
 <button 
 type="button"
 class="btn-audio"
 onclick={() => speak(currentDialogue.lines[dialogueLineIndex].chinese)}
 title="Play audio"
 >
 🔊
 </button>
 <button 
 type="button"
 class="btn-primary"
 onclick={nextDialogueLine}
 >
 {dialogueLineIndex === currentDialogue.lines.length - 1 ? 'Finish' : 'Next →'}
 </button>
 </div>
 {#if audioStatus}
 <p class="audio-status">{audioStatus}</p>
 {/if}
 </div>

 {:else if currentView === 'lessons'}
 <div class="lessons-view">
    <button type="button" class="back-btn" onclick={() => currentView = 'home'}>
    ← Back
    </button>
    
    <div class="lessons-header">
    <h1>HSK {currentLessonLevel} Lessons</h1>
    <p class="lessons-subtitle">Learn from official HSK textbook dialogues</p>
    
    <div class="mode-toggle">
      <span class="mode-label">Navigation:</span>
      <button 
      type="button"
      class="mode-btn {navigationMode === 'free' ? 'active' : ''}"
      onclick={() => navigationMode = 'free'}
      >
      Free Browse
      </button>
      <button 
      type="button"
      class="mode-btn {navigationMode === 'sequential' ? 'active' : ''}"
      onclick={() => navigationMode = 'sequential'}
      >
      Sequential
      </button>
    </div>
    {#if navigationMode === 'sequential'}
      <p class="mode-hint">Complete lessons in order. Pass quizzes to unlock the next lesson.</p>
    {:else}
      <p class="mode-hint">Browse any lesson freely. Learn at your own pace.</p>
    {/if}
    </div>
    
    <div class="lessons-grid">
    {#each getLessonsForLevel(currentLessonLevel) as lesson}
      <div onclick={() => startLesson(lesson)}>
      <LessonCard 
      {lesson}
      completed={isLessonCompleted(lesson)}
      locked={isLessonLocked(lesson)}
      progress={getLessonProgress(lesson)}
      />
      </div>
    {/each}
    </div>
 </div>

 {:else if currentView === 'lesson-player' && currentLesson}
 <div class="lesson-player-view">
    <button type="button" class="back-btn" onclick={() => currentView = 'lessons'}>
    ← Back to Lessons
    </button>
    
    <DialoguePlayer 
    dialogue={currentLesson}
    {showPinyin}
	/>
	</div>

{:else if currentView === 'settings'}
	<div class="settings-view">
		<button type="button" class="back-btn" onclick={() => currentView = 'home'}>
			← Back
		</button>
		
		<h1>Settings</h1>
		
		<section class="settings-section">
			<h2>Backup Progress</h2>
			<p>Export your learning progress to a file for safekeeping.</p>
			<button type="button" class="btn-primary" onclick={exportProgress}>
				Export Progress
			</button>
		</section>
		
		<section class="settings-section">
			<h2>Restore Progress</h2>
			<p>Import a previously exported progress file.</p>
			<label class="btn-secondary" style="cursor: pointer; display: inline-block; padding: 0.75rem 1rem;">
				Import Progress
				<input type="file" accept=".json" onchange={importProgress} style="display: none;">
			</label>
		</section>
		
		<section class="settings-section">
			<h2>Clear Progress</h2>
			<p>Reset all your learning progress. This cannot be undone.</p>
			<button type="button" class="btn-danger" onclick={() => {
				if (confirm('Are you sure? This will delete all your progress!')) {
					progress = {};
					localStorage.removeItem('volta-chinese-progress');
				}
			}}>
				Clear All Progress
			</button>
		</section>
		
		<section class="settings-section about">
			<h2>About Volta Chinese</h2>
			<p>Free HSK 1-5 vocabulary and dialogue practice app.</p>
			<p class="donation-note">Enjoying the app? Consider supporting development:</p>
			<div class="btc-address">
				<span>BTC:</span>
				<code>1NV2myQZNXU1ahPXTyZJnGF7GfdC4SZCN2</code>
			</div>
		</section>
	</div>

{/if}
</main>

<style>
 :global(*) {
 box-sizing: border-box;
 margin: 0;
 padding: 0;
 }
 
 :global(body) {
 font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
 background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
 color: #e0e0e0;
 min-height: 100vh;
 }
 
 main {
 min-height: 100vh;
 padding: 1rem;
 max-width: 600px;
 margin: 0 auto;
 }
 
 .navbar {
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: 1rem 0;
 margin-bottom: 2rem;
 }
 
 .nav-brand {
 display: flex;
 align-items: center;
 gap: 0.5rem;
 cursor: pointer;
 }
 
 .logo {
 font-size: 2rem;
 color: #ff6b6b;
 }
 
 .brand-text {
 font-size: 1.2rem;
 font-weight: 600;
 }
 
 .nav-controls {
 display: flex;
 align-items: center;
 gap: 1rem;
 }
 
 .toggle {
 display: flex;
 align-items: center;
 gap: 0.5rem;
 cursor: pointer;
 }
 
 .toggle input {
 width: 1.2rem;
 height: 1.2rem;
 accent-color: #ff6b6b;
 }
 
.toggle-label {
	font-size: 0.9rem;
}

.btn-settings {
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: #a0a0a0;
	padding: 0.5rem 0.75rem;
	border-radius: 8px;
	cursor: pointer;
	font-size: 1.1rem;
	transition: all 0.2s;
}

.btn-settings:hover {
	border-color: #ff6b6b;
	color: #ff6b6b;
}

.hero {
 text-align: center;
 padding: 3rem 1rem 2rem;
 }

 .hero h1 {
 font-size: 3rem;
 margin-bottom: 0.75rem;
 color: #fff;
 }

 .subtitle {
 color: #a0a0a0;
 font-size: 1.1rem;
 margin-bottom: 1.5rem;
 }

 .hero-stats {
 display: flex;
 justify-content: center;
 gap: 2rem;
 flex-wrap: wrap;
 }

 .hero-stats span {
 background: rgba(255, 107, 107, 0.15);
 border: 1px solid rgba(255, 107, 107, 0.3);
 padding: 0.5rem 1rem;
 border-radius: 20px;
 font-size: 0.9rem;
 color: #ff8a8a;
 }
 
.levels {
 margin-top: 2rem;
 }

 .levels h2 {
 text-align: center;
 margin-bottom: 1.5rem;
 color: #a0a0a0;
 }

 /* Practice Section */
 .practice-section {
 margin-top: 2rem;
 }

 .practice-section h2 {
 text-align: center;
 margin-bottom: 1.5rem;
 color: #a0a0a0;
 }

 .level-grid {
 display: grid;
 grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
 gap: 1.5rem;
 max-width: 1200px;
 margin: 0 auto;
 }

 .level-card {
 background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 255, 255, 0.05));
 border: 1px solid rgba(255, 255, 255, 0.1);
 border-radius: 16px;
 padding: 1.5rem;
 transition: transform 0.2s, box-shadow 0.2s;
 }

.level-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(255, 107, 107, 0.15);
}

.level-header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 0.5rem;
 }

 .level-badge {
 background: #ff6b6b;
 color: white;
 padding: 0.25rem 0.75rem;
 border-radius: 20px;
 font-size: 0.85rem;
 font-weight: 600;
 }

 .level-words {
 color: #888;
 font-size: 0.85rem;
 }

 .level-desc {
 color: #a0a0a0;
 font-size: 0.9rem;
 margin-bottom: 1rem;
 }

 .practice-buttons {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 0.5rem;
 }

 .btn-review {
 width: 100%;
 background: transparent;
 border: 1px dashed #ff6b6b;
 color: #ff6b6b;
 padding: 0.5rem;
 border-radius: 6px;
 cursor: pointer;
 font-size: 0.85rem;
 margin-top: 0.5rem;
 transition: all 0.2s;
 }

 .btn-review:hover:not(:disabled) {
 background: rgba(255, 107, 107, 0.1);
 }

 .level-info h2 {
 font-size: 1.3rem;
 margin-bottom: 0.25rem;
 }
 
 .level-desc {
 color: #a0a0a0;
 font-size: 0.9rem;
 }
 
 .level-actions {
 display: flex;
 gap: 0.5rem;
 }
 
 .btn-primary {
 background: #ff6b6b;
 color: white;
 border: none;
 padding: 0.75rem 1.5rem;
 border-radius: 8px;
 cursor: pointer;
 font-size: 1rem;
 font-weight: 500;
 transition: all 0.2s;
 }
 
 .btn-primary:hover:not(:disabled) {
 background: #ff5252;
 transform: translateY(-1px);
 }
 
 .btn-primary:disabled {
 opacity: 0.5;
 cursor: not-allowed;
 }
 
 .btn-secondary {
 background: transparent;
 color: #e0e0e0;
 border: 1px solid #4a5568;
 padding: 0.75rem 1.5rem;
 border-radius: 8px;
 cursor: pointer;
 font-size: 1rem;
 transition: all 0.2s;
 }
 
 .btn-secondary:hover:not(:disabled) {
 border-color: #ff6b6b;
 color: #ff6b6b;
 }
 
 .btn-secondary:disabled {
 opacity: 0.5;
 cursor: not-allowed;
}

 .mode-count {
 color: #ffd93d;
 font-size: 0.85rem;
 margin-bottom: 1rem;
 }

 /* Flashcard View */
 .flashcard-view {
 display: flex;
 flex-direction: column;
 gap: 1.5rem;
 }
 
 .back-btn {
 background: transparent;
 border: none;
 color: #a0a0a0;
 font-size: 1rem;
 cursor: pointer;
 padding: 0.5rem 0;
 text-align: left;
 }
 
 .back-btn:hover {
 color: #e0e0e0;
 }
 
 .progress-bar {
 height: 4px;
 background: rgba(255, 255, 255, 0.1);
 border-radius: 2px;
 overflow: hidden;
 }
 
 .progress-fill {
 height: 100%;
 background: #ff6b6b;
 transition: width 0.3s;
 }
 
 .progress-text {
 text-align: center;
 color: #a0a0a0;
 font-size: 0.9rem;
 }
 
 .card-container {
 display: flex;
 justify-content: center;
 }
 
 .flashcard {
 background: rgba(255, 255, 255, 0.1);
 border-radius: 16px;
 padding: 3rem 2rem;
 min-height: 250px;
 min-width: 280px;
 display: flex;
 flex-direction: column;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 transition: all 0.2s;
 text-align: center;
 }
 
 .flashcard:hover {
 background: rgba(255, 255, 255, 0.15);
 transform: scale(1.02);
 }
 
 .card-hanzi {
 font-size: 4rem;
 font-weight: 300;
 margin-bottom: 1rem;
 }
 
 .card-pinyin {
 font-size: 1.5rem;
 color: #ffd93d;
 margin-bottom: 1rem;
 }
 
 .card-meaning {
 font-size: 1.2rem;
 color: #a0a0a0;
 }
 
 .card-hint {
 color: #666;
 font-size: 0.9rem;
 }
 
 .card-actions {
 display: flex;
 justify-content: center;
 gap: 1rem;
 margin-top: 1rem;
 }
 
 .btn-known {
 background: #4ade80;
 color: #1a1a2e;
 border: none;
 padding: 0.75rem 2rem;
 border-radius: 8px;
 cursor: pointer;
 font-size: 1rem;
 font-weight: 500;
 transition: all 0.2s;
 -webkit-tap-highlight-color: transparent;
 touch-action: manipulation;
 }
 
 .btn-known:hover {
 background: #22c55e;
 }
 
 .btn-known:active {
 background: #16a34a;
 }
 
 .btn-unknown {
 background: #f87171;
 color: white;
 border: none;
 padding: 0.75rem 2rem;
 border-radius: 8px;
 cursor: pointer;
 font-size: 1rem;
 font-weight: 500;
 transition: all 0.2s;
 -webkit-tap-highlight-color: transparent;
 touch-action: manipulation;
 }
 
 .btn-unknown:hover {
 background: #ef4444;
 }
 
 .btn-unknown:active {
 background: #dc2626;
 }
 
 .btn-audio {
 background: rgba(255, 255, 255, 0.1);
 border: none;
 color: #e0e0e0;
 padding: 0.75rem;
 border-radius: 50%;
 cursor: pointer;
 font-size: 1.2rem;
 transition: all 0.2s;
 width: 48px;
 height: 48px;
 display: flex;
 align-items: center;
 justify-content: center;
 -webkit-tap-highlight-color: transparent;
 touch-action: manipulation;
 }
 
 .btn-audio:hover {
 background: rgba(255, 255, 255, 0.2);
 }
 
 .btn-audio:active {
 background: rgba(255, 255, 255, 0.3);
 }
 
 .audio-status {
 text-align: center;
 color: #ffd93d;
 font-size: 0.9rem;
 }
 
 /* Writing View */
 .writing-view {
 display: flex;
 flex-direction: column;
 gap: 1.5rem;
 }
 
 .writing-container {
 display: flex;
 flex-direction: column;
 align-items: center;
 gap: 1.5rem;
 }
 
 .writing-prompt {
 text-align: center;
 }
 
 .prompt-label {
 color: #a0a0a0;
 font-size: 1rem;
 margin-bottom: 0.5rem;
 }
 
 .prompt-word {
 font-size: 2.5rem;
 margin-bottom: 0.5rem;
 letter-spacing: 0.5rem;
 color: #ff6b6b;
 }
 
 .prompt-meaning {
 font-size: 1.3rem;
 margin-bottom: 0.5rem;
 }
 
 .prompt-pinyin {
 color: #ffd93d;
 font-size: 1.1rem;
 }
 
 .writing-area {
 display: flex;
 flex-direction: column;
 align-items: center;
 }
 
 .writing-grid {
 background: rgba(255, 255, 255, 0.05);
 border: 2px solid rgba(255, 255, 255, 0.1);
 border-radius: 12px;
 min-height: 220px;
 min-width: 220px;
 display: flex;
 align-items: center;
 justify-content: center;
 position: relative;
 }
 
 .writing-hint {
 color: #666;
 font-size: 0.9rem;
 text-align: center;
 padding: 1rem;
 }
 
 .stroke-feedback {
 text-align: center;
 font-size: 1.1rem;
 color: #4ade80;
 font-weight: 500;
 min-height: 1.5rem;
 }
 
 .writing-actions {
 display: flex;
 justify-content: center;
 gap: 1rem;
 flex-wrap: wrap;
 }
 
 /* Complete View */
 .complete-view {
 text-align: center;
 padding: 4rem 2rem;
 }
 
 .complete-view h1 {
 font-size: 2.5rem;
 color: #4ade80;
 margin-bottom: 1rem;
 }
 
 .complete-view p {
 color: #a0a0a0;
 margin-bottom: 2rem;
 }

 /* Sentence View */
 .sentence-view {
 padding: 2rem;
 max-width: 800px;
 margin: 0 auto;
 }

 .sentence-container {
 margin: 2rem 0;
 }

 .sentence-word {
 display: flex;
 align-items: center;
 gap: 0.5rem;
 margin-bottom: 1rem;
 }

 .word-label {
 color: #a0a0a0;
 font-size: 0.9rem;
 }

 .word-hanzi {
 font-size: 1.5rem;
 color: #4ade80;
 font-weight: 500;
 }

 .sentence-card {
 background: #16213e;
 border-radius: 12px;
 padding: 2rem;
 cursor: pointer;
 transition: transform 0.2s;
 text-align: center;
 }

 .sentence-card:hover {
 transform: scale(1.02);
 }

 .sentence-chinese {
 font-size: 1.8rem;
 line-height: 1.6;
 color: #fff;
 margin-bottom: 1rem;
 }

 .sentence-english {
 font-size: 1.1rem;
 color: #a0a0a0;
 line-height: 1.5;
 }

 .sentence-actions {
 display: flex;
 justify-content: center;
 gap: 1rem;
margin-top: 1.5rem;
 }

 /* Dialogue View */
 .dialogue-view {
 padding: 2rem;
 max-width: 800px;
 margin: 0 auto;
 }

 .dialogue-header {
 text-align: center;
 margin-bottom: 2rem;
 }

 .dialogue-header h2 {
 font-size: 1.8rem;
 color: #fff;
 margin-bottom: 0.5rem;
 }

 .dialogue-level {
 color: #4ade80;
 font-size: 0.9rem;
 }

 .dialogue-progress {
 margin: 2rem 0;
 }

 .dialogue-line {
 background: #16213e;
 border-radius: 12px;
 padding: 1rem 1.5rem;
 margin-bottom: 0.75rem;
 transition: all 0.3s;
 border: 2px solid transparent;
 }

 .dialogue-line.active {
 border-color: #4ade80;
 transform: scale(1.02);
 }

 .dialogue-line.completed {
 opacity: 0.7;
 }

 .speaker {
 font-size: 0.85rem;
 color: #4ade80;
 font-weight: 600;
 margin-bottom: 0.5rem;
 }

 .line-chinese {
 font-size: 1.4rem;
 color: #fff;
 cursor: pointer;
 margin-bottom: 0.5rem;
 }

 .line-chinese:hover {
 text-decoration: underline;
 }

 .line-english {
 font-size: 1rem;
 color: #a0a0a0;
 margin-bottom: 0.25rem;
 }

 .line-pinyin {
 font-size: 0.85rem;
 color: #666;
 font-style: italic;
 }

 .line-locked {
 color: #555;
 text-align: center;
 padding: 1rem;
 }

 .btn-hint {
 background: transparent;
 border: 1px dashed #555;
 color: #888;
 padding: 0.5rem 1rem;
 border-radius: 6px;
 cursor: pointer;
 font-size: 0.85rem;
 margin-top: 0.5rem;
 }

 .btn-hint:hover {
 border-color: #4ade80;
 color: #4ade80;
 }

 .dialogue-nav {
 display: flex;
 justify-content: center;
	align-items: center;
	gap: 1rem;
	margin-top: 1.5rem;
}

/* Settings View */
.settings-view {
	padding: 1rem;
}

.settings-view h1 {
	text-align: center;
	margin-bottom: 2rem;
}

.settings-section {
	background: rgba(255, 255, 255, 0.05);
	padding: 1.5rem;
	border-radius: 12px;
	margin-bottom: 1.5rem;
}

.settings-section h2 {
	font-size: 1.1rem;
	margin-bottom: 0.5rem;
	color: #fff;
}

.settings-section p {
	color: #a0a0a0;
	margin-bottom: 1rem;
	font-size: 0.95rem;
}

.btn-danger {
	background: #ef4444;
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	cursor: pointer;
	font-size: 1rem;
	transition: all 0.2s;
}

.btn-danger:hover {
	background: #dc2626;
}

.settings-section.about {
	text-align: center;
}

.settings-section.about .donation-note {
	color: #4ade80;
	margin-top: 1rem;
}

.settings-section.about .btc-address {
	background: rgba(0, 0, 0, 0.3);
	padding: 1rem;
	border-radius: 8px;
	margin-top: 0.5rem;
}

.settings-section.about .btc-address span {
	color: #a0a0a0;
	margin-right: 0.5rem;
}

.settings-section.about .btc-address code {
	color: #ffd93d;
	font-size: 0.85rem;
}

/* Lessons View */
.lessons-view {
    padding: 1rem;
 }

 .lessons-header {
    text-align: center;
    margin-bottom: 2rem;
 }

 .lessons-header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
 }

 .lessons-subtitle {
    color: #a0a0a0;
    font-size: 1rem;
    margin-bottom: 1.5rem;
 }

 .mode-toggle {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
 }

 .mode-label {
    color: #a0a0a0;
    font-size: 0.9rem;
 }

 .mode-btn {
    background: transparent;
    border: 1px solid #4a5568;
    color: #a0a0a0;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
 }

 .mode-btn:hover {
    border-color: #ff6b6b;
    color: #ff6b6b;
 }

 .mode-btn.active {
    background: #ff6b6b;
    border-color: #ff6b6b;
    color: white;
 }

 .mode-hint {
    color: #666;
    font-size: 0.85rem;
    font-style: italic;
 }

 .lessons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
 }

 .btn-lessons {
    width: 100%;
    background: linear-gradient(135deg, #4ade80, #22c55e);
    color: #1a1a2e;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    margin-top: 0.5rem;
    transition: all 0.2s;
 }

 .btn-lessons:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
 }

 /* Lesson Player View */
 .lesson-player-view {
    padding: 1rem;
    max-width: 800px;
    margin: 0 auto;
 }
</style>
