/**
 * Azure TTS Integration for Volta Chinese
 * Uses Azure Cognitive Services Speech API for natural Chinese voices
 * 
 * Free tier: 500,000 characters/month
 * Neural voices: Xiaoxiao (female), Yunxi (male), Yunjian (male news)
 */

const AZURE_TTS_ENDPOINT = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';

// Voice options for Chinese
const CHINESE_VOICES = {
  // Female voices
  xiaoxiao: 'zh-CN-XiaoxiaoNeural',      // Warm, friendly, versatile
  xiaoyi: 'zh-CN-XiaoyiNeural',          // Sweet, gentle
  xiaochen: 'zh-CN-XiaochenNeural',      // Calm, conversational
  
  // Male voices  
  yunxi: 'zh-CN-YunxiNeural',            // Warm, friendly male
  yunjian: 'zh-CN-YunjianNeural',        // News broadcast style
  yunxia: 'zh-CN-YunxiaNeural',          // Child voice
  
  // Taiwan Mandarin
  hsiaoChen: 'zh-TW-HsiaoChenNeural',    // Taiwan female
  yunJhe: 'zh-TW-YunJheNeural',          // Taiwan male
};

// Default speaker assignments for dialogues
const SPEAKER_VOICE_MAP = {
  'A': 'xiaoxiao',   // Female speaker A
  'B': 'yunxi',      // Male speaker B
  'C': 'xiaoyi',     // Female speaker C
  'D': 'yunjian',    // Male speaker D
};

/**
 * Generate SSML for Chinese text
 */
function generateSSML(text, voice = 'xiaoxiao', rate = 0.9) {
  const voiceId = CHINESE_VOICES[voice] || CHINESE_VOICES.xiaoxiao;
  return `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
      <voice name="${voiceId}">
        <prosody rate="${rate}">
          ${text}
        </prosody>
      </voice>
    </speak>
  `.trim();
}

/**
 * Call Azure TTS API to generate audio
 * Returns audio blob (MP3)
 */
async function synthesizeSpeech(text, voice = 'xiaoxiao', apiKey) {
  if (!apiKey) {
    throw new Error('Azure TTS API key required');
  }

  const ssml = generateSSML(text, voice);
  
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
    const error = await response.text();
    throw new Error(`Azure TTS error: ${response.status} - ${error}`);
  }

  return response.blob();
}

/**
 * Get voice for a speaker in a dialogue
 */
function getVoiceForSpeaker(speaker) {
  return SPEAKER_VOICE_MAP[speaker] || 'xiaoxiao';
}

/**
 * Synthesize dialogue line with appropriate voice
 */
async function synthesizeDialogueLine(line, apiKey) {
  const voice = getVoiceForSpeaker(line.speaker);
  return synthesizeSpeech(line.chinese, voice, apiKey);
}

/**
 * Count characters for quota tracking
 */
function countCharacters(text) {
  return text.length;
}

/**
 * Estimate quota usage for a dialogue
 */
function estimateDialogueQuota(dialogue) {
  let total = 0;
  for (const line of dialogue.lines) {
    total += countCharacters(line.chinese);
  }
  return total;
}

/**
 * Check if running in browser with API key
 */
function hasApiKey() {
  try {
    return !!localStorage.getItem('azure-tts-key');
  } catch {
    return false;
  }
}

/**
 * Get API key from storage
 */
function getApiKey() {
  try {
    return localStorage.getItem('azure-tts-key') || null;
  } catch {
    return null;
  }
}

/**
 * Save API key to storage
 */
function saveApiKey(key) {
  try {
    localStorage.setItem('azure-tts-key', key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Play audio blob
 */
async function playAudioBlob(blob) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  
  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    audio.play();
  });
}

/**
 * Fallback to Web Speech API
 */
async function speakWithWebSpeech(text, rate = 0.85) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    
    const voices = speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = resolve;
    utterance.onerror = (e) => reject(e);
    
    speechSynthesis.speak(utterance);
  });
}

export {
  CHINESE_VOICES,
  SPEAKER_VOICE_MAP,
  synthesizeSpeech,
  synthesizeDialogueLine,
  generateSSML,
  getVoiceForSpeaker,
  countCharacters,
  estimateDialogueQuota,
  hasApiKey,
  getApiKey,
  saveApiKey,
  playAudioBlob,
  speakWithWebSpeech,
};
