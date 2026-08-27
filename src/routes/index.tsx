import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';

import { useStoreConfig } from '../contexts/StoreConfigContext';

import { Home } from '../pages/Layout/Home';
import { HomeCardapio } from '../pages/Layout/HomeCardapio';
import { HomeMercadinho } from '../pages/Layout/HomeMercadinho';
import { HomeAgendamento } from '../pages/Layout/HomeAgendamento';
import { CheckoutAgendamento } from '../pages/Layout/checkout/CheckoutAgendamento';

import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { Profile } from '../pages/Profile';
import { ProductDetails } from '../pages/ProductDetails';
import { Checkout } from '../pages/Layout/checkout/Checkout';
import { Catalog } from '../pages/Catalog';
import { Orders } from '../pages/Orders';
import { Favorites } from '../pages/Favorites';
import { CampaignPage } from '../pages/CampaignPage';
import { DriverDelivery } from '../pages/DriverDelivery';
import { OrderTracking } from '../components/ordercomponent/OrderTracking';
import { TermosDeUso } from '../pages/TermosDeUso';
import { PoliticaPrivacidade } from '../pages/PoliticaPrivacidade';
import { PoliticaEntrega } from '../pages/PoliticaEntrega';
import { PoliticaTrocas } from '../pages/PoliticaTrocas';
import { CustomLandingPage } from '../pages/custom/agendamento/CustomLandingPage';

// 🟢 IMPORT DO AUTOATENDIMENTO
import { Autoatendimento } from '../pages/Autoatendimento';

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CookieConsent } from '../components/CookieConsent';

export const AppRoutes = () => {
  const [loading, setLoading] = useState(true);
  const [tenantExists, setTenantExists] = useState(true);

  const { appearance } = useStoreConfig();

  useEffect(() => {
    const hostname = window.location.hostname;

    if (hostname === 'ararinhacloud.shop' || hostname === 'localhost') {
      if (!localStorage.getItem('tenantId')) {
        localStorage.setItem('tenantId', '1');
      }
      setLoading(false);
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    axios.get(`${API_URL}/tenants/verify/${hostname}`)
      .then((response) => {
        localStorage.setItem('tenantId', response.data.tenantId);
        setTenantExists(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao verificar tenant:", error);
        localStorage.removeItem('tenantId');
        setTenantExists(false);
        setLoading(false);
      });
  }, []);

  const renderHomeTemplate = () => {
    switch (appearance?.STORE_LAYOUT_STYLE) {
      case 'CARDAPIO':
        return <HomeCardapio />;
      case 'MERCADINHO':
        return <HomeMercadinho />;
      case 'AGENDAMENTO':
        return <HomeAgendamento />;
      case 'ECOMMERCE':
      default:
        return <Home />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <h1 className="text-xl font-semibold text-gray-500">Conectando à loja...</h1>
        </div>
      </div>
    );
  }

  if (!tenantExists) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <img
          src="/images/error404.png"
          alt="404"
          className="w-80 max-w-full mb-6"
        />
        <h2 className="text-2xl font-semibold text-gray-800">
          Loja não encontrada
        </h2>
        <p className="text-gray-500 mt-2 text-center">
          Verifique se o endereço foi digitado corretamente.
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* 🟢 O SEGREDO ESTÁ AQUI: Separamos as rotas em dois blocos! */}
      <Routes>
        
        {/* ========================================================
            1. ROTA ISOLADA: AUTOATENDIMENTO (SEM HEADER E FOOTER) 
        ======================================================== */}
        <Route path="/:slug_loja/m/:token" element={<Autoatendimento />} />

        {/* ========================================================
            2. ROTAS NORMAIS DA LOJA VIRTUAL (COM HEADER E FOOTER) 
        ======================================================== */}
        <Route path="*" element={
          <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-grow">
              <Routes>
                <Route path="/" element={renderHomeTemplate()} />

                <Route path="/perfil" element={<Profile />} />
                <Route path="/favoritos" element={<Favorites />} />
                <Route path="/pedidos" element={<Orders />} />

                <Route path="/driver/delivery/:token" element={<DriverDelivery />} />
                <Route path="/order/:id" element={<OrderTracking />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                <Route path="/produto/:id" element={<ProductDetails />} />
                <Route path="/checkout" element={<Checkout />} />

                <Route path="/agendar/:id_servico" element={<CheckoutAgendamento />} />

                <Route path="/busca" element={<Catalog />} />
                <Route path="/search" element={<Catalog />} />
                
                <Route path="/categoria/:categoria" element={<Catalog />} />
                <Route path="/categoria/:categoria/:subcategoria" element={<Catalog />} />
                <Route path="/campanha/:slug" element={<CampaignPage />} />
                <Route path="/p/:slug" element={<CustomLandingPage />} />

                <Route path="/termos" element={<TermosDeUso />} />
                <Route path="/privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/entrega" element={<PoliticaEntrega />} />
                <Route path="/trocas" element={<PoliticaTrocas />} />

                {/* 404 PADRÃO DA LOJA */}
                <Route
                  path="*"
                  element={
                    <div className="flex h-[calc(100vh-200px)] items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <img
                          src="/images/error404.png"
                          alt="Página não encontrada"
                          className="mx-auto mb-4 w-72"
                        />
                        <h1 className="text-4xl font-bold text-gray-300 mb-2">Página não encontrada</h1>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </main>

            <Footer />
            <CookieConsent />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};