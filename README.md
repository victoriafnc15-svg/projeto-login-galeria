# Projeto Prático — Login e Galeria de Fotos

Desenvolvimento Web III | Fatec Franco da Rocha



- Victoria Fernandes do Nascimento 3ª DSM 

## Como executar

1. Baixe ou clone este repositório.
2. Abra o arquivo `index.html` em um navegador (Chrome, Edge ou Firefox).
   - Também é possível usar a extensão **Live Server** do VS Code.
3. É necessário estar conectado à internet, pois o projeto consome a API JSONPlaceholder.

## Dados de teste

| Campo   | Valor               |
|---------|---------------------|
| Usuário | `Bret`              |
| Senha   | `Sincere@april.biz` |

> O campo `email` é usado como senha **apenas para fins didáticos**. A JSONPlaceholder não possui autenticação real.

## Funcionamento

- **Parte 1 — Login:** consulta `https://jsonplaceholder.typicode.com/users` e compara o `username` e o `email` digitados com os do mesmo usuário. Campos vazios não são aceitos e dados incorretos exibem uma mensagem de erro. O botão **Sair** volta ao login.
- **Parte 2 — Galeria:** consulta `https://jsonplaceholder.typicode.com/photos` (limitado às 100 primeiras fotos, 20 por página). A lista mostra o título e a miniatura (`thumbnailUrl`) em 32 × 32 px. Ao clicar, exibe a foto ampliada (`url`) com o título completo e um botão para voltar à lista sem novo login. Há mensagem de carregamento e de erro na consulta.

## Estrutura

```text
index.html     → página base (SPA)
css/style.css  → estilos próprios
js/app.js      → lógica do login, consulta às APIs e telas
```
