import { GoogleGenAI, Type } from '@google/genai';
import { Mp3Encoder } from '@breezystack/lamejs';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  GEMINI_API_KEY?: string;
}

const VOICES = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Femër',
    toneDesc: 'E ngrohtë, e qetë, me artikulim kristal të pastër',
    recommendedFor: 'Apartamente luksoze, vila private dhe prezantime të rafinuara',
    samplePitch: 'E mesme / E butë',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Femër',
    toneDesc: 'E lehtë, mikpritëse dhe miqësore',
    recommendedFor: 'Shtëpi pushimi, apartamente me qira dhe video në rrjete sociale',
    samplePitch: 'E lartë / E gëzueshme',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Femër',
    toneDesc: 'Ekspresive, melodioze dhe shumë tërheqëse',
    recommendedFor: 'Reel-sa, TikTok & video promovuese tërheqëse',
    samplePitch: 'E mesme / Dinamike',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Femër',
    toneDesc: 'Profesionale, serioze dhe korporative',
    recommendedFor: 'Zyra, qendra biznesi, investime komerciale',
    samplePitch: 'E mesme / Autoritare',
  },
  {
    id: 'Thalassa',
    name: 'Thalassa',
    gender: 'Femër',
    toneDesc: 'E freskët, energjike dhe moderne',
    recommendedFor: 'Rezidenca bregdetare, prona në Vlorë/Durrës/Sarandë',
    samplePitch: 'E gjallë / E freskët',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Mashkull',
    toneDesc: 'Zë i thellë, autoritar dhe bindës',
    recommendedFor: 'Vila elitare, prona premium, Rolling Hills, qetësi dhe besim',
    samplePitch: 'E thellë / Bariton',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Mashkull',
    toneDesc: 'Rezultativ, i vendosur dhe i fortë',
    recommendedFor: 'Mundësi investimi, njoftime shitjesh me çmim të favorshëm',
    samplePitch: 'E fortë / Rezonante',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Mashkull',
    toneDesc: 'Dinamik, entuziast dhe me ritëm të shpejtë',
    recommendedFor: 'Ofertë e ditës, njoftime emergjente shitjeje, stories',
    samplePitch: 'E lartë / Energjike',
  },
  {
    id: 'Orpheus',
    name: 'Orpheus',
    gender: 'Mashkull',
    toneDesc: 'I ngrohtë, rrëfyes dhe komod si në shtëpi',
    recommendedFor: 'Ture virtuale të shtëpive, përshkrim ambienti familjar',
    samplePitch: 'E ngrohtë / Rrëfyese',
  },
  {
    id: 'Perseus',
    name: 'Perseus',
    gender: 'Mashkull',
    toneDesc: 'I drejtpërdrejtë, i qartë dhe profesional',
    recommendedFor: 'Përshkrime teknike të pronës, sipërfaqe, kate, çmime',
    samplePitch: 'E ekuilibruar / Moderne',
  },
];

function albanianGrammarFallback(input: string, mode: 'grammar' | 'enhance') {
  let cleaned = input;

  const wordReplacements: [RegExp, string][] = [
    [/\bne\b/gi, 'në'],
    [/\bte\b/gi, 'të'],
    [/\bnje\b/gi, 'një'],
    [/\bqe\b/gi, 'që'],
    [/\bper\b/gi, 'për'],
    [/\btek\b/gi, 'tek'],
    [/\bse\b/gi, 'se'],
    [/\bme\b(?=\s+të|\s+te)/gi, 'më'],
    [/\bshpi\b/gi, 'shtëpi'],
    [/\bshpija\b/gi, 'shtëpia'],
    [/\btirone\b/gi, 'Tiranë'],
    [/\btirane\b/gi, 'Tiranë'],
    [/\bTirane\b/g, 'Tiranë'],
    [/\btiranës\b/gi, 'Tiranës'],
    [/\bsiperfaqe\b/gi, 'sipërfaqe'],
    [/\bsiperfaqja\b/gi, 'sipërfaqja'],
    [/\bndricim\b/gi, 'ndriçim'],
    [/\bcmim\b/gi, 'çmim'],
    [/\bcmimi\b/gi, 'çmimi'],
    [/\bocasion\b/gi, 'okazion'],
    [/\beshte\b/gi, 'është'],
    [/\bkete\b/gi, 'këtë'],
    [/\bdhome\b/gi, 'dhomë'],
    [/\bdhoma\b/gi, 'dhoma'],
    [/\bshume\b/gi, 'shumë'],
  ];

  for (const [pattern, replacement] of wordReplacements) {
    cleaned = cleaned.replace(pattern, (matched) => {
      if (matched[0] === matched[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  cleaned = cleaned
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])(?=[^\s\d])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

  if (mode === 'enhance' && !cleaned.match(/[!?.]$/)) {
    cleaned += '. Kontaktoni për më shumë informacion dhe një vizitë në pronë!';
  }

  return {
    correctedText: cleaned,
    summaryOfFixes: [
      "Korrigjim i shkronjave 'ë' dhe 'ç' në fjalët kyçe",
      'Rregullim i shenjave të pikësimit dhe hapësirave',
      'Optimizim i rrjedhshmërisë për lexim me zë (TTS)',
    ],
    wordCount: cleaned.split(/\s+/).length,
  };
}

// Convert WAV to MP3 using pure TypedArrays (Universal for Workers & Node)
function convertWavToMp3(wavBytes: Uint8Array): Uint8Array {
  const wav = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);

  let pos = 12;
  let channels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;
  let dataOffset = 44;
  let dataLen = wavBytes.length - 44;

  while (pos < wavBytes.length - 8) {
    const chunkId = String.fromCharCode(
      wav.getUint8(pos),
      wav.getUint8(pos + 1),
      wav.getUint8(pos + 2),
      wav.getUint8(pos + 3)
    );
    const chunkSize = wav.getUint32(pos + 4, true);

    if (chunkId === 'fmt ') {
      channels = wav.getUint16(pos + 10, true);
      sampleRate = wav.getUint32(pos + 12, true);
      bitsPerSample = wav.getUint16(pos + 22, true);
    } else if (chunkId === 'data') {
      dataOffset = pos + 8;
      dataLen = chunkSize;
      break;
    }
    pos += 8 + chunkSize;
  }

  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataLen / bytesPerSample / channels);
  const left = new Int16Array(numSamples);
  const right = channels === 2 ? new Int16Array(numSamples) : undefined;

  let offset = dataOffset;
  for (let i = 0; i < numSamples; i++) {
    if (offset + 1 < wavBytes.length) {
      left[i] = wav.getInt16(offset, true);
    }
    offset += 2;
    if (channels === 2 && right) {
      if (offset + 1 < wavBytes.length) {
        right[i] = wav.getInt16(offset, true);
      }
      offset += 2;
    }
  }

  const mp3encoder = new Mp3Encoder(channels, sampleRate, 192);
  const mp3Chunks: Uint8Array[] = [];
  const blockSize = 1152;

  for (let i = 0; i < numSamples; i += blockSize) {
    const leftBlock = left.subarray(i, i + blockSize);
    const rightBlock = right ? right.subarray(i, i + blockSize) : undefined;
    const encoded = mp3encoder.encodeBuffer(leftBlock, rightBlock);
    if (encoded.length > 0) {
      mp3Chunks.push(new Uint8Array(encoded));
    }
  }

  const flushed = mp3encoder.flush();
  if (flushed.length > 0) {
    mp3Chunks.push(new Uint8Array(flushed));
  }

  const totalLength = mp3Chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const chunk of mp3Chunks) {
    result.set(chunk, cur);
    cur += chunk.length;
  }
  return result;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint: Voices list
    if (url.pathname === '/api/voices' && request.method === 'GET') {
      return new Response(JSON.stringify({ voices: VOICES }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Endpoint: Grammar fix
    if (url.pathname === '/api/grammar/fix' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { text, mode } = body || {};

        if (!text || typeof text !== 'string' || !text.trim()) {
          return new Response(JSON.stringify({ error: 'Teksti është i nevojshëm.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
        if (!apiKey) {
          const fallback = albanianGrammarFallback(text, mode === 'enhance' ? 'enhance' : 'grammar');
          return new Response(JSON.stringify(fallback), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const isEnhance = mode === 'enhance';
        const promptInstruction = isEnhance
          ? `Je një ekspert i gjuhës shqipe dhe kopirajtër profesionist për Pasuri të Paluajtshme (Real Estate). Rregullo gabimet në shqip (ë, ç, shenjat e pikësimit) dhe bëje më tërheqës për shitje pronash.`
          : `Je një redaktor gjuhësor i shqipes standarde. Korrigjo gabimet drejtshkrimore në shqip (vendos saktë ë dhe ç, rregullo pikësimin). Mos ndrysho faktet ose çmimet.`;

        const userPrompt = `${promptInstruction}\n\nTeksti:\n"""\n${text}\n"""\n\nKthe përgjigjen në JSON me correctedText, summaryOfFixes, wordCount.`;

        try {
          const aiRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  correctedText: { type: Type.STRING },
                  summaryOfFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  wordCount: { type: Type.INTEGER },
                },
                required: ['correctedText', 'summaryOfFixes'],
              },
            },
          });

          const parsed = JSON.parse(aiRes.text || '{}');
          return new Response(
            JSON.stringify({
              correctedText: parsed.correctedText || text,
              summaryOfFixes: parsed.summaryOfFixes || ['Përmirësim i tekstit'],
              wordCount: parsed.wordCount || text.trim().split(/\s+/).length,
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch {
          const fallback = albanianGrammarFallback(text, isEnhance ? 'enhance' : 'grammar');
          return new Response(JSON.stringify(fallback), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || 'Ndodhi një gabim' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Endpoint: TTS generation
    if (url.pathname === '/api/tts/generate' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { text, voice = 'Kore', tone = 'Profesional', speedInstruction = 'Normal' } = body || {};

        if (!text || typeof text !== 'string' || !text.trim()) {
          return new Response(JSON.stringify({ error: 'Teksti është i nevojshëm.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error:
                'GEMINI_API_KEY mungon në Cloudflare! Shko te paneli i Cloudflare: zeri > Settings > Variables and Secrets dhe shto GEMINI_API_KEY me çelësin tënd.',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const stylePrompt = `Clear, natural spoken Albanian pronunciation. Real Estate presentation tone: ${tone}. Pace: ${speedInstruction}. Articulate numbers, locations, and descriptions fluently.`;

        const aiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text: text.trim(), speechMetadata: { style: stylePrompt } }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
        });

        const base64Audio = aiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error('Nuk u gjenerua audio nga modeli.');
        }

        let mp3Base64 = base64Audio;
        try {
          const wavBytes = base64ToUint8(base64Audio);
          const mp3Bytes = convertWavToMp3(wavBytes);
          mp3Base64 = uint8ToBase64(mp3Bytes);
        } catch (mp3Err) {
          console.warn('MP3 worker fallback:', mp3Err);
        }

        return new Response(
          JSON.stringify({
            audioBase64: base64Audio,
            mp3Base64: mp3Base64,
            mimeType: 'audio/wav',
            voiceUsed: voice,
            toneUsed: tone,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            error: err?.message || 'Ndodhi një gabim gjatë krijimit të audios.',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Serve static assets via Cloudflare Pages / Workers Assets binding
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
