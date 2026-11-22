// ======================================================================
// PROJETO PRÁTICO — LOGIN E GALERIA DE FOTOS
// Desenvolvimento Web III | Fatec Franco da Rocha
//
// Fluxo: Login → Lista de fotos (título + miniatura 32x32) → Clique →
//        Foto ampliada com título → Voltar à lista.
//
// APIs usadas (JSONPlaceholder):
//   - Usuários: https://jsonplaceholder.typicode.com/users
//   - Fotos:    https://jsonplaceholder.typicode.com/photos
// ======================================================================

// Endereços das APIs.
const URL_USUARIOS = "https://jsonplaceholder.typicode.com/users";
const URL_FOTOS = "https://jsonplaceholder.typicode.com/photos";

// Limite inicial de fotos buscadas (sugestão do enunciado para não
// gerar uma lista enorme). A API aceita o parâmetro _limit.
const LIMITE_FOTOS = 100;

// Quantidade de fotos mostradas por página na lista.
const FOTOS_POR_PAGINA = 20;

// ----------------------------------------------------------------------
// ESTADO DA APLICAÇÃO (fica em memória enquanto a página está aberta)
// ----------------------------------------------------------------------

// Usuário que fez login (null = ninguém logado).
let usuarioLogado = null;

// Fotos recebidas da API (guardadas para não buscar de novo ao voltar).
let fotos = [];

// Página atual da listagem (para voltar exatamente onde estava).
let paginaAtual = 1;

// Referências aos elementos fixos da página.
const app = document.getElementById("app");
const btnSair = document.getElementById("btnSair");
const spanUsuario = document.getElementById("usuarioLogado");

// ----------------------------------------------------------------------
// FUNÇÃO AUXILIAR
// ----------------------------------------------------------------------

// Evita que textos vindos da API sejam interpretados como HTML.
function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// As imagens da JSONPlaceholder apontam para via.placeholder.com, que
// pode estar fora do ar. Se a imagem falhar, usamos o mesmo tamanho e a
// mesma cor indicados na URL da API, servidos por placehold.co.
function imagemReserva(img) {
    img.onerror = null; // evita repetir o erro infinitamente
    img.src = img.src.replace("via.placeholder.com", "placehold.co");
}

// ======================================================================
// PARTE 1 — TELA DE LOGIN
// ======================================================================

function mostrarLogin(mensagemErro = "") {

    // Esconde o botão Sair e o nome do usuário na tela de login.
    btnSair.classList.add("d-none");
    spanUsuario.classList.add("d-none");

    app.innerHTML = `
        <div class="card shadow-sm login-card">
            <div class="card-body p-4">
                <h1 class="h4 mb-4 text-center">Acesso à Galeria</h1>

                <!-- Mensagem de erro (só aparece se houver erro). -->
                <div id="msgErro" class="alert alert-danger ${mensagemErro ? "" : "d-none"}">
                    ${mensagemErro}
                </div>

                <form id="formLogin" novalidate>
                    <div class="mb-3">
                        <label class="form-label" for="usuario">Usuário</label>
                        <input class="form-control" id="usuario" autocomplete="username">
                    </div>

                    <div class="mb-3">
                        <label class="form-label" for="senha">Senha</label>
                        <input class="form-control" id="senha" type="password"
                               autocomplete="current-password">
                    </div>

                    <button id="btnEntrar" class="btn btn-primary w-100" type="submit">
                        Entrar
                    </button>
                </form>

                <p class="text-muted small mt-3 mb-0">
                    Teste: usuário <strong>Bret</strong> /
                    senha <strong>Sincere@april.biz</strong>
                </p>
            </div>
        </div>
    `;

    // Escuta o envio do formulário.
    document.getElementById("formLogin").addEventListener("submit", fazerLogin);
}

// Mostra uma mensagem de erro na tela de login, sem sair dela.
function mostrarErroLogin(mensagem) {
    const caixa = document.getElementById("msgErro");
    caixa.textContent = mensagem;
    caixa.classList.remove("d-none");
}

// Executada ao clicar em "Entrar".
async function fazerLogin(evento) {

    // Impede o recarregamento da página.
    evento.preventDefault();

    // Lê os campos (trim remove espaços no início e no fim).
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    // Não aceita campos vazios.
    if (usuario === "" || senha === "") {
        mostrarErroLogin("Preencha o usuário e a senha.");
        return;
    }

    // Desabilita o botão enquanto consulta a API.
    const botao = document.getElementById("btnEntrar");
    botao.disabled = true;
    botao.textContent = "Verificando...";

    try {
        // Consulta a API de usuários.
        const resposta = await fetch(URL_USUARIOS);

        if (!resposta.ok) {
            throw new Error("HTTP " + resposta.status);
        }

        const usuarios = await resposta.json();

        // Procura um usuário cujo username E email (senha) sejam do
        // MESMO registro retornado pela API.
        const encontrado = usuarios.find(u =>
            u.username === usuario && u.email === senha
        );

        if (encontrado) {
            // Login correto: guarda o usuário e vai para a galeria.
            usuarioLogado = encontrado;
            mostrarGaleria();
        } else {
            // Login incorreto: permanece na tela de login.
            mostrarErroLogin("Usuário ou senha incorretos.");
            botao.disabled = false;
            botao.textContent = "Entrar";
        }

    } catch (erro) {
        // Falha de rede ou da API.
        mostrarErroLogin("Não foi possível consultar o servidor. Tente novamente.");
        botao.disabled = false;
        botao.textContent = "Entrar";
    }
}

// Sai do sistema e volta ao login.
function sair() {
    usuarioLogado = null;
    paginaAtual = 1;
    mostrarLogin();
}

btnSair.addEventListener("click", sair);

// ======================================================================
// PARTE 2 — LISTAGEM E VISUALIZAÇÃO DE FOTOS
// ======================================================================

// Prepara a área logada e carrega as fotos.
async function mostrarGaleria() {

    // Segurança da navegação: sem login, volta para o login.
    if (!usuarioLogado) {
        mostrarLogin();
        return;
    }

    // Mostra o botão Sair e o nome do usuário.
    spanUsuario.textContent = "Olá, " + usuarioLogado.username;
    spanUsuario.classList.remove("d-none");
    btnSair.classList.remove("d-none");

    // Se as fotos já foram carregadas, só desenha a lista.
    if (fotos.length > 0) {
        mostrarLista();
        return;
    }

    // Mensagem enquanto os dados carregam.
    app.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Carregando fotos...</p>
        </div>
    `;

    try {
        const resposta = await fetch(`${URL_FOTOS}?_limit=${LIMITE_FOTOS}`);

        if (!resposta.ok) {
            throw new Error("HTTP " + resposta.status);
        }

        fotos = await resposta.json();
        mostrarLista();

    } catch (erro) {
        // Mensagem adequada em caso de falha na consulta.
        app.innerHTML = `
            <div class="alert alert-danger">
                <h2 class="h5">Não foi possível carregar as fotos.</h2>
                <p class="mb-3">Verifique sua conexão com a internet e tente novamente.</p>
                <button id="btnTentarNovamente" class="btn btn-outline-danger" type="button">
                    Tentar novamente
                </button>
            </div>
        `;

        document.getElementById("btnTentarNovamente")
            .addEventListener("click", mostrarGaleria);
    }
}

// Desenha a lista paginada: somente título + miniatura 32x32.
function mostrarLista() {

    const totalPaginas = Math.ceil(fotos.length / FOTOS_POR_PAGINA);

    // slice pega só as fotos da página atual.
    const inicio = (paginaAtual - 1) * FOTOS_POR_PAGINA;
    const fotosDaPagina = fotos.slice(inicio, inicio + FOTOS_POR_PAGINA);

    app.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h1 class="h4 mb-0">Fotos</h1>
            <span class="text-muted small">
                ${fotos.length} fotos — página ${paginaAtual} de ${totalPaginas}
            </span>
        </div>

        <div class="list-group shadow-sm mb-3">
            ${
                // map transforma cada foto em um item clicável.
                fotosDaPagina.map(foto => `
                    <button type="button"
                            class="list-group-item list-group-item-action item-foto d-flex align-items-center gap-3"
                            data-id="${foto.id}">
                        <img class="miniatura"
                             src="${foto.thumbnailUrl}"
                             width="32" height="32"
                             alt="Miniatura da foto ${foto.id}"
                             onerror="imagemReserva(this)">
                        <span>${escaparHTML(foto.title)}</span>
                    </button>
                `).join("")
            }
        </div>

        <!-- Navegação entre páginas. -->
        <div class="d-flex justify-content-between">
            <button id="btnAnterior" class="btn btn-outline-secondary" type="button"
                    ${paginaAtual === 1 ? "disabled" : ""}>
                &larr; Anterior
            </button>
            <button id="btnProxima" class="btn btn-outline-secondary" type="button"
                    ${paginaAtual === totalPaginas ? "disabled" : ""}>
                Próxima &rarr;
            </button>
        </div>
    `;

    // Cada item é clicável: abre a foto ampliada.
    document.querySelectorAll(".item-foto").forEach(item => {
        item.addEventListener("click", () => {
            mostrarFoto(Number(item.dataset.id));
        });
    });

    // Botões de paginação.
    document.getElementById("btnAnterior").addEventListener("click", () => {
        paginaAtual--;
        mostrarLista();
        window.scrollTo(0, 0);
    });

    document.getElementById("btnProxima").addEventListener("click", () => {
        paginaAtual++;
        mostrarLista();
        window.scrollTo(0, 0);
    });
}

// Mostra a foto em tamanho maior com o título completo.
function mostrarFoto(id) {

    // find localiza a foto clicada pelo id.
    const foto = fotos.find(f => f.id === id);

    if (!foto) {
        mostrarLista();
        return;
    }

    app.innerHTML = `
        <button id="btnVoltar" class="btn btn-secondary mb-3" type="button">
            &larr; Voltar à lista
        </button>

        <div class="card shadow-sm">
            <div class="card-body text-center">
                <img class="foto-ampliada mb-3"
                     src="${foto.url}"
                     alt="${escaparHTML(foto.title)}"
                     onerror="imagemReserva(this)">
                <h2 class="h5">${escaparHTML(foto.title)}</h2>
                <p class="text-muted small mb-0">Foto #${foto.id} — Álbum ${foto.albumId}</p>
            </div>
        </div>
    `;

    // Volta para a lista (na mesma página) sem novo login.
    document.getElementById("btnVoltar").addEventListener("click", mostrarLista);
}

// ----------------------------------------------------------------------
// PRIMEIRA TELA
// ----------------------------------------------------------------------
mostrarLogin();
