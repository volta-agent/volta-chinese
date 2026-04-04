# Volta Chinese

A free Chinese learning app with complete HSK 1-5 vocabulary, flashcards, writing practice, dialogues, grammar points, and listening exercises.

**Live App:** https://volta-agent.github.io/volta-chinese/

## Features

- **Flashcards** - HSK 1-5 vocabulary (2,500+ words) with flip-to-reveal answers
- **Writing Practice** - Stroke detection with Hanzi Writer
  - Single Characters - Practice individual characters
  - Word Building - Write each character in multi-character words
- **Sentences** - Example sentences for vocabulary practice
- **Dialogues** - Textbook dialogues for all HSK levels (1-5)
- **Grammar** - Grammar points with explanations and examples for HSK 1-5
- **Lessons** - 20 lessons per level with dialogues and vocabulary
- **Audio** - Text-to-speech pronunciation using Web Speech API
- **Pinyin Toggle** - Show or hide pinyin readings
- **Progress Tracking** - Saved locally in your browser
- **Mobile Friendly** - Fully responsive design

## HSK Content

| Level | Words | Lessons | Dialogues | Grammar |
|-------|-------|---------|-----------|---------|
| HSK 1 | 150 | 20 | 20 | 20 lessons |
| HSK 2 | 150 | 20 | 20 | 20 lessons |
| HSK 3 | 300 | 20 | 20 | 20 lessons |
| HSK 4 | 600 | 20 | 20 | 20 lessons |
| HSK 5 | 1,300 | 20 | 20 | 20 lessons |

## Writing Practice

Powered by Hanzi Writer with stroke detection:

- Draw characters with mouse or touch
- Get instant feedback on stroke accuracy
- "Show Strokes" reveals correct stroke order
- Works on desktop and mobile

## Settings

The Settings page (gear icon) includes:

- **About** - App information and BTC donation address
- **Self-Host** - Link to GitHub repo
- **Export/Import Progress** - Backup and restore learning data
- **Clear Progress** - Reset all data

All features are completely free - no premium tiers, no paywalls.

## Donations

If you find the app helpful:

**Bitcoin:** `1NV2myQZNXU1ahPXTyZJnGF7GfdC4SZCN2`

## Self-Hosting

```bash
git clone https://github.com/volta-agent/volta-chinese.git
cd volta-chinese
npm install
npm run build
```

The `dist/` folder contains static files for any web host.

## Tech Stack

- [Svelte 5](https://svelte.dev/) - UI framework with runes
- [Vite](https://vitejs.dev/) - Build tool
- [Hanzi Writer](https://chanzuckerberg.github.io/hanzi-writer/) - Stroke animation
- Web Speech API - Text-to-speech

## Data Sources

- HSK vocabulary from [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary)
- Dialogues and grammar from standard HSK textbooks

## License

MIT
