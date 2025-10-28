// 🔗 Link da planilha
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9b2FKBRe00ngdkBE8bSiC47MDdGJROwM-6FtxRy8htDIev5BZ5Z-SyxAXtz_2KzLxyHn-MiEcJaCj/pub?gid=784473971&single=true&output=csv";

// 🚀 Proxy confiável para evitar bloqueios CORS
const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(SHEET_URL);

// 🔘 Elementos da página
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
    fichaContainer.innerHTML = "<p>Carregando ficha...</p>";

    const res = await fetch(PROXY_URL);
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

    const csv = await res.text();
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
    });

    dadosPlanilha = parsed.data;
    if (!dadosPlanilha || dadosPlanilha.length === 0)
      throw new Error("Planilha sem dados válidos.");

    // 🔍 Normaliza nomes de colunas
    dadosPlanilha = dadosPlanilha.map((r) => ({
      Ficha: r["Ficha"]?.trim() || "Padrão",
      Treino: r["Treino"]?.trim() || "Sem treino",
      Grupo: r["Grupo Muscular"] || "-",
      Exercicio: r["Exercício"] || "-",
      Series: r["Séries"] || "-",
      Reps: r["Reps"] || "-",
      Descanso: r["Descanso (s)"] || "",
      Execucao: r["Execução / Técnica"] || "",
      Obs: r["Observações"] || "",
      Carga: r["Carga (kg)"] || 0,
    }));

    // 🔽 Popular seletores
    const fichas = [...new Set(dadosPlanilha.map((r) => r.Ficha))];
    fichaSelect.innerHTML = `<option value="Todos">Todas</option>`;
    fichas.forEach((f) => (fichaSelect.innerHTML += `<option>${f}</option>`));

    const treinos = [...new Set(dadosPlanilha.map((r) => r.Treino))];
    treinoSelect.innerHTML = `<option value="Todos">Todos</option>`;
    treinos.forEach((t) => (treinoSelect.innerHTML += `<option>${t}</option>`));

    aplicarFiltros();

    fichaSelect.addEventListener("change", aplicarFiltros);
    treinoSelect.addEventListener("change", aplicarFiltros);
  } catch (err) {
    console.error("Erro ao carregar planilha:", err);
    fichaContainer.innerHTML = `
      <p>❌ Erro ao carregar ficha.</p>
      <p>Verifique se a planilha está publicada corretamente.</p>
    `;
  }
}

function aplicarFiltros() {
  const ficha = fichaSelect.value;
  const treino = treinoSelect.value;

  let filtrados = dadosPlanilha;
  if (ficha !== "Todos") filtrados = filtrados.filter((r) => r.Ficha === ficha);
  if (treino !== "Todos") filtrados = filtrados.filter((r) => r.Treino === treino);

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

  Object.entries(grouped).forEach(([treino, items]) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "treino-group";
    groupDiv.innerHTML = `<div class="treino-titulo">${treino}</div>`;

    items.forEach((ex) => {
      const div = document.createElement("div");
      div.className = "exercicio";

      const id = `${ex.Ficha}_${ex.Treino}_${ex.Exercicio}`;
      const progresso = carregarProgresso(id) || {};

      const imgUrl = `https://cdn-icons-png.flaticon.com/512/2964/2964514.png`;

      div.innerHTML = `
        <h3>${ex.Exercicio}</h3>
        <p><b>Grupo:</b> ${ex.Grupo}</p>
        <p><b>Séries:</b> ${ex.Series}</p>
        <p><b>Reps:</b> ${ex.Reps}</p>
        <p><b>Execução:</b> ${ex.Execucao}</p>
        <p><b>Obs:</b> ${ex.Obs}</p>
        <p><b>Carga (kg):</b> <input type="number" class="input-carga" value="${progresso.carga ?? ex.Carga}"></p>
        <img src="${imgUrl}" alt="Ícone exercício">
      `;

      // Botão concluir
      const btnConcluir = document.createElement("button");
      btnConcluir.textContent = progresso.concluido ? "✅ Concluído" : "✔ Concluir";
      if (progresso.concluido) div.classList.add("concluido");

      btnConcluir.onclick = () => {
        div.classList.toggle("concluido");
        const concluido = div.classList.contains("concluido");
        btnConcluir.textContent = concluido ? "✅ Concluído" : "✔ Concluir";
        salvarProgresso(id, { ...progresso, concluido });
      };
      div.appendChild(btnConcluir);

      // Botão descanso
      if (ex.Descanso) {
        const btnTimer = document.createElement("button");
        btnTimer.textContent = `⏱ ${ex.Descanso}s`;
        btnTimer.onclick = () => iniciarTimer(ex.Descanso, btnTimer);
        div.appendChild(btnTimer);
      }

      const inputCarga = div.querySelector(".input-carga");
      inputCarga.addEventListener("change", () => {
        salvarProgresso(id, { ...progresso, carga: inputCarga.value });
      });

      groupDiv.appendChild(div);
    });

    fichaContainer.appendChild(groupDiv);
  });
}

function iniciarTimer(segundos, botao) {
  let restante = parseInt(segundos);
  botao.disabled = true;
  const intervalo = setInterval(() => {
    botao.textContent = `⏱ ${restante}s`;
    restante--;
    if (restante < 0) {
      clearInterval(intervalo);
      botao.textContent = "✅ Descanso!";
      botao.disabled = false;
    }
  }, 1000);
}

// 🚀 Inicializa
carregarFicha();
