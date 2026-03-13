import { useState, useRef, useCallback, useEffect } from "react";

const FORMATS = [
  { id: "reel", label: "Short / Reel", icon: "📱", w: 720, h: 1280, scenes: 6, dur: 8 },
  { id: "youtube", label: "YouTube Video", icon: "🎬", w: 1280, h: 720, scenes: 14, dur: 10 },
];

const PALETTES = [
  { bg: ["#0a0014","#1a0035"], accent: "#c084fc", glow: "#c084fc", text: "#f3e8ff" },
  { bg: ["#001a12","#003d28"], accent: "#34d399", glow: "#34d399", text: "#ecfdf5" },
  { bg: ["#0a0a00","#1f1f00"], accent: "#facc15", glow: "#fbbf24", text: "#fefce8" },
  { bg: ["#00050f","#001333"], accent: "#38bdf8", glow: "#0ea5e9", text: "#e0f2fe" },
  { bg: ["#0f0000","#2a0000"], accent: "#f87171", glow: "#ef4444", text: "#fff1f2" },
  { bg: ["#080018","#1e0040"], accent: "#e879f9", glow: "#d946ef", text: "#fdf4ff" },
];

const LANGUAGES = [
  { id: "en", label: "English", ttsHint: "en" },
  { id: "hi", label: "Hindi", ttsHint: "hi" },
  { id: "ur", label: "Urdu", ttsHint: "ur" },
];

const CONTENT_STYLES = [
  { id: "educational", label: "Educational" },
  { id: "story", label: "Storytelling" },
  { id: "motivational", label: "Motivational" },
  { id: "news", label: "Trending/News" },
];

const CONTENT_INPUT_MODES = [
  { id: "topic", label: "AI Topic Mode" },
  { id: "script", label: "Custom Script Mode" },
];

const VOICE_STYLES = [
  { id: "energetic", label: "Energetic", rate: 0.94, pitch: 1.07 },
  { id: "calm", label: "Calm", rate: 0.87, pitch: 0.98 },
  { id: "bold", label: "Bold", rate: 0.9, pitch: 0.9 },
];

const CLAMP = (n, min, max) => Math.min(max, Math.max(min, n));


function resolveOpenRouterKey() {
  const rawKey = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, "");
  const looksLikePlaceholder = /your|replace|example|paste|key/i.test(apiKey);

  if (!apiKey || looksLikePlaceholder) {
    throw new Error("API key missing/invalid. .env me VITE_OPENROUTER_API_KEY=sk-or-v1-... set karo, phir Vite server restart karo.");
  }

  return apiKey;
}

function fallbackScenes(topic, selectedFmt, language, style) {
  const introByLang = {
    en: "Did you know this can change your results fast?",
    hi: "Kya aap jaante hain ye aapki life ko fast improve kar sakta hai?",
    ur: "Kya aap jantay hain yeh aap ke results tez behtar kar sakta hai?",
  };

  const ctaByLang = {
    en: "Follow for more and share this with a friend today.",
    hi: "Aisi aur videos ke liye follow karo aur doston ko share karo.",
    ur: "Aisi mazeed videos ke liye follow karein aur doston ko share karein.",
  };

  return Array.from({ length: selectedFmt.scenes }).map((_, i) => {
    const idx = i + 1;
    const isFirst = i === 0;
    const isLast = i === selectedFmt.scenes - 1;
    return {
      heading: isFirst ? "Power Hook" : isLast ? "Take Action" : `${style} point ${idx}`,
      caption: isFirst
        ? `Topic: ${topic}`
        : isLast
          ? "Save this and come back later"
          : `Step ${idx} that improves ${topic}`,
      voiceover: isFirst ? introByLang[language] : isLast ? ctaByLang[language] : `Quick insight ${idx} about ${topic}. Keep watching for the next practical tip and apply it today for better outcomes.`,
      emoji: isFirst ? "🔥" : isLast ? "✅" : ["🎯", "⚡", "💡", "🚀", "📌", "🧠"][i % 6],
      duration: selectedFmt.dur,
    };
  });
}

