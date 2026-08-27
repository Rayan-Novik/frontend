import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

export interface CartItem {
  id_produto: number;
  nome: string;
  preco: number;
  imagem_url?: string;
  quantidade: number;
  estoque: number;
  id_variacao?: number | null;
  cor?: string | null;
  tamanho?: string | null;
  complementos?: any[];
  observacao?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (produto: any, quantidade?: number) => void;
  removeFromCart: (hash: string) => void;
  updateQuantity: (hash: string, quantidade: number) => void;
  clearCart: () => void;
  totalItems: number;
  cartTotal: number;
  generateHash: (item: any) => string;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

const parsePreco = (valor: any): number => {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  let strValor = String(valor).toUpperCase();
  if (strValor.includes('R$')) strValor = strValor.split('R$')[1];
  const limpo = strValor.replace(',', '.').replace(/[^0-9.-]+/g, "");
  return parseFloat(limpo) || 0;
};

// 🟢 HASH PERFEITO: Avalia id, variação, observações e complementos!
export const generateItemHash = (item: any) => {
    let hash = `${item.id_produto}-${item.id_variacao || 'null'}`;
    if (item.observacao) hash += `-${item.observacao}`;
    
    let comps = item.complementos;
    if (typeof comps === 'string') {
        try { comps = JSON.parse(comps); } catch(e) { comps = []; }
    }

    if (comps && comps.length > 0) {
        const compString = comps
            .map((c: any) => `${c.id_produto_add || c.id_produto || c.nome}-${c.quantidade}`)
            .sort()
            .join('|');
        hash += `-[${compString}]`;
    }
    return hash;
};

const normalizeCartItem = (item: any): CartItem => {
  const idProd = item.produtos ? (item.produtos.id_produto || item.id_produto) : item.id_produto;
  const nomeProd = item.produtos ? (item.produtos.nome || item.nome) : item.nome;
  const precoProd = item.produtos ? (item.produtos.preco || item.preco) : item.preco;
  const imgProd = item.produtos ? (item.produtos.imagem_url || item.imagem_url) : item.imagem_url;
  const estqProd = item.produtos ? (item.produtos.estoque || item.estoque) : item.estoque;

  // 🟢 MÁGICA: Converte string para Array caso o backend devolva como JSON String
  let comps = item.complementos || [];
  if (typeof comps === 'string') {
      try { comps = JSON.parse(comps); } catch(e) { comps = []; }
  }

  return {
    id_produto: Number(idProd),
    nome: String(nomeProd || ''),
    preco: parsePreco(precoProd),
    imagem_url: imgProd,
    quantidade: Number(item.quantidade || 1),
    estoque: Number(estqProd || 99),
    id_variacao: item.id_variacao || null,
    cor: item.cor || null,
    tamanho: item.tamanho || null,
    complementos: comps,
    observacao: item.observacao || ''
  };
};

const mergeAndNormalize = (rawItems: any[]): CartItem[] => {
  const map = new Map<string, CartItem>();
  
  rawItems.forEach(raw => {
    const item = normalizeCartItem(raw);
    const uniqueKey = generateItemHash(item); 
    
    if (map.has(uniqueKey)) {
      const existing = map.get(uniqueKey)!;
      existing.quantidade += item.quantidade;
    } else {
      map.set(uniqueKey, item);
    }
  });
  
  return Array.from(map.values());
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('@ararinha/cart');
    if (saved) {
      try { return mergeAndNormalize(JSON.parse(saved)); } catch (e) { return []; }
    }
    return [];
  });

  const isSyncing = useRef(false);
  const timeoutRef = useRef<Record<string, any>>({});

  useEffect(() => {
    const syncCartWithDB = async () => {
      const token = localStorage.getItem('token');
      if (!token || isSyncing.current) return;
      isSyncing.current = true;

      try {
        const res = await api.get('/carrinho');
        const dbItems = res.data;
        const saved = localStorage.getItem('@ararinha/cart');
        const localItems = saved ? JSON.parse(saved) : [];

        if (localItems.length > 0 && dbItems.length === 0) {
          for (const item of localItems) {
            await api.post('/carrinho', { 
                id_produto: Number(item.id_produto), 
                quantidade: Number(item.quantidade),
                id_variacao: item.id_variacao || null,
                // 🟢 STRINGIFY NECESSÁRIO PARA O BACKEND SALVAR O JSON
                complementos: JSON.stringify(item.complementos || []),
                observacao: item.observacao || ''
            });
          }
          const resAtualizado = await api.get('/carrinho');
          setItems(mergeAndNormalize(resAtualizado.data));
        } else if (dbItems.length > 0) {
          setItems(mergeAndNormalize(dbItems));
        }
      } catch (error) {
        console.error("Erro ao sincronizar carrinho:", error);
      }
    };

    syncCartWithDB();
  }, []);

  useEffect(() => {
    localStorage.setItem('@ararinha/cart', JSON.stringify(items));
  }, [items]);

  const addToCart = async (produto: any, quantidade: number = 1) => {
    const qtdSafe = Number(quantidade);

    setItems(prev => {
      const novoItem = normalizeCartItem({ ...produto, quantidade: qtdSafe });
      const novoHash = generateItemHash(novoItem);
      const existingIndex = prev.findIndex(item => generateItemHash(item) === novoHash);

      if (existingIndex >= 0) {
        const newArr = [...prev];
        newArr[existingIndex].quantidade = Math.min(newArr[existingIndex].quantidade + qtdSafe, newArr[existingIndex].estoque);
        return newArr;
      }
      return [...prev, novoItem];
    });

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.post('/carrinho', { 
            id_produto: Number(produto.id_produto), 
            quantidade: qtdSafe,
            id_variacao: produto.id_variacao || null,
            // 🟢 STRINGIFY AQUI TAMBÉM! Garante o JSON no banco.
            complementos: JSON.stringify(produto.complementos || []),
            observacao: produto.observacao || ''
        });
      } catch (error) { console.error(error); }
    }
  };

  const updateQuantity = async (hash: string, quantidade: number) => {
    const qtdSafe = Number(quantidade);
    const itemToUpdate = items.find(i => generateItemHash(i) === hash);

    setItems(prev => prev.map(item =>
      generateItemHash(item) === hash
        ? { ...item, quantidade: Math.max(1, qtdSafe) }
        : item
    ));

    if (!itemToUpdate) return;

    if (timeoutRef.current[hash]) clearTimeout(timeoutRef.current[hash]);

    timeoutRef.current[hash] = setTimeout(async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.put('/carrinho/update', {
            id_produto: Number(itemToUpdate.id_produto),
            quantidade: Math.max(1, qtdSafe),
            id_variacao: itemToUpdate.id_variacao || null,
            complementos: JSON.stringify(itemToUpdate.complementos || []),
            observacao: itemToUpdate.observacao || ''
          });
        } catch (error) { console.error("Erro ao atualizar DB.", error); }
      }
    }, 400);
  };

  const removeFromCart = async (hash: string) => {
    const itemToRemove = items.find(i => generateItemHash(i) === hash);

    setItems(prev => {
      const novoCarrinho = prev.filter(item => generateItemHash(item) !== hash);
      localStorage.setItem('@ararinha/cart', JSON.stringify(novoCarrinho));
      return novoCarrinho;
    });

    if (!itemToRemove) return;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.delete(`/carrinho/${Number(itemToRemove.id_produto)}`, {
          data: { 
            id_variacao: itemToRemove.id_variacao || null,
            complementos: JSON.stringify(itemToRemove.complementos || []),
            observacao: itemToRemove.observacao || ''
          }
        });
      } catch (error) { console.error("Falha ao deletar no banco", error); }
    }
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('@ararinha/cart');
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);
  const cartTotal = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, cartTotal, generateHash: generateItemHash }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);