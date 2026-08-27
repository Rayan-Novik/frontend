import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../services/api';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { OrderModal } from '../components/ordercomponent/OrderModal';
import { imprimirRecibo } from '../components/ordercomponent/OrderReceipt';
import { formatarPreco, formatarData } from '../contexts/formatters';
// 🟢 IMPORTA O NOVO COMPONENTE E A INTERFACE
import { AgendamentoList, type Agendamento } from '../components/layout/Pedidos/AgendamentoList';

interface PedidoItem {
  id_item: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  imagem_url?: string;
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

export const Orders = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'agendamentos'>('pedidos'); 
  
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [pedidoModal, setPedidoModal] = useState<Pedido | null>(null);
  
  const [tenantContact, setTenantContact] = useState<any>({});
  const [lojaInfo, setLojaInfo] = useState<any>(null);

  const navigate = useNavigate(); 
  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';
  const storeName = appearance?.SITE_TITLE || tenantContact.nome_fantasia || 'Minha Loja';
  const logoUrl = appearance?.LOGO_URL || null;
  const bodyBg = appearance?.BODY_BG_COLOR || '#F8FAFC';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pedidosRes, agendamentosRes, tenantRes, lojasRes] = await Promise.all([
          api.get('/pedidos/meus-pedidos').catch(() => ({ data: [] })),
          api.get('/agendamentos/meus').catch(() => ({ data: [] })),
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

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [appearance]);

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

  if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando dados...</div>;

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
                  <div key={pedido.id_pedido} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md relative">
                    {hasPin && isEmRota && (
                        <div className="bg-blue-600 text-white px-4 py-3 sm:px-6 flex justify-between items-center shadow-inner">
                          <div className="flex items-center gap-3">
                              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                              <span className="font-black text-xs sm:text-sm uppercase tracking-widest">
                                Em Rota! PIN: <span className="bg-white/20 px-2 py-0.5 rounded text-lg ml-1">{pedido.delivery_pin}</span>
                              </span>
                          </div>
                        </div>
                    )}

                    <div 
                      className="p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between cursor-pointer gap-4 hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpandir(pedido.id_pedido)}
                    >
                      <div className="grid grid-cols-3 sm:flex sm:gap-8 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Pedido</p>
                          <p className="font-bold text-gray-900">#{pedido.id_pedido}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Data</p>
                          <p className="font-medium text-gray-700">{formatarData(pedido.data_criacao)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total</p>
                          <p className="font-bold text-gray-900">{formatarPreco(pedido.valor_total)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between xl:justify-end w-full xl:w-auto gap-4 mt-2 xl:mt-0 border-t xl:border-0 border-gray-100 pt-4 xl:pt-0">
                        {getStatusBadge(pedido.status_pedido)}
                        
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/order/${pedido.id_pedido}`); }}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-black bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors flex items-center gap-1.5 sm:gap-2"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17l-6 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7v13M15 4v13" /></svg>
                            <span className="hidden sm:inline">Acompanhar Entrega</span>
                            <span className="sm:hidden">Mapa</span>
                          </button>

                          <button className="text-gray-400 hover:text-gray-700 transition-colors hidden sm:block">
                            <svg className={`w-6 h-6 transition-transform duration-300 ${pedidoExpandido === pedido.id_pedido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {pedidoExpandido === pedido.id_pedido && (
                      <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-gray-50 bg-gray-50/50">
                        <div className="space-y-3 mb-4 mt-2">
                          {pedido.itens.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                              <span className="font-bold text-gray-500">{item.quantidade}x</span>
                              <span className="flex-1 text-gray-700">{item.nome_produto}</span>
                              <span className="font-medium text-gray-900">{formatarPreco(item.preco_unitario * item.quantidade)}</span>
                            </div>
                          ))}
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

        {/* 🟢 COMPONENTE REUTILIZÁVEL INJETADO AQUI! */}
        {activeTab === 'agendamentos' && (
          <AgendamentoList 
            agendamentos={agendamentos} 
            primaryBg={primaryBg} 
            onNavigate={navigate} 
            getStatusBadge={getStatusBadge} 
          />
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