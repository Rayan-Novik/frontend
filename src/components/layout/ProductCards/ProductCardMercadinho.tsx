import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreConfig } from '../../../contexts/StoreConfigContext';

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  imagem_url?: string | null;
  estoque?: number | null;
  slug?: string; // 🟢 NOVO CAMPO ADICIONADO
}

interface ProductCardMercadinhoProps {
  produto: Produto;
  pixAtivo?: boolean;
  pixPorcentagem?: number;
  onAddClick?: (e: React.MouseEvent) => boolean | void;
}

// 🟢 Função de segurança para produtos antigos que não têm slug no banco
const gerarUrlAmigavel = (nome: string, id: number) => {
  const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  return `${slug}-${id}`;
};

export const ProductCardMercadinho = ({ produto, pixAtivo, pixPorcentagem, onAddClick }: ProductCardMercadinhoProps) => {
  const { appearance } = useStoreConfig();
  const [isAdded, setIsAdded] = useState(false);

  const primaryColor = appearance?.BTN_PRIMARY_BG || '#10B981';
  const primaryText = appearance?.BTN_PRIMARY_TEXT || '#ffffff';

  const formatarPreco = (valor: number | string) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
  };

  const isEsgotado = produto.estoque !== undefined && produto.estoque !== null && Number(produto.estoque) <= 0;
  const precoNumber = typeof produto.preco === 'string' ? parseFloat(produto.preco) : produto.preco;
  const temDescontoPix = pixAtivo && (pixPorcentagem || 0) > 0;
  const pixPrice = temDescontoPix ? precoNumber * (1 - ((pixPorcentagem || 0) / 100)) : precoNumber;

  // 🟢 LÓGICA CORRETA DE ADIÇÃO
  const handleAddCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (isEsgotado) return;
    
    if (onAddClick) {
      const adicionouDireto = onAddClick(e);
      if (adicionouDireto) {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
      }
    }
  };

  // 🟢 Define a URL final inteligente
  const urlProduto = `/produto/${produto.slug || gerarUrlAmigavel(produto.nome, produto.id_produto)}`;

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col h-full group">
      <Link to={urlProduto} className="block w-full aspect-square p-2 sm:p-3 bg-white relative overflow-hidden flex items-center justify-center">
        {temDescontoPix && <div className="absolute top-0 left-0 bg-green-500 text-white text-[0.65rem] sm:text-xs font-bold px-1.5 py-0.5 rounded-br-lg z-10 shadow-sm">-{pixPorcentagem}% PIX</div>}
        {produto.imagem_url ? <img src={produto.imagem_url} alt={produto.nome} className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105" /> : <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center text-gray-300"><i className="bi bi-basket fs-1"></i></div>}
      </Link>
      <div className="px-2 sm:px-3 pt-2 pb-2 sm:pb-3 flex flex-col flex-grow border-t border-gray-50">
        <Link to={urlProduto} className="transition-colors hover:opacity-70">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 line-clamp-2 leading-snug min-h-[34px] sm:min-h-[40px]">{produto.nome}</h3>
        </Link>
        <div className="mt-auto pt-2">
          {temDescontoPix ? (
            <div className="mb-2 flex flex-col justify-end"><p className="text-base sm:text-lg font-black leading-none mt-0.5" style={{ color: primaryColor }}>{formatarPreco(pixPrice)}</p></div>
          ) : (
            <p className="text-base sm:text-lg font-black mb-2 leading-none" style={{ color: primaryColor }}>{formatarPreco(precoNumber)}</p>
          )}
          <button
            onClick={handleAddCart}
            disabled={isEsgotado || isAdded}
            className={`w-full py-1.5 sm:py-2.5 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${isEsgotado ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : isAdded ? 'border border-opacity-30' : 'hover:brightness-95 hover:shadow-md'}`}
            style={isEsgotado ? {} : isAdded ? { backgroundColor: '#f0fdf4', color: primaryColor, borderColor: primaryColor } : { backgroundColor: primaryColor, color: primaryText }}
          >
            {isEsgotado ? 'Esgotado' : isAdded ? <><i className="bi bi-check-lg fs-6"></i> Na Cesta</> : <><i className="bi bi-cart-plus fs-6"></i> Adicionar</>}
          </button>
        </div>
      </div>
    </div>
  );
};