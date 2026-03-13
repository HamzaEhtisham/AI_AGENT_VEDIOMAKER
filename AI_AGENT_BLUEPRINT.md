# AI Agent Blueprint (Prompt → Animated Video/Reel)

## 1) Current Repo Analysis (Reality Check)

This project is already a **working front-end prototype** for AI video generation:

- `src/App.jsx` takes a topic prompt and format (Reel/YouTube).
- It calls OpenRouter (Claude model) to generate structured scene JSON.
- It renders animated scenes on Canvas.
- It uses browser `speechSynthesis` for voiceover.
- It records Canvas output through `MediaRecorder` and gives a downloadable `.webm`.

### Strong points
- Fast local prototype, zero backend required.
- Prompt → scenes → animation pipeline already exists.
- UX is simple and usable for demos.

### Gaps for "real" production AI-agent
- No backend orchestration (everything in browser).
- No persistent jobs / retry / queue.
- Voice quality depends on browser voices (inconsistent).
- No multi-lingual TTS strategy.
- No asset pipeline (stock video/images/music/captions as separate tracks).
- No automatic quality scoring (hook strength, retention estimate, CTA score).
- No one-click publishing pipeline for YouTube Shorts / Reels.

---

## 2) Target Product You Asked For

You want an AI-agent that does this end-to-end:

1. You enter one prompt.
2. Agent generates engaging content strategy.
3. Agent writes short-form script + scene plan.
4. Agent creates animation/video shots.
5. Agent picks suitable voice + narration style.
6. Agent outputs ready-to-post reel/short.

---

## 3) Recommended Agent Architecture

Use a **hybrid architecture**:

- **Frontend (current React app):** prompt input, progress, preview, downloads.
- **Backend Agent Orchestrator (Node/Python):** real pipeline control.
- **Workers:** rendering, TTS, subtitle burn-in, final muxing.

### Core agents (multi-step workflow)

1. **Director Agent**
   - Understands user prompt + target platform.
   - Chooses tone (educational, motivational, storytelling, controversy).
   - Defines output goal (watch-time, CTR, shares).

2. **Research/Ideation Agent**
   - Generates hooks, facts, story angles.
   - Produces 3-5 candidate concepts.

3. **Script Agent**
   - Creates scene-by-scene script JSON:
     - hook
     - beat progression
     - CTA
     - on-screen text
     - voiceover line per scene

4. **Visual Agent**
   - Converts each scene into visual directives:
     - animation template
     - camera motion
     - color mood
     - iconography / b-roll query

5. **Voice Agent**
   - Picks TTS profile (gender/style/language/emotion).
   - Generates per-scene audio clips.
   - Returns timing metadata.

6. **Editor Agent**
   - Aligns visuals + voice + subtitles + SFX + music.
   - Runs FFmpeg composition.
   - Exports platform ratios: 9:16, 1:1, 16:9.

7. **Quality Agent**
   - Scores final content:
     - hook quality
     - clarity
     - pacing
     - CTA strength
   - If score < threshold, auto-regenerate weak scenes.

---

## 4) Suggested Tech Stack (Practical)

### Backend
- **FastAPI** or **Node.js + Express** for API.
- **Redis + BullMQ/Celery** for async rendering jobs.
- **Postgres** for projects/history.
- **S3/R2** for generated media artifacts.

### AI + Voice
- LLM: OpenRouter/Anthropic/OpenAI.
- TTS: ElevenLabs / Azure Neural TTS / Google TTS.
- Optional STT for quality checks: Whisper.

### Video generation
- Keep existing Canvas style templates for speed.
- Add FFmpeg compositor for production finalization.
- Optional Remotion for timeline-based edits.

---

## 5) API Design (Minimal V1)

### `POST /api/projects`
Input:
- prompt
- format (`reel`, `youtube`)
- language
- voice_style

Output:
- `project_id`
- `status: queued`

### `GET /api/projects/:id`
Output:
- status (`queued|planning|scripting|voicing|rendering|done|failed`)
- progress percentage
- logs
- artifact URLs

### `POST /api/projects/:id/regenerate-scene`
- regenerate one weak scene only (cheap + fast iteration)

---

## 6) Data Contracts (Important)

Use strict JSON schema for scene plan:

```json
{
  "title": "...",
  "language": "en",
  "duration_target_sec": 45,
  "scenes": [
    {
      "id": 1,
      "goal": "hook",
      "heading": "...",
      "caption": "...",
      "voiceover": "...",
      "visual": {
        "template": "kinetic_text_glow",
        "emoji": "🚀",
        "palette": "neon_purple"
      },
      "timing": {
        "duration_sec": 7.5
      }
    }
  ]
}
```

This avoids random model outputs and keeps pipeline stable.

---

## 7) Migration Plan from Current Repo

### Phase 1 (1-2 days)
- Extract current OpenRouter call from frontend into backend endpoint.
- Keep Canvas rendering in frontend for now.
- Add project/job status API.

### Phase 2 (3-5 days)
- Replace browser speech synthesis with cloud TTS.
- Per-scene audio generation + sync metadata.
- Better subtitle timing.

### Phase 3 (5-7 days)
- Add FFmpeg rendering worker.
- Add background music ducking + final mastering.
- Export 1080x1920 optimized reels.

### Phase 4 (ongoing)
- Add quality scoring + auto-regeneration.
- Add content style presets (finance, education, motivation, tech news).
- Add publishing connectors.

---

## 8) Immediate Next Steps for You (High ROI)

1. Start backend service folder: `server/`.
2. Move scene generation API call from `src/App.jsx` to `server` route.
3. Add durable `Project` model (prompt, scenes, status, artifacts).
4. Add one premium TTS provider.
5. Keep current UI, but fetch live pipeline status from backend.

---

## 9) Definition of Done (for your requested AI-agent)

A feature is "done" when:
- One prompt creates a complete short/reel in <2 minutes.
- Voice is natural and language-consistent.
- Captions are synced.
- Hook appears in first 2 seconds.
- Output is downloadable + reusable (MP4/WebM).
- User can regenerate single scene without full rerun.

---

## 10) Notes for this repository

Your current app is an excellent base for a demo and UI shell. The best path is **not rewrite from scratch**; instead convert current logic into a backend-orchestrated pipeline and keep your existing visual style system as first template set.
