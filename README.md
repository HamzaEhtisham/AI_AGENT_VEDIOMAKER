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
