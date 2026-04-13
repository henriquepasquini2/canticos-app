import { Link } from 'react-router-dom'

export function Privacy() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Política de privacidade</h1>
        <p className="mt-2 text-sm text-text-muted">
          Cânticos — Igreja Presbiteriana Filadelfia (São Carlos/SP). Última
          atualização: abril de 2026.
        </p>
      </div>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          1. Quem somos
        </h2>
        <p>
          Este site é operado pela equipe de louvor da IP Filadelfia para
          organização do cronograma de cânticos e consulta ao repertório. O
          endereço público do serviço é o indicado na página inicial do site.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          2. Dados que tratamos
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">Visitantes:</strong> páginas
            públicas (cronograma, catálogo, calendário) podem ser vistas sem
            login. Podemos registrar dados técnicos usuais de hospedagem
            (como endereço IP e tipo de navegador) nos servidores da Vercel e
            do provedor de backend.
          </li>
          <li>
            <strong className="text-text-primary">Conta Google:</strong> quem
            faz login com Google fornece identificação e e-mail geridos pelo
            Google, conforme a política do Google. Utilizamos o serviço de
            autenticação do Supabase apenas para reconhecer contas autorizadas
            a editar conteúdo.
          </li>
          <li>
            <strong className="text-text-primary">Conteúdo do site:</strong>{' '}
            cronogramas, sugestões de músicas, comentários internos e dados do
            repertório armazenados na base de dados do Supabase (PostgreSQL),
            com acesso controlado por políticas de segurança do provedor.
          </li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          3. Finalidades
        </h2>
        <p>
          Exibir o cronograma de louvor, permitir edição por pessoas
          autorizadas, receber sugestões e manter o catálogo alinhado ao uso da
          igreja. Não vendemos dados pessoais nem usamos publicidade
          comportamental neste site.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          4. Base legal e seus direitos (LGPD)
        </h2>
        <p>
          O tratamento baseia-se na execução de atividades legítimas da
          comunidade religiosa e no consentimento quando aplicável (por
          exemplo, envio de sugestões). Você pode solicitar acesso, correção ou
          exclusão de dados pessoais tratados neste contexto entrando em
          contato com a coordenação do louvor ou da igreja.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          5. Terceiros
        </h2>
        <p>
          Utilizamos Supabase (banco e autenticação), Vercel (hospedagem do
          site) e Google (login opcional). Cada um possui sua própria política
          de privacidade. Links para o Google Drive podem abrir fora deste
          domínio.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">6. Contato</h2>
        <p>
          Dúvidas sobre esta política: fale com a coordenação do louvor ou da
          IP Filadelfia.
        </p>
      </section>

      <p className="text-sm">
        <Link to="/" className="text-accent-light hover:underline">
          ← Voltar ao início
        </Link>
      </p>
    </div>
  )
}
