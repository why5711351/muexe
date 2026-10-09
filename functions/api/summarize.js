// Cloudflare Pages Function — YouTube Video Summarizer
// Route: /api/summarize?url=<youtube_url>
//
// Pipeline: parse video ID -> fetch captions (manual preferred, auto fallback)
//           -> call Workers AI (llama-3.1-8b) -> return structured English summary.
// No npm dependencies. Requires a Workers AI binding named "AI"
// (see deploy/YOUTUBE_SUMMARIZER.md).

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const MAX_TRANSCRIPT_CHARS = 20000;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
};

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const input = url.searchParams.get("url") || url.searchParams.get("v") || "";

  const videoId = extractVideoId(input);
  if (!videoId) {
    return json(
      { error: "Invalid YouTube URL. Paste a link like https://www.youtube.com/watch?v=..." },
      400
    );
  }

  try {
    const transcript = await fetchTranscript(videoId);
    const result = await summarize(env, transcript);
    return json(result, 200);
  } catch (e) {
    return json({ error: e.message || "Failed to summarize this video." }, 500);
  }
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

// ----------------------------------------------------------------------------
// Captions
// ----------------------------------------------------------------------------
async function fetchTranscript(videoId) {
  const player = await getPlayerResponse(videoId);
  const title = player?.videoDetails?.title || "";

  const tracks =
    player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (!tracks.length) {
    throw new Error(
      "No subtitles available for this video (captions may be disabled)."
    );
  }

  const manual = tracks.filter((t) => t.kind !== "asr");
  const auto = tracks.filter((t) => t.kind === "asr");
  const track = pickPreferred(manual) || pickPreferred(auto) || tracks[0];

  const segments = await fetchCaptions(track.baseUrl);

  return {
    videoId,
    title,
    language: track.languageCode || "en",
    generated: track.kind === "asr",
    segments,
  };
}

async function getPlayerResponse(videoId) {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: { clientName: "WEB", clientVersion: "2.20240801.00.00", hl: "en", gl: "US" },
        },
        videoId,
      }),
    }
  );
  if (!res.ok) {
    throw new Error("Could not reach YouTube. Please try again in a moment.");
  }
  return res.json();
}

function pickPreferred(tracks) {
  if (!tracks.length) return null;
  const en = tracks.find((t) => (t.languageCode || "").startsWith("en"));
  return en || tracks[0];
}

async function fetchCaptions(baseUrl) {
  const res = await fetch(baseUrl + "&fmt=json3");
  if (!res.ok) throw new Error("Failed to download subtitles.");
  const data = await res.json();

  const segments = [];
  for (const ev of data.events || []) {
    if (ev.segs) {
      const text = ev.segs.map((s) => s.utf8 || "").join("").trim();
      if (text) {
        segments.push({
          text,
          start: (ev.tStartMs || 0) / 1000,
          duration: (ev.dDurationMs || 0) / 1000,
        });
      }
    }
  }
  if (!segments.length) throw new Error("Subtitles were empty.");
  return segments;
}

// ----------------------------------------------------------------------------
// AI summarization
// ----------------------------------------------------------------------------
async function summarize(env, transcript) {
  if (!env.AI) {
    throw new Error(
      "AI binding is not configured. See deploy/YOUTUBE_SUMMARIZER.md."
    );
  }

  const lines = transcript.segments.map((s) => `[${fmt(s.start)}] ${s.text}`);
  let full = lines.join("\n");
  if (full.length > MAX_TRANSCRIPT_CHARS) {
    full = full.slice(0, MAX_TRANSCRIPT_CHARS) + "\n[transcript truncated]";
  }

  const prompt = `You are a professional video summarizer. Summarize the YouTube video transcript below.

Return ONLY valid JSON (no markdown fences, no extra text) with this exact shape:
{
  "summary": "3-5 sentence overview of the video",
  "keyPoints": ["4-6 concise bullet points"],
  "chapters": [
    {"time": "MM:SS", "title": "short chapter title", "summary": "1-2 sentence chapter summary"}
  ]
}

Rules:
- All output text in English.
- 3 to 8 chapters following the video's natural sections.
- Chapter timestamps must be taken from the transcript.

Transcript:
${full}`;

  const response = await env.AI.run(AI_MODEL, {
    messages: [
      { role: "system", content: "You output only valid JSON, never markdown." },
      { role: "user", content: prompt },
    ],
    max_tokens: 2048,
  });

  const raw =
    typeof response === "string" ? response : response?.response || "";
  const parsed = parseJson(raw);

  return {
    videoId: transcript.videoId,
    title: transcript.title,
    language: transcript.language,
    generated: transcript.generated,
    summary: parsed.summary || "No summary generated.",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
  };
}

function parseJson(raw) {
  let s = String(raw).trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch (e) {
    return { summary: String(raw), keyPoints: [], chapters: [] };
  }
}

function fmt(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function extractVideoId(input) {
  if (!input) return null;
  const s = input.trim();
  let m = s.match(/youtu\.be\/([\w-]{6,})/);
  if (m) return m[1];
  m = s.match(/[?&]v=([\w-]{6,})/);
  if (m) return m[1];
  m = s.match(/(?:shorts|embed|live|v)\/([\w-]{6,})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(s)) return s;
  return null;
}
