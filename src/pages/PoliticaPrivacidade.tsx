import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import api from '../services/api';

export const PoliticaPrivacidade = () => {
  const { appearance } = useStoreConfig();
  
  const storeName = appearance?.SITE_TITLE || 'Nossa Loja';
  const primaryColor = appearance?.BTN_PRIMARY_BG || '#EA1D2C';
  const nomeSaaS = 'ARARINHACLOUD';
  
  // Formata a data por extenso (Ex: 04 de abril de 2026)
  const dataAtual = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  // 🟢 Estado para guardar os contatos reais do cliente (lojista)
  const [contatoLoja, setContatoLoja] = useState({
    email: 'contato@sualoja.com.br',
    telefone: '(00) 00000-0000'
  });

  // 🟢 Busca os dados do TENANT no backend
  useEffect(() => {
    const fetchContato = async () => {
      try {
        // Busca os dados diretamente do dono da loja (Tenant)
        const { data } = await api.get('/tenants/info'); 
        if (data) {
          setContatoLoja({
            email: data.email_contato || data.email || 'contato@sualoja.com.br',
            telefone: data.telefone_contato || '(00) 00000-0000'
          });
        }
      } catch (error) {
        console.error("Erro ao buscar contatos da loja", error);
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
            <h1 className="text-3xl font-black text-gray-900 mb-2">Política de Privacidade</h1>
            <p className="text-sm text-gray-500">Última atualização: {dataAtual}</p>
          </div>

          <div className="space-y-8 text-[15px] text-gray-700 leading-relaxed">
            
            <section>
              <p className="mb-4">
                Esta Política de Privacidade explica como são tratados os dados pessoais dos usuários desta loja online, que opera por meio de uma plataforma tecnológica SaaS fornecida por <strong>{nomeSaaS}</strong>, doravante denominada “Plataforma” ou “Operador”.
              </p>
            </section>

            {/* CAIXA DE AVISO IMPORTANTE */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-2xl text-blue-900">
              <h3 className="font-extrabold flex items-center gap-2 mb-3">
                <i className="bi bi-info-circle-fill"></i> Importante:
              </h3>
              <p className="mb-3">
                A <strong>{storeName}</strong> é o Controlador dos seus dados pessoais. Isso significa que a loja decide quais dados são coletados, para quais finalidades e como são usados. A Plataforma atua somente como Operador, realizando o tratamento de dados em nome e conforme as instruções da <strong>{storeName}</strong>.
              </p>
              <p className="font-bold">
                Ao navegar ou realizar compras nesta loja, você aceita as práticas descritas nesta Política.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">1. Dados que coletamos</h2>
              <p className="mb-3">Podemos coletar os seguintes dados pessoais:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Dados de identificação:</strong> nome completo, CPF/CNPJ, data de nascimento.</li>
                <li><strong>Dados de contato:</strong> e-mail, telefone, endereço completo.</li>
                <li><strong>Dados de pedido:</strong> itens comprados, valor, forma de pagamento, endereço de entrega ou retirada.</li>
                <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, dispositivo utilizado, cookies e dados de navegação.</li>
                <li><strong>Outros:</strong> informações fornecidas voluntariamente em formulários ou atendimento.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">2. Finalidades do tratamento</h2>
              <p className="mb-3">Tratamos seus dados para:</p>
              <ul className="list-none space-y-2 pl-2">
                <li><i className="bi bi-check2 text-blue-500 mr-2 font-bold"></i>Processar e gerenciar seus pedidos (compra, pagamento, entrega ou retirada).</li>
                <li><i className="bi bi-check2 text-blue-500 mr-2 font-bold"></i>Realizar o atendimento ao cliente.</li>
                <li><i className="bi bi-check2 text-blue-500 mr-2 font-bold"></i>Cumprir obrigações legais (emissão de nota fiscal, Código de Defesa do Consumidor etc.).</li>
                <li><i className="bi bi-check2 text-blue-500 mr-2 font-bold"></i>Melhorar a experiência na loja e realizar análises internas.</li>
                <li><i className="bi bi-check2 text-blue-500 mr-2 font-bold"></i>Enviar comunicações sobre pedidos (não enviamos marketing sem consentimento).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">3. Bases legais para o tratamento (LGPD)</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Execução de contrato (processamento de pedidos).</li>
                <li>Cumprimento de obrigação legal ou regulatória.</li>
                <li>Legítimo interesse da loja.</li>
                <li>Consentimento (quando aplicável, por exemplo para comunicações promocionais).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
              <p className="mb-3">A <strong>{storeName}</strong> pode compartilhar seus dados com:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>A Plataforma (nosso Operador), que processa os dados apenas para fornecer o serviço técnico.</li>
                <li>Gateways de pagamento, empresas de logística/entrega e ferramentas integradas.</li>
                <li>Autoridades públicas, quando exigido por lei.</li>
              </ul>
              <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                A Plataforma não vende, aluga ou compartilha seus dados para fins comerciais. Ela trata os dados exclusivamente conforme instruções da loja e obrigações contratuais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">5. Papel da Plataforma (Operador)</h2>
              <p className="mb-2">A Plataforma <strong>{nomeSaaS}</strong>:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Atua somente como operador de dados.</li>
                <li>Não decide as finalidades nem os meios de tratamento.</li>
                <li>Não é responsável pelo conteúdo dos pedidos, qualidade dos produtos ou atendimento ao cliente.</li>
              </ul>
              <p className="mt-3 font-medium">Qualquer solicitação relacionada aos seus direitos deve ser enviada diretamente à <strong>{storeName}</strong>.</p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">6. Seus direitos como titular dos dados (LGPD)</h2>
              <p className="mb-3">Você pode, a qualquer momento, solicitar à <strong>{storeName}</strong>:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-none pl-0 mb-4">
                <li><i className="bi bi-caret-right-fill text-gray-400 mr-2 text-xs"></i>Confirmação da existência de tratamento.</li>
                <li><i className="bi bi-caret-right-fill text-gray-400 mr-2 text-xs"></i>Acesso aos seus dados.</li>
                <li><i className="bi bi-caret-right-fill text-gray-400 mr-2 text-xs"></i>Correção de dados.</li>
                <li><i className="bi bi-caret-right-fill text-gray-400 mr-2 text-xs"></i>Eliminação de dados desnecessários.</li>
                <li><i className="bi bi-caret-right-fill text-gray-400 mr-2 text-xs"></i>Portabilidade dos dados.</li>
                <li><i className="bi bi-caret-right-fill text-gray-400 mr-2 text-xs"></i>Revogação do consentimento.</li>
              </ul>
              <p>Para exercer seus direitos, entre em contato diretamente com a <strong>{storeName}</strong> pelos canais informados por ela (e-mail, WhatsApp ou formulário da loja).</p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">7. Segurança dos dados</h2>
              <p>
                Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhuma medida de segurança é infalível.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">8. Cookies</h2>
              <p>
                Utilizamos cookies para melhorar a navegação, lembrar preferências e analisar o uso da loja. Você pode gerenciar ou bloquear cookies nas configurações do seu navegador. Alguns cookies são essenciais para o funcionamento da loja.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">9. Prazo de armazenamento</h2>
              <p>
                Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas, obrigações legais ou contratuais. Após esse período, os dados são eliminados ou anonimizados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">10. Transferência internacional</h2>
              <p>
                Seus dados podem ser armazenados em servidores no Brasil ou no exterior, sempre com as salvaguardas exigidas pela LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">11. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política periodicamente. A versão atualizada será publicada nesta página com a nova data. Recomendamos que você consulte regularmente.
              </p>
            </section>

            {/* 🟢 SEÇÃO DE CONTATO DINÂMICA */}
            <section className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-3">12. Contato</h2>
              <p className="mb-4">
                Dúvidas sobre esta Política ou sobre o tratamento dos seus dados devem ser enviadas diretamente à <strong>{storeName}</strong> pelos seguintes canais:
              </p>
              <div className="flex flex-col gap-3 font-medium">
                <div className="flex items-center gap-3 text-gray-800">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 border border-gray-100">
                    <i className="bi bi-envelope-fill text-lg"></i>
                  </div>
                  <span className="truncate">{contatoLoja.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-800">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500 border border-gray-100">
                    <i className="bi bi-whatsapp text-lg"></i>
                  </div>
                  <span>{contatoLoja.telefone}</span>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 mt-8 border-t border-gray-100">
              <p className="font-medium text-gray-500 text-sm">
                Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018) e demais normas aplicáveis.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};