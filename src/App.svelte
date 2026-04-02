<script>
 import { onMount } from 'svelte';
 import HanziWriter from 'hanzi-writer';
 import hsk1 from './lib/data/hsk1.json';
 
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
 let showStrokeHint = $state(false);
 let hanziWriterInstance = $state(null);
 let drawingCanvasReady = $state(false);
 
 const LEVELS = [
 { level: 1, name: 'HSK 1', count: 150, desc: 'Beginner' },
 { level: 2, name: 'HSK 2', count: 150, desc: 'Elementary' },
 { level: 3, name: 'HSK 3', count: 300, desc: 'Intermediate' },
 { level: 4, name: 'HSK 4', count: 600, desc: 'Upper Intermediate' },
 { level: 5, name: 'HSK 5', count: 1300, desc: 'Advanced' }
 ];
 
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
 
 // Use Web Speech API with proper voice loading
 if ('speechSynthesis' in window) {
 let voices = speechSynthesis.getVoices();
 
 const doSpeak = () => {
 try {
 speechSynthesis.cancel();
 
 const utterance = new SpeechSynthesisUtterance(text);
 utterance.lang = 'zh-CN';
 utterance.rate = 0.8;
 utterance.pitch = 1;
 
 // Find best Chinese voice
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
 
 // Voices might need to be loaded first
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
 if (level === 1) return hsk1;
 return [];
 }
 
 function shuffleArray(array) {
 for (let i = array.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [array[i], array[j]] = [array[j], array[i]];
 }
 return array;
 }
 
 function startFlashcards(level) {
 const words = getWordsForLevel(level);
 studyCards = shuffleArray([...words]).slice(0, 20);
 cardIndex = 0;
 currentCard = studyCards[0];
 showAnswer = false;
 currentView = 'flashcard';
 }
 
 function startWriting(level) {
 const words = getWordsForLevel(level);
 writingCards = shuffleArray([...words]).slice(0, 10);
 writingIndex = 0;
 writingCard = writingCards[0];
 showStrokeHint = false;
 hanziWriterInstance = null;
 drawingCanvasReady = false;
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
 
 function nextWritingCard() {
 writingIndex++;
 if (writingIndex < writingCards.length) {
 writingCard = writingCards[writingIndex];
 showStrokeHint = false;
 hanziWriterInstance = null;
 drawingCanvasReady = false;
 } else {
 currentView = 'complete';
 }
 }
 
 function initHanziWriter() {
 if (!writingCard || hanziWriterInstance) return;
 
 setTimeout(() => {
 const targetEl = document.getElementById('hanzi-writer-target');
 if (!targetEl) {
 console.log('Hanzi Writer target not found');
 return;
 }
 
 try {
 targetEl.innerHTML = '';
 
 hanziWriterInstance = HanziWriter.create('hanzi-writer-target', writingCard.hanzi, {
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
 console.log('Mistake on stroke', strokeData.strokeNum);
 },
 onCorrect: (strokeData) => {
 console.log('Correct stroke', strokeData.strokeNum);
 },
 onComplete: (summaryData) => {
 console.log('Quiz completed!', summaryData);
 }
 });
 
 drawingCanvasReady = true;
 } catch (e) {
 console.error('Hanzi Writer error:', e);
 }
 }, 50);
 }
 
 function playStrokeAnimation() {
 if (hanziWriterInstance) {
 hanziWriterInstance.showCharacter();
 hanziWriterInstance.animateCharacter({
 onComplete: () => {
 hanziWriterInstance.hideCharacter();
 hanziWriterInstance.quiz({
 onMistake: (strokeData) => {
 console.log('Mistake on stroke', strokeData.strokeNum);
 },
 onCorrect: (strokeData) => {
 console.log('Correct stroke', strokeData.strokeNum);
 },
 onComplete: (summaryData) => {
 console.log('Quiz completed!', summaryData);
 }
 });
 }
 });
 }
 }
 
 function markKnown() {
 if (!progress[currentCard.hanzi]) {
 progress[currentCard.hanzi] = { known: 0, unknown: 0 };
 }
 progress[currentCard.hanzi].known++;
 saveProgress();
 nextCard();
 }
 
 function markUnknown() {
 if (!progress[currentCard.hanzi]) {
 progress[currentCard.hanzi] = { known: 0, unknown: 0 };
 }
 progress[currentCard.hanzi].unknown++;
 saveProgress();
 nextCard();
 }
 
 // Initialize Hanzi Writer when entering writing view
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
 <button 
 type="button"
 class="btn-secondary"
 onclick={() => startWriting(lvl.level)}
 disabled={lvl.level > 1 && !isPremium}
 >
 Writing
 </button>
 </div>
 </div>
 {/each}
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
 <button type="button" class="btn-unknown" onclick={markUnknown}>
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
 <button type="button" class="btn-known" onclick={markKnown}>
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
 <p class="progress-text">{writingIndex + 1} / {writingCards.length}</p>

 <div class="writing-container">
 <div class="writing-prompt">
 <p class="prompt-label">Write this character:</p>
 <p class="prompt-meaning">{writingCard.meaning}</p>
 {#if showPinyin}
 <p class="prompt-pinyin">{writingCard.pinyin}</p>
 {/if}
 </div>
 
 <div class="writing-area">
 <div class="character-reference" class:hidden={!showStrokeHint}>
 <span class="ref-char">{writingCard.hanzi}</span>
 </div>
 <div class="writing-grid" id="hanzi-writer-target">
 {#if !drawingCanvasReady}
 <p class="writing-hint">Loading stroke data...</p>
 {/if}
 </div>
 </div>
 
 <div class="writing-actions">
 <button 
 type="button"
 class="btn-audio" 
 onclick={() => speak(writingCard.hanzi)}
 title="Play audio"
 >
 🔊
 </button>
 <button 
 type="button"
 class="btn-secondary" 
 onclick={() => { showStrokeHint = !showStrokeHint; if (showStrokeHint) playStrokeAnimation(); }}
 >
 {showStrokeHint ? 'Hide' : 'Show'} Answer
 </button>
 <button type="button" class="btn-primary" onclick={nextWritingCard}>
 Skip
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
 <h2>Support Development</h2>
 <p>This is a one-time donation. Premium features will be available for as long as the service is running or you can self-host.</p>
 
 <div class="btc-address">
 <p>Bitcoin:</p>
 <code>1NV2myQZNXU1ahPXTyZJnGF7GfdC4SZCN2</code>
 </div>
 
 <div class="unlock-section">
 <h3>Already donated?</h3>
 <input 
 type="text" 
 bind:value={premiumKey}
 placeholder="Enter unlock key"
 >
 <button type="button" onclick={activatePremium}>Unlock</button>
 </div>
 <p class="key-hint">Keys are sent after donation confirmation.</p>
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
 }
 
 .btn-known:hover {
 background: #22c55e;
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
 }
 
 .btn-unknown:hover {
 background: #ef4444;
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
 }
 
 .btn-audio:hover {
 background: rgba(255, 255, 255, 0.2);
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
 gap: 2rem;
 }
 
 .writing-prompt {
 text-align: center;
 }
 
 .prompt-label {
 color: #a0a0a0;
 font-size: 1rem;
 margin-bottom: 0.5rem;
 }
 
 .prompt-meaning {
 font-size: 1.5rem;
 margin-bottom: 0.5rem;
 }
 
 .prompt-pinyin {
 color: #ffd93d;
 font-size: 1.2rem;
 }
 
 .writing-area {
 display: flex;
 flex-direction: column;
 align-items: center;
 gap: 1rem;
 }
 
 .character-reference {
 display: flex;
 align-items: center;
 justify-content: center;
 }
 
 .ref-char {
 font-size: 5rem;
 color: rgba(255, 107, 107, 0.3);
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
