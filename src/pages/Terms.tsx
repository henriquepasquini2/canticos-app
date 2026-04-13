import { Link } from 'react-router-dom'

export function Terms() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Termos de uso</h1>
        <p className="mt-2 text-sm text-text-muted">
          Cânticos — Igreja Presbiteriana Filadelfia (São Carlos/SP). Última
          atualização: abril de 2026.
        </p>
      </div>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          1. Objeto do serviço
        </h2>
        <p>
          Este site oferece informações sobre o cronograma de cânticos e o
          repertório da IP Filadelfia, além de ferramentas internas para a
          equipe de louvor. O uso deve ser respeitoso e alinhado ao propósito
          do culto cristão.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          2. Contas e permissões
        </h2>
        <p>
          Parte do conteúdo é pública. Funções de edição, sincronização e
          gestão de usuários ficam restritas a contas autorizadas pela
          coordenação do louvor. Não compartilhe credenciais; o mau uso pode
          levar à revogação do acesso.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          3. Conteúdo e links externos
        </h2>
        <p>
          Partituras e materiais podem estar no Google Drive ou em outros
          endereços indicados no site. Esses serviços têm termos próprios. O
          cronograma e sugestões podem ser alterados pela equipe responsável.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          4. Limitação de responsabilidade
        </h2>
        <p>
          O site é oferecido no estado em que se encontra, como ferramenta de
          apoio à organização do louvor. Não garantimos disponibilidade
          ininterrupta nem ausência de erros. Em caso de divergência, prevalecem
          as decisões da liderança local da igreja.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">
          5. Alterações
        </h2>
        <p>
          Estes termos podem ser atualizados. A data no topo da página indica a
          última revisão relevante.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <h2 className="text-base font-semibold text-text-primary">6. Contato</h2>
        <p>
          Questões sobre estes termos: coordenação do louvor ou da IP
          Filadelfia.
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
