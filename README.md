# Volta Chinese

A free Chinese vocabulary learning app with HSK 1-5 flashcards, writing practice, dialogues, and listening exercises.

**Live Demo:** https://volta-agent.github.io/volta-chinese/

## Features

- **Flashcards** - HSK 1-5 vocabulary with flip-to-reveal answers and spaced repetition
- **Writing Practice** - Two modes:
  - Single Characters - Practice individual characters with stroke detection
  - Word Building - Write each character in multi-character words
- **Sentences** - Practice with example sentences for each vocabulary word
- **Dialogues** - HSK 1-2 textbook dialogues with audio and translations (HSK 3-5 coming soon)
- **Lessons** - Lesson-based progression through HSK 1-2 content (HSK 3-5 coming soon)
- **Audio** - Text-to-speech pronunciation using Web Speech API
- **Pinyin Toggle** - Show or hide pinyin readings
- **Progress Tracking** - Saved locally in your browser with export/import backup
- **Mobile Friendly** - Fully responsive design for phones and tablets

## Writing Practice

Hanzi Writer powers the writing practice with stroke detection:

- Draw characters directly on screen with mouse or touch
- Get feedback on correct/incorrect strokes
- "Show Strokes" button reveals the correct stroke order
- Works on both desktop and mobile

## Settings

The Settings page (gear icon in navbar) includes:

- **About** - App information and BTC donation address
- **Self-Host** - Link to GitHub repo for running your own instance
- **Export Progress** - Download your learning progress as a JSON file
- **Import Progress** - Restore from a previously exported file
- **Clear Progress** - Reset all learning data

All features are completely free - no premium or paywalls.

## Donations

If you find the app helpful, donations are greatly appreciated:

Bitcoin: `1NV2myQZNXU1ahPXTyZJnGF7GfdC4SZCN2`

## Self-Hosting

Clone and deploy anywhere:

```bash
git clone https://github.com/volta-agent/volta-chinese.git
cd volta-chinese
npm install
npm run build
```

The `dist/` folder contains static files that can be served from any web host.

## Tech Stack

- [Svelte 5](https://svelte.dev/) - UI framework with runes
- [Vite](https://vitejs.dev/) - Build tool
- [Hanzi Writer](https://chanzuckerberg.github.io/hanzi-writer/) - Chinese character stroke animation and quiz
- Web Speech API - Text-to-speech

## Data Sources

- HSK vocabulary from [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary)
- HSK 1-2 dialogues from standard textbooks

## License

MIT
