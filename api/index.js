// api/index.js
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(bodyParser.json());
// Serve index.html and other static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Send index.html when user visits "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/chat', async (req, res) => {
  console.log('[/api/chat] incoming request body:', JSON.stringify(req.body));

  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  try {
    const { message, profile } = req.body || {};
    if (!message) {
      console.log('[/api/chat] no message provided');
      return res.status(400).json({ error: 'no message provided' });
    }

    const systemPrompt = `You are a friendly, concise interview voice assistant that speaks AS the user whose profile is below. Use the profile to answer short interview questions in first person.`;
    const persona = `PERSONA START\n${Object.entries(profile || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}\nPERSONA END`;
    const fullMessage = `${persona}\nUser asked: ${message}`;

    console.log('[/api/chat] sending prompt...');

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullMessage }
      ],
      max_tokens: 400
    };

    let r;

    if (openrouterKey) {
      console.log('Using OpenRouter');
      r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`
        },
        body: JSON.stringify(payload)
      });
    } else if (openaiKey) {
      console.log('Using OpenAI');
      r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      return res.status(500).json({ error: 'No API key configured' });
    }

    console.log('[/api/chat] status:', r.status);

    const data = await r.json();
    console.log('[/api/chat] response keys:', Object.keys(data));

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      null;

    if (!reply) {
      console.log('NO REPLY — FULL RESPONSE:', JSON.stringify(data));
      return res.status(500).json({ error: 'no reply from LLM', raw: data });
    }

    res.json({ reply });
  } catch (err) {
    console.error('[/api/chat] ERROR:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});


app.listen(PORT, ()=> console.log(`Server on ${PORT}`));
