#!/usr/bin/env node
/**
 * Pre-generate audio files for HSK1 lessons using Azure TTS
 * 
 * Usage:
 *   AZURE_TTS_KEY=your_key node scripts/generate-audio.js
 * 
 * Output:
 *   static/audio/words/你好.mp3
 *   static/audio/lessons/1/line-1.mp3
 *   static/audio/lessons/1/line-2.mp3
 *   ...
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Azure TTS endpoint
const AZURE_TTS_ENDPOINT = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';

// Chinese voices
const VOICES = {
  female: 'zh-CN-XiaoxiaoNeural',
  male: 'zh-CN-YunxiNeural',
  female2: 'zh-CN-XiaoyiNeural',
};

// Speaker to voice mapping
const SPEAKER_MAP = {
  'A': 'female',
  'B': 'male',
  'C': 'female2',
  'D': 'male',
};

/**
 * Generate SSML for text
 */
function generateSSML(text, voice = 'female', rate = 0.9) {
  const voiceId = VOICES[voice] || VOICES.female;
  return `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
      <voice name="${voiceId}">
        <prosody rate="${rate}">
          ${escapeXml(text)}
        </prosody>
      </voice>
    </speak>
  `.trim();
}

/**
 * Escape XML special characters
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Call Azure TTS API
 */
async function synthesizeSpeech(text, voice = 'female', apiKey) {
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

  return response.arrayBuffer();
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load JSON data
 */
function loadJson(filename) {
  const filepath = path.join(ROOT, 'src/lib/data', filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`Warning: ${filename} not found`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

/**
 * Main function
 */
async function main() {
  const apiKey = process.env.AZURE_TTS_KEY;
  if (!apiKey) {
    console.error('Error: AZURE_TTS_KEY environment variable required');
    console.error('Usage: AZURE_TTS_KEY=your_key node scripts/generate-audio.js');
    process.exit(1);
  }

  console.log('Generating audio files for HSK1...\n');

  // Load data
  const lessons = loadJson('textbook_dialogues_hsk1.json');
  const vocabulary = loadJson('hsk1.json');

  if (!lessons && !vocabulary) {
    console.error('Error: No data files found');
    process.exit(1);
  }

  // Track quota usage
  let totalChars = 0;
  const FREE_TIER_LIMIT = 500000;

  // Create output directories
  const wordsDir = path.join(ROOT, 'static/audio/words');
  const lessonsDir = path.join(ROOT, 'static/audio/lessons');
  ensureDir(wordsDir);
  ensureDir(lessonsDir);

  // Generate vocabulary audio
  if (vocabulary) {
    console.log('Generating vocabulary audio...');
    let wordCount = 0;
    
    for (const word of vocabulary) {
      const hanzi = word.hanzi;
      const outputPath = path.join(wordsDir, `${hanzi}.mp3`);
      
      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`  ✓ ${hanzi} (exists)`);
        continue;
      }

      try {
        const audio = await synthesizeSpeech(hanzi, 'female', apiKey);
        fs.writeFileSync(outputPath, Buffer.from(audio));
        totalChars += hanzi.length;
        wordCount++;
        console.log(`  ✓ ${hanzi}`);
        
        // Rate limiting
        await sleep(100);
      } catch (error) {
        console.error(`  ✗ ${hanzi}: ${error.message}`);
      }
    }
    console.log(`Generated ${wordCount} word audio files\n`);
  }

  // Generate lesson dialogue audio
  if (lessons) {
    console.log('Generating lesson dialogue audio...');
    
    for (const lesson of lessons) {
      const lessonDir = path.join(lessonsDir, `${lesson.id}`);
      ensureDir(lessonDir);
      
      console.log(`\nLesson ${lesson.id}: ${lesson.title}`);
      
      for (let i = 0; i < lesson.lines.length; i++) {
        const line = lesson.lines[i];
        const outputPath = path.join(lessonDir, `line-${i + 1}.mp3`);
        
        // Skip if already exists
        if (fs.existsSync(outputPath)) {
          console.log(`  ✓ Line ${i + 1} (${line.speaker}): ${line.chinese} (exists)`);
          continue;
        }

        const voice = SPEAKER_MAP[line.speaker] || 'female';
        
        try {
          const audio = await synthesizeSpeech(line.chinese, voice, apiKey);
          fs.writeFileSync(outputPath, Buffer.from(audio));
          totalChars += line.chinese.length;
          console.log(`  ✓ Line ${i + 1} (${line.speaker}): ${line.chinese}`);
          
          // Rate limiting
          await sleep(100);
        } catch (error) {
          console.error(`  ✗ Line ${i + 1}: ${error.message}`);
        }
      }
    }
  }

  // Summary
  console.log('\n========================================');
  console.log(`Total characters used: ${totalChars.toLocaleString()}`);
  console.log(`Free tier limit: ${FREE_TIER_LIMIT.toLocaleString()}`);
  console.log(`Remaining: ${(FREE_TIER_LIMIT - totalChars).toLocaleString()} chars`);
  console.log(`Usage: ${((totalChars / FREE_TIER_LIMIT) * 100).toFixed(2)}%`);
  console.log('========================================\n');
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main().catch(console.error);
