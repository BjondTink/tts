export async function onRequestGet() {
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

  return new Response(JSON.stringify({ voices: VOICES }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
