# Auto Video AI (React + Vite)

This app generates scene plans and records short videos from a topic prompt.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file in project root and add one of these keys:

```bash
VITE_OPENROUTER_API_KEY=your_openrouter_key
# optional fallback
VITE_ANTHROPIC_API_KEY=your_openrouter_key
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

## GitHub merge conflict fix (quick steps)

If GitHub shows **"This branch has conflicts"**, run these commands locally on your feature branch:

```bash
git fetch origin
git checkout <your-branch>
git rebase origin/main
# resolve conflicts in files
# then:
git add <resolved-files>
git rebase --continue
git push --force-with-lease
```

Alternative (without rebase):

```bash
git fetch origin
git checkout <your-branch>
git merge origin/main
# resolve conflicts
git add <resolved-files>
git commit
git push
```

## Troubleshooting

### ESLint: `'error' is not defined` in `src/App.jsx`

If your local branch still shows this error, you are likely on an older commit.

```bash
git fetch origin
git checkout <your-branch>
git pull --rebase
npm install
npm run lint
```

Also ensure the catch block uses `catch (err)` and references `err` (not `error`) in `src/App.jsx`.

## AI Agent Build Blueprint

A practical blueprint for converting this prototype into a production-grade prompt → animated reel generator is available in [`AI_AGENT_BLUEPRINT.md`](./AI_AGENT_BLUEPRINT.md).



### Common console errors

- `chrome-extension://invalid/ ... ERR_FAILED`
  - Usually browser extension/devtools injection issue hota hai, app code issue nahi hota. Incognito (extensions off) mein test karein.

- `openrouter.ai/api/v1/chat/completions 401`
  - API key invalid/missing hai. `.env` mein `VITE_OPENROUTER_API_KEY` set karein and dev server restart karein.

- Voice preview sunai deti hai but downloaded video silent hoti hai
  - Web Speech API (`speechSynthesis`) audio ko browsers reliably `MediaRecorder` export stream mein include nahi karte. Ye platform limitation hai.
