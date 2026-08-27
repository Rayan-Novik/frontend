import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { ProductCard, type Produto } from '../../components/ProductCard';
import { useStoreConfig } from '../../contexts/StoreConfigContext';

export const HomeMercadinho = () => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados para Filtros e Busca (Crucial para Mercadinho)
    const [busca, setBusca] = useState('');
    const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

    const { appearance } = useStoreConfig();
    // Verde padrão caso não tenha cor (lembra muito supermercado/hortifruti)
    const primaryBg = appearance?.BTN_PRIMARY_BG || '#10B981';

    useEffect(() => {
        const fetchEstoque = async () => {
            try {
                const response = await api.get('/produtos');
                setProdutos(response.data);
            } catch (error) {
                console.error('Erro ao carregar mercadinho:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEstoque();
    }, []);

    // 🚀 MÁGICA: Extrai as categorias únicas dos produtos para criar os botões laterais
    const categorias = useMemo(() => {
        const cats = new Set<string>();
        produtos.forEach(p => {
            const nomeCat = (p as any).categorias?.nome;
            if (nomeCat) cats.add(nomeCat);
        });
        return ['Todas', ...Array.from(cats)];
    }, [produtos]);

    // 🚀 MÁGICA: Filtra os produtos ao vivo enquanto o cliente digita ou clica na categoria
    const produtosFiltrados = useMemo(() => {
        return produtos.filter(p => {
            const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
            const matchCategoria = categoriaAtiva === 'Todas' || (p as any).categorias?.nome === categoriaAtiva;
            return matchBusca && matchCategoria;
        });
    }, [produtos, busca, categoriaAtiva]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: primaryBg }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">

            {/* 🟢 HERO DE BUSCA (Apenas a barra de pesquisa centralizada) */}
            <div className="bg-white border-b border-gray-200 pt-6 pb-6 px-4 shadow-sm">
                <div className="max-w-3xl mx-auto w-full relative">
                    <input
                        type="text"
                        placeholder="O que você está procurando?"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-transparent focus:ring-4 transition-all text-base text-gray-800"
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 4px ${primaryBg}33`}
                        onBlur={(e) => e.target.style.boxShadow = 'none'}
                    />
                    <svg className="w-6 h-6 text-gray-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {busca && (
                        <button
                            onClick={() => setBusca('')}
                            className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <i className="bi bi-x-circle-fill text-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-6 flex flex-col md:flex-row gap-6">

                {/* 🟢 MENU LATERAL (DESKTOP) E ROLÁVEL (MOBILE) */}
                <aside className="md:w-64 flex-shrink-0">
                    <div className="sticky top-[80px]">
                        <h3 className="font-bold text-gray-900 mb-3 hidden md:block border-b pb-2">Corredores</h3>

                        <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 no-scrollbar">
                            {categorias.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoriaAtiva(cat)}
                                    className={`whitespace-nowrap text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 border
                    ${categoriaAtiva === cat
                                            ? 'text-white border-transparent shadow-md'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                                    style={{ backgroundColor: categoriaAtiva === cat ? primaryBg : undefined }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* 🟢 CORREDOR DE PRODUTOS (GRID DE ALTA DENSIDADE) */}
                <main className="flex-grow">
                    {/* Cabeçalho de Resultados */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800">
                            {busca ? `Buscando por "${busca}"` : categoriaAtiva === 'Todas' ? 'Todos os produtos' : `Setor: ${categoriaAtiva}`}
                        </h2>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'item' : 'itens'}
                        </span>
                    </div>

                    {produtosFiltrados.length > 0 ? (
                        // 🚀 O SEGREDO DO MERCADINHO: gap menor (gap-3), mais colunas (lg:grid-cols-4, xl:grid-cols-5)
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {produtosFiltrados.map((produto) => (
                                <ProductCard key={produto.id_produto} produto={produto} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="text-lg font-bold text-gray-500">Ops, prateleira vazia!</h3>
                            <p className="text-sm text-gray-400 mt-1">Não encontramos nada com esses filtros.</p>
                            {busca && (
                                <button onClick={() => setBusca('')} className="mt-4 text-blue-600 font-bold hover:underline">
                                    Limpar busca
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>

            <style>{`
        /* Esconde a barra de rolagem no mobile para os filtros laterais */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
};