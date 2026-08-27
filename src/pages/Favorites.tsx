import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { useCart } from '../contexts/CartContext';
import { formatarPreco } from '../contexts/formatters';

interface ProdutoSubimagem {
  url: string;
  ordem: number;
}

interface ProdutoDesejo {
  id_produto: number;
  nome: string;
  preco: number;
  preco_promocional?: number;
  imagem_url?: string;
  produto_subimagens?: ProdutoSubimagem[];
}

interface WishlistItem {
  id_lista_desejos: number;
  id_usuario: number;
  id_produto: number;
  produtos: ProdutoDesejo;
}

export const Favorites = () => {
  const [favoritos, setFavoritos] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  const navigate = useNavigate();
  const { appearance } = useStoreConfig();
  const { addToCart } = useCart();

  const bodyBg = appearance?.BODY_BG_COLOR || '#F8FAFC';
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';

  useEffect(() => {
    // 🟢 CORREÇÃO: Verificando token e adminInfo
    const token = localStorage.getItem('token');
    const adminInfo = localStorage.getItem('adminInfo');
    
    // Se nenhum dos dois existir, chuta pro login
    if (!token && !adminInfo) {
      console.warn("Usuário não autenticado. Redirecionando...");
      navigate('/login');
      return;
    }

    fetchFavoritos(token);
  }, [navigate]);

  const fetchFavoritos = async (tokenParaEnviar: string | null) => {
    setIsLoading(true);
    try {
      // 🟢 Envia o token manualmente caso o adminInfo seja o passe livre
      const config = tokenParaEnviar ? { headers: { Authorization: `Bearer ${tokenParaEnviar}` } } : {};
      
      const response = await api.get('/wishlist', config);
      setFavoritos(response.data);
    } catch (error: any) {
      console.error("Erro ao buscar favoritos:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setErro('Sua sessão expirou. Faça login novamente.');
        // Limpa a sujeira
        localStorage.removeItem('token');
      } else {
        setErro('Não foi possível carregar sua lista de desejos no momento.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoverFavorito = async (productId: number) => {
    const novaLista = favoritos.filter(item => item.id_produto !== productId);
    setFavoritos(novaLista);

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await api.delete(`/wishlist/${productId}`, config);
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      fetchFavoritos(localStorage.getItem('token')); // Recarrega se falhar
      alert("Erro ao remover o produto da lista.");
    }
  };

  const handleComprar = (produto: ProdutoDesejo) => {
    addToCart({
      id: produto.id_produto,
      nome: produto.nome,
      preco: produto.preco_promocional || produto.preco,
      imagem: produto.imagem_url || produto.produto_subimagens?.[0]?.url,
      quantidade: 1
    });
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: bodyBg }}>
      {/* Cabeçalho da Página */}
      <div className="bg-white border-b border-gray-200 py-8 mb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Meus Favoritos
          </h1>
          <p className="text-gray-500 mt-2">Produtos que você curtiu e salvou para comprar depois.</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4" style={{ borderColor: primaryBg }}></div>
          </div>
        ) : erro ? (
          <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-200 text-center flex flex-col items-center gap-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="font-bold text-lg">{erro}</p>
            {erro.includes('expirou') && (
              <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold">
                Fazer Login Novamente
              </button>
            )}
          </div>
        ) : favoritos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Sua lista está vazia</h3>
            <p className="text-gray-500 mb-8">Navegue pela loja e clique no coração para salvar seus produtos favoritos aqui!</p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: primaryBg }}
            >
              Explorar Produtos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoritos.map(({ id_produto, produtos }) => (
              <div key={id_produto} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all flex flex-col">
                
                <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-4">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleRemoverFavorito(id_produto); }}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm z-10"
                    title="Remover dos favoritos"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                  
                  <Link to={`/produto/${id_produto}`} className="w-full h-full flex items-center justify-center">
                    {produtos.imagem_url || produtos.produto_subimagens?.[0]?.url ? (
                      <img 
                        src={produtos.imagem_url || produtos.produto_subimagens?.[0]?.url} 
                        alt={produtos.nome} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </Link>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <Link to={`/produto/${id_produto}`} className="flex-grow">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                      {produtos.nome}
                    </h3>
                  </Link>
                  
                  <div className="mt-4 mb-4">
                    {produtos.preco_promocional ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through">{formatarPreco(produtos.preco)}</span>
                        <span className="font-bold text-lg text-gray-900">{formatarPreco(produtos.preco_promocional)}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-lg text-gray-900">{formatarPreco(produtos.preco)}</span>
                    )}
                  </div>

                  <button 
                    onClick={() => handleComprar(produtos)}
                    className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryBg }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};