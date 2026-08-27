import React from 'react';
import { Calendar, MapPin, UserCircle, CreditCard } from 'lucide-react';

// Exportamos a interface para poder usar em outros arquivos
export interface Agendamento {
  id_agendamento: number;
  data_inicio: string;
  status_agendamento: string;
  cliente_nome: string;
  profissional: string;
  local_nome: string;
  local_endereco: string;
  servico_nome: string;
  servico_imagem?: string;
  valor_total: number;
  status_pagamento: string;
}

interface AgendamentoListProps {
  agendamentos: Agendamento[];
  primaryBg: string;
  onNavigate: (path: string) => void;
  // 🟢 CORRIGIDO: Usando React.ReactNode diretamente
  getStatusBadge: (status: string) => React.ReactNode; 
}

export const AgendamentoList: React.FC<AgendamentoListProps> = ({ 
  agendamentos, 
  primaryBg, 
  onNavigate, 
  getStatusBadge 
}) => {

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const formatarDataAgenda = (dataString: string) => {
    const data = new Date(dataString);
    return {
      dia: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (agendamentos.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Você não possui agendamentos</h3>
        <p className="text-gray-500 mb-6">Explore nossos serviços e marque um horário conosco.</p>
        <button 
          onClick={() => onNavigate('/')} 
          className="px-6 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
          style={{ backgroundColor: primaryBg }}
        >
          Agendar Agora
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agendamentos.map((ag) => {
        const { dia, hora } = formatarDataAgenda(ag.data_inicio);

        return (
          <div key={ag.id_agendamento} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5 hover:shadow-md transition">
            
            {/* Info do Serviço */}
            <div className="flex items-start gap-4 sm:w-1/2">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                <img src={ag.servico_imagem || '/placeholder.png'} alt={ag.servico_nome} className="w-full h-full object-cover"/>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-900 line-clamp-1">{ag.servico_nome}</h3>
                <span className="text-xs text-gray-500 mb-2">Reserva #{ag.id_agendamento}</span>
                <div className="flex gap-2">
                  {getStatusBadge(ag.status_agendamento)}
                  {ag.status_pagamento === 'PAGO' ? (
                    <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      PAGO
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200">
                      AGUARDANDO PAGAMENTO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detalhes (Data, Local, Valor) */}
            <div className="sm:w-1/2 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-5 space-y-2.5">
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4" style={{ color: primaryBg }} />
                <span className="font-medium capitalize">{dia} às {hora}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <UserCircle className="w-4 h-4" style={{ color: primaryBg }} />
                <span className="truncate">{ag.profissional}</span>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 mt-0.5" style={{ color: primaryBg }} />
                <div className="flex flex-col">
                  <span className="font-semibold text-xs">{ag.local_nome}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[200px]">{ag.local_endereco}</span>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-gray-900 font-black">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  {formatarPreco(ag.valor_total)}
                </div>
                {ag.status_agendamento === 'PENDENTE' && (
                  <button 
                    onClick={() => alert("Chame no WhatsApp para reagendar ou cancelar a sua reserva.")} 
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};