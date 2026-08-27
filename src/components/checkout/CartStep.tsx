import { Button } from '../ui/Button';
import { useCart } from '../../contexts/CartContext';

export const CartStep = ({ onNext }: any) => {
    const { items, updateQuantity, removeFromCart, generateHash } = useCart();

    const formatarPreco = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    return (
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">Seu Carrinho</h2>

            {items.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">Seu carrinho está vazio.</p>
                </div>
            ) : (
                <div className="space-y-6 mb-6">
                    {items.map((item: any, idx: number) => {
                        // 🟢 AGORA USAMOS A FUNÇÃO GENERATE HASH DO CONTEXT PARA ISOLAR ITENS EXATAMENTE IGUAIS
                        const hashUnico = generateHash(item);
                        const listKey = `${hashUnico}-${idx}`; // Garantia extra para o map
                        
                        return (
                            <div key={listKey} className="flex gap-3 sm:gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0 w-full">

                                {/* IMAGEM DO PRODUTO */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-200 flex items-center justify-center overflow-hidden">
                                    {item.imagem_url ? (
                                        <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>

                                {/* INFO DO PRODUTO */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 break-words">
                                            {item.nome}
                                        </h3>
                                        
                                        {/* MOSTRA A COR, TAMANHO OU DATA DE AGENDAMENTO NO CARRINHO */}
                                        {item.data_agendamento ? (
                                            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-800">
                                                <p className="font-bold flex items-center gap-1 mb-1">
                                                    <i className="bi bi-calendar-check"></i> 
                                                    {new Date(item.data_agendamento).toLocaleDateString('pt-BR')} às {new Date(item.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <i className="bi bi-person"></i> Com: {item.nome_profissional || 'Profissional'}
                                                </p>
                                            </div>
                                        ) : (
                                            (item.cor || item.tamanho) && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.cor && <span>Cor: <strong className="text-gray-700">{item.cor}</strong> </span>}
                                                    {item.cor && item.tamanho && <span className="mx-1">|</span>}
                                                    {item.tamanho && <span>Tam: <strong className="text-gray-700">{item.tamanho}</strong></span>}
                                                </p>
                                            )
                                        )}

                                        {/* 🟢 RENDERIZAÇÃO DOS COMPLEMENTOS NO CARRINHO */}
                                        {item.complementos && item.complementos.length > 0 && (
                                            <div className="mt-1 flex flex-col gap-0.5">
                                                {item.complementos.map((comp: any, compIdx: number) => (
                                                    <span key={compIdx} className="text-[11px] sm:text-xs text-gray-500 font-medium leading-tight">
                                                        + {comp.quantidade}x {comp.nome || comp.produto_add?.nome}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* 🟢 RENDERIZAÇÃO DA OBSERVAÇÃO NO CARRINHO */}
                                        {item.observacao && (
                                            <p className="text-[11px] sm:text-xs text-red-500 mt-1.5 bg-red-50 px-2 py-1.5 rounded-lg inline-block border border-red-100">
                                                <strong className="font-bold">Obs:</strong> {item.observacao}
                                            </p>
                                        )}

                                        <p className="text-blue-600 font-black mt-2 text-sm sm:text-base">{formatarPreco(item.preco)}</p>
                                    </div>

                                    {/* CONTROLES DE QUANTIDADE E REMOVER */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                                        
                                        <div className="flex flex-col gap-1">
                                            {!item.data_agendamento && (
                                                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-8 sm:h-9 w-24">
                                                    <button
                                                        onClick={() => updateQuantity(hashUnico, item.quantidade - 1)}
                                                        disabled={item.quantidade <= 1}
                                                        className={`w-8 h-full rounded-l-lg font-bold transition-colors flex items-center justify-center ${
                                                            item.quantidade <= 1 ? 'text-gray-300 cursor-not-allowed bg-gray-100' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200'
                                                        }`}
                                                    >−</button>
                                                    
                                                    <input
                                                        type="text"
                                                        value={item.quantidade}
                                                        readOnly
                                                        className="w-8 h-full text-center text-sm font-bold bg-transparent border-0 p-0 focus:ring-0"
                                                    />
                                                    
                                                    <button
                                                        onClick={() => updateQuantity(hashUnico, item.quantidade + 1)}
                                                        disabled={item.quantidade >= item.estoque}
                                                        title={item.quantidade >= item.estoque ? 'Limite máximo de estoque atingido' : ''}
                                                        className={`w-8 h-full rounded-r-lg font-bold transition-colors flex items-center justify-center ${
                                                            item.quantidade >= item.estoque ? 'text-gray-300 cursor-not-allowed bg-red-50' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200'
                                                        }`}
                                                    >+</button>
                                                </div>
                                            )}
                                            
                                            {item.quantidade >= item.estoque && !item.data_agendamento && (
                                                <span className="text-[10px] text-red-500 font-bold leading-tight px-1">
                                                    Máximo no estoque
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(hashUnico)}
                                            className="text-xs sm:text-sm text-red-500 hover:underline font-medium px-2 py-1 mt-auto"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-end pt-2 w-full">
                <Button
                    onClick={onNext}
                    disabled={items.length === 0}
                    className={`w-full sm:w-auto px-8 h-12 text-base sm:text-lg rounded-xl font-bold ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Continuar para {items.some((i: any) => !i.data_agendamento) ? 'Entrega' : 'Pagamento'}
                </Button>
            </div>
        </div>
    );
};