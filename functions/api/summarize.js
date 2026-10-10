// Cloudflare Pages Function — YouTube Video Summarizer
// Route: /api/summarize?url=<youtube_url>
//
// Pipeline: parse video ID -> fetch captions (manual preferred, auto fallback)
//           -> call Workers AI (llama-4-scout-17b) -> return structured English summary.
// No npm dependencies. Requires a Workers AI binding named "AI"
// (see deploy/YOUTUBE_SUMMARIZER.md).

const INNERTUBE_KEY_FALLBACK = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const AI_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
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
const CLIENT_CONTEXTS = [
  {
    name: "ANDROID_VR",
    clientName: "ANDROID_VR",
    clientVersion: "1.71.26",
    deviceMake: "Oculus",
    deviceModel: "Quest 3",
    androidSdkVersion: 32,
    osName: "Android",
    osVersion: "12L",
    userAgent:
      "com.google.android.apps.youtube.vr.oculus/1.71.26 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
    clientHeader: "28",
  },
  {
    name: "ANDROID",
    clientName: "ANDROID",
    clientVersion: "21.02.35",
    androidSdkVersion: 30,
    osName: "Android",
    osVersion: "11",
    userAgent: "com.google.android.youtube/21.02.35 (Linux; U; Android 11) gzip",
    clientHeader: "3",
  },
  {
    name: "IOS",
    clientName: "IOS",
    clientVersion: "21.02.3",
    deviceMake: "Apple",
    deviceModel: "iPhone16,2",
    osName: "iPhone",
    osVersion: "18.3.2.22D82",
    userAgent:
      "com.google.ios.youtube/21.02.3 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
    clientHeader: "5",
  },
  {
    name: "WEB",
    clientName: "WEB",
    clientVersion: "2.20260115.01.00",
    userAgent: BROWSER_UA,
    clientHeader: "1",
  },
];

// YouTube WEB-client caption URLs became Proof-of-Origin (PO) token gated in
// mid-2025 and now download empty bodies, while the ANDROID_VR / ANDROID / IOS
// clients still return signed, token-free caption URLs. ANDROID_VR is preferred:
// it does not require a PO token at all (yt-dlp marks it REQUIRE_PO_TOKEN: False).
// Hardcoded INNERTUBE keys expire, so we fetch a fresh key + visitorData from the
// watch page (visitorData helps avoid datacenter-IP caption-stripping), then walk
// each client through the full player -> track -> download pipeline and return on
// the first that succeeds.
async function fetchWatchConfig(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error(`watch page HTTP ${res.status}`);
  const html = await res.text();
  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const visitorMatch = html.match(/"visitorData":"([^"]+)"/);
  return {
    key: keyMatch ? keyMatch[1] : null,
    visitorData: visitorMatch ? visitorMatch[1] : null,
  };
}

async function fetchTranscript(videoId) {
  const failures = [];

  let watchCfg = null;
  try {
    watchCfg = await fetchWatchConfig(videoId);
  } catch (e) {
    failures.push(`key: ${e.message}`);
  }
  const keys = watchCfg?.key
    ? [watchCfg.key, INNERTUBE_KEY_FALLBACK]
    : [INNERTUBE_KEY_FALLBACK];
  const visitorData = watchCfg?.visitorData || null;

  for (const key of keys) {
    for (const ctx of CLIENT_CONTEXTS) {
      try {
        const player = await getPlayerResponse(videoId, ctx, key, visitorData);
        const tracks =
          player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        if (!tracks.length) {
          failures.push(`${ctx.name}: no caption tracks`);
          continue;
        }

        const manual = tracks.filter((t) => t.kind !== "asr");
        const auto = tracks.filter((t) => t.kind === "asr");
        const track = pickPreferred(manual) || pickPreferred(auto) || tracks[0];

        const segments = await fetchCaptions(track.baseUrl, ctx.userAgent);

        return {
          videoId,
          title: player?.videoDetails?.title || "",
          thumbnail: pickThumbnail(videoId, player),
          language: track.languageCode || "en",
          generated: track.kind === "asr",
          segments,
        };
      } catch (e) {
        failures.push(`${ctx.name}: ${e.message}`);
      }
    }
  }

  throw new Error(
    `Could not fetch subtitles (${failures.join("; ") || "unknown reason"}).`
  );
}

async function getPlayerResponse(videoId, ctx, key, visitorData) {
  const client = {
    clientName: ctx.clientName,
    clientVersion: ctx.clientVersion,
    hl: "en",
    gl: "US",
  };
  if (ctx.androidSdkVersion) client.androidSdkVersion = ctx.androidSdkVersion;
  if (ctx.deviceMake) client.deviceMake = ctx.deviceMake;
  if (ctx.deviceModel) client.deviceModel = ctx.deviceModel;
  if (ctx.osName) client.osName = ctx.osName;
  if (ctx.osVersion) client.osVersion = ctx.osVersion;

  const context = { client };
  if (visitorData) context.visitorData = visitorData;

  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${key}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": ctx.userAgent,
        "X-YouTube-Client-Name": ctx.clientHeader,
        "X-YouTube-Client-Version": ctx.clientVersion,
        Origin: "https://www.youtube.com",
      },
      body: JSON.stringify({ context, videoId }),
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

function pickThumbnail(videoId, player) {
  const thumbs = player?.videoDetails?.thumbnail?.thumbnails;
  if (Array.isArray(thumbs) && thumbs.length) {
    const best = thumbs[thumbs.length - 1];
    if (best?.url) return best.url;
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

async function fetchCaptions(baseUrl, userAgent) {
  const clean = baseUrl.replace(/[&?]fmt=[^&]*/g, "");
  const res = await fetch(clean + (clean.includes("?") ? "&" : "?") + "fmt=json3", {
    headers: { "User-Agent": userAgent || "" },
  });
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

  // Extract the model's text output, tolerating several response shapes:
  // string, {response: string}, {response: object}, {choices:[...]}, etc.
  let raw = "";
  if (typeof response === "string") {
    raw = response;
  } else if (response && typeof response === "object") {
    const candidates = [
      response.response,
      response.output_text,
      response.text,
      response.choices?.[0]?.message?.content,
    ];
    for (const c of candidates) {
      if (typeof c === "string") {
        raw = c;
        break;
      }
      if (c && typeof c === "object") {
        raw = JSON.stringify(c);
        break;
      }
    }
  }

  const parsed = parseJson(raw);

  return {
    videoId: transcript.videoId,
    title: transcript.title,
    thumbnail: transcript.thumbnail,
    language: transcript.language,
    generated: transcript.generated,
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "No summary generated.",
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
