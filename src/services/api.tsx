import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
});

// 1. INTERCEPTADOR DE REQUISIÇÃO
api.interceptors.request.use((config) => {
    let token = localStorage.getItem('token');

    if (!token) {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user && user.token) {
                    token = user.token;
                }
            } catch (e) {}
        }
    }

    if (!token) {
        const adminInfoString = localStorage.getItem('adminInfo');
        if (adminInfoString) {
            try {
                const adminInfo = JSON.parse(adminInfoString);
                if (adminInfo && adminInfo.token) {
                    token = adminInfo.token;
                }
            } catch (e) {}
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 🟢 LÓGICA 100% DINÂMICA PARA DOMÍNIO PERSONALIZADO
    // Pega exatamente o que está na barra de endereço do navegador
    let hostname = window.location.hostname;
    
    // Remove o "www." para padronizar no banco de dados
    hostname = hostname.replace(/^www\./, '');

    let domain = hostname;
    let slug = hostname;

    // Tratamento para ambiente de desenvolvimento local (localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        slug = localStorage.getItem('tenantSlug') || 'default';
        domain = slug;
    } else {
        // Se já tivermos o slug salvo da sessão, usamos ele por segurança
        const savedSlug = localStorage.getItem('tenantSlug');
        if (savedSlug) {
            slug = savedSlug;
        }
    }

    // 🚀 O SEGREDO ESTÁ AQUI: 
    // Manda o domínio exato (ex: azun.com.br) para o backend
    config.headers['x-tenant-domain'] = domain;
    config.headers['x-tenant-slug'] = slug;

    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
    }

    return config;
}, (error) => {
    return Promise.reject(error); 
});

// 🟢 2. INTERCEPTADOR DE RESPOSTA (BLINDADO COM 'FOR' CLÁSSICO)
api.interceptors.response.use((response) => {
    try {
        const isPainelAdmin = window.location.pathname.includes('/admin') || window.location.hostname.includes('admin');

        // Se NÃO for o painel admin e a resposta tiver um Array de dados
        if (!isPainelAdmin && response && response.data && Array.isArray(response.data)) {

            // CASO 1: Lista direta de produtos
            if (response.data.length > 0 && response.data[0] && ('tipo_produto' in response.data[0])) {
                const novaListaDireta = [];
                
                // Usando FOR clássico em vez de .filter()
                for (let i = 0; i < response.data.length; i++) {
                    const item = response.data[i];
                    if (item && item.tipo_produto !== 'INSUMO' && item.active_ecommerce !== false) {
                        novaListaDireta.push(item);
                    }
                }
                response.data = novaListaDireta;
            }
            
            // CASO 2: Lista agrupada por categorias (com products dentro)
            else if (response.data.length > 0 && response.data[0] && ('products' in response.data[0])) {
                const novaListaAgrupada = [];

                for (let i = 0; i < response.data.length; i++) {
                    const categoria = response.data[i];
                    
                    if (!categoria) continue;

                    const produtosFiltrados = [];
                    
                    // Usando FOR clássico em vez de .filter() na lista de produtos da categoria
                    if (categoria.products && Array.isArray(categoria.products)) {
                        for (let j = 0; j < categoria.products.length; j++) {
                            const item = categoria.products[j];
                            
                            // Se for válido, NÃO for INSUMO e NÃO estiver inativo, adicionamos!
                            if (item && item.tipo_produto !== 'INSUMO' && item.active_ecommerce !== false) {
                                produtosFiltrados.push(item);
                            }
                        }
                    }

                    // Só adiciona a categoria de volta na tela se sobrou algum produto ativo nela
                    if (produtosFiltrados.length > 0) {
                        novaListaAgrupada.push({
                            ...categoria,
                            products: produtosFiltrados
                        });
                    }
                }

                response.data = novaListaAgrupada;
            }
        }
    } catch (e) {
        console.error("Filtro de insumos ignorado para evitar travamento:", e);
    }

    return response;
}, (error) => {
    return Promise.reject(error);
});

export default api;