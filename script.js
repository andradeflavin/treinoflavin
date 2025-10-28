:root{
  --primary:#3463e6;
  --muted:#6b7280;
  --bg:#fbfcfe;
  --card:#ffffff;
  --accent:#ffb86b;
  --radius:12px;
  --glass: rgba(255,255,255,0.6);
  --max-width:960px;
}

*{box-sizing:border-box}
body{
  font-family:Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  background:linear-gradient(180deg,#f8fafc 0%, #ffffff 60%);
  color:#111827;
  margin:0;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

.site-header{
  display:flex;
  flex-direction:column;
  gap:.6rem;
  align-items:center;
  padding:1.1rem;
  background:linear-gradient(90deg,var(--primary),#2b50d4);
  color:white;
  border-bottom-left-radius:18px;
  border-bottom-right-radius:18px;
}

.brand h1{margin:0;font-size:1.25rem;letter-spacing:0.4px}
.brand .tag{margin-top:2px;color:rgba(255,255,255,0.9);font-size:.85rem}

.controls{
  display:flex;
  gap:.75rem;
  margin-top:.6rem;
  flex-wrap:wrap;
  align-items:center;
  justify-content:center;
  width:100%;
}

.control{display:flex;flex-direction:column;align-items:flex-start;color:white}
.control label{font-size:.75rem;opacity:.95;margin-bottom:.25rem}
.control select{padding:.45rem .6rem;border-radius:8px;border:none;min-width:160px}
.control.small button{
  background:rgba(255,255,255,0.12);color:white;padding:.45rem .7rem;border-radius:8px;border:1px solid rgba(255,255,255,0.08);
}
.control.small button:hover{background:rgba(255,255,255,0.16)}

.container{
  max-width:var(--max-width);
  margin:1.25rem auto;
  padding:0 1rem 2rem;
}

/* group title */
.treino-group{margin-bottom:1.2rem}
.treino-titulo{
  background:var(--card);
  padding:.6rem .8rem;
  border-radius:10px;
  box-shadow:0 6px 18px rgba(15,23,42,0.04);
  font-weight:600;
  color:#0f172a;
  margin-bottom:.6rem;
}

/* exercise card */
.exercicio{
  display:flex;
  gap:1rem;
  align-items:center;
  background:var(--card);
  border-radius:12px;
  padding:.9rem;
  box-shadow:0 6px 18px rgba(15,23,42,0.04);
  margin-bottom:.7rem;
}

.exercicio .left{
  width:88px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
}
.exercicio img{
  width:88px;height:64px;object-fit:cover;border-radius:8px;background:#f3f4f6;border:1px solid #eef2f7;
}

.exercicio .meta{flex:1;min-width:0}
.exercicio h3{font-size:1rem;margin:0 0 .25rem 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row{font-size:.88rem;color:var(--muted);margin-bottom:.25rem}
.controls-inline{display:flex;gap:.5rem;align-items:center;margin-top:.35rem}
.input-carga{width:96px;padding:.3rem .5rem;border-radius:8px;border:1px solid #e6eefc}

.btn{
  background:var(--primary);color:white;padding:.45rem .6rem;border-radius:8px;border:none;cursor:pointer;font-weight:600;
}
.btn.ghost{background:transparent;border:1px solid rgba(15,23,42,0.06);color:#0f172a}
.exercicio.concluido{opacity:.45;filter:grayscale(.2);text-decoration:line-through}

.site-footer{max-width:var(--max-width);margin:0 auto 2rem;padding:1rem;text-align:center;color:var(--muted)}
@media (max-width:720px){
  .exercicio{flex-direction:row;gap:.6rem}
  .control select{min-width:120px}
}
