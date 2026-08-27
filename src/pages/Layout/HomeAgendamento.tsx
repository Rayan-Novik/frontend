import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ProductCardAgendamento, type Servico } from '../../components/layout/ProductCards/ProductCardAgendamento';
import { CustomLandingPage } from '../custom/agendamento/CustomLandingPage';
import { GaleriaAgendamento } from '../custom/agendamento/GaleriaAgendamento'; 
import { useStoreConfig } from '../../contexts/StoreConfigContext';

export const HomeAgendamento: React.FC = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { appearance } = useStoreConfig();
  const bgColor = appearance?.BODY_BG_COLOR || '#F9FAFB';
  const textColor = appearance?.SITE_TEXT_COLOR || '#111827';

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const resServicos = await api.get<any[]>(`/produtos`);
        const apenasServicos = resServicos.data.filter(
            (item) => item.tipo_produto === 'SERVICO'
        );
        setServicos(apenasServicos);
      } catch (error) {
        console.error("Erro ao buscar dados do Agendamento", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: bgColor }}>
      
      <CustomLandingPage />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: textColor }}>Nossos Serviços</h1>
          <p className="text-sm sm:text-base mt-2 opacity-70" style={{ color: textColor }}>Escolha o serviço desejado e reserve seu horário online.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-2 rounded-full" style={{ borderColor: appearance?.BTN_PRIMARY_BG || '#2563EB' }}></div>
          </div>
        ) : servicos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg opacity-60" style={{ color: textColor }}>Nenhum serviço disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {servicos.map((servico) => (
              <ProductCardAgendamento key={servico.id_produto} servico={servico} />
            ))}
          </div>
        )}
      </main>

      <GaleriaAgendamento />
      
    </div>
  );
};