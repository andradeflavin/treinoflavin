// 🔗 Planilha e Proxy
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9b2FKBRe00ngdkBE8bSiC47MDdGJROwM-6FtxRy8htDIev5BZ5Z-SyxAXtz_2KzLxyHn-MiEcJaCj/pub?gid=784473971&single=true&output=csv";
const PROXY_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(SHEET_URL);

// 🔘 Elementos da interface
const fichaContainer = document.getElementById("ficha");
const fichaSelect = document.getElementById("fichaSelect");
const treinoSelect = document.getElementById("treinoSelect");

// 💾 Funções de armazenamento local
function salvarProgresso(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function carregarProgresso(chave) {
  const dado = localStorage.getItem(chave);
  return dado ? JSON.parse(dado) : null;
}

let dadosPlanilha = [];

async function carregarFicha() {
  try {
    const res = await fetch(PROXY_URL);
    if (!res.ok) throw new Error("Falha ao buscar planilha");
    const csv = await res.text();

    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    dadosPlanilha = parsed.data;
    if (!dadosPlanilha.length) throw new Error("Planilha vazia");

    // 🔽 Popular fichas e treinos
    const fichas = [...new Set(dadosPlanilha.map(r => r["Ficha"]).filter(Boolean))];
    fichaSelect.innerHTML = `<option value="Todos">Todas</option>`;
    fichas.forEach(f => fichaSelect.innerHTML += `<option value="${f}">${f}</option>`);

    const treinos = [...new Set(dadosPlanilha.map(r => r["Treino"]).filter(Boolean))];
    treinoSelect.innerHTML = `<option value="Todos">Todos</option>`;
    treinos.forEach(t => treinoSelect.innerHTML += `<option value="${t}">${t}</option>`);

    aplicarFiltros();

    fichaSelect.addEventListener("change", aplicarFiltros);
    treinoSelect.addEventListener("change", aplicarFiltros);
  } catch (err) {
    console.error(err);
    fichaContainer.innerHTML = `<p>Erro ao carregar ficha 😢</p><p>Verifique se a planilha está publicada corretamente.</p>`;
  }
}

function aplicarFiltros() {
  const filtroFicha = fichaSelect.value;
  const filtroTreino = treinoSelect.value;

  let filtrados = dadosPlanilha;
  if (filtroFicha !== "Todos") {
    filtrados = filtrados.filter(r => r["Ficha"] === filtroFicha);
  }
  if (filtroTreino !== "Todos") {
    filtrados = filtrados.filter(r => r["Treino"] === filtroTreino);
  }

  renderExercicios(filtrados);
}

function renderExercicios(lista) {
  fichaContainer.innerHTML = "";
  if (!lista.length) {
    fichaContainer.innerHTML = "<p>Nenhum exercício encontrado.</p>";
    return;
  }

  const grouped = lista.reduce((acc, ex) => {
    const t = ex["Treino"] || "Sem Treino";
    acc[t] = acc[t] || [];
    acc[t].push(ex);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([treino, items]) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "treino-group";
    groupDiv.innerHTML = `<div class="treino-titulo">${treino}</div>`;

    items.forEach(ex => {
      const div = document.createElement("div");
      div.className = "exercicio";

      const idExercicio = `${ex["Ficha"]}_${ex["Treino"]}_${ex["Exercício"]}`;
      const progresso = carregarProgresso(idExercicio) || {};

      const iconUrl = `https://cdn-icons-png.flaticon.com/512/2964/2964514.png`;

      div.innerHTML = `
        <h3>${ex["Exercício"] || "Sem nome"}</h3>
        <p><b>Grupo:</b> ${ex["Grupo Muscular"] || "-"}</p>
        <p><b>Séries:</b> ${ex["Séries"] || "-"}</p>
        <p><b>Reps:</b> ${ex["Reps"] || "-"}</p>
        <p><b>Execução/Técnica: </b>${ex["Execução / Técnica"] || "-"}</p>
        <p><b>Observações: </b>${ex["Observações"] || "-"}</p>
        <p><b>Carga (kg): </b>
          <input type="number" min="0" value="${progresso.carga ?? ex["Carga (kg)"] || 0}" class="input-carga">
        </p>
        <img src="${iconUrl}" alt="Ícone exercício">
      `;

      const btnConcluir = document.createElement("button");
      btnConcluir.textContent = progresso.concluido ? "✅ Concluído" : "✔ Concluir";
      if (progresso.concluido) div.classList.add("concluido");
      btnConcluir.onclick = () => {
        div.classList.toggle("concluido");
        const concluido = div.classList.contains("concluido");
        btnConcluir.textContent = concluido ? "✅ Concluído" : "✔ Concluir";
        salvarProgresso(idExercicio, { ...progresso, concluido });
      };
      div.appendChild(btnConcluir);

      if (ex["Descanso (s)"]) {
        const btnTimer = document.createElement("button");
        btnTimer.textContent = `⏱ ${ex["Descanso (s)"]}s descanso`;
        btnTimer.onclick = () => iniciarTimer(ex["Descanso (s)"], btnTimer);
        div.appendChild(btnTimer);
      }

      const inputCarga = div.querySelector(".input-carga");
      inputCarga.addEventListener("change", () => {
        salvarProgresso(idExercicio, { ...progresso, carga: inputCarga.value });
      });

      groupDiv.appendChild(div);
    });

    fichaContainer.appendChild(groupDiv);
  });
}

function iniciarTimer(segundos, botao) {
  let restante = segundos;
  botao.disabled = true;
  botao.textContent = `⏱ ${restante}s`;
  const interval = setInterval(() => {
    restante--;
    botao.textContent = `⏱ ${restante}s`;
    if (restante <= 0) {
      clearInterval(interval);
      botao.textContent = "✅ Descanso!";
      setTimeout(() => {
        botao.disabled = false;
        botao.textContent = `⏱ ${segundos}s descanso`;
      }, 2000);
    }
  }, 1000);
}

carregarFicha();
