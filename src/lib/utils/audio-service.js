/**
 * Audio Service for Volta Chinese
 * Uses Web Speech API (built-in browser support)
 */

/**
 * Speak using Web Speech API
 */
async function speakWithWebSpeech(text, rate = 0.85) {
	return new Promise((resolve, reject) => {
		if (!('speechSynthesis' in window)) {
			reject(new Error('Speech synthesis not supported'));
			return;
		}

		// Cancel any ongoing speech
		speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'zh-CN';
		utterance.rate = rate;
		
		// Try to find a Chinese voice
		const voices = speechSynthesis.getVoices();
		const zhVoice = voices.find(v => 
			v.lang.includes('zh') || 
			v.lang.includes('cmn') ||
			v.lang.includes('zh-CN') || 
			v.lang.includes('zh-TW')
		);
		
		if (zhVoice) {
			utterance.voice = zhVoice;
		}

		utterance.onend = resolve;
		utterance.onerror = (e) => reject(e);
		
		speechSynthesis.speak(utterance);
	});
}

/**
 * Speak a vocabulary word
 */
async function speakWord(hanzi) {
	return speakWithWebSpeech(hanzi);
}

/**
 * Speak a dialogue line
 */
async function speakDialogueLine(text, speaker) {
	// All speakers use the same voice for consistency
	return speakWithWebSpeech(text);
}

/**
 * Initialize speech synthesis voices
 */
function initVoices() {
	return new Promise((resolve) => {
		if (!('speechSynthesis' in window)) {
			resolve([]);
			return;
		}

		const voices = speechSynthesis.getVoices();
		if (voices.length > 0) {
			resolve(voices);
			return;
		}

		speechSynthesis.onvoiceschanged = () => {
			resolve(speechSynthesis.getVoices());
		};
	});
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
	initVoices();
}

export {
	speakWithWebSpeech,
	speakWord,
	speakDialogueLine,
	initVoices,
};
