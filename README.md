# Volta Chinese

A Chinese vocabulary learning app with HSK 1-5 flashcards, writing practice, and listening exercises.

**Live Demo:** https://volta-agent.github.io/volta-chinese/

## Features

- **Flashcards** - HSK 1 vocabulary with flip-to-reveal answers
- **Writing Practice** - Two modes:
  - Single Characters - Practice individual characters with stroke detection
  - Word Building - Write each character in multi-character words
- **Audio** - Text-to-speech pronunciation using Web Speech API
- **Pinyin Toggle** - Show or hide pinyin readings
- **Progress Tracking** - Saved locally in your browser

## Writing Practice

Hanzi Writer powers the writing practice with stroke detection:

- Draw characters directly on screen with mouse or touch
- Get feedback on correct/incorrect strokes
- "Show Strokes" button reveals the correct stroke order
- Works on both desktop and mobile

## Premium Features

HSK 2-5 levels are available via a one-time donation:

- All HSK levels (1-5)
- Advanced spaced repetition
- Mistake review mode
- Progress export
- Offline PWA support

### Support Development

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

- [Svelte 5](https://svelte.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Hanzi Writer](https://chanzuckerberg.github.io/hanzi-writer/) - Chinese character stroke animation and quiz
- Web Speech API - Text-to-speech

## Data Source

HSK vocabulary from [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary).

## License

MIT
