import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { useStoreConfig } from '../contexts/StoreConfigContext';

interface ProdutoVariacao {
  id_variacao: number;
  cor?: string | null;
  tamanho?: string | null;
  estoque: number;
  preco_adicional: number;
  sku?: string | null;
}

interface ProdutoDetalhado {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  imagem_url?: string | null;
  estoque: number;
  produto_subimagens?: { url: string; ordem: number }[];
  categorias?: { nome: string } | null;
  marcas?: { nome: string } | null;
  variacoes?: ProdutoVariacao[]; // 🟢 Ajustado para aceitar tanto 'variacoes'
  produto_variacoes?: ProdutoVariacao[]; // 🟢 Quanto 'produto_variacoes' vindo da API
}

interface Avaliacao {
  id_avaliacao: number;
  nota: number;
  comentario: string;
  imagem_url?: string | null;
  data_criacao: string;
  resposta_admin?: string;
  usuarios?: { nome_completo: string };
}

const getColorHex = (colorName: string) => {
  if (!colorName) return null;
  const map: Record<string, string> = {
    'VERDE': '#22c55e', 'VERMELHO': '#ef4444', 'AZUL': '#3b82f6',
    'PRETO': '#000000', 'BRANCO': '#ffffff', 'AMARELO': '#eab308',
    'ROSA': '#ec4899', 'ROXO': '#d946ef', 'LARANJA': '#f97316',
    'CINZA': '#6b7280', 'MARROM': '#8b4513', 'BEGE': '#d4a373',
    'PRATA': '#c0c0c0', 'DOURADO': '#ffd700', 'VINHO': '#722F37'
  };
  return map[colorName.toUpperCase().trim()] || null;
};

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const { appearance } = useStoreConfig();
  const pixAtivo = appearance?.PIX_DESCONTO_ATIVO;
  const pixPorcentagem = appearance?.PIX_DESCONTO_PORCENTAGEM || 0;

  const [produto, setProduto] = useState<ProdutoDetalhado | null>(null);
  const [imagemPrincipal, setImagemPrincipal] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [isAdded, setIsAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [notaForm, setNotaForm] = useState(5);
  const [comentarioForm, setComentarioForm] = useState('');
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    if (!localStorage.getItem('tenantId')) localStorage.setItem('tenantId', '1');
    setIsLoading(true);
    setErro('');

    try {
      const prodRes = await api.get(`/produtos/${id}`);
      setProduto(prodRes.data);
      setImagemPrincipal(prodRes.data.imagem_url || '');

      try {
        const revRes = await api.get(`/produtos/${id}/reviews`);
        setAvaliacoes(revRes.data || []);
      } catch (revError) {
        setAvaliacoes([]);
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const favRes = await api.get('/wishlist', { headers: { Authorization: `Bearer ${token}` } });
          const isFav = favRes.data.some((fav: any) => fav.id_produto === Number(id));
          setIsFavorite(isFav);
        } catch (favError) {
          console.error("Erro ao checar favoritos na carga inicial");
        }
      }

    } catch (error: any) {
      setErro('Produto não encontrado ou indisponível.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // 🟢 CORREÇÃO: Pega as variações independente do nome que a API retornar
  const variacoes = produto?.produto_variacoes || produto?.variacoes || [];
  
  const hasColors = variacoes.some(v => v.cor && v.cor.trim() !== '');
  const hasSizes = variacoes.some(v => v.tamanho && v.tamanho.trim() !== '');

  const uniqueColors = Array.from(new Set(variacoes.map(v => v.cor).filter(Boolean))) as string[];
  
  const uniqueSizes = Array.from(new Set(
    variacoes
      .filter(v => !selectedColor || v.cor === selectedColor)
      .map(v => v.tamanho)
      .filter(Boolean)
  )) as string[];

  const currentVariation = variacoes.find(v => 
    (!hasColors || v.cor === selectedColor) && 
    (!hasSizes || v.tamanho === selectedSize)
  );

  const basePrice = typeof produto?.preco === 'string' ? parseFloat(produto.preco) : (produto?.preco || 0);
  const precoAdicional = currentVariation ? Number(currentVariation.preco_adicional) : 0;
  const finalPrice = basePrice + precoAdicional;

  const temDescontoPix = pixAtivo && pixPorcentagem > 0;
  const pixPrice = temDescontoPix ? finalPrice * (1 - (pixPorcentagem / 100)) : finalPrice;
  const parcelamento12x = finalPrice / 12;

  const estoqueDisplay = currentVariation 
    ? Number(currentVariation.estoque) 
    : (hasColors || hasSizes ? 0 : Number(produto?.estoque || 0));

  const emEstoque = (hasColors || hasSizes) ? (currentVariation && estoqueDisplay > 0) : (estoqueDisplay > 0);

  const formatarPreco = (valor: number | string) => {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const handleComprar = () => {
    if (!produto || isAdded) return;

    if (hasColors && !selectedColor) return alert("Selecione uma cor antes de adicionar ao carrinho.");
    if (hasSizes && !selectedSize) return alert("Selecione um tamanho antes de adicionar ao carrinho.");

    // 🟢 AGORA ENVIAMOS A VARIAÇÃO EXATAMENTE COMO O CARRINHO ESPERA
    addToCart(
      {
        ...produto,
        preco: finalPrice,
        imagem_url: imagemPrincipal || produto.imagem_url,
        // Mandamos os dados direto na raiz do objeto para o CartContext ler sem erro:
        id_variacao: currentVariation ? currentVariation.id_variacao : null,
        cor: currentVariation ? currentVariation.cor : null,
        tamanho: currentVariation ? currentVariation.tamanho : null,
      },
      quantidade
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setQuantidade(1);
    }, 2000);
  };

  const toggleFavorite = async () => {
    const token = localStorage.getItem('token');
    const adminInfo = localStorage.getItem('adminInfo');

    if (!token && !adminInfo) {
      navigate('/login');
      return;
    }

    if (isFavoriting || !id) return;
    setIsFavoriting(true);

    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      if (isFavorite) {
        await api.delete(`/wishlist/${id}`, config);
        setIsFavorite(false);
      } else {
        await api.post('/wishlist', { productId: Number(id) }, config);
        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error("Erro ao favoritar produto:", error);
      if (error.response?.status === 401) {
        alert("Sua sessão expirou. Faça login novamente para favoritar produtos.");
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReviewImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    setReviewMessage({ type: '', text: '' });

    try {
      let uploadedImageUrl = '';

      if (reviewImage) {
        const formData = new FormData();
        formData.append('image', reviewImage);

        const uploadRes = await api.post('/uploadimages/review', formData);
        uploadedImageUrl = uploadRes.data.imagePath;
      }

      await api.post(`/produtos/${id}/reviews`, {
        nota: notaForm,
        comentario: comentarioForm,
        imagem_url: uploadedImageUrl || undefined
      });

      setReviewMessage({ type: 'success', text: 'Avaliação enviada com sucesso!' });

      setComentarioForm('');
      setNotaForm(5);
      setReviewImage(null);
      setImagePreview('');

      const revRes = await api.get(`/produtos/${id}/reviews`);
      setAvaliacoes(revRes.data || []);

    } catch (error: any) {
      console.error("Erro no envio:", error);
      const msg = error.response?.data?.message || 'Erro ao enviar. Verifique se você está logado e se já comprou o produto.';
      setReviewMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            onClick={() => interactive && setNotaForm(star)}
            className={`w-5 h-5 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${star <= rating ? 'fill-current' : 'text-gray-200 fill-current'}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (erro || !produto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Poxa, não encontramos!</h2>
          <p className="text-gray-500 mb-8">{erro}</p>
          <Button onClick={() => navigate('/')} className="w-full">Voltar para a Vitrine</Button>
        </div>
      </div>
    );
  }

  const galeria = produto.imagem_url ? [produto.imagem_url] : [];
  if (produto.produto_subimagens) {
    produto.produto_subimagens.forEach(sub => galeria.push(sub.url));
  }

  const mediaNotas = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length).toFixed(1)
    : 'Novo';

  let btnComprarText = "Adicionar ao Carrinho";
  let btnDisabled = isAdded || !emEstoque;

  if (hasColors && !selectedColor) {
      btnComprarText = "Selecione uma Cor";
      btnDisabled = true;
  } else if (hasSizes && !selectedSize) {
      btnComprarText = "Selecione um Tamanho";
      btnDisabled = true;
  } else if (!emEstoque) {
      btnComprarText = "Esgotado";
      btnDisabled = true;
  } else if (isAdded) {
      btnComprarText = "Adicionado!";
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-blue-600 transition-colors">Início</Link>
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          {produto.categorias && (
            <>
              <Link to={`/categoria/${produto.categorias.nome.toLowerCase()}`} className="hover:text-blue-600 transition-colors">{produto.categorias.nome}</Link>
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </>
          )}
          <span className="text-gray-900 truncate font-semibold">{produto.nome}</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="flex flex-col gap-4 mb-8 lg:mb-0">
            <div className="aspect-square bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex items-center justify-center relative overflow-hidden group">
              {imagemPrincipal ? (
                <img
                  src={imagemPrincipal}
                  alt={produto.nome}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="text-gray-400 font-medium flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Sem foto
                </span>
              )}
            </div>

            {galeria.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {galeria.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setImagemPrincipal(imgUrl)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-white border-2 snap-center transition-all ${imagemPrincipal === imgUrl ? 'border-blue-600 shadow-md ring-2 ring-blue-600/10' : 'border-gray-100 hover:border-blue-300 opacity-60 hover:opacity-100 p-2'}`}
                  >
                    <img src={imgUrl} alt={`Miniatura ${index + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col pt-2 lg:pt-6">
            {produto.marcas && (
              <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-3">
                {produto.marcas.nome}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
              {produto.nome}
            </h1>

            <div className="flex items-center gap-3 mb-8">
              {renderStars(mediaNotas === 'Novo' ? 5 : Number(mediaNotas))}
              <span className="font-bold text-gray-800">{mediaNotas}</span>
              <a href="#avaliacoes" className="text-sm text-gray-500 hover:text-blue-600 hover:underline transition-colors">
                ({avaliacoes.length} avaliações)
              </a>
            </div>

            <div className="w-full h-px bg-gray-200 mb-8"></div>

            <div className="mb-8">
              {temDescontoPix ? (
                <div className="flex flex-col">
                  <span className="text-lg text-gray-400 line-through mb-1">
                    {formatarPreco(finalPrice)}
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">
                      {formatarPreco(pixPrice)}
                    </span>
                    <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-sm border border-green-200">
                      -{pixPorcentagem}% PIX
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-3 font-medium">
                    ou em até <strong className="text-gray-700">12x de {formatarPreco(parcelamento12x)}</strong> no cartão
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                    {formatarPreco(finalPrice)}
                  </span>
                  <p className="text-gray-500 text-sm mt-2 font-medium">
                    Em até <strong className="text-gray-700">12x de {formatarPreco(parcelamento12x)}</strong> no cartão
                  </p>
                </div>
              )}
            </div>

            {hasColors && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                  Cor: <span className="text-gray-500 font-normal capitalize">{selectedColor || 'Selecione'}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map(cor => {
                    const hex = getColorHex(cor);
                    const isSelected = selectedColor === cor;
                    return (
                      <button
                        key={cor}
                        onClick={() => {
                          setSelectedColor(cor);
                          setSelectedSize(null);
                          setQuantidade(1);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200 font-medium
                          ${isSelected 
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' 
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                      >
                        {hex && (
                           <span 
                             className="w-5 h-5 rounded-full border border-gray-300/50 shadow-sm" 
                             style={{ backgroundColor: hex }}
                           ></span>
                        )}
                        {cor}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {hasSizes && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                  Tamanho: <span className="text-gray-500 font-normal">{selectedSize || 'Selecione'}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map(tam => {
                    const isSelected = selectedSize === tam;
                    const varEspecifica = variacoes.find(v => (!hasColors || v.cor === selectedColor) && v.tamanho === tam);
                    const isOutOfStock = varEspecifica ? Number(varEspecifica.estoque) <= 0 : true;

                    return (
                      <button
                        key={tam}
                        disabled={isOutOfStock && hasColors && selectedColor !== null}
                        onClick={() => {
                          setSelectedSize(tam);
                          setQuantidade(1);
                        }}
                        className={`
                          h-12 min-w-[3rem] px-4 rounded-xl border-2 font-bold transition-all duration-200 flex items-center justify-center
                          ${isSelected ? 'border-blue-600 bg-blue-600 text-white shadow-md' : ''}
                          ${!isSelected && !isOutOfStock ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300' : ''}
                          ${isOutOfStock && (!hasColors || selectedColor) && !isSelected ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through' : ''}
                        `}
                      >
                        {tam}
                      </button>
                    )
                  })}
                </div>
                {currentVariation && currentVariation.preco_adicional > 0 && (
                   <p className="text-xs text-blue-600 mt-2 font-semibold">* Este tamanho possui um acréscimo no valor.</p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-12 items-stretch">
              <div className="flex items-center bg-white border border-gray-200 rounded-2xl h-14 w-full sm:w-36 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <button 
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))} 
                  disabled={!emEstoque}
                  className="w-12 h-full text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-bold text-xl disabled:opacity-50"
                >−</button>
                <input
                  type="number"
                  value={quantidade}
                  readOnly
                  className="w-full h-full text-center font-bold text-lg text-gray-900 bg-transparent border-0 p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button 
                  onClick={() => setQuantidade(Math.min(estoqueDisplay, quantidade + 1))} 
                  disabled={!emEstoque}
                  className="w-12 h-full text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-bold text-xl disabled:opacity-50"
                >+</button>
              </div>

              <Button
                onClick={handleComprar}
                disabled={btnDisabled}
                className={`flex-1 h-14 text-lg font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2
                  ${isAdded ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20 text-white' : ''}
                  ${btnDisabled && !isAdded ? 'bg-gray-200 text-gray-500 border-none shadow-none cursor-not-allowed' : ''}
                  ${!isAdded && !btnDisabled ? 'shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5' : ''}
                `}
              >
                {isAdded ? (
                  <><svg className="w-6 h-6 animate-in zoom-in duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Adicionado!</>
                ) : (
                  <>{btnComprarText}</>
                )}
              </Button>

              <button
                onClick={toggleFavorite}
                disabled={isFavoriting}
                title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                className={`h-14 w-14 flex-shrink-0 flex items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 disabled:opacity-50
                  ${isFavorite ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 hover:-translate-y-0.5'}
                `}
              >
                <svg className={`w-6 h-6 transition-all duration-300 ${isFavorite ? 'fill-red-500 stroke-red-500 scale-110' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {produto.descricao && (
              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre o Produto</h3>
                <p className="whitespace-pre-line text-gray-600 leading-relaxed">
                  {produto.descricao}
                </p>
              </div>
            )}
          </div>
        </div>

        <div id="avaliacoes" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6 sm:px-10 py-8">
            <h3 className="text-2xl font-extrabold text-gray-900">Avaliações de Clientes</h3>
            <p className="text-gray-500 mt-1">Veja o que outras pessoas acharam deste produto.</p>
          </div>

          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/3 p-6 sm:p-10 lg:border-r border-gray-100 bg-white">
              <h4 className="font-bold text-gray-900 mb-6">Deixe sua avaliação</h4>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sua nota</label>
                  {renderStars(notaForm, true)}
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Comentário</label>
                  <textarea
                    required
                    rows={4}
                    value={comentarioForm}
                    onChange={(e) => setComentarioForm(e.target.value)}
                    className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-4 bg-gray-50 focus:bg-white transition-colors"
                    placeholder="Conte detalhes sobre o produto..."
                  ></textarea>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Foto (Opcional)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm w-full justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {imagePreview ? 'Trocar Foto' : 'Adicionar Foto'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-3 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
                      <button type="button" onClick={() => { setReviewImage(null); setImagePreview(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors">✕</button>
                    </div>
                  )}
                </div>
                {reviewMessage.text && (
                  <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${reviewMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                    {reviewMessage.text}
                  </div>
                )}
                <Button type="submit" isLoading={isSubmittingReview} className="w-full rounded-2xl h-12">Publicar Avaliação</Button>
              </form>
            </div>

            <div className="w-full lg:w-2/3 p-6 sm:p-10 bg-gray-50/30">
              {avaliacoes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center text-gray-400">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <h4 className="text-lg font-bold text-gray-600">Nenhuma avaliação ainda</h4>
                  <p className="text-sm mt-1">Seja o primeiro a avaliar este produto!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {avaliacoes.map((av) => (
                    <div key={av.id_avaliacao} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                            {av.usuarios?.nome_completo ? av.usuarios.nome_completo.charAt(0) : 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                              {av.usuarios?.nome_completo || 'Cliente'}
                              <span className="bg-green-100 text-green-700 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Compra Verificada
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(av.data_criacao).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        {renderStars(av.nota)}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-4">{av.comentario}</p>

                      {av.imagem_url && (
                        <div className="mb-4">
                          <img
                            src={av.imagem_url}
                            alt="Foto do cliente"
                            className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                            onClick={() => {
                              if (av.imagem_url) window.open(av.imagem_url, '_blank', 'noopener,noreferrer');
                            }}
                          />
                        </div>
                      )}

                      {av.resposta_admin && (
                        <div className="mt-4 bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500 text-sm text-gray-700">
                          <p className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            Resposta da Loja:
                          </p>
                          <p>{av.resposta_admin}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};