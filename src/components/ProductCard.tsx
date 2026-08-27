import React, { useState } from 'react';
import { createPortal } from 'react-dom'; // 🟢 A BALA DE PRATA PARA O MODAL
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { useCart } from '../contexts/CartContext';

import { ProductCardEcommerce } from './layout/ProductCards/ProductCardEcommerce';
import { ProductCardCardapio } from './layout/ProductCards/ProductCardCardapio';
import { ProductCardMercadinho } from './layout/ProductCards/ProductCardMercadinho';

export interface ProdutoVariacao {
  id_variacao: number;
  cor?: string | null;
  tamanho?: string | null;
  estoque: number;
  preco_adicional: number;
}

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  imagem_url?: string | null;
  estoque?: number | null;
  produto_variacoes?: ProdutoVariacao[];
  variacoes?: ProdutoVariacao[]; // 🟢 Fallback garantido
  grupos_complemento?: any[]; // 🟢 ADICIONADO: Para carregar os complementos
}

interface ProductCardProps {
  produto: Produto;
}

export const ProductCard = ({ produto }: ProductCardProps) => {
  const { appearance } = useStoreConfig();
  const { addToCart } = useCart();

  const pixAtivo = appearance?.PIX_DESCONTO_ATIVO;
  const pixPorcentagem = appearance?.PIX_DESCONTO_PORCENTAGEM || 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  // 🟢 NOVOS ESTADOS PARA COMPLEMENTOS E OBSERVAÇÕES
  const [modalComplements, setModalComplements] = useState<any>({});
  const [modalObservacao, setModalObservacao] = useState('');

  // 🟢 Procura as variações de todos os jeitos possíveis
  const variacoes = produto.produto_variacoes || produto.variacoes || [];
  
  const hasColors = variacoes.some(v => v.cor && v.cor.trim() !== '');
  const hasSizes = variacoes.some(v => v.tamanho && v.tamanho.trim() !== '');

  const uniqueColors = Array.from(new Set(variacoes.map(v => v.cor).filter(Boolean))) as string[];
  const uniqueSizes = Array.from(new Set(
    variacoes.filter(v => !selectedColor || v.cor === selectedColor).map(v => v.tamanho).filter(Boolean)
  )) as string[];

  const currentVariation = variacoes.find(v => 
    (!hasColors || v.cor === selectedColor) && 
    (!hasSizes || v.tamanho === selectedSize)
  );

  const basePrice = typeof produto.preco === 'string' ? parseFloat(produto.preco) : produto.preco;
  const precoAdicional = currentVariation ? Number(currentVariation.preco_adicional) : 0;
  const finalPrice = basePrice + precoAdicional;

  // 🟢 VERIFICA SE O PRODUTO É CUSTOMIZÁVEL (Tem Variações OU Complementos)
  const isCustomizable = variacoes.length > 0 || (produto.grupos_complemento && produto.grupos_complemento.length > 0);

  // 🟢 O CONTROLE DE CLIQUE DEFINITIVO
  const handleAddToCartClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log(`[VERIFICANDO] Produto: ${produto.nome} | Qtd Variações: ${variacoes.length} | Complementos: ${produto.grupos_complemento?.length || 0}`);

    if (isCustomizable) {
      // 🟢 AUTO-PREENCHIMENTO DE COMPLEMENTOS OBRIGATÓRIOS
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
      setModalObservacao('');

      setIsModalOpen(true);
      return false; // Retorna falso = O card NÃO fica verdinho ainda
    } else {
      addToCart({ ...produto, preco: basePrice }, 1);
      return true; // Retorna verdadeiro = O card fica verdinho de "Adicionado"
    }
  };

  // 🟢 FUNÇÃO PARA ADICIONAR/REMOVER COMPLEMENTOS
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
                alert(`Você atingiu o limite de ${grupo.maximo} opções para o grupo "${grupo.nome}".`);
                return prev;
            }
            if (qtdAtualItem >= maxItem) {
                alert(`Você só pode adicionar no máximo ${maxItem}x o item "${nomeComplemento}".`);
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
                    alert(`O item "${nomeComplemento}" exige no mínimo ${minItem} opção(ões).`);
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

  const confirmVariationAndAdd = () => {
    if (hasColors && !selectedColor) return alert("Por favor, selecione uma cor.");
    if (hasSizes && !selectedSize) return alert("Por favor, selecione um tamanho.");

    // 🟢 VALIDAÇÃO E CÁLCULO DE COMPLEMENTOS FINAIS
    const complementosFinais: any[] = [];
    if (produto.grupos_complemento) {
        for (const grupo of produto.grupos_complemento) {
            const selecionados = modalComplements[grupo.id_grupo] || [];
            const qtdSelecionada = selecionados.reduce((acc: number, c: any) => acc + c.quantidade, 0);
            
            if (qtdSelecionada < grupo.minimo) {
                alert(`Por favor, selecione pelo menos ${grupo.minimo} opção(ões) em "${grupo.nome}"`);
                return;
            }

            if (grupo.complementos) {
                for (const comp of grupo.complementos) {
                    const itemSel = selecionados.find((c: any) => c.id_produto_add === comp.id_produto_add);
                    const qtdItem = itemSel ? itemSel.quantidade : 0;
                    if (comp.minimo > 0 && qtdItem < comp.minimo) {
                        alert(`A opção "${comp.produto_add?.nome}" é obrigatória (Mínimo: ${comp.minimo}).`);
                        return;
                    }
                }
            }
            complementosFinais.push(...selecionados);
        }
    }

    const extraPriceComplements = complementosFinais.reduce((acc, c) => acc + (Number(c.preco_adicional) * c.quantidade), 0);
    const precoUnitarioCalculado = finalPrice + extraPriceComplements;

    addToCart(
      {
        ...produto,
        preco: precoUnitarioCalculado, // 🟢 Preço base + Variação + Complementos
        id_variacao: currentVariation ? currentVariation.id_variacao : null,
        cor: currentVariation ? currentVariation.cor : null,
        tamanho: currentVariation ? currentVariation.tamanho : null,
        complementos: complementosFinais, // 🟢 Joga para o carrinho
        observacao: modalObservacao // 🟢 Joga para o carrinho
      },
      quantidade
    );

    setIsModalOpen(false);
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantidade(1);
    setModalComplements({});
    setModalObservacao('');
  };

  // 🟢 CALCULA TOTAL PARA O BOTÃO DO MODAL
  const calcularTotalModal = () => {
    let total = finalPrice;
    Object.values(modalComplements).flat().forEach((comp: any) => {
        total += (Number(comp.preco_adicional) * comp.quantidade);
    });
    return total * quantidade;
  };

  let CardComponent;
  switch (appearance?.STORE_LAYOUT_STYLE) {
    case 'CARDAPIO':
      CardComponent = <ProductCardCardapio produto={produto} pixAtivo={pixAtivo} pixPorcentagem={pixPorcentagem} onAddClick={handleAddToCartClick} />;
      break;
    case 'MERCADINHO':
      CardComponent = <ProductCardMercadinho produto={produto} pixAtivo={pixAtivo} pixPorcentagem={pixPorcentagem} onAddClick={handleAddToCartClick} />;
      break;
    case 'ECOMMERCE':
    default:
      CardComponent = <ProductCardEcommerce produto={produto} pixAtivo={pixAtivo} pixPorcentagem={pixPorcentagem} onAddClick={handleAddToCartClick} />;
      break;
  }

  return (
    <>
      {CardComponent}

      {/* 🟢 CREATE PORTAL: Tira o Modal do grid e joga ele por cima de toda a tela (z-index infinito) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-white w-full sm:w-[450px] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div className="flex gap-4">
                {produto.imagem_url && (
                  <img src={produto.imagem_url} alt={produto.nome} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                )}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{produto.nome}</h3>
                  <p className="text-blue-600 font-black mt-1">R$ {finalPrice.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>

            {hasColors && (
              <div className="mb-5">
                <p className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Cor: <span className="font-normal text-gray-500 capitalize">{selectedColor || 'Selecione'}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {uniqueColors.map(cor => (
                    <button
                      key={cor}
                      onClick={() => { setSelectedColor(cor); setSelectedSize(null); }}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${selectedColor === cor ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      {cor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasSizes && (
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tamanho: <span className="font-normal text-gray-500 capitalize">{selectedSize || 'Selecione'}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {uniqueSizes.map(tam => {
                    const varEspecifica = variacoes.find(v => (!hasColors || v.cor === selectedColor) && v.tamanho === tam);
                    const isOutOfStock = varEspecifica ? Number(varEspecifica.estoque) <= 0 : true;

                    return (
                      <button
                        key={tam}
                        disabled={isOutOfStock && hasColors && selectedColor !== null}
                        onClick={() => setSelectedSize(tam)}
                        className={`min-w-[3rem] h-10 px-3 text-sm font-bold rounded-xl border-2 transition-all flex items-center justify-center
                          ${selectedSize === tam ? 'border-blue-600 bg-blue-600 text-white' : ''}
                          ${!selectedSize && !isOutOfStock ? 'border-gray-200 text-gray-700 hover:border-blue-300' : ''}
                          ${isOutOfStock && (!hasColors || selectedColor) && selectedSize !== tam ? 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed' : ''}
                        `}
                      >
                        {tam}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 🟢 BLOCO DE COMPLEMENTOS (Estilo iFood) INJETADO */}
            {produto.grupos_complemento?.map((grupo: any) => {
                const selecionados = modalComplements[grupo.id_grupo] || [];
                const isRequired = grupo.minimo > 0;
                const atingiuMaximo = selecionados.reduce((acc: number, c: any) => acc + c.quantidade, 0) >= grupo.maximo;

                return (
                    <div key={grupo.id_grupo} className="mb-6">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">{grupo.nome}</h3>
                                <p className="text-xs text-gray-500">
                                    Escolha {grupo.minimo === grupo.maximo ? `exatamente ${grupo.maximo}` : `de ${grupo.minimo} até ${grupo.maximo}`} opções.
                                </p>
                            </div>
                            {isRequired ? (
                                <span className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Obrigatório</span>
                            ) : (
                                <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Opcional</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            {grupo.complementos?.map((comp: any) => {
                                const itemSelecionado = selecionados.find((c: any) => c.id_produto_add === comp.id_produto_add);
                                const qtdDesteItem = itemSelecionado ? itemSelecionado.quantidade : 0;
                                
                                const maxItem = comp.maximo !== undefined ? comp.maximo : 1;
                                const minItem = comp.minimo !== undefined ? comp.minimo : 0;

                                const isDisabledAdd = atingiuMaximo || qtdDesteItem >= maxItem;
                                const isDisabledRemove = qtdDesteItem <= minItem;

                                return (
                                    <div key={comp.id_produto_add} className={`flex items-center justify-between p-3 border rounded-xl transition-all ${qtdDesteItem > 0 ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                                        <div 
                                            className={`flex flex-col flex-1 ${grupo.maximo === 1 ? 'cursor-pointer' : ''}`}
                                            onClick={() => { if (grupo.maximo === 1) handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1); }}
                                        >
                                            <span className="font-medium text-sm text-gray-700">{comp.produto_add?.nome}</span>
                                            {Number(comp.preco_adicional) > 0 && (
                                                <span className="text-xs font-medium text-gray-500">
                                                    + R$ {Number(comp.preco_adicional).toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center ml-2">
                                            {grupo.maximo === 1 ? (
                                                <div 
                                                    className={`w-6 h-6 flex items-center justify-center rounded-full border cursor-pointer ${qtdDesteItem > 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                                                    onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                >
                                                    {qtdDesteItem > 0 && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {qtdDesteItem > 0 ? (
                                                        <>
                                                            <button 
                                                                className={`w-7 h-7 flex items-center justify-center rounded-full border bg-white ${isDisabledRemove ? 'opacity-50 border-gray-200 text-gray-400' : 'border-red-200 text-red-500'}`}
                                                                onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, -1)}
                                                                disabled={isDisabledRemove}
                                                            >
                                                                -
                                                            </button>
                                                            <span className="font-bold text-gray-800 text-center" style={{ width: '16px' }}>{qtdDesteItem}</span>
                                                            <button 
                                                                className={`w-7 h-7 flex items-center justify-center rounded-full border bg-white ${isDisabledAdd ? 'opacity-50 border-gray-200 text-gray-400' : 'border-blue-200 text-blue-600'}`}
                                                                onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                                disabled={isDisabledAdd}
                                                            >
                                                                +
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button 
                                                            className={`w-7 h-7 flex items-center justify-center rounded-full border bg-white ${isDisabledAdd ? 'opacity-50 border-gray-200 text-gray-400' : 'border-gray-300 text-gray-600'}`}
                                                            onClick={() => handleUpdateComplementQty(grupo, comp, comp.produto_add?.nome, 1)}
                                                            disabled={isDisabledAdd}
                                                        >
                                                            +
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

            {/* 🟢 BLOCO DE OBSERVAÇÃO INJETADO */}
            <div className="mb-6 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">Alguma observação?</h3>
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

            <div className="pt-2">
              <button 
                onClick={confirmVariationAndAdd}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg h-14 rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex justify-between px-6 items-center"
              >
                <span>Adicionar ao Carrinho</span>
                {/* 🟢 O BOTÃO AGORA MOSTRA O PREÇO TOTAL DINAMICAMENTE */}
                <span>R$ {calcularTotalModal().toFixed(2).replace('.', ',')}</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};