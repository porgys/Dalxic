"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useScanStore } from "../../lib/scanStore"
import PlatformHeader from "../components/PlatformHeader"
import { P, VIOLET, VIOLET_GLOW } from "../../lib/tokens"
import AmbientBg from "../components/AmbientBg"
import ConfRing from "../components/ConfRing"

// ── Dalxic colour palette (unified P) ─────────────────────────────────────

// ── Current date for prompt context ───────────────────────────────────────
function todayStr() {
  const d = new Date()
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

// ── Prompt builders ────────────────────────────────────────────────────────

function buildImagePrompt(intel) {
  let desc = "You are DalxicMind™, an elite AI forensic analyst. Today\'s date is " + todayStr() + ".\n\n"
  desc += "Forensic intelligence extracted from image file (raw file not transmitted):\n"
  desc += "Filename: " + intel.filename + "\n"
  desc += "File Size: " + intel.fileSize + "\n"
  desc += "MIME Type: " + (intel.mimeType || "unknown") + "\n"
  if (intel.dimensions)        desc += "Image Size: " + intel.dimensions + "\n"
  if (intel.aspectRatio)       desc += "Aspect Ratio: " + intel.aspectRatio + "\n"
  if (intel.noiseEstimate)     desc += "Pixel Noise Estimate: " + intel.noiseEstimate + "\n"
  if (intel.edgeDensity)       desc += "Edge Density (Sobel): " + intel.edgeDensity + "\n"
  if (intel.luminanceStdDev)   desc += "Luminance StdDev: " + intel.luminanceStdDev + "\n"
  if (intel.luminanceMean)     desc += "Luminance Mean: " + intel.luminanceMean + "\n"
  if (intel.rDuplicateBuckets) desc += "R Histogram Bucket Duplicates: " + intel.rDuplicateBuckets + "\n"
  if (intel.gDuplicateBuckets) desc += "G Histogram Bucket Duplicates: " + intel.gDuplicateBuckets + "\n"
  if (intel.bDuplicateBuckets) desc += "B Histogram Bucket Duplicates: " + intel.bDuplicateBuckets + "\n"
  if (intel.colorHistogram) {
    desc += "Colour Histogram R: [" + intel.colorHistogram.r.join(",") + "]\n"
    desc += "Colour Histogram G: [" + intel.colorHistogram.g.join(",") + "]\n"
    desc += "Colour Histogram B: [" + intel.colorHistogram.b.join(",") + "]\n"
  }

  desc += "\nFEATURE HIERARCHY (weight accordingly):\n"
  desc += "Primary (most discriminative): Pixel Noise, Edge Density — these survive JPEG compression and directly reflect sensor vs generator origin\n"
  desc += "Secondary: Luminance StdDev, Histogram Bucket Duplicates — affected by scene content but diagnostic in combination\n"
  desc += "Tertiary: Dimensions, Aspect Ratio — suggestive but not conclusive alone\n\n"
  desc += "INTERPRETATION THRESHOLDS — apply precisely:\n"
  desc += "- Pixel Noise below 3: strong AI indicator (GAN/diffusion pixel synthesis)\n"
  desc += "- Pixel Noise 3-8: BORDERLINE — this range includes both heavily processed real photos (stock retouching, portrait smoothing, HDR) AND AI. Do NOT use noise alone in this range — require a second trigger.\n"
  desc += "- Pixel Noise 8-25: normal camera sensor noise range — lean AUTHENTIC\n"
  desc += "- Edge Density below 6: AI indicator (upsampling/diffusion smooth gradients)\n"
  desc += "- Edge Density 6-10: borderline — soft focus or AI\n"
  desc += "- Edge Density 10+: normal photographic range — lean AUTHENTIC\n"
  desc += "- Luminance StdDev below 20: flat uniform AI lighting\n"
  desc += "- Luminance StdDev 35+: natural lighting variation — lean AUTHENTIC\n"
  desc += "- Histogram Bucket Duplicates above 40%: synthetic colour uniformity\n"
  desc += "- Exact AI generator sizes (512x512, 768x512, 1024x1024, 1024x1792): supporting indicator\n"
  desc += "- COMPOSITE: Noise <3 + Edge <6 = strong AI fingerprint\n"
  desc += "- COMPOSITE: Noise 3-8 + Edge 10+ + Luminance 35+ = likely real photo (stock/processed)\n"
  desc += "- COMPOSITE: Noise 8+ + Edge 10+ = consistent with real camera capture\n"
  desc += "- IMPORTANT: JPEG compression AND stock photo retouching can reduce noise to 2-5 range. A noise value of 2-5 alone is NOT sufficient for AI_DETECTED — you MUST have edge density or luminance confirmation.\n"
  desc += "- RULE: Need TWO independent PRIMARY triggers for AI_DETECTED. One alone = AUTHENTIC or borderline.\n\n"

  desc += "Return ONLY a raw JSON object (no markdown, no backticks, no explanation):\n"
  desc += '{"dimensions":[{"dimension":"GAN Fingerprint","score":0},{"dimension":"Pixel Coherence","score":0},{"dimension":"Metadata Integrity","score":0},{"dimension":"Edge Consistency","score":0},{"dimension":"Noise Pattern","score":0},{"dimension":"Compression Artifact","score":0},{"dimension":"Color Distribution","score":0},{"dimension":"Semantic Logic","score":0}],"verdict":"AI_DETECTED or AUTHENTIC","reasoning":"3-4 sentence expert forensic summary citing specific statistics"}\n\n'
  desc += "Scores 0-100 = probability of AI generation. Real photos score 5-35. AI images score 65-95. "
  desc += "VERDICT RULE: overall average > 55 = AI_DETECTED, <= 55 = AUTHENTIC. Be decisive."
  return desc
}

function buildAudioPrompt(stats) {
  const sv   = parseFloat(stats.segmentVariance) || 0
  const dr   = parseFloat(stats.dynamicRange)    || 0
  const ch   = parseInt(stats.channels)          || 1
  // Advanced features
  const zcrV = parseFloat(stats.zcrVariance)     || 0
  const sf   = parseFloat(stats.spectralFlatness)|| 0
  const silF = parseFloat(stats.silenceFloor)    || 0
  const silR = parseFloat(stats.silenceRatio)    || 0
  const silN = parseInt(stats.silenceRegions)    || 0
  const hfR  = parseFloat(stats.hfRatio)         || 0
  const jit  = parseFloat(stats.jitter)          || 0
  const shim = parseFloat(stats.shimmer)         || 0

  const findings = []

  // ── HF Energy Ratio (MOST DISCRIMINATIVE — breath, fricatives, mouth noise) ──
  // Real speech has rich HF from breath/consonants; TTS is spectrally clean
  // After MP3 compression: real ~0.04-0.10+, TTS ~0.01-0.035
  if (hfR < 0.035)       findings.push("HF energy ratio " + hfR + " critically low — TTS lacks natural breath sounds, fricatives and mouth noise that real speech carries even after compression")
  else if (hfR < 0.050)  findings.push("HF energy ratio " + hfR + " below typical — limited breath/fricative energy, possible AI or heavy low-pass filtering")
  else                    findings.push("HF energy ratio " + hfR + " healthy — natural breath sounds and fricative energy present")

  // ── Silence Floor Analysis (STRONG DISCRIMINATOR) ──────────────────
  // Real mic pauses: room tone 0.005-0.02; TTS pauses: near-zero or codec dither 0.001-0.005
  if (silR > 0.02) {
    if (silF < 0.003)
      findings.push("Silence floor " + silF + " very low in pauses — TTS generates clean silence even after codec. Real mics: 0.005-0.02 room tone")
    else if (silF < 0.007)
      findings.push("Silence floor " + silF + " moderate — borderline between clean studio and TTS")
    else
      findings.push("Silence floor " + silF + " shows room tone — consistent with real microphone recording")
  } else if (silR > 0.005) {
    findings.push("Limited silence (" + (silR * 100).toFixed(1) + "%), floor=" + silF + " — fewer pauses to analyse")
  } else {
    findings.push("Minimal silence detected (" + (silR * 100).toFixed(1) + "%) — continuous speech, silence analysis unreliable")
  }

  // ── Jitter & Shimmer (codec-aware thresholds) ─────────────────────
  // MP3/AAC codecs inflate raw jitter/shimmer, so these are supporting not primary
  // Pure WAV: real jitter 0.02-0.08, TTS 0.001-0.01
  // After MP3: real jitter 0.5-1.0+, TTS 0.3-0.6
  if (jit < 0.35)        findings.push("Jitter " + jit + " low even after codec — suggests unnaturally stable pitch (AI indicator)")
  else if (jit < 0.55)   findings.push("Jitter " + jit + " moderate — borderline, codec adds some instability to TTS")
  else                    findings.push("Jitter " + jit + " in natural range for compressed audio")

  if (shim < 0.25)       findings.push("Shimmer " + shim + " low — unnaturally consistent amplitude between cycles")
  else if (shim < 0.40)  findings.push("Shimmer " + shim + " moderate — some variation present")
  else                    findings.push("Shimmer " + shim + " in natural range — real vocal cord variation")

  // ── Spectral Flatness ─────────────────────────────────────────────
  if (sf < 0.15)          findings.push("Spectral flatness " + sf + " very tonal/clean — TTS pure harmonics")
  else if (sf < 0.45)     findings.push("Spectral flatness " + sf + " in normal vocal range")
  else                     findings.push("Spectral flatness " + sf + " high — broadband energy present")

  // ── ZCR Variance (temporal structure) ──────────────────────────────
  if (zcrV < 0.0002)     findings.push("ZCR variance " + zcrV + " extremely uniform — synthetic temporal pattern")
  else if (zcrV < 0.001) findings.push("ZCR variance " + zcrV + " low — limited temporal variation across segments")
  else                    findings.push("ZCR variance " + zcrV + " shows natural temporal variation")

  // ── Dynamic Range (supporting only) ────────────────────────────────
  if (dr < 12)       findings.push("Dynamic range " + dr + "dB very compressed")
  else if (dr < 20)  findings.push("Dynamic range " + dr + "dB compressed — note: mastered audio also compresses, weigh other features higher")
  else               findings.push("Dynamic range " + dr + "dB in normal range")

  // ── HF-to-Silence composite (the killer differentiator) ───────────
  // TTS: low HF + clean silence; Real: higher HF + room tone
  if (hfR < 0.035 && silR > 0.02 && silF < 0.005)
    findings.push("COMPOSITE: Low HF (" + hfR + ") + clean silence (" + silF + ") = strong TTS fingerprint — real speech retains breath energy and room tone even after mastering")
  else if (hfR >= 0.050 && silF >= 0.007)
    findings.push("COMPOSITE: Healthy HF (" + hfR + ") + room tone (" + silF + ") = consistent with real recorded speech")

  // ── Composite AI indicator count ───────────────────────────────────
  const aiCount = findings.filter(function(f) { return f.indexOf("TTS") > -1 || f.indexOf("synthetic") > -1 || f.indexOf("AI") > -1 || f.indexOf("critically low") > -1 || f.indexOf("COMPOSITE: Low") > -1 }).length

  // ── Suggested scores based on calibrated features ──────────────────
  // Spectral Authenticity: HF ratio is the primary driver
  const spectralScore = hfR < 0.035 ? 85 : hfR < 0.050 ? 62 : 18
  // Dynamic Range: legacy, down-weighted
  const dynScore = dr < 12 ? 70 : dr < 16 ? 55 : dr < 20 ? 38 : 18
  // Noise Floor Pattern: silence floor quality
  const noiseScore = (silR > 0.02 && silF < 0.003) ? 88 : (silR > 0.02 && silF < 0.005) ? 68 : (silR > 0.02 && silF < 0.007) ? 50 : (silR > 0.02) ? 15 : 35
  // Transient Behavior: jitter (codec-aware)
  const transScore = jit < 0.35 ? 80 : jit < 0.55 ? 55 : 18
  // Amplitude Variance: shimmer (codec-aware)
  const ampScore = shim < 0.25 ? 80 : shim < 0.40 ? 52 : 18
  // Temporal Consistency: ZCR variance
  const temporalScore = zcrV < 0.0002 ? 80 : zcrV < 0.001 ? 55 : 18
  // Compression Artifact: HF+silence composite replaces pure DR
  const compressScore = (hfR < 0.035 && silR > 0.02 && silF < 0.005) ? 78 : dr < 16 ? 58 : dr < 20 ? 38 : 15
  // Organic Irregularity: composite of HF + silence + jitter
  const organicScore = (hfR < 0.035 && silF < 0.005) ? 90 : (hfR < 0.050 || silF < 0.007) ? 55 : 15

  var prompt = "You are DalxicMind, an expert audio forensics analyst using SonicTrace™. Today\'s date is " + todayStr() + ".\n\n"
  prompt += "AUDIO STATISTICS:\n"
  prompt += "Duration: " + stats.duration + "\n"
  prompt += "Sample Rate: " + stats.sampleRate + "\n"
  prompt += "Channels: " + stats.channels + "\n"
  prompt += "Peak Amplitude: " + stats.peakAmplitude + "\n"
  prompt += "RMS Level: " + stats.rmsLevel + "\n"
  prompt += "Dynamic Range: " + stats.dynamicRange + "\n"
  prompt += "Segment Variance: " + stats.segmentVariance + "\n"
  if (stats.segmentPeaks) prompt += "Segment Peaks: [" + stats.segmentPeaks.join(", ") + "]\n"
  prompt += "\nADVANCED VOICE FORENSICS:\n"
  prompt += "Jitter (pitch micro-instability): " + stats.jitter + "\n"
  prompt += "Shimmer (amplitude micro-variation): " + stats.shimmer + "\n"
  prompt += "Silence Floor RMS: " + stats.silenceFloor + "\n"
  prompt += "Silence Ratio: " + stats.silenceRatio + " (" + silN + " pause regions)\n"
  prompt += "HF Energy Ratio: " + stats.hfRatio + "\n"
  prompt += "Spectral Flatness: " + stats.spectralFlatness + "\n"
  prompt += "ZCR Variance: " + stats.zcrVariance + "\n"
  prompt += "\nIMPORTANT — FEATURE HIERARCHY:\n"
  prompt += "Primary (most discriminative): Jitter, Shimmer, Silence Floor, HF Energy Ratio\n"
  prompt += "Secondary: Spectral Flatness, ZCR Variance\n"
  prompt += "Tertiary (unreliable alone): Dynamic Range, Segment Variance — these are affected by studio mastering/compression and CANNOT distinguish mastered real audio from TTS by themselves.\n"
  prompt += "\nSTATISTICAL FINDINGS:\n"
  findings.forEach(function(f, i) { prompt += (i + 1) + ". " + f + "\n" })
  prompt += "\nSUGGESTED SCORES (adjust +/-10 based on analysis):\n"
  prompt += "Spectral Authenticity: " + spectralScore + "\n"
  prompt += "Dynamic Range: " + dynScore + "\n"
  prompt += "Noise Floor Pattern: " + noiseScore + "\n"
  prompt += "Transient Behavior: " + transScore + "\n"
  prompt += "Amplitude Variance: " + ampScore + "\n"
  prompt += "Temporal Consistency: " + temporalScore + "\n"
  prompt += "Compression Artifact: " + compressScore + "\n"
  prompt += "Organic Irregularity: " + organicScore + "\n"
  prompt += "\nReturn ONLY a raw JSON object (no markdown, no backticks, no code fences):\n"
  prompt += '{"dimensions":[{"dimension":"Spectral Authenticity","score":0},{"dimension":"Dynamic Range","score":0},{"dimension":"Noise Floor Pattern","score":0},{"dimension":"Transient Behavior","score":0},{"dimension":"Amplitude Variance","score":0},{"dimension":"Temporal Consistency","score":0},{"dimension":"Compression Artifact","score":0},{"dimension":"Organic Irregularity","score":0}],"verdict":"AI_DETECTED or AUTHENTIC","reasoning":"3-4 sentence forensic summary citing jitter, shimmer and silence floor values"}\n\n'
  prompt += "VERDICT: average > 55 = AI_DETECTED. "
  prompt += aiCount >= 3 ? "Found " + aiCount + " AI indicators from voice micro-structure — verdict should be AI_DETECTED." : aiCount >= 1 ? "Some AI indicators found — weigh primary features heavily." : "Primary features look organic — lean AUTHENTIC."
  return prompt
}

function buildVideoPrompt(intel, frames) {
  const meta = intel.metadata || intel

  // ── Statistical pre-scoring ──────────────────────────────────────────
  const n1 = parseFloat(meta.firstFrameNoise || intel.noiseEstimateFrame1) || 99
  const n2 = parseFloat(meta.lastFrameNoise  || intel.noiseEstimateFrame2) || 99
  const fd = parseFloat(meta.interFrameDiff  || intel.interFramePixelDiff) || 99
  const fname = (meta.filename || intel.filename || "").toLowerCase()
  const res   = (meta.resolution || intel.resolution || "")

  const statSignals = []

  if (n1 < 99 && n2 < 99) {
    const noiseDelta = Math.abs(n1 - n2)
    if (noiseDelta < 3)
      statSignals.push("Frame noise delta is only " + noiseDelta.toFixed(2) + " between first and last frame — real handheld video varies 5-15 due to camera shake. Suspiciously consistent noise = AI rendering.")
  }

  if (fd < 30 && fd > 0)
    statSignals.push("Inter-frame pixel difference of " + fd + " is low for a speaking subject — natural head movement in real speech produces 30-80. Consistent with locked-camera AI avatar rendering.")

  if (/primary|avatar|take[_-]?\d|synthesia|heygen|veed|descript|_\d+_\d{3,4}p/.test(fname))
    statSignals.push("Filename matches AI avatar export naming conventions — Veed, HeyGen, Synthesia export with avatar name, take number and explicit resolution. Real phone recordings use IMG_ or VID_ with date-timestamp.")

  if (res === "1280x720" || res === "720x1280" || res === "1920x1080" || res === "1080x1920")
    statSignals.push("Resolution " + res + " is an exact AI generator standard output dimension.")

  // ── Build prompt ──────────────────────────────────────────────────────
  let textPrompt = "You are DalxicMind, an expert video forensics analyst specialising in deepfake and AI-generated video detection. Today's date is " + todayStr() + ".\n\n"

  if (frames && frames.length > 0)
    textPrompt += "You are being provided with " + frames.length + " frames extracted at distributed timestamps for visual inspection.\n\n"

  textPrompt += "VIDEO METADATA:\n"
  textPrompt += "Filename: " + (meta.filename || intel.filename || "unknown") + "\n"
  textPrompt += "Duration: " + (meta.duration || intel.duration || "unknown") + "\n"
  textPrompt += "Resolution: " + res + "\n"
  textPrompt += "Aspect Ratio: " + (meta.aspectRatio || intel.aspectRatio || "unknown") + "\n"
  textPrompt += "File Size: " + (meta.fileSize || intel.fileSize || "unknown") + "\n"
  if (n1 < 99) textPrompt += "First Frame Pixel Noise: " + n1 + "\n"
  if (n2 < 99) textPrompt += "Last Frame Pixel Noise: " + n2 + "\n"
  if (fd < 99) textPrompt += "Inter-Frame Pixel Diff: " + fd + "\n"

  if (statSignals.length > 0) {
    textPrompt += "\nSTATISTICAL AND METADATA AI INDICATORS DETECTED:\n"
    statSignals.forEach(function(s, i) { textPrompt += (i+1) + ". " + s + "\n" })
  }

  textPrompt += "\nVISUAL INSPECTION — examine all frames for:\n"
  textPrompt += "DEEPFAKE INDICATORS: face boundary artifacts at hairline/jaw/neck, temporal face jitter between frames, eye anomalies, overly smooth plastic-looking skin missing natural pores, face lighting not matching background, blurry or morphing teeth.\n"
  textPrompt += "AI AVATAR INDICATORS: locked camera with no natural shake, unnaturally consistent head position across all frames, perfectly uniform background with no real-world variation, synthetic skin texture lacking micro-variations.\n"
  textPrompt += "AI-GENERATED VIDEO INDICATORS: impossible physics, objects morphing or flickering, unnatural motion, object impermanence between frames.\n\n"

  textPrompt += "Return ONLY a raw JSON object (no markdown, no backticks):\n"
  textPrompt += '{"dimensions":[{"dimension":"GAN Fingerprint","score":0},{"dimension":"Temporal Consistency","score":0},{"dimension":"Face Coherence","score":0},{"dimension":"Edge Consistency","score":0},{"dimension":"Noise Pattern","score":0},{"dimension":"Lighting Physics","score":0},{"dimension":"Motion Authenticity","score":0},{"dimension":"Background Stability","score":0}],"verdict":"AI_DETECTED or AUTHENTIC","reasoning":"3-4 sentence forensic summary citing specific visual and statistical findings"}\n\n'

  textPrompt += "VERDICT RULE: overall average > 55 = AI_DETECTED, <= 55 = AUTHENTIC.\n"
  textPrompt += "CRITICAL: High-quality AI avatars from Veed, HeyGen, Synthesia and D-ID are designed to look photorealistic and fool visual inspection. When statistical and metadata indicators above suggest AI, weight them heavily alongside visual findings. A video that looks visually authentic BUT has filename patterns and motion statistics matching AI avatar tools SHOULD be scored AI_DETECTED.\n"

  if (statSignals.length >= 2)
    textPrompt += statSignals.length + " AI indicators detected in statistics and metadata. Even if frames look visually authentic, score GAN Fingerprint and Face Coherence 65+ and return AI_DETECTED."
  else if (statSignals.length === 1)
    textPrompt += "1 statistical indicator detected — weigh it alongside your visual findings."
  else
    textPrompt += "No statistical indicators detected — rely purely on visual inspection of the frames."

  if (frames && frames.length > 0) {
    const blocks = []
    frames.forEach(function(f) {
      blocks.push({ type: "text", text: "Frame at " + f.time + " (" + f.position + " through video):" })
      blocks.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.data } })
    })
    blocks.push({ type: "text", text: textPrompt })
    return blocks
  }
  return textPrompt
}

