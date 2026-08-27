import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api'; 
import { Calendar as CalendarIcon, Clock, CreditCard, UserCircle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { Servico } from '../../../components/layout/ProductCards/ProductCardAgendamento';
import { SuccessStep } from '../../../components/checkout/SuccessStep'; 
import { useStoreConfig } from '../../../contexts/StoreConfigContext'; 

// ==========================================
// INTERFACES
// ==========================================
interface Profissional {
  id_funcionario: number;
  nome_completo: string;
  role: string;
}

interface GatewayRule {
  method: string;
  provider: string;
  is_active: boolean;
}

interface LojaInfo {
  id_loja: number;
  nome: string;
  dias_funcionamento: string; 
  hora_abertura: string;
  hora_fechamento: string;
}

// ==========================================
// FORMULÁRIO DE CARTÃO
// ==========================================
const TransparentCardForm = ({ cardData, onChange, showInstallments, valorTotal, primaryBg, textColor, bodyBg }: any) => {
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    value = value.replace(/(\d{4})(?=\d)/g, '$1 '); 
    onChange({ target: { name: 'number', value } }); 
  };

  const handleOnlyNumbers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); 
    onChange({ target: { name: e.target.name, value } });
  };

  const borderStyle = { borderColor: `${textColor}30` };

  return (
    <div className="p-5 mt-2 bg-transparent border rounded-2xl animate-in fade-in slide-in-from-top-2" style={borderStyle}>
      <div className="space-y-5">
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: textColor, opacity: 0.8 }}>Nome impresso no cartão</label>
          <input type="text" name="holderName" value={cardData.holderName} onChange={onChange} placeholder="EX: JOAO S SILVA" className="w-full px-4 py-3 bg-transparent border rounded-xl shadow-sm outline-none uppercase transition-all" style={{ color: textColor, ...borderStyle, '--tw-ring-color': `${primaryBg}40` } as React.CSSProperties} onFocus={(e) => { e.target.style.borderColor = primaryBg; e.target.style.boxShadow = `0 0 0 4px ${primaryBg}20`; }} onBlur={(e) => { e.target.style.borderColor = `${textColor}30`; e.target.style.boxShadow = ''; }}/>
        </div>
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: textColor, opacity: 0.8 }}>Número do Cartão</label>
          <div className="relative">
            <input type="text" name="number" value={cardData.number} onChange={handleCardNumber} placeholder="0000 0000 0000 0000" maxLength={19} className="w-full pl-4 pr-12 py-3 bg-transparent border rounded-xl shadow-sm outline-none tracking-wide transition-all" style={{ color: textColor, ...borderStyle, '--tw-ring-color': `${primaryBg}40` } as React.CSSProperties} onFocus={(e) => { e.target.style.borderColor = primaryBg; e.target.style.boxShadow = `0 0 0 4px ${primaryBg}20`; }} onBlur={(e) => { e.target.style.borderColor = `${textColor}30`; e.target.style.boxShadow = ''; }}/>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none" style={{ color: textColor, opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: textColor, opacity: 0.8 }}>Mês</label>
            <input type="text" name="expMonth" value={cardData.expMonth} onChange={handleOnlyNumbers} placeholder="MM" maxLength={2} className="w-full px-3 py-3 bg-transparent border rounded-xl shadow-sm text-center outline-none transition-all" style={{ color: textColor, ...borderStyle }} onFocus={(e) => { e.target.style.borderColor = primaryBg; e.target.style.boxShadow = `0 0 0 4px ${primaryBg}20`; }} onBlur={(e) => { e.target.style.borderColor = `${textColor}30`; e.target.style.boxShadow = ''; }}/>
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: textColor, opacity: 0.8 }}>Ano</label>
            <input type="text" name="expYear" value={cardData.expYear} onChange={handleOnlyNumbers} placeholder="AA" maxLength={2} className="w-full px-3 py-3 bg-transparent border rounded-xl shadow-sm text-center outline-none transition-all" style={{ color: textColor, ...borderStyle }} onFocus={(e) => { e.target.style.borderColor = primaryBg; e.target.style.boxShadow = `0 0 0 4px ${primaryBg}20`; }} onBlur={(e) => { e.target.style.borderColor = `${textColor}30`; e.target.style.boxShadow = ''; }}/>
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: textColor, opacity: 0.8 }}>CVV</label>
            <input type="password" name="cvv" value={cardData.cvv} onChange={handleOnlyNumbers} placeholder="•••" maxLength={4} className="w-full px-3 py-3 bg-transparent border rounded-xl shadow-sm text-center text-lg font-black tracking-widest outline-none transition-all" style={{ color: textColor, ...borderStyle }} onFocus={(e) => { e.target.style.borderColor = primaryBg; e.target.style.boxShadow = `0 0 0 4px ${primaryBg}20`; }} onBlur={(e) => { e.target.style.borderColor = `${textColor}30`; e.target.style.boxShadow = ''; }}/>
          </div>
        </div>
        {showInstallments && (
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: textColor, opacity: 0.8 }}>Parcelamento</label>
            <select name="installments" value={cardData.installments} onChange={onChange} className="w-full px-4 py-3 bg-transparent border rounded-xl shadow-sm text-sm font-semibold outline-none transition-all" style={{ color: textColor, ...borderStyle }} onFocus={(e) => { e.target.style.borderColor = primaryBg; e.target.style.boxShadow = `0 0 0 4px ${primaryBg}20`; }} onBlur={(e) => { e.target.style.borderColor = `${textColor}30`; e.target.style.boxShadow = ''; }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((parcela) => {
                const formatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal / parcela);
                return <option key={parcela} value={parcela} style={{ backgroundColor: bodyBg, color: textColor }}>{parcela}x de {formatado} sem juros</option>;
              })}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE: CALENDÁRIO CUSTOMIZADO
