# Changelog

Todas as alterações relevantes do **Cânticos** (IP Filadelfia).  
O repositório foi, num dado momento, **reiniciado com um único commit inicial** para não versionar dados sensíveis no histórico Git. As entradas abaixo **documentam a evolução que existia antes dessa consolidação** e o estado atual, para referência futura.

O formato inspira-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] — 2026-04-13

### Adicionado

- Aplicação **React + TypeScript + Vite** com tema escuro e identidade **IPB** (logo da igreja).
- Backend **Supabase** (PostgreSQL, Auth, Realtime) para cânticos, domingos, vínculos domingo–música, sugestões e comentários.
- **Rotas públicas:** início (próximo domingo + recentes), catálogo, calendário, vista por domingo (`/domingo/:data`), sugestões de músicas.
- **Área autenticada:** painel admin, catálogo completo, calendário, montador de domingo, insights, sincronização, gestão de utilizadores.
- **Controlo de acesso em três níveis:** administrador (tabela `admins`), utilizador aprovado (`approved_users`), leitura pública anónima.
- **Login com Google** (Supabase Auth); mensagens para quem não está autorizado a editar.
- **Pedidos de acesso** (quem não está na lista pode pedir inclusão) — migração `06_access_requests.sql`.
- **Integração Google Drive:** links por cântico (`drive_folder_id`), pasta raiz configurável; na Sync, deteção de pastas no Drive (API key no cliente, com restrições recomendadas no Google Cloud).
- **Importação de cronograma** a partir de **export CSV da Google Sheets** (sem escrita de volta para a planilha).
- **Montador de domingo** com arrastar e largar, botão **Salvar**, aviso de alterações não guardadas e **confirmação ao sair** (`useBlocker` com data router).
- Páginas **Política de privacidade** (`/privacidade`) e **Termos de uso** (`/termos`) e links no layout público / início (branding OAuth Google).
- Migrações SQL organizadas em **`supabase/migrations/`** com ordem numerada (`01`–`07`) e `README` local.

### Alterado

- Textos de login: de “área administrativa / líderes” para **equipe de louvor** e contas **autorizadas para edição**.
- **Calendário** (público e admin): células da grelha mais altas quando há músicas; lista em mobile com cânticos em coluna, texto maior e badges mais legíveis.
- **Domínio de produção Vercel:** `canticosipfiladelfiasc.vercel.app` (projeto renomeado; removido domínio antigo duplicado).
- **Catálogo público:** ordenação por colunas, linhas/partituras ligadas ao Drive por cântico.
- Vários cartões e listas passam a usar **links para o Drive** com ícone de link externo onde faz sentido.

### Corrigido

- Erro **`useBlocker` fora de data router** — migração para `createBrowserRouter` / `RouterProvider`.
- Crash no montador quando dados ainda não tinham carregado (filtro de músicas agendadas).
- Exibição de **“dias atrás” negativos** para domingos futuros nos cartões de música.
- **Ícone de link externo** dentro de badges/cartões (alinhamento visual).
- Pedidos de acesso: tolerância quando a tabela `access_requests` ainda não existe (schema não aplicado).

### Removido

- Funcionalidade de **atualizar a planilha Google Sheets** a partir da app (mantida só a **importação** CSV).

### Segurança

- Ficheiros SQL de exemplo **sem e-mails de admin nem IDs reais** de planilha/Drive no Git; inserções documentadas para execução manual no Supabase.
- URLs padrão da Sync apenas via **variáveis de ambiente opcionais** (`VITE_DEFAULT_*`), não hardcoded no código.
- **Validação de links** em sugestões: só `http:` / `https:` (evita `javascript:` etc.).
- Cabeçalhos em **`vercel.json`:** HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **RLS (v5):** escrita em cronograma apenas para **autenticados aprovados**; músicas e definições sensíveis restritas a **admin**; remoção de leitura anónima da tabela `admins` (v5).
- **RLS (v7):** cada utilizador autenticado só lê **a própria linha** em `admins` (evita enumerar todos os admins).
- Recomendação documentada: **chave Google** com restrição por **referrer** (produção) e, em dev, **chave separada** com `localhost` se necessário.

---

## Notas

- **Ordem das migrações:** ver `supabase/migrations/README.md`.
- Versões futuras podem usar secções `[Unreleased]` e datas reais de release conforme forem publicando.
