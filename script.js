const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9b2FKBRe00ngdkBE8bSiC47MDdGJROwM-6FtxRy8htDIev5BZ5Z-SyxAXtz_2KzLxyHn-MiEcJaCj/pub?gid=784473971&single=true&output=csv";
const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(SHEET_URL);

const fichaContainer = document.getElementById("ficha");
const fichaSelect = document.getElementById("fichaSelect");
const treinoSelect = document.getElementById("treinoSelect");
const limparBtn = document.getElementById("limparProgresso");

const saveKey = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const loadKey = (k) => {
  const raw = localStorage.getItem(k);
  return raw ? JSON.parse(raw) : null;
};

let dadosPlanilha = [];

function limparTexto(t) {
  return (t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

async function carregarFicha() {
  try {
    fichaContainer.innerHTML = "<p>Carregando ficha...</p>";
    const res = await fetch(PROXY_URL);
    if (!res.ok) throw new Error("Erro HTTP " + res.status);
    const csv = await res.text();

    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    if (!parsed.data || parsed.data.length === 0)
      throw new Error("Planilha vazia");

    const headers = parsed.meta.fields.map((h) => limparTexto(h));

    const idxFicha = headers.findIndex((h) => h.startsWith("ficha"));
    const idxTreino = headers.findIndex((h) => h.startsWith("treino"));
    const idxGrupo = headers.findIndex((h) => h.includes("grup"));
    const idxExercicio = headers.findIndex((h) => h.includes("exer"));
    const idxSeries = headers.findIndex((h) => h.includes("seri"));
    const idxReps = headers.findIndex((h) => h.includes("rep"));
    const idxDescanso = headers.findIndex((h) => h.includes("desc"));
    const idxExecucao = headers.findIndex((h) => h.includes("exec"));
    const idxObs = headers.findIndex((h) => h.includes("obs"));
    const idxCarga = headers.findIndex((h) => h.includes("carga"));

    dadosPlanilha = parsed.data.map((row) => {
      const values = Object.values(row);
      return {
        Ficha: values[idxFicha] || "Padrão",
        Treino: values[idxTreino] || "Sem treino",
        Grupo: values[idxGrupo] || "-",
        Exercicio: values[idxExercicio] || "-",
        Series: values[idxSeries] || "-",
        Reps: values[idxReps] || "-",
        Descanso: values[idxDescanso] || "",
        Execucao: values[idxExecucao] || "",
        Obs: values[idxObs] || "",
        Carga: values[idxCarga] || 0,
      };
    });

    const fichas = [...new Set(dadosPlanilha.map((r) => r.Ficha).filter(Boolean))];
    fichaSelect.innerHTML = fichas
      .map((f) => `<option value="${f}">${f}</option>`)
      .join("");

    const treinos = [...new Set(dadosPlanilha.map((r) => r.Treino))];
    treinoSelect.innerHTML =
      `<option value="Todos">Todos</option>` +
      treinos.map((t) => `<option value="${t}">${t}</option>`).join("");

    fichaSelect.addEventListener("change", atualizarTreinos);
    treinoSelect.addEventListener("change", aplicarFiltros);
    limparBtn.addEventListener("click", limparProgresso);

    aplicarFiltros();
  } catch (err) {
    console.error(err);
    fichaContainer.innerHTML = `<p>❌ Erro ao carregar ficha: ${err.message}</p>`;
  }
}

function atualizarTreinos() {
  const fichaSelecionada = fichaSelect.value;
  const treinos = [
    ...new Set(
      dadosPlanilha
        .filter((r) => r.Ficha === fichaSelecionada)
        .map((r) => r.Treino)
    ),
  ];
  treinoSelect.innerHTML =
    `<option value="Todos">Todos</option>` +
    treinos.map((t) => `<option value="${t}">${t}</option>`).join("");
  aplicarFiltros();
}

function aplicarFiltros() {
  const ficha = fichaSelect.value;
  const treino = treinoSelect.value;

  let filtrados = dadosPlanilha.filter((r) => r.Ficha === ficha);
  if (treino !== "Todos")
    filtrados = filtrados.filter((r) => r.Treino === treino);

  renderExercicios(filtrados);
}

function renderExercicios(lista) {
  fichaContainer.innerHTML = "";
  if (!lista.length) {
    fichaContainer.innerHTML = "<p>Nenhum exercício encontrado.</p>";
    return;
  }

  const grouped = lista.reduce((acc, ex) => {
    acc[ex.Treino] = acc[ex.Treino] || [];
    acc[ex.Treino].push(ex);
    return acc;
  }, {});

  for (const [treino, exs] of Object.entries(grouped)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "treino-group";
    groupDiv.innerHTML = `<div class="treino-titulo">${treino}</div>`;

    for (const ex of exs) {
      const card = document.createElement("div");
      card.className = "exercicio";
      const id = `FlavinShape_${ex.Ficha}_${ex.Treino}_${ex.Exercicio}`;
      const progresso = loadKey(id) || {};

      const img = document.createElement("img");
      const fallback = svgFallback(ex.Exercicio);
      img.src = `https://source.unsplash.com/300x200/?gym,${encodeURIComponent(
        ex.Exercicio
      )}`;
      img.onerror = () => (img.src = fallback);

      card.innerHTML = `
        <div class="left"></div>
        <div class="meta">
          <h3>${ex.Exercicio}</h3>
          <div class="row"><strong>Grupo:</strong> ${ex.Grupo}</div>
          <div class="row"><strong>Séries:</strong> ${ex.Series} • <strong>Reps:</strong> ${ex.Reps}</div>
          <div class="row"><strong>Execução:</strong> ${ex.Execucao}</div>
          <div class="row"><strong>Obs:</strong> ${ex.Obs}</div>
        </div>
      `;

      card.querySelector(".left").appendChild(img);

      const controls = document.createElement("div");
      controls.className = "controls-inline";

      const inputCarga = document.createElement("input");
      inputCarga.type = "number";
      inputCarga.className = "input-carga";
      inputCarga.value = progresso.carga ?? ex.Carga ?? 0;
      inputCarga.onchange = () =>
        saveKey(id, { ...(loadKey(id) || {}), carga: inputCarga.value });
      controls.appendChild(inputCarga);

      const btnConcluir = document.createElement("button");
      btnConcluir.className = "btn";
      const concluido = progresso.concluido;
      btnConcluir.textContent = concluido ? "✅ Concluído" : "✔ Concluir";
      if (concluido) card.classList.add("concluido");
      btnConcluir.onclick = () => {
        const novo = !card.classList.contains("concluido");
        card.classList.toggle("concluido");
        btnConcluir.textContent = novo ? "✅ Concluído" : "✔ Concluir";
        saveKey(id, { ...(loadKey(id) || {}), concluido: novo });
      };
      controls.appendChild(btnConcluir);

      if (ex.Descanso) {
        const btnTimer = document.createElement("button");
        btnTimer.className = "btn ghost";
        btnTimer.textContent = `⏱ ${ex.Descanso}s`;
        btnTimer.onclick = () => iniciarTimer(ex.Descanso, btnTimer);
        controls.appendChild(btnTimer);
      }

      card.appendChild(controls);
      groupDiv.appendChild(card);
    }
    fichaContainer.appendChild(groupDiv);
  }
}

function iniciarTimer(segundos, botao) {
  let restante = parseInt(segundos);
  botao.disabled = true;
  const original = botao.textContent;
  botao.textContent = `⏱ ${restante}s`;
  const interval = setInterval(() => {
    restante--;
    botao.textContent = `⏱ ${restante}s`;
    if (restante < 0) {
      clearInterval(interval);
      botao.textContent = "✅ Descanso!";
      setTimeout(() => {
        botao.disabled = false;
        botao.textContent = original;
      }, 2000);
    }
  }, 1000);
}

function limparProgresso() {
  if (confirm("Deseja limpar todo o progresso salvo?")) {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("FlavinShape_")) localStorage.removeItem(k);
    });
    aplicarFiltros();
  }
}

function svgFallback(text, w = 300, h = 200) {
  const initials = (text || "EX").split(/\s+/).slice(0, 2).map((s) => s[0]).join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='#eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='48' fill='#1e3a8a'>${initials}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

carregarFicha();
