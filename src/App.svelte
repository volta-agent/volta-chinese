<script>
 import { onMount } from 'svelte';
 import HanziWriter from 'hanzi-writer';
 import hsk1 from './lib/data/hsk1.json';
 import hsk2 from './lib/data/hsk2.json';
 import hsk3 from './lib/data/hsk3.json';
 import hsk4 from './lib/data/hsk4.json';
 import hsk5 from './lib/data/hsk5.json';
 
 const HSK_DATA = { 1: hsk1, 2: hsk2, 3: hsk3, 4: hsk4, 5: hsk5 };
 
 let currentView = $state('home');
 let currentLevel = $state(1);
 let showPinyin = $state(true);
 let progress = $state({});
 let isPremium = $state(false);
 let premiumKey = $state('');
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
 checkPremium();
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
 
 function checkPremium() {
 const key = localStorage.getItem('volta-chinese-premium');
 if (key && validatePremiumKey(key)) {
 isPremium = true;
 premiumKey = key;
 }
 }
 
 function validatePremiumKey(key) {
 return key && key.length >= 8;
 }
 
 function activatePremium() {
 if (validatePremiumKey(premiumKey)) {
 localStorage.setItem('volta-chinese-premium', premiumKey);
 isPremium = true;
 }
 }
 
 function speak(text) {
 audioStatus = 'Loading...';
 
 if ('speechSynthesis' in window) {
 let voices = speechSynthesis.getVoices();
 
 const doSpeak = () => {
 try {
 speechSynthesis.cancel();
 
 const utterance = new SpeechSynthesisUtterance(text);
 utterance.lang = 'zh-CN';
 utterance.rate = 0.8;
 utterance.pitch = 1;
 
 voices = speechSynthesis.getVoices();
 const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
 if (zhVoice) {
 utterance.voice = zhVoice;
 }
 
 utterance.onstart = () => {
 audioStatus = 'Playing...';
 };
 
 utterance.onend = () => {
 audioStatus = '';
 };
 
 utterance.onerror = (e) => {
 console.log('Speech error:', e.error);
 audioStatus = '';
 };
 
 speechSynthesis.speak(utterance);
 } catch (e) {
 console.log('Speech exception:', e);
 audioStatus = '';
 }
 };
 
 if (voices.length === 0) {
 speechSynthesis.onvoiceschanged = doSpeak;
 setTimeout(() => {
 if (audioStatus === 'Loading...') {
 doSpeak();
 }
 }, 500);
 } else {
 doSpeak();
 }
 return;
 }
 
 audioStatus = '';
 console.log('Speech synthesis not available');
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
 <button type="button" class="btn-premium" onclick={() => currentView = 'premium'}>
 {isPremium ? '★ Premium' : 'Premium'}
 </button>
 </div>
 </nav>

 {#if currentView === 'home'}
 <section class="hero">
 <h1>Learn Chinese <em>Your Way</em></h1>
 <p class="subtitle">
 HSK 1-5 vocabulary with flashcards, writing practice, and listening exercises.
 </p>
 </section>

 <section class="levels">
 <h2>Choose Your Level</h2>
 {#each LEVELS as lvl}
 <div class="level-card" class:locked={lvl.level > 1 && !isPremium}>
 <div class="level-info">
 <h2>{lvl.name}</h2>
 <p class="level-desc">{lvl.desc} · {lvl.count} words</p>
 </div>
 <div class="level-actions">
 <button 
 type="button"
 class="btn-primary"
 onclick={() => startFlashcards(lvl.level)}
 disabled={lvl.level > 1 && !isPremium}
 >
 Flashcards
 </button>
 </div>
 </div>
 {/each}
 </section>

 <section class="writing-modes">
 <h2>Writing Practice</h2>
 <div class="writing-mode-cards">
 <div class="writing-mode-card">
 <h3>Single Characters</h3>
 <p class="mode-desc">Practice writing individual characters. Great for beginners.</p>
 <p class="mode-count">{getSingleCharWords(1).length} characters</p>
 <button 
 type="button"
 class="btn-secondary"
 onclick={() => startCharacterWriting(1)}
 >
 Practice
 </button>
 </div>
 <div class="writing-mode-card">
 <h3>Word Building</h3>
 <p class="mode-desc">Write each character in multi-character words.</p>
 <p class="mode-count">{getMultiCharWords(1).length} words</p>
 <button 
 type="button"
 class="btn-secondary"
 onclick={() => startWordWriting(1)}
 >
 Practice
 </button>
 </div>
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

 {:else if currentView === 'premium'}
 <div class="premium-view">
 <button type="button" class="back-btn" onclick={() => currentView = 'home'}>
 ← Back
 </button>
 
 <h1>Premium Features</h1>
 
 <div class="features-list">
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>All HSK levels (1-5)</span>
 </div>
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>Custom vocabulary lists</span>
 </div>
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>Advanced spaced repetition</span>
 </div>
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>Mistake review mode</span>
 </div>
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>Writing practice with stroke detection</span>
 </div>
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>Offline PWA support</span>
 </div>
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>Progress export</span>
 </div>
 <div class="feature">
 <span class="feature-icon">✓</span>
 <span>Themes & customization</span>
 </div>
 </div>
 
 {#if !isPremium}
 <div class="donation-section">
 <h2>Unlock Premium</h2>
 <p style="font-size: 1.1rem; color: #4ade80; margin-bottom: 1rem;">
 Premium features are free to use!
 </p>
 <p>Donations are greatly appreciated and help keep this project running.</p>
 
 <div class="btc-address">
 <p>Bitcoin donation:</p>
 <code>1NV2myQZNXU1ahPXTyZJnGF7GfdC4SZCN2</code>
 </div>
 
 <div class="unlock-section">
 <h3>Unlock Now</h3>
 <p style="color: #a0a0a0; font-size: 0.9rem; margin-bottom: 0.5rem;">
 Enter any key to unlock premium features:
 </p>
 <input 
 type="text" 
 bind:value={premiumKey}
 placeholder="Enter any key (e.g., 'unlock')"
 >
 <button type="button" onclick={activatePremium}>Unlock Premium</button>
 </div>
 </div>
 {:else}
 <div class="donation-section">
 <h2>Thank You!</h2>
 <p style="color: #4ade80;">Premium features are now unlocked.</p>
 <p style="margin-top: 1rem;">If you find this app helpful, consider supporting development:</p>
 
 <div class="btc-address">
 <p>Bitcoin:</p>
 <code>1NV2myQZNXU1ahPXTyZJnGF7GfdC4SZCN2</code>
 </div>
 </div>
 {/if}
 
 <div class="selfhost-section">
 <h3>Self-Host</h3>
 <p>Prefer to run your own instance? Clone the repo and deploy anywhere.</p>
 <p class="note">Premium features available for as long as the service is running. Self-hosting gives you full control.</p>
 </div>
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
 
 .btn-premium {
 background: transparent;
 border: 1px solid #ffd93d;
 color: #ffd93d;
 padding: 0.5rem 1rem;
 border-radius: 8px;
 cursor: pointer;
 font-size: 0.9rem;
 transition: all 0.2s;
 }
 
 .btn-premium:hover {
 background: #ffd93d;
 color: #1a1a2e;
 }
 
 .hero {
 text-align: center;
 padding: 2rem 0;
 }
 
 .hero h1 {
 font-size: 2.5rem;
 margin-bottom: 1rem;
 }
 
 .hero h1 em {
 color: #ff6b6b;
 font-style: normal;
 }
 
 .subtitle {
 color: #a0a0a0;
 font-size: 1.1rem;
 }
 
 .levels {
 margin-top: 2rem;
 }
 
 .levels h2 {
 text-align: center;
 margin-bottom: 1.5rem;
 color: #a0a0a0;
 }
 
 .level-card {
 background: rgba(255, 255, 255, 0.05);
 border-radius: 12px;
 padding: 1.5rem;
 margin-bottom: 1rem;
 display: flex;
 justify-content: space-between;
 align-items: center;
 gap: 1rem;
 flex-wrap: wrap;
 }
 
 .level-card.locked {
 opacity: 0.6;
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
 
 /* Writing Modes Section */
 .writing-modes {
 margin-top: 3rem;
 padding-top: 2rem;
 border-top: 1px solid rgba(255, 255, 255, 0.1);
 }
 
 .writing-modes h2 {
 text-align: center;
 margin-bottom: 1.5rem;
 color: #a0a0a0;
 }
 
 .writing-mode-cards {
 display: grid;
 gap: 1rem;
 }
 
 .writing-mode-card {
 background: rgba(255, 255, 255, 0.05);
 border-radius: 12px;
 padding: 1.5rem;
 text-align: center;
 }
 
 .writing-mode-card h3 {
 font-size: 1.2rem;
 margin-bottom: 0.5rem;
 }
 
 .mode-desc {
 color: #a0a0a0;
 font-size: 0.9rem;
 margin-bottom: 0.5rem;
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
 
 /* Premium View */
 .premium-view {
 padding: 1rem;
 }
 
 .premium-view h1 {
 text-align: center;
 margin-bottom: 2rem;
 }
 
 .features-list {
 display: grid;
 gap: 1rem;
 margin-bottom: 2rem;
 }
 
 .feature {
 display: flex;
 align-items: center;
 gap: 1rem;
 background: rgba(255, 255, 255, 0.05);
 padding: 1rem;
 border-radius: 8px;
 }
 
 .feature-icon {
 color: #4ade80;
 font-size: 1.2rem;
 }
 
 .donation-section {
 background: rgba(255, 255, 255, 0.05);
 padding: 2rem;
 border-radius: 12px;
 margin-bottom: 2rem;
 }
 
 .donation-section h2 {
 margin-bottom: 1rem;
 }
 
 .donation-section p {
 color: #a0a0a0;
 margin-bottom: 1.5rem;
 }
 
 .btc-address {
 background: rgba(0, 0, 0, 0.3);
 padding: 1rem;
 border-radius: 8px;
 margin-bottom: 1.5rem;
 word-break: break-all;
 }
 
 .btc-address p {
 margin-bottom: 0.5rem;
 font-size: 0.9rem;
 }
 
 .btc-address code {
 color: #ffd93d;
 font-size: 0.85rem;
 }
 
 .unlock-section {
 margin-top: 1.5rem;
 }
 
 .unlock-section h3 {
 margin-bottom: 1rem;
 }
 
 .unlock-section input {
 width: 100%;
 padding: 0.75rem;
 border-radius: 8px;
 border: 1px solid #4a5568;
 background: rgba(0, 0, 0, 0.3);
 color: #e0e0e0;
 margin-bottom: 1rem;
 font-size: 1rem;
 }
 
 .unlock-section button {
 background: #ffd93d;
 color: #1a1a2e;
 border: none;
 padding: 0.75rem 2rem;
 border-radius: 8px;
 cursor: pointer;
 font-size: 1rem;
 font-weight: 500;
 }
 
 .key-hint {
 color: #666 !important;
 font-size: 0.85rem !important;
 margin-top: 0.5rem !important;
 }
 
 .selfhost-section {
 background: rgba(255, 255, 255, 0.05);
 padding: 1.5rem;
 border-radius: 12px;
 }
 
 .selfhost-section h3 {
 margin-bottom: 0.5rem;
 }
 
 .selfhost-section p {
 color: #a0a0a0;
 margin-bottom: 0.5rem;
 }
 
 .note {
 font-size: 0.9rem;
 color: #666 !important;
 }
</style>