// ==========================================
const CustomCalendar = ({ dataSelecionada, setDataSelecionada, diasFuncionamentoStr, primaryBg, textColor }: any) => {
  const hoje = new Date();
  const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  
  let diasAbertos = [0, 1, 2, 3, 4, 5, 6]; 
  try {
    if (diasFuncionamentoStr) {
      const txtStr = String(diasFuncionamentoStr);
      const numerosEncontrados = txtStr.match(/\d+/g);
      if (numerosEncontrados && numerosEncontrados.length > 0) {
        diasAbertos = numerosEncontrados.map(Number);
      }
    }
  } catch (e) {
    console.error("Erro ao ler dias da loja");
  }

  const prevMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  const nextMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));

  const year = mesAtual.getFullYear();
  const month = mesAtual.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  
  const diasDoMes = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const espacosVazios = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-transparent p-4 sm:p-6 rounded-[24px] border shadow-sm w-full" style={{ borderColor: `${textColor}20` }}>
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="p-2 rounded-full transition" style={{ color: textColor }}><ChevronLeft size={20} /></button>
        <h3 className="font-extrabold capitalize text-lg" style={{ color: textColor }}>
          {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-full transition" style={{ color: textColor }}><ChevronRight size={20} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
        {diasDaSemana.map(dia => (
          <div key={dia} className="text-[10px] sm:text-xs font-bold uppercase" style={{ color: textColor, opacity: 0.6 }}>{dia}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {espacosVazios.map(v => <div key={`empty-${v}`} className="p-2"></div>)}
        
        {diasDoMes.map(dia => {
          const dataParaComparacao = new Date(year, month, dia);
          
          const isPast = dataParaComparacao.getTime() < hojeMeiaNoite.getTime();
          const dayOfWeek = dataParaComparacao.getDay(); 
          const isClosedDay = !diasAbertos.includes(dayOfWeek);
          const isDisabled = isPast || isClosedDay;

          const dateStr = `${dataParaComparacao.getFullYear()}-${String(dataParaComparacao.getMonth() + 1).padStart(2, '0')}-${String(dataParaComparacao.getDate()).padStart(2, '0')}`;
          const isSelected = dataSelecionada === dateStr;

          let baseClasses = "aspect-square flex items-center justify-center rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all ";
          let inlineStyle: any = {};

          if (isDisabled) {
            baseClasses += "bg-transparent cursor-not-allowed border-transparent";
            inlineStyle = { color: textColor, opacity: 0.3 };
          } else if (isSelected) {
            baseClasses += "text-white shadow-md scale-105 border-transparent";
            inlineStyle = { backgroundColor: primaryBg, boxShadow: `0 4px 14px 0 ${primaryBg}60` };
          } else {
            baseClasses += "cursor-pointer border";
            inlineStyle = { color: textColor, borderColor: `${textColor}20`, backgroundColor: 'transparent' };
          }

          return (
            <button
              key={dia}
              disabled={isDisabled}
              onClick={() => setDataSelecionada(dateStr)}
              className={baseClasses}
              style={inlineStyle}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected) {
                    e.currentTarget.style.backgroundColor = primaryBg;
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = primaryBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled && !isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = textColor;
                    e.currentTarget.style.borderColor = `${textColor}20`;
                }
              }}
            >
              {dia}
            </button>
          );
        })}
      </div>
      
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t text-xs font-medium justify-center" style={{ borderColor: `${textColor}20`, color: textColor, opacity: 0.7 }}>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryBg }}></div> Selecionado</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border" style={{ backgroundColor: 'transparent', borderColor: `${textColor}40` }}></div> Disponível</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-transparent opacity-40" style={{ backgroundColor: textColor }}></div> Indisponível</span>
      </div>
    </div>
  );
};

