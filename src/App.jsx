import { useState, useRef, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://secddtuuggxjkfoboxby.supabase.co",
  "sb_publishable_naTvm_CTKEcUZEx5m1D4ww_gif5q5tv"
);

const S = {
  get: async (k, userId) => {
    try {
      const uid = userId || localStorage.getItem("userId");
      if (!uid) { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; }
      const { data } = await supabase.from("user_data").select("value").eq("user_id", uid).eq("key", k).single();
      if (data) return JSON.parse(data.value);
      // fallback to localStorage
      const r = localStorage.getItem(k); return r ? JSON.parse(r) : null;
    } catch { 
      try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; }
    }
  },
  set: async (k, v, userId) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      const uid = userId || window.__userId || localStorage.getItem("userId");
      if (!uid) return;
      await supabase.from("user_data").upsert({ user_id: uid, key: k, value: JSON.stringify(v), updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
    } catch { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  },
};

const PHASES = [
  { id:"A", name:"Menstrual", days:[1,3], emoji:"🌙", label:"Rest & Release",
    accent:"#a855f7", light:"#f3e8ff",
    desc:"Low dopamine = low energy. Honor your body. 2-minute rule only. Warmth, rest, and gentleness.",
    workouts:["Rest / Yoga","Gentle Stretch","Short Walk"],
    foods:["Avocado","Seeds & Nuts","Dark Chocolate","Warming Soups"],
    adhd:"Dopamine is at its lowest right now. Do NOT start new projects. Shrink your task list. Body doubling helps more than usual.",
    energy:"🔋 Low — 1/4" },
  { id:"B", name:"Follicular", days:[4,8], emoji:"🌱", label:"Energize & Create",
    accent:"#10b981", light:"#d1fae5",
    desc:"Estrogen rising = dopamine rising. Brain is sharp and creative. Best time to start new habits and routines.",
    workouts:["Running / Dance","HIIT","Rollerblade","Strength Training"],
    foods:["Apples","Edamame","Leafy Greens","Fermented Foods","Eggs"],
    adhd:"This is your superpower window. Start the things, plan the things, batch your hard tasks here. Motivation feels more natural.",
    energy:"🔋🔋🔋 Rising — 3/4" },
  { id:"C", name:"Ovulatory", days:[9,11], emoji:"✨", label:"Connect & Shine",
    accent:"#d97706", light:"#fef3c7",
    desc:"Peak estrogen = peak confidence and focus. Best time for social things, hard conversations, content creation.",
    workouts:["HIIT Workouts","Swimming","Boxing","Group Classes"],
    foods:["Berries","Cherries","Light Fresh Foods","Smoothies","Salmon"],
    adhd:"Peak dopamine window. Schedule your hardest tasks, important calls, and anything that needs your full brain right here.",
    energy:"🔋🔋🔋🔋 Peak — 4/4" },
  { id:"D", name:"Luteal", days:[12,20], emoji:"🍂", label:"Reflect & Rest",
    accent:"#ef4444", light:"#fee2e2",
    desc:"Progesterone rises then drops. Energy winds down. Finish tasks rather than starting new ones. Be extra gentle with yourself.",
    workouts:["Yoga","Low Intensity Walks","Light Strength","Pilates"],
    foods:["Sweet Potatoes","Oats","Bananas","Magnesium-rich Foods","Dark Leafy Greens"],
    adhd:"Dopamine drops before your period. Temptation bundle everything. Lower the bar — done is better than perfect.",
    energy:"🔋🔋 Winding down — 2/4" },
];

function getPhase(day, len=20) {
  const ratio = day / len;
  if (ratio <= 0.15) return PHASES[0]; // menstrual
  if (ratio <= 0.4)  return PHASES[1]; // follicular
  if (ratio <= 0.55) return PHASES[2]; // ovulatory
  return PHASES[3]; // luteal
}

const DEFAULT_HABITS = [
  { id:"medicine",      label:"Medicine",        emoji:"💊", color:"#a855f7", section:"morning" },
  { id:"letdog",        label:"Let Dog Out",      emoji:"🐾", color:"#f472b6", section:"morning" },
  { id:"braindump_am",  label:"Brain Dump AM",    emoji:"📝", color:"#818cf8", section:"morning" },
  { id:"brushteeth_am", label:"Brush Teeth AM",   emoji:"🪥", color:"#38bdf8", section:"morning" },
  { id:"breakfast",     label:"Breakfast",        emoji:"🍳", color:"#fb923c", section:"morning" },
  { id:"veggies",       label:"Veggies",          emoji:"🥦", color:"#4ade80", section:"afternoon" },
  { id:"fruit",         label:"Fruit",            emoji:"🍓", color:"#f43f5e", section:"afternoon" },
  { id:"lunch",         label:"Lunch",            emoji:"🥗", color:"#34d399", section:"afternoon" },
  { id:"emails",        label:"Emails",           emoji:"📧", color:"#60a5fa", section:"afternoon" },
  { id:"notes",         label:"Notes & Requests", emoji:"📋", color:"#a78bfa", section:"afternoon" },
  { id:"lunchbox",      label:"Lunch Box",        emoji:"🧺", color:"#fbbf24", section:"home" },
  { id:"water",         label:"Water Plants",     emoji:"🌿", color:"#6ee7b7", section:"home" },
  { id:"chore",         label:"One Chore",        emoji:"✨", color:"#f9a8d4", section:"home" },
  { id:"vitamins",      label:"Vitamins",         emoji:"💊", color:"#c084fc", section:"bedtime" },
  { id:"brushteeth_pm", label:"Brush Teeth PM",   emoji:"🪥", color:"#67e8f9", section:"bedtime" },
  { id:"washface",      label:"Wash Face",        emoji:"🧴", color:"#fda4af", section:"bedtime" },
  { id:"braindump_pm",  label:"Brain Dump PM",    emoji:"📝", color:"#818cf8", section:"bedtime" },
];

const SECTION_META = [
  { key:"morning",   label:"🌅 Morning",   accent:"#d97706" },
  { key:"afternoon", label:"☀️ Afternoon", accent:"#059669" },
  { key:"home",      label:"🏠 Home",      accent:"#0284c7" },
  { key:"bedtime",   label:"🌙 Bedtime",   accent:"#7c3aed" },
];

const DEFAULT_FOLDERS = [
  { id:"recipes",  name:"Recipes",    emoji:"🍳", color:"#fb923c" },
  { id:"hacks",    name:"Life Hacks", emoji:"💡", color:"#f59e0b" },
  { id:"cleaning", name:"Cleaning",   emoji:"🧹", color:"#34d399" },
  { id:"adhd",     name:"ADHD Tips",  emoji:"🧠", color:"#818cf8" },
  { id:"health",   name:"Health",     emoji:"🌿", color:"#4ade80" },
];

const DEFAULT_ENTRIES = [
  { id:"laundry_det", folderId:"cleaning", title:"3-Ingredient Laundry Detergent", emoji:"🧺",
    content:"1 cup washing soda\n1 cup baking soda\n1/2 cup dish soap (Dawn)\n\nMix dry ingredients first, then add dish soap. Use 2 tbsp per load. Store in airtight container. Lasts ~40 loads.",
    tags:["laundry","diy","cleaning"], pinned:true, createdAt:Date.now(), photo:null },
];

const REACTIONS = ["🧡","🌸","🌿","✨","💪","🐛","🌙","🎉"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const EMOJI_OPTIONS = ["⭐","🎯","💪","🧘","📚","🎨","💧","🏃","🛁","🌸","🍵","🎵","🧹","💻","🐾","🌙","🌿","✨","💊","📝","🪥","🍳","🥗","📧","📋","🧺","🥦","🍓","🐶","🐱","🦋","🌺","🌻","🌈","⚡","🔥","❄️","🎪","🏋️","🚴","🧗","🏊","🎭","🎬","🎤","🎸","🎹","🎺","🎻","🥁","🎲","♟️","🎯","🎳","⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🚀","🛸","🌍","🏔️","🏖️","🌊","🌋","🦁","🐘","🦒","🐬","🦅","🌴","🍎","🍊","🍋","🍇","🍉","🍕","🍜","🥑","🧁","🍩","☕","🧃","🥤","🫖","💐","🌷","🌹","🍀","🎋","🪴","💎","👑","🎀","🎁","🏆","🥇","🎖️","📸","📱","💡","🔑","🗝️","🧲","🔭","🧬","⚗️","🩺","💉","🩹","🧸","🪆","🎠","🎡","🎢"];
const SECTION_COLORS = ["#a855f7","#f472b6","#34d399","#60a5fa","#fb923c","#f59e0b","#6ee7b7","#818cf8","#fda4af","#67e8f9"];

const MOCK_USERS = {
  luna_girl: { username:"luna_girl", displayName:"Luna 🌙", avatar:"🌙", bio:"manifesting & moving my body daily",
    habits:DEFAULT_HABITS.slice(0,8), data:{},
    journal:{[todayKey()]:{gratitude:"Grateful for sunshine and my morning walk 🌞",photo:null}} },
};

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}
function getDaysInMonth(y,m) { return new Date(y,m+1,0).getDate(); }
function pct(v,t) { return t ? Math.round((v/t)*100) : 0; }
function getCellColor(p) {
  if (p===0) return "#f3f4f6"; if (p<30) return "#fecdd3";
  if (p<60) return "#fde68a"; if (p<85) return "#bbf7d0"; return "#86efac";
}

