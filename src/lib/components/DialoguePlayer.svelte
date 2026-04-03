<script>
 /**
 * DialoguePlayer.svelte - Plays through a lesson's dialogue
 * Shows each line with audio playback, pinyin, and translation
 */

 import { speakDialogueLine, speakWord } from '../utils/audio-service.js';

 let { dialogue, showPinyin = true, initialLine = 0 } = $props();
 
 let currentLineIndex = $state(initialLine);
 let showTranslation = $state(false);
 let isPlaying = $state(false);
 let audioStatus = $state('');

 let currentLine = $derived(dialogue?.lines?.[currentLineIndex] || null);
 let totalLines = $derived(dialogue?.lines?.length || 0);
 let isFirstLine = $derived(currentLineIndex === 0);
 let isLastLine = $derived(currentLineIndex === totalLines - 1);

 function nextLine() {
    if (currentLineIndex < totalLines - 1) {
      currentLineIndex++;
      showTranslation = false;
    } else {
      // Dispatch complete event via callback
      dialogue?.oncomplete?.();
    }
 }

 function prevLine() {
    if (currentLineIndex > 0) {
      currentLineIndex--;
      showTranslation = false;
    }
 }

 function revealTranslation() {
    showTranslation = true;
 }

 async function playAudio(text) {
    audioStatus = 'Loading...';
    isPlaying = true;

    try {
        await speakWord(text);
        audioStatus = '';
        isPlaying = false;
    } catch (e) {
        console.log('Speech error:', e);
        audioStatus = '';
        isPlaying = false;
    }
 }

 async function playCurrentDialogueLine() {
    if (!currentLine) return;
    
    audioStatus = 'Loading...';
    isPlaying = true;

    try {
        await speakDialogueLine(
        currentLine.chinese,
        currentLine.speaker,
        dialogue?.id || dialogue?.lesson,
        currentLineIndex + 1
        );
        audioStatus = '';
        isPlaying = false;
    } catch (e) {
        console.log('Speech error:', e);
        audioStatus = '';
        isPlaying = false;
    }
 }

 function playCurrentLine() {
    if (currentLine) {
        playCurrentDialogueLine();
    }
 }

 function goToLine(index) {
    if (index >= 0 && index < totalLines) {
      currentLineIndex = index;
      showTranslation = false;
    }
 }
</script>

