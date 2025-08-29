// utils/faceVerification.js
import dotenv from "dotenv";
dotenv.config();

// If Node < 18, uncomment next line and install node-fetch
// import fetch from "node-fetch";

const DS_API_URL = process.env.DS_API_URL;
const DS_API_KEY = process.env.DS_API_KEY || "";
const FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.8);

// Accepts two images (data URLs or raw base64/urls). DS can decide how to handle.
export async function verifyFaces(imageA, imageB) {
  if (!DS_API_URL) {
    // Safety fallback: block if DS is not configured
    return { ok: false, score: null, source: "fallback-no-ds" };
  }

  try {
    const res = await fetch(DS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(DS_API_KEY ? { "Authorization": `Bearer ${DS_API_KEY}` } : {})
      },
      body: JSON.stringify({
        imageA,
        imageB
      })
    });

    if (!res.ok) {
      return { ok: false, score: null, source: "http-error" };
    }

    // DS could return: { match: true/false } OR { score: 0..1 } OR { percentage: 0..100 }
    const data = await res.json();

    let ok = false;
    let score = null;

    if (typeof data === "boolean") {
      ok = data;
    } else if (typeof data?.match === "boolean") {
      ok = data.match;
      score = data.score ?? null;
    } else if (typeof data?.score === "number") {
      score = data.score; // 0..1
      ok = score >= FACE_MATCH_THRESHOLD;
    } else if (typeof data?.percentage === "number") {
      score = data.percentage / 100; // convert 0..100 -> 0..1
      ok = score >= FACE_MATCH_THRESHOLD;
    }

    return { ok: !!ok, score };
  } catch (e) {
    return { ok: false, score: null, source: "exception" };
  }
}
