// functions/api/chat.js
// Cloudflare Pages Function - dijalankan di edge, bukan di browser.
// Ini menjaga GROQ_API_KEY tetap rahasia (tidak pernah dikirim ke client).
//
// Endpoint ini otomatis aktif di: https://<domain-anda>/api/chat
// karena Cloudflare Pages membaca folder /functions sebagai routing.

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const chatLog = body.messages || [];

    if (!env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY belum diatur di Environment Variables Cloudflare Pages.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Konversi format chat internal HACTRAK ke format OpenAI-compatible milik Groq
    const groqMessages = [
      {
        role: 'system',
        content:
          'Kamu adalah HACTRAK AI, asisten neural tracker bernuansa cyberpunk/hacker yang ramah dan membantu. ' +
          'Jawab dalam Bahasa Indonesia kecuali pengguna menulis dalam bahasa lain. Jawaban ringkas, jelas, dan tetap sopan meski gaya bicaranya "hacker".'
      }
    ];

    for (const msg of chatLog) {
      if (msg.type === 'user') {
        groqMessages.push({ role: 'user', content: msg.content });
      } else if (msg.type === 'ai') {
        groqMessages.push({ role: 'assistant', content: msg.content });
      }
      // pesan 'system' dari UI (badge encrypted dll) sengaja tidak dikirim ke model
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        // Model produksi Groq saat ini. Ganti sesuai kebutuhan/ketersediaan di
        // https://console.groq.com/docs/models
        model: env.GROQ_MODEL || 'openai/gpt-oss-20b',
        messages: groqMessages,
        temperature: 0.8,
        max_tokens: 1024
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({ error: `Groq API error (${groqRes.status}): ${errText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Maaf, tidak ada respons dari model.';

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Tolak method selain POST dengan pesan yang jelas
export async function onRequestGet() {
  return new Response(
    JSON.stringify({ error: 'Gunakan method POST untuk endpoint ini.' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}
