import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import { CartStep } from '../../../components/checkout/CartStep';
import { AddressStep } from '../../../components/checkout/AddressStep';
import { PaymentStep } from '../../../components/checkout/PaymentStep';
import { SuccessStep } from '../../../components/checkout/SuccessStep';
import { useCart } from '../../../contexts/CartContext';
import { useStoreConfig } from '../../../contexts/StoreConfigContext';

const verificarLojaAberta = (horaAbertura?: string, horaFechamento?: string, diasStr = "0,1,2,3,4,5,6") => {
  if (!horaAbertura || !horaFechamento) return true;

  const dateManaus = new Date(new Date().toLocaleString("en-US", { timeZone: 'America/Manaus' }));
  const diaAtual = dateManaus.getDay();
  const diasAbertos = diasStr.split(',').map(Number);

  if (!diasAbertos.includes(diaAtual)) return false;

  const horaAtual = dateManaus.getHours();
  const minutoAtual = dateManaus.getMinutes();
  const minutosAgora = horaAtual * 60 + minutoAtual;

  const [abreH, abreM] = horaAbertura.split(':').map(Number);
  const minutosAbre = abreH * 60 + abreM;

  const [fechaH, fechaM] = horaFechamento.split(':').map(Number);
  const minutosFecha = fechaH * 60 + fechaM;

  if (minutosFecha < minutosAbre) return minutosAgora >= minutosAbre || minutosAgora <= minutosFecha;
  return minutosAgora >= minutosAbre && minutosAgora <= minutosFecha;
};

export const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { appearance } = useStoreConfig();
  const pixAtivo = appearance?.PIX_DESCONTO_ATIVO;
  const pixPorcentagem = appearance?.PIX_DESCONTO_PORCENTAGEM || 0;

  const [currentStep, setCurrentStep] = useState(1);
  const { items, cartTotal, clearCart } = useCart();
  const [frete, setFrete] = useState(0);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<number | null>(null);
  const [dadosEntregaRaw, setDadosEntregaRaw] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  const [lojaAberta, setLojaAberta] = useState(true);
  const [infoLoja, setInfoLoja] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [erroCupom, setErroCupom] = useState('');
  const [loadingCupom, setLoadingCupom] = useState(false);

  const [metodoPagamento, setMetodoPagamento] = useState('');

  // 🟢 MÁGICA DEFINITIVA: Olha diretamente para a configuração da loja para pular o endereço!
  const isStoreAgendamento = appearance?.STORE_LAYOUT_STYLE === 'SERVICOS' || appearance?.STORE_LAYOUT_STYLE === 'BARBEARIA';
  const isAgendamentoOnly = isStoreAgendamento || (items.length > 0 && items.every((item: any) => item.data_agendamento));

  const descontoCupom = cupomAplicado ? cupomAplicado.desconto_total : 0;
  const subtotalComCupom = Math.max(0, cartTotal - descontoCupom);

  const temDescontoPix = pixAtivo && pixPorcentagem > 0 && metodoPagamento === 'PIX';
  const valorDescontoPix = temDescontoPix ? subtotalComCupom * (pixPorcentagem / 100) : 0;

  const totalFinal = Math.max(0, subtotalComCupom + frete - valorDescontoPix);

  useEffect(() => {
    if (location.state?.returnToStep === 2) {
      setCurrentStep(isAgendamentoOnly ? 3 : 2);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isAgendamentoOnly]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId') || '1';
        const tenantSlug = localStorage.getItem('tenantSlug') || '';

        const config = {
          headers: {
            'x-tenant-id': tenantId,
            'x-tenant-slug': tenantSlug
          }
        };

        const { data } = await api.get('/lojas', config);
        if (data && data.length > 0) {
          const loja = data[0];
          setInfoLoja(loja);
          const aberta = verificarLojaAberta(loja.hora_abertura, loja.hora_fechamento, loja.dias_funcionamento);
          setLojaAberta(aberta);
        }
      } catch (e) {
        console.error("Erro ao validar status da loja");
      } finally {
        setLoadingStatus(false);
      }
    };
    checkStatus();
  }, []);

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const handleAplicarCupom = async () => {
    if (!cupomCodigo.trim()) return;
    setLoadingCupom(true);
    setErroCupom('');
    try {
      const tenantId = localStorage.getItem('tenantId') || '1';
      const res = await api.post(`/cupons/validar/${tenantId}`, {
        codigo: cupomCodigo,
        carrinho: items,
        valorFrete: frete || 0
      });
      setCupomAplicado(res.data);
      setCupomCodigo('');
    } catch (error: any) {
      setErroCupom(error.response?.data?.message || 'Erro ao validar cupom.');
      setCupomAplicado(null);
    } finally {
      setLoadingCupom(false);
    }
  };

  const removerCupom = () => {
    setCupomAplicado(null);
    setErroCupom('');
  };

  const handleProceedToAddress = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { state: { returnUrl: '/checkout', returnToStep: 2 } });
      return;
    }

    if (isAgendamentoOnly) {
      setFrete(0);
      setCurrentStep(3); // 🟢 Pula a etapa 2 de endereço se for agendamento
    } else {
      setCurrentStep(2);
    }
  };

  const handleFinalizarCompra = async (paymentPayload: any) => {
    // 🟢 CORREÇÃO AQUI: Se for agendamento, ignora se a loja tá fechada agora!
    if (!lojaAberta && !isAgendamentoOnly) {
      alert("A loja fechou enquanto você finalizava o pedido. Não é possível processar a compra.");
      return;
    }

    setIsProcessing(true);
    try {
      const payloadDoPedido = {
        ...paymentPayload,
        preco_frete: frete,
        id_cupom: cupomAplicado?.id_cupom || undefined,
        desconto_pix: valorDescontoPix > 0 ? valorDescontoPix : undefined,
        id_endereco_entrega: enderecoSelecionadoId || undefined,
        tipo_entrega: isAgendamentoOnly ? 'LOCAL' : undefined,
        info_local: isAgendamentoOnly ? 'Agendamento em Loja' : undefined,
        dados_entrega: enderecoSelecionadoId || isAgendamentoOnly ? undefined : {
          entrega_logradouro: dadosEntregaRaw?.rua || dadosEntregaRaw?.logradouro,
          entrega_numero: dadosEntregaRaw?.numero,
          entrega_bairro: dadosEntregaRaw?.bairro,
          entrega_cidade: dadosEntregaRaw?.cidade,
          entrega_estado: dadosEntregaRaw?.estado,
          entrega_cep: dadosEntregaRaw?.cep,
          entrega_complemento: dadosEntregaRaw?.complemento
        }
      };

      const tenantId = localStorage.getItem('tenantId') || '1';
      const res = await api.post('/pedidos', payloadDoPedido, {
        headers: { 'x-tenant-id': tenantId }
      });

      clearCart();
      setOrderResult(res.data);
      setCurrentStep(4);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Erro ao processar o pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] py-8 pb-24 relative">

      {!loadingStatus && !lojaAberta && !isAgendamentoOnly && currentStep < 4 && (
        <div className="fixed inset-0 z-[110] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <i className="bi bi-door-closed-fill text-5xl"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Loja Fechada no Momento</h2>
          <p className="text-gray-600 max-w-md mb-8 text-lg">
            Desculpe! Já encerramos nossas atividades por hoje. <br/>
            Voltamos a atender no próximo horário disponível: <br/>
            <strong className="text-red-600 font-bold">{infoLoja?.hora_abertura} às {infoLoja?.hora_fechamento}</strong>
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl"
          >
            Voltar para o Início
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900">Processando seu pedido...</h2>
          <p className="text-gray-500 mt-2">Estamos conectando com o gateway de pagamento seguro.</p>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {currentStep < 4 && (
          <div className="flex items-center justify-center mb-8 max-w-3xl mx-auto bg-white p-4 sm:p-6 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center w-full">

              <div className={`flex flex-col items-center flex-1 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1 sm:mb-2 transition-all ${currentStep >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-50' : 'bg-gray-100'}`}>1</div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">Carrinho</span>
              </div>

              <div className={`w-8 sm:w-16 h-1 rounded-full transition-colors ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>

              <div className={`flex flex-col items-center flex-1 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1 sm:mb-2 transition-all ${currentStep >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-50' : 'bg-gray-100'}`}>2</div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">{isAgendamentoOnly ? 'Aprovado' : 'Entrega'}</span>
              </div>

              <div className={`w-8 sm:w-16 h-1 rounded-full transition-colors ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>

              <div className={`flex flex-col items-center flex-1 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1 sm:mb-2 transition-all ${currentStep >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-50' : 'bg-gray-100'}`}>3</div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">Pagamento</span>
              </div>

            </div>
          </div>
        )}

        {currentStep === 4 ? (
          <SuccessStep orderData={orderResult} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-2/3">
              {currentStep === 1 && (
                <CartStep onNext={handleProceedToAddress} />
              )}

              {currentStep === 2 && !isAgendamentoOnly && (
                <AddressStep
                  onNext={(idEndereco: number, rawData: any) => {
                    setEnderecoSelecionadoId(idEndereco || null);
                    setDadosEntregaRaw(rawData || null);
                    setCurrentStep(3);
                  }}
                  onPrev={() => setCurrentStep(1)}
                  onSetFrete={setFrete}
                />
              )}

              {currentStep === 3 && (
                <PaymentStep
                  onPrev={() => setCurrentStep(isAgendamentoOnly ? 1 : 2)}
                  onFinish={handleFinalizarCompra}
                  valorTotal={totalFinal}
                  metodoPagamento={metodoPagamento}
                  setMetodoPagamento={setMetodoPagamento}
                  isAgendamento={isAgendamentoOnly}
                />
              )}
            </div>

            <div className="w-full lg:w-1/3">
              <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-gray-100 sticky top-24 w-full">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">Resumo do Pedido</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="font-medium">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                    <span className="font-bold text-gray-900">{formatarPreco(cartTotal)}</span>
                  </div>
                  {!isAgendamentoOnly && (
                    <div className="flex justify-between items-center text-gray-600">
                      <span className="font-medium">Frete</span>
                      <span className={`font-bold ${frete === 0 && currentStep > 1 ? 'text-green-600' : 'text-gray-900'}`}>
                        {currentStep === 1 ? (
                          <span className="text-sm font-normal text-gray-400">A calcular</span>
                        ) : frete === 0 ? (
                          'Grátis'
                        ) : (
                          formatarPreco(frete)
                        )}
                      </span>
                    </div>
                  )}

                  {cupomAplicado && (
                    <div className="flex justify-between text-green-600 font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                      <span>Desconto ({cupomAplicado.codigo})</span>
                      <span>- {formatarPreco(cupomAplicado.desconto_total)}</span>
                    </div>
                  )}

                  {temDescontoPix && (
                    <div className="flex justify-between text-green-600 font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6L2.6 12 12 21.4 21.4 12 12 2.6zm0 14.5l-5.1-5.1 5.1-5.1 5.1 5.1-5.1 5.1z" /></svg>
                        Pix ({pixPorcentagem}% OFF)
                      </span>
                      <span>- {formatarPreco(valorDescontoPix)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-6 mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Possui um cupom?</label>
                  {!cupomAplicado ? (
                    <div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={cupomCodigo}
                          onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                          placeholder="Digite o código"
                          className="flex-1 px-4 py-3 border border-transparent bg-[#F8F9FB] rounded-[16px] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none uppercase font-medium text-gray-800 transition-all"
                        />
                        <button
                          onClick={handleAplicarCupom}
                          disabled={loadingCupom || !cupomCodigo.trim()}
                          className="px-6 py-3 bg-gray-900 text-white font-bold rounded-[16px] hover:bg-gray-800 disabled:bg-gray-300 transition-all active:scale-95 whitespace-nowrap"
                        >
                          {loadingCupom ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div> : 'Aplicar'}
                        </button>
                      </div>
                      {erroCupom && <p className="text-red-500 text-sm mt-2 font-medium px-1">{erroCupom}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-[16px]">
                      <div className="flex items-center gap-2 text-green-700 min-w-0">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="font-bold truncate text-lg">{cupomAplicado.codigo}</span>
                      </div>
                      <button
                        onClick={removerCupom}
                        className="text-sm font-bold text-red-500 hover:text-red-700 flex-shrink-0 ml-2 bg-white px-3 py-1 rounded-lg shadow-sm"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-6 mb-6">
                  <div className="flex flex-wrap justify-between items-center mb-1 gap-2">
                    <span className="text-gray-900 font-extrabold text-lg">Total a Pagar</span>
                    <span className="text-3xl font-black text-blue-600">{formatarPreco(totalFinal)}</span>
                  </div>

                  {!temDescontoPix && pixAtivo && pixPorcentagem > 0 && currentStep < 3 && (
                    <p className="text-sm font-bold text-green-600 mt-3 bg-green-50 p-3 rounded-[12px] border border-green-200 flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6L2.6 12 12 21.4 21.4 12 12 2.6zm0 14.5l-5.1-5.1 5.1-5.1 5.1 5.1-5.1 5.1z" /></svg>
                      Pague via PIX na próxima etapa e ganhe {pixPorcentagem}% de desconto!
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-[16px] flex items-start gap-3 border border-gray-100">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-bold text-gray-800 block mb-0.5">Compra 100% Segura</span>
                    Seus dados são protegidos e criptografados.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};