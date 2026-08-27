import { Link } from 'react-router-dom';
import { useStoreConfig } from '../contexts/StoreConfigContext';

export const TermosDeUso = () => {
  // Puxa as configurações da loja do banco de dados (o mesmo que alimenta o Header)
  const { appearance } = useStoreConfig();
  
  // Nome dinâmico da loja. Se por algum motivo não carregar, usa "Nossa Loja" como padrão.
  const storeName = appearance?.SITE_TITLE || 'Nossa Loja';
  const primaryColor = appearance?.BTN_PRIMARY_BG || '#EA1D2C';
  
  // Pega a data atual formatada (Ex: 04/04/2026)
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-gray-800">
      
      {/* 🟢 CABEÇALHO SIMPLES PARA VOLTAR À LOJA */}
      <header className="bg-white shadow-sm border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>
            <i className="bi bi-arrow-left"></i> Voltar para a loja
          </Link>
          <span className="font-bold text-gray-900 truncate max-w-[200px]">{storeName}</span>
        </div>
      </header>

      {/* 🟢 CONTEÚDO DOS TERMOS */}
      <main className="max-w-4xl mx-auto px-4 pt-10">
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Termos de Uso da Loja</h1>
            <p className="text-sm text-gray-500">Última atualização: {dataAtual}</p>
          </div>

          <div className="space-y-8 text-[15px] text-gray-700 leading-relaxed">
            
            <section>
              <p className="mb-4 text-lg">
                Bem-vindo à loja online <strong className="text-gray-900">{storeName}</strong>!
              </p>
              <p>
                Esta loja funciona por meio de uma plataforma tecnológica SaaS (software como serviço) fornecida por <strong>ARARINHACLOUD</strong>, doravante denominada “Plataforma” ou “Fornecedor da Tecnologia”.
              </p>
            </section>

            {/* CAIXA DE AVISO IMPORTANTE */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl text-amber-900">
              <h3 className="font-extrabold flex items-center gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i> Importante:
              </h3>
              <p className="mb-3">
                A <strong>{storeName}</strong> é operada de forma independente pelo lojista responsável. A Plataforma apenas disponibiliza a ferramenta tecnológica para criação e gestão da loja virtual (cardápio digital, e-commerce ou mercadinho).
              </p>
              <p className="mb-3">
                A Plataforma NÃO é vendedora dos produtos, não participa da relação comercial, não realiza entregas, não manipula alimentos, não gerencia estoque e não possui qualquer responsabilidade sobre os produtos, serviços, preços, pagamentos, entregas ou atendimento oferecidos pela loja.
              </p>
              <p className="font-bold">
                Ao realizar qualquer compra ou pedido nesta loja, você celebra um contrato diretamente com a <strong>{storeName}</strong> (lojista), que é o único responsável pela venda.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">1. Objeto</h2>
              <p>
                Estes Termos regulam o uso da interface da loja online. A relação de compra e venda de produtos é regida exclusivamente pelas regras definidas pela <strong>{storeName}</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">2. Responsabilidades</h2>
              
              <h3 className="font-bold text-gray-800 text-lg mb-2">2.1 Da Plataforma (Fornecedor da Tecnologia)</h3>
              <p className="mb-3">A Plataforma oferece apenas o sistema para o lojista gerenciar sua loja (cardápio, pedidos, pagamentos, etc.). A Plataforma não se responsabiliza por:</p>
              <ul className="list-none space-y-2 mb-4 pl-2">
                <li><i className="bi bi-dash text-gray-400 mr-2"></i>Qualidade, quantidade, segurança ou adequação dos produtos oferecidos;</li>
                <li><i className="bi bi-dash text-gray-400 mr-2"></i>Preços, descrições, fotos ou informações dos produtos;</li>
                <li><i className="bi bi-dash text-gray-400 mr-2"></i>Processamento de pagamentos (mesmo que use gateway integrado);</li>
                <li><i className="bi bi-dash text-gray-400 mr-2"></i>Entrega, retirada, atrasos ou problemas logísticos;</li>
                <li><i className="bi bi-dash text-gray-400 mr-2"></i>Atendimento ao cliente, trocas, reembolsos ou cancelamentos;</li>
                <li><i className="bi bi-dash text-gray-400 mr-2"></i>Danos, prejuízos ou insatisfações decorrentes da compra;</li>
                <li><i className="bi bi-dash text-gray-400 mr-2"></i>Qualquer inadimplência ou descumprimento por parte do lojista.</li>
              </ul>
              <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium">
                Qualquer reclamação, dúvida ou problema relacionado à compra deve ser direcionada exclusivamente à <strong>{storeName}</strong>.
              </p>

              <h3 className="font-bold text-gray-800 text-lg mt-6 mb-2">2.2 Do Lojista ({storeName})</h3>
              <p className="mb-3">O lojista é o único responsável por:</p>
              <ul className="list-none space-y-2 pl-2">
                <li><i className="bi bi-check2 text-green-500 mr-2 font-bold"></i>Todo o conteúdo da loja (produtos, preços, descrições, fotos);</li>
                <li><i className="bi bi-check2 text-green-500 mr-2 font-bold"></i>Cumprimento das obrigações perante o consumidor (Código de Defesa do Consumidor);</li>
                <li><i className="bi bi-check2 text-green-500 mr-2 font-bold"></i>Processamento de pedidos, pagamentos, entregas e pós-venda;</li>
                <li><i className="bi bi-check2 text-green-500 mr-2 font-bold"></i>Conformidade com normas sanitárias (no caso de alimentos), fiscais e consumeristas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">3. Cadastro e Pedidos</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>O cadastro e a realização de pedidos ocorrem na loja do lojista.</li>
                <li>A Plataforma não armazena dados de pagamento sensíveis nem interfere na transação comercial.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">4. Direito de Arrependimento e Trocas</h2>
              <p>
                O exercício do direito de arrependimento (7 dias) e eventuais trocas ou reembolsos devem ser solicitados diretamente à <strong>{storeName}</strong>. A Plataforma não participa nem se responsabiliza por essas operações.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">5. Limitação de Responsabilidade da Plataforma</h2>
              <p className="mb-3">
                A Plataforma é disponibilizada “no estado em que se encontra” (as is). Não oferecemos qualquer garantia de disponibilidade ininterrupta, ausência de falhas ou adequação a fins específicos.
              </p>
              <p>
                Em nenhuma hipótese a Plataforma ou seus sócios, diretores e colaboradores serão responsáveis por danos diretos, indiretos, incidentais, consequenciais, lucros cessantes ou qualquer outro tipo de dano decorrente do uso da loja ou da relação comercial entre você e o lojista.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">6. Propriedade Intelectual</h2>
              <p>
                Todo o design, código, funcionalidade e marca da Plataforma pertencem exclusivamente ao Fornecedor da Tecnologia. O lojista recebe apenas uma licença temporária de uso mediante assinatura paga.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">7. Proteção de Dados (LGPD)</h2>
              <p>
                Os dados que você informa são tratados pela <strong>{storeName}</strong> (controlador dos dados na relação com você). A Plataforma atua como operador de dados conforme contrato com o lojista. Consulte a Política de Privacidade da loja.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">8. Foro</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Qualquer controvérsia relacionada ao uso da Plataforma será resolvida no foro da sede do Fornecedor da Tecnologia.</li>
                <li>Controvérsias relacionadas à compra e venda de produtos serão resolvidas entre você e a <strong>{storeName}</strong>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">9. Disposições Finais</h2>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li>Estes Termos podem ser alterados a qualquer momento pela Plataforma.</li>
                <li>O uso continuado da loja após alterações implica aceitação.</li>
                <li>Caso alguma cláusula seja considerada inválida, as demais permanecem válidas.</li>
                <li>
                  Dúvidas sobre o funcionamento da loja ou sobre os produtos devem ser encaminhadas diretamente à <strong>{storeName}</strong> pelos canais informados por ela (WhatsApp, e-mail, telefone etc.).
                </li>
              </ul>
            </section>

            <div className="text-center pt-8 mt-8 border-t border-gray-100">
              <p className="font-extrabold text-gray-900 text-lg">Obrigado por utilizar a loja!</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};