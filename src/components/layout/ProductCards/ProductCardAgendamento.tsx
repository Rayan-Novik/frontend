import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Timer } from 'lucide-react';
import { useStoreConfig } from '../../../contexts/StoreConfigContext';

export interface Servico {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco: number | string;
  imagem_url?: string;
  tempo_duracao?: number; 
  slug?: string; // 🟢 NOVO CAMPO ADICIONADO
}

interface ProductCardAgendamentoProps {
  servico: Servico;
}

export const ProductCardAgendamento: React.FC<ProductCardAgendamentoProps> = ({ servico }) => {
  const navigate = useNavigate();
  
  const { appearance } = useStoreConfig();
  const btnBg = appearance?.BTN_PRIMARY_BG || '#2563EB';
  const btnText = appearance?.BTN_PRIMARY_TEXT || '#FFFFFF';

  const formatarTempo = (minutos?: number) => {
      const min = minutos || 60; 
      const h = Math.floor(min / 60);
      const m = min % 60;
      
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m} min`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col h-full">
      <div className="aspect-video w-full bg-gray-200 shrink-0">
        <img 
          src={servico.imagem_url || '/placeholder.png'} 
          alt={servico.nome}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
            <h3 className="text-sm sm:text-lg font-bold text-gray-800 leading-tight line-clamp-2">{servico.nome}</h3>
            
            <div 
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shrink-0 self-start sm:self-auto"
              title="Duração estimada do serviço"
            >
                <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {formatarTempo(servico.tempo_duracao)}
            </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2 line-clamp-2 flex-grow">{servico.descricao}</p>
        
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-4 border-t border-gray-50 gap-2 sm:gap-0">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Valor</span>
            <span className="text-base sm:text-xl font-black" style={{ color: btnBg }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(servico.preco))}
            </span>
          </div>
          
          <button 
            onClick={() => navigate(`/agendar/${servico.id_produto}`)} // Mantido como ID para evitar quebra no fluxo de checkout de serviços
            className="w-full sm:w-auto px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1 sm:gap-2 shadow-sm active:scale-95 hover:opacity-90"
            style={{ backgroundColor: btnBg, color: btnText }}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
};