function normalizeScenes(rawScenes, selectedFmt, title) {
  const base = Array.isArray(rawScenes) ? rawScenes.slice(0, selectedFmt.scenes) : [];
  while (base.length < selectedFmt.scenes) {
    base.push({
      heading: `Scene ${base.length + 1}`,
      caption: "Key insight",
      voiceover: "Stay tuned for the next point.",
      emoji: "🎬",
      duration: selectedFmt.dur,
    });
  }

  return base.map((scene, idx) => ({
    heading: (scene?.heading || `Scene ${idx + 1}`).toString().slice(0, 60),
    caption: (scene?.caption || "Key insight").toString().slice(0, 120),
    voiceover: (scene?.voiceover || scene?.caption || "Interesting insight").toString().slice(0, 220),
    emoji: (scene?.emoji || "🎬").toString().slice(0, 2),
    duration: CLAMP(Number(scene?.duration) || selectedFmt.dur, 6, 12),
    videoTitle: title,
  }));
}

function renderScene(ctx, scene, progress, palette, sceneIdx, totalScenes, format, now) {
  const W = format.w, H = format.h;
  const isReel = format.id === "reel";
  const t = now / 1000;

  const grad = ctx.createLinearGradient(0, 0, isReel ? W : 0, isReel ? 0 : H);
  grad.addColorStop(0, palette.bg[0]);
  grad.addColorStop(1, palette.bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.2, W * 0.5, H * 0.5, H * 0.95);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "#00000066");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 5; i++) {
    const ox = W * (0.1 + 0.2 * i + 0.06 * Math.sin(t * 0.3 + i * 1.2));
    const oy = H * (0.15 + 0.15 * i + 0.1 * Math.cos(t * 0.25 + i * 0.8));
    const r = (isReel ? 120 : 100) + 50 * Math.sin(t * 0.4 + i);
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
    g.addColorStop(0, palette.glow + "22");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.translate(W * 0.5, H * 0.5);
  ctx.rotate(t * 0.16);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `${palette.accent}${i === 1 ? "77" : "33"}`;
    ctx.lineWidth = 1 + i;
    ctx.strokeRect(-W * (0.12 + i * 0.1), -H * (0.12 + i * 0.1), W * (0.24 + i * 0.2), H * (0.24 + i * 0.2));
  }
  ctx.restore();

  ctx.strokeStyle = "#ffffff04";
  ctx.lineWidth = 1;
  const step = isReel ? 60 : 80;
  for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const raw = Math.min(1, progress * 3.5);
  const ease = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
  const alpha = Math.min(1, progress * 4);
  const slideX = isReel ? 0 : (1 - ease) * -W * 0.18;
  const slideY = isReel ? (1 - ease) * H * 0.12 : 0;

  ctx.save();
  ctx.translate(slideX, slideY);
  ctx.globalAlpha = alpha;

  if (isReel) {
    const cx = W / 2;
    ctx.globalAlpha = alpha * 0.9;
    ctx.font = `${Math.min(160, W * 0.22)}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(scene.emoji || "🎬", cx, H * 0.22 + 10 * Math.sin(t * 1.2));

    ctx.globalAlpha = alpha;
    ctx.fillStyle = palette.accent + "22";
    ctx.beginPath(); ctx.roundRect(cx - 60, H * 0.32, 120, 28, 14); ctx.fill();
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = palette.accent;
    ctx.fillText(`◉  ${sceneIdx + 1} / ${totalScenes}`, cx, H * 0.32 + 19);

    ctx.font = `900 ${Math.min(68, W * 0.094)}px 'Arial Black', sans-serif`;
    ctx.fillStyle = palette.text;
    ctx.textAlign = "center";
    const hWords = (scene.heading || "").split(" ");
    let hL = "", hLs = [];
    for (const w of hWords) { const test = hL + w + " "; if (ctx.measureText(test).width > W * 0.88 && hL) { hLs.push(hL.trim()); hL = w + " "; } else hL = test; }
    if (hL) hLs.push(hL.trim());
    const hY = H * 0.42;
    hLs.forEach((l, i) => ctx.fillText(l, cx, hY + i * 76));
    ctx.fillStyle = palette.accent;
    ctx.fillRect(cx - Math.min(100, W * 0.2), hY + hLs.length * 76, Math.min(200, W * 0.4), 4);

    ctx.globalAlpha = Math.min(1, Math.max(0, progress * 5 - 0.6));
    ctx.font = `${Math.min(28, W * 0.038)}px Georgia, serif`;
    ctx.fillStyle = "#ffffffbb";
    const sWords = (scene.caption || "").split(" ");
    let sL = "", sLs = [];
    for (const w of sWords) { const test = sL + w + " "; if (ctx.measureText(test).width > W * 0.85 && sL) { sLs.push(sL.trim()); sL = w + " "; } else sL = test; }
    if (sL) sLs.push(sL.trim());
    sLs.slice(0, 3).forEach((l, i) => ctx.fillText(l, cx, hY + hLs.length * 76 + 36 + i * 36));
  } else {
    ctx.globalAlpha = alpha * 0.4;
    ctx.font = `${H * 0.6}px serif`;
    ctx.textAlign = "right";
    ctx.fillText(scene.emoji || "🎬", W - 40, H * 0.75);

    ctx.globalAlpha = alpha;
    ctx.textAlign = "left";
    ctx.fillStyle = palette.accent + "22";
    ctx.beginPath(); ctx.roundRect(36, 100, 140, 30, 15); ctx.fill();
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = palette.accent;
    ctx.fillText(`◉  SCENE ${sceneIdx + 1} / ${totalScenes}`, 50, 121);

    ctx.font = `900 ${Math.min(76, W * 0.058)}px 'Arial Black', sans-serif`;
    ctx.fillStyle = palette.text;
    const hWords = (scene.heading || "").split(" ");
    let hL = "", hLs = [];
    for (const w of hWords) { const test = hL + w + " "; if (ctx.measureText(test).width > W * 0.62 && hL) { hLs.push(hL.trim()); hL = w + " "; } else hL = test; }
    if (hL) hLs.push(hL.trim());
    hLs.forEach((l, i) => ctx.fillText(l, 36, 200 + i * 86));
    ctx.fillStyle = palette.accent;
    ctx.fillRect(36, 200 + hLs.length * 86, 220, 4);

    ctx.globalAlpha = Math.min(1, Math.max(0, progress * 5 - 0.5));
    ctx.font = `${Math.min(28, W * 0.022)}px Georgia, serif`;
    ctx.fillStyle = "#ffffffaa";
    const sWords = (scene.caption || "").split(" ");
    let sL = "", sLs = [];
    for (const w of sWords) { const test = sL + w + " "; if (ctx.measureText(test).width > W * 0.58 && sL) { sLs.push(sL.trim()); sL = w + " "; } else sL = test; }
    if (sL) sLs.push(sL.trim());
    sLs.slice(0, 3).forEach((l, i) => ctx.fillText(l, 36, 200 + hLs.length * 86 + 42 + i * 38));
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  const capH = isReel ? 120 : 90;
  const capGrad = ctx.createLinearGradient(0, H - capH, 0, H);
  capGrad.addColorStop(0, "transparent");
  capGrad.addColorStop(1, "#000000cc");
  ctx.fillStyle = capGrad;
  ctx.fillRect(0, H - capH, W, capH);

  const shineX = ((t * (isReel ? 130 : 170)) % (W + 260)) - 260;
  const shine = ctx.createLinearGradient(shineX, 0, shineX + 240, 0);
  shine.addColorStop(0, "transparent");
  shine.addColorStop(0.45, `${palette.accent}00`);
  shine.addColorStop(0.5, `${palette.accent}66`);
  shine.addColorStop(0.55, `${palette.accent}00`);
  shine.addColorStop(1, "transparent");
  ctx.fillStyle = shine;
  ctx.fillRect(0, H - capH, W, capH);

  ctx.globalAlpha = Math.min(1, Math.max(0, progress * 6 - 0.4));
  ctx.font = `bold ${isReel ? 22 : 18}px 'Segoe UI', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  const vWords = (scene.voiceover || "").split(" ");
  let vL = "", vLs = [];
  for (const w of vWords) { const test = vL + w + " "; if (ctx.measureText(test).width > W * 0.88 && vL) { vLs.push(vL.trim()); vL = w + " "; } else vL = test; }
  if (vL) vLs.push(vL.trim());
  const visVo = vLs.slice(0, 2);
  const voY = H - (isReel ? 65 : 50) + (visVo.length === 1 ? 14 : 0);
  visVo.forEach((l, i) => { ctx.shadowColor = "#000"; ctx.shadowBlur = 8; ctx.fillText(l, W / 2, voY + i * 28); ctx.shadowBlur = 0; });

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff10";
  ctx.fillRect(0, H - 5, W, 5);
  const prog = (sceneIdx + progress) / totalScenes;
  const pGrad = ctx.createLinearGradient(0, 0, W * prog, 0);
  pGrad.addColorStop(0, palette.accent + "99");
  pGrad.addColorStop(1, palette.accent);
  ctx.fillStyle = pGrad;
  ctx.fillRect(0, H - 5, W * prog, 5);

  ctx.fillStyle = "#00000055";
  ctx.fillRect(0, 0, W, isReel ? 52 : 48);
  ctx.font = `bold ${isReel ? 14 : 13}px 'Segoe UI', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffffcc";
  ctx.fillText(scene.videoTitle || "", W / 2, isReel ? 34 : 32);

  if (progress > 0 && progress < 0.99) {
    const wX = isReel ? W / 2 - 30 : W - 80;
    const wY = isReel ? H - 92 : 22;
    for (let i = 0; i < 12; i++) {
      const bH = 6 + 10 * Math.abs(Math.sin(t * 5 + i * 0.7));
      ctx.fillStyle = palette.accent + "99";
      ctx.fillRect(wX + i * 5, wY - bH, 3, bH);
    }
  }
}

export default function AutoVideoMaker() {
  const [topic, setTopic] = useState("");
  const [contentInputMode, setContentInputMode] = useState("topic");
  const [customScript, setCustomScript] = useState("");
  const [format, setFormat] = useState("reel");
  const [phase, setPhase] = useState("idle");
  const [statusLines, setStatusLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [currentScene, setCurrentScene] = useState(0);
  const [totalScenes, setTotalScenes] = useState(0);
  const [language, setLanguage] = useState("en");
  const [contentStyle, setContentStyle] = useState("educational");
  const [voiceStyle, setVoiceStyle] = useState("energetic");
  const [insights, setInsights] = useState([]);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const stopRef = useRef(false);
  const paletteRef = useRef(PALETTES[0]);
  const cloudTtsUnavailableRef = useRef(false);

  const activeFormat = FORMATS.find((f) => f.id === format) || FORMATS[0];
  const addStatus = useCallback((msg) => {
    setStatusLines((prev) => [...prev.slice(-4), msg]);
  }, []);

  const speakScene = (text, selectedLanguage, selectedVoiceStyle) => new Promise(resolve => {
    if (!window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voiceCfg = VOICE_STYLES.find(v => v.id === selectedVoiceStyle) || VOICE_STYLES[0];
    u.rate = voiceCfg.rate;
    u.pitch = voiceCfg.pitch;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const langHint = LANGUAGES.find(l => l.id === selectedLanguage)?.ttsHint || "en";
    const v = voices.find(voice => voice.lang.toLowerCase().startsWith(langHint) && (voice.name.includes("Google") || voice.name.includes("Natural")))
      || voices.find(voice => voice.lang.toLowerCase().startsWith(langHint))
      || voices.find(voice => voice.lang.toLowerCase().startsWith("en"))
      || voices[0];
    if (v) u.voice = v;
    u.onend = resolve; u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });

  const playCapturedNarration = useCallback(async () => {
    if (cloudTtsUnavailableRef.current) return false;

    cloudTtsUnavailableRef.current = true;
    addStatus("ℹ️ Cloud TTS abhi available nahi. Browser voice fallback use ho raha hai.");
    return false;
  }, [addStatus]);

  const makeVideo = useCallback(async () => {
    const scriptMode = contentInputMode === "script";
    if (phase === "thinking" || phase === "recording") return;
    if (!topic.trim() && !customScript.trim()) return;
    stopRef.current = false;
    setPhase("thinking");
    setVideoUrl(null);
    setStatusLines([]);
    setProgress(0);
    setCurrentScene(0);
    setInsights([]);

    const selectedFmt = FORMATS.find((f) => f.id === format) || FORMATS[0];
    paletteRef.current = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    addStatus("🤖 AI scene plan bana raha hai...");

    const contentSource = scriptMode
      ? `Use this user-written script as the source of truth. Keep the meaning but optimize for short-video delivery:\n${customScript}`
      : `Topic: "${topic}"`;

    const prompt = `You are a viral social media video creator + research assistant. Create a complete ${selectedFmt.label}.

${contentSource}

Language: ${language}
Content style: ${contentStyle}
Voice style: ${voiceStyle}

Return ONLY valid JSON (no backticks, no markdown):
{
  "title": "catchy title max 50 chars",
  "insights": ["3-5 short bullets with related facts/context"],
  "scenes": [
    {
      "heading": "3-5 word punchy title",
      "caption": "one line key fact or insight (max 12 words)",
      "voiceover": "natural speech 20-28 words. energetic and engaging.",
      "emoji": "most relevant single emoji",
      "duration": 9
    }
  ]
}

Rules:
- Exactly ${selectedFmt.scenes} scenes
- Scene 1: powerful hook
- Scene ${selectedFmt.scenes}: CTA (like, follow, share)
- Each voiceover = 20-28 words only
- Duration 8-10 seconds per scene
- Keep language strictly in ${language}
- Tone should match this style: ${contentStyle}
- Make it VIRAL and engaging
- If user script is provided, preserve the same narrative flow (hook -> body -> ending)
- insights should summarize key related details that help audience understand the script better`;

    let scenes = [];
    let title = "";
    let aiInsights = [];

    try {
      const apiKey = resolveOpenRouterKey();

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Auto Video AI",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-sonnet",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const apiError = data?.error?.message || `OpenRouter request failed (${res.status})`;
        if (res.status === 401) {
          throw new Error("401 Unauthorized: API key reject ho gaya. Valid OpenRouter key use karo aur dev server restart karo.");
        }
        throw new Error(apiError);
      }

      const content = data?.choices?.[0]?.message?.content ?? data?.content;
      const raw = Array.isArray(content)
        ? content.map(block => block?.text || block?.content || "").join("")
        : (typeof content === "string" ? content : "");

      if (!raw.trim()) throw new Error("AI response empty tha");

      const clean = raw.replace(/```json\n?|```/g, "").trim();
      const jsonText = clean.match(/\{[\s\S]*\}/)?.[0] || clean;
      const parsed = JSON.parse(jsonText);

      scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
      title = (parsed?.title || topic || "Auto Video").toString().slice(0, 56);
      aiInsights = Array.isArray(parsed?.insights)
        ? parsed.insights.map((item) => item?.toString().trim()).filter(Boolean).slice(0, 5)
        : [];
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Dobara try karo.";
      console.error("Scene generation failed", err);
      addStatus(`⚠️ AI error: ${msg}`);
      addStatus("🛟 Fallback script use kiya gaya taaki video generation rukay nahi.");
      const fallbackTopic = topic || customScript.split("\n")[0] || "Auto Video";
      title = `${fallbackTopic.slice(0, 38)}${fallbackTopic.length > 38 ? "..." : ""}` || "Auto Video";
      scenes = fallbackScenes(fallbackTopic, selectedFmt, language, contentStyle);
      aiInsights = ["AI insights unavailable. Retry with API key for related facts."];
    }

    scenes = normalizeScenes(scenes, selectedFmt, title);

    if (!scenes.length) { setPhase("error"); addStatus("❌ Scenes nahi bani. Try again."); return; }

    setVideoTitle(title);
    setInsights(aiInsights);
    setTotalScenes(scenes.length);
    addStatus(`✅ ${scenes.length} scenes ready! Recording shuru...`);
    setPhase("recording");

    const canvas = canvasRef.current;
    canvas.width = selectedFmt.w;
    canvas.height = selectedFmt.h;
    const ctx = canvas.getContext("2d");
    renderScene(ctx, scenes[0], 0, paletteRef.current, 0, scenes.length, selectedFmt, Date.now());

    chunksRef.current = [];
    let rec = null;
    try {
      const videoStream = canvas.captureStream(30);
      const audioEl = audioElRef.current;
      const capturedAudioStream = audioEl
        ? (audioEl.captureStream?.() || audioEl.mozCaptureStream?.())
        : null;
      const mixedTracks = [...videoStream.getVideoTracks(), ...(capturedAudioStream?.getAudioTracks?.() || [])];
      const stream = new MediaStream(mixedTracks);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4000000 });
      recRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.start(100);
      addStatus("⚠️ Browser security ki wajah se speech voice export me include nahi hoti. Video silent download ho sakti hai.");
    } catch { addStatus("⚠️ Recording supported nahi. Preview mode."); }

    const totalDur = scenes.reduce((s, sc) => s + (sc.duration || 9), 0);
    let elapsed = 0;

    for (let i = 0; i < scenes.length; i++) {
      if (stopRef.current) break;
      const scene = scenes[i];
      const sceneDur = (scene.duration || 9) * 1000;
      setCurrentScene(i);
      addStatus(`🎬 Scene ${i + 1}/${scenes.length}: "${scene.heading}"`);

      const speechPromise = (async () => {
        const captured = await playCapturedNarration();
        if (!captured) await speakScene(scene.voiceover || scene.heading, language, voiceStyle);
      })();

      await new Promise(resolve => {
        const sceneStart = Date.now();
        const animate = () => {
          if (stopRef.current) { resolve(); return; }
          const now = Date.now();
          const prog = Math.min(1, (now - sceneStart) / sceneDur);
          renderScene(ctx, scene, prog, paletteRef.current, i, scenes.length, selectedFmt, now);
          setProgress(Math.min(1, (elapsed + (now - sceneStart)) / (totalDur * 1000)));
          if (prog < 1) rafRef.current = requestAnimationFrame(animate);
          else resolve();
        };
        rafRef.current = requestAnimationFrame(animate);
      });

      await speechPromise;
      elapsed += sceneDur;
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (rec && rec.state === "recording") {
      await new Promise(resolve => {
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          setVideoUrl(URL.createObjectURL(blob));
          resolve();
        };
        rec.stop();
      });
    }

    setProgress(1);
    setPhase("done");
    addStatus("🎉 Video ready! Neeche download karo.");
  }, [topic, customScript, contentInputMode, format, phase, language, contentStyle, voiceStyle, playCapturedNarration, addStatus]);

  const stopAll = () => {
    stopRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recRef.current?.state === "recording") {
      try {
        recRef.current.stop();
      } catch {
        // Ignore stop failures when recorder is already shutting down
      }
    }
    setPhase("idle");
    addStatus("⏹ Roka gaya.");
  };

  const displayH = format === "reel" ? 460 : 300;
  const displayW = format === "reel" ? Math.round(460 * (9 / 16)) : Math.round(300 * (16 / 9));
  const isWorking = phase === "thinking" || phase === "recording";

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#e8e8f5", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @keyframes glow { 0%,100%{box-shadow:0 0 20px #c084fc40} 50%{box-shadow:0 0 40px #c084fc80} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes recPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
        @keyframes statusIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a45; border-radius: 3px; }
        textarea { outline: none; }
      `}</style>

      <div style={{ width: "100%", borderBottom: "1px solid #10101e", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, background: "#07070d" }}>
        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#7c3aed,#c026d3)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚡</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.4 }}>Auto Video AI</div>
          <div style={{ fontSize: 10, color: "#3a3a5a", letterSpacing: 1.5, textTransform: "uppercase" }}>Topic → Full Video. Automatic.</div>
        </div>
        {isWorking && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "#1a0a30", border: "1px solid #3d1f6e", borderRadius: 20, padding: "5px 14px", animation: "recPulse 1.5s infinite" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: phase === "recording" ? "#ef4444" : "#c084fc" }} />
            <span style={{ fontSize: 11, color: "#c084fc", fontWeight: 700 }}>{phase === "recording" ? "REC" : "THINKING"}</span>
          </div>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 900, padding: "28px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeUp 0.4s ease" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>CONTENT INPUT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CONTENT_INPUT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => !isWorking && setContentInputMode(mode.id)}
                  style={{ background: contentInputMode === mode.id ? "#1a0a30" : "#0a0a14", border: `1.5px solid ${contentInputMode === mode.id ? "#7c3aed" : "#16162e"}`, color: contentInputMode === mode.id ? "#c084fc" : "#4c4c72", borderRadius: 10, padding: "10px 8px", fontSize: 12, fontWeight: 700, cursor: isWorking ? "default" : "pointer" }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>VIDEO TOPIC</div>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              disabled={isWorking}
              placeholder={"e.g. 5 life-changing habits\ne.g. How black holes are formed\ne.g. Best street food in Pakistan"}
              rows={4}
              style={{ width: "100%", background: "#0a0a14", border: `1.5px solid ${topic ? "#7c3aed" : "#16162e"}`, borderRadius: 12, padding: "14px 16px", color: "#e8e8f5", fontSize: 14, lineHeight: 1.7, resize: "none", transition: "border-color 0.2s" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>USER SCRIPT (OPTIONAL)</div>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              disabled={isWorking}
              placeholder={"Hook:\nBody:\nEnding:\n\nApna script yahan paste karo, AI isko optimize + related insights dega."}
              rows={6}
              style={{ width: "100%", background: "#0a0a14", border: `1.5px solid ${customScript ? "#c026d3" : "#16162e"}`, borderRadius: 12, padding: "14px 16px", color: "#e8e8f5", fontSize: 13, lineHeight: 1.65, resize: "vertical" }}
            />
            <div style={{ marginTop: 6, color: "#4c4c72", fontSize: 11 }}>
              {contentInputMode === "script" ? "Script mode active: AI aapke flow ko preserve karega." : "Tip: better output ke liye Hook / Body / Ending format use karo."}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>VIDEO FORMAT</div>
            <div style={{ display: "flex", gap: 8 }}>
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => !isWorking && setFormat(f.id)} style={{ flex: 1, background: format === f.id ? "#1a0a30" : "#0a0a14", border: `1.5px solid ${format === f.id ? "#7c3aed" : "#16162e"}`, color: format === f.id ? "#c084fc" : "#3a3a5a", borderRadius: 10, padding: "10px 8px", cursor: isWorking ? "default" : "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                  {f.label}
                  <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 2 }}>{f.scenes} scenes</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Language</div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isWorking}
                style={{ width: "100%", background: "#0a0a14", border: "1.5px solid #16162e", borderRadius: 10, color: "#cbd5e1", padding: "10px" }}
              >
                {LANGUAGES.map((lang) => <option key={lang.id} value={lang.id}>{lang.label}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Voice</div>
              <select
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                disabled={isWorking}
                style={{ width: "100%", background: "#0a0a14", border: "1.5px solid #16162e", borderRadius: 10, color: "#cbd5e1", padding: "10px" }}
              >
                {VOICE_STYLES.map((voice) => <option key={voice.id} value={voice.id}>{voice.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Content Style</div>
            <select
              value={contentStyle}
              onChange={(e) => setContentStyle(e.target.value)}
              disabled={isWorking}
              style={{ width: "100%", background: "#0a0a14", border: "1.5px solid #16162e", borderRadius: 10, color: "#cbd5e1", padding: "10px" }}
            >
              {CONTENT_STYLES.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
            </select>
          </div>

          {!isWorking ? (
            <button onClick={makeVideo} disabled={!topic.trim() && !customScript.trim()} style={{ width: "100%", background: topic.trim() || customScript.trim() ? "linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)" : "#0f0f1e", border: "none", borderRadius: 14, padding: "18px", color: topic.trim() || customScript.trim() ? "#fff" : "#2a2a45", fontSize: 16, fontWeight: 900, cursor: topic.trim() || customScript.trim() ? "pointer" : "default", transition: "all 0.3s", boxShadow: topic.trim() || customScript.trim() ? "0 6px 30px #7c3aed50" : "none", animation: topic.trim() || customScript.trim() ? "glow 3s infinite" : "none" }}>
              {phase === "done" ? "🔄 Naya Video Banao" : "⚡ Video Banao — Automatic"}
            </button>
          ) : (
            <button onClick={stopAll} style={{ width: "100%", background: "#1a0505", border: "1.5px solid #7f1d1d", borderRadius: 14, padding: "18px", color: "#ef4444", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              ⏹ Rokna Hai
            </button>
          )}

          {(isWorking || phase === "done") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "#3a3a5a", textTransform: "uppercase", letterSpacing: 1.5 }}>Progress</span>
                <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700 }}>{Math.round(progress * 100)}%</span>
              </div>
              <div style={{ height: 6, background: "#10101e", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #c026d3)", width: `${progress * 100}%`, borderRadius: 6, transition: "width 0.3s ease", boxShadow: "0 0 10px #7c3aed60" }} />
              </div>
              {isWorking && totalScenes > 0 && <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 5 }}>Scene {currentScene + 1} / {totalScenes} rendering...</div>}
            </div>
          )}

          {statusLines.length > 0 && (
            <div style={{ background: "#07070d", border: "1px solid #10101e", borderRadius: 10, padding: "12px 14px" }}>
              {statusLines.map((s, i) => (
                <div key={i} style={{ fontSize: 11, color: i === statusLines.length - 1 ? "#c084fc" : "#2a2a45", lineHeight: 1.8, animation: "statusIn 0.3s ease", fontFamily: "monospace" }}>{s}</div>
              ))}
            </div>
          )}

          {insights.length > 0 && (
            <div style={{ background: "#07101b", border: "1px solid #1d3b6e", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>AI Related Insights</div>
              {insights.map((point, i) => (
                <div key={i} style={{ color: "#bfdbfe", fontSize: 12, lineHeight: 1.65, marginBottom: 6 }}>• {point}</div>
              ))}
            </div>
          )}

          {phase === "idle" && !videoUrl && (
            <div style={{ background: "#07070d", border: "1px solid #10101e", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#3a3a5a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>Kaise kaam karta hai</div>
              {[["1","Topic likho","Koi bhi topic — AI ko sab pata hai"],["2","Format choose karo","Short/Reel ya YouTube"],["3","Button dabao","Bas ek click — baaki sab automatic"],["4","Video download karo","CapCut ya editor mein polish karo"]].map(([num, t, d]) => (
                <div key={num} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a0a30", border: "1px solid #3d1f6e", color: "#7c3aed", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#c084fc" }}>{t}</div>
                    <div style={{ fontSize: 11, color: "#3a3a5a", lineHeight: 1.5 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeUp 0.4s ease 0.1s both" }}>
          <div style={{ background: "#07070d", border: `1.5px solid ${isWorking ? "#3d1f6e" : "#10101e"}`, borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: 12, boxShadow: isWorking ? "0 0 40px #7c3aed20" : "none", transition: "box-shadow 0.5s" }}>
            <div style={{ position: "relative" }}>
              <canvas ref={canvasRef} width={activeFormat.w} height={activeFormat.h} style={{ display: "block", width: displayW, height: displayH, borderRadius: 10, background: "#0a0a14" }} />
              <audio ref={audioElRef} hidden preload="auto" crossOrigin="anonymous" />
              {phase === "idle" && !videoUrl && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, pointerEvents: "none" }}>
                  <div style={{ fontSize: 40 }}>🎬</div>
                  <div style={{ fontSize: 12, color: "#2a2a45", textAlign: "center" }}>Yahan video dikhegi</div>
                </div>
              )}
              {phase === "recording" && (
                <div style={{ position: "absolute", top: 8, right: 8, background: "#ef444499", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 5, animation: "recPulse 1s infinite" }}>
                  <span style={{ width: 6, height: 6, background: "#fff", borderRadius: "50%", display: "inline-block" }} /> REC
                </div>
              )}
            </div>
          </div>

          {isWorking && totalScenes > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {Array.from({ length: totalScenes }).map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < currentScene ? "#7c3aed" : i === currentScene ? "#c084fc" : "#10101e", border: i === currentScene ? "1.5px solid #c084fc" : "1.5px solid transparent", transition: "all 0.3s" }} />
              ))}
            </div>
          )}

          {videoTitle && phase !== "idle" && (
            <div style={{ textAlign: "center", fontSize: 12, color: "#7c3aed", fontWeight: 700, maxWidth: displayW }}>📹 {videoTitle}</div>
          )}

          {videoUrl && (
            <div style={{ width: "100%", background: "#07120a", border: "1px solid #14532d", borderRadius: 14, padding: "16px", animation: "fadeUp 0.4s ease" }}>
              <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 800, marginBottom: 10, textAlign: "center" }}>🎉 Video Taiyar Hai!</div>
              <video src={videoUrl} controls style={{ width: "100%", borderRadius: 8, marginBottom: 10, maxHeight: 140, background: "#000" }} />
              <a href={videoUrl} download={`${topic.slice(0, 25).replace(/\s+/g, "-")}-video.webm`} style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 20px #16a34a40" }}>
                ⬇️ Download Video (.webm)
              </a>
              <div style={{ fontSize: 10, color: "#166534", marginTop: 8, textAlign: "center", lineHeight: 1.6 }}>
                Voiceover + captions already included. Final polish ke liye CapCut/DaVinci mein music add karke upload karo.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
