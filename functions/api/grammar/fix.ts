export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { text, mode } = body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Teksti është i nevojshëm.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = env.GEMINI_API_KEY || '';
    if (apiKey) {
      try {
        const isEnhance = mode === 'enhance';
        const promptInstruction = isEnhance
          ? 'Je një ekspert i gjuhës shqipe për pasuri të paluajtshme. Rregullo gabimet drejtshkrimore (ë, ç, shenjat e pikësimit) dhe bëje më tërheqës për shitje pronash.'
          : 'Je një redaktor gjuhësor i shqipes standarde. Korrigjo vetëm gabimet drejtshkrimore në shqip (ë, ç, pikësimin). Mos ndrysho numrat ose faktet.';

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${promptInstruction}\n\nTeksti: "${text}"\n\nKthe vetëm tekstin e rregulluar pa komente shtesë.` }] }],
            }),
          }
        );

        if (aiRes.ok) {
          const data = (await aiRes.json()) as any;
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidateText) {
            return new Response(
              JSON.stringify({
                correctedText: candidateText,
                summaryOfFixes: ["Përmirësim i shkronjave 'ë', 'ç' dhe shenjave të pikësimit"],
                wordCount: candidateText.split(/\s+/).length,
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (e) {
        console.warn('AI fix failed, using fallback cleaner:', e);
      }
    }

    // Linguistic fallback
    let cleaned = text
      .replace(/\bne\b/gi, 'në')
      .replace(/\bte\b/gi, 'të')
      .replace(/\bnje\b/gi, 'një')
      .replace(/\bqe\b/gi, 'që')
      .replace(/\bper\b/gi, 'për')
      .replace(/\bshpi\b/gi, 'shtëpi')
      .replace(/\btirone\b/gi, 'Tiranë')
      .replace(/\btirane\b/gi, 'Tiranë')
      .replace(/\bTirane\b/g, 'Tiranë')
      .replace(/\bsiperfaqe\b/gi, 'sipërfaqe')
      .replace(/\bcmim\b/gi, 'çmim')
      .replace(/\bcmimi\b/gi, 'çmimi')
      .replace(/\beshte\b/gi, 'është')
      .replace(/\bshume\b/gi, 'shumë')
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/([.,!?;:])(?=[^\s\d])/g, '$1 ')
      .trim();

    return new Response(
      JSON.stringify({
        correctedText: cleaned,
        summaryOfFixes: ["Rregullim i shkronjave 'ë', 'ç' dhe drejtshkrimit në shqip"],
        wordCount: cleaned.split(/\s+/).length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Ndodhi një gabim' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
