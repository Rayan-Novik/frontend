import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import api from '../services/api';

export const PoliticaEntrega = () => {
  const { appearance } = useStoreConfig();
  
  const storeName = appearance?.SITE_TITLE || 'Nossa Loja';
  const primaryColor = appearance?.BTN_PRIMARY_BG || '#EA1D2C';
  const nomeSaaS = 'ARARINHACLOUD';
  
  // Formata a data por extenso automaticamente (Ex: 04 de abril de 2026)
  const dataAtual = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  // 🟢 Estado para guardar os contatos e o endereço real da loja
  const [lojaInfo, setLojaInfo] = useState({
    email: 'contato@sualoja.com.br',
    telefone: '(00) 00000-0000',
    endereco: 'Endereço não cadastrado'
  });

  // 🟢 Busca os dados do TENANT e da LOJA FÍSICA no backend simultaneamente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Dispara as duas buscas ao mesmo tempo para ser mais rápido
        const [tenantRes, lojasRes] = await Promise.all([
          api.get('/tenants/info'),
          api.get('/lojas')
        ]);
        
        const tenantData = tenantRes.data;
        const lojaData = lojasRes.data && lojasRes.data.length > 0 ? lojasRes.data[0] : null;

        // Monta o endereço bonitinho se a loja existir
        let enderecoStr = 'Endereço não informado';
        if (lojaData) {
          enderecoStr = `${lojaData.logradouro || ''}, ${lojaData.numero || 'S/N'}${lojaData.complemento ? ' - ' + lojaData.complemento : ''} - ${lojaData.bairro || ''}, ${lojaData.cidade || ''}/${lojaData.estado || ''}`;
        }

        setLojaInfo({
          email: tenantData?.email_contato || tenantData?.email || 'contato@sualoja.com.br',
          telefone: tenantData?.telefone_contato || '(00) 00000-0000',
          endereco: enderecoStr
        });

      } catch (error) {
        console.error("Erro ao buscar dados da loja para a política de entrega", error);
      }
    };
    fetchData();
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
            <h1 className="text-3xl font-black text-gray-900 mb-2">Política de Entrega e Retirada</h1>
            <p className="text-sm text-gray-500">Última atualização: {dataAtual}</p>
          </div>

          <div className="space-y-8 text-[15px] text-gray-700 leading-relaxed">
            
            <section>
              <p className="mb-4">
                Esta Política de Entrega e Retirada regula as condições de envio, entrega e retirada de pedidos realizados na <strong>{storeName}</strong>.
              </p>
            </section>

            {/* CAIXA DE AVISO IMPORTANTE */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl text-amber-900">
              <h3 className="font-extrabold flex items-center gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i> Importante:
              </h3>
              <p className="mb-3">
                A <strong>{storeName}</strong> é totalmente responsável pela logística, entrega e retirada dos produtos. A plataforma tecnológica utilizada (SaaS) fornecida por <strong>{nomeSaaS}</strong> apenas fornece a ferramenta para registro e gerenciamento dos pedidos. 
              </p>
              <p className="font-bold">
                A plataforma não realiza entregas, não contrata motoboys, não gerencia frota e não possui qualquer responsabilidade sobre prazos, qualidade da entrega ou problemas logísticos.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">1. Modalidades de Recebimento</h2>
              <p className="mb-3">A loja oferece as seguintes opções:</p>
              <ul className="list-none space-y-2 pl-2">
                <li><i className="bi bi-motorcycle text-blue-500 mr-2 font-bold"></i>Entrega a domicílio (Delivery)</li>
                <li><i className="bi bi-shop text-blue-500 mr-2 font-bold"></i>Retirada em balcão / Take-away (quando disponível)</li>
                <li><i className="bi bi-box-seam text-blue-500 mr-2 font-bold"></i>Envio pelos Correios ou transportadora (para e-commerce e mercadinho)</li>
              </ul>
              <p className="mt-4">
                No momento da finalização do pedido, você poderá escolher a modalidade disponível para o seu CEP ou endereço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">2. Entrega a Domicílio (Delivery)</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>O prazo de entrega é estimado e informado no momento da confirmação do pedido.</li>
                <li>O prazo começa a contar após a confirmação do pagamento e do preparo do pedido.</li>
                <li>Fatores externos como trânsito intenso, condições climáticas, greves, bloqueios de vias ou alta demanda podem alterar o prazo.</li>
                <li>A entrega será realizada no endereço informado pelo cliente. Caso ninguém esteja presente para receber, o entregador poderá deixar o pedido com porteiro, vizinho ou retornar conforme política da loja.</li>
              </ul>
              <div className="bg-gray-50 p-4 rounded-xl mt-4 border border-gray-100">
                <strong>Taxa de entrega:</strong> O valor da taxa de entrega é calculado automaticamente conforme distância, bairro ou CEP. O valor exato aparece antes da finalização do pedido.
              </div>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">3. Retirada em Balcão (Take-away)</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Disponível em horários específicos informados na loja.</li>
                <li>
                  O pedido fica pronto para retirada no endereço da loja: <br/>
                  <strong className="text-gray-900 bg-blue-50 px-2 py-1 rounded inline-block mt-1 border border-blue-100">
                    <i className="bi bi-geo-alt-fill text-blue-500 mr-1"></i> {lojaInfo.endereco}
                  </strong>
                </li>
                <li>É obrigatório apresentar o número do pedido ou documento no momento da retirada.</li>
                <li>O cliente tem até <strong>60 minutos</strong> após o aviso de "pedido pronto" para retirar. Após esse prazo, a loja se reserva o direito de cancelar o pedido sem reembolso (para produtos perecíveis).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">4. Envio por Transportadora ou Correios</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>O prazo de envio é informado no checkout (geralmente de 1 a 5 dias úteis após confirmação do pagamento).</li>
                <li>O rastreamento será enviado por e-mail ou WhatsApp assim que o pedido for postado.</li>
                <li>A loja não se responsabiliza por atrasos causados pelos Correios ou pela transportadora após a postagem.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">5. Condições Gerais de Entrega</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>A entrega só será realizada se o valor mínimo do pedido for atingido (quando configurado pela loja).</li>
                <li>Pedidos com endereço em áreas de risco, ruas sem acesso ou com restrições podem ser recusados ou ter taxa adicional.</li>
                <li>Em caso de impossibilidade de entrega por motivo de endereço incorreto ou incompleto fornecido pelo cliente, a loja não se responsabiliza por novo envio sem cobrança de nova taxa.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">6. Atrasos e Problemas na Entrega</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Em caso de atraso significativo, entre em contato com a loja pelo WhatsApp ou telefone informado.</li>
                <li>A loja fará o possível para resolver a situação (reembolso parcial, crédito para próxima compra ou cancelamento sem custo).</li>
                <li>A plataforma SaaS não participa da resolução de problemas de entrega.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">7. Cancelamento por Motivo de Entrega</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>O cliente pode cancelar o pedido antes do início do preparo ou do envio sem custo.</li>
                <li>Após o preparo iniciado (no caso de alimentos) ou após o envio, o cancelamento fica sujeito à análise e aprovação da loja.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">8. Responsabilidade</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Toda a responsabilidade pela entrega, qualidade dos produtos, condições de higiene (no caso de alimentos) e atendimento relacionado à logística é exclusivamente da <strong>{storeName}</strong>.</li>
                <li>A plataforma tecnológica não possui qualquer vínculo empregatício ou contratual com entregadores e não responde por acidentes, extravios ou danos durante o transporte.</li>
              </ul>
            </section>

            {/* 🟢 SEÇÃO DE CONTATO DINÂMICA */}
            <section className="bg-gray-50 border border-gray-200 p-6 rounded-2xl mt-8">
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">9. Contato para dúvidas sobre entrega</h2>
              <p className="mb-4">
                Para qualquer informação sobre o status do seu pedido, atrasos ou problemas com entrega/retirada, entre em contato diretamente com a <strong>{storeName}</strong> pelos seguintes canais:
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
              <p className="font-extrabold text-gray-900 text-lg">Agradecemos pela compreensão e pela preferência pela {storeName}!</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};