// ── Client-side text forensic extraction ─────────────────────────────────
function extractTextIntelligence(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const sentenceCount = sentences.length

  if (wordCount < 20 || sentenceCount < 3) return null // too short for meaningful stats

  // Sentence length stats (burstiness proxy)
  const sentLens = sentences.map(s => s.split(/\s+/).length)
  const avgSentLen = sentLens.reduce((a, b) => a + b, 0) / sentLens.length
  const sentLenVariance = sentLens.reduce((a, b) => a + Math.pow(b - avgSentLen, 2), 0) / sentLens.length
  const sentLenStdDev = Math.sqrt(sentLenVariance)
  // Burstiness coefficient: stddev / mean. Human ~0.5-1.0+, AI ~0.2-0.4
  const burstiness = avgSentLen > 0 ? sentLenStdDev / avgSentLen : 0

  // Vocabulary richness — Type-Token Ratio
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z'-]/g, "")).filter(w => w.length > 0)
  const uniqueWords = new Set(lowerWords)
  const ttr = lowerWords.length > 0 ? uniqueWords.size / lowerWords.length : 0
  // Hapax legomena ratio (words appearing exactly once)
  const wordFreq = {}
  lowerWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1 })
  const hapax = Object.values(wordFreq).filter(f => f === 1).length
  const hapaxRatio = uniqueWords.size > 0 ? hapax / uniqueWords.size : 0

  // Hedging phrase detection (LLM fingerprints)
  const hedgingPatterns = [
    "it's important to note", "it is important to note", "it's worth noting",
    "it is worth noting", "it's worth mentioning", "it is worth mentioning",
    "it should be noted", "in conclusion", "in summary",
    "no discussion would be complete", "it's crucial to",
    "this is a significant", "this is particularly", "this is especially",
    "it's essential to", "it is essential to", "plays a crucial role",
    "serves as a testament", "it's fascinating", "a testament to",
    "dive into", "delve into", "tapestry of", "landscape of",
    "in the realm of", "at the end of the day", "navigating the",
    "moreover", "furthermore", "additionally", "consequently",
    "in today's world", "in this day and age", "as we navigate",
  ]
  const lowerText = text.toLowerCase()
  const hedgeCount = hedgingPatterns.filter(p => lowerText.includes(p)).length
  const hedgeDensity = hedgeCount / Math.max(1, sentenceCount)

  // Paragraph length uniformity
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20)
  let paraLenStdDev = 0
  if (paragraphs.length >= 2) {
    const paraLens = paragraphs.map(p => p.split(/\s+/).length)
    const avgParaLen = paraLens.reduce((a, b) => a + b, 0) / paraLens.length
    paraLenStdDev = Math.sqrt(paraLens.reduce((a, b) => a + Math.pow(b - avgParaLen, 2), 0) / paraLens.length)
  }

  // Sentence opener diversity (AI tends to repeat "The", "This", "It" etc.)
  const openers = sentences.map(s => (s.split(/\s+/)[0] || "").toLowerCase())
  const uniqueOpeners = new Set(openers)
  const openerDiversity = openers.length > 0 ? uniqueOpeners.size / openers.length : 1

  // Source specificity (names, dates, locations, numbers — real journalism has these)
  const specificityPatterns = [
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/gi,
    /\b(Mr|Mrs|Ms|Dr|Prof|Cllr|Sen|Rep)\.\s+[A-Z][a-z]+/g,
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+said|\s+told|\s+announced|\s+stated)/g,
    /\b\d{1,3}(?:,\d{3})+\b/g,
    /\b\d+\.?\d*%\b/g,
    /\b(?:GMT|EST|PST|UTC|BST)\b/g,
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
    /\bquoting\s+reference\b/gi,
    /\b(?:£|€|\$)\s?\d+/g,
  ]
  let specificityHits = 0
  specificityPatterns.forEach(p => { const m = text.match(p); if (m) specificityHits += m.length })

  // Transition word density (AI overuses: moreover, furthermore, additionally, consequently)
  const transitionWords = ["moreover", "furthermore", "additionally", "consequently", "nevertheless", "subsequently", "henceforth"]
  const transitionCount = transitionWords.filter(w => lowerText.includes(w)).length

  return {
    wordCount, sentenceCount,
    avgSentLen: avgSentLen.toFixed(1),
    sentLenStdDev: sentLenStdDev.toFixed(2),
    burstiness: burstiness.toFixed(3),
    ttr: ttr.toFixed(3),
    hapaxRatio: hapaxRatio.toFixed(3),
    hedgeCount,
    hedgeDensity: hedgeDensity.toFixed(3),
    paraLenStdDev: paraLenStdDev.toFixed(1),
    openerDiversity: openerDiversity.toFixed(3),
    paragraphCount: paragraphs.length,
    specificityHits,
    transitionCount,
  }
}

function buildTextPrompt(text, type) {
  const configs = {
    text: {
      intro: "You are DalxicMind™ with NarrativeGuard™ AI text detection.",
      instruction: "Analyse this text for signs of AI generation (ChatGPT, Claude, Gemini, LLaMA etc). Use the pre-computed forensic statistics below as PRIMARY evidence, then corroborate with your own linguistic analysis of the content.",
      dims: "Perplexity Analysis, Burstiness Pattern, Vocabulary Distribution, Sentence Uniformity, Stylistic Consistency, Cliche Density, Hedging Language, Semantic Predictability"
    },
    news: {
      intro: "You are DalxicMind™ with NarrativeGuard™ misinformation forensics.",
      instruction: "Analyse this news article for misinformation, disinformation and AI generation.\n\nCRITICAL NEWS-SPECIFIC RULES:\n- Low burstiness (0.15-0.40) is NORMAL for journalism — news articles use deliberate, uniform sentence structure by editorial convention. Do NOT treat low burstiness as an AI indicator for news.\n- Wire-service style (Reuters, AP, AFP, BBC, Bloomberg, FT) is professional convention, NOT an AI indicator.\n- Do NOT penalise temporal distance (old articles are not less credible).\n- PRIMARY AI indicators for NEWS: hedging phrases (3+), vague sourcing ('a leading institution', 'experts suggest'), lack of specific names/dates/locations, excessive transition words (moreover, furthermore, additionally).\n- PRIMARY AUTHENTICITY indicators for NEWS: specific names, dates, locations, reference numbers, direct quotes with attribution, concrete statistics with sources.\n- A news article with specific facts, named sources and zero hedging is almost certainly REAL, regardless of burstiness score.\n- Only flag AI generation if genuine LLM artefacts present: hedging loops, vague sourcing, no specific details.",
      dims: "Source Credibility, Factual Accuracy, Emotional Manipulation, Headline Consistency, Citation Quality, Narrative Bias, AI Generation Markers, Logical Coherence"
    },
    document: {
      intro: "You are DalxicMind™ with DocForensIQ™ document forensics.",
      instruction: "Analyse this document content for signs of AI generation, forgery or manipulation. Use the pre-computed forensic statistics as supporting evidence. Examine structural authenticity, terminology consistency, citation integrity, voice consistency, factual grounding and boilerplate detection.",
      dims: "Structural Authenticity, Terminology Consistency, Formatting Patterns, Citation Integrity, Voice Consistency, Factual Grounding, Boilerplate Detection, Semantic Coherence"
    },
    social: {
      intro: "You are DalxicMind™ with SentinelCore™ social media forensics.",
      instruction: "Analyse this social media content for signs of synthetic personas, bot activity or fake accounts. Use the pre-computed forensic statistics as supporting evidence. Examine profile authenticity, posting patterns, engagement ratios, content originality and identity consistency.",
      dims: "Profile Authenticity, Posting Pattern, Engagement Ratio, Content Originality, Network Behavior, Language Pattern, Temporal Activity, Identity Consistency"
    },
  }
  const cfg = configs[type] || configs.text

  // Extract text forensics client-side
  const intel = extractTextIntelligence(text)
  let statsBlock = ""

  if (intel) {
    const b = parseFloat(intel.burstiness)
    const ttr = parseFloat(intel.ttr)
    const hapax = parseFloat(intel.hapaxRatio)
    const hedge = intel.hedgeCount
    const hd = parseFloat(intel.hedgeDensity)
    const opener = parseFloat(intel.openerDiversity)
    const findings = []

    // Burstiness (MOST DISCRIMINATIVE for text)
    if (b < 0.30)       findings.push("Burstiness " + b + " critically low — AI text has uniform sentence lengths. Human writing: 0.50-1.00+")
    else if (b < 0.45)  findings.push("Burstiness " + b + " below typical — limited sentence length variation")
    else                 findings.push("Burstiness " + b + " in natural human range — organic sentence length variation")

    // Type-Token Ratio
    if (ttr < 0.40)      findings.push("Type-token ratio " + ttr + " low — repetitive vocabulary, AI recycling pattern")
    else if (ttr < 0.55) findings.push("Type-token ratio " + ttr + " moderate — some vocabulary repetition")
    else                  findings.push("Type-token ratio " + ttr + " healthy vocabulary diversity")

    // Hapax ratio
    if (hapax < 0.45)    findings.push("Hapax ratio " + hapax + " low — few unique words, AI tends to reuse vocabulary")
    else                  findings.push("Hapax ratio " + hapax + " normal — healthy unique word distribution")

    // Hedging phrases (LLM fingerprint)
    if (hedge >= 4)       findings.push("Found " + hedge + " LLM hedging phrases — strong AI writing fingerprint")
    else if (hedge >= 2)  findings.push("Found " + hedge + " hedging phrases — moderate AI indicator")
    else                  findings.push("Minimal hedging phrases (" + hedge + ") — no LLM fingerprint")

    // Sentence opener diversity
    if (opener < 0.50)   findings.push("Sentence opener diversity " + opener + " very low — repetitive sentence starts (AI pattern)")
    else if (opener < 0.70) findings.push("Sentence opener diversity " + opener + " moderate")
    else                  findings.push("Sentence opener diversity " + opener + " high — varied sentence construction")

    // News-specific: source specificity and transition words
    const spec = intel.specificityHits || 0
    const trans = intel.transitionCount || 0

    if (type === "news") {
      // For news, specificity and transitions override burstiness
      if (spec >= 5)       findings.push("Source specificity " + spec + " hits — rich in names, dates, locations, stats = strong real journalism signal")
      else if (spec >= 2)  findings.push("Source specificity " + spec + " hits — some concrete details present")
      else                  findings.push("Source specificity " + spec + " — lacks specific names, dates, locations = AI vagueness pattern")

      if (trans >= 3)       findings.push("Transition word count " + trans + " — excessive (moreover, furthermore, additionally) = LLM writing pattern")
      else if (trans >= 1)  findings.push("Transition word count " + trans + " — some formal connectors")
      else                  findings.push("No excessive transition words — natural journalistic flow")

      // News composites
      if (spec >= 4 && hedge <= 1 && trans <= 1)
        findings.push("COMPOSITE (NEWS): High specificity + no hedging + no excessive transitions = authentic journalism regardless of burstiness")
      else if (spec <= 1 && (hedge >= 2 || trans >= 2))
        findings.push("COMPOSITE (NEWS): Low specificity + hedging/transitions = AI-generated news article")
    } else {
      // Text composites (non-news)
      if (b < 0.35 && hedge >= 2 && opener < 0.60)
        findings.push("COMPOSITE: Low burstiness + hedging phrases + repetitive openers = strong LLM generation fingerprint")
      else if (b >= 0.50 && hedge <= 1 && ttr >= 0.50)
        findings.push("COMPOSITE: Natural burstiness + no hedging + rich vocabulary = consistent with human writing")
    }

    statsBlock = "\nPRE-COMPUTED TEXT FORENSICS:\n"
    statsBlock += "Word Count: " + intel.wordCount + "\n"
    statsBlock += "Sentence Count: " + intel.sentenceCount + "\n"
    statsBlock += "Avg Sentence Length: " + intel.avgSentLen + " words\n"
    statsBlock += "Sentence Length StdDev: " + intel.sentLenStdDev + "\n"
    statsBlock += "Burstiness (stddev/mean): " + intel.burstiness + "\n"
    statsBlock += "Type-Token Ratio: " + intel.ttr + "\n"
    statsBlock += "Hapax Ratio: " + intel.hapaxRatio + "\n"
    statsBlock += "Hedging Phrases Found: " + intel.hedgeCount + "\n"
    statsBlock += "Hedging Density: " + intel.hedgeDensity + "\n"
    statsBlock += "Sentence Opener Diversity: " + intel.openerDiversity + "\n"
    statsBlock += "Paragraph Count: " + intel.paragraphCount + "\n"
    statsBlock += "Paragraph StdDev: " + intel.paraLenStdDev + "\n"
    if (type === "news") {
      statsBlock += "Source Specificity Hits: " + spec + "\n"
      statsBlock += "Transition Word Count: " + trans + "\n"
      statsBlock += "\nFEATURE HIERARCHY (NEWS-SPECIFIC):\n"
      statsBlock += "Primary: Source Specificity, Hedging Phrases, Transition Words — these separate real journalism from AI\n"
      statsBlock += "Secondary: Type-Token Ratio, Hapax Ratio\n"
      statsBlock += "IGNORE for news: Burstiness — low burstiness is normal editorial convention\n"
    } else {
      statsBlock += "\nFEATURE HIERARCHY:\n"
      statsBlock += "Primary (most discriminative): Burstiness, Hedging Phrases, Sentence Opener Diversity\n"
      statsBlock += "Secondary: Type-Token Ratio, Hapax Ratio, Paragraph Uniformity\n"
      statsBlock += "Tertiary: Sentence count, word count (length alone is not diagnostic)\n"
    }
    statsBlock += "\nSTATISTICAL FINDINGS:\n"
    findings.forEach(function(f, i) { statsBlock += (i + 1) + ". " + f + "\n" })
    statsBlock += "\n"
  }

  return cfg.intro + " Today\'s date is " + todayStr() + ".\n\n" +
    statsBlock +
    "Content to analyse:\n\n" + text.slice(0, 10000) + "\n\n" +
    cfg.instruction + "\n\n" +
    "Return ONLY a raw JSON object (no markdown, no backticks):\n" +
    '{"dimensions":[' + cfg.dims.split(", ").map(d => '{"dimension":"' + d + '","score":0}').join(",") + '],"verdict":"AI_DETECTED or AUTHENTIC","reasoning":"3-4 sentence expert forensic summary citing specific statistics from the pre-computed analysis"}\n\n' +
    "Scores 0-100 = probability of AI generation/manipulation. VERDICT RULE: overall average > 55 = AI_DETECTED, <= 55 = AUTHENTIC. Be decisive."
}

