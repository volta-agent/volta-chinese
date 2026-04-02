<script>
  import { onMount } from 'svelte';
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
 audioStatus = 'Playing...';
 
 if (!('speechSynthesis' in window)) {
 audioStatus = '';
 alert('Speech synthesis not supported in this browser.');
 return;
 }
 
 try {
 // Cancel any ongoing speech
 speechSynthesis.cancel();
 
 const utterance = new SpeechSynthesisUtterance(text);
 utterance.lang = 'zh-CN';
 utterance.rate = 0.8;
 utterance.pitch = 1;
 
 // Try to find a Chinese voice
 const voices = speechSynthesis.getVoices();
 const zhVoice = voices.find(v => v.lang.startsWith('zh'));
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
 console.error('Speech error:', e);
 audioStatus = 'Error';
 };
 
 speechSynthesis.speak(utterance);
 } catch (e) {
 console.error('Speech exception:', e);
 audioStatus = 'Error';
 }
 }
  
  function getWordsForLevel(level) {
    if (level === 1) return hsk1;
    return [];
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
    currentView = 'writing';
  }
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
    } else {
      currentView = 'complete';
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
 <button class="btn-premium" onclick={() => currentView = 'premium'}>
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
      {#each LEVELS as lvl}
        <div class="level-card" class:locked={lvl.level > 1 && !isPremium}>
          <div class="level-info">
            <h2>{lvl.name}</h2>
            <p class="level-desc">{lvl.desc} · {lvl.count} words</p>
          </div>
          <div class="level-actions">
            <button 
              class="btn-primary"
              onclick={() => startFlashcards(lvl.level)}
              disabled={lvl.level > 1 && !isPremium}
            >
              Flashcards
            </button>
            <button 
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
      <button class="back-btn" onclick={() => currentView = 'home'}>
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
        <button class="btn-unknown" onclick={markUnknown}>
          Don't Know
        </button>
        <button 
          class="btn-audio" 
          onclick={() => speak(currentCard.hanzi)}
          title="Play audio"
        >
          🔊
        </button>
        <button class="btn-known" onclick={markKnown}>
          Know It
        </button>
      </div>
      {#if audioStatus}
        <p class="audio-status">{audioStatus}</p>
      {/if}
    </div>

  {:else if currentView === 'writing' && writingCard}
    <div class="writing-view">
      <button class="back-btn" onclick={() => currentView = 'home'}>
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
          <div class="writing-grid">
            <!-- Placeholder for drawing - simplified for now -->
            <p class="writing-hint">Draw the character on paper or tablet</p>
          </div>
        </div>
        
        <div class="writing-actions">
          <button 
            class="btn-audio" 
            onclick={() => speak(writingCard.hanzi)}
            title="Play audio"
          >
            🔊
          </button>
          <button 
            class="btn-secondary" 
            onclick={() => showStrokeHint = !showStrokeHint}
          >
            {showStrokeHint ? 'Hide' : 'Show'} Answer
          </button>
          <button class="btn-primary" onclick={nextWritingCard}>
            Next
          </button>
        </div>
      </div>
    </div>

  {:else if currentView === 'complete'}
    <div class="complete-view">
      <h1>Great Job!</h1>
      <p>You've completed this study session.</p>
      <button class="btn-primary" onclick={() => currentView = 'home'}>
        Continue Learning
      </button>
    </div>

  {:else if currentView === 'premium'}
    <div class="premium-view">
      <button class="back-btn" onclick={() => currentView = 'home'}>
        ← Back
      </button>
      
      <h1>Premium Features</h1>
      
      {#if isPremium}
        <div class="premium-active">
          <p>★ Premium Active</p>
          <p class="premium-note">You have access to all features.</p>
        </div>
      {:else}
        <div class="premium-features">
          <ul>
            <li>✓ All 5 HSK levels (1500+ words)</li>
            <li>✓ Writing practice with stroke detection</li>
            <li>✓ Mistake review mode</li>
            <li>✓ Offline access (PWA)</li>
            <li>✓ Custom vocabulary lists</li>
            <li>✓ Progress export</li>
            <li>✓ Detailed statistics</li>
            <li>✓ Audio speed control</li>
            <li>✓ Dark/Light themes</li>
          </ul>
          
          <div class="donation-section">
            <h3>Unlock Premium</h3>
            <p>Pay what you want. Any amount appreciated.</p>
            <p class="btc">BTC: 1NV2myQZNXU1ahPXTyZJnGF7GfdC4SZCN2</p>
            
            <div class="key-input">
              <input 
                type="text" 
                bind:value={premiumKey}
                placeholder="Enter unlock key"
              >
              <button onclick={activatePremium}>Unlock</button>
            </div>
            <p class="key-hint">Keys are sent after donation confirmation.</p>
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

  <footer class="footer">
    <p>
      Built by <a href="https://github.com/volta-agent" target="_blank">Volta</a> · 
      <a href="https://github.com/volta-agent/volta-chinese">Source</a>
    </p>
  </footer>
</main>

<style>
  :global(*), :global(*::before), :global(*::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f1419;
    color: #e7e9ea;
    line-height: 1.6;
    min-height: 100vh;
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: #1a1f25;
    border-bottom: 1px solid #2f3336;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  .logo {
    font-size: 1.75rem;
    color: #ff6b6b;
  }

  .brand-text {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ff6b6b, #ffd93d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .voices-loading {
    font-size: 0.8rem;
    color: #ffd93d;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .toggle input {
    width: 18px;
    height: 18px;
    accent-color: #ff6b6b;
  }

  .toggle-label {
    color: #8b98a5;
    font-size: 0.9rem;
  }

  .btn-premium {
    background: transparent;
    border: 1px solid #ffd93d;
    color: #ffd93d;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-premium:hover {
    background: #ffd93d;
    color: #0f1419;
  }

  .hero {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(180deg, #1a1f25 0%, #0f1419 100%);
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
    font-size: 1.1rem;
    color: #8b98a5;
    max-width: 500px;
    margin: 0 auto;
  }

  .levels {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .level-card {
    background: #1a1f25;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #2f3336;
    transition: border-color 0.2s;
  }

  .level-card:hover {
    border-color: #ff6b6b;
  }

  .level-card.locked {
    opacity: 0.6;
  }

  .level-info h2 {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  .level-desc {
    color: #8b98a5;
    font-size: 0.9rem;
  }

  .level-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-primary {
    background: #ff6b6b;
    color: #fff;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;
  }

  .btn-primary:hover:not(:disabled) {
    background: #ff5252;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    color: #e7e9ea;
    border: 1px solid #2f3336;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: #e7e9ea;
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Flashcard styles */
  .flashcard-view, .writing-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

  .back-btn {
    align-self: flex-start;
    background: transparent;
    border: none;
    color: #8b98a5;
    cursor: pointer;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: #e7e9ea;
  }

  .progress-bar {
    width: 100%;
    max-width: 400px;
    height: 4px;
    background: #2f3336;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: #ff6b6b;
    transition: width 0.3s;
  }

  .progress-text {
    color: #8b98a5;
    font-size: 0.85rem;
    margin-bottom: 2rem;
  }

  .card-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .flashcard {
    background: #1a1f25;
    border-radius: 16px;
    padding: 3rem 2rem;
    min-width: 300px;
    min-height: 250px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px solid #2f3336;
    transition: border-color 0.2s, transform 0.2s;
  }

  .flashcard:hover {
    border-color: #ff6b6b;
    transform: scale(1.02);
  }

  .card-hanzi {
    font-size: 4rem;
    color: #fff;
    margin-bottom: 1rem;
  }

  .card-pinyin {
    font-size: 1.25rem;
    color: #ffd93d;
    margin-bottom: 1rem;
  }

  .card-meaning {
    font-size: 1rem;
    color: #8b98a5;
    text-align: center;
  }

  .card-hint {
    color: #8b98a5;
    font-size: 0.9rem;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn-known, .btn-unknown {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-known {
    background: #00ba7c;
    color: #fff;
  }

  .btn-known:hover {
    background: #00a06a;
  }

  .btn-unknown {
    background: #ff5252;
    color: #fff;
  }

  .btn-unknown:hover {
    background: #e64646;
  }

  .btn-audio {
    background: #2f3336;
    border: none;
    color: #e7e9ea;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.25rem;
    transition: background 0.2s;
  }

  .btn-audio:hover {
    background: #3f4346;
  }

  .audio-status {
    color: #ffd93d;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

  /* Writing view styles */
  .writing-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 400px;
  }

  .writing-prompt {
    text-align: center;
    margin-bottom: 2rem;
  }

  .prompt-label {
    color: #8b98a5;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .prompt-meaning {
    font-size: 1.5rem;
    color: #e7e9ea;
    margin-bottom: 0.25rem;
  }

  .prompt-pinyin {
    color: #ffd93d;
    font-size: 1rem;
  }

  .writing-area {
    width: 200px;
    height: 200px;
    background: #1a1f25;
    border: 2px solid #2f3336;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 1.5rem;
  }

  .writing-grid {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .writing-hint {
    color: #8b98a5;
    font-size: 0.85rem;
    text-align: center;
    padding: 1rem;
  }

  .character-reference {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .character-reference.hidden {
    display: none;
  }

  .ref-char {
    font-size: 6rem;
    color: rgba(255, 107, 107, 0.3);
  }

  .writing-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Complete view */
  .complete-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
  }

  .complete-view h1 {
    font-size: 2.5rem;
    color: #00ba7c;
    margin-bottom: 1rem;
  }

  /* Premium view */
  .premium-view {
    flex: 1;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .premium-view h1 {
    font-size: 2rem;
    margin: 1.5rem 0;
  }

  .premium-active {
    background: #1a3a1a;
    border: 1px solid #00ba7c;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
  }

  .premium-active p:first-child {
    color: #00ba7c;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .premium-note {
    color: #8b98a5;
    margin-top: 0.5rem;
  }

  .premium-features ul {
    list-style: none;
    margin: 1.5rem 0;
  }

  .premium-features li {
    padding: 0.75rem 0;
    border-bottom: 1px solid #2f3336;
    color: #e7e9ea;
  }

  .donation-section {
    background: #1a1f25;
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  .donation-section h3 {
    margin-bottom: 0.5rem;
  }

  .btc {
    font-family: 'Fira Code', monospace;
    color: #ffd93d;
    background: #2f3336;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    display: inline-block;
    margin: 1rem 0;
    font-size: 0.85rem;
  }

  .key-input {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .key-input input {
    flex: 1;
    padding: 0.75rem;
    background: #0f1419;
    border: 1px solid #2f3336;
    border-radius: 6px;
    color: #e7e9ea;
    font-size: 1rem;
  }

  .key-input button {
    background: #ff6b6b;
    color: #fff;
    border: none;
    padding: 0 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }

  .key-hint {
    color: #8b98a5;
    font-size: 0.85rem;
    margin-top: 0.75rem;
  }

  .selfhost-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #2f3336;
  }

  .selfhost-section h3 {
    margin-bottom: 0.5rem;
  }

  .note {
    color: #8b98a5;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  /* Footer */
  .footer {
    text-align: center;
    padding: 1.5rem;
    border-top: 1px solid #2f3336;
    color: #8b98a5;
    font-size: 0.85rem;
  }

  .footer a {
    color: #ff6b6b;
    text-decoration: none;
  }

  .footer a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .navbar {
      padding: 1rem;
    }
    .hero h1 {
      font-size: 1.75rem;
    }
    .level-card {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    .card-hanzi {
      font-size: 3rem;
    }
    .ref-char {
      font-size: 4rem;
    }
  }
</style>
