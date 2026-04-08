import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useScanStore = create(
  persist(
    (set, get) => ({
      scans: [],

      addScan: (scan) => set((state) => ({
        scans: [scan, ...state.scans].slice(0, 50), // keep last 50
      })),

      getRecentScans: (count = 5) => get().scans.slice(0, count),

      clearScans: () => set({ scans: [] }),
    }),
    { name: "dalxic-scan-results" }
  )
)

// ── Intent classifier (client-side, zero API cost) ─────────────────────
const SCAN_KEYWORDS = [
  "scan","result","score","find","found","flag","flagged",
  "detect","detected","image","video","audio","file","report",
  "confidence","verdict","dimension","compare","last","recent",
  "authentic","fake","real","ai_detected","noise","gan","pixel",
  "metadata","edge","compression","color","semantic","chromaveil",
  "kineticscan","sonictrace","forensiq","explain","why","what",
  "how much did","scored","analysis","analysed","analyzed",
]

const BILLING_KEYWORDS = [
  "price","pricing","plan","upgrade","billing","cost","pay",
  "subscribe","subscription","enterprise","contact","sales",
  "invoice","trial","fee","charge","credit",
]

export function classifyIntent(text) {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, "")
  const words = lower.split(/\s+/)

  const billingHits = words.filter(w => BILLING_KEYWORDS.some(k => w.includes(k))).length
  if (billingHits >= 1) return "BILLING_QUERY"

  const scanHits = words.filter(w => SCAN_KEYWORDS.some(k => w.includes(k))).length
  if (scanHits >= 1) return "SCAN_QUERY"

  return "GENERAL_QUERY"
}

