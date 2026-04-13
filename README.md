# Cânticos - Cronograma de Louvor IPB

Plataforma para gerenciamento do cronograma de louvor da Igreja Presbiteriana do Brasil.

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. No **SQL Editor**, execute o conteúdo de `supabase-schema.sql`
3. Em **Database > Replication**, ative o realtime nas tabelas: `sundays`, `sunday_songs`, `suggestions`, `comments`

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha com suas credenciais do Supabase:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

As credenciais estão em **Settings > API** no dashboard do Supabase.

### 4. Migrar dados existentes

Para importar o catálogo e histórico dos arquivos `.txt`:

```bash
npx tsx scripts/migrate-data.ts
```

Os arquivos de dados (`canticos.txt`, `cantados_*.txt`) devem estar na pasta pai (`../`).

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

## Funcionalidades

- **Dashboard** - Visão geral com próximo domingo, stats e resumo recente
- **Catálogo** - Todas as músicas com filtros, busca e histórico detalhado
- **Calendário** - Visualização mensal com navegação
- **Schedule Builder** - Drag-and-drop para montar o cronograma de cada domingo
- **Sugestões** - Qualquer pessoa pode sugerir novas músicas
- **Insights** - Análise de diversidade, músicas esquecidas, mais tocadas, etc.
- **Tempo Real** - Alterações refletem instantaneamente para todos os usuários
- **Comentários** - Discussão por domingo

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4 (tema escuro)
- Supabase (PostgreSQL + Realtime)
- @hello-pangea/dnd (drag and drop)
- date-fns, Lucide React, Sonner
