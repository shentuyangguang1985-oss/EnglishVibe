import vocabulary from '../data/vocab_all.json' with { type: 'json' };

const SITE_HOST = 'shentunotes.com';
const SITE_ENDPOINT = '/learn/englishvibe/api/tts';
const TUTOR_SPEAK_URL = 'https://shentunotes.com/learn/tutor/api/speak';
const decoder = new TextDecoder('utf-8', { fatal: true });
const allowedSentences = new Set(
  vocabulary.map(({ sentence }) => sentence?.trim()).filter(Boolean)
);
const MAX_REQUEST_BYTES = 512;
const MAX_AUDIO_BYTES = 1024 * 1024;
const TTS_TIMEOUT_MS = 12000;

function errorResponse(status, message, headers = {}) {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers }
  });
}

async function readSentence(request) {
  if (!request.body) throw new Error('Missing request body');
  const reader = request.body.getReader();
  const bytes = new Uint8Array(MAX_REQUEST_BYTES);
  let offset = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (offset + value.length > bytes.length) {
        void reader.cancel().catch(() => {});
        return null;
      }
      bytes.set(value, offset);
      offset += value.length;
    }
  } finally {
    reader.releaseLock();
  }

  const body = JSON.parse(decoder.decode(bytes.subarray(0, offset)));
  return typeof body?.sentence === 'string' ? body.sentence.trim() : '';
}

async function synthesize(sentence, tutor, signal) {
  const timeout = AbortSignal.timeout(TTS_TIMEOUT_MS);
  const upstreamRequest = new Request(TUTOR_SPEAK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sentence }),
    redirect: 'error',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout
  });

  const response = tutor ? await tutor.fetch(upstreamRequest) : await fetch(upstreamRequest);
  const type = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (!response.ok || !type?.startsWith('audio/') || !response.body) {
    void response.body?.cancel().catch(() => {});
    throw new Error('Tutor audio unavailable');
  }

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_AUDIO_BYTES) {
        void reader.cancel().catch(() => {});
        throw new Error('Tutor audio too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error('Tutor audio empty');
  return new Blob(chunks, { type });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const onMainSite = url.hostname === SITE_HOST;
    if (url.pathname !== (onMainSite ? SITE_ENDPOINT : '/api/tts')) {
      return onMainSite ? errorResponse(404, 'Not found') : env.ASSETS.fetch(request);
    }

    if (request.method !== 'POST') {
      return errorResponse(405, 'Method not allowed', { Allow: 'POST' });
    }
    if (request.headers.get('Origin') !== url.origin) {
      return errorResponse(403, 'Origin not allowed');
    }
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return errorResponse(415, 'JSON required');
    }

    let sentence;
    try {
      sentence = await readSentence(request);
    } catch {
      return errorResponse(400, 'Invalid JSON');
    }
    if (sentence === null) return errorResponse(413, 'Request too large');
    if (!allowedSentences.has(sentence)) return errorResponse(400, 'Unknown sentence');

    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip || !env.TTS_RATE_LIMITER) {
      return errorResponse(503, 'TTS unavailable');
    }

    try {
      const { success } = await env.TTS_RATE_LIMITER.limit({ key: ip });
      if (!success) return errorResponse(429, 'Too many requests');
      const audio = await synthesize(sentence, env.TUTOR_SPEECH, request.signal);
      return new Response(audio, {
        headers: { 'Content-Type': audio.type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' }
      });
    } catch {
      return errorResponse(502, 'TTS unavailable');
    }
  }
};