// ==========================================
// TELA PRINCIPAL
// ==========================================
export const CheckoutAgendamento: React.FC = () => {
  const { id_servico } = useParams<{ id_servico: string }>();
  const navigate = useNavigate();
  
  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';
  const bodyBg = appearance?.BODY_BG_COLOR || '#F8F9FB';
  const textColor = appearance?.SITE_TEXT_COLOR || '#111827';

  const [step, setStep] = useState<1 | 2>(1);
  const [servico, setServico] = useState<Servico | null>(null);
  const [orderResult, setOrderResult] = useState<any>(null); 
  const [lojaData, setLojaData] = useState<LojaInfo | null>(null);
  
  const [dataSelecionada, setDataSelecionada] = useState<string>('');
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string>('');
  
  const [horariosLivresBackend, setHorariosLivresBackend] = useState<string[]>([]);
  const [horaSelecionada, setHoraSelecionada] = useState<string>('');
  
  const [sinalPercent, setSinalPercent] = useState<number>(100);
  
  const [loadingHorarios, setLoadingHorarios] = useState<boolean>(false);
  const [processando, setProcessando] = useState<boolean>(false);

  const [activeMethods, setActiveMethods] = useState<GatewayRule[]>([]);
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [cardData, setCardData] = useState({ holderName: '', number: '', expMonth: '', expYear: '', cvv: '', installments: 1 });

  const getMethodUI = () => ({
    'PIX': { title: 'PIX (Online)', desc: 'Aprovação imediata e automática.', icon: <CreditCard style={{ color: primaryBg }} /> },
    'CREDIT_CARD': { title: 'Cartão de Crédito', desc: 'Pague agora no site com segurança.', icon: <CreditCard style={{ color: primaryBg }} /> },
    'LOCAL': { title: 'Pagar no Local', desc: 'Reserve e pague apenas no estabelecimento.', icon: <CreditCard style={{ color: primaryBg }} /> }
  });
  const methodUI: Record<string, any> = getMethodUI();

  useEffect(() => {
    const token = localStorage.getItem('token'); 
    if (!token) {
      navigate(`/login?redirect=/agendar/${id_servico}`);
      return;
    }

    api.get<Servico>(`/produtos/${id_servico}`).then(res => setServico(res.data));
    api.get<LojaInfo[]>('/lojas').then(res => { if (res.data.length > 0) setLojaData(res.data[0]); });

    api.get('/payment-gateways/active-methods').then(res => {
      let methodsAtivos = res.data.filter((rule: GatewayRule) => rule.is_active);
      if (!methodsAtivos.some((m: any) => m.method === 'LOCAL')) {
        methodsAtivos.push({ method: 'LOCAL', provider: 'OFFLINE', is_active: true });
      }
      setActiveMethods(methodsAtivos);
      // 🔴 REMOVIDA a linha que pré-selecionava o LOCAL automaticamente. O usuário deve escolher!
    });
  }, [id_servico, navigate]);

  useEffect(() => {
    if (!dataSelecionada || !lojaData) return;
    setLoadingHorarios(true);
    setHoraSelecionada(''); 

    let url = `/agendamentos/disponiveis?id_loja=${lojaData.id_loja}&data=${dataSelecionada}&id_servico=${id_servico}`;
    if (profissionalSelecionado) url += `&id_funcionario=${profissionalSelecionado}`;

    api.get(url)
      .then(res => {
        setHorariosLivresBackend(res.data.horarios_disponiveis);
        setProfissionais(res.data.profissionais);
        if (res.data.sinal_percent !== undefined) setSinalPercent(Number(res.data.sinal_percent));
      })
      .catch(() => setHorariosLivresBackend([]))
      .finally(() => setLoadingHorarios(false));
  }, [dataSelecionada, profissionalSelecionado, lojaData, id_servico]);

  const precoTotal = Number(servico?.preco || 0);
  const valorSinal = (precoTotal * sinalPercent) / 100;
  const valorRestante = precoTotal - valorSinal;
  
  const exigeSinalOnline = sinalPercent > 0 && sinalPercent < 100;

  // ========================================================
  // 🟢 NOVA VALIDAÇÃO INTELIGENTE DO BOTÃO DE CONFIRMAR
  // ========================================================
  let isMetodoValido = metodoPagamento !== ''; // Já bloqueia se for vazio
  
  if (exigeSinalOnline && metodoPagamento === 'LOCAL') {
      isMetodoValido = false; // Se tiver um bug no state, bloqueia o LOCAL
  }
  
  if (metodoPagamento === 'CREDIT_CARD') {
      // O cartão só é válido se todos os campos mínimos forem digitados
      const isCardValido = cardData.number.length >= 14 && 
                           cardData.cvv.length >= 3 && 
                           cardData.holderName.trim().length > 3 &&
                           cardData.expMonth.length === 2 &&
                           cardData.expYear.length === 2;
                           
      if (!isCardValido) isMetodoValido = false;
  }

  const handleNextStep = () => {
    if (!dataSelecionada || !horaSelecionada || !lojaData) {
      alert("Por favor, selecione data e horário.");
      return;
    }
    setStep(2);
  };

  const handleCardChange = (e: any) => {
    setCardData({ ...cardData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    if (!isMetodoValido) return; // Segurança extra contra cliques forçados

    setProcessando(true);
    const dataInicio = new Date(`${dataSelecionada}T${horaSelecionada}:00`);
    const duracaoMinutos = (servico as any).tempo_duracao || 60;
    const dataFim = new Date(dataInicio.getTime() + duracaoMinutos * 60 * 1000); 

    let payment_method_id = undefined;
    const cleanNumber = cardData.number.replace(/\D/g, ''); 
    if (metodoPagamento === 'CREDIT_CARD') payment_method_id = cleanNumber.startsWith('4') ? 'visa' : 'master'; 
    else if (metodoPagamento === 'PIX') payment_method_id = 'pix';

    try {
      const response = await api.post(`/agendamentos/checkout`, {
        id_loja: lojaData?.id_loja, 
        id_servico: Number(id_servico),
        id_funcionario: profissionalSelecionado ? Number(profissionalSelecionado) : null,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(), 
        metodo_pagamento: metodoPagamento, 
        dados_pagamento: {
          installments: Number(cardData.installments),
          payment_method_id, 
          card: (metodoPagamento === 'CREDIT_CARD') ? {
              holderName: cardData.holderName, number: cleanNumber, expMonth: cardData.expMonth,
              expYear: cardData.expYear.length === 2 ? `20${cardData.expYear}` : cardData.expYear, cvv: cardData.cvv
          } : undefined
        } 
      });

      setOrderResult({
          pedido: { id_pedido: response.data.id_pedido },
          paymentInfo: {
              status: response.data.pagamento?.status,
              qr_code: response.data.pagamento?.pix_data?.qr_code,
              qr_code_base64: response.data.pagamento?.pix_data?.qr_code_base64,
              date_of_expiration: response.data.pagamento?.pix_data?.expiration,
              url_boleto: response.data.pagamento?.boleto_data?.url_boleto,
              linha_digitavel: response.data.pagamento?.boleto_data?.linha_digitavel
          }
      });
      
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao processar agendamento.");
    } finally {
      setProcessando(false);
    }
  };

  if (!servico) return <div className="p-10 text-center" style={{ color: textColor }}>Carregando serviço...</div>;
  if (orderResult) return <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: bodyBg, color: textColor }}><SuccessStep orderData={orderResult} /></div>;

  return (
    <div className="min-h-screen py-8 pb-24" style={{ backgroundColor: bodyBg, color: textColor }}>
      <div className="max-w-4xl mx-auto px-4">
        
        {/* INDICADORES DE PASSO */}
        <div className="flex items-center justify-center mb-8 bg-transparent p-4 sm:p-6 rounded-[24px] border" style={{ borderColor: `${textColor}20` }}>
          <div className="flex items-center w-full max-w-md mx-auto">
            <div className="flex flex-col items-center flex-1 transition-opacity" style={{ color: step >= 1 ? primaryBg : textColor, opacity: step >= 1 ? 1 : 0.4 }}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all ${step >= 1 ? 'text-white shadow-md ring-4' : 'bg-transparent border'}`}
                style={step >= 1 ? { backgroundColor: primaryBg, '--tw-ring-color': `${primaryBg}30` } as React.CSSProperties : { borderColor: `${textColor}30` }}
              >
                {step > 1 ? <CheckCircle2 size={16} /> : '1'}
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">Horário</span>
            </div>
            
            <div className="w-16 h-1 rounded-full transition-colors bg-transparent border overflow-hidden" style={{ borderColor: `${textColor}30` }}>
                <div className="h-full transition-all duration-500" style={{ backgroundColor: primaryBg, width: step >= 2 ? '100%' : '0%' }}></div>
            </div>
            
            <div className="flex flex-col items-center flex-1 transition-opacity" style={{ color: step >= 2 ? primaryBg : textColor, opacity: step >= 2 ? 1 : 0.4 }}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all ${step >= 2 ? 'text-white shadow-md ring-4' : 'bg-transparent border'}`}
                style={step >= 2 ? { backgroundColor: primaryBg, '--tw-ring-color': `${primaryBg}30` } as React.CSSProperties : { borderColor: `${textColor}30` }}
              >
                2
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">Pagamento</span>
            </div>
          </div>
        </div>

        {/* RESUMO DO SERVIÇO */}
        <div className="bg-transparent p-6 rounded-[24px] border mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4" style={{ borderColor: `${textColor}20` }}>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: textColor }}>{servico.nome}</h2>
            <p className="text-sm line-clamp-1 mt-1" style={{ color: textColor, opacity: 0.7 }}>{servico.descricao}</p>
            {sinalPercent < 100 && (
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    <AlertCircle size={14} className="mr-1" /> Requer {sinalPercent}% de sinal para confirmar
                </div>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textColor, opacity: 0.5 }}>Valor Total</p>
            <p className="text-2xl font-black mb-1" style={{ color: textColor }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoTotal)}
            </p>
            
            {sinalPercent < 100 && (
                <div className="mt-2 text-sm text-right space-y-1">
                    <div className="flex justify-between sm:justify-end sm:gap-4 font-bold">
                        <span style={{ color: textColor, opacity: 0.7 }}>Sinal hoje:</span>
                        <span style={{ color: primaryBg }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorSinal)}</span>
                    </div>
                    <div className="flex justify-between sm:justify-end sm:gap-4">
                        <span style={{ color: textColor, opacity: 0.6 }}>Restante no local:</span>
                        <span style={{ color: textColor, opacity: 0.8 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorRestante)}</span>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* ==============================================
            PASSO 1: CALENDÁRIO E HORÁRIOS
            ============================================== */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              <div className="w-full lg:w-1/2">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: textColor }}>
                  <CalendarIcon size={20} style={{ color: primaryBg }} /> Escolha o Dia
                </h3>
                {lojaData ? (
                  <CustomCalendar 
                    dataSelecionada={dataSelecionada} 
                    setDataSelecionada={setDataSelecionada} 
                    diasFuncionamentoStr={lojaData.dias_funcionamento} 
                    primaryBg={primaryBg}
                    textColor={textColor}
                  />
                ) : (
                  <div className="bg-transparent p-6 rounded-[24px] border animate-pulse h-64 flex items-center justify-center font-medium" style={{ borderColor: `${textColor}20`, color: textColor, opacity: 0.6 }}>
                     Carregando calendário...
                  </div>
                )}
              </div>

              <div className="w-full lg:w-1/2 flex flex-col">
                <div className="bg-transparent p-6 rounded-[24px] border flex-1" style={{ borderColor: `${textColor}20` }}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: textColor }}>
                    <UserCircle size={20} style={{ color: primaryBg }} /> Profissional (Opcional)
                  </h3>
                  <select
                    value={profissionalSelecionado}
                    onChange={(e) => setProfissionalSelecionado(e.target.value)}
                    disabled={profissionais.length === 0}
                    className="w-full p-4 mb-6 border bg-transparent rounded-[16px] outline-none transition-all disabled:opacity-50 font-medium cursor-pointer"
                    style={{ color: textColor, borderColor: `${textColor}20`, '--tw-ring-color': `${primaryBg}40` } as React.CSSProperties}
                    onFocus={(e) => { e.target.style.boxShadow = `0 0 0 4px ${primaryBg}30`; e.target.style.borderColor = primaryBg; }} 
                    onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = `${textColor}20`; }}
                  >
                    <option value="" style={{ backgroundColor: bodyBg, color: textColor }}>Qualquer profissional disponível</option>
                    {profissionais.map(prof => (
                      <option key={prof.id_funcionario} value={prof.id_funcionario} style={{ backgroundColor: bodyBg, color: textColor }}>
                        {prof.nome_completo}
                      </option>
                    ))}
                  </select>

                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                    <Clock size={20} style={{ color: primaryBg }} /> Horários
                  </h3>
                  
                  {!dataSelecionada ? (
                    <div className="text-center p-8 bg-transparent rounded-2xl border border-dashed" style={{ borderColor: `${textColor}30` }}>
                      <p className="font-medium" style={{ color: textColor, opacity: 0.6 }}>Selecione um dia no calendário ao lado para ver os horários.</p>
                    </div>
                  ) : loadingHorarios ? (
                    <div className="flex justify-center p-8">
                      <span className="animate-spin h-8 w-8 border-b-2 rounded-full" style={{ borderColor: primaryBg }}></span>
                    </div>
                  ) : horariosLivresBackend.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {horariosLivresBackend.map(hora => {
                        const isSelectedHora = horaSelecionada === hora;
                        
                        let baseClasses = "py-3 rounded-[14px] font-extrabold text-sm sm:text-base transition-all cursor-pointer border hover:text-white ";
                        let inlineStyle: any = { color: textColor, borderColor: `${textColor}20`, backgroundColor: 'transparent' };

                        if (isSelectedHora) {
                           baseClasses = "py-3 rounded-[14px] font-extrabold text-sm sm:text-base transition-all text-white shadow-md scale-105 border-transparent ";
                           inlineStyle = { backgroundColor: primaryBg, boxShadow: `0 4px 14px 0 ${primaryBg}50` };
                        }

                        return (
                          <button
                            key={hora}
                            onClick={() => setHoraSelecionada(hora)}
                            className={baseClasses}
                            style={inlineStyle}
                            onMouseEnter={(e) => {
                                if (!isSelectedHora) {
                                    e.currentTarget.style.backgroundColor = primaryBg;
                                    e.currentTarget.style.color = '#FFFFFF';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelectedHora) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = textColor;
                                }
                            }}
                          >
                            {hora}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-transparent rounded-2xl border" style={{ color: '#EF4444', borderColor: '#EF444450' }}>
                      <p className="font-medium">Nenhum horário disponível para esta data.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <button
              onClick={handleNextStep}
              disabled={!dataSelecionada || !horaSelecionada}
              className="w-full disabled:bg-transparent disabled:border text-white py-5 rounded-[20px] font-black text-xl transition-all shadow-lg active:scale-[0.98]"
              style={{ 
                  backgroundColor: (!dataSelecionada || !horaSelecionada) ? undefined : primaryBg,
                  borderColor: (!dataSelecionada || !horaSelecionada) ? `${textColor}20` : 'transparent',
                  color: (!dataSelecionada || !horaSelecionada) ? textColor : '#FFFFFF',
                  opacity: (!dataSelecionada || !horaSelecionada) ? 0.5 : 1,
                  boxShadow: (!dataSelecionada || !horaSelecionada) ? 'none' : `0 10px 25px -5px ${primaryBg}60`
              }}
            >
              Continuar para Pagamento
            </button>
          </div>
        )}

        {/* ==============================================
            PASSO 2: PAGAMENTO
            ============================================== */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-transparent p-6 sm:p-8 rounded-[24px] border mb-6" style={{ borderColor: `${textColor}20` }}>
              <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2" style={{ color: textColor }}>
                <CreditCard size={24} style={{ color: primaryBg }}/> Forma de Pagamento
              </h3>
              
              {activeMethods.length === 0 ? (
                  <p className="p-4 bg-transparent border rounded-xl" style={{ color: '#EF4444', borderColor: '#EF444450' }}>Nenhum método configurado.</p>
              ) : (
                  <div className="space-y-4">
                      {activeMethods.map((rule) => {
                          if (rule.method === 'BOLETO') return null;
                          if (exigeSinalOnline && rule.method === 'LOCAL') return null;

                          const ui = methodUI[rule.method] || { title: rule.method, desc: '', icon: <CreditCard /> };
                          const isSelected = metodoPagamento === rule.method;

                          return (
                              <div key={rule.method} className={`border rounded-[16px] transition-all bg-transparent ${isSelected ? 'shadow-md' : ''}`} style={{ borderColor: isSelected ? primaryBg : `${textColor}20` }}>
                                  <label className="flex items-center justify-between p-4 sm:p-5 cursor-pointer">
                                      <div className="flex items-center gap-4">
                                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors" style={{ borderColor: isSelected ? primaryBg : `${textColor}40` }}>
                                              {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryBg }}></div>}
                                          </div>
                                          <input type="radio" name="paymentMethod" value={rule.method} checked={isSelected} onChange={() => setMetodoPagamento(rule.method)} className="hidden" />
                                          <div>
                                              <span className="block font-bold" style={{ color: textColor }}>{ui.title}</span>
                                              <span className="block text-sm" style={{ color: textColor, opacity: 0.7 }}>{ui.desc}</span>
                                          </div>
                                      </div>
                                      <div>{ui.icon}</div>
                                  </label>

                                  {isSelected && (rule.method === 'CREDIT_CARD') && (
                                      <div className="px-4 pb-5">
                                        <TransparentCardForm cardData={cardData} onChange={handleCardChange} showInstallments={true} valorTotal={valorSinal} primaryBg={primaryBg} textColor={textColor} bodyBg={bodyBg} />
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4">
              <button onClick={() => setStep(1)} disabled={processando} className="w-full sm:w-auto px-6 py-4 flex items-center justify-center gap-2 font-bold bg-transparent border rounded-[20px] transition-colors hover:opacity-80" style={{ color: textColor, borderColor: `${textColor}20` }}>
                <ArrowLeft size={20} /> Voltar
              </button>
              
              <button 
                onClick={handleCheckout} 
                disabled={processando || !isMetodoValido} 
                className="w-full flex-1 disabled:bg-transparent disabled:border text-white py-5 rounded-[20px] font-black text-xl transition-all shadow-lg flex justify-center items-center gap-2 active:scale-[0.98]"
                style={{ 
                  backgroundColor: (processando || !isMetodoValido) ? undefined : '#16a34a', 
                  borderColor: (processando || !isMetodoValido) ? `${textColor}20` : 'transparent',
                  color: (processando || !isMetodoValido) ? textColor : '#FFFFFF',
                  opacity: (processando || !isMetodoValido) ? 0.5 : 1,
                  boxShadow: (processando || !isMetodoValido) ? 'none' : `0 10px 25px -5px rgba(22, 163, 74, 0.4)`
                }}
              >
                {processando ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Finalizando...</> : <>Confirmar Agendamento e Pagar</>}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};