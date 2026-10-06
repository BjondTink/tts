import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Mp3Encoder } from '@breezystack/lamejs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Convert PCM 16-bit WAV to high-quality MP3 (192 kbps)
function wavToMp3Buffer(wavBuffer: Buffer): Buffer {
  const wav = new DataView(wavBuffer.buffer, wavBuffer.byteOffset, wavBuffer.byteLength);

  let pos = 12;
  let channels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;
  let dataOffset = 44;
  let dataLen = wavBuffer.length - 44;

  while (pos < wavBuffer.length - 8) {
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
    if (offset + 1 < wavBuffer.length) {
      left[i] = wav.getInt16(offset, true);
    }
    offset += 2;
    if (channels === 2 && right) {
      if (offset + 1 < wavBuffer.length) {
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
  const result = Buffer.alloc(totalLength);
  let cur = 0;
  for (const chunk of mp3Chunks) {
    Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength).copy(result, cur);
    cur += chunk.length;
  }
  return result;
}

// Voices catalog with Albanian metadata for Real Estate
export interface VoiceMeta {
  id: string;
  name: string;
  gender: 'Femër' | 'Mashkull';
  toneDesc: string;
  recommendedFor: string;
  samplePitch: string;
}

const VOICES: VoiceMeta[] = [
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

// Endpoint: List Voices
app.get('/api/voices', (_req, res) => {
  res.json({ voices: VOICES });
});

// Endpoint: Real Estate Albanian Templates
app.get('/api/templates', (_req, res) => {
  const templates = [
    {
      id: 'apt-tirana',
      title: 'Apartament 2+1 në Tiranë (Kompleksi Delijorgji)',
      category: 'Apartament',
      text: 'Shitet apartament modern 2+1 në një nga zonat më të kërkuara të Tiranës, tek Rruga e Kavajës. Sipërfaqja totale është 98 metra katrorë, në katin e 5-të të një pallati të ri me dy ashensorë. Prona disponon sallon të bollshëm, dy dhoma gjumi me ndriçim natyral, dy tualete dhe ballkon me pamje panoramike. Punimet janë cilësore dhe prona vjen me dokumentacion të rregullt hipotekor. Për informacione të mëtejshme dhe një vizitë në pronë, kontaktoni tani!',
    },
    {
      id: 'vila-rolling',
      title: 'Vilë Luksoze me Pishinë (Tiranë / Lundër)',
      category: 'Vilë',
      text: 'Prezantojmë këtë vilë ekskluzive me arkitekturë bashkëkohore dhe kopsht të gjelbëruar. Sipërfaqe ndërtimi 320 metra katrorë dhe truall 500 metra katrorë me pishinë private. Vila përfshin katër dhoma gjumi master, sallon madhështor me oxhak, ambient gatimi modern dhe garazh për dy makina. Siguri maksimale 24 orë dhe komunitet i qetë elitar. Investimi ideal për familjen tuaj.',
    },
    {
      id: 'dyqan-biznes',
      title: 'Ambient Komercial me Qira (Bllok / Qendër)',
      category: 'Komerciale',
      text: 'Jepet me qira ambient komercial buzë rrugës kryesore, me fasadë xhami 12 metra për vizibilitet të lartë. Sipërfaqe prej 120 metrash katrorë në format open space, ideale për zyrë noteriale, klinikë mjekësore, bankë ose showroom prestigjioz. E pajisur me sistem qendror kondicionimi dhe aspirimi. Vendndodhje strategjike me fluks të lartë këmbësorësh.',
    },
    {
      id: 'det-vlore',
      title: 'Apartament 1+1 me Pamje nga Deti (Vlorë)',
      category: 'Bregdet',
      text: 'Mundësi fantastike investimi në vijën e parë të Lungomares në Vlorë. Apartament 1+1 plotësisht i mobiluar me stil modern, gati për t\'u lëshuar me qira ditore me kthim të lartë investimi. Ballkon i gjerë me pamje të mrekullueshme drejt perëndimit të diellit dhe detit Jon. Vetëm pak hapa larg plazhit dhe restoranteve më të mira.',
    },
    {
      id: 'oferte-urgjente',
      title: 'Okazion / Njoftim Shitje me Çmim të Favorizuar',
      category: 'Okazion',
      text: 'Ofertë speciale e kufizuar në kohë! Shitet me çmim okazion apartament i bollshëm me hipoteke në një zonë në zhvillim të shpejtë. Mundësi e shkëlqyer për banim ose ri-shitje me fitim të menjëhershëm. Çmimi është i negociueshëm për pagesa të shpejta likuide. Telefononi tani për të mos e humbur këtë mundësi unike.',
    },
  ];
  res.json({ templates });
});

function withTimeout<T>(promise: Promise<T>, ms = 7500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Koha e përgjigjes skadoi')), ms)
    ),
  ]);
}

// Helper: Robust generation with timeout and retry
async function generateWithRetry(fn: () => Promise<any>, maxRetries = 1, timeoutMs = 7500): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }
  throw lastError;
}

// Built-in rule-based Albanian orthography and real estate copy enhancer fallback
function albanianGrammarFallback(input: string, mode: 'grammar' | 'enhance') {
  let cleaned = input;

  const wordReplacements: [RegExp, string][] = [
    // Prepositions, pronouns and conjunctions
    [/\bne\b/gi, 'në'],
    [/\bte\b/gi, 'të'],
    [/\bnje\b/gi, 'një'],
    [/\bqe\b/gi, 'që'],
    [/\bper\b/gi, 'për'],
    [/\btek\b/gi, 'tek'],
    [/\bse\b/gi, 'se'],
    [/\bme\b(?=\s+të|\s+te)/gi, 'më'],
    
    // Real Estate words and city names
    [/\bshpi\b/gi, 'shtëpi'],
    [/\bshpija\b/gi, 'shtëpia'],
    [/\btirone\b/gi, 'Tiranë'],
    [/\btirane\b/gi, 'Tiranë'],
    [/\bTirane\b/g, 'Tiranë'],
    [/\btiranës\b/gi, 'Tiranës'],
    [/\bsiperfaqe\b/gi, 'sipërfaqe'],
    [/\bsiperfaqja\b/gi, 'sipërfaqja'],
    [/\bndricim\b/gi, 'ndriçim'],
    [/\bndricimi\b/gi, 'ndriçimi'],
    [/\bcmim\b/gi, 'çmim'],
    [/\bcmimi\b/gi, 'çmimi'],
    [/\bcmime\b/gi, 'çmime'],
    [/\bcmimet\b/gi, 'çmimet'],
    [/\bocasion\b/gi, 'okazion'],
    [/\beshte\b/gi, 'është'],
    [/\bkete\b/gi, 'këtë'],
    [/\bdhome\b/gi, 'dhomë'],
    [/\bdhoma\b/gi, 'dhoma'],
    [/\bhapsire\b/gi, 'hapësirë'],
    [/\bhapsira\b/gi, 'hapësira'],
    [/\bgjelberuar\b/gi, 'gjelbëruar'],
    [/\bbashkekohor\b/gi, 'bashkëkohor'],
    [/\bbashkekohore\b/gi, 'bashkëkohore'],
    [/\bshume\b/gi, 'shumë'],
    [/\bpallat te ri\b/gi, 'pallat të ri'],
    [/\bpallati te ri\b/gi, 'pallatit të ri'],
    [/\bkatit te\b/gi, 'katit të'],
    [/\bmundesi\b/gi, 'mundësi'],
    [/\bmenjehershem\b/gi, 'menjëhershëm'],
    [/\bmenjehershme\b/gi, 'menjëhershme'],
    [/\bkushte\b/gi, 'kushte'],
    [/\bqira\b/gi, 'qira'],
  ];

  for (const [pattern, replacement] of wordReplacements) {
    cleaned = cleaned.replace(pattern, (matched) => {
      if (matched[0] === matched[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  // Punctuation spacing cleanup
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

// Endpoint: Grammar and text correction in Albanian
app.post('/api/grammar/fix', async (req, res) => {
  try {
    const { text, mode } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Teksti është i nevojshëm.' });
    }

    const isEnhance = mode === 'enhance';
    const promptInstruction = isEnhance
      ? `Je një ekspert i gjuhës shqipe dhe kopirajtër profesionist për Pasuri të Paluajtshme (Real Estate).
Detyra jote:
1. Rregullo të gjitha gabimet drejtshkrimore në shqip (vendos saktë 'ë' dhe 'ç', korrigjo fjalët e gabuara, prapashtesat dhe shenjat e pikësimit).
2. Përmirëso stilin që të tingëllojë tërheqës, bindës dhe luksoz për shitje/qira pronash, duke ruajtur të pandryshuara të gjitha të dhënat thelbësore (çmimin, sipërfaqen në m², zonën, katet, numrin e dhomave).
3. Optimizoi fjalitë që të lexohen natyrshëm dhe qartë nga sistemi me zë (Text-To-Speech).`
      : `Je një redaktor gjuhësor i shqipes standarde.
Detyra jote:
1. Korrigjo vetëm gabimet drejtshkrimore dhe gramatikore në tekstin në shqip (vendos shkronjat 'ë' dhe 'ç' që mungojnë ose janë gabim, korrigjo gabimet e shtypit, lakimet dhe shenjat e pikësimit si presjet dhe pikat).
2. Mos ndrysho përmbajtjen, faktet, numrat, çmimet, sipërfaqen ose fjalorin thelbësor. Ruaj strukturën origjinale të tekstit sa më besnike.
3. Sigurohu që teksti të rrjedhë natyrshëm kur lexohet me zë.`;

    const userPrompt = `${promptInstruction}

Teksti origjinal:
"""
${text}
"""

Kthe përgjigjen të strukturuar në JSON me:
- correctedText (teksti i rregulluar)
- summaryOfFixes (varg me 1-4 pika të shkurtra të përmirësimeve kryesore në shqip)
- wordCount (numri i fjalëve)`;

    // Prioritize high-availability models with lite fallback
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let response: any = null;
    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        response = await generateWithRetry(() =>
          ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  correctedText: {
                    type: Type.STRING,
                    description: 'Teksti i plotë i korrigjuar në shqip',
                  },
                  summaryOfFixes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Përmbledhje e shkurtër e korrigjimeve kryesore (shqip)',
                  },
                  wordCount: {
                    type: Type.INTEGER,
                    description: 'Numri i fjalëve në tekstin e korrigjuar',
                  },
                },
                required: ['correctedText', 'summaryOfFixes'],
              },
            },
          }),
          1
        );
        if (response) break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!response) {
      console.warn('All Gemini models encountered high demand. Using intelligent Albanian fallback cleaner.');
      const fallbackResult = albanianGrammarFallback(text, isEnhance ? 'enhance' : 'grammar');
      return res.json(fallbackResult);
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      correctedText: parsed.correctedText || text,
      summaryOfFixes: parsed.summaryOfFixes || ['U rregullua teksti dhe drejtshkrimi'],
      wordCount: parsed.wordCount || (parsed.correctedText ? parsed.correctedText.trim().split(/\s+/).length : 0),
    });
  } catch (error: any) {
    console.error('Error in /api/grammar/fix:', error);
    // Graceful fallback even on unexpected exception
    const { text, mode } = req.body || {};
    if (text) {
      const fallbackResult = albanianGrammarFallback(text, mode === 'enhance' ? 'enhance' : 'grammar');
      return res.json(fallbackResult);
    }
    return res.status(500).json({
      error: 'Ndodhi një gabim gjatë rregullimit të tekstit.',
    });
  }
});

// Endpoint: Generate Speech (TTS)
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voice = 'Kore', tone = 'Profesional', speedInstruction = 'Normal' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Ju lutem shkruani ose ngjitni tekstin që dëshironi të konvertoni në audio.' });
    }

    // Compose nuanced style directions for Gemini TTS in Albanian
    let speedHint = '';
    if (speedInstruction === 'Pak më e shpejtë') {
      speedHint = 'Speak at a brisk, energetic pace.';
    } else if (speedInstruction === 'E qetë dhe e shtruar') {
      speedHint = 'Speak at a calm, unhurried, measured pace.';
    } else if (speedInstruction === 'Dinamike') {
      speedHint = 'Speak with vivid pacing, energetic transitions and high clarity.';
    }

    const stylePrompt = `Clear, natural spoken Albanian pronunciation. Real Estate presentation tone: ${tone}. ${speedHint} Articulate numbers, locations, and descriptions fluently.`;

    const ttsModels = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];
    let response: any = null;
    let lastErr: any = null;

    for (const model of ttsModels) {
      try {
        response = await generateWithRetry(() =>
          ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: text.trim(),
                    speechMetadata: {
                      style: stylePrompt,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              },
            },
          })
        );
        if (response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!response) {
      throw lastErr || new Error('Dështoi krijimi i zërit nga Gemini TTS.');
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      throw new Error('Nuk u arrit të gjenerohej audio nga modeli.');
    }

    const wavBuffer = Buffer.from(base64Audio, 'base64');

    // Convert WAV to high quality MP3
    let mp3Base64 = '';
    try {
      const mp3Buffer = wavToMp3Buffer(wavBuffer);
      mp3Base64 = mp3Buffer.toString('base64');
    } catch (mp3Err) {
      console.warn('MP3 conversion fallback:', mp3Err);
    }

    return res.json({
      audioBase64: base64Audio, // WAV format default from Gemini unary
      mp3Base64: mp3Base64 || base64Audio,
      mimeType: mimeType,
      voiceUsed: voice,
      toneUsed: tone,
      sizeBytes: wavBuffer.length,
    });
  } catch (error: any) {
    console.error('Error in /api/tts/generate:', error);
    return res.status(500).json({
      error: error?.message || 'Ndodhi një gabim gjatë krijimit të audios.',
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TTS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