// ── Static knowledge cache (zero API cost) ─────────────────────────────
const KNOWLEDGE = {
  "gan fingerprint": "**GAN Fingerprint** detects pixel-level patterns characteristic of Generative Adversarial Networks. GANs produce subtle checkerboard artefacts in the frequency domain — invisible to the eye but statistically detectable. A high score (65+) indicates strong generative patterns were found in the media.",
  "pixel coherence": "**Pixel Coherence** measures the consistency of pixel relationships across an image. Real photos have natural noise gradients and consistent sensor patterns. AI-generated images often show unnaturally uniform regions or inconsistent texture transitions. A high score suggests synthetic pixel relationships.",
  "metadata integrity": "**Metadata Integrity** examines EXIF data, file container structure, and encoding metadata. Authentic photos carry camera-specific metadata (model, lens, GPS, timestamps). AI-generated images typically have stripped or fabricated metadata. A high score indicates missing or suspicious metadata.",
  "edge consistency": "**Edge Consistency** analyses the sharpness and blending quality at object boundaries. AI models often struggle with clean edges — producing halos, blurring, or unnatural sharpness transitions. A high score means boundary artefacts consistent with AI generation were detected.",
  "noise pattern": "**Noise Pattern** evaluates sensor noise signatures. Real cameras produce characteristic noise profiles (Gaussian, shot noise) that vary with ISO and exposure. AI images have unnaturally low or uniform noise — often below 5 on our scale, where real photos sit between 8-25. A high score indicates synthetic noise patterns.",
  "compression artefact": "**Compression Artefact** detects re-encoding traces, splicing boundaries, and generation-specific compression signatures. Different AI models leave distinct compression fingerprints. A high score suggests the file has been through a generative pipeline or has been manipulated.",
  "color distribution": "**Color Distribution** examines RGB histogram patterns for synthetic uniformity. Real photos have organic, irregular colour distributions shaped by natural lighting. AI images often show suspiciously smooth histograms with duplicate bucket values across channels. A high score indicates synthetic colour patterns.",
  "semantic logic": "**Semantic Logic** checks physical plausibility — shadows matching light sources, reflections being consistent, anatomy being correct, text being readable. AI models frequently produce impossible physics: shadows in wrong directions, extra fingers, mirrored text. A high score means logical inconsistencies were found.",
  "how does dalxic work": "Dalxic AI uses the **DalxicMind™** forensic engine powered by our proprietary **Nexus-7** architecture. It analyses media across 8 forensic dimensions simultaneously — from pixel-level GAN fingerprints to high-level semantic logic. Each dimension produces a score (0-100), and the combined analysis generates a verdict: **AUTHENTIC**, **NEEDS_REVIEW**, or **AI_DETECTED** with an overall confidence percentage.",
  "what dimensions": "DalxicMind™ analyses 8 forensic dimensions:\n\n- **GAN Fingerprint** — generative network pixel patterns\n- **Pixel Coherence** — pixel relationship consistency\n- **Metadata Integrity** — EXIF and file structure\n- **Edge Consistency** — boundary quality analysis\n- **Noise Pattern** — sensor noise vs synthetic noise\n- **Compression Artefact** — encoding and splicing traces\n- **Color Distribution** — histogram uniformity analysis\n- **Semantic Logic** — physical plausibility check\n\nEach scored 0-100. Two or more elevated scores typically indicate AI generation.",
  "what is forensiq": "**ForensIQ™** is Dalxic AI's certified forensic reporting system. It generates detailed analysis reports containing the verdict, confidence score, all 8 dimension breakdowns, forensic reasoning, file metadata, and a tamper-proof signature hash. ForensIQ™ reports are designed for legal, judicial, and enterprise use cases.",
  "what is nexuslink": "**NexusLink™** is Dalxic AI's integration API layer. It provides programmatic access to the full DalxicMind™ engine via REST endpoints — supporting image, video, audio, and text analysis with webhook callbacks and batch processing. Available on Journalist Premium, Broadcast, and Government plans.",
  "what is chromaveil": "**ChromaVeil™** is the image authentication layer within DalxicMind™. It specialises in detecting AI-generated and manipulated still images through pixel analysis, frequency domain inspection, and metadata verification.",
  "what is kineticscan": "**KineticScan™** is the video and deepfake analysis module. It examines temporal consistency across frames, facial landmark stability, lip-sync coherence, and inter-frame artefacts to detect synthetic or manipulated video content.",
  "what is sonictrace": "**SonicTrace™** is the audio forensics module. It analyses waveform patterns, spectral consistency, voice clone signatures, splicing boundaries, and encoding artefacts to detect AI-generated or manipulated audio.",
  "what is narrativeguard": "**NarrativeGuard™** is the news and misinformation detection module. It evaluates text for AI writing patterns (perplexity, burstiness, vocabulary entropy), cross-references claims against verified sources, and detects synthetic news generation.",
  "what is sentinelcore": "**SentinelCore™** is the real-time threat classification engine. It provides continuous monitoring for broadcast and live-stream environments, flagging suspicious content as it appears.",
  "what is dalxicmind": "**DalxicMind™** is Dalxic AI's core forensic intelligence engine. Built on the proprietary Nexus-7 architecture, it orchestrates all detection modules (ChromaVeil™, KineticScan™, SonicTrace™, NarrativeGuard™, SentinelCore™) and generates ForensIQ™ certified reports. It analyses media across 8 forensic dimensions with 98.9% detection accuracy.",
  "what is nexus 7": "**Nexus-7** is DalxicMind's proprietary engine architecture. It powers all forensic analysis — trained on 2.4 billion+ samples across images, videos, audio, text, and news content. Nexus-7 is the core intelligence behind every Dalxic AI scan.",
}

// Fuzzy match against cache keys
export function getCachedResponse(text) {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
  const words = lower.split(/\s+/).filter(w => w.length > 2)

  for (const [key, response] of Object.entries(KNOWLEDGE)) {
    const keyWords = key.split(/\s+/)
    const matchCount = keyWords.filter(kw => words.some(w => w.includes(kw) || kw.includes(w))).length
    if (matchCount >= keyWords.length * 0.6 && matchCount >= 1) {
      return response
    }
  }
  return null
}
