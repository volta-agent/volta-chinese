<script>
 /**
 * LessonCard.svelte - Displays a single lesson in the lesson grid
 * Shows lesson number, title, and completion status
 */

 let { lesson, completed = false, locked = false, progress = 0 } = $props();
 
 let statusColor = $derived(completed ? '#4ade80' : progress > 0 ? '#fbbf24' : '#6b7280');
</script>

<div 
 class="lesson-card" 
 class:locked
 class:completed
 role="button"
 tabindex={locked ? -1 : 0}
>
 <div class="lesson-number">Lesson {lesson.lesson}</div>
 
 <div class="lesson-title">
    <span class="title-hanzi">{lesson.title}</span>
    {#if lesson.title_pinyin}
    <span class="title-pinyin">{lesson.title_pinyin}</span>
    {/if}
 </div>
 
 <div class="lesson-english">{lesson.title_english}</div>
 
 {#if lesson.location}
 <div class="lesson-location">{lesson.location}</div>
 {/if}
 
 <div class="lesson-meta">
    <span class="line-count">{lesson.lines?.length || 0} lines</span>
    <span class="vocab-count">{lesson.vocabulary?.length || 0} words</span>
 </div>
 
 {#if progress > 0 && !completed}
 <div class="progress-indicator">
    <div class="progress-bar" style="width: {progress}%"></div>
 </div>
 {/if}
 
 {#if completed}
 <div class="completion-badge">✓</div>
 {/if}
 
 {#if locked}
 <div class="lock-overlay">
    <span class="lock-icon">🔒</span>
 </div>
 {/if}
</div>

<style>
 .lesson-card {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
 }
 
 .lesson-card:hover:not(.locked) {
    border-color: #60a5fa;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(96, 165, 250, 0.15);
 }
 
 .lesson-card.locked {
    opacity: 0.6;
    cursor: not-allowed;
 }
 
 .lesson-card.completed {
    border-color: #4ade80;
 }
 
 .lesson-number {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
 }
 
 .lesson-title {
    margin-bottom: 0.5rem;
 }
 
 .title-hanzi {
    font-size: 1.5rem;
    font-weight: 600;
    color: #f8fafc;
    display: block;
 }
 
 .title-pinyin {
    font-size: 0.85rem;
    color: #94a3b8;
    display: block;
    margin-top: 0.25rem;
 }
 
 .lesson-english {
    font-size: 0.9rem;
    color: #cbd5e1;
    margin-bottom: 0.5rem;
 }
 
 .lesson-location {
    font-size: 0.75rem;
    color: #64748b;
    font-style: italic;
    margin-bottom: 0.75rem;
 }
 
 .lesson-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: #64748b;
 }
 
 .progress-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #1e293b;
 }
 
 .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #fbbf24, #f97316);
    transition: width 0.3s ease;
 }
 
 .completion-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: #4ade80;
    color: #0f172a;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: bold;
 }
 
 .lock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
 }
 
 .lock-icon {
    font-size: 1.5rem;
 }
</style>
