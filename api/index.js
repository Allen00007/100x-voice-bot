// api/index.js
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/chat', async (req, res) => {
  try{
    const { message, profile } = req.body;
    const systemPrompt = `You are a friendly, concise interview voice assistant that speaks AS the user whose profile is below.`;
    const persona = `PERSONA START\n${Object.entries(profile || {}).map(([k,v])=>`${k}: ${v}`).join('\n')}\nPERSONA END`;
    const fullMessage = `${persona}\nUser asked: ${message}`;
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role:'system', content: systemPrompt },
        { role:'user', content: fullMessage }
      ],
      max_tokens: 400
    };
    const r = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${OPENAI_API_KEY}`},
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content || 'No response.';
    res.json({ reply });
  }catch(e){
    res.status(500).json({error:e.message});
  }
});

app.listen(PORT, ()=> console.log(`Server on ${PORT}`));
