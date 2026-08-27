import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';
import { useStoreConfig } from '../../contexts/StoreConfigContext';

export const SuccessStep = ({ orderData }: any) => {
    const [copied, setCopied] = useState(false);
    
    // Extraindo as cores dinâmicas da loja
    const { appearance } = useStoreConfig();
    const bodyBg = appearance?.BODY_BG_COLOR || '#ffffff';
    const textColor = appearance?.SITE_TEXT_COLOR || '#111827';
    const primaryBg = appearance?.BTN_PRIMARY_BG || '#22c55e'; 

    // O backend devolveu isso pra gente:
    const { pedido, paymentInfo } = orderData;
    const isPix = paymentInfo?.qr_code || paymentInfo?.qr_code_base64;
    const isBoleto = paymentInfo?.url_boleto || paymentInfo?.linha_digitavel;
    const isAprovado = paymentInfo?.status === 'PAGO' || paymentInfo?.status === 'approved';

    // Trava o scroll do body enquanto a tela de sucesso estiver aberta
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleCopyPix = () => {
        if (paymentInfo?.qr_code) {
            navigator.clipboard.writeText(paymentInfo.qr_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        // 🟢 MUDANÇA AQUI: Wrapper absoluto que toma 100% da tela (fixed inset-0)
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500 overflow-y-auto"
            style={{ backgroundColor: bodyBg }}
        >
            <div 
                className="w-full max-w-2xl p-8 sm:p-12 rounded-[32px] shadow-2xl border text-center animate-in zoom-in-95 duration-500 my-auto"
                style={{ backgroundColor: bodyBg, borderColor: `${textColor}15` }}
            >
                {/* ÍCONE DE SUCESSO (Usa a cor primária com opacidade de fundo) */}
                <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm transform hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${primaryBg}15`, color: primaryBg }}
                >
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight" style={{ color: textColor }}>Pedido Realizado!</h2>
                <p className="mb-10 text-lg" style={{ color: textColor, opacity: 0.7 }}>
                    Seu pedido <strong style={{ color: textColor, opacity: 1 }}>#{pedido?.id_pedido || pedido?.id}</strong> foi gerado com sucesso.
                </p>

                {/* 🟢 SE FOR PIX */}
                {isPix && !isAprovado && (
                    <div 
                        className="p-6 sm:p-8 rounded-3xl border mb-10 text-left w-full shadow-inner"
                        style={{ backgroundColor: `${textColor}03`, borderColor: `${textColor}15` }}
                    >
                        <h3 className="font-bold mb-6 flex items-center gap-3 text-lg" style={{ color: textColor }}>
                            <svg className="w-7 h-7" style={{ color: primaryBg }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6L2.6 12 12 21.4 21.4 12 12 2.6zm0 14.5l-5.1-5.1 5.1-5.1 5.1 5.1-5.1 5.1z" /></svg>
                            Pague com PIX
                        </h3>

                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            {paymentInfo.qr_code_base64 && (
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
                                    <img src={`data:image/jpeg;base64,${paymentInfo.qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                                </div>
                            )}

                            <div className="flex-1 w-full">
                                <p className="text-sm font-medium mb-3" style={{ color: textColor, opacity: 0.8 }}>Escaneie o QR Code ou copie o código Copia e Cola abaixo:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={paymentInfo.qr_code}
                                        className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none bg-transparent font-mono transition-colors"
                                        style={{ color: textColor, borderColor: `${textColor}20` }}
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <Button variant="secondary" onClick={handleCopyPix} className="flex-shrink-0 h-[46px] px-6 rounded-xl">
                                        {copied ? 'Copiado!' : 'Copiar'}
                                    </Button>
                                </div>
                                {paymentInfo.date_of_expiration && (
                                    <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Válido até: {new Date(paymentInfo.date_of_expiration).toLocaleString('pt-BR')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 🟢 SE FOR BOLETO */}
                {isBoleto && !isAprovado && (
                    <div 
                        className="p-6 sm:p-8 rounded-3xl border mb-10 text-left shadow-inner"
                        style={{ backgroundColor: `${textColor}03`, borderColor: `${textColor}15` }}
                    >
                        <h3 className="font-bold mb-3 flex items-center gap-3 text-lg" style={{ color: textColor }}>
                            <svg className="w-7 h-7" style={{ color: primaryBg }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4zM8 4v16m4-16v16m4-16v16" /></svg>
                            Boleto Bancário Gerado
                        </h3>
                        <p className="text-sm font-medium mb-6" style={{ color: textColor, opacity: 0.7 }}>Seu boleto foi gerado com sucesso. O pagamento pode demorar até 3 dias úteis para ser compensado.</p>

                        {paymentInfo.linha_digitavel && (
                            <div className="mb-6">
                                <label className="text-xs font-bold block mb-2 uppercase tracking-wider" style={{ color: textColor, opacity: 0.6 }}>Linha Digitável</label>
                                <div 
                                    className="border rounded-2xl px-5 py-4 text-sm font-mono break-all select-all shadow-sm"
                                    style={{ color: textColor, borderColor: `${textColor}20`, backgroundColor: `${textColor}05` }}
                                >
                                    {paymentInfo.linha_digitavel}
                                </div>
                            </div>
                        )}

                        {paymentInfo.url_boleto && (
                            <a href={paymentInfo.url_boleto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold hover:opacity-80 transition-opacity" style={{ color: primaryBg }}>
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryBg}15` }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </div>
                                Imprimir ou Visualizar Boleto
                            </a>
                        )}
                    </div>
                )}

                {/* 🟢 SE FOR CARTÃO APROVADO OU DINHEIRO (PAGO) */}
                {isAprovado && (
                    <div 
                        className="p-8 rounded-3xl border mb-10 shadow-sm"
                        style={{ backgroundColor: `${primaryBg}08`, borderColor: `${primaryBg}20` }}
                    >
                        <h3 className="font-black text-2xl mb-2" style={{ color: primaryBg }}>Reserva Confirmada!</h3>
                        <p className="text-base font-medium" style={{ color: textColor, opacity: 0.8 }}>O seu pedido foi registrado e sua vaga garantida em nosso sistema.</p>
                    </div>
                )}

                {/* 🟢 BOTÕES FINAIS */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8" style={{ borderTop: `1px dashed ${textColor}20` }}>
                    <Link to="/" className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full px-8 rounded-xl h-14 font-bold text-base transition-transform hover:scale-105">
                            Continuar Comprando
                        </Button>
                    </Link>
                    <Link to="/pedidos" className="w-full sm:w-auto">
                        <Button className="w-full px-8 rounded-xl h-14 font-bold text-base transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: primaryBg, color: '#fff', border: 'none', boxShadow: `0 10px 15px -3px ${primaryBg}40` }}>
                            Acompanhar Pedido
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};