import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import api from '../../../services/api';

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  imagem_url?: string | null;
  estoque?: number | null;
  slug?: string; // 🟢 NOVO CAMPO ADICIONADO
}

interface ProductCardProps {
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

export const ProductCardEcommerce = ({ produto, pixAtivo, pixPorcentagem, onAddClick }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
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
  const installmentPrice = precoNumber / 10; 

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

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavoriting) return;
    setIsFavoriting(true);
    try {
      if (isFavorite) {
        await api.delete(`/wishlist/${produto.id_produto}`);
        setIsFavorite(false);
      } else {
        await api.post('/wishlist', { productId: produto.id_produto });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFavoriting(false);
    }
  };

  // 🟢 Define a URL final inteligente
  const urlProduto = `/produto/${produto.slug || gerarUrlAmigavel(produto.nome, produto.id_produto)}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full relative group w-full">
      <Link to={urlProduto} className="block w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center relative border-b border-gray-100 p-4">
        {temDescontoPix && <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-br-lg z-10 shadow-sm">-{pixPorcentagem}% PIX</div>}
        {produto.imagem_url ? (
          <img src={produto.imagem_url} alt={produto.nome} className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-medium text-xs text-center">Sem imagem</span>
          </div>
        )}
      </Link>
      <div className="p-4 sm:p-5 flex flex-col flex-grow w-full overflow-hidden">
        <Link to={urlProduto} className="hover:text-blue-600 transition-colors">
          <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 break-words" title={produto.nome}>{produto.nome}</h3>
        </Link>
        {produto.descricao && <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow break-words" title={produto.descricao}>{produto.descricao}</p>}
        <div className="mt-auto pt-2 w-full">
          {temDescontoPix ? (
            <div className="mb-4 flex flex-col justify-end">
              <span className="text-sm text-gray-400 line-through leading-none">{formatarPreco(precoNumber)}</span>
              <p className="text-xl font-black text-blue-600 leading-none mt-1">{formatarPreco(pixPrice)}</p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-xl font-black text-blue-600 leading-none">{formatarPreco(precoNumber)}</p>
              <span className="text-xs text-gray-500 block mt-1">10x de {formatarPreco(installmentPrice)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 w-full">
            <Button
              onClick={handleAddCart}
              disabled={isEsgotado || isAdded}
              variant={isEsgotado ? 'disabled' : isAdded ? 'success' : 'primary'}
              className="flex-1 min-w-0 px-1 sm:px-4 flex items-center justify-center gap-1 sm:gap-2 rounded-xl text-sm sm:text-base whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {isEsgotado ? 'Esgotado' : isAdded ? 'Add!' : 'Comprar'}
            </Button>
            <button onClick={toggleFavorite} disabled={isFavoriting} className={`flex-shrink-0 flex items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all duration-200 disabled:opacity-50 ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isFavorite ? 'fill-red-500 stroke-red-500 scale-110' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};