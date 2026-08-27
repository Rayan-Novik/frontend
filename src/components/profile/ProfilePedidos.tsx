import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../../services/api';
import { useStoreConfig } from '../../contexts/StoreConfigContext';
import { OrderModal } from '../../components/ordercomponent/OrderModal';
import { imprimirRecibo } from '../../components/ordercomponent/OrderReceipt';
import { formatarPreco, formatarData } from '../../contexts/formatters';

// 🟢 IMPORTA O NOVO COMPONENTE AQUI! (Ajuste o caminho se necessário)
import { AgendamentoList, type Agendamento } from '../../components/layout/Pedidos/AgendamentoList';

interface PedidoItem {
  id_item: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  imagem_url?: string;
  complementos?: any;
  observacao?: string;
  cor?: string;
  tamanho?: string;
}

interface Pedido {
  id_pedido: number;
  data_criacao: string;
  status_pedido: string;
  valor_total: number;
  preco_frete: number;
  itens: PedidoItem[];
  metodo_pagamento?: string;
  endereco_entrega?: string;
  status_entrega?: string; 
  delivery_pin?: string;   
}

export const ProfilePedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');
  
  const [activeTab, setActiveTab] = useState<'pedidos' | 'agendamentos'>('pedidos');
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [pedidoModal, setPedidoModal] = useState<Pedido | null>(null);
  
  const [tenantContact, setTenantContact] = useState<any>({});
  const [lojaInfo, setLojaInfo] = useState<any>(null);

  const navigate = useNavigate(); 
  const { appearance } = useStoreConfig();
  
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';
  const bodyBg = appearance?.BODY_BG_COLOR || '#F8FAFC';
  const storeName = appearance?.SITE_TITLE || tenantContact.nome_fantasia || 'Minha Loja';
  const logoUrl = appearance?.LOGO_URL || null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminInfo = localStorage.getItem('adminInfo');
    
    if (!token && !adminInfo) {
      console.warn("Nenhum token encontrado, redirecionando para login...");
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        const [pedidosRes, agendamentosRes, tenantRes, lojasRes] = await Promise.all([
          api.get('/pedidos/meus-pedidos', config).catch(() => ({ data: [] })),
          api.get('/agendamentos/meus', config).catch(() => ({ data: [] })),
          api.get('/tenants/info').catch(() => ({ data: {} })),
          api.get('/lojas').catch(() => ({ data: [] }))
        ]);
        
        setPedidos(pedidosRes.data || []);
        setAgendamentos(agendamentosRes.data || []);
        
        if (tenantRes.data) setTenantContact(tenantRes.data);
        if (lojasRes.data && lojasRes.data.length > 0) setLojaInfo(lojasRes.data[0]);

        if (pedidosRes.data?.length === 0 && agendamentosRes.data?.length > 0) {
            setActiveTab('agendamentos');
        } else if (appearance?.STORE_LAYOUT_STYLE === 'AGENDAMENTO') {
            setActiveTab('agendamentos');
        }

      } catch (error: any) {
        console.error("Erro ao buscar dados:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
           setErro('Sua sessão expirou. Por favor, faça login novamente para ver seus pedidos.');
        } else {
           setErro('Não foi possível carregar seu histórico no momento.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate, appearance]);

  const getStatusBadge = (status: string): ReactNode => {
    const statusMap: Record<string, { label: string, color: string, bg: string }> = {
      'PENDENTE': { label: 'Aguardando', color: 'text-yellow-700', bg: 'bg-yellow-100' },
      'PAGO': { label: 'Pagamento Aprovado', color: 'text-green-700', bg: 'bg-green-100' },
      'CONFIRMADO': { label: 'Confirmado', color: 'text-green-700', bg: 'bg-green-100' },
      'PROCESSANDO': { label: 'Em Separação', color: 'text-blue-700', bg: 'bg-blue-100' },
      'ENVIADO': { label: 'A Caminho', color: 'text-purple-700', bg: 'bg-purple-100' },
      'EM ROTA DE ENTREGA': { label: 'Motorista a Caminho', color: 'text-orange-700', bg: 'bg-orange-100' },
      'ENTREGUE': { label: 'Entregue', color: 'text-teal-700', bg: 'bg-teal-100' },
      'CANCELADO': { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
      'FALHA': { label: 'Falhou', color: 'text-red-700', bg: 'bg-red-100' }
    };
    const config = statusMap[status?.toUpperCase()] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const toggleExpandir = (id: number) => {
    setPedidoExpandido(pedidoExpandido === id ? null : id);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: bodyBg }}>
      <div className="bg-white border-b border-gray-200 py-8 mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Histórico</h1>
          <p className="text-gray-500 mt-2">Acompanhe seus pedidos e horários marcados.</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          <button 
              onClick={() => setActiveTab('pedidos')}
              className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'pedidos' ? 'border-b-2 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
              style={{ borderColor: activeTab === 'pedidos' ? primaryBg : 'transparent' }}
          >
              Pedidos Físicos ({pedidos.length})
          </button>
          <button 
              onClick={() => setActiveTab('agendamentos')}
              className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'agendamentos' ? 'border-b-2 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
              style={{ borderColor: activeTab === 'agendamentos' ? primaryBg : 'transparent' }}
          >
              Agendamentos ({agendamentos.length})
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4" style={{ borderColor: primaryBg }}></div>
          </div>
        ) : erro ? (
          <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-200 text-center flex flex-col items-center gap-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="font-bold text-lg">{erro}</p>
            {erro.includes('expirou') && (
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }}
                className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Fazer Login Novamente
              </button>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'pedidos' && (
              pedidos.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Você ainda não fez nenhum pedido</h3>
                  <p className="text-gray-500 mb-6">Que tal explorar nossos produtos e encontrar algo que você goste?</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: primaryBg }}
                  >
                    Ir para a Loja
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((pedido) => {
                    const isEmRota = String(pedido.status_entrega || pedido.status_pedido || '').toUpperCase().includes('ROTA');
                    const hasPin = Boolean(pedido.delivery_pin);

                    return (
                      <div key={pedido.id_pedido} className="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm relative">
                        {hasPin && isEmRota && (
                            <div className="bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="font-bold text-xs sm:text-sm uppercase tracking-wide">Em Rota! PIN: {pedido.delivery_pin}</span>
                                </div>
                            </div>
                        )}

                        <div 
                          className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between cursor-pointer gap-4 hover:bg-gray-50 transition-colors"
                          onClick={() => toggleExpandir(pedido.id_pedido)}
                        >
                          <div className="grid grid-cols-3 sm:flex sm:gap-8 gap-2">
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pedido</p>
                              <p className="font-bold text-gray-900">#{pedido.id_pedido}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data</p>
                              <p className="text-sm text-gray-700">{formatarData(pedido.data_criacao)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
                              <p className="font-bold text-gray-900">{formatarPreco(pedido.valor_total)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between xl:justify-end gap-3 w-full xl:w-auto mt-2 xl:mt-0 border-t xl:border-0 border-gray-100 pt-3 xl:pt-0">
                            {getStatusBadge(pedido.status_pedido)}
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/order/${pedido.id_pedido}`); }}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors flex items-center gap-1 sm:gap-2"
                              >
                                Acompanhar
                              </button>
                              <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 hidden sm:block ${pedidoExpandido === pedido.id_pedido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                        </div>

                        {pedidoExpandido === pedido.id_pedido && (
                          <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-gray-50 bg-gray-50/50">
                            <div className="space-y-4 mb-4 mt-2">
                              {/* 🟢 Renderização com Mágica dos Adicionais/Complementos! */}
                              {pedido.itens.map((item, idx) => {
                                let comps = [];
                                try { comps = typeof item.complementos === 'string' ? JSON.parse(item.complementos) : (item.complementos || []); } catch(e){}

                                return (
                                  <div key={idx} className="flex flex-col text-sm border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-gray-500">{item.quantidade}x</span>
                                      <span className="flex-1 text-gray-700 font-medium">{item.nome_produto}</span>
                                      <span className="font-bold text-gray-900">{formatarPreco(item.preco_unitario * item.quantidade)}</span>
                                    </div>
                                    
                                    {/* Mostra Variações, Complementos e Obs abaixo do nome do produto */}
                                    {(item.cor || item.tamanho || comps.length > 0 || item.observacao) && (
                                        <div className="pl-8 flex flex-col gap-0.5 text-[13px] text-gray-500 mt-1">
                                            {item.cor && <span>Cor: {item.cor}</span>}
                                            {item.tamanho && <span>Tam: {item.tamanho}</span>}
                                            {comps.map((c: any, i: number) => (
                                                <span key={i} className="text-gray-500">+ {c.quantidade}x {c.nome || c.produto_add?.nome}</span>
                                            ))}
                                            {item.observacao && <span className="text-red-500 font-medium mt-1 border border-red-200 bg-red-50 px-2 py-1 rounded inline-block w-fit">Obs: {item.observacao}</span>}
                                        </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                              <button 
                                onClick={(e) => { e.stopPropagation(); imprimirRecibo(pedido, storeName, tenantContact, lojaInfo); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                Recibo
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setPedidoModal(pedido); }}
                                className="px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: primaryBg }}
                              >
                                Detalhes da Compra
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* 🟢 O SEU NOVO COMPONENTE ENTRA AQUI */}
            {activeTab === 'agendamentos' && (
              <AgendamentoList 
                agendamentos={agendamentos} 
                primaryBg={primaryBg} 
                onNavigate={navigate} 
                getStatusBadge={getStatusBadge} 
              />
            )}
          </>
        )}
      </main>

      <OrderModal 
        pedido={pedidoModal} 
        onClose={() => setPedidoModal(null)} 
        primaryBg={primaryBg} 
        getStatusBadge={getStatusBadge}
        storeName={storeName}
        logoUrl={logoUrl}
        tenantContact={tenantContact}
        lojaInfo={lojaInfo}
      />
    </div>
  );
};