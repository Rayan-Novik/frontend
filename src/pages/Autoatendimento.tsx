import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { ShoppingBag, Receipt, Plus, Minus, Check, Copy, Lock, MapPin, X } from 'lucide-react'; 
import { toast } from 'react-toastify';

export const Autoatendimento = () => {
  const { token, slug_loja } = useParams();
  const { appearance, isLoadingConfig } = useStoreConfig();
  
  const [activeTab, setActiveTab] = useState<'cardapio' | 'conta'>('cardapio');
  const [produtos, setProdutos] = useState<any[]>([]);
  const [comanda, setComanda] = useState<any>(null);
  const [mesaNome, setMesaNome] = useState('Carregando...');
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);

  // 🟢 ESTADOS DE SEGURANÇA
  const [blockData, setBlockData] = useState<any>(null); 
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // 🟢 ESTADOS DO MODAL DE PERSONALIZAÇÃO (NÍVEL IFOOD)
  const [produtoModal, setProdutoModal] = useState<any>(null);
  const [modalQtd, setModalQtd] = useState(1);
  const [modalComplements, setModalComplements] = useState<any>({});
  const [modalObservacao, setModalObservacao] = useState('');

  const blockDataRef = useRef<any>(null);

  // Variáveis de Cor Dinâmica para combinar perfeitamente com a loja
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';
  const primaryText = appearance?.BTN_PRIMARY_TEXT || '#FFFFFF';
  const primaryBgLight = primaryBg + '1A'; // 10% de opacidade no hex

  useEffect(() => {
      blockDataRef.current = blockData;
  }, [blockData]);

  const fetchData = async (silencioso = false, lat?: number, lng?: number) => {
    try {
      if (!silencioso) setLoading(true);
      
      let query = '';
      if (lat && lng) {
          query = `?lat=${lat}&lng=${lng}`;
      } else if (userLocation) {
          query = `?lat=${userLocation.lat}&lng=${userLocation.lng}`;
      }

      if (!silencioso) {
          const resProdutos = await api.get('/autoatendimento/produtos');
          setProdutos(Array.isArray(resProdutos.data) ? resProdutos.data : []);
      }

      const resComanda = await api.get(`/autoatendimento/m/${token}${query}`);
      
      setBlockData(null); 
      
      if (resComanda.data) {
        setComanda(resComanda.data);
        if (resComanda.data.codigo_comanda) {
          setMesaNome(resComanda.data.codigo_comanda);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
          setBlockData(error.response.data);
      } else if (error.response?.status === 429) {
          console.warn("Aviso: Limite de requisições atingido. O sistema tentará novamente em breve.");
      } else {
          console.error("Erro ao carregar dados da mesa:", error);
          if (!silencioso) setMesaNome("Mesa Inválida");
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchData();

    const interval = setInterval(() => {
        if (!blockDataRef.current && !produtoModal) {
            fetchData(true);
        }
    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userLocation, produtoModal]);

  const solicitarGPS = () => {
      if (!navigator.geolocation) {
          toast.error("Seu celular ou navegador não suporta envio de GPS.");
          return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
          (pos) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(coords);
              fetchData(false, coords.lat, coords.lng);
          },
          (err) => {
              setLoading(false);
              toast.error("Você recusou a localização. Libere o GPS nas configurações do celular para acessar a mesa.");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
  };

  const adicionarAoCarrinho = (produto: any, quantidade: number, complementosEscolhidos: any[] = [], observacao: string = '') => {
    setCarrinho((prev) => {
      if (complementosEscolhidos.length === 0) {
        const existente = prev.find(item => 
          item.id_produto === produto.id_produto && 
          (!item.complementos || item.complementos.length === 0) &&
          ((!item.observacao && !observacao) || item.observacao === observacao)
        );
        if (existente) {
          return prev.map(item => item.cartItemId === existente.cartItemId ? { ...item, quantidade: item.quantidade + quantidade } : item);
        }
      }
      
      const extraPrice = complementosEscolhidos.reduce((acc, c) => acc + (Number(c.preco_adicional) * c.quantidade), 0);
      const finalPrice = Number(produto.preco) + extraPrice;

      return [...prev, {
        cartItemId: Math.random().toString(36).substr(2, 9),
        id_produto: produto.id_produto,
        nome: produto.nome,
        preco: produto.preco,
        preco_unitario_calculado: finalPrice,
        quantidade,
        complementos: complementosEscolhidos,
        observacao
      }];
    });

    toast.success(`${produto.nome} adicionado!`, { autoClose: 1000, hideProgressBar: true, position: "top-center" });
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
  };

  const removerDoCarrinho = (id_produto: number) => {
    setCarrinho(prev => {
        const newCart = [...prev];
        for (let i = newCart.length - 1; i >= 0; i--) {
            if (newCart[i].id_produto === id_produto) {
                if (newCart[i].quantidade > 1) {
                    newCart[i].quantidade -= 1;
                } else {
                    newCart.splice(i, 1);
                }
                break;
            }
        }
        return newCart;
    });
  };

  const getQuantidadeNoCarrinho = (id_produto: number) => {
    return carrinho.filter(i => i.id_produto === id_produto).reduce((sum, i) => sum + i.quantidade, 0);
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (Number(item.preco_unitario_calculado || item.preco) * item.quantidade), 0);

  const handleOpenModal = (produto: any) => {
    setProdutoModal(produto);
    setModalQtd(1);
    setModalObservacao('');

    // AUTO-PREENCHIMENTO
    const initialComps: any = {};
    if (produto.grupos_complemento) {
        produto.grupos_complemento.forEach((grupo: any) => {
            const obrigatorios: any[] = [];
            if (grupo.complementos) {
                grupo.complementos.forEach((comp: any) => {
                    if (comp.minimo > 0) {
                        obrigatorios.push({
                            id_produto_add: comp.id_produto_add,
                            preco_adicional: comp.preco_adicional,
                            nome: comp.produto_add?.nome,
                            quantidade: comp.minimo
                        });
                    }
                });
            }
            if (obrigatorios.length > 0) {
                initialComps[grupo.id_grupo] = obrigatorios;
            }
        });
    }
    setModalComplements(initialComps);
  };

  const handleUpdateComplementQty = (grupo: any, comp: any, nomeComplemento: string, delta: number) => {
    setModalComplements((prev: any) => {
        const atuais = prev[grupo.id_grupo] || [];
        const indexItem = atuais.findIndex((c: any) => c.id_produto_add === comp.id_produto_add);
        const qtdAtualGrupo = atuais.reduce((acc: number, c: any) => acc + c.quantidade, 0);

        const qtdAtualItem = indexItem >= 0 ? atuais[indexItem].quantidade : 0;
        const maxItem = comp.maximo !== undefined ? comp.maximo : 1;
        const minItem = comp.minimo !== undefined ? comp.minimo : 0;

        if (grupo.maximo === 1) {
            if (delta > 0) {
                return { ...prev, [grupo.id_grupo]: [{ id_produto_add: comp.id_produto_add, preco_adicional: comp.preco_adicional, nome: nomeComplemento, quantidade: 1 }] };
            }
            return prev;
        }

        if (delta > 0) {
            if (qtdAtualGrupo >= grupo.maximo) {
                toast.warning(`Você atingiu o limite de ${grupo.maximo} opções em "${grupo.nome}".`);
                return prev;
            }
            if (qtdAtualItem >= maxItem) {
                toast.warning(`Você só pode adicionar ${maxItem}x o item "${nomeComplemento}".`);
                return prev;
            }

            if (indexItem >= 0) {
                const novos = [...atuais];
                novos[indexItem] = { ...novos[indexItem], quantidade: novos[indexItem].quantidade + 1 };
                return { ...prev, [grupo.id_grupo]: novos };
            } else {
                return { ...prev, [grupo.id_grupo]: [...atuais, { id_produto_add: comp.id_produto_add, preco_adicional: comp.preco_adicional, nome: nomeComplemento, quantidade: 1 }] };
            }
        } else {
            if (indexItem >= 0) {
                if (qtdAtualItem <= minItem) {
                    toast.warning(`O item "${nomeComplemento}" exige no mínimo ${minItem} opção(ões).`);
                    return prev;
                }

                const novos = [...atuais];
                if (novos[indexItem].quantidade > 1) {
                    novos[indexItem] = { ...novos[indexItem], quantidade: novos[indexItem].quantidade - 1 };
                    return { ...prev, [grupo.id_grupo]: novos };
                } else {
                    return { ...prev, [grupo.id_grupo]: atuais.filter((_: any, i: number) => i !== indexItem) };
                }
            }
            return prev;
        }
    });
  };

  const validateModalAndAdd = () => {
      const complementosFinais: any[] = [];
      for (const grupo of produtoModal.grupos_complemento) {
          const selecionados = modalComplements[grupo.id_grupo] || [];
          const qtdSelecionada = selecionados.reduce((acc: number, c: any) => acc + c.quantidade, 0);
          
          if (qtdSelecionada < grupo.minimo) {
              toast.warning(`Selecione pelo menos ${grupo.minimo} opção(ões) em "${grupo.nome}"`);
              return;
          }

          if (grupo.complementos) {
              for (const comp of grupo.complementos) {
                  const itemSel = selecionados.find((c: any) => c.id_produto_add === comp.id_produto_add);
                  const qtdItem = itemSel ? itemSel.quantidade : 0;
                  if (comp.minimo > 0 && qtdItem < comp.minimo) {
                      toast.warning(`A opção "${comp.produto_add?.nome}" é obrigatória (Min: ${comp.minimo}).`);
                      return;
                  }
              }
          }

          complementosFinais.push(...selecionados);
      }

      adicionarAoCarrinho(produtoModal, modalQtd, complementosFinais, modalObservacao);
      setProdutoModal(null);
  };

  const calcularTotalModal = () => {
      let total = Number(produtoModal?.preco || 0);
      Object.values(modalComplements).flat().forEach((comp: any) => {
          total += (Number(comp.preco_adicional) * comp.quantidade);
      });
      return total * modalQtd;
  };

  const enviarPedido = async () => {
    if (carrinho.length === 0) return;
    try {
      setEnviando(true);
      await api.post(`/autoatendimento/m/${token}/pedir`, {
        lat: userLocation?.lat, 
        lng: userLocation?.lng,
        itens: carrinho.map(item => ({
          id_produto: item.id_produto,
          quantidade: item.quantidade,
          complementos: item.complementos,
          observacao: item.observacao || null
        }))
      });
      
      const query = userLocation ? `?lat=${userLocation.lat}&lng=${userLocation.lng}` : '';
      const resComanda = await api.get(`/autoatendimento/m/${token}${query}`);
      setComanda(resComanda.data);
      if (resComanda.data.codigo_comanda) setMesaNome(resComanda.data.codigo_comanda);

      setCarrinho([]);
      setActiveTab('conta');
      toast.success("Pedido enviado para a cozinha!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao enviar pedido. Verifique se você ainda está no local.");
    } finally {
      setEnviando(false);
    }
  };

  const solicitarPix = async () => {
    try {
      setEnviando(true);
      const res = await api.post(`/autoatendimento/m/${token}/pagar-pix`);
      setPixData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao gerar PIX");
    } finally {
      setEnviando(false);
    }
  };

  const copiarPix = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopiado(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  if (isLoadingConfig || loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: appearance?.BODY_BG_COLOR || '#F8FAFC' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryBg }}></div>
      </div>
    );
  }

  if (blockData) {
      return (
          <div className="flex h-screen flex-col items-center justify-center p-6 text-center font-sans" style={{ backgroundColor: appearance?.BODY_BG_COLOR || '#F8FAFC' }}>
              <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full border border-gray-100">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock size={36} />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-gray-800 tracking-tight">Acesso Restrito</h2>
                  <p className="text-gray-500 mb-8 font-medium">{blockData.message}</p>
                  
                  {blockData.pede_gps && (
                      <button 
                          onClick={solicitarGPS}
                          className="w-full py-4 rounded-2xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                          style={{ backgroundColor: primaryBg, color: primaryText }}
                      >
                          <MapPin size={22} /> Compartilhar Localização
                      </button>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen text-[var(--text-color)] flex flex-col font-sans pb-24 relative" style={{ backgroundColor: appearance?.BODY_BG_COLOR || '#F8FAFC' }}>
      
      <div className="pt-8 pb-6 px-6 rounded-b-3xl shadow-sm z-10" style={{ backgroundColor: appearance?.HEADER_PRIMARY_COLOR || '#FFFFFF', color: appearance?.SITE_TEXT_COLOR || '#1F2937' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{appearance?.SITE_TITLE || 'Nossa Loja'}</h1>
            <p className="text-sm font-medium opacity-70 bg-black/5 inline-block px-2 py-1 rounded-lg mt-1">{mesaNome}</p>
          </div>
          {appearance?.LOGO_URL && (
            <img src={appearance.LOGO_URL} alt="Logo" className="h-12 w-12 rounded-2xl object-cover shadow-sm" />
          )}
        </div>

        <div className="flex bg-gray-100 p-1 rounded-3xl mt-4">
          <button 
            onClick={() => setActiveTab('cardapio')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl font-medium transition-colors ${activeTab === 'cardapio' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            <ShoppingBag size={18} />
            Cardápio
          </button>
          <button 
            onClick={() => setActiveTab('conta')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl font-medium transition-colors ${activeTab === 'conta' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
          >
            <Receipt size={18} />
            Minha Conta
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 mt-6">
        
        {/* ABA CARDÁPIO */}
        {activeTab === 'cardapio' && (
          <div className="space-y-4">
            {produtos?.length === 0 ? (
               <div className="text-center py-10 text-gray-400">Nenhum produto disponível.</div>
            ) : (
              produtos?.map((produto) => {
                const isCustomizable = produto.grupos_complemento && produto.grupos_complemento.length > 0;
                const qtdNoCarrinho = getQuantidadeNoCarrinho(produto.id_produto);

                return (
                  <div key={produto.id_produto} className="flex gap-4 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm">
                    {produto.imagem_url ? (
                      <img src={produto.imagem_url} alt={produto.nome} className="w-24 h-24 rounded-2xl object-cover bg-gray-50" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <ShoppingBag size={24} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-base leading-tight text-gray-800">{produto.nome}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{produto.descricao}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-lg text-gray-800">R$ {Number(produto.preco).toFixed(2)}</span>
                        
                        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-1">
                          <button 
                            onClick={() => removerDoCarrinho(produto.id_produto)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-gray-600 border border-gray-200 active:scale-95 transition-transform"
                            disabled={qtdNoCarrinho === 0}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-medium w-4 text-center text-gray-700">{qtdNoCarrinho}</span>
                          <button 
                            onClick={() => isCustomizable ? handleOpenModal(produto) : adicionarAoCarrinho(produto, 1, [], '')}
                            className="w-8 h-8 flex items-center justify-center rounded-xl shadow-sm active:scale-95 transition-transform"
                            style={{ backgroundColor: primaryBg, color: primaryText }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ABA MINHA CONTA */}
        {activeTab === 'conta' && (
          <div className="space-y-6">
            {!comanda || !comanda.pedido_items || comanda.pedido_items.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                <p>Você ainda não pediu nada.</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Itens Consumidos</h3>
                  {comanda.pedido_items.map((item: any) => (
                    <div key={item.id_item} className="flex justify-between items-start border-b border-gray-50 pb-3 pt-3 first:pt-0 last:border-0 last:pb-0">
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                            {Number(item.quantidade)}
                          </span>
                          <span className="font-medium text-sm text-gray-700">{item.nome}</span>
                        </div>
                        
                        {/* 🟢 RENDERIZAÇÃO DOS COMPLEMENTOS NA CONTA */}
                        {item.complementos && item.complementos.length > 0 && (
                          <div className="ml-9 mt-1 flex flex-col gap-0.5">
                            {item.complementos.map((comp: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs text-gray-500 w-full pr-4">
                                <span>+ {comp.quantidade}x {comp.nome || comp.produto_add?.nome}</span>
                                {Number(comp.preco_adicional) > 0 && (
                                  <span>R$ {(Number(comp.preco_adicional) * comp.quantidade).toFixed(2)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 🟢 OBSERVAÇÃO */}
                        {item.observacao && (
                          <span className="text-xs text-gray-400 mt-1 ml-9 block">Obs: {item.observacao}</span>
                        )}
                      </div>
                      
                      {/* PREÇO DO ITEM BASE (Opcionalmente, você pode querer mostrar o item.preco_total se a sua API retornar isso) */}
                      <span className="text-gray-800 font-medium ml-2">
                        R$ {(Number(item.preco) * Number(item.quantidade)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Total da Mesa</span>
                    <span className="text-2xl font-black text-gray-800">R$ {Number(comanda.preco_total).toFixed(2)}</span>
                  </div>
                </div>

                {!pixData ? (
                  <button 
                    onClick={solicitarPix}
                    disabled={enviando}
                    className="w-full py-4 rounded-3xl font-bold text-lg transition-opacity flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    style={{ backgroundColor: '#10B981', color: '#FFFFFF' }} 
                  >
                    {enviando ? 'Gerando...' : 'Pagar Agora com PIX'}
                  </button>
                ) : (
                  <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm flex flex-col items-center text-center space-y-4">
                    <h3 className="font-bold text-green-600">Escaneie ou copie o código</h3>
                    <img src={pixData.qr_code_base64} alt="QR Code PIX" className="w-48 h-48 rounded-2xl" />
                    
                    <button 
                      onClick={copiarPix}
                      className="w-full py-4 rounded-3xl font-bold flex items-center justify-center gap-2 bg-gray-100 text-gray-800 active:scale-95 transition-transform"
                    >
                      {copiado ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                      {copiado ? 'Código Copiado!' : 'Copiar Código PIX'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 🟢 BARRA FLUTUANTE DE PEDIDO */}
      {carrinho.length > 0 && activeTab === 'cardapio' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
          <button 
            onClick={enviarPedido}
            disabled={enviando}
            className="w-full py-4 px-6 rounded-3xl font-bold text-lg flex items-center justify-between active:scale-95 transition-transform shadow-lg"
            style={{ backgroundColor: primaryBg, color: primaryText }}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-2xl bg-black/20 flex items-center justify-center text-sm">
                {carrinho.reduce((acc, i) => acc + i.quantidade, 0)}
              </span>
              <span>Enviar para Cozinha</span>
            </div>
            <span>R$ {totalCarrinho.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* 🟢 MODAL DE PERSONALIZAÇÃO (NÍVEL IFOOD) */}
      {produtoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8">
                
                {/* Modal Header */}
                <div className="relative h-48 bg-gray-100 flex-shrink-0">
                    {produtoModal.imagem_url ? (
                        <img src={produtoModal.imagem_url} alt={produtoModal.nome} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={48} className="text-gray-300" /></div>
                    )}
                    <button 
                        onClick={() => setProdutoModal(null)} 
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-800 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900">{produtoModal.nome}</h2>
                    <p className="text-gray-500 mt-1 line-clamp-2 text-sm">{produtoModal.descricao}</p>
                    <div className="mt-3 font-bold text-xl" style={{ color: primaryBg }}>
                        R$ {Number(produtoModal.preco).toFixed(2)}
                    </div>
                </div>

                {/* Modal Content - Groups */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-5 space-y-6">
                    {produtoModal.grupos_complemento?.map((grupo: any) => {
                        const selecionados = modalComplements[grupo.id_grupo] || [];
                        const isRequired = grupo.minimo > 0;
                        const atingiuMaximo = selecionados.reduce((acc: number, c: any) => acc + c.quantidade, 0) >= grupo.maximo;

                        return (
                            <div key={grupo.id_grupo} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{grupo.nome}</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Escolha {grupo.minimo === grupo.maximo ? `exatamente ${grupo.maximo}` : `de ${grupo.minimo} até ${grupo.maximo}`} opções.
                                        </p>
                                    </div>
                                    {isRequired ? (
                                        <span className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Obrigatório</span>
                                    ) : (
                                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Opcional</span>
                                    )}
                                </div>

                                <div className="space-y-0 mt-4">
                                    {grupo.complementos?.map((comp: any) => {
                                        const itemSelecionado = selecionados.find((c: any) => c.id_produto_add === comp.id_produto_add);
                                        const qtdDesteItem = itemSelecionado ? itemSelecionado.quantidade : 0;
                                        
                                        const maxItem = comp.maximo !== undefined ? comp.maximo : 1;
                                        const minItem = comp.minimo !== undefined ? comp.minimo : 0;

                                        const isDisabledAdd = atingiuMaximo || qtdDesteItem >= maxItem;
                                        const isDisabledRemove = qtdDesteItem <= minItem;

                                        return (
                                            <div 
                                                key={comp.id_produto_add} 
                                                className={`flex items-center justify-between p-3 border-b border-gray-100 transition-all rounded-xl mb-1`}
                                                style={{ backgroundColor: qtdDesteItem > 0 ? primaryBgLight : 'transparent' }}
                                            >
                                                <div 
                                                    className={`flex flex-col flex-1 ${grupo.maximo === 1 ? 'cursor-pointer' : ''}`}
                                                    onClick={() => { if (grupo.maximo === 1) handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1); }}
                                                >
                                                    <span className="font-medium text-sm text-gray-800">{comp.produto_add?.nome}</span>
                                                    {Number(comp.preco_adicional) > 0 && (
                                                        <span className="text-sm font-medium text-gray-500">
                                                            + R$ {Number(comp.preco_adicional).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center ml-2">
                                                    {/* 🟢 SE MÁXIMO = 1: Usa a Bolinha estilo Radio Button */}
                                                    {grupo.maximo === 1 ? (
                                                        <div 
                                                            className="w-6 h-6 flex items-center justify-center rounded-full border cursor-pointer transition-colors"
                                                            style={{ 
                                                              borderColor: qtdDesteItem > 0 ? primaryBg : '#D1D5DB',
                                                              backgroundColor: qtdDesteItem > 0 ? primaryBg : 'transparent'
                                                            }}
                                                            onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                        >
                                                            {qtdDesteItem > 0 && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                                        </div>
                                                    ) : (
                                                        /* 🟢 SE MÁXIMO > 1: Mostra os botões de + e - */
                                                        <div className="flex items-center gap-3">
                                                            {qtdDesteItem > 0 ? (
                                                                <>
                                                                    <button 
                                                                        className={`w-7 h-7 flex items-center justify-center rounded-full border bg-white ${isDisabledRemove ? 'opacity-50 border-gray-200 text-gray-400' : 'border-red-200 text-red-500 shadow-sm'}`}
                                                                        onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, -1)}
                                                                        disabled={isDisabledRemove}
                                                                    >
                                                                        <Minus size={14} />
                                                                    </button>
                                                                    <span className="font-bold text-gray-800 text-center" style={{ width: '16px' }}>{qtdDesteItem}</span>
                                                                    <button 
                                                                        className={`w-7 h-7 flex items-center justify-center rounded-full border bg-white ${isDisabledAdd ? 'opacity-50 border-gray-200 text-gray-400' : 'shadow-sm'}`}
                                                                        style={{ 
                                                                          borderColor: !isDisabledAdd ? primaryBg : undefined, 
                                                                          color: !isDisabledAdd ? primaryBg : undefined 
                                                                        }}
                                                                        onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                                        disabled={isDisabledAdd}
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button 
                                                                    className={`w-7 h-7 flex items-center justify-center rounded-full border bg-white ${isDisabledAdd ? 'opacity-50 border-gray-200 text-gray-400' : 'border-gray-300 text-gray-600 shadow-sm'}`}
                                                                    onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                                    disabled={isDisabledAdd}
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    {/* 🟢 NOVO CAMPO DE OBSERVAÇÃO (Estilo Tailwind) */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">Alguma observação?</h3>
                            <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                Opcional
                            </span>
                        </div>
                        <textarea
                            className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
                            rows={2}
                            placeholder="Ex: Tirar cebola, molho à parte..."
                            value={modalObservacao}
                            onChange={(e) => setModalObservacao(e.target.value)}
                        />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t bg-white flex items-center justify-between gap-4 flex-shrink-0 shadow-lg">
                    <div className="flex items-center gap-3 bg-gray-100 rounded-2xl p-1 border border-gray-200">
                        <button 
                            onClick={() => setModalQtd(Math.max(1, modalQtd - 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm active:scale-95"
                        >
                            <Minus size={18} />
                        </button>
                        <span className="font-bold w-6 text-center text-gray-800">{modalQtd}</span>
                        <button 
                            onClick={() => setModalQtd(modalQtd + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm active:scale-95"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={validateModalAndAdd}
                        className="flex-1 py-4 px-6 rounded-2xl font-bold text-white flex justify-between items-center shadow-md active:scale-95 transition-transform"
                        style={{ backgroundColor: primaryBg, color: primaryText }}
                    >
                        <span>Adicionar</span>
                        <span>R$ {calcularTotalModal().toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};