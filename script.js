// ------------------------------
// Variáveis globais
// ------------------------------
let ultimoResultado = null;
let estatisticasBuscas = {}; // termo -> contagem

// ------------------------------
// LOGIN (mantido simples)
// ------------------------------
function fazerLogin() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;

  if (usuario === "admin" && senha === "1234") {
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("erro").textContent = "❌ Usuário ou senha inválidos!";
  }
}

// ------------------------------
// HISTÓRICO DE BUSCAS
// ------------------------------
function salvarBuscaHistorico(termo) {
  if (!termo) return;
  let historico = JSON.parse(localStorage.getItem("historicoBuscas") || "[]");

  if (!historico.includes(termo)) {
    historico.unshift(termo);
    if (historico.length > 10) historico.pop();
    localStorage.setItem("historicoBuscas", JSON.stringify(historico));
  }
}

function pegarHistorico() {
  return JSON.parse(localStorage.getItem("historicoBuscas") || "[]");
}

// ------------------------------
// SUGESTÕES AUTOMÁTICAS
// ------------------------------
function mostrarSugestoes() {
  const input = document.getElementById("buscaTexto");
  const lista = document.getElementById("listaSugestoes");
  const valor = input.value.toLowerCase();
  const historico = pegarHistorico();

  lista.innerHTML = "";
  if (!valor) {
    lista.style.display = "none";
    return;
  }

  const sugeridos = historico.filter((item) =>
    item.toLowerCase().startsWith(valor)
  );

  if (sugeridos.length === 0) {
    lista.style.display = "none";
    return;
  }

  sugeridos.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    li.tabIndex = 0;
    li.onclick = () => {
      input.value = item;
      lista.style.display = "none";
      buscarTexto();
    };
    li.onkeydown = (e) => {
      if (e.key === "Enter") {
        input.value = item;
        lista.style.display = "none";
        buscarTexto();
      }
    };
    lista.appendChild(li);
  });

  lista.style.display = "block";
}

function esconderSugestoes() {
  setTimeout(() => {
    const lista = document.getElementById("listaSugestoes");
    if (lista) lista.style.display = "none";
  }, 150);
}

// ------------------------------
// BUSCA DE TEXTO COM FILTROS
// ------------------------------
async function buscarTexto() {
  const textoInput = document.getElementById("buscaTexto");
  const texto = textoInput.value.trim();
  const res = document.getElementById("resultadoBusca");

  if (!texto) {
    res.innerHTML = `<p>⚠️ Digite algo para buscar.</p>`;
    return;
  }

  // Salvar no histórico e nas estatísticas
  salvarBuscaHistorico(texto);
  incrementarEstatistica(texto);

  res.innerHTML = `<p>🔍 Buscando "<strong>${texto}</strong>"...</p>`;

  // Coletar filtros do form
  const formFiltros = document.getElementById("formFiltros");
  const formData = new FormData(formFiltros);
  const filtros = {
    tipo: formData.getAll("tipo"), // array de 'texto', 'imagem', 'video'
    data: formData.get("data"),
    idioma: formData.get("idioma"),
  };

  try {
    // A URL real do backend, pode usar query strings para filtros se backend aceitar
    const url = `http://127.0.0.1:5000/buscar?termo=${encodeURIComponent(
      texto
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.erro) {
      res.innerHTML = `<p>❌ Erro: ${data.erro}</p>`;
      return;
    }

    if (!data.resultados || data.resultados.length === 0) {
      res.innerHTML = `<p>⚠️ Nenhum resultado encontrado.</p>`;
      return;
    }

    // Filtrar resultados conforme filtros (exemplo simples)
    const resultadosFiltrados = data.resultados.filter((item) => {
      if (!filtros.tipo.length) return true;
      return true; // Pode melhorar filtragem conforme sua estrutura
    });

    let htmlResultados = `<p>✅ ${resultadosFiltrados.length} resultados encontrados:</p><ul>`;
    resultadosFiltrados.forEach((item) => {
      htmlResultados += `
        <li>
          <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.titulo}</a><br/>
          <small>${item.descricao || ""}</small>
          <button class="btn-fav" aria-label="Adicionar aos favoritos" onclick="adicionarFavorito('${escapeHtml(
            item.titulo
          )}', '${item.link}')">⭐</button>
        </li>`;
    });
    htmlResultados += "</ul>";

    res.innerHTML = htmlResultados;

    ultimoResultado = resultadosFiltrados[0] || null;
    atualizarDashboard();
  } catch (error) {
    res.innerHTML = `<p>❌ Erro ao buscar: ${error.message}</p>`;
  }
}

// ------------------------------
// FUNÇÃO ESCAPE PARA SEGURANÇA (simples)
// ------------------------------
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// ------------------------------
// BUSCA POR IMAGEM (SIMULADA)
// ------------------------------
function buscarImagem() {
  const file = document.getElementById("imagemUpload").files[0];
  const res = document.getElementById("resultadoBusca");

  if (!file) {
    res.innerHTML = `<p>⚠️ Nenhuma imagem selecionada.</p>`;
    return;
  }

  res.innerHTML = `<p>🧠 Analisando imagem...</p>`;

  setTimeout(() => {
    res.innerHTML += `<p>✅ Imagem identificada em <strong>3 fontes secretas</strong>.</p>`;
  }, 2000);
}

// ------------------------------
// FAVORITOS (salvar no localStorage)
// ------------------------------
function carregarFavoritos() {
  const lista = document.getElementById("listaFavoritos");
  const favs = JSON.parse(localStorage.getItem("favoritos") || "[]");
  lista.innerHTML = "";

  favs.forEach(({ titulo, link }) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${link}" target="_blank" rel="noopener noreferrer">${titulo}</a>
      <button aria-label="Remover favorito" onclick="removerFavorito('${escapeHtml(
        titulo
      )}')">❌</button>
    `;
    lista.appendChild(li);
  });
}

function adicionarFavorito(titulo, link) {
  let favs = JSON.parse(localStorage.getItem("favoritos") || "[]");
  if (!favs.find((f) => f.link === link)) {
    favs.push({ titulo, link });
    localStorage.setItem("favoritos", JSON.stringify(favs));
    carregarFavoritos();
  }
}

function removerFavorito(titulo) {
  let favs = JSON.parse(localStorage.getItem("favoritos") || "[]");
  favs = favs.filter((f) => f.titulo !== titulo);
  localStorage.setItem("favoritos", JSON.stringify(favs));
  carregarFavoritos();
}

// ------------------------------
// MULTILÍNGUE SIMPLES
// ------------------------------
const textos = {
  "pt-BR": {
    tituloPrincipal: "Buscador Profundo",
    buscarTexto: "🔍 Buscar por Texto",
    buscarImagem: "🖼️ Buscar por Imagem",
    filtros: "⚙️ Filtros Avançados",
    favoritos: "⭐ Favoritos",
    dashboard: "📊 Estatísticas",
    compartilhar: "📢 Compartilhar último resultado",
    alertaDigiteAlgo: "⚠️ Digite algo para buscar.",
    alertaNenhumResultado: "⚠️ Nenhum resultado encontrado.",
    erroBuscar: "❌ Erro ao buscar: ",
    erroLogin: "❌ Usuário ou senha inválidos!",
    buscarBotao: "🔎 Buscar",
    buscarImagemBotao: "🧬 Buscar Imagem",
    sair: "🔙 Sair",
  },
  "en-US": {
    tituloPrincipal: "Deep Searcher",
    buscarTexto: "🔍 Search by Text",
    buscarImagem: "🖼️ Search by Image",
    filtros: "⚙️ Advanced Filters",
    favoritos: "⭐ Favorites",
    dashboard: "📊 Statistics",
    compartilhar: "📢 Share last result",
    alertaDigiteAlgo: "⚠️ Please enter something to search.",
    alertaNenhumResultado: "⚠️ No results found.",
    erroBuscar: "❌ Search error: ",
    erroLogin: "❌ Invalid username or password!",
    buscarBotao: "🔎 Search",
    buscarImagemBotao: "🧬 Search Image",
    sair: "🔙 Logout",
  },
  "es-ES": {
    tituloPrincipal: "Buscador Profundo",
    buscarTexto: "🔍 Buscar por Texto",
    buscarImagem: "🖼️ Buscar por Imagen",
    filtros: "⚙️ Filtros Avanzados",
    favoritos: "⭐ Favoritos",
    dashboard: "📊 Estadísticas",
    compartilhar: "📢 Compartir último resultado",
    alertaDigiteAlgo: "⚠️ Por favor, ingrese algo para buscar.",
    alertaNenhumResultado: "⚠️ No se encontraron resultados.",
    erroBuscar: "❌ Error al buscar: ",
    erroLogin: "❌ Usuario o contraseña inválidos!",
    buscarBotao: "🔎 Buscar",
    buscarImagemBotao: "🧬 Buscar Imagen",
    sair: "🔙 Salir",
  },
};

function mudarIdioma() {
  const idioma = document.getElementById("selectIdioma").value;
  const t = textos[idioma] || textos["pt-BR"];

  document.getElementById("titulo-principal").textContent = t.tituloPrincipal;
  document.getElementById("labelBuscaTexto").textContent = t.buscarTexto;
  document.getElementById("labelBuscaImagem").textContent = t.buscarImagem;
  document.getElementById("labelFiltros").textContent = t.filtros;
  document.getElementById("labelFavoritos").textContent = t.favoritos;
  document.getElementById("labelDashboard").textContent = t.dashboard;
  document.getElementById("labelCompartilhar").textContent = t.compartilhar;

  document.getElementById("buscaTexto").placeholder = t.alertaDigiteAlgo.replace("⚠️ ", "");
  document.querySelector('button[onclick="buscarTexto()"]').textContent = t.buscarBotao;
  document.querySelector('button[onclick="buscarImagem()"]').textContent = t.buscarImagemBotao;
  document.querySelector('button[onclick="logout()"]').textContent = t.sair;
}

// ------------------------------
// DASHBOARD ESTATÍSTICO COM CHART.JS
// ------------------------------
let grafico = null;
function atualizarDashboard() {
  const ctx = document.getElementById("graficoBuscas").getContext("2d");
  const termos = Object.keys(estatisticasBuscas);
  const valores = termos.map((t) => estatisticasBuscas[t]);

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels: termos,
      datasets: [
        {
          label: "Buscas realizadas",
          data: valores,
          backgroundColor: "#00ffae",
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 500 },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function incrementarEstatistica(termo) {
  estatisticasBuscas[termo] = (estatisticasBuscas[termo] || 0) + 1;
  atualizarDashboard();
}

// ------------------------------
// COMPARTILHAMENTO SOCIAL
// ------------------------------
function compartilharTwitter() {
  if (!ultimoResultado) {
    alert("Nenhum resultado para compartilhar!");
    return;
  }
  const url = encodeURIComponent(ultimoResultado.link);
  const text = encodeURIComponent(`Confira este resultado: ${ultimoResultado.titulo}`);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
}

function compartilharWhatsApp() {
  if (!ultimoResultado) {
    alert("Nenhum resultado para compartilhar!");
    return;
  }
  const url = encodeURIComponent(ultimoResultado.link);
  const text = encodeURIComponent(`Confira este resultado: ${ultimoResultado.titulo}`);
  window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, "_blank");
}

// ------------------------------
// ESCAPE HTML (uso para segurança)
// ------------------------------
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// ------------------------------
// INICIALIZAÇÃO AO CARREGAR PÁGINA
// ------------------------------
window.onload = function () {
  carregarFavoritos();
  mudarIdioma();

  // Evento de digitação para mostrar sugestões
  const input = document.getElementById("buscaTexto");
  input.addEventListener("input", mostrarSugestoes);
  input.addEventListener("blur", esconderSugestoes);

  // Inicializa gráfico com dados vazios
  atualizarDashboard();
};
