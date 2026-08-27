import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import api from '../services/api';

export const PoliticaTrocas = () => {
  const { appearance } = useStoreConfig();
  
  const storeName = appearance?.SITE_TITLE || 'Nossa Loja';
  const primaryColor = appearance?.BTN_PRIMARY_BG || '#EA1D2C';
  const nomeSaaS = 'ARARINHACLOUD';
  
  // Formata a data por extenso automaticamente
  const dataAtual = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  // 🟢 Estado para guardar os contatos reais do cliente (lojista)
  const [lojaInfo, setLojaInfo] = useState({
    email: 'contato@sualoja.com.br',
    telefone: '(00) 00000-0000'
  });

  // 🟢 Busca os dados do TENANT no backend para preencher os contatos
  useEffect(() => {
    const fetchContato = async () => {
      try {
        const { data } = await api.get('/tenants/info'); 
        if (data) {
          setLojaInfo({
            email: data.email_contato || data.email || 'contato@sualoja.com.br',
            telefone: data.telefone_contato || data.telefone || '(00) 00000-0000'
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados da loja para a política de trocas", error);
      }
    };
    fetchContato();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-gray-800">
      
      {/* 🟢 CABEÇALHO */}
      <header className="bg-white shadow-sm border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>
            <i className="bi bi-arrow-left"></i> Voltar para a loja
          </Link>
          <span className="font-bold text-gray-900 truncate max-w-[200px]">{storeName}</span>
        </div>
      </header>

      {/* 🟢 CONTEÚDO DA POLÍTICA */}
      <main className="max-w-4xl mx-auto px-4 pt-10">
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Política de Trocas, Devoluções e Reembolsos</h1>
            <p className="text-sm text-gray-500">Última atualização: {dataAtual}</p>
          </div>

          <div className="space-y-8 text-[15px] text-gray-700 leading-relaxed">
            
            <section>
              <p className="mb-4">
                Esta Política regula as condições de trocas, devoluções e reembolsos de pedidos realizados na <strong>{storeName}</strong>.
              </p>
            </section>

            {/* CAIXA DE AVISO IMPORTANTE */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl text-amber-900">
              <h3 className="font-extrabold flex items-center gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i> Importante:
              </h3>
              <p className="mb-3">
                A <strong>{storeName}</strong> é a única responsável pela análise, aprovação e execução de trocas, devoluções e reembolsos. 
              </p>
              <p>
                A plataforma tecnológica (SaaS) <strong>{nomeSaaS}</strong> apenas fornece a ferramenta para registro dos pedidos e não participa de nenhuma decisão ou operação relacionada a trocas ou reembolsos. Qualquer solicitação deve ser feita diretamente à loja.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">1. Direito de Arrependimento (Lei nº 8.078/1990 – CDC, art. 49)</h2>
              <p className="mb-3">
                Você tem o direito de desistir da compra no prazo de <strong>7 (sete) dias</strong>, contados a partir do recebimento do produto, sem necessidade de justificativa.
              </p>
              <p className="font-bold mb-2">Condições para exercer o arrependimento:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>O produto deve ser devolvido em sua embalagem original, sem sinais de uso, com todos os acessórios e nota fiscal.</li>
                <li><strong>Produtos alimentícios, perecíveis ou de cardápio (comidas, bebidas, lanches, etc.):</strong> o arrependimento só será aceito se o produto ainda não foi consumido e estiver lacrado na embalagem original. Após o consumo ou violação da embalagem, não será possível o reembolso.</li>
                <li><strong>Produtos de higiene, cosméticos ou que entrem em contato com o corpo:</strong> não aceitamos devolução por questões de higiene.</li>
                <li>O custo do frete de devolução fica por conta do cliente (exceto quando o produto vier com defeito ou erro da loja).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">2. Trocas por Defeito ou Divergência</h2>
              <p className="mb-3">A loja aceita troca ou devolução quando:</p>
              <ul className="list-none space-y-2 pl-2 mb-4">
                <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i>O produto apresentar defeito de fabricação;</li>
                <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i>O produto recebido for diferente do pedido (modelo, cor, tamanho, sabor etc.);</li>
                <li><i className="bi bi-check-circle-fill text-green-500 mr-2"></i>O produto vier danificado durante o transporte.</li>
              </ul>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <strong>Prazo para solicitar troca:</strong> até 7 dias após o recebimento.
              </div>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">3. Regras Específicas por Tipo de Produto</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900">
                      <th className="py-3 px-4 font-bold border-b border-gray-200">Tipo de Produto</th>
                      <th className="py-3 px-4 font-bold border-b border-gray-200">Aceita Troca/Devolução?</th>
                      <th className="py-3 px-4 font-bold border-b border-gray-200">Condições</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Alimentos / Bebidas / Lanches</td>
                      <td className="py-3 px-4 text-amber-600 font-medium">Apenas se não consumido e lacrado</td>
                      <td className="py-3 px-4 text-sm">Embalagem original intacta</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Produtos perecíveis</td>
                      <td className="py-3 px-4 text-red-600 font-medium">Não aceitamos após o recebimento</td>
                      <td className="py-3 px-4 text-sm">Validade e qualidade são responsabilidade do cliente no momento da entrega</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Produtos de higiene / cosméticos</td>
                      <td className="py-3 px-4 text-red-600 font-medium">Não aceitamos por motivos de higiene</td>
                      <td className="py-3 px-4 text-sm text-center">—</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Mercadoria em geral (e-commerce)</td>
                      <td className="py-3 px-4 text-green-600 font-medium">Sim, dentro do prazo legal</td>
                      <td className="py-3 px-4 text-sm">Embalagem original, sem uso</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Produtos sob encomenda</td>
                      <td className="py-3 px-4 text-red-600 font-medium">Não aceitamos arrependimento</td>
                      <td className="py-3 px-4 text-sm">Salvo defeito de fabricação</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">4. Processo de Troca ou Devolução</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Entre em contato com a loja imediatamente pelo WhatsApp ou e-mail informado.</li>
                <li>Informe o número do pedido e o motivo da solicitação.</li>
                <li>Aguarde a análise da loja (prazo máximo de 2 dias úteis).</li>
                <li>Se aprovado, siga as instruções para devolução do produto.</li>
                <li>Após recebimento e verificação do produto pela loja, o reembolso ou nova entrega será processado.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">5. Reembolso</h2>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Pix ou mesma forma de pagamento:</strong> realizado em até 10 dias úteis após aprovação da devolução.</li>
                <li><strong>Cartão de crédito:</strong> o estorno será feito na fatura (prazo depende da operadora, geralmente 1 a 2 faturas).</li>
              </ul>
              <p className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 text-sm font-medium">
                Não haverá reembolso de taxa de entrega quando o arrependimento for exercido pelo cliente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">6. Situações em que não realizamos reembolso ou troca</h2>
              <ul className="list-none space-y-2 pl-2">
                <li><i className="bi bi-x text-red-500 mr-2 text-lg font-bold"></i>Produto consumido ou embalagem violada (no caso de alimentos);</li>
                <li><i className="bi bi-x text-red-500 mr-2 text-lg font-bold"></i>Arrependimento após o prazo de 7 dias;</li>
                <li><i className="bi bi-x text-red-500 mr-2 text-lg font-bold"></i>Mau uso, dano causado pelo cliente ou transporte inadequado após a entrega;</li>
                <li><i className="bi bi-x text-red-500 mr-2 text-lg font-bold"></i>Devolução sem comunicação prévia com a loja;</li>
                <li><i className="bi bi-x text-red-500 mr-2 text-lg font-bold"></i>Produtos com validade expirada por culpa do cliente (ex: não retirado no prazo).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">7. Responsabilidade</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Toda a responsabilidade por trocas, devoluções e reembolsos é exclusivamente da <strong>{storeName}</strong>.</li>
                <li>A plataforma SaaS não se responsabiliza por decisões de aprovação, prazos de reembolso ou qualquer insatisfação relacionada a produtos ou serviços vendidos pela loja.</li>
              </ul>
            </section>

            {/* 🟢 SEÇÃO DE CONTATO DINÂMICA */}
            <section className="bg-gray-50 border border-gray-200 p-6 rounded-2xl mt-8">
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">8. Contato</h2>
              <p className="mb-4">
                Para solicitar troca, devolução ou reembolso, entre em contato diretamente com a <strong>{storeName}</strong> pelos canais abaixo:
              </p>
              
              <div className="flex flex-col gap-3 font-medium">
                <div className="flex items-center gap-3 text-gray-800">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500 border border-gray-100">
                    <i className="bi bi-whatsapp text-lg"></i>
                  </div>
                  <span>{lojaInfo.telefone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-800">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 border border-gray-100">
                    <i className="bi bi-envelope-fill text-lg"></i>
                  </div>
                  <span className="truncate">{lojaInfo.email}</span>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 mt-8 border-t border-gray-100">
              <p className="font-extrabold text-gray-900 text-lg">Agradecemos pela preferência e estamos à disposição para ajudar!</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};