import React,{useState,useRef,useEffect} from 'react';
export default function App(){
  const [profileOpen,setProfileOpen]=useState(false);
  const [profile,setProfile]=useState({});
  const [question,setQuestion]=useState('');
  const [messages,setMessages]=useState([]);
  const [loading,setLoading]=useState(false);
  const recognitionRef=useRef(null);

  useEffect(()=>{ localStorage.setItem('voicebot_profile', JSON.stringify(profile))},[profile]);

  function startRecording(){
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ alert('No speech recognition'); return;}
    const rec = new SR();
    rec.lang='en-US';
    rec.onresult=e=>setQuestion(e.results[0][0].transcript);
    rec.start();
    recognitionRef.current=rec;
  }
  function stopRecording(){ recognitionRef.current?.stop(); }

  async function sendQuestion(q){
    if(!q)return;
    setMessages(m=>[...m,{role:'user',text:q}]);
    setLoading(true);
    try{
      const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,profile})});
      const d = await r.json();
      setMessages(m=>[...m,{role:'assistant',text:d.reply}]);
      const u=new SpeechSynthesisUtterance(d.reply); speechSynthesis.speak(u);
    }catch(e){
      setMessages(m=>[...m,{role:'assistant',text:'Server error'}]);
    }finally{setLoading(false); setQuestion('');}
  }

  function upd(k,v){ setProfile(p=>({...p,[k]:v}))}

  return (<div>
    <h1>100x Voice Bot</h1>
    <button onClick={()=>setProfileOpen(!profileOpen)}>Edit my profile</button>
    {profileOpen && (<div>
      <input placeholder='Headline' onChange={e=>upd('headline',e.target.value)}/>
      <textarea placeholder='Story' onChange={e=>upd('story',e.target.value)}/>
      <input placeholder='Superpower' onChange={e=>upd('superpower',e.target.value)}/>
      <input placeholder='Growth areas' onChange={e=>upd('growth',e.target.value)}/>
      <input placeholder='Misconception' onChange={e=>upd('misconception',e.target.value)}/>
    </div>)}

    <input value={question} onChange={e=>setQuestion(e.target.value)} />
    <button onMouseDown={startRecording} onMouseUp={stopRecording}>Record</button>
    <button onClick={()=>sendQuestion(question)}>{loading?'...':'Send'}</button>

    {messages.map((m,i)=><div key={i}><b>{m.role}</b>: {m.text}</div>)}
  </div>);
}
