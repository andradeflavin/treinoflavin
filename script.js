/* CONFIG */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9b2FKBRe00ngdkBE8bSiC47MDdGJROwM-6FtxRy8htDIev5BZ5Z-SyxAXtz_2KzLxyHn-MiEcJaCj/pub?gid=784473971&single=true&output=csv";
const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(SHEET_URL);

/* ELEMENTS */
const fichaContainer = document.getElementById("ficha");
const fichaSelect = document.getElementById("fichaSelect");
const treinoSelect = document.getElementById("treinoSelect");
const statusEl = document.getElementById("status");
const limparBtn = document.getElementById("limparProgresso");

/* STORAGE HELPERS */
const saveKey = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const loadKey = (k) => {
  const raw = localStorage.getItem(k);
  return raw ? JSON.parse(raw) : null;
};

/* dados carregados */
let dadosPlanilha = [];

/* UTIL: cria SVG fallback com iniciais do nome do exercício */
function svgFallback(text, w = 400, h = 300, bg = "#eef2ff", fg = "#0f172a") {
  const initials = (text || "EX").split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-size='48' fill='${fg}'>${initials}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* Carrega a planilha via proxy e normaliza colunas */
async function carregarFicha() {
  try {
    fichaContainer.innerHTML = "<p>Carregando ficha...</p>";
    const res = await fetch(PROXY_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const csv = await res.text();
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    if (!parsed || !parsed.data || !parsed.data.length) throw new Error("Planilha vazia");

    // normalizar colunas (endereçar variações de nome)
    dadosPlanilha = parsed.data.map(row => {
      // busca por chaves parecidas (case-insensitive, trim)
      const get = (names) => {
        for (const n of names) {
          const key = Object.keys(row).find(k => k && k.trim().toLowerCase() === n.toLowerCase());
          if (key) return (row[key] || "").toString().trim();
        }
        return "";
      };
      return {
        Ficha: get(["Ficha","ficha","Planilha","Sheet"]) || "Padrão",
        Treino: get(["Treino","treinos","Treino "]) || "Sem treino",
        Grupo: get(["Grupo","Grupo Muscular","Grupo Muscular "]) || "-",
        Exercicio: get(["Exercício","Exercicio","Exercício "]) || "-",
        Series: get(["Séries","Series","Séries "]) || "-",
        Reps: get(["Reps","Repetições","Repeticoes"]) || "-",
        Descanso: get(["Descanso (s)","Descanso","Descanso(s)"]) || "",
        Execucao: get(["Execução / Técnica","Execução / Técnica ","Execução","Execucao"]) || "",
        Obs: get(["Observações","Observacoes","Obs"]) || "",
        Carga: get(["Carga (kg)","Carga","Carga (kg) "]) || 0
      };
    });

    // popular select de fichas
    const fichas = [...new Set(dadosPlanilha.map(d => d.Ficha))];
    fichaSelect.innerHTML = `<option value="Todos">Todas</option>` + fichas.map(f => `<option value="${f}">${f}</option>`).join("");

    // popular select de treinos (todos inicialmente)
    const treinos = [...new Set(dadosPlanilha.map(d => d.Treino))];
    treinoSelect.innerHTML = `<option value="Todos">Todos</option>` + treinos.map(t => `<option value="${t}">${t}</option>`).join("");

    // eventos
    fichaSelect.onchange = onFilterChange;
    treinoSelect.onchange = onFilterChange;
    limparBtn.onclick = () => {
      if (confirm("Limpar todo o progresso salvo (cargas e concluídos)?")) {
        // remove keys criadas por esse app (prefixo FlavinShape_)
        Object.keys(localStorage).forEach(k => { if (k.startsWith("FlavinShape_")) localStorage.removeItem(k); });
        renderExercicios([]);
        aplicarFiltros(); // re-render
      }
    };

    aplicarFiltros();
  } catch (err) {
    console.error("Erro ao carregar planilha:", err);
    fichaContainer.innerHTML = `<p>❌ Erro ao carregar ficha. (${err.message})</p><p>Verifique publicação e republique se necessário.</p>`;
  }
}

/* quando qualquer filtro muda: atualizar lista e atualizar treinos disponíveis de acordo com a ficha selecionada */
function onFilterChange() {
  // quando trocar ficha, recalcule os treinos disponíveis para essa ficha
  const ficha = fichaSelect.value;
  if (ficha !== "Todos") {
    const treinosNaFicha = [...new Set(dadosPlanilha.filter(r=>r.Ficha===ficha).map(r=>r.Treino))];
    // repovoa treinoSelect com esses valores + "Todos"
    treinoSelect.innerHTML = `<option value="Todos">Todos</option>` + treinosNaFicha.map(t => `<option value="${t}">${t}</option>`).join("");
  } else {
    // repor todos os treinos
    const allTreinos = [...new Set(dadosPlanilha.map(r=>r.Treino))];
    treinoSelect.innerHTML = `<option value="Todos">Todos</option>` + allTreinos.map(t => `<option value="${t}">${t}</option>`).join("");
  }
  aplicarFiltros();
}

/* aplica filtros Ficha + Treino e renderiza agrupado por Treino (títulos visíveis) */
function aplicarFiltros() {
  const ficha = fichaSelect.value;
  const treino = treinoSelect.value;

  let filtered = dadosPlanilha.slice();
  if (ficha !== "Todos") filtered = filtered.filter(r => r.Ficha === ficha);
  if (treino !== "Todos") filtered = filtered.filter(r => r.Treino === treino);

  renderExercicios(filtered);
}

/* render agrupado por treino */
function renderExercicios(lista) {
  fichaContainer.innerHTML = "";
  if (!lista || !lista.length) {
    fichaContainer.innerHTML = "<div class='treino-group'><div class='treino-titulo'>Nenhum exercício encontrado</div></div>";
    return;
  }

  const grouped = lista.reduce((acc, ex) => {
    const key = ex.Treino || "Sem treino";
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([treinoNome, items]) => {
    const group = document.createElement("div");
    group.className = "treino-group";
    const titulo = document.createElement("div");
    titulo.className = "treino-titulo";
    titulo.textContent = treinoNome;
    group.appendChild(titulo);

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "exercicio";

      const left = document.createElement("div");
      left.className = "left";
      const img = document.createElement("img");
      // tentativa de imagem de banco público (Unsplash Source). Caso falhe, fallback SVG gerado com iniciais
      const remote = `https://source.unsplash.com/300x200/?gym,${encodeURIComponent(item.Exercicio)}`;
      img.src = remote;
      img.alt = item.Exercicio || "exercício";
      img.onerror = () => { img.src = svgFallback(item.Exercicio, 300, 200); };
      left.appendChild(img);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `
        <h3>${item.Exercicio}</h3>
        <div class="row"><strong>Grupo:</strong> ${item.Grupo}</div>
        <div class="row"><strong>Séries:</strong> ${item.Series} · <strong>Reps:</strong> ${item.Reps}</div>
        <div class="row"><strong>Execução:</strong> ${item.Execucao || "-"}</div>
        <div class="row"><strong>Obs:</strong> ${item.Obs || "-"}</div>
      `;

      // controle de progresso por item (chave única)
      const key = `FlavinShape_${item.Ficha}__${item.Treino}__${item.Exercicio}`;
      const progresso = loadKey(key) || {};

      // controles: carga + botões
      const controls = document.createElement("div");
      controls.className = "controls-inline";

      // input carga
      const inputCarga = document.createElement("input");
      inputCarga.type = "number";
      inputCarga.min = "0";
      inputCarga.className = "input-carga";
      inputCarga.value = progresso.carga ?? item.Carga ?? 0;
      inputCarga.onchange = () => {
        const novo = { ...(loadKey(key) || {}), carga: inputCarga.value };
        saveKey(key, novo);
      };
      controls.appendChild(inputCarga);

      // botão concluir
      const btnConcluir = document.createElement("button");
      btnConcluir.className = "btn";
      const isConcluido = progresso.concluido;
      if (isConcluido) { card.classList.add("concluido"); btnConcluir.textContent = "✅ Concluído"; }
      else btnConcluir.textContent = "✔ Concluir";

      btnConcluir.onclick = () => {
        const novoEstado = !(loadKey(key)?.concluido);
        const novo = { ...(loadKey(key) || {}), concluido: novoEstado, carga: inputCarga.value };
        saveKey(key, novo);
        if (novoEstado) { card.classList.add("concluido"); btnConcluir.textContent = "✅ Concluído"; }
        else { card.classList.remove("concluido"); btnConcluir.textContent = "✔ Concluir"; }
      };
      controls.appendChild(btnConcluir);

      // cronômetro (só se houver descanso numérico)
      const descansoNum = parseInt(item.Descanso);
      if (!Number.isNaN(descansoNum) && descansoNum > 0) {
        const btnTimer = document.createElement("button");
        btnTimer.className = "btn ghost";
        btnTimer.textContent = `⏱ ${descansoNum}s`;
        btnTimer.onclick = () => iniciarTimer(descansoNum, btnTimer);
        controls.appendChild(btnTimer);
      }

      card.appendChild(left);
      card.appendChild(meta);
      card.appendChild(controls);

      group.appendChild(card);
    });

    fichaContainer.appendChild(group);
  });
}

/* cronometro simples */
function iniciarTimer(segundos, botao) {
  let restante = parseInt(segundos);
  botao.disabled = true;
  const originalText = botao.textContent;
  botao.textContent = `⏱ ${restante}s`;
  const interval = setInterval(() => {
    restante--;
    botao.textContent = `⏱ ${restante}s`;
    if (restante <= 0) {
      clearInterval(interval);
      botao.textContent = "✅ Descanso!";
      setTimeout(() => {
        botao.disabled = false;
        botao.textContent = originalText;
      }, 1500);
    }
  }, 1000);
}

/* iniciar */
carregarFicha();
