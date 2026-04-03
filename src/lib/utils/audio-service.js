/**
 * Audio Service for Volta Chinese
 * 
 * Priority:
 * 1. Pre-generated Azure TTS MP3 files (highest quality)
 * 2. Azure TTS API calls (if key provided)
 * 3. Web Speech API fallback (offline)
 */

const AUDIO_BASE_PATH = '/volta-chinese/audio';

/**
 * Get path to pre-generated audio file
 */
function getAudioPath(type, ...parts) {
  switch (type) {
    case 'word':
      return `${AUDIO_BASE_PATH}/words/${encodeURIComponent(parts[0])}.mp3`;
    case 'lesson':
      return `${AUDIO_BASE_PATH}/lessons/${parts[0]}/line-${parts[1]}.mp3`;
    default:
      return null;
  }
}

/**
 * Check if pre-generated audio exists
 */
async function checkAudioExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Play pre-generated audio file
 */
async function playPreGeneratedAudio(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    
    audio.onended = () => resolve();
    audio.onerror = (e) => reject(new Error(`Failed to play audio: ${e}`));
    
    audio.play().catch(reject);
  });
}

/**
 * Speak using Azure TTS API directly
 */
async function speakWithAzureTTS(text, voice = 'xiaoxiao', apiKey) {
  const AZURE_TTS_ENDPOINT = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';
  
  const VOICES = {
    xiaoxiao: 'zh-CN-XiaoxiaoNeural',
    yunxi: 'zh-CN-YunxiNeural',
    xiaoyi: 'zh-CN-XiaoyiNeural',
  };

  const voiceId = VOICES[voice] || VOICES.xiaoxiao;
  
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
      <voice name="${voiceId}">
        <prosody rate="0.9">
          ${text}
        </prosody>
      </voice>
    </speak>
  `.trim();

  const response = await fetch(AZURE_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'VoltaChinese/1.0',
    },
    body: ssml,
  });

  if (!response.ok) {
    throw new Error(`Azure TTS error: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    
    audio.play().catch(reject);
  });
}

/**
 * Speak using Web Speech API (fallback)
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
 * Main speak function - tries pre-generated, then Azure TTS, then Web Speech
 */
async function speak(text, options = {}) {
  const { voice = 'xiaoxiao', type = 'word', lesson = null, line = null } = options;
  
  // Try pre-generated audio first
  if (type === 'word' || (type === 'lesson' && lesson && line)) {
    const audioPath = type === 'word' 
      ? getAudioPath('word', text)
      : getAudioPath('lesson', lesson, line);
    
    if (audioPath) {
      try {
        const exists = await checkAudioExists(audioPath);
        if (exists) {
          return playPreGeneratedAudio(audioPath);
        }
      } catch {
        // Fall through to next method
      }
    }
  }

  // Try Azure TTS API if key is available
  const apiKey = localStorage.getItem('azure-tts-key');
  if (apiKey) {
    try {
      return speakWithAzureTTS(text, voice, apiKey);
    } catch {
      // Fall through to Web Speech
    }
  }

  // Fallback to Web Speech API
  return speakWithWebSpeech(text);
}

/**
 * Speak a vocabulary word
 */
async function speakWord(hanzi) {
  return speak(hanzi, { type: 'word' });
}

/**
 * Speak a dialogue line
 */
async function speakDialogueLine(text, speaker, lessonId, lineIndex) {
  const voiceMap = {
    'A': 'xiaoxiao',   // Female
    'B': 'yunxi',      // Male
    'C': 'xiaoyi',     // Female 2
    'D': 'xiaoxiao',   // Female
  };
  
  return speak(text, {
    type: 'lesson',
    voice: voiceMap[speaker] || 'xiaoxiao',
    lesson: lessonId,
    line: lineIndex,
  });
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
  speak,
  speakWord,
  speakDialogueLine,
  speakWithWebSpeech,
  speakWithAzureTTS,
  initVoices,
};
