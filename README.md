# Auto Video AI (React + Vite)

This app generates scene plans and records short videos from a topic prompt.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Provide OpenRouter API key (any one method):

- **Recommended (no restart):** App UI me `OPENROUTER KEY` field me valid key (`sk-or-v1-...`) paste karo aur **Save key** dabao.
- **Alternative (.env):** project root me `.env` file bana ke set karo:

```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-your_real_key
# optional fallback
VITE_ANTHROPIC_API_KEY=sk-or-v1-your_real_key
```

3. Start dev server:

```bash
npm run dev
```

## Verify locally

```bash
npm run lint
npm run build
```