<div class="dialogue-player">
 <!-- Header -->
 <div class="dialogue-header">
    <div class="lesson-badge">Lesson {dialogue?.lesson}</div>
    <h2 class="dialogue-title">{dialogue?.title}</h2>
    {#if dialogue?.title_pinyin}
    <p class="dialogue-pinyin">{dialogue.title_pinyin}</p>
    {/if}
    <p class="dialogue-english">{dialogue?.title_english}</p>
    {#if dialogue?.location}
    <p class="dialogue-location">{dialogue.location}</p>
    {/if}
 </div>
 
 <!-- Progress dots -->
 <div class="progress-dots">
    {#each Array(totalLines) as _, i}
    <button 
    type="button"
    class="dot {i === currentLineIndex ? 'active' : ''} {i < currentLineIndex ? 'passed' : ''}"
    onclick={() => goToLine(i)}
    aria-label="Go to line {i + 1}"
    >
    {i + 1}
    </button>
    {/each}
 </div>
 
 <!-- Current line display -->
 {#if currentLine}
 <div class="line-card">
    <div class="speaker-label">{currentLine.speaker}</div>
    
    <div 
    class="line-chinese" 
    onclick={playCurrentLine}
    role="button"
    tabindex="0"
    title="Click to play audio"
    >
    {currentLine.chinese}
    </div>
    
    {#if showPinyin}
    <div class="line-pinyin">{currentLine.pinyin}</div>
    {/if}
    
    {#if showTranslation}
    <div class="line-english">{currentLine.english}</div>
    {:else}
    <button type="button" class="reveal-btn" onclick={revealTranslation}>
    Show Translation
    </button>
    {/if}
 </div>
 {/if}
 
 <!-- Audio status -->
 {#if audioStatus}
 <p class="audio-status">{audioStatus}</p>
 {/if}
 
 <!-- Navigation controls -->
 <div class="dialogue-controls">
    <button 
    type="button" 
    class="nav-btn"
    onclick={prevLine}
    disabled={isFirstLine}
    >
    ← Previous
    </button>
    
    <button 
    type="button" 
    class="audio-btn"
    onclick={playCurrentLine}
    disabled={isPlaying}
    title="Play this line"
    >
    🔊
    </button>
    
    <button 
    type="button" 
    class="nav-btn primary"
    onclick={nextLine}
    >
    {isLastLine ? 'Finish' : 'Next →'}
    </button>
 </div>
 
 <!-- Vocabulary preview -->
 {#if dialogue?.vocabulary && dialogue.vocabulary.length > 0}
 <div class="vocab-section">
    <h3>Key Vocabulary</h3>
    <div class="vocab-grid">
    {#each dialogue.vocabulary.slice(0, 6) as word}
      <div class="vocab-item" onclick={() => playAudio(word.hanzi)}>
      <span class="vocab-hanzi">{word.hanzi}</span>
      <span class="vocab-pinyin">{word.pinyin}</span>
      <span class="vocab-def">{word.definition}</span>
      </div>
    {/each}
    </div>
    {#if dialogue.vocabulary.length > 6}
    <p class="vocab-more">+{dialogue.vocabulary.length - 6} more words</p>
    {/if}
 </div>
 {/if}
</div>

<style>
 .dialogue-player {
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem;
 }
 
 .dialogue-header {
    text-align: center;
    margin-bottom: 2rem;
 }
 
 .lesson-badge {
    display: inline-block;
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
 }
 
 .dialogue-title {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.5rem;
 }
 
 .dialogue-pinyin {
    color: #94a3b8;
    font-size: 1rem;
    margin: 0 0 0.5rem;
 }
 
 .dialogue-english {
    color: #cbd5e1;
    font-size: 1.1rem;
    margin: 0;
 }
 
 .dialogue-location {
    color: #64748b;
    font-size: 0.85rem;
    font-style: italic;
    margin-top: 0.5rem;
 }
 
 .progress-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
 }
 
 .dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #475569;
    background: transparent;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
 }
 
 .dot:hover {
    border-color: #60a5fa;
    color: #60a5fa;
 }
 
 .dot.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
 }
 
 .dot.passed {
    background: #4ade80;
    border-color: #4ade80;
    color: #0f172a;
 }
 
 .line-card {
    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
    border: 1px solid #3b82f6;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    text-align: center;
 }
 
 .speaker-label {
    display: inline-block;
    background: #475569;
    color: #94a3b8;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 1rem;
 }
 
 .line-chinese {
    font-size: 2rem;
    font-weight: 600;
    color: #f8fafc;
    margin-bottom: 0.75rem;
    cursor: pointer;
    transition: color 0.2s;
    line-height: 1.4;
 }
 
 .line-chinese:hover {
    color: #60a5fa;
 }
 
 .line-pinyin {
    color: #94a3b8;
    font-size: 1rem;
    margin-bottom: 1rem;
 }
 
 .line-english {
    color: #4ade80;
    font-size: 1.1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #334155;
 }
 
 .reveal-btn {
    background: transparent;
    border: 1px solid #64748b;
    color: #94a3b8;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 1rem;
    transition: all 0.2s;
 }
 
 .reveal-btn:hover {
    border-color: #94a3b8;
    color: #f8fafc;
 }
 
 .audio-status {
    text-align: center;
    color: #60a5fa;
    font-size: 0.85rem;
    margin: 0.5rem 0;
 }
 
 .dialogue-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
 }
 
 .nav-btn {
    background: #1e293b;
    border: 1px solid #475569;
    color: #e2e8f0;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
 }
 
 .nav-btn:hover:not(:disabled) {
    border-color: #60a5fa;
    background: #334155;
 }
 
 .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
 }
 
 .nav-btn.primary {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
 }
 
 .nav-btn.primary:hover {
    background: #2563eb;
 }
 
 .audio-btn {
    background: #1e293b;
    border: 2px solid #f59e0b;
    color: #f59e0b;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
 }
 
 .audio-btn:hover:not(:disabled) {
    background: #f59e0b;
    color: #0f172a;
 }
 
 .audio-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
 }
 
 .vocab-section {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.25rem;
 }
 
 .vocab-section h3 {
    color: #94a3b8;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 1rem;
 }
 
 .vocab-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
 }
 
 .vocab-item {
    background: #1e293b;
    border-radius: 8px;
    padding: 0.75rem;
    text-align: center;
    cursor: pointer;
    transition: background 0.2s;
 }
 
 .vocab-item:hover {
    background: #334155;
 }
 
 .vocab-hanzi {
    display: block;
    font-size: 1.25rem;
    color: #f8fafc;
    margin-bottom: 0.25rem;
 }
 
 .vocab-pinyin {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
 }
 
 .vocab-def {
    display: block;
    font-size: 0.7rem;
    color: #64748b;
 }
 
 .vocab-more {
    text-align: center;
    color: #64748b;
    font-size: 0.8rem;
    margin-top: 0.75rem;
 }
</style>