// ── Main scan page ─────────────────────────────────────────────────────────
export default function ScanPage() {
  const [file,           setFile]           = useState(null)
  const [url,            setUrl]            = useState("")
  const [textInput,      setTextInput]      = useState("")
  const [mode,           setMode]           = useState("upload")
  const [mediaType,      setMediaType]      = useState("image")
  const [analyzing,      setAnalyzing]      = useState(false)
  const [progress,       setProgress]       = useState(0)
  const [step,           setStep]           = useState("")
  const [results,        setResults]        = useState(null)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [view,           setView]           = useState("input") // "input" | "analyzing" | "results"
  const [preview,        setPreview]        = useState(null)
  const [dragging,       setDragging]       = useState(false)
  const [canvasBlocked,  setCanvasBlocked]  = useState(false)
  const [showCanvasModal,setShowCanvasModal] = useState(false)
  const [autoCycle,      setAutoCycle]      = useState(true)
  const [selectedModule, setSelectedModule] = useState(null) // null = show module selector
  const fileRef = useRef(null)
  const cycleRef = useRef(null)

  // ── Auto-select module from URL path (e.g. /workstation/chromaveil) ──
  const pathname = usePathname()
  const didAutoSelect = useRef(false)
  useEffect(() => {
    if (didAutoSelect.current) return
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length >= 2 && segments[0] === "workstation") {
      const moduleKey = segments[1]
      const MODS = [
        { key: "chromaveil",     name: "ChromaVeil™",     role: "IMAGE FORENSICS",    desc: "AI-Generated Image Detection",           mediaType: "image",    defaultMode: "upload", modes: ["upload", "url"],  accent: "#6366F1", icon: "🖼️" },
        { key: "kineticscan",    name: "KineticScan™",    role: "VIDEO FORENSICS",    desc: "Deepfake & Synthetic Video Detection",    mediaType: "video",    defaultMode: "upload", modes: ["upload", "url"],  accent: "#7C3AED", icon: "🎬" },
        { key: "sonictrace",     name: "SonicTrace™",     role: "AUDIO FORENSICS",    desc: "Voice Clone & Synthetic Audio Detection", mediaType: "audio",    defaultMode: "upload", modes: ["upload"],          accent: "#22D3EE", icon: "🎙️" },
        { key: "narrativeguard", name: "NarrativeGuard™", role: "TEXT FORENSICS",     desc: "AI Text & Misinformation Detection",     mediaType: "text",     defaultMode: "text",   modes: ["text", "url"],    accent: "#818CF8", icon: "📝" },
        { key: "newsguard",      name: "NarrativeGuard™", role: "NEWS VERIFICATION",  desc: "Fake News & Misinformation Analysis",    mediaType: "news",     defaultMode: "text",   modes: ["text", "url"],    accent: "#F59E0B", icon: "📰" },
        { key: "docforensiq",    name: "DocForensIQ™",    role: "DOCUMENT FORENSICS", desc: "Contract & Document Authenticity",        mediaType: "document", defaultMode: "upload", modes: ["upload", "text"], accent: "#A78BFA", icon: "📋" },
        { key: "sentinelcore",   name: "SentinelCore™",   role: "REAL-TIME THREAT",   desc: "Live Stream Monitoring & Threat Classification",   mediaType: "stream",   defaultMode: "url",   modes: ["url"],    accent: "#EF4444", icon: "⚡" },
      ]
      const mod = MODS.find(m => m.key === moduleKey)
      if (mod) { selectModule(mod); didAutoSelect.current = true }
    }
  }, [pathname])

  // ── Auto-cycle media type tabs every 3s until user clicks one ─────────
  useEffect(() => {
    if (!autoCycle || view !== "input") { clearInterval(cycleRef.current); return }
    const tabKeys = ["image", "video", "audio", "text", "news", "document", "social"]
    cycleRef.current = setInterval(() => {
      setMediaType(prev => {
        const idx = tabKeys.indexOf(prev)
        const next = tabKeys[(idx + 1) % tabKeys.length]
        const tab = [
          { key: "image", mode: "upload" }, { key: "video", mode: "upload" }, { key: "audio", mode: "upload" },
          { key: "text", mode: "text" }, { key: "news", mode: "text" }, { key: "document", mode: "upload" }, { key: "social", mode: "text" },
        ].find(t => t.key === next)
        if (tab) setMode(tab.mode)
        return next
      })
    }, 3000)
    return () => clearInterval(cycleRef.current)
  }, [autoCycle, view])

  // ── Canvas detection on mount ──────────────────────────────────────────
  useEffect(() => {
    try {
      const c = document.createElement("canvas")
      c.width = 16; c.height = 16
      const ctx = c.getContext("2d")
      ctx.fillStyle = "rgba(123,45,67,0.9)"
      ctx.fillRect(0, 0, 16, 16)
      const px = ctx.getImageData(0, 0, 1, 1).data
      if (px[0] !== 123 || px[1] !== 45) setCanvasBlocked(true)
    } catch { setCanvasBlocked(true) }
  }, [])

  // ── File handler ───────────────────────────────────────────────────────
  function handleFile(f) {
    if (!f) return
    setFile(f); setResults(null); setResultsVisible(false)
    setPreview(URL.createObjectURL(f))
    const name = (f.name || "").toLowerCase()
    if      (f.type.startsWith("video"))  setMediaType("video")
    else if (f.type.startsWith("audio"))  setMediaType("audio")
    else if (/\.(pdf|doc|docx|txt|rtf)$/.test(name)) setMediaType("document")
    else                                   setMediaType("image")
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  // ── Extraction functions ───────────────────────────────────────────────
  function extractImageIntelligence(imageFile) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas")
            const scale  = Math.min(1, 300 / Math.max(img.width, img.height))
            canvas.width  = Math.round(img.width  * scale)
            canvas.height = Math.round(img.height * scale)
            const ctx = canvas.getContext("2d")
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            const pixels  = ctx.getImageData(0, 0, canvas.width, canvas.height).data
            const totalPx = pixels.length / 4

            const rH = new Array(8).fill(0), gH = new Array(8).fill(0), bH = new Array(8).fill(0)
            for (let i = 0; i < pixels.length; i += 4) {
              rH[Math.floor(pixels[i]   / 32)]++
              gH[Math.floor(pixels[i+1] / 32)]++
              bH[Math.floor(pixels[i+2] / 32)]++
            }
            const norm = h => h.map(v => (v / totalPx * 100).toFixed(1) + "%")

            const diffs = []
            for (let i = 0; i < Math.min(pixels.length - 4, 40000); i += 16)
              diffs.push(Math.abs(pixels[i] - pixels[i + 4]))
            const noiseEst = diffs.reduce((a, b) => a + b, 0) / diffs.length

            const checkDupes = h => {
              let d = 0
              for (let i = 0; i < h.length - 1; i++)
                if (Math.abs(h[i] - h[i+1]) < totalPx * 0.005) d++
              return (d / (h.length - 1) * 100).toFixed(1)
            }

            let edgeSum = 0, edgeSamples = 0
            const stride = canvas.width * 4
            for (let y = 1; y < canvas.height - 1; y++) {
              for (let x = 4; x < stride - 4; x += 16) {
                const idx = y * stride + x
                edgeSum += Math.abs(pixels[idx + 4] - pixels[idx - 4]) + Math.abs(pixels[idx + stride] - pixels[idx - stride])
                edgeSamples++
              }
            }

            let lumSum = 0, lumSq = 0
            for (let i = 0; i < pixels.length; i += 4) {
              const lum = 0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2]
              lumSum += lum; lumSq += lum * lum
            }
            const lumMean = lumSum / totalPx
            const lumStd  = Math.sqrt(lumSq / totalPx - lumMean * lumMean).toFixed(2)

            resolve({
              filename: imageFile.name,
              fileSize: (imageFile.size / 1024).toFixed(1) + "KB",
              mimeType: imageFile.type,
              dimensions: img.width + "x" + img.height + "px",
              aspectRatio: (img.width / img.height).toFixed(2),
              colorHistogram: { r: norm(rH), g: norm(gH), b: norm(bH) },
              noiseEstimate: noiseEst.toFixed(2),
              rDuplicateBuckets: checkDupes(rH) + "%",
              gDuplicateBuckets: checkDupes(gH) + "%",
              bDuplicateBuckets: checkDupes(bH) + "%",
              edgeDensity: edgeSamples > 0 ? (edgeSum / edgeSamples).toFixed(2) : "0",
              luminanceStdDev: lumStd,
              luminanceMean: lumMean.toFixed(1),
            })
          } catch {
            resolve({ filename: imageFile.name, fileSize: (imageFile.size / 1024).toFixed(1) + "KB", mimeType: imageFile.type, error: "Canvas extraction failed" })
          }
        }
        img.onerror = () => resolve({ filename: imageFile.name, fileSize: (imageFile.size / 1024).toFixed(1) + "KB", error: "Image load failed" })
        img.src = e.target.result
      }
      reader.readAsDataURL(imageFile.size > 10 * 1024 * 1024 ? imageFile.slice(0, 10 * 1024 * 1024) : imageFile)
    })
  }

  function extractVideoIntelligence(videoFile) {
    return new Promise(resolve => {
      const objUrl = URL.createObjectURL(videoFile)
      const video  = document.createElement("video")
      video.preload = "metadata"; video.muted = true; video.src = objUrl

      video.onloadedmetadata = () => {
        const dur = video.duration, vw = video.videoWidth, vh = video.videoHeight
        video.currentTime = Math.min(dur * 0.1, 5)
        video.onseeked = () => {
          try {
            const canvas = document.createElement("canvas")
            const scale  = Math.min(1, 300 / Math.max(vw, vh))
            canvas.width = Math.round(vw * scale); canvas.height = Math.round(vh * scale)
            const ctx = canvas.getContext("2d")
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const data1 = ctx.getImageData(0, 0, canvas.width, canvas.height).data
            const diffs1 = []
            for (let i = 0; i < Math.min(data1.length - 4, 40000); i += 16)
              diffs1.push(Math.abs(data1[i] - data1[i + 4]))
            const noise1 = diffs1.reduce((a, b) => a + b, 0) / diffs1.length

            video.currentTime = dur * 0.5
            video.onseeked = () => {
              try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const data2 = ctx.getImageData(0, 0, canvas.width, canvas.height).data
                const diffs2 = []
                for (let i = 0; i < Math.min(data2.length - 4, 40000); i += 16)
                  diffs2.push(Math.abs(data2[i] - data2[i + 4]))
                const noise2 = diffs2.reduce((a, b) => a + b, 0) / diffs2.length

                let fd = 0, samples = 0
                for (let i = 0; i < Math.min(data1.length, data2.length); i += 16) {
                  fd += Math.abs(data1[i] - data2[i]); samples++
                }
                URL.revokeObjectURL(objUrl)
                resolve({ filename: videoFile.name, fileSize: (videoFile.size / 1024 / 1024).toFixed(1) + "MB", duration: dur.toFixed(1) + "s", resolution: vw + "x" + vh, aspectRatio: (vw / vh).toFixed(2), noiseEstimateFrame1: noise1.toFixed(2), noiseEstimateFrame2: noise2.toFixed(2), interFramePixelDiff: samples > 0 ? (fd / samples).toFixed(2) : "0" })
              } catch { URL.revokeObjectURL(objUrl); resolve({ filename: videoFile.name, duration: dur.toFixed(1) + "s", resolution: vw + "x" + vh }) }
            }
          } catch { URL.revokeObjectURL(objUrl); resolve({ filename: videoFile.name }) }
        }
      }
      video.onerror = () => { URL.revokeObjectURL(objUrl); resolve({ filename: videoFile.name, error: "Video load failed" }) }
      setTimeout(() => { URL.revokeObjectURL(objUrl); resolve({ filename: videoFile.name, note: "Timeout" }) }, 15000)
    })
  }

  // ── Extract 12 frames from video for deepfake visual analysis ─────────
  async function extractVideoFrames(videoFile) {
    return new Promise((resolve, reject) => {
      const video   = document.createElement("video")
      const objUrl  = URL.createObjectURL(videoFile)
      video.src     = objUrl; video.muted = true; video.playsInline = true

      video.onloadedmetadata = () => {
        const dur = video.duration, vw = video.videoWidth, vh = video.videoHeight
        const metadata = {
          filename: videoFile.name, fileSize: (videoFile.size/1024/1024).toFixed(1)+"MB",
          duration: dur.toFixed(1)+"s", resolution: vw+"x"+vh, aspectRatio: (vw/vh).toFixed(2),
        }
        const positions = [0.03,0.10,0.18,0.26,0.34,0.42,0.50,0.58,0.66,0.74,0.82,0.93]
        const times = positions.map(p => Math.max(0.1, p * dur))
        const frames = []; let idx = 0; let pixelDataFirst = null

        function analyzePixels(ctx, w, h) {
          const px = ctx.getImageData(0,0,w,h).data
          const diffs = []
          for (let i = 0; i < Math.min(px.length-4, 40000); i += 16) diffs.push(Math.abs(px[i]-px[i+4]))
          const noise = diffs.length ? (diffs.reduce((a,b)=>a+b,0)/diffs.length).toFixed(2) : "0"
          return { noise, rawPixels: px }
        }

        const captureNext = () => {
          if (idx >= times.length) { URL.revokeObjectURL(objUrl); resolve({ frames, metadata }); return }
          video.currentTime = times[idx]
        }

        video.onseeked = () => {
          const canvas = document.createElement("canvas")
          canvas.width = Math.min(vw, 640); canvas.height = Math.round(canvas.width * vh / vw)
          const ctx = canvas.getContext("2d")
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          if (idx === 0 || idx === times.length - 1) {
            const stats = analyzePixels(ctx, canvas.width, canvas.height)
            if (idx === 0) { metadata.firstFrameNoise = stats.noise; pixelDataFirst = stats.rawPixels }
            else {
              metadata.lastFrameNoise = stats.noise
              if (pixelDataFirst) {
                let diff = 0, samples = 0
                for (let i = 0; i < Math.min(pixelDataFirst.length, stats.rawPixels.length); i += 16) {
                  diff += Math.abs(pixelDataFirst[i]-stats.rawPixels[i]); samples++
                }
                metadata.interFrameDiff = samples > 0 ? (diff/samples).toFixed(2) : "0"
              }
            }
          }

          canvas.toBlob(blob => {
            if (!blob) { idx++; captureNext(); return }
            const reader = new FileReader()
            reader.onload = () => {
              frames.push({ time: times[idx].toFixed(1)+"s", position: Math.round(positions[idx]*100)+"%", data: reader.result.split(",")[1] })
              idx++; captureNext()
            }
            reader.readAsDataURL(blob)
          }, "image/jpeg", 0.80)
        }

        video.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("Video load error")) }
        captureNext()
      }
      video.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("Video load error")) }
      video.load()
    })
  }

  async function generateAudioWaveform(audioFile) {
    const arrayBuffer = await audioFile.arrayBuffer()
    const AudioCtxCls = window.AudioContext || window.webkitAudioContext
    if (!AudioCtxCls) throw new Error("Web Audio API not available")
    const audioCtx   = new AudioCtxCls()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate  = audioBuffer.sampleRate
    const duration    = audioBuffer.duration

    const W = 900, H = 300
    const canvas = document.createElement("canvas")
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#03050F"; ctx.fillRect(0, 0, W, H)

    const sampleStep = Math.max(1, Math.ceil(channelData.length / W))
    const centerY    = H / 2
    const SEGMENTS   = 16
    let peakAmp = 0, sumSq = 0
    const segPeaks = Array(SEGMENTS).fill(0)

    ctx.beginPath(); ctx.strokeStyle = "#A78BFA"; ctx.lineWidth = 1.5
    for (let x = 0; x < W; x++) {
      let mn = 1, mx = -1
      for (let s = 0; s < sampleStep; s++) {
        const i = x * sampleStep + s
        if (i >= channelData.length) break
        const v = channelData[i]
        if (v < mn) mn = v; if (v > mx) mx = v
        const av = Math.abs(v)
        if (av > peakAmp) peakAmp = av
        sumSq += v * v
      }
      const si = Math.min(Math.floor((x / W) * SEGMENTS), SEGMENTS - 1)
      if (mx > segPeaks[si]) segPeaks[si] = mx
      const y1 = centerY + mn * centerY * 0.88
      const y2 = centerY + mx * centerY * 0.88
      if (x === 0) ctx.moveTo(x, y1); else ctx.lineTo(x, y1)
      ctx.lineTo(x, y2)
    }
    ctx.stroke()

    ctx.beginPath(); ctx.strokeStyle = "rgba(99,102,241,0.2)"; ctx.lineWidth = 0.5
    ctx.moveTo(0, centerY); ctx.lineTo(W, centerY); ctx.stroke()

    for (let i = 1; i < SEGMENTS; i++) {
      const x = (i / SEGMENTS) * W
      ctx.beginPath(); ctx.strokeStyle = "rgba(26,34,64,0.7)"; ctx.lineWidth = 0.5
      ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }

    await audioCtx.close()

    const rms          = Math.sqrt(sumSq / channelData.length)
    const dynamicRange = peakAmp > 0 ? (20 * Math.log10(peakAmp / (rms + 1e-10))).toFixed(1) : "0"
    const avgSeg       = segPeaks.reduce((a, b) => a + b, 0) / SEGMENTS
    const segVariance  = (segPeaks.reduce((a, b) => a + Math.pow(b - avgSeg, 2), 0) / SEGMENTS).toFixed(6)
    const waveformBlob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.88))

    // ── Advanced forensic features (computed from raw samples) ──────────
    const totalSamples = channelData.length

    // 1. Zero-Crossing Rate per segment + variance
    const segZCR = []
    const segSize = Math.floor(totalSamples / SEGMENTS)
    for (let si = 0; si < SEGMENTS; si++) {
      let crossings = 0
      const start = si * segSize, end = start + segSize
      for (let i = start + 1; i < end; i++) {
        if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) crossings++
      }
      segZCR.push(crossings / segSize)
    }
    const avgZCR = segZCR.reduce((a, b) => a + b, 0) / SEGMENTS
    const zcrVariance = segZCR.reduce((a, b) => a + Math.pow(b - avgZCR, 2), 0) / SEGMENTS

    // 2. Spectral flatness (geometric mean / arithmetic mean of |FFT|)
    //    Use 2048-sample windows, average across file
    const fftSize = 2048
    let sfSum = 0, sfCount = 0
    const step = Math.max(1, Math.floor(totalSamples / (fftSize * 20))) // ~20 windows
    for (let wi = 0; wi < totalSamples - fftSize; wi += fftSize * step) {
      let logSum = 0, linSum = 0, bins = 0
      for (let i = 0; i < fftSize; i++) {
        const mag = Math.abs(channelData[wi + i])
        if (mag > 1e-10) { logSum += Math.log(mag); linSum += mag; bins++ }
      }
      if (bins > 0 && linSum > 0) {
        const geoMean = Math.exp(logSum / bins)
        const ariMean = linSum / bins
        sfSum += geoMean / ariMean
        sfCount++
      }
    }
    const spectralFlatness = sfCount > 0 ? sfSum / sfCount : 0

    // 3. Silence analysis — detect pauses and measure their noise floor
    const silenceThreshold = 0.01
    let silentSamples = 0, silentEnergy = 0, silenceRegions = 0, inSilence = false
    const minSilenceLen = Math.round(sampleRate * 0.05) // 50ms minimum
    let silRun = 0
    for (let i = 0; i < totalSamples; i++) {
      if (Math.abs(channelData[i]) < silenceThreshold) {
        silRun++
        silentEnergy += channelData[i] * channelData[i]
        if (!inSilence && silRun >= minSilenceLen) { inSilence = true; silenceRegions++ }
      } else {
        if (inSilence) silentSamples += silRun
        silRun = 0; inSilence = false
      }
    }
    if (inSilence) silentSamples += silRun
    const silenceRatio = silentSamples / totalSamples
    const silenceFloor = silentSamples > 0 ? Math.sqrt(silentEnergy / silentSamples) : 0
    // Dead silence (floor < 0.0001) = TTS indicator; room tone (0.001-0.01) = real recording

    // 4. High-frequency energy ratio (breath sounds, fricatives live here)
    //    Compare energy above sampleRate/4 vs total
    let hfEnergy = 0, totalEnergy = 0
    const hfStep = Math.max(4, Math.floor(totalSamples / 100000))
    for (let i = 1; i < totalSamples - 1; i += hfStep) {
      const sample = channelData[i]
      const hfProxy = Math.abs(channelData[i] - channelData[i - 1]) // first-order difference ≈ high-pass
      totalEnergy += sample * sample
      hfEnergy += hfProxy * hfProxy
    }
    const hfRatio = totalEnergy > 0 ? hfEnergy / totalEnergy : 0

    // 5. Micro-jitter (pitch instability estimate via zero-crossing intervals)
    const zcIntervals = []
    let lastCross = -1
    const jitterSamples = Math.min(totalSamples, sampleRate * 5) // first 5s
    for (let i = 1; i < jitterSamples; i++) {
      if ((channelData[i] >= 0 && channelData[i - 1] < 0)) {
        if (lastCross > 0) zcIntervals.push(i - lastCross)
        lastCross = i
      }
    }
    let jitter = 0
    if (zcIntervals.length > 2) {
      let jitterSum = 0
      for (let i = 1; i < zcIntervals.length; i++) jitterSum += Math.abs(zcIntervals[i] - zcIntervals[i - 1])
      const avgInterval = zcIntervals.reduce((a, b) => a + b, 0) / zcIntervals.length
      jitter = avgInterval > 0 ? (jitterSum / (zcIntervals.length - 1)) / avgInterval : 0
    }

    // 6. Shimmer (amplitude micro-variation between consecutive cycles)
    let shimmer = 0
    if (zcIntervals.length > 2) {
      const cyclePeaks = []
      let pos = 0
      for (let ci = 0; ci < Math.min(zcIntervals.length, 500); ci++) {
        let pk = 0
        for (let j = pos; j < pos + zcIntervals[ci] && j < totalSamples; j++) {
          if (Math.abs(channelData[j]) > pk) pk = Math.abs(channelData[j])
        }
        cyclePeaks.push(pk)
        pos += zcIntervals[ci]
      }
      if (cyclePeaks.length > 1) {
        let shimSum = 0
        for (let i = 1; i < cyclePeaks.length; i++) shimSum += Math.abs(cyclePeaks[i] - cyclePeaks[i - 1])
        const avgPeak = cyclePeaks.reduce((a, b) => a + b, 0) / cyclePeaks.length
        shimmer = avgPeak > 0 ? (shimSum / (cyclePeaks.length - 1)) / avgPeak : 0
      }
    }

    return {
      waveformBlob,
      stats: {
        duration:          duration.toFixed(2) + "s",
        sampleRate:        sampleRate + " Hz",
        channels:          audioBuffer.numberOfChannels,
        peakAmplitude:     peakAmp.toFixed(4),
        rmsLevel:          rms.toFixed(4),
        dynamicRange:      dynamicRange + " dB",
        segmentVariance:   segVariance,
        segmentPeaks:      segPeaks.map(p => p.toFixed(3)),
        // Advanced forensic features
        zcrVariance:       zcrVariance.toFixed(6),
        spectralFlatness:  spectralFlatness.toFixed(4),
        silenceFloor:      silenceFloor.toFixed(6),
        silenceRatio:      silenceRatio.toFixed(4),
        silenceRegions:    silenceRegions,
        hfRatio:           hfRatio.toFixed(4),
        jitter:            jitter.toFixed(4),
        shimmer:           shimmer.toFixed(4),
      }
    }
  }

  // ── Main analyze function ──────────────────────────────────────────────
  async function analyze() {
    if (!file && !url && !textInput.trim()) return
    if (canvasBlocked && file && (mediaType === "image" || mediaType === "video")) {
      setShowCanvasModal(true); return
    }

    setAnalyzing(true); setProgress(0); setResults(null); setResultsVisible(false)
    setView("analyzing")
    setStep("Initialising Nexus-7 Engine…")

    const iv = setInterval(() => {
      setProgress(p => {
        const next = p + Math.random() * 9
        if (next >= 88) { clearInterval(iv); return 88 }
        return next
      })
    }, 350)

    try {
      let messageContent = null

      if (mediaType === "image" && file) {
        setStep("Extracting pixel forensics via ChromaVeil™…")
        try {
          const intel = await extractImageIntelligence(file)
          messageContent = buildImagePrompt(intel)
        } catch(canvasErr) {
          console.error("Canvas extraction error:", canvasErr)
          clearInterval(iv); setCanvasBlocked(true); setShowCanvasModal(true)
          setAnalyzing(false); setProgress(0); return
        }

      } else if (mediaType === "image" && url) {
        messageContent = buildImagePrompt({ filename: url, fileSize: "URL", mimeType: "image/jpeg" })

      } else if (mediaType === "video" && file) {
        setStep("Extracting frames via KineticScan™ — this may take a moment…")
        try {
          const { frames, metadata } = await extractVideoFrames(file)
          messageContent = buildVideoPrompt(metadata, frames)
        } catch(frameErr) {
          // Fallback to simple 2-frame extraction if frames fail
          console.warn("Frame extraction failed, falling back:", frameErr.message)
          const intel = await extractVideoIntelligence(file)
          messageContent = buildVideoPrompt(intel, null)
        }

      } else if (mediaType === "video" && url) {
        messageContent = buildVideoPrompt({ filename: url, duration: "unknown", resolution: "unknown", aspectRatio: "unknown" }, null)

      } else if (mediaType === "audio" && file) {
        setStep("Generating SonicTrace™ waveform analysis…")
        try {
          const audioResult = await generateAudioWaveform(file)
          // buildAudioPrompt is async — returns multimodal array or string
          messageContent = buildAudioPrompt(audioResult.stats)
        } catch(e) {
          clearInterval(iv); setAnalyzing(false); setProgress(0)
          setStep("Audio processing failed: " + e.message); return
        }

      } else if (mediaType === "stream") {
        setStep("Initialising SentinelCore™ stream monitor…")
        var streamUrl = url.trim()
        if (!streamUrl) {
          clearInterval(iv); setAnalyzing(false); setStep("Please paste a stream URL to monitor."); return
        }
        setStep("Connecting to live stream…")
        // Fetch stream metadata via URL fetch
        var streamContent = "Live stream URL: " + streamUrl
        try {
          const fetchRes = await fetch("/api/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: streamUrl })
          })
          const fetchData = await fetchRes.json()
          if (fetchData.content) streamContent += "\n\nStream page content:\n" + fetchData.content.slice(0, 3000)
        } catch(e) { /* continue with URL only */ }
        setStep("Running threat classification…")
        messageContent = "You are DalxicMind™, an elite real-time threat analyst using SentinelCore™. Today's date is " + todayStr() + ".\n\n"
          + "SENTINELCORE™ LIVE STREAM ANALYSIS\n\n"
          + streamContent + "\n\n"
          + "Analyse this stream source for:\n"
          + "1. Deepfake indicators in any video/audio content\n"
          + "2. Synthetic media injection risk\n"
          + "3. Source credibility and provenance\n"
          + "4. Real-time manipulation indicators\n"
          + "5. Broadcast pipeline integrity\n\n"
          + "Return ONLY a raw JSON object (no markdown, no backticks, no explanation):\n"
          + '{"dimensions":[{"dimension":"Deepfake Indicators","score":0},{"dimension":"Synthetic Injection Risk","score":0},{"dimension":"Source Credibility","score":0},{"dimension":"Manipulation Indicators","score":0},{"dimension":"Broadcast Integrity","score":0},{"dimension":"Temporal Consistency","score":0},{"dimension":"Provenance Chain","score":0},{"dimension":"Content Authenticity","score":0}],"verdict":"AI_DETECTED or AUTHENTIC","reasoning":"3-4 sentence threat assessment citing specific findings"}\n\n'
          + "Scores 0-100 = probability of synthetic/manipulated content. VERDICT RULE: average > 55 = AI_DETECTED, <= 55 = AUTHENTIC."

      } else if (mediaType === "text" || mediaType === "news" || mediaType === "document" || mediaType === "social") {
        setStep("Scanning via " + (mediaType === "document" ? "DocForensIQ™" : "NarrativeGuard™") + "…")
        var textForAnalysis = textInput.trim()
        // Read uploaded document file as text
        if (!textForAnalysis && file && mediaType === "document") {
          setStep("Reading document content…")
          try {
            textForAnalysis = await file.text()
          } catch(readErr) {
            textForAnalysis = "Document file: " + file.name + " (unable to extract text: " + readErr.message + ")"
          }
        }
        if (!textForAnalysis && url.trim()) {
          // Fetch URL content server-side via a simple fetch
          setStep("Fetching content from URL…")
          try {
            const fetchRes = await fetch("/api/fetch-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: url.trim() })
            })
            const fetchData = await fetchRes.json()
            textForAnalysis = fetchData.content || ("URL: " + url.trim() + " — unable to fetch content, please analyse the URL itself for authenticity indicators.")
          } catch(fetchErr) {
            textForAnalysis = "URL: " + url.trim() + " — " + (fetchErr.message || "fetch failed")
          }
        }
        if (!textForAnalysis) {
          clearInterval(iv); setAnalyzing(false); setStep("Please paste text or a URL to analyse."); return
        }
        messageContent = buildTextPrompt(textForAnalysis, mediaType)
      }

      if (!messageContent) {
        clearInterval(iv); setAnalyzing(false)
        setStep("No content to analyze."); return
      }

      // Send to API proxy — same as Chicken AI
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 4000,
          temperature: 0,
          messages:   [{ role: "user", content: messageContent }]
        })
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed")

      const raw   = (data.content && data.content[0] && data.content[0].text) || "{}"
      const clean = raw.replace(/```json|```/g, "").replace(/，/g, ",").replace(/：/g, ":").replace(/｛/g, "{").replace(/｝/g, "}").replace(/"/g, '"').replace(/"/g, '"').trim()

      // Check if engine refused to answer instead of returning JSON
      if (!clean.includes("{")) {
        console.warn("Engine returned non-JSON:", clean.slice(0, 200))
        throw new Error("Model returned a non-JSON response. Please try again.")
      }

      // Extract JSON — try direct parse first, then balanced-brace extraction
      let parsed
      try {
        parsed = JSON.parse(clean)
      } catch {
        // Find the first { and extract balanced JSON from there
        const start = clean.indexOf("{")
        if (start === -1) throw new Error("No JSON found in model response")
        let depth = 0, end = clean.length
        for (let ci = start; ci < clean.length; ci++) {
          if (clean[ci] === "{") depth++
          else if (clean[ci] === "}") { depth--; if (depth === 0) { end = ci + 1; break } }
        }
        let candidate = clean.slice(start, end)
        // If still invalid (truncated), try closing open braces/brackets
        try {
          parsed = JSON.parse(candidate)
        } catch {
          // Truncated JSON — strip trailing incomplete value and close
          candidate = candidate.replace(/,\s*"[^"]*"?\s*:?\s*[^,}]*$/, "")
          // Count unclosed braces/brackets and close them
          let openBraces = 0, openBrackets = 0
          for (const ch of candidate) {
            if (ch === "{") openBraces++; else if (ch === "}") openBraces--
            if (ch === "[") openBrackets++; else if (ch === "]") openBrackets--
          }
          candidate += "]".repeat(Math.max(0, openBrackets)) + "}".repeat(Math.max(0, openBraces))
          parsed = JSON.parse(candidate)
        }
      }

      clearInterval(iv)
      setProgress(100); setStep("ForensIQ™ report complete.")

      // Extract scoring array — "dimensions" is the canonical key enforced by system prompt; "scores" as fallback
      const rawSource = Array.isArray(parsed.dimensions) ? parsed.dimensions : Array.isArray(parsed.scores) ? parsed.scores : []
      const rawDims = rawSource.filter(d => typeof d === "object" && d !== null)
      const dims = rawDims.map(d => ({
        dimension: d.dimension || d.name || "Unknown",
        value:     Math.min(100, Math.max(0, Math.round(d.score ?? d.value ?? 0)))
      }))
      const overall = Math.round(dims.reduce((a, b) => a + b.value, 0) / (dims.length || 1))

      // ── Flagged dimension ratio — hard override ────────────────────────
      // Count how many dimensions scored above the AI threshold (>55).
      // This is the ground truth: if most dimensions are flagged, it's AI.
      const flagged = dims.filter(d => d.value > 55).length
      const total   = dims.length || 1
      const flagRatio = flagged / total

      // ── Scoring zones ──────────────────────────────────────────────────
      // Step 1: Start from the average score
      // Step 2: Override with flagged ratio if it tells a clearer story
      //
      // Flagged ratio rules (these ALWAYS win):
      //   75%+ flagged (6/8+) → AI_DETECTED — the evidence is overwhelming
      //   50-74% flagged (4-5/8) → NEEDS_REVIEW minimum
      //   <50% flagged (0-3/8) → let the average decide
      let zone, displayConfidence, verdict

      if (flagRatio >= 0.75 || overall > 60) {
        // Either 6+ dimensions flagged OR average >60 → AI_DETECTED
        zone = "ai"
        // Use the higher signal: average or flag-weighted score
        const effectiveScore = Math.max(overall, Math.round(flagRatio * 100))
        displayConfidence = Math.min(99.7, +(70 + ((effectiveScore - 60) / 40) * 29.7).toFixed(1))
        verdict = "AI_DETECTED"
      } else if (flagRatio >= 0.50 || overall > 45) {
        // 4-5 dimensions flagged OR average 45-60 → NEEDS_REVIEW
        zone = "review"
        displayConfidence = Math.max(overall, Math.round(flagRatio * 100))
        verdict = "NEEDS_REVIEW"
      } else {
        // Majority of dimensions are clean → AUTHENTIC
        zone = "authentic"
        displayConfidence = Math.round(99 - (overall / 45) * 14)
        verdict = "AUTHENTIC"
      }

      // Engine verdict can only UPGRADE (authentic→review), never downgrade
      const engineVerdict = parsed.verdict || parsed.overall_verdict || parsed.classification || ""
      if (engineVerdict === "AI_DETECTED" && zone === "authentic") {
        zone = "review"; displayConfidence = 55; verdict = "NEEDS_REVIEW"
      }

      const result = {
        verdict,
        zone,
        displayConfidence,
        overall,
        dimensions: dims,
        isAI: zone === "ai",
        reasoning:  parsed.reasoning || parsed.summary || parsed.analysis_summary || parsed.explanation || "",
        filename:   file?.name || url || "Input",
        mediaType,
      }

      // Persist to shared scan store for DalxicMind Chat context
      useScanStore.getState().addScan({
        ...result,
        id: "scan_" + Date.now(),
        confidence: displayConfidence,
        timestamp: new Date().toISOString(),
      })

      setTimeout(() => {
        setResults(result)
        setAnalyzing(false)
        setResultsVisible(true)
        setView("results")
      }, 400)

    } catch(e) {
      clearInterval(iv)
      console.error("Analysis error:", e.message)
      setProgress(0); setAnalyzing(false)
      setStep("Analysis failed: " + (e.message || "please try again"))
      const errResult = {
        verdict: "ERROR", zone: "review", displayConfidence: 0, confidence: 0, overall: 0, dimensions: [],
        isAI: false, reasoning: "Analysis failed. Please try again.",
        filename: file?.name || url || "Input", mediaType,
      }
      setTimeout(() => {
        setResults(errResult)
        setAnalyzing(false)
        setResultsVisible(true)
        setView("results")
      }, 200)
    }
  }

  // ── Verdict helpers ────────────────────────────────────────────────────
  function verdictColor(zone, verdict) {
    if (verdict === "ERROR")   return "#6878AA"
    if (zone === "ai")        return P.re
    if (zone === "review") return P.amber
    return P.gr
  }

  function verdictLabel(zone, verdict) {
    if (verdict === "ERROR")    return "Analysis Error"
    if (zone === "ai")         return "AI Detected"
    if (zone === "review")  return "Human Verification Needed"
    return "Authentic Content Verified"
  }

  function verdictSubLabel(zone, displayConfidence) {
    if (zone === "ai")        return displayConfidence + "% AI Probability"
    if (zone === "review") return displayConfidence + "% — Mixed signals detected, human inspection recommended"
    return displayConfidence + "% Authenticity Confidence"
  }

  // ── Media type tabs ────────────────────────────────────────────────────
  // Each tab defines: default mode + which input modes are available
  const TABS = [
    { key: "image",    label: "Image",          defaultMode: "upload", modes: ["upload", "url"],  accent: "#4338CA" },
    { key: "video",    label: "Video",           defaultMode: "upload", modes: ["upload", "url"],  accent: "#4F46E5" },
    { key: "audio",    label: "Audio",           defaultMode: "upload", modes: ["upload"],          accent: "#6366F1" },
    { key: "text",     label: "AI Text",         defaultMode: "text",   modes: ["text", "url"],    accent: "#7C7CF8" },
    { key: "news",     label: "News & Misinfo",  defaultMode: "text",   modes: ["text", "url"],    accent: "#818CF8" },
    { key: "document", label: "Document",        defaultMode: "upload", modes: ["upload", "text"], accent: "#A78BFA" },
    { key: "social",   label: "Social Media",    defaultMode: "text",   modes: ["text", "url"],    accent: "#C4B5FD" },
  ]

  const currentTab = TABS.find(t => t.key === mediaType) || TABS[0]
  const currentTabIdx = TABS.indexOf(currentTab)
  const availableModes = selectedModule ? selectedModule.modes : currentTab.modes

  // ── Stat card accent palette — shifts with active tab ──
  const ACCENT_POOL = ["#312E81","#3730A3","#4338CA","#4F46E5","#6366F1","#7C7CF8","#818CF8","#A78BFA","#C4B5FD","#DDD6FE"]
  const statAccents = [0, 3, 6, 9].map(offset => ACCENT_POOL[Math.min(offset + currentTabIdx, ACCENT_POOL.length - 1)])

  const isReady = file || url.trim() || textInput.trim()

  // ── Reset to input view ─────────────────────────────────────────────────
  function resetToInput() {
    setResults(null); setResultsVisible(false); setFile(null); setUrl(""); setTextInput("")
    setPreview(null); setProgress(0); setStep(""); setView("input")
  }

  // ── Confidence ring SVG ────────────────────────────────────────────────
  // ── Module selection ────────────────────────────────────────────────────
  function selectModule(mod) {
    setSelectedModule(mod)
    setMediaType(mod.mediaType)
    setMode(mod.defaultMode)
    setAutoCycle(false)
    setFile(null); setUrl(""); setTextInput(""); setPreview(null)
    setResults(null); setResultsVisible(false); setView("input")
    // Update URL to reflect selected module
    window.history.pushState(null, "", "/workstation/" + mod.key)
  }

  function backToSelector() {
    setSelectedModule(null)
    setFile(null); setUrl(""); setTextInput(""); setPreview(null)
    setResults(null); setResultsVisible(false); setView("input")
    window.history.pushState(null, "", "/workstation")
    setProgress(0); setStep(""); setAnalyzing(false)
  }

  const MODULES = [
    { key: "chromaveil",     name: "ChromaVeil™",     role: "IMAGE FORENSICS",    desc: "AI-Generated Image Detection",           mediaType: "image",    defaultMode: "upload", modes: ["upload", "url"],  accent: "#6366F1", icon: "🖼️" },
    { key: "kineticscan",    name: "KineticScan™",    role: "VIDEO FORENSICS",    desc: "Deepfake & Synthetic Video Detection",    mediaType: "video",    defaultMode: "upload", modes: ["upload", "url"],  accent: "#7C3AED", icon: "🎬" },
    { key: "sonictrace",     name: "SonicTrace™",     role: "AUDIO FORENSICS",    desc: "Voice Clone & Synthetic Audio Detection", mediaType: "audio",    defaultMode: "upload", modes: ["upload"],          accent: "#22D3EE", icon: "🎙️" },
    { key: "narrativeguard", name: "NarrativeGuard™", role: "TEXT FORENSICS",     desc: "AI Text & Misinformation Detection",     mediaType: "text",     defaultMode: "text",   modes: ["text", "url"],    accent: "#818CF8", icon: "📝" },
    { key: "newsguard",      name: "NarrativeGuard™", role: "NEWS VERIFICATION",  desc: "Fake News & Misinformation Analysis",    mediaType: "news",     defaultMode: "text",   modes: ["text", "url"],    accent: "#F59E0B", icon: "📰" },
    { key: "docforensiq",    name: "DocForensIQ™",    role: "DOCUMENT FORENSICS", desc: "Contract & Document Authenticity",        mediaType: "document", defaultMode: "upload", modes: ["upload", "text"], accent: "#A78BFA", icon: "📋" },
    { key: "sentinelcore",   name: "SentinelCore™",   role: "REAL-TIME THREAT",   desc: "Live Stream Monitoring & Threat Classification",   mediaType: "stream",   defaultMode: "url",   modes: ["url"],    accent: "#EF4444", icon: "⚡" },
  ]

  // ── Render (colours from shared tokens) ─────────────────────────────────

  // ── Shared page shell (CSS bg, no canvas flash) ─────────────────────────
  const pageStyle = { minHeight: "100vh", background: P.bg, color: P.tx, fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif", position: "relative" }
  const globalCSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1E2E55; border-radius: 2px; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
    @keyframes spin { to { transform: rotate(360deg) } }
    @keyframes barGrow { from { width: 0 } }
    @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
    @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.15) } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.3) } }
    @keyframes orbitSpin { to { transform: rotate(360deg) } }
    @keyframes centerSprout { 0% { width: 0; opacity: 0 } 50% { width: 33%; opacity: 1 } 100% { width: 0; opacity: 0 } }
    .dlx-card { background: ${P.card}; border: 1px solid ${P.border}; border-radius: 16px; position: relative; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
    .dlx-card:hover { border-color: ${P.border2}; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
    .dlx-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 4px; }
    @media (max-width: 767px) {
      .dlx-dims-grid { grid-template-columns: 1fr !important; }
      .dlx-verdict-flex { flex-direction: column; }
    }
  `

  // ── CSS-only ambient background (no flash) ──────────────────────────────
  // ── Shared components (header + ambient bg from master) ──────────────
  const Header = PlatformHeader

  // ── MODULE SELECTOR VIEW ────────────────────────────────────────────────
  if (!selectedModule) {
    return (
      <div style={pageStyle}>
        <style>{globalCSS}</style>
        <AmbientBg />
        <Header />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "100px 32px 80px" }}>

          {/* Nav row — Dashboard (left) + Forensic Projects (right) */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 24, animation: "fadeUp 0.5s ease 0.05s both" }}>
            <a href="/workstation" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", minWidth: 160, borderRadius: 12, background: "linear-gradient(135deg, #6366F1, #7C3AED)", border: "1px solid rgba(124,58,237,0.5)", color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.3px", fontFamily: "'DM Sans', sans-serif", cursor: "default", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
              <span style={{ fontSize: 15 }}>📈</span>
              Workstation
            </a>
            <a href="/reports" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", minWidth: 160, borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818CF8", fontSize: 13, fontWeight: 500, letterSpacing: "0.3px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s ease", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
              <span style={{ fontSize: 15 }}>🗂️</span>
              Reports
            </a>
            <a href="/chat" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", minWidth: 160, borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818CF8", fontSize: 13, fontWeight: 500, letterSpacing: "0.3px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s ease", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
              <span style={{ fontSize: 15 }}>💬</span>
              DalxicChat
            </a>
          </div>

          {/* Title section */}
          <div style={{ textAlign: "center", marginBottom: 44, animation: "fadeUp 0.6s ease 0.1s both" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", margin: "0 auto 18px", border: "2px solid " + VIOLET + "4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: VIOLET, boxShadow: "0 0 14px " + VIOLET_GLOW }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: VIOLET, fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>Select Module</div>
            <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>
              Choose Your{" "}<span style={{ background: "linear-gradient(135deg, #818CF8, #A78BFA, #22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Workstation</span>
            </h1>
            <p style={{ color: "#7B8DB5", maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontSize: 16, fontWeight: 500 }}>
              Each Module Is Purpose-Built For Its Forensic Domain. Select One To Begin Verification.
            </p>
          </div>

          {/* Module grid — first 6 in auto-fit grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {MODULES.filter(m => m.key !== "sentinelcore").map((mod, i) => (
              <div key={mod.key} onClick={() => selectModule(mod)}
                style={{
                  padding: "28px 24px", cursor: "pointer", width: "100%",
                  display: "flex", flexDirection: "column", borderRadius: 16,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid " + mod.accent + "12",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 40px " + mod.accent + "04, inset 0 1px 0 rgba(255,255,255,0.03)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform",
                  transition: "all 0.35s ease",
                  animation: `fadeUp 0.5s ease ${0.1 + i * 0.06}s both`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = mod.accent + "80"
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 16px 48px " + mod.accent + "35, 0 0 80px " + mod.accent + "18, inset 0 1px 0 rgba(255,255,255,0.06)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = mod.accent + "12"
                  e.currentTarget.style.transform = ""
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.3), 0 0 40px " + mod.accent + "04, inset 0 1px 0 rgba(255,255,255,0.03)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.025)"
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 30 }}>{mod.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: mod.accent, fontFamily: "'DM Mono', monospace" }}>{mod.role}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>{mod.name}</h3>
                <p style={{ fontSize: 14.5, fontWeight: 500, color: "#7B8DB5", lineHeight: 1.6, flex: 1 }}>{mod.desc}</p>
                <div style={{ marginTop: 20, height: 2, background: "linear-gradient(90deg, " + mod.accent + "90, " + mod.accent + "30, transparent)", borderRadius: 1 }} />
              </div>
            ))}
          </div>

          {/* SentinelCore — centered wider card, like RedLine in health */}
          {(() => { const mod = MODULES.find(m => m.key === "sentinelcore"); return (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <div onClick={() => selectModule(mod)}
                style={{
                  padding: "28px 36px", cursor: "pointer", width: "100%", maxWidth: 680,
                  display: "flex", flexDirection: "column", borderRadius: 16,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid " + mod.accent + "12",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 40px " + mod.accent + "04, inset 0 1px 0 rgba(255,255,255,0.03)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform",
                  transition: "all 0.35s ease",
                  animation: "fadeUp 0.5s ease 0.5s both",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = mod.accent + "80"
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 16px 48px " + mod.accent + "35, 0 0 80px " + mod.accent + "18, inset 0 1px 0 rgba(255,255,255,0.06)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = mod.accent + "12"
                  e.currentTarget.style.transform = ""
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.3), 0 0 40px " + mod.accent + "04, inset 0 1px 0 rgba(255,255,255,0.03)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.025)"
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 30 }}>{mod.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: mod.accent, fontFamily: "'DM Mono', monospace" }}>{mod.role}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>{mod.name}</h3>
                <p style={{ fontSize: 14.5, fontWeight: 500, color: "#7B8DB5", lineHeight: 1.6, flex: 1 }}>{mod.desc}</p>
                <div style={{ marginTop: 20, height: 2, background: "linear-gradient(90deg, " + mod.accent + "90, " + mod.accent + "30, transparent)", borderRadius: 1 }} />
              </div>
            </div>
          ) })()}

          {/* Engine badge */}
          <div style={{ textAlign: "center", marginTop: 48, animation: "fadeUp 0.5s ease 0.7s both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(99,102,241,0.08)", backdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7B8DB5", fontFamily: "'DM Mono', monospace" }}>Nexus-7 Forensic Engine</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#4A5A80" }} />
              <span style={{ fontSize: 11, color: "#4A5A80", fontFamily: "'DM Mono', monospace" }}>7 Active Modules</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── ANALYSIS VIEW (module selected) ──────────────────────────────────────
  return (
    <div style={pageStyle}>
      <style>{globalCSS}</style>
      <AmbientBg />
      <Header />

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="dlx-analysis-main" style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", minHeight: "100vh", padding: "100px 44px 60px", overflow: "auto" }}>

        {/* ── Nav menus (same as module selector) ── */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 32, animation: "fadeUp 0.5s ease 0.05s both" }}>
          <a href="/workstation" onClick={e => { e.preventDefault(); backToSelector() }} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", minWidth: 160, borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818CF8", fontSize: 13, fontWeight: 500, letterSpacing: "0.3px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s ease", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
            <span style={{ fontSize: 15 }}>📈</span>
            Workstation
          </a>
          <a href="/reports" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", minWidth: 160, borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818CF8", fontSize: 13, fontWeight: 500, letterSpacing: "0.3px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s ease", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
            <span style={{ fontSize: 15 }}>🗂️</span>
            Reports
          </a>
          <a href="/chat" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", minWidth: 160, borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818CF8", fontSize: 13, fontWeight: 500, letterSpacing: "0.3px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.25s ease", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; e.currentTarget.style.transform = "" }}>
            <span style={{ fontSize: 15 }}>💬</span>
            DalxicChat
          </a>
        </div>

        {/* ── Hero heading ── */}
        <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeUp 0.6s ease 0.1s both" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: selectedModule.accent, fontFamily: "'DM Sans', sans-serif", marginBottom: 18 }}>{selectedModule.name}</div>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
            {(() => { const tc = selectedModule.role.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" "); const words = tc.split(" "); const last = words.pop(); return <>{words.join(" ")} <span style={{ background: "linear-gradient(135deg, " + selectedModule.accent + ", #A78BFA, #22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{last}</span></>; })()}
          </h1>
          <p style={{ color: "#7B8DB5", maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontSize: 22, fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
            {selectedModule.key === "chromaveil" && "Detect AI Images"}
            {selectedModule.key === "kineticscan" && "Detect Deepfake Videos"}
            {selectedModule.key === "sonictrace" && "Detect Synthetic Voice Clones"}
            {selectedModule.key === "narrativeguard" && "Detect AI-Written Content"}
            {selectedModule.key === "newsguard" && "Verify News Authenticity"}
            {selectedModule.key === "docforensiq" && "Verify Document Authenticity"}
            {selectedModule.key === "sentinelcore" && "Monitor Live Streams In Real-Time"}
          </p>
        </div>

        {/* ═══════ INPUT VIEW ═══════ */}
        <div style={{
          opacity: view === "input" ? 1 : 0,
          transform: view === "input" ? "none" : "translateY(-20px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: view === "input" ? "auto" : "none",
          position: view === "input" ? "relative" : "absolute",
          width: view === "input" ? "auto" : "0",
          height: view === "input" ? "auto" : "0",
          overflow: view === "input" ? "visible" : "hidden",
        }}>

          {/* Input Card */}
          <div style={{ padding: "28px 30px", marginBottom: 24, textAlign: "center", maxWidth: "85%", margin: "0 auto 24px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid " + selectedModule.accent + "15", boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, " + selectedModule.accent + "90, " + selectedModule.accent + "30, transparent)" }} />

            {/* Mode toggle */}
            {availableModes.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 22, justifyContent: "center" }}>
                {availableModes.map(m => (
                  <button key={m}
                    onClick={() => { setMode(m); setFile(null); setUrl(""); setTextInput(""); setPreview(null) }}
                    style={{
                      padding: "10px 22px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 500, letterSpacing: 0.3,
                      background: mode === m ? P.accent + "18" : "transparent",
                      border: mode === m ? "1.5px solid " + P.accent + "50" : "1px solid " + P.border,
                      color: mode === m ? P.accent : P.txM,
                      boxShadow: mode === m ? "0 0 20px " + P.accent + "12" : "none",
                      transition: "all 0.4s ease", fontFamily: "'DM Sans', sans-serif"
                    }}>
                    {m === "upload" ? "Upload File" : m === "url" ? "Paste URL" : "Paste Text"}
                  </button>
                ))}
              </div>
            )}

            {/* Helper text */}
            <div style={{ fontSize: 11, color: P.txD, marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
              {mediaType === "image"    && mode === "upload" && "Upload any image file for AI generation detection"}
              {mediaType === "image"    && mode === "url"    && "Paste a direct link to any image on the web"}
              {mediaType === "video"    && mode === "upload" && "Upload a video file — frames extracted and analysed locally"}
              {mediaType === "video"    && mode === "url"    && "Paste a direct link to a video file"}
              {mediaType === "audio"    && "Upload an audio file — waveform statistics extracted locally"}
              {mediaType === "text"     && mode === "text"   && "Paste any text to check for AI generation"}
              {mediaType === "text"     && mode === "url"    && "Paste a link — text content will be extracted and analysed"}
              {mediaType === "news"     && mode === "text"   && "Paste a news article, headline, or claim to verify"}
              {mediaType === "news"     && mode === "url"    && "Paste a link to any news article or webpage"}
              {mediaType === "document" && mode === "upload" && "Upload a text document (TXT, PDF, DOC)"}
              {mediaType === "document" && mode === "text"   && "Paste document text — contract, report, letter"}
              {mediaType === "social"   && mode === "text"   && "Paste a bio, post, or profile description"}
              {mediaType === "social"   && mode === "url"    && "Paste a social media profile or post URL"}
              {mediaType === "stream"   && "Paste a live stream URL for real-time threat monitoring"}
            </div>

            {/* Upload zone */}
            {mode === "upload" && (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => { if (canvasBlocked && (mediaType === "image" || mediaType === "video")) { setShowCanvasModal(true); return } fileRef.current?.click() }}
                style={{
                  border: "none",
                  borderRadius: 16, padding: file ? "28px 24px" : "56px 24px", textAlign: "center", cursor: "pointer",
                  background: dragging ? "rgba(99,102,241,0.06)" : file ? "rgba(16,185,129,0.04)" : "transparent",
                  transition: "all 0.2s", position: "relative", overflow: "hidden"
                }}>
                {/* Pulsating center-bottom line */}
                {!file && !dragging && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", height: 2, borderRadius: 1, background: "linear-gradient(90deg, transparent, #F59E0B, #F59E0B, transparent)", animation: "centerSprout 3s ease-in-out infinite" }} />}
                {dragging && <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, " + P.accent + ", transparent)", animation: "scanline 1.5s linear infinite" }} />}
                <input ref={fileRef} type="file"
                  accept={
                    mediaType === "image"    ? "image/*" :
                    mediaType === "video"    ? "video/*" :
                    mediaType === "audio"    ? "audio/*" :
                    mediaType === "document" ? ".txt,.pdf,.doc,.docx,.rtf,text/*" : "*/*"
                  }
                  style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                {file ? (
                  <>
                    {mediaType === "image" && preview && <img src={preview} alt="" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />}
                    <div style={{ fontWeight: 600, color: P.gr, fontSize: 14 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: "-2px", marginRight: 6 }}><polyline points="20 6 9 17 4 12"/></svg>
                      {file.name}
                    </div>
                    <div style={{ fontSize: 11, color: P.txM, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                      {file.size > 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(1) + " MB" : (file.size / 1024).toFixed(0) + " KB"} · Click to change
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(99,102,241,0.06)", border: "1px solid " + P.border, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.violet} strokeWidth="1.5" strokeLinecap="round"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: P.tx }}>Drop file here or click to browse</div>
                    <div style={{ fontSize: 12, color: P.txM, fontFamily: "'DM Mono', monospace" }}>
                      {mediaType === "image"    && "JPG, PNG, WEBP, GIF, BMP"}
                      {mediaType === "video"    && "MP4, MOV, WEBM, AVI"}
                      {mediaType === "audio"    && "MP3, WAV, M4A, OGG, FLAC"}
                      {mediaType === "document" && "TXT, PDF, DOC, DOCX, RTF"}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* URL input */}
            {mode === "url" && (
              <div>
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.txD} strokeWidth="1.5" strokeLinecap="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", zIndex: 1 }}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  <input value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && url.trim()) analyze() }}
                    placeholder={
                      mediaType === "news"    ? "https://www.bbc.com/news/article-example" :
                      mediaType === "social"  ? "https://twitter.com/username" :
                      mediaType === "stream"  ? "https://stream.example.com/live/feed" :
                      mediaType === "text"    ? "https://example.com/article" :
                      mediaType === "video"   ? "https://example.com/video.mp4" :
                      "https://example.com/image.jpg"
                    }
                    style={{ width: "100%", padding: "14px 16px 14px 42px", borderRadius: 16, border: "none", background: "transparent", color: P.tx, fontSize: 13, outline: "none", fontFamily: "'DM Mono', monospace" }} />
                  <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", height: 2, borderRadius: 1, background: "linear-gradient(90deg, transparent, #F59E0B, #F59E0B, transparent)", animation: "centerSprout 3s ease-in-out infinite" }} />
                </div>
                <div style={{ fontSize: 10, color: P.txD, marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
                  {mediaType === "stream"
                    ? "Stream will be monitored continuously with millisecond-level flagging"
                    : mediaType === "news" || mediaType === "social" || mediaType === "text"
                    ? "Page content will be fetched and analysed automatically"
                    : "Paste a direct link to the file — must be publicly accessible"}
                </div>
              </div>
            )}

            {/* Text input */}
            {mode === "text" && (
              <div>
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                    placeholder={
                      mediaType === "news"     ? "Paste the news article, headline, or claim to verify..." :
                      mediaType === "document" ? "Paste document text here — contract, report, letter..." :
                      mediaType === "social"   ? "Paste the social media bio, post, or description..." :
                      "Paste any text here to check for AI generation..."
                    }
                    style={{ width: "100%", minHeight: 180, padding: "14px 16px", borderRadius: 16, border: "none", background: "transparent", color: P.tx, fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.7, fontFamily: "'DM Mono', monospace", textAlign: "center" }} />
                  <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", height: 2, borderRadius: 1, background: "linear-gradient(90deg, transparent, #F59E0B, #F59E0B, transparent)", animation: "centerSprout 3s ease-in-out infinite" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: P.txD, fontFamily: "'DM Mono', monospace" }}>
                    {mediaType === "text" && "Minimum ~50 words for accurate results"}
                    {mediaType === "news" && "Even a single sentence or headline can be analysed"}
                    {mediaType === "document" && "Up to 10,000 characters"}
                    {mediaType === "social" && "Profile bio, post text, or comments"}
                  </div>
                  <div style={{ fontSize: 10, color: textInput.length > 9000 ? P.amber : P.txD, fontFamily: "'DM Mono', monospace" }}>
                    {textInput.length.toLocaleString()} / 10,000
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analyze button */}
          <button onClick={analyze} disabled={analyzing || !isReady}
            onMouseEnter={e => { if (!analyzing && isReady) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.4)" } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = analyzing || !isReady ? "none" : "0 4px 20px rgba(99,102,241,0.2)" }}
            style={{
              width: "40%", margin: "0 auto", display: "block", padding: "16px 0", borderRadius: 14, border: "none", cursor: analyzing || !isReady ? "not-allowed" : "pointer",
              fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.2px",
              background: analyzing || !isReady ? P.border : "linear-gradient(135deg, #6366F1, #4F46E5)",
              color: analyzing || !isReady ? P.txD : "#fff",
              boxShadow: analyzing || !isReady ? "none" : "0 4px 20px rgba(99,102,241,0.2)",
              transition: "all 0.25s ease"
            }}>
            {analyzing ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Analysing...
              </span>
            ) : mediaType === "stream" ? "Begin Stream Monitoring" : "Begin Forensic Analysis"}
          </button>
        </div>

        {/* ═══════ ANALYZING VIEW ═══════ */}
        {view === "analyzing" && (
          <div style={{ animation: "fadeUp 0.5s ease", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48 }}>

            {/* Scanning graphic — orbital rings */}
            <div style={{ position: "relative", width: 180, height: 180, marginBottom: 44 }}>
              {/* Ambient glow */}
              <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", animation: "glowPulse 3s ease infinite" }} />
              {/* Outer orbit */}
              <svg width="180" height="180" style={{ position: "absolute", animation: "orbitSpin 12s linear infinite" }}>
                <circle cx="90" cy="90" r="85" fill="none" stroke={P.border} strokeWidth="1" strokeDasharray="3 9" />
                <circle cx="90" cy="5" r="3" fill={P.accent} opacity="0.6" />
              </svg>
              {/* Middle orbit */}
              <svg width="180" height="180" style={{ position: "absolute", animation: "orbitSpin 6s linear infinite reverse" }}>
                <circle cx="90" cy="90" r="65" fill="none" stroke={P.accent} strokeWidth="1" strokeDasharray="6 12" opacity="0.25" />
                <circle cx="90" cy="25" r="2.5" fill={P.violet} opacity="0.8" />
              </svg>
              {/* Progress ring */}
              <svg width="180" height="180" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                <circle cx="90" cy="90" r="44" fill="none" stroke={P.border} strokeWidth="6" />
                <circle cx="90" cy="90" r="44" fill="none" stroke="url(#progGrad)" strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                  strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.3s ease", filter: "drop-shadow(0 0 8px rgba(99,102,241,0.5))" }} />
                <defs><linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366F1"/><stop offset="100%" stopColor="#A78BFA"/></linearGradient></defs>
              </svg>
              {/* Center text */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: P.tx, fontFamily: "'Sora', sans-serif", letterSpacing: "-2px" }}>{Math.round(progress)}%</div>
              </div>
            </div>

            {/* Step text */}
            <div style={{ fontSize: 14, color: P.violet, fontWeight: 600, marginBottom: 28, textAlign: "center", minHeight: 20, fontFamily: "'DM Mono', monospace" }}>{step}</div>

            {/* Segmented progress bar */}
            <div style={{ width: "100%", maxWidth: 560, display: "flex", gap: 3 }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i < Math.round(progress / (100/24)) ? "linear-gradient(90deg, #6366F1, #818CF8)" : P.border,
                  transition: "background 0.2s ease " + (i * 0.015) + "s",
                  boxShadow: i < Math.round(progress / (100/24)) ? "0 0 6px rgba(99,102,241,0.3)" : "none"
                }} />
              ))}
            </div>

            {/* Engine modules — card style */}
            <div style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
              {["ChromaVeil", "KineticScan", "SonicTrace", "NarrativeGuard", "DocForensIQ", "SentinelCore"].map((e, i) => (
                <span key={e} style={{
                  fontSize: 10, padding: "6px 14px", borderRadius: 8,
                  background: "rgba(99,102,241,0.04)", border: "1px solid " + P.border,
                  color: progress > (i * 16) ? P.violet : P.txD,
                  fontFamily: "'DM Mono', monospace", fontWeight: 500,
                  transition: "color 0.3s, border-color 0.3s",
                  borderColor: progress > (i * 16) ? P.accent + "30" : P.border,
                }}>{e}</span>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ RESULTS VIEW ═══════ */}
        {view === "results" && results && resultsVisible && (() => {
          const col = verdictColor(results.zone, results.verdict)
          const bgTint = results.zone === "ai" ? "rgba(239,68,68,0.04)" : results.zone === "review" ? "rgba(245,158,11,0.04)" : results.verdict === "ERROR" ? "rgba(104,120,170,0.04)" : "rgba(16,185,129,0.04)"
          const borderTint = results.zone === "ai" ? "rgba(239,68,68,0.2)" : results.zone === "review" ? "rgba(245,158,11,0.2)" : results.verdict === "ERROR" ? "rgba(104,120,170,0.15)" : "rgba(16,185,129,0.2)"

          return (
            <div style={{ animation: "fadeUp 0.5s ease" }}>

              {/* VERDICT CARD */}
              <div style={{
                background: bgTint, border: "1px solid " + borderTint,
                borderRadius: 16, padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden",
              }}>
                {/* Top accent bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: col }} />

                <div className="dlx-verdict-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
                  {/* Left — metadata */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
                      {[
                        ["Case ID", "dlx_" + Math.random().toString(36).substr(2, 8)],
                        ["Timestamp", new Date().toLocaleString()],
                        ["Media", results.mediaType || "—"],
                        ["Engine", "Nexus-7"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 9, color: P.txD, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>{k}</div>
                          <div style={{ fontSize: 11, color: P.txM, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: col, marginBottom: 6, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.5px" }}>
                      {verdictLabel(results.zone, results.verdict)}
                    </div>
                    <div style={{ fontSize: 13, color: P.txM, fontWeight: 500 }}>
                      {verdictSubLabel(results.zone, results.displayConfidence)}
                    </div>
                    {results.filename && (
                      <div style={{ fontSize: 11, color: P.txD, marginTop: 6, fontFamily: "'DM Mono', monospace", padding: "4px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6, display: "inline-block" }}>{results.filename}</div>
                    )}
                  </div>

                  {/* Right — confidence ring */}
                  <div style={{ position: "relative", width: 130, height: 130 }}>
                    <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "radial-gradient(circle, " + col + "10, transparent 70%)" }} />
                    <ConfRing value={results.displayConfidence} color={col} size={130} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: 30, fontWeight: 800, color: col, fontFamily: "'Sora', sans-serif", letterSpacing: "-1px" }}>{results.displayConfidence}%</div>
                      <div style={{ fontSize: 8, color: P.txD, letterSpacing: "1.2px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                        {results.zone === "ai" ? "AI Prob" : results.zone === "review" ? "Review" : "Authentic"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Human Verification Warning */}
                {results.zone === "review" && (
                  <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, fontSize: 12, color: P.amber, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.amber} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    Mixed signals detected. Human verification by a qualified analyst is recommended before drawing conclusions.
                  </div>
                )}
              </div>

              {/* DIMENSIONS CARD */}
              {results.dimensions && results.dimensions.length > 0 && (
                <div style={{ padding: "28px 30px", marginBottom: 20, borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid " + selectedModule.accent + "15", boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, " + P.violet + "90, " + P.violet + "30, transparent)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Forensic Dimensions</div>
                    <div style={{ fontSize: 10, color: P.txD, fontFamily: "'DM Mono', monospace" }}>Overall: <span style={{ color: col, fontWeight: 700 }}>{results.overall}%</span></div>
                  </div>
                  <div className="dlx-dims-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 40px" }}>
                    {results.dimensions.map((d, i) => {
                      const dc = d.value > 65 ? P.re : d.value > 45 ? P.amber : P.gr
                      return (
                        <div key={i} style={{ animation: "fadeUp 0.4s ease " + (i * 0.06) + "s both" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: P.txM, fontFamily: "'DM Mono', monospace" }}>{d.dimension}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: dc, fontFamily: "'DM Mono', monospace", padding: "2px 8px", background: dc + "10", borderRadius: 4 }}>{d.value}%</span>
                          </div>
                          <div style={{ height: 5, background: P.border, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 3,
                              background: "linear-gradient(90deg, " + dc + ", " + dc + "90)",
                              width: d.value + "%",
                              animation: "barGrow 0.8s ease " + (i * 0.06) + "s both",
                              boxShadow: "0 0 8px " + dc + "30"
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ASSESSMENT CARD */}
              {results.reasoning && (
                <div style={{ padding: "28px 30px", marginBottom: 20, borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid " + col + "20", boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", transform: "translateZ(0)", willChange: "transform", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, " + col + "90, " + col + "30, transparent)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <div style={{ fontSize: 10, fontWeight: 600, color: P.txD, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Forensic Assessment</div>
                  </div>
                  <p style={{ fontSize: 13, color: P.tx, lineHeight: 1.9, fontFamily: "'DM Mono', monospace", opacity: 0.9 }}>{results.reasoning}</p>
                </div>
              )}

              {/* ACTION ROW */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={resetToInput}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = selectedModule.accent; e.currentTarget.style.color = "#ECF0FF"; e.currentTarget.style.background = selectedModule.accent + "08" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.txM; e.currentTarget.style.background = "transparent" }}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "1px solid " + P.border,
                    background: "transparent", color: P.txM, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 8
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                  Scan Again
                </button>
                <button onClick={backToSelector}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = P.glow; e.currentTarget.style.color = "#ECF0FF" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.txM }}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "1px solid " + P.border,
                    background: "transparent", color: P.txM, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 8
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
                  All Modules
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ═══════ CANVAS BLOCKED MODAL ═══════ */}
      {showCanvasModal && (
        <div onClick={() => setShowCanvasModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", transform: "translateZ(0)", willChange: "transform", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: P.card, border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, padding: "36px 40px", maxWidth: 500, width: "100%", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#EF4444" }} />
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.re} strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Browser Security Blocking Analysis</div>
            <p style={{ fontSize: 13, color: P.txM, lineHeight: 1.7, marginBottom: 20 }}>
              Your browser is blocking canvas access required for image and video forensic analysis.
            </p>
            <div style={{ fontSize: 12, color: P.txM, lineHeight: 1.9, marginBottom: 28, fontFamily: "'DM Mono', monospace", background: "rgba(0,0,0,0.2)", padding: "16px 18px", borderRadius: 10, border: "1px solid " + P.border }}>
              <strong style={{ color: P.tx }}>Tor Browser:</strong> Security Level → Standard<br/>
              <strong style={{ color: P.tx }}>Brave:</strong> Shields off for this site<br/>
              <strong style={{ color: P.tx }}>Firefox:</strong> privacy.resistFingerprinting → false<br/>
              <strong style={{ color: "#7DD3FC" }}>Recommended:</strong> Use Chrome, Edge or Safari
            </div>
            <button onClick={() => setShowCanvasModal(false)}
              style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#FCA5A5", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, transition: "all 0.15s" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
