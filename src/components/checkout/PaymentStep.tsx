import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

interface GatewayRule {
    method: string;
    provider: string;
    is_active: boolean;
}

// ============================================================================
// 1. COMPONENTE ORIGINAL: PARA ASAAS, STRIPE, CIELO (Envia os dados puros)
// ============================================================================
const TransparentCardForm = ({ cardData, onChange, showInstallments, valorTotal }: any) => {
    const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        onChange({ target: { name: 'number', value } });
    };

    const handleOnlyNumbers = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        onChange({ target: { name: e.target.name, value } });
    };

    return (
        <div className="p-5 mt-2 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="space-y-5">
                <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Nome impresso no cartão</label>
                    <input type="text" name="holderName" value={cardData.holderName} onChange={onChange} placeholder="EX: JOAO S SILVA" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-semibold text-slate-800 transition-all outline-none uppercase placeholder:text-slate-400 placeholder:normal-case" />
                </div>
                <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Número do Cartão</label>
                    <input type="text" name="number" value={cardData.number} onChange={handleCardNumber} placeholder="0000 0000 0000 0000" maxLength={19} className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-semibold text-slate-800 transition-all outline-none tracking-wide" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Mês</label>
                        <input type="text" name="expMonth" value={cardData.expMonth} onChange={handleOnlyNumbers} placeholder="MM" maxLength={2} className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-center" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Ano</label>
                        <input type="text" name="expYear" value={cardData.expYear} onChange={handleOnlyNumbers} placeholder="AA" maxLength={2} className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-center" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">CVV</label>
                        <input type="password" name="cvv" value={cardData.cvv} onChange={handleOnlyNumbers} placeholder="•••" maxLength={4} className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-center tracking-widest" />
                    </div>
                </div>

                {showInstallments && (
                    <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Parcelamento</label>
                        <select name="installments" value={cardData.installments} onChange={onChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((parcela) => (
                                <option key={parcela} value={parcela}>{parcela}x de {(valorTotal / parcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// 2. COMPONENTE NOVO: EXCLUSIVO PARA O MERCADO PAGO (Com PCI Compliance)
// ============================================================================
const MercadoPagoSecureForm = ({ publicKey, valorTotal, isDebit, onFinish, setIsProcessing }: any) => {
    useEffect(() => {
        if (publicKey) {
            initMercadoPago(publicKey, { locale: 'pt-BR' });
        }
    }, [publicKey]);

    return (
        <div className="p-4 bg-white border-t border-gray-200">
            <CardPayment
                initialization={{ amount: valorTotal }}
                customization={{
                    paymentMethods: {
                        minInstallments: 1,
                        maxInstallments: isDebit ? 1 : 12,
                    }
                }}
                onSubmit={async (param) => {
                    setIsProcessing(true);
                    const paymentPayload = {
                        paymentMethod: isDebit ? 'DEBIT_CARD' : 'CREDIT_CARD',
                        paymentData: {
                            installments: param.installments,
                            payment_method_id: param.payment_method_id,
                            issuer_id: param.issuer_id,
                            token: param.token
                        }
                    };
                    try {
                        await onFinish(paymentPayload);
                    } finally {
                        setIsProcessing(false);
                    }
                }}
            />
        </div>
    );
};

// ============================================================================
// 3. ORQUESTRADOR PRINCIPAL
// ============================================================================
export const PaymentStep = ({ onPrev, onFinish, valorTotal, metodoPagamento, setMetodoPagamento, isAgendamento }: any) => {
    const [activeMethods, setActiveMethods] = useState<GatewayRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [publicKeyMp, setPublicKeyMp] = useState('');

    const [cardData, setCardData] = useState({
        holderName: '', number: '', expMonth: '', expYear: '', cvv: '', installments: 1
    });

    useEffect(() => {
        const fetchGatewaysAndKeys = async () => {
            try {
                const tenantId = localStorage.getItem('tenantId') || '1';
                const tenantSlug = localStorage.getItem('tenantSlug') || '';
                const config = { headers: { 'x-tenant-id': tenantId, 'x-tenant-slug': tenantSlug } };

                const res = await api.get('/payment-gateways/active-methods', config);
                let methodsAtivos = res.data.filter((rule: GatewayRule) => rule.is_active);

                if (isAgendamento) {
                    const hasLocal = methodsAtivos.some((m: any) => m.method === 'LOCAL');
                    if (!hasLocal) {
                        methodsAtivos.push({ method: 'LOCAL', provider: 'OFFLINE', is_active: true });
                    }
                }

                setActiveMethods(methodsAtivos);

                if (methodsAtivos.length > 0 && !metodoPagamento) {
                    setMetodoPagamento(isAgendamento ? 'LOCAL' : methodsAtivos[0].method);
                }

                // Busca as Chaves Públicas para inicializar os SDKs
                try {
                    const resKeys = await api.get('/payment-gateways/public-keys', config);
                    if (resKeys.data.mercadopago) setPublicKeyMp(resKeys.data.mercadopago);
                } catch (keyErr) {
                    console.error("Falha ao buscar chaves públicas.", keyErr);
                }
            } catch (error) {
                console.error("Erro ao carregar métodos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGatewaysAndKeys();
    }, [isAgendamento]);

    const handleCardChange = (e: any) => setCardData({ ...cardData, [e.target.name]: e.target.value });

    // 🟢 Função disparada apenas para PIX, BOLETO, OFFLINE e Cartões NÃO-MercadoPago
    const handleFinalizar = async () => {
        setIsProcessing(true);
        const selectedRule = activeMethods.find(m => m.method === metodoPagamento);

        // Se for cartão, mas NÃO for Mercado Pago (Ex: Stripe, Asaas, Cielo)
        if ((metodoPagamento === 'CREDIT_CARD' || metodoPagamento === 'DEBIT_CARD') && selectedRule?.provider !== 'MERCADOPAGO') {
            const cleanNumber = cardData.number.replace(/\D/g, '');
            
            // Regex básica para fallback de bandeira nos outros gateways
            let payment_method_id = 'master';
            if (cleanNumber.startsWith('4')) payment_method_id = 'visa';
            else if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) payment_method_id = 'master';
            else if (/^3[47]/.test(cleanNumber)) payment_method_id = 'amex';
            else if (/^(50|5[6-9]|6)/.test(cleanNumber)) payment_method_id = 'elo';

            const paymentPayload = {
                paymentMethod: metodoPagamento,
                paymentData: {
                    installments: Number(cardData.installments),
                    payment_method_id: payment_method_id,
                    card: {
                        holderName: cardData.holderName,
                        number: cleanNumber,
                        expMonth: cardData.expMonth,
                        expYear: cardData.expYear.length === 2 ? `20${cardData.expYear}` : cardData.expYear,
                        cvv: cardData.cvv
                    }
                }
            };

            try {
                await onFinish(paymentPayload);
            } catch (error) { console.error(error); } finally { setIsProcessing(false); }
            return;
        }

        // Para PIX, Boleto e Formas Offline
        const paymentPayload = { paymentMethod: metodoPagamento, paymentData: {} };
        try {
            await onFinish(paymentPayload);
        } catch (error) { console.error(error); } finally { setIsProcessing(false); }
    };

    const methodUI: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
        'PIX': { title: 'PIX (Online)', desc: 'Aprovação imediata e automática.', icon: <span className="w-6 h-6">🟢</span> },
        'CREDIT_CARD': { title: 'Cartão de Crédito', desc: 'Pague agora no site com segurança.', icon: <span className="w-6 h-6">💳</span> },
        'DEBIT_CARD': { title: 'Cartão de Débito', desc: 'Pagamento à vista seguro no site.', icon: <span className="w-6 h-6">🏧</span> },
        'LOCAL': { title: 'Pagar no Local', desc: 'Pague em dinheiro, PIX ou cartão na hora.', icon: <span className="w-6 h-6">🏬</span> },
        'BOLETO': { title: 'Boleto Bancário', desc: 'Aprovação em até 3 dias úteis.', icon: <span className="w-6 h-6">📄</span> },
        'OFFLINE_CASH': { title: 'Dinheiro na Entrega', desc: 'Pague em espécie ao receber.', icon: <span className="w-6 h-6">💵</span> },
        'OFFLINE_PIX': { title: 'PIX na Entrega', desc: 'Pague via QR Code com o entregador.', icon: <span className="w-6 h-6">📱</span> },
        'OFFLINE_CREDIT': { title: 'Crédito na Entrega', desc: 'Maquininha na entrega.', icon: <span className="w-6 h-6">💳</span> },
        'OFFLINE_DEBIT': { title: 'Débito na Entrega', desc: 'Maquininha na entrega.', icon: <span className="w-6 h-6">🏧</span> }
    };

    if (isLoading) return <div className="text-center py-10 text-gray-500 animate-pulse">Carregando...</div>;

    const selectedRule = activeMethods.find(m => m.method === metodoPagamento);
    const isCartaoMP = (metodoPagamento === 'CREDIT_CARD' || metodoPagamento === 'DEBIT_CARD') && selectedRule?.provider === 'MERCADOPAGO';

    return (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Forma de Pagamento</h2>

            {activeMethods.length === 0 ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
                    Nenhuma forma configurada.
                </div>
            ) : (
                <div className="space-y-4 mb-8">
                    {activeMethods.map((rule) => {
                        const ui = methodUI[rule.method] || { title: rule.method, desc: '', icon: null };
                        const isSelected = metodoPagamento === rule.method;

                        return (
                            <div key={rule.method} className={`border-2 rounded-xl transition-all ${isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200'}`}>
                                <label className="flex items-center justify-between p-4 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="paymentMethod" value={rule.method} checked={isSelected} onChange={() => setMetodoPagamento(rule.method)} className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                                        <div>
                                            <span className="block font-bold text-gray-900">{ui.title}</span>
                                            <span className="block text-sm text-gray-500">{ui.desc}</span>
                                        </div>
                                    </div>
                                    <div>{ui.icon}</div>
                                </label>

                                {/* 🟢 RENDERIZAÇÃO CONDICIONAL DO FORMULÁRIO */}
                                {isSelected && (rule.method === 'CREDIT_CARD' || rule.method === 'DEBIT_CARD') && (
                                    rule.provider === 'MERCADOPAGO' && publicKeyMp ? (
                                        <MercadoPagoSecureForm
                                            publicKey={publicKeyMp}
                                            valorTotal={valorTotal}
                                            isDebit={rule.method === 'DEBIT_CARD'}
                                            onFinish={onFinish}
                                            setIsProcessing={setIsProcessing}
                                        />
                                    ) : (
                                        <TransparentCardForm
                                            cardData={cardData}
                                            onChange={handleCardChange}
                                            showInstallments={rule.method === 'CREDIT_CARD'}
                                            valorTotal={valorTotal}
                                        />
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-100">
                <button onClick={onPrev} disabled={isProcessing} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors w-full sm:w-auto">
                    {isAgendamento ? 'Voltar para o Carrinho' : 'Voltar para Entrega'}
                </button>
                
                {/* 🟢 OCULTA O BOTÃO VERDE SE FOR CARTÃO DO MERCADO PAGO */}
                {!isCartaoMP && (
                    <Button
                        variant="success"
                        onClick={handleFinalizar}
                        disabled={activeMethods.length === 0 || isProcessing}
                        className="w-full sm:w-auto px-8 h-14 text-lg sm:text-xl font-black rounded-xl"
                    >
                        {isProcessing ? 'Processando...' : `Finalizar Compra`}
                    </Button>
                )}
            </div>
        </div>
    );
};