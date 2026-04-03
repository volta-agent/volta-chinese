# Azure TTS Audio Generation

Volta Chinese uses Azure Cognitive Services for high-quality Chinese text-to-speech.

## Free Tier

- **500,000 characters/month** free
- Neural voices sound natural and authentic
- Covers HSK 1-5 vocabulary and dialogues easily

## Setup

### 1. Create Azure Account

1. Go to https://azure.microsoft.com/free/
2. Sign up for free account (includes $200 credit for 30 days)
3. No credit card required for free tier

### 2. Create Speech Service

1. In Azure Portal, click "Create a resource"
2. Search for "Speech" 
3. Select "Speech Services" and create:
   - Name: `volta-chinese-tts`
   - Region: East US (or your nearest)
   - Pricing tier: **Free F0** (500k chars/month)
4. Wait for deployment (1-2 minutes)
5. Go to resource → "Keys and Endpoint"
6. Copy **Key 1** or **Key 2**

### 3. Generate Audio Files

```bash
# Set your API key
export AZURE_TTS_KEY="your-key-here"

# Generate all HSK1 audio
cd /home/volta/projects/volta-chinese
node scripts/generate-audio.js
```

This creates:
```
static/audio/
├── words/
│   ├── 你.mp3
│   ├── 好.mp3
│   └── ...
└── lessons/
    ├── 1/
    │   ├── line-1.mp3
    │   ├── line-2.mp3
    │   └── ...
    └── 2/
        └── ...
```

## Voices Used

| Speaker | Voice | Description |
|---------|-------|-------------|
| A | Xiaoxiao | Female, warm and friendly |
| B | Yunxi | Male, natural conversational |
| C | Xiaoyi | Female, sweet and gentle |
| D | Yunjian | Male, news broadcast style |

## Quota Estimation

| Content | Characters | Notes |
|---------|------------|-------|
| HSK1 Vocabulary (150 words) | ~300 | One-time generation |
| HSK1 Dialogues (15 lessons) | ~2,000 | ~130 lines |
| HSK1-5 All Words | ~3,000 | 2,500 words avg 1.2 chars |
| HSK1-5 All Dialogues | ~10,000 | ~75 dialogues |
| **Total** | ~15,000 | 3% of free tier |

You can regenerate all audio monthly and stay well under the 500k limit.

## Fallback

If Azure TTS is unavailable, the app falls back to:
1. **Pre-generated MP3 files** (if downloaded)
2. **Web Speech API** (browser built-in)

## API Key Storage

For the web app, users can optionally save their Azure TTS key:
- Stored in `localStorage` only
- Never sent to any server except Azure
- Used for real-time synthesis if MP3 doesn't exist

## Manual Generation

Generate specific content:

```bash
# Only vocabulary
AZURE_TTS_KEY="..." node scripts/generate-audio.js --vocab

# Only lessons 1-5
AZURE_TTS_KEY="..." node scripts/generate-audio.js --lessons 1,2,3,4,5
```