function Avatar({ a, size=36 }) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#f3e8ff,#fce7f3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.45,flexShrink:0,border:"2px solid #e9d5ff"}}>{a}</div>;
}

async function extractTextFromImage(b64) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
        messages:[{role:"user",content:[
          {type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64.split(",")[1]}},
          {type:"text",text:"Extract and transcribe all text from this image. If it's a recipe format it cleanly. Return only the extracted text."}
        ]}]})
    });
    const d = await res.json();
    return d.content?.[0]?.text || "";
  } catch { return ""; }
}

function EntryModal({ entry, folders, onClose, onSave, onDelete }) {
  const [title,setTitle] = useState(entry?.title||"");
  const [content,setContent] = useState(entry?.content||"");
  const [emoji,setEmoji] = useState(entry?.emoji||"📌");
  const [folderId,setFolderId] = useState(entry?.folderId||folders[0]?.id||"");
  const [tags,setTags] = useState(entry?.tags?.join(", ")||"");
  const [pinned,setPinned] = useState(entry?.pinned||false);
  const [photo,setPhoto] = useState(entry?.photo||null);
  const [extracting,setExtracting] = useState(false);
  const photoRef = useRef();

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = ev.target.result; setPhoto(b64); setExtracting(true);
      const text = await extractTextFromImage(b64);
      if (text) setContent(p => p ? p+"\n\n"+text : text);
      setExtracting(false);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!title.trim()) return;
    onSave({id:entry?.id||`entry_${Date.now()}`,title:title.trim(),content,emoji,folderId,
      tags:tags.split(",").map(t=>t.trim()).filter(Boolean),pinned,photo,createdAt:entry?.createdAt||Date.now()});
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"white",borderRadius:"20px 20px 0 0",maxHeight:"92vh",overflowY:"auto",padding:"20px 16px 40px"}}>
        <div style={{width:40,height:4,background:"#e5e7eb",borderRadius:99,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#1f2937"}}>{entry?"Edit Entry":"New Entry"}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#9ca3af",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <select value={emoji} onChange={e=>setEmoji(e.target.value)} style={{width:48,height:44,borderRadius:10,border:"1.5px solid #e9d5ff",background:"white",fontSize:20,cursor:"pointer",appearance:"none",paddingLeft:6}}>
            {EMOJI_OPTIONS.map(e=><option key={e} value={e}>{e}</option>)}
          </select>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title..."
            style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:14,fontFamily:"Georgia,serif",outline:"none",color:"#1f2937",fontWeight:600}}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Folder</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {folders.map(f=>(
              <button key={f.id} onClick={()=>setFolderId(f.id)}
                style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${folderId===f.id?f.color:"#e5e7eb"}`,background:folderId===f.id?f.color+"22":"white",color:folderId===f.id?f.color:"#6b7280",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {f.emoji} {f.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Photo (optional)</label>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
          {photo
            ? <div style={{position:"relative",marginBottom:8}}><img src={photo} alt="" style={{width:"100%",borderRadius:10,maxHeight:180,objectFit:"cover"}}/><button onClick={()=>setPhoto(null)} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.5)",border:"none",color:"white",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:12}}>✕</button></div>
            : <button onClick={()=>photoRef.current?.click()} style={{width:"100%",padding:"12px",borderRadius:10,border:"2px dashed #e9d5ff",background:"#fafafa",color:"#a855f7",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>📷 Upload photo — AI extracts text automatically</button>
          }
          {extracting && <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:"#f3e8ff",marginTop:6}}><span style={{fontSize:14}}>✨</span><span style={{fontSize:12,color:"#a855f7",fontStyle:"italic"}}>Extracting text from photo...</span></div>}
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Content / Notes</label>
          <textarea value={content} onChange={e=>setContent(e.target.value)} rows={7} placeholder="Paste your recipe, hack, or notes here..."
            style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",resize:"vertical",boxSizing:"border-box",color:"#374151",lineHeight:1.7}}/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Tags</label>
          <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="e.g. diy, laundry, quick"
            style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:12,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151"}}/>
        </div>
        <button onClick={()=>setPinned(p=>!p)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,border:`1.5px solid ${pinned?"#f59e0b":"#e5e7eb"}`,background:pinned?"#fef3c7":"white",marginBottom:16,cursor:"pointer"}}>
          <span style={{fontSize:16}}>📌</span>
          <span style={{fontSize:12,fontWeight:600,color:pinned?"#d97706":"#6b7280"}}>{pinned?"Pinned":"Pin to top"}</span>
        </button>
        <div style={{display:"flex",gap:8}}>
          {entry && <button onClick={()=>onDelete(entry.id)} style={{padding:"11px 16px",borderRadius:12,border:"1.5px solid #fecdd3",background:"white",color:"#f43f5e",fontSize:13,cursor:"pointer",fontWeight:600}}>Delete</button>}
          <button onClick={save} style={{flex:1,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#c084fc,#a855f7)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save ✨</button>
        </div>
      </div>
    </div>
  );
}

function LibraryView({ folders, setFolders, entries, setEntries }) {
  const [activeFolder,setActiveFolder] = useState(null);
  const [editingEntry,setEditingEntry] = useState(null);
  const [showNewEntry,setShowNewEntry] = useState(false);
  const [search,setSearch] = useState("");
  const [showNewFolder,setShowNewFolder] = useState(false);
  const [newFolderName,setNewFolderName] = useState("");
  const [newFolderEmoji,setNewFolderEmoji] = useState("📁");
  const [viewingEntry,setViewingEntry] = useState(null);

  const filtered = entries.filter(e=>{
    const mf = !activeFolder||e.folderId===activeFolder;
    const ms = !search||e.title.toLowerCase().includes(search.toLowerCase())||e.content.toLowerCase().includes(search.toLowerCase())||e.tags.some(t=>t.includes(search.toLowerCase()));
    return mf&&ms;
  }).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.createdAt-a.createdAt);

  const saveEntry = (entry) => { setEntries(p=>p.find(e=>e.id===entry.id)?p.map(e=>e.id===entry.id?entry:e):[...p,entry]); setShowNewEntry(false); setEditingEntry(null); };
  const deleteEntry = (id) => { setEntries(p=>p.filter(e=>e.id!==id)); setEditingEntry(null); setViewingEntry(null); };
  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const cols = ["#a855f7","#f472b6","#34d399","#60a5fa","#fb923c","#f59e0b"];
    setFolders(p=>[...p,{id:`folder_${Date.now()}`,name:newFolderName.trim(),emoji:newFolderEmoji,color:cols[p.length%cols.length]}]);
    setNewFolderName(""); setNewFolderEmoji("📁"); setShowNewFolder(false);
  };
  const folderFor = (id) => folders.find(f=>f.id===id);

  return (
    <div>
      {(showNewEntry||editingEntry) && <EntryModal entry={editingEntry||null} folders={folders} onClose={()=>{setShowNewEntry(false);setEditingEntry(null);}} onSave={saveEntry} onDelete={deleteEntry}/>}
      {viewingEntry&&!editingEntry&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:250,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setViewingEntry(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"white",borderRadius:"20px 20px 0 0",maxHeight:"88vh",overflowY:"auto",padding:"20px 16px 40px"}}>
            <div style={{width:40,height:4,background:"#e5e7eb",borderRadius:99,margin:"0 auto 14px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:28}}>{viewingEntry.emoji}</span>
                <div>
                  <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#1f2937"}}>{viewingEntry.title}</h3>
                  {folderFor(viewingEntry.folderId)&&<span style={{fontSize:11,color:folderFor(viewingEntry.folderId)?.color}}>{folderFor(viewingEntry.folderId)?.emoji} {folderFor(viewingEntry.folderId)?.name}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setEditingEntry(viewingEntry)} style={{fontSize:12,padding:"5px 10px",borderRadius:20,border:"1.5px solid #e9d5ff",background:"white",color:"#a855f7",cursor:"pointer",fontWeight:600}}>✏️ Edit</button>
                <button onClick={()=>setViewingEntry(null)} style={{background:"none",border:"none",fontSize:20,color:"#9ca3af",cursor:"pointer"}}>✕</button>
              </div>
            </div>
            {viewingEntry.pinned&&<span style={{fontSize:10,background:"#fef3c7",color:"#d97706",padding:"2px 8px",borderRadius:20,fontWeight:700,marginBottom:12,display:"inline-block"}}>📌 Pinned</span>}
            {viewingEntry.photo&&<img src={viewingEntry.photo} alt="" style={{width:"100%",borderRadius:10,maxHeight:200,objectFit:"cover",marginBottom:12}}/>}
            <pre style={{margin:"0 0 12px",fontSize:13,color:"#374151",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",background:"#fafafa",padding:"12px 14px",borderRadius:10,border:"1px solid #f3f4f6"}}>{viewingEntry.content}</pre>
            {viewingEntry.tags.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{viewingEntry.tags.map(t=><span key={t} style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:"#f3e8ff",color:"#a855f7",fontWeight:600}}>#{t}</span>)}</div>}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search library..."
          style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",color:"#374151"}}/>
        <button onClick={()=>{setEditingEntry(null);setShowNewEntry(true);}} style={{padding:"10px 14px",borderRadius:10,border:"none",background:"#a855f7",color:"white",fontSize:16,cursor:"pointer",fontWeight:700}}>+</button>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:12}}>
        <button onClick={()=>setActiveFolder(null)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${!activeFolder?"#a855f7":"#e5e7eb"}`,background:!activeFolder?"#f3e8ff":"white",color:!activeFolder?"#a855f7":"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>All ({entries.length})</button>
        {folders.map(f=><button key={f.id} onClick={()=>setActiveFolder(activeFolder===f.id?null:f.id)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${activeFolder===f.id?f.color:"#e5e7eb"}`,background:activeFolder===f.id?f.color+"22":"white",color:activeFolder===f.id?f.color:"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{f.emoji} {f.name} ({entries.filter(e=>e.folderId===f.id).length})</button>)}
        <button onClick={()=>setShowNewFolder(p=>!p)} style={{padding:"6px 12px",borderRadius:20,border:"1.5px dashed #e9d5ff",background:"white",color:"#a855f7",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>+ Folder</button>
      </div>
      {showNewFolder&&(
        <div style={{background:"white",borderRadius:12,padding:14,marginBottom:12,border:"1.5px dashed #e9d5ff"}}>
          <div style={{display:"flex",gap:8}}>
            <select value={newFolderEmoji} onChange={e=>setNewFolderEmoji(e.target.value)} style={{width:46,borderRadius:8,border:"1.5px solid #e9d5ff",background:"white",fontSize:18,cursor:"pointer"}}>
              {EMOJI_OPTIONS.map(e=><option key={e} value={e}>{e}</option>)}
            </select>
            <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFolder()} placeholder="Folder name..."
              style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",color:"#374151"}}/>
            <button onClick={addFolder} style={{padding:"9px 14px",borderRadius:8,border:"none",background:"#a855f7",color:"white",fontSize:14,cursor:"pointer",fontWeight:700}}>+</button>
          </div>
        </div>
      )}
      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"36px 0",color:"#d1d5db"}}><div style={{fontSize:36,marginBottom:10}}>📚</div><p style={{margin:0,fontSize:13,fontStyle:"italic"}}>{search?"No results":"Add your first entry!"}</p></div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.map(entry=>{
              const folder=folderFor(entry.folderId);
              return (
                <button key={entry.id} onClick={()=>setViewingEntry(entry)}
                  style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:`1.5px solid ${folder?.color+"33"||"#f3f4f6"}`,textAlign:"left",cursor:"pointer"}}>
                  {entry.photo&&<img src={entry.photo} alt="" style={{width:"100%",height:80,objectFit:"cover"}}/>}
                  <div style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:20}}>{entry.emoji}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          {entry.pinned&&<span style={{fontSize:10}}>📌</span>}
                          <p style={{margin:0,fontSize:14,fontWeight:700,color:"#1f2937"}}>{entry.title}</p>
                        </div>
                        {folder&&<span style={{fontSize:10,color:folder.color,fontWeight:600}}>{folder.emoji} {folder.name}</span>}
                        <p style={{margin:"3px 0 0",fontSize:11,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.content.slice(0,70).replace(/\n/g," ")}...</p>
                      </div>
                    </div>
                    {entry.tags.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>{entry.tags.slice(0,4).map(t=><span key={t} style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"#f3e8ff",color:"#a855f7"}}>#{t}</span>)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
      }
    </div>
  );
}

export default function AllbugsLife() {
  const now = new Date();
  const [loaded,setLoaded] = useState(false);
  const [screen,setScreen] = useState("setup");
  const [myUsername,setMyUsername] = useState("");
  const [myDisplay,setMyDisplay] = useState("");
  const [myAvatar,setMyAvatar] = useState("🐛");
  const [myPin,setMyPin] = useState("");
  const [pinError,setPinError] = useState("");

  const [year,setYear] = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth());
  const [data,setData] = useState({});
  const [habits,setHabits] = useState(DEFAULT_HABITS);
  const [selectedDay,setSelectedDay] = useState(null);
  const [view,setView] = useState("grid");
  const [filterSection,setFilterSection] = useState("all");
  const [cycleStartDate,setCycleStartDate] = useState(null);
  const [cycleLength,setCycleLength] = useState(20);
  const [showCycleSetup,setShowCycleSetup] = useState(false);
  const [isNewAccount,setIsNewAccount] = useState(true);

  const [journal,setJournal] = useState({});
  const [journalDay,setJournalDay] = useState(null);
  const [journalText,setJournalText] = useState("");
  const [journalPhoto,setJournalPhoto] = useState(null);
  const photoRef = useRef();

  const [goals,setGoals] = useState({});
  const [newGoalText,setNewGoalText] = useState("");

  const [friends,setFriends] = useState({luna_girl:"friend"});
  const [reactions,setReactions] = useState({});
  const [inviteUsername,setInviteUsername] = useState("");
  const [inviteMsg,setInviteMsg] = useState("");
  const [viewingFriend,setViewingFriend] = useState(null);

  const [myPost,setMyPost] = useState({});
  const [editingPost,setEditingPost] = useState(false);
  const [postText,setPostText] = useState("");
  const [postPhoto,setPostPhoto] = useState(null);
  const postPhotoRef = useRef();

  const [addingToSection,setAddingToSection] = useState(null);
  const [newHabitLabel,setNewHabitLabel] = useState("");
  const [newHabitEmoji,setNewHabitEmoji] = useState("⭐");

  const [folders,setFolders] = useState(DEFAULT_FOLDERS);
  const [entries,setEntries] = useState(DEFAULT_ENTRIES);

  useEffect(()=>{
    (async()=>{
      const savedUserId = localStorage.getItem("userId");
      const savedPin = localStorage.getItem("userPin");
      if (savedUserId) window.__userId = savedUserId;
      const profile = await S.get("profile", savedUserId);
      if (profile){setMyUsername(profile.username||"");setMyDisplay(profile.display||"");setMyAvatar(profile.avatar||"🐛");setMyPin(savedPin||"");setScreen("app");}
      const d=await S.get("habitData",savedUserId); if(d)setData(d);
      const h=await S.get("habits",savedUserId); if(h)setHabits(h);
      const j=await S.get("journal",savedUserId); if(j)setJournal(j);
      const g=await S.get("goals",savedUserId); if(g)setGoals(g);
      const r=await S.get("reactions",savedUserId); if(r)setReactions(r);
      const fr=await S.get("friends",savedUserId); if(fr)setFriends(fr);
      const mp=await S.get("myPost",savedUserId); if(mp)setMyPost(mp);
      const fl=await S.get("folders",savedUserId); if(fl)setFolders(fl);
      const en=await S.get("entries",savedUserId); if(en)setEntries(en);
      const cd=await S.get("cycleStartDate",savedUserId); if(cd)setCycleStartDate(cd);
      const cl=await S.get("cycleLength",savedUserId); if(cl)setCycleLength(cl);
      setLoaded(true);
      if (savedUserId) window.__userId = savedUserId;
    })();
  },[]);

  useEffect(()=>{if(loaded)S.set("habitData",data,window.__userId);},[data,loaded]);
  useEffect(()=>{if(loaded)S.set("habits",habits,window.__userId);},[habits,loaded]);
  useEffect(()=>{if(loaded)S.set("journal",journal,window.__userId);},[journal,loaded]);
  useEffect(()=>{if(loaded)S.set("goals",goals,window.__userId);},[goals,loaded]);
  useEffect(()=>{if(loaded)S.set("reactions",reactions,window.__userId);},[reactions,loaded]);
  useEffect(()=>{if(loaded)S.set("friends",friends,window.__userId);},[friends,loaded]);
  useEffect(()=>{if(loaded)S.set("myPost",myPost,window.__userId);},[myPost,loaded]);
  useEffect(()=>{if(loaded)S.set("folders",folders,window.__userId);},[folders,loaded]);
  useEffect(()=>{if(loaded)S.set("entries",entries,window.__userId);},[entries,loaded]);
  useEffect(()=>{if(loaded&&cycleStartDate)S.set("cycleStartDate",cycleStartDate,window.__userId);},[cycleStartDate,loaded]);
  useEffect(()=>{if(loaded)S.set("cycleLength",cycleLength,window.__userId);},[cycleLength,loaded]);

  const saveProfile = async () => {
    if(!myUsername||!myDisplay||myPin.length<4)return;
    const userId = myUsername;
    try {
      // Check if username exists with different PIN
      const { data: existing } = await supabase.from("profiles").select("id,pin").eq("username", myUsername).single();
      if (existing && existing.pin && existing.pin !== myPin) {
        setPinError("Incorrect PIN for this username");
        return;
      }
      await supabase.from("profiles").upsert({ id: userId, username: myUsername, display_name: myDisplay, avatar: myAvatar, pin: myPin }, { onConflict: "id" });
    } catch {}
    localStorage.setItem("userId", userId);
    localStorage.setItem("userPin", myPin);
    window.__userId = userId;
    S.set("profile",{username:myUsername,display:myDisplay,avatar:myAvatar,pin:myPin}, userId);
    if (cycleStartDate) S.set("cycleStartDate", cycleStartDate, userId);
    S.set("cycleLength", cycleLength, userId);
    setLoaded(true);
    setScreen("app");
  };

  const days=getDaysInMonth(year,month);
  const today=now.getDate();
  const isCurrentMonth=year===now.getFullYear()&&month===now.getMonth();
  const monthKey=`${year}-${String(month+1).padStart(2,"0")}`;
  const dateKey=(d)=>`${monthKey}-${String(d).padStart(2,"0")}`;
  const tk=todayKey();

  const toggle=(day,hid)=>{const k=dateKey(day);setData(p=>({...p,[k]:{...p[k],[hid]:!p[k]?.[hid]}}));};
  const dayScore=(day)=>{const k=dateKey(day);const done=habits.filter(h=>data[k]?.[h.id]).length;return{done,total:habits.length,pct:pct(done,habits.length)};};
  const habitMonthScore=(hid)=>{let done=0;for(let d=1;d<=days;d++){if(data[dateKey(d)]?.[hid])done++;}return{done,pct:pct(done,days)};};

  const monthGoals=goals[monthKey]||[];
  const addGoal=()=>{if(!newGoalText.trim())return;setGoals(p=>({...p,[monthKey]:[...(p[monthKey]||[]),{id:Date.now().toString(),text:newGoalText.trim(),done:false}]}));setNewGoalText("");};

  const react=(username,emoji)=>setReactions(p=>({...p,[username]:{...p[username],[emoji]:((p[username]?.[emoji])||0)+1}}));
  const sendInvite=()=>{const u=inviteUsername.trim().toLowerCase();if(!u)return;if(MOCK_USERS[u]){setFriends(p=>({...p,[u]:"friend"}));setInviteMsg(`Added ${MOCK_USERS[u].displayName}!`);}else setInviteMsg("Invite sent! 🌸");setInviteUsername("");setTimeout(()=>setInviteMsg(""),3000);};

  const openJournal=(day)=>{const k=dateKey(day);setJournalDay(day);setJournalText(journal[k]?.gratitude||"");setJournalPhoto(journal[k]?.photo||null);};
  const saveJournal=()=>{const k=dateKey(journalDay);setJournal(p=>({...p,[k]:{gratitude:journalText,photo:journalPhoto}}));setJournalDay(null);};
  const handleJournalPhoto=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=(ev)=>setJournalPhoto(ev.target.result);r.readAsDataURL(f);};

  const openPost=()=>{setPostText(myPost[tk]?.gratitude||"");setPostPhoto(myPost[tk]?.photo||null);setEditingPost(true);};
  const savePost=()=>{setMyPost(p=>({...p,[tk]:{gratitude:postText,photo:postPhoto}}));setEditingPost(false);};
  const handlePostPhoto=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=(ev)=>setPostPhoto(ev.target.result);r.readAsDataURL(f);};

  const addHabit=(section)=>{if(!newHabitLabel.trim())return;const color=SECTION_COLORS[Math.floor(Math.random()*SECTION_COLORS.length)];setHabits(p=>[...p,{id:`custom_${Date.now()}`,label:newHabitLabel.trim(),emoji:newHabitEmoji,color,section}]);setNewHabitLabel("");setNewHabitEmoji("⭐");setAddingToSection(null);};
  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userPin");
    window.__userId = null;
    setScreen("setup");
    setMyUsername(""); setMyDisplay(""); setMyAvatar("🐛"); setMyPin("");
    setData({}); setHabits(DEFAULT_HABITS); setJournal({}); setGoals({});
    setFriends({luna_girl:"friend"}); setReactions({}); setCycleStartDate(null); setCycleLength(20); setIsNewAccount(true);
  };
  const prevMonth=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);setSelectedDay(null);};
  const nextMonth=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);setSelectedDay(null);};
  const filteredHabits=filterSection==="all"?habits:habits.filter(h=>h.section===filterSection);
  // Compute current cycle day from start date
  const cycleDay = (() => {
    if (!cycleStartDate) return 1;
    const [y,m,d] = cycleStartDate.split("-").map(Number);
    const start = new Date(y, m-1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 1;
    const len = cycleLength || 20;
    return (diff % len) + 1;
  })();
  const ph=getPhase(cycleDay, cycleLength||20);

  // Login handler
  const handleLogin = async () => {
    if (!myUsername || !myPin) return;
    setPinError("");
    try {
      const { data } = await supabase.from("profiles").select("*").eq("username", myUsername).single();
      if (!data) { setPinError("Username not found"); return; }
      if (data.pin !== myPin) { setPinError("Incorrect PIN"); return; }
      setMyDisplay(data.display_name||""); setMyAvatar(data.avatar||"🐛");
      localStorage.setItem("userId", myUsername);
      localStorage.setItem("userPin", myPin);
      window.__userId = myUsername;
      const savedUserId = myUsername;
      const d=await S.get("habitData",savedUserId); if(d)setData(d);
      const h=await S.get("habits",savedUserId); if(h)setHabits(h);
      const j=await S.get("journal",savedUserId); if(j)setJournal(j);
      const g=await S.get("goals",savedUserId); if(g)setGoals(g);
      const fr=await S.get("friends",savedUserId); if(fr)setFriends(fr);
      const mp=await S.get("myPost",savedUserId); if(mp)setMyPost(mp);
      const fl=await S.get("folders",savedUserId); if(fl)setFolders(fl);
      const en=await S.get("entries",savedUserId); if(en)setEntries(en);
      const cd=await S.get("cycleStartDate",savedUserId); if(cd)setCycleStartDate(cd);
      const cl=await S.get("cycleLength",savedUserId); if(cl)setCycleLength(cl);
      setLoaded(true);
      setScreen("app");
    } catch(e) { setPinError("Something went wrong, try again"); }
  };

  if (screen==="setup") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#fdf4ff,#f0fdf4,#fff1f2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:20}}>
      <div style={{maxWidth:420,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:52,marginBottom:8}}>🐛</div>
          <h1 style={{fontSize:28,fontWeight:700,color:"#1f2937",margin:0}}>Allbug's Life</h1>
          <p style={{color:"#9ca3af",fontSize:13,margin:"6px 0 0",fontStyle:"italic"}}>your little wellness world 🌸</p>
        </div>

        {/* Toggle */}
        <div style={{display:"flex",background:"#f3f4f6",borderRadius:12,padding:4,gap:4,marginBottom:20}}>
          <button onClick={()=>{setIsNewAccount(false);setPinError("");}} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:!isNewAccount?"white":"transparent",color:!isNewAccount?"#a855f7":"#6b7280",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:!isNewAccount?"0 1px 4px rgba(0,0,0,0.1)":"none",fontFamily:"Georgia,serif"}}>Log In</button>
          <button onClick={()=>{setIsNewAccount(true);setPinError("");}} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:isNewAccount?"white":"transparent",color:isNewAccount?"#a855f7":"#6b7280",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:isNewAccount?"0 1px 4px rgba(0,0,0,0.1)":"none",fontFamily:"Georgia,serif"}}>Create Account</button>
        </div>

        <div style={{background:"white",borderRadius:20,padding:24,boxShadow:"0 4px 24px rgba(168,85,247,0.12)",border:"1.5px solid #f3e8ff"}}>
          {isNewAccount ? (
            <>
              <p style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#374151"}}>Choose your avatar</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
                {["🐛","🌸","🌿","🦋","🌙","🐾","🌊","🍓","✨","🌻"].map(e=><button key={e} onClick={()=>setMyAvatar(e)} style={{width:40,height:40,borderRadius:10,border:`2px solid ${myAvatar===e?"#a855f7":"#e5e7eb"}`,background:myAvatar===e?"#f3e8ff":"white",fontSize:20,cursor:"pointer"}}>{e}</button>)}
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Display Name</label>
                <input value={myDisplay} onChange={e=>setMyDisplay(e.target.value)} placeholder="e.g. Allie 🌿" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151"}}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Username</label>
                <input value={myUsername} onChange={e=>setMyUsername(e.target.value.toLowerCase().replace(/\s/g,""))} placeholder="e.g. allbug" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151"}}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>PIN (4-6 digits)</label>
                <input value={myPin} onChange={e=>{setPinError("");setMyPin(e.target.value.replace(/[^0-9]/g,"").slice(0,6));}} placeholder="e.g. 1234" type="password" inputMode="numeric"
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${pinError?"#f43f5e":"#e9d5ff"}`,fontSize:18,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151",letterSpacing:4,textAlign:"center"}}/>
                <p style={{margin:"4px 0 0",fontSize:10,color:"#9ca3af",fontStyle:"italic"}}>Use this PIN to log in on any device 🌿</p>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Last period start date</label>
                <input type="date" value={cycleStartDate||""} onChange={e=>setCycleStartDate(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151"}}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Cycle length (days)</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[20,21,24,28,30,32,35].map(n=>(
                    <button key={n} onClick={()=>setCycleLength(n)}
                      style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${cycleLength===n?"#a855f7":"#e5e7eb"}`,background:cycleLength===n?"#f3e8ff":"white",color:cycleLength===n?"#a855f7":"#6b7280",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                      {n}
                    </button>
                  ))}
                </div>
                <p style={{margin:"4px 0 0",fontSize:10,color:"#9ca3af",fontStyle:"italic"}}>Your cycle is {cycleLength} days 🌿</p>
              </div>
              {pinError&&<p style={{margin:"0 0 10px",fontSize:12,color:"#f43f5e",textAlign:"center"}}>{pinError}</p>}
              <button onClick={saveProfile} disabled={!myUsername||!myDisplay||myPin.length<4}
                style={{width:"100%",padding:13,borderRadius:12,border:"none",background:myUsername&&myDisplay&&myPin.length>=4?"linear-gradient(135deg,#c084fc,#a855f7)":"#e5e7eb",color:"white",fontSize:15,fontWeight:700,cursor:myUsername&&myDisplay&&myPin.length>=4?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
                Enter my life 🐛
              </button>
            </>
          ) : (
            <>
              <p style={{margin:"0 0 20px",fontSize:13,color:"#6b7280",textAlign:"center",fontStyle:"italic"}}>Welcome back! 🌸</p>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>Username</label>
                <input value={myUsername} onChange={e=>{setPinError("");setMyUsername(e.target.value.toLowerCase().replace(/\s/g,""));}} placeholder="e.g. allbug"
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151"}}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:5}}>PIN</label>
                <input value={myPin} onChange={e=>{setPinError("");setMyPin(e.target.value.replace(/[^0-9]/g,"").slice(0,6));}} placeholder="••••" type="password" inputMode="numeric"
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${pinError?"#f43f5e":"#e9d5ff"}`,fontSize:18,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151",letterSpacing:6,textAlign:"center"}}/>
              </div>
              {pinError&&<p style={{margin:"0 0 10px",fontSize:12,color:"#f43f5e",textAlign:"center"}}>{pinError}</p>}
              <button onClick={handleLogin} disabled={!myUsername||myPin.length<4}
                style={{width:"100%",padding:13,borderRadius:12,border:"none",background:myUsername&&myPin.length>=4?"linear-gradient(135deg,#c084fc,#a855f7)":"#e5e7eb",color:"white",fontSize:15,fontWeight:700,cursor:myUsername&&myPin.length>=4?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
                Log in 🌿
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );


  return (
    <div style={{fontFamily:"Georgia,serif",minHeight:"100vh",background:"linear-gradient(135deg,#fdf4ff 0%,#f0fdf4 50%,#fff1f2 100%)"}}>

      {/* Cycle setup modal */}
      {showCycleSetup&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowCycleSetup(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:380,background:"white",borderRadius:16,padding:24,boxShadow:"0 8px 32px rgba(168,85,247,0.2)"}}>
            <h3 style={{margin:"0 0 6px",fontSize:16,fontWeight:700,color:"#1f2937"}}>🌙 When did your last period start?</h3>
            <p style={{margin:"0 0 16px",fontSize:12,color:"#9ca3af",fontStyle:"italic"}}>Pick the first day of your most recent period and the app will track your phase automatically 🌿</p>
            <input type="date" value={cycleStartDate||""} onChange={e=>{setCycleStartDate(e.target.value);}}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:14,fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box",color:"#374151",marginBottom:16}}/>
            <div style={{background:"#f3e8ff",borderRadius:10,padding:"10px 12px",marginBottom:16}}>
              <p style={{margin:0,fontSize:12,color:"#a855f7",fontWeight:600}}>
                {cycleStartDate ? `Currently Day ${cycleDay} — ${ph.name} Phase ${ph.emoji}` : "Pick a date to see your phase"}
              </p>
            </div>
            <button onClick={()=>setShowCycleSetup(false)} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#c084fc,#a855f7)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save ✨</button>
          </div>
        </div>
      )}
      {/* Journal modal */}
      {journalDay!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setJournalDay(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"white",borderRadius:"20px 20px 0 0",padding:"20px 16px 40px",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{width:40,height:4,background:"#e5e7eb",borderRadius:99,margin:"0 auto 16px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#1f2937"}}>📸 {MONTH_NAMES[month]} {journalDay}</h3>
              <button onClick={()=>setJournalDay(null)} style={{background:"none",border:"none",fontSize:20,color:"#9ca3af",cursor:"pointer"}}>✕</button>
            </div>
            <input ref={photoRef} type="file" accept="image/*" onChange={handleJournalPhoto} style={{display:"none"}}/>
            {journalPhoto
              ? <div style={{position:"relative",marginBottom:14}}><img src={journalPhoto} alt="" style={{width:"100%",borderRadius:12,maxHeight:220,objectFit:"cover"}}/><button onClick={()=>setJournalPhoto(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.5)",border:"none",color:"white",borderRadius:"50%",width:28,height:28,cursor:"pointer"}}>✕</button></div>
              : <button onClick={()=>photoRef.current?.click()} style={{width:"100%",padding:16,borderRadius:12,border:"2px dashed #e9d5ff",background:"#fafafa",color:"#a855f7",fontSize:13,cursor:"pointer",marginBottom:14,fontFamily:"Georgia,serif"}}>📷 Add a photo</button>
            }
            <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:6}}>Gratitude 🌸</label>
            <textarea value={journalText} onChange={e=>setJournalText(e.target.value)} placeholder="What are you grateful for today?" rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",resize:"none",boxSizing:"border-box",color:"#374151",lineHeight:1.6}}/>
            <button onClick={saveJournal} style={{width:"100%",marginTop:12,padding:13,borderRadius:12,border:"none",background:"linear-gradient(135deg,#c084fc,#a855f7)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save ✨</button>
          </div>
        </div>
      )}

      {/* My post modal */}
      {editingPost&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setEditingPost(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"white",borderRadius:"20px 20px 0 0",padding:"20px 16px 40px",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{width:40,height:4,background:"#e5e7eb",borderRadius:99,margin:"0 auto 16px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#1f2937"}}>📸 Today's Post</h3>
              <button onClick={()=>setEditingPost(false)} style={{background:"none",border:"none",fontSize:20,color:"#9ca3af",cursor:"pointer"}}>✕</button>
            </div>
            <p style={{margin:"0 0 12px",fontSize:11,color:"#9ca3af",fontStyle:"italic"}}>Both photo and gratitude are optional 🌸</p>
            <input ref={postPhotoRef} type="file" accept="image/*" onChange={handlePostPhoto} style={{display:"none"}}/>
            {postPhoto
              ? <div style={{position:"relative",marginBottom:14}}><img src={postPhoto} alt="" style={{width:"100%",borderRadius:12,maxHeight:220,objectFit:"cover"}}/><button onClick={()=>setPostPhoto(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.5)",border:"none",color:"white",borderRadius:"50%",width:28,height:28,cursor:"pointer"}}>✕</button></div>
              : <button onClick={()=>postPhotoRef.current?.click()} style={{width:"100%",padding:16,borderRadius:12,border:"2px dashed #e9d5ff",background:"#fafafa",color:"#a855f7",fontSize:13,cursor:"pointer",marginBottom:14,fontFamily:"Georgia,serif"}}>📷 Add a photo (optional)</button>
            }
            <label style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:6}}>Gratitude (optional) 🌸</label>
            <textarea value={postText} onChange={e=>setPostText(e.target.value)} placeholder="What are you grateful for today?" rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",resize:"none",boxSizing:"border-box",color:"#374151",lineHeight:1.6}}/>
            <button onClick={savePost} style={{width:"100%",marginTop:12,padding:13,borderRadius:12,border:"none",background:"linear-gradient(135deg,#c084fc,#a855f7)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Share with friends ✨</button>
          </div>
        </div>
      )}

      {/* Friend profile modal */}
      {viewingFriend&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setViewingFriend(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"white",borderRadius:"20px 20px 0 0",maxHeight:"85vh",overflowY:"auto",padding:"20px 16px 40px"}}>
            <div style={{width:40,height:4,background:"#e5e7eb",borderRadius:99,margin:"0 auto 16px"}}/>
            {(()=>{const f=MOCK_USERS[viewingFriend];const tier=friends[viewingFriend]||"friend";if(!f)return null;
              const score=pct((f.habits||[]).filter(h=>f.data?.[tk]?.[h.id]).length,(f.habits||[]).length);
              return(<>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><Avatar a={f.avatar} size={44}/><div><p style={{margin:0,fontSize:16,fontWeight:700,color:"#1f2937"}}>{f.displayName}</p><p style={{margin:0,fontSize:11,color:"#9ca3af"}}>@{f.username}</p>{f.bio&&<p style={{margin:"2px 0 0",fontSize:11,color:"#6b7280",fontStyle:"italic"}}>{f.bio}</p>}</div></div>
                  <button onClick={()=>setViewingFriend(null)} style={{background:"none",border:"none",fontSize:20,color:"#9ca3af",cursor:"pointer"}}>✕</button>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  {["friend","bestie"].map(t=><button key={t} onClick={()=>setFriends(p=>({...p,[f.username]:t}))} style={{flex:1,padding:8,borderRadius:10,border:`1.5px solid ${tier===t?"#a855f7":"#e5e7eb"}`,background:tier===t?"#f3e8ff":"white",color:tier===t?"#a855f7":"#6b7280",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t==="friend"?"🌸 Friend":"💕 Bestie"}<br/><span style={{fontSize:9,fontWeight:400,color:"#9ca3af"}}>{t==="friend"?"photo & gratitude":"full transparency"}</span></button>)}
                </div>
                {f.journal?.[tk]?.gratitude&&<p style={{fontSize:13,color:"#4b5563",fontStyle:"italic",background:"#fafafa",padding:"10px 12px",borderRadius:10,borderLeft:"3px solid #e9d5ff",lineHeight:1.6,margin:"0 0 14px"}}>"{f.journal[tk].gratitude}"</p>}
                {tier==="bestie"&&<div><p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:"#a855f7",letterSpacing:1,textTransform:"uppercase"}}>Habit Score — {score}%</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(f.habits||[]).map(h=>{const done=f.data?.[tk]?.[h.id];return(<div key={h.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,background:done?h.color+"22":"#f3f4f6",border:`1.5px solid ${done?h.color+"66":"#e5e7eb"}`}}><span style={{fontSize:11}}>{h.emoji}</span><span style={{fontSize:10,color:done?h.color:"#9ca3af"}}>{h.label}</span></div>);})}</div></div>}
              </>);
            })()}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#f3e8ff,#fce7f3,#d1fae5)",borderBottom:"2px solid #e9d5ff",padding:"18px 16px 14px"}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Avatar a={myAvatar} size={38}/>
              <div>
                <p style={{margin:0,fontSize:10,letterSpacing:2,color:"#a855f7",textTransform:"uppercase"}}>Habit Tracker</p>
                <h1 style={{fontSize:20,fontWeight:700,color:"#1f2937",margin:"1px 0 0"}}>Allbug's Life 🐛</h1>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>openJournal(today)} style={{padding:"7px 12px",borderRadius:20,border:"1.5px solid #e9d5ff",background:journal[tk]?.gratitude||journal[tk]?.photo?"#f3e8ff":"white",color:"#a855f7",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {journal[tk]?.gratitude||journal[tk]?.photo?"📸 ✓":"📸"}
              </button>
              <button onClick={logout} style={{padding:"7px 10px",borderRadius:20,border:"1.5px solid #fecdd3",background:"white",color:"#f43f5e",fontSize:11,fontWeight:700,cursor:"pointer"}}>↩️</button>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10}}>
            <p style={{fontSize:14,fontWeight:600,color:"#6b7280",margin:0}}>{MONTH_NAMES[month]} {year}</p>
            <div style={{display:"flex",gap:6}}>
              <button onClick={prevMonth} style={{width:28,height:28,borderRadius:"50%",border:"1.5px solid #e9d5ff",background:"white",color:"#a855f7",cursor:"pointer",fontSize:14}}>‹</button>
              <button onClick={nextMonth} style={{width:28,height:28,borderRadius:"50%",border:"1.5px solid #e9d5ff",background:"white",color:"#a855f7",cursor:"pointer",fontSize:14}}>›</button>
            </div>
          </div>
          <div style={{display:"flex",gap:6,marginTop:10}}>
            {[
              {label:"Perfect",value:Array.from({length:days},(_,i)=>i+1).filter(d=>dayScore(d).pct===100).length,emoji:"🌟"},
              {label:"Avg",value:Math.round(Array.from({length:isCurrentMonth?today:days},(_,i)=>i+1).reduce((s,d)=>s+dayScore(d).pct,0)/(isCurrentMonth?today:days))+"%",emoji:"📊"},
              {label:"Goals",value:`${monthGoals.filter(g=>g.done).length}/${monthGoals.length}`,emoji:"🎯"},
              {label:"Friends",value:Object.keys(friends).length,emoji:"🌸"},
            ].map(({label,value,emoji})=>(
              <div key={label} style={{flex:1,background:"white",borderRadius:10,padding:"6px 4px",textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{fontSize:13}}>{emoji}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#a855f7"}}>{value}</div>
                <div style={{fontSize:9,color:"#9ca3af"}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{maxWidth:520,margin:"12px auto 0",padding:"0 16px"}}>
        <div style={{display:"flex",background:"#f3f4f6",borderRadius:10,padding:3,gap:2}}>
          {[["grid","📅"],["stats","📊"],["goals","🎯"],["friends","🌸"],["library","📚"],["manage","⚙️"]].map(([k,label])=>(
            <button key={k} onClick={()=>setView(k)} style={{flex:1,padding:"7px 2px",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,background:view===k?"white":"transparent",boxShadow:view===k?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.2s"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:520,margin:"0 auto",padding:"12px 16px 40px"}}>

        {/* GRID */}
        {view==="grid"&&(
          <div>
            {/* Phase card */}
            <div style={{background:ph.light,borderRadius:14,padding:14,marginBottom:14,border:`1.5px solid ${ph.accent}33`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:24}}>{ph.emoji}</span>
                  <div>
                    <p style={{margin:0,fontSize:14,fontWeight:700,color:ph.accent}}>{ph.name} Phase — Day {cycleDay}</p>
                    <p style={{margin:0,fontSize:11,color:ph.accent,fontStyle:"italic"}}>{ph.label}</p>
                  </div>
                </div>
                <button onClick={()=>setShowCycleSetup(true)}
                  style={{padding:"5px 10px",borderRadius:20,border:`1.5px solid ${ph.accent}44`,background:"white",color:ph.accent,cursor:"pointer",fontSize:11,fontWeight:600}}>
                  📅 Day {cycleDay}
                </button>
              </div>
              <p style={{margin:"0 0 10px",fontSize:12,color:"#374151",lineHeight:1.6}}>{ph.desc}</p>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1,background:"white",borderRadius:10,padding:"10px 12px"}}>
                  <p style={{margin:"0 0 5px",fontSize:10,fontWeight:700,color:ph.accent,letterSpacing:1,textTransform:"uppercase"}}>Movement</p>
                  {ph.workouts.map(w=><p key={w} style={{margin:"3px 0",fontSize:11,color:"#374151"}}>• {w}</p>)}
                </div>
                <div style={{flex:1,background:"white",borderRadius:10,padding:"10px 12px"}}>
                  <p style={{margin:"0 0 5px",fontSize:10,fontWeight:700,color:ph.accent,letterSpacing:1,textTransform:"uppercase"}}>Nourish</p>
                  {ph.foods.map(f=><p key={f} style={{margin:"3px 0",fontSize:11,color:"#374151"}}>• {f}</p>)}
                </div>
              </div>
              <div style={{background:"white",borderRadius:10,padding:"10px 12px",borderLeft:`3px solid ${ph.accent}`}}>
                <p style={{margin:"0 0 4px",fontSize:10,fontWeight:700,color:ph.accent,letterSpacing:1,textTransform:"uppercase"}}>ADHD + Hormones</p>
                <p style={{margin:0,fontSize:11,color:"#374151",lineHeight:1.6}}>{ph.adhd}</p>
              </div>
              <p style={{margin:"8px 0 0",fontSize:11,color:ph.accent,fontWeight:600,textAlign:"center"}}>{ph.energy}</p>
            </div>

            {/* Legend */}
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {[["#f3f4f6","0%"],["#fecdd3","<30%"],["#fde68a","30-60%"],["#bbf7d0","60-85%"],["#86efac","85-100%"]].map(([c,l])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:10,height:10,borderRadius:3,background:c,border:"1px solid #e5e7eb"}}/><span style={{fontSize:9,color:"#9ca3af"}}>{l}</span></div>
              ))}
            </div>

            {/* Calendar */}
            <div style={{background:"white",borderRadius:14,padding:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
                {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#9ca3af"}}>{d}</div>)}
              </div>
              {(()=>{
                const firstDay=new Date(year,month,1).getDay();const cells=[];
                for(let i=0;i<firstDay;i++)cells.push(<div key={`e${i}`}/>);
                for(let d=1;d<=days;d++){
                  const score=dayScore(d);const isToday=isCurrentMonth&&d===today;
                  const isFuture=isCurrentMonth&&d>today;const isSelected=selectedDay===d;
                  const hasJ=!!(journal[dateKey(d)]?.gratitude||journal[dateKey(d)]?.photo);
                  cells.push(<button key={d} onClick={()=>setSelectedDay(isSelected?null:d)}
                    style={{aspectRatio:"1",borderRadius:8,border:isToday?"2px solid #a855f7":isSelected?"2px solid #f472b6":"1.5px solid transparent",background:isFuture?"#f9fafb":getCellColor(score.pct),cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
                    <span style={{fontSize:11,fontWeight:isToday?700:500,color:isFuture?"#d1d5db":"#374151"}}>{d}</span>
                    {!isFuture&&score.done>0&&<span style={{fontSize:7,color:"#6b7280"}}>{score.done}/{score.total}</span>}
                    {hasJ&&<span style={{position:"absolute",top:2,right:3,fontSize:7}}>📸</span>}
                  </button>);
                }
                return <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>{cells}</div>;
              })()}
            </div>

            {/* Day detail */}
            {selectedDay&&(
              <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 12px rgba(168,85,247,0.15)",border:"1.5px solid #e9d5ff",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#1f2937"}}>{MONTH_NAMES[month]} {selectedDay}</h3>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <button onClick={()=>openJournal(selectedDay)} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:"1.5px solid #e9d5ff",background:journal[dateKey(selectedDay)]?.gratitude?"#f3e8ff":"white",color:"#a855f7",cursor:"pointer",fontWeight:600}}>{journal[dateKey(selectedDay)]?.gratitude?"✏️ Journal":"📸 Journal"}</button>
                    <button onClick={()=>setSelectedDay(null)} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:16}}>✕</button>
                  </div>
                </div>
                {(journal[dateKey(selectedDay)]?.photo||journal[dateKey(selectedDay)]?.gratitude)&&(
                  <div style={{marginBottom:12,background:"#fafafa",borderRadius:10,overflow:"hidden",border:"1px solid #f3f4f6"}}>
                    {journal[dateKey(selectedDay)]?.photo&&<img src={journal[dateKey(selectedDay)].photo} alt="" style={{width:"100%",maxHeight:150,objectFit:"cover"}}/>}
                    {journal[dateKey(selectedDay)]?.gratitude&&<p style={{margin:0,padding:"8px 12px",fontSize:12,color:"#4b5563",fontStyle:"italic"}}>🌸 "{journal[dateKey(selectedDay)].gratitude}"</p>}
                  </div>
                )}
                {SECTION_META.map(sec=>{
                  const sh=habits.filter(h=>h.section===sec.key);if(!sh.length)return null;
                  return(<div key={sec.key} style={{marginBottom:10}}>
                    <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:sec.accent,letterSpacing:1,textTransform:"uppercase"}}>{sec.label}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {sh.map(h=>{const done=data[dateKey(selectedDay)]?.[h.id];return(<button key={h.id} onClick={()=>toggle(selectedDay,h.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,border:`1.5px solid ${done?h.color:"#e5e7eb"}`,background:done?h.color+"22":"#f9fafb",cursor:"pointer"}}><span style={{fontSize:11}}>{h.emoji}</span><span style={{fontSize:11,color:done?h.color:"#6b7280",fontWeight:done?600:400}}>{h.label}</span>{done&&<span style={{fontSize:9,color:h.color}}>✓</span>}</button>);})}
                    </div>
                  </div>);
                })}
              </div>
            )}
          </div>
        )}

        {/* STATS */}
        {view==="stats"&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
              {[{key:"all",label:"All"},...SECTION_META].map(s=><button key={s.key} onClick={()=>setFilterSection(s.key)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${filterSection===s.key?"#a855f7":"#e5e7eb"}`,background:filterSection===s.key?"#f3e8ff":"white",color:filterSection===s.key?"#a855f7":"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{s.label}</button>)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredHabits.map(h=>{const score=habitMonthScore(h.id);return(
                <div key={h.id} style={{background:"white",borderRadius:12,padding:"12px 14px",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{h.emoji}</span><span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{h.label}</span></div>
                    <span style={{fontSize:14,fontWeight:700,color:h.color}}>{score.pct}%</span>
                  </div>
                  <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                    {Array.from({length:isCurrentMonth?today:days},(_,i)=>i+1).map(d=><div key={d} onClick={()=>toggle(d,h.id)} style={{width:10,height:10,borderRadius:3,background:data[dateKey(d)]?.[h.id]?h.color:"#f3f4f6",border:`1px solid ${data[dateKey(d)]?.[h.id]?h.color+"88":"#e5e7eb"}`,cursor:"pointer"}}/>)}
                  </div>
                  <div style={{height:4,background:"#f3f4f6",borderRadius:99,overflow:"hidden",marginTop:8}}><div style={{height:"100%",width:`${score.pct}%`,background:`linear-gradient(90deg,${h.color}88,${h.color})`,borderRadius:99}}/></div>
                </div>
              );})}
            </div>
          </div>
        )}

        {/* GOALS */}
        {view==="goals"&&(
          <div>
            <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:14,border:"1.5px solid #e9d5ff"}}>
              <h3 style={{margin:"0 0 4px",fontSize:16,fontWeight:700,color:"#1f2937"}}>🎯 {MONTH_NAMES[month]} Goals</h3>
              <p style={{margin:"0 0 14px",fontSize:12,color:"#9ca3af",fontStyle:"italic"}}>Add goals for the month — tap ✕ to remove</p>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input value={newGoalText} onChange={e=>setNewGoalText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal()} placeholder="Add a monthly goal..." style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",color:"#374151"}}/>
                <button onClick={addGoal} style={{padding:"10px 14px",borderRadius:10,border:"none",background:"#a855f7",color:"white",fontSize:18,cursor:"pointer"}}>+</button>
              </div>
              {monthGoals.length===0
                ? <div style={{textAlign:"center",padding:"20px 0",color:"#d1d5db"}}><div style={{fontSize:28,marginBottom:6}}>🌱</div><p style={{margin:0,fontSize:12,fontStyle:"italic"}}>No goals yet!</p></div>
                : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {monthGoals.map(g=>(
                      <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:g.done?"#f3e8ff":"#fafafa",border:`1.5px solid ${g.done?"#e9d5ff":"#f3f4f6"}`}}>
                        <button onClick={()=>setGoals(p=>({...p,[monthKey]:(p[monthKey]||[]).map(x=>x.id===g.id?{...x,done:!x.done}:x)}))} style={{width:22,height:22,borderRadius:6,border:`2px solid ${g.done?"#a855f7":"#d1d5db"}`,background:g.done?"#a855f7":"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>{g.done&&<span style={{color:"white",fontSize:12}}>✓</span>}</button>
                        <span style={{flex:1,fontSize:13,color:g.done?"#9ca3af":"#374151",textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
                        <button onClick={()=>setGoals(p=>({...p,[monthKey]:(p[monthKey]||[]).filter(x=>x.id!==g.id)}))} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:16,flexShrink:0}}>✕</button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* FRIENDS */}
        {view==="friends"&&(
          <div>
            <div style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(168,85,247,0.1)",border:"1.5px solid #f3e8ff",marginBottom:14}}>
              {myPost[tk]?.photo&&<img src={myPost[tk].photo} alt="" style={{width:"100%",height:140,objectFit:"cover"}}/>}
              {!myPost[tk]?.photo&&<div style={{width:"100%",height:56,background:"linear-gradient(135deg,#f3e8ff,#fce7f3,#d1fae5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🌸</div>}
              <div style={{padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><Avatar a={myAvatar} size={30}/><div><p style={{margin:0,fontSize:13,fontWeight:700,color:"#1f2937"}}>{myDisplay}</p><p style={{margin:0,fontSize:10,color:"#a855f7"}}>@{myUsername} · you</p></div></div>
                  <button onClick={openPost} style={{fontSize:11,padding:"5px 12px",borderRadius:20,border:"1.5px solid #e9d5ff",background:"#f3e8ff",color:"#a855f7",cursor:"pointer",fontWeight:700}}>{myPost[tk]?.gratitude||myPost[tk]?.photo?"✏️ Edit Post":"📸 Add Post"}</button>
                </div>
                {myPost[tk]?.gratitude&&<p style={{margin:0,fontSize:12,color:"#4b5563",fontStyle:"italic",background:"#fafafa",padding:"8px 10px",borderRadius:8,borderLeft:"3px solid #e9d5ff",lineHeight:1.5}}>"{myPost[tk].gratitude}"</p>}
                {!myPost[tk]?.gratitude&&!myPost[tk]?.photo&&<p style={{margin:0,fontSize:12,color:"#d1d5db",fontStyle:"italic"}}>Share a photo or gratitude with friends today 🌿</p>}
              </div>
            </div>
            <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:14,border:"1.5px solid #f3e8ff"}}>
              <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:"#1f2937"}}>🌸 Invite a Friend</h3>
              <div style={{display:"flex",gap:8}}>
                <input value={inviteUsername} onChange={e=>setInviteUsername(e.target.value.toLowerCase())} onKeyDown={e=>e.key==="Enter"&&sendInvite()} placeholder="@username" style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid #e9d5ff",fontSize:13,fontFamily:"Georgia,serif",outline:"none",color:"#374151"}}/>
                <button onClick={sendInvite} style={{padding:"10px 14px",borderRadius:10,border:"none",background:"#a855f7",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
              </div>
              {inviteMsg&&<p style={{margin:"8px 0 0",fontSize:12,color:"#a855f7",fontStyle:"italic"}}>{inviteMsg}</p>}
              <p style={{margin:"8px 0 0",fontSize:10,color:"#d1d5db",fontStyle:"italic"}}>Try: luna_girl · river_rae</p>
            </div>
            {Object.entries(friends).map(([username,tier])=>{
              const realFriendCount = Object.keys(friends).filter(u=>u!=="luna_girl").length;
              const friend=MOCK_USERS[username];
              if(!friend)return null;
              if(username==="luna_girl"&&realFriendCount>0)return null;
              const score=pct((friend.habits||[]).filter(h=>friend.data?.[tk]?.[h.id]).length,(friend.habits||[]).length);
              return(
                <div key={username} style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(168,85,247,0.1)",border:"1.5px solid #f3e8ff",marginBottom:12}}>
                  {friend.journal?.[tk]?.photo?<img src={friend.journal[tk].photo} alt="" style={{width:"100%",height:140,objectFit:"cover"}}/>:<div style={{width:"100%",height:56,background:"linear-gradient(135deg,#f3e8ff,#fce7f3,#d1fae5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🌸</div>}
                  <div style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}><Avatar a={friend.avatar} size={30}/><div><p style={{margin:0,fontSize:13,fontWeight:700,color:"#1f2937"}}>{friend.displayName}</p><p style={{margin:0,fontSize:10,color:"#9ca3af"}}>@{friend.username}</p></div></div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:tier==="bestie"?"#fce7f3":"#f3e8ff",color:tier==="bestie"?"#db2777":"#a855f7",fontWeight:700}}>{tier==="bestie"?"💕 bestie":"🌸 friend"}</span>
                        <button onClick={()=>setViewingFriend(friend.username)} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:"1.5px solid #e9d5ff",background:"white",color:"#a855f7",cursor:"pointer",fontWeight:600}}>View</button>
                      </div>
                    </div>
                    {friend.journal?.[tk]?.gratitude&&<p style={{margin:"0 0 10px",fontSize:12,color:"#4b5563",fontStyle:"italic",background:"#fafafa",padding:"8px 10px",borderRadius:8,borderLeft:"3px solid #e9d5ff",lineHeight:1.5}}>"{friend.journal[tk].gratitude}"</p>}
                    {tier==="bestie"&&<div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,color:"#9ca3af"}}>Today's habits</span><span style={{fontSize:10,fontWeight:700,color:"#a855f7"}}>{score}%</span></div><div style={{height:5,background:"#f3f4f6",borderRadius:99}}><div style={{height:"100%",width:`${score}%`,background:"linear-gradient(90deg,#c084fc,#a855f7)",borderRadius:99}}/></div></div>}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {REACTIONS.map(r=>{const ct=reactions[username]?.[r]||0;return(<button key={r} onClick={()=>react(username,r)} style={{padding:"3px 7px",borderRadius:20,border:`1.5px solid ${ct>0?"#e9d5ff":"#f3f4f6"}`,background:ct>0?"#f3e8ff":"#fafafa",cursor:"pointer",fontSize:12}}>{r}{ct>0&&<span style={{fontSize:10,color:"#a855f7",fontWeight:700,marginLeft:2}}>{ct}</span>}</button>);})}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIBRARY */}
        {view==="library"&&(
          <div>
            <div style={{marginBottom:14}}>
              <h2 style={{margin:"0 0 2px",fontSize:18,fontWeight:700,color:"#1f2937"}}>📚 Life Library</h2>
              <p style={{margin:0,fontSize:12,color:"#9ca3af",fontStyle:"italic"}}>Recipes, hacks, tips — never lost again 🌿</p>
            </div>
            <LibraryView folders={folders} setFolders={setFolders} entries={entries} setEntries={setEntries}/>
          </div>
        )}

        {/* MANAGE */}
        {view==="manage"&&(
          <div>
            <p style={{fontSize:12,color:"#9ca3af",fontStyle:"italic",marginBottom:14}}>Add or remove habits from any section — including defaults 🌿</p>
            {SECTION_META.map(sec=>{
              const sh=habits.filter(h=>h.section===sec.key);const isAdding=addingToSection===sec.key;
              return(<div key={sec.key} style={{background:"white",borderRadius:14,padding:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:12,border:`1.5px solid ${isAdding?sec.accent+"44":"#f3f4f6"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <h3 style={{margin:0,fontSize:14,fontWeight:700,color:sec.accent}}>{sec.label}</h3>
                  <button onClick={()=>setAddingToSection(isAdding?null:sec.key)} style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${sec.accent}`,background:isAdding?sec.accent:"white",color:isAdding?"white":sec.accent,fontSize:11,fontWeight:600,cursor:"pointer"}}>{isAdding?"Cancel":"+ Add"}</button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:isAdding?12:0}}>
                  {sh.map(h=>(<div key={h.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:20,background:h.color+"18",border:`1.5px solid ${h.color+"44"}`}}><span style={{fontSize:11}}>{h.emoji}</span><span style={{fontSize:11,color:"#374151"}}>{h.label}</span><button onClick={()=>setHabits(p=>p.filter(x=>x.id!==h.id))} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:11,padding:"0 0 0 2px"}}>✕</button></div>))}
                </div>
                {isAdding&&(
                  <div style={{borderTop:`1px solid ${sec.accent}22`,paddingTop:12}}>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                      {EMOJI_OPTIONS.map(e=><button key={e} onClick={()=>setNewHabitEmoji(e)} style={{width:30,height:30,borderRadius:8,border:`2px solid ${newHabitEmoji===e?sec.accent:"transparent"}`,background:newHabitEmoji===e?sec.accent+"22":"white",cursor:"pointer",fontSize:14}}>{e}</button>)}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <input value={newHabitLabel} onChange={e=>setNewHabitLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHabit(sec.key)} placeholder="Habit name..." style={{flex:1,padding:"9px 12px",borderRadius:10,border:`1.5px solid ${sec.accent}44`,fontSize:13,fontFamily:"Georgia,serif",outline:"none",color:"#374151"}}/>
                      <button onClick={()=>addHabit(sec.key)} style={{padding:"9px 14px",borderRadius:10,border:"none",background:sec.accent,color:"white",fontSize:16,cursor:"pointer",fontWeight:700}}>+</button>
                    </div>
                  </div>
                )}
              </div>);
            })}
          </div>
        )}
      </div>
    </div>
  );
}
