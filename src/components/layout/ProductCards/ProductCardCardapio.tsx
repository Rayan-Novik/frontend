import React, { useState } from 'react';

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  imagem_url?: string | null;
  estoque?: number | null;
  badge?: string;
  slug?: string; 
  grupos_complemento?: any[]; // 🟢 Apenas adicionado para o TS não chorar
}

interface ProductCardCardapioProps {
  produto: Produto;
  pixAtivo?: boolean;
  pixPorcentagem?: number;
  onAddClick?: (e: React.MouseEvent) => boolean | void;
}

export const ProductCardCardapio = ({ produto, pixAtivo, pixPorcentagem, onAddClick }: ProductCardCardapioProps) => {
  const [isAdded, setIsAdded] = useState(false);

  const formatarPreco = (valor: number | string) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
  };

  const isEsgotado = produto.estoque !== undefined && produto.estoque !== null && Number(produto.estoque) <= 0;
  const precoNumber = typeof produto.preco === 'string' ? parseFloat(produto.preco) : produto.preco;
  const temDescontoPix = pixAtivo && (pixPorcentagem || 0) > 0;
  const pixPrice = temDescontoPix ? precoNumber * (1 - ((pixPorcentagem || 0) / 100)) : precoNumber;

  const handleAddCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    console.log(`👉 CLICOU NA LINHA DO PRODUTO: ${produto.nome}`);

    if (isEsgotado) {
      console.log(`❌ Bloqueado: Produto ${produto.nome} está esgotado.`);
      return;
    }
    
    if (onAddClick) {
      console.log("✅ Disparando o clique para abrir o Modal ou ir pro Carrinho...");
      const adicionouDireto = onAddClick(e);
      
      if (adicionouDireto) {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
      }
    } else {
      console.error("❌ ERRO GRAVE: O onAddClick não chegou no componente Cardápio!");
    }
  };

  return (
    <button 
      type="button"
      onClick={handleAddCart}
      className={`w-full text-left flex items-center gap-3 px-4 py-4 bg-white transition-colors cursor-pointer active:scale-[0.99] ${isEsgotado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-[15px] font-semibold text-gray-900 truncate">{produto.nome}</h3>
          {produto.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{produto.badge}</span>}
          {temDescontoPix && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white shadow-sm whitespace-nowrap">-{pixPorcentagem}% PIX</span>}
        </div>
        {produto.descricao && <p className="text-[13px] text-gray-500 line-clamp-2 leading-snug">{produto.descricao}</p>}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex flex-col items-end justify-center min-h-[40px]">
          {isAdded ? (
            <span className="text-sm font-bold text-green-600 flex items-center gap-1"><i className="bi bi-check-circle-fill"></i> Adicionado</span>
          ) : temDescontoPix ? (
             <div className="flex flex-col items-end text-right">
                <span className="text-[11px] text-gray-400 line-through leading-none mb-1">{formatarPreco(precoNumber)}</span>
                <span className="text-[15px] font-bold text-green-600 leading-none">{formatarPreco(pixPrice)}</span>
             </div>
          ) : (
            <span className="text-[15px] font-semibold text-gray-900 whitespace-nowrap">{formatarPreco(precoNumber)}</span>
          )}
        </div>
        
        {produto.imagem_url && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 relative">
            <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </button>
  );
};