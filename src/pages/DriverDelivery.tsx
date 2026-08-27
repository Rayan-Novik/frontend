import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export const DriverDelivery = () => {
  const { token } = useParams<{ token: string }>();
  const [dados, setDados] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [paymentCollected, setPaymentCollected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSuccesso] = useState(false);

  useEffect(() => {
    const fetchDeliveryData = async () => {
      try {
        const res = await api.get(`/pedidos/driver-link/${token}`);
        setDados(res.data);
      } catch (error: any) {
        setErro(error.response?.data?.message || 'Link inválido ou expirado.');
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchDeliveryData();
  }, [token]);

  // 🟢 RADAR DO GPS: Envia a localização para o backend!
  useEffect(() => {
    let watchId: number;
    if (dados && dados.status_entrega === 'Em Rota de Entrega') {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            api.put(`/pedidos/driver-location/${token}`, { lat: latitude, lng: longitude }).catch(() => {});
          },
          (err) => console.error('Erro de GPS:', err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [dados, token]);

  const isOfflinePayment = dados?.metodo_pagamento?.toUpperCase().includes('OFFLINE');

  const handleConfirm = async () => {
    if (pin.length < 4) {
      setErro('O PIN deve ter 4 dígitos.');
      return;
    }
    if (isOfflinePayment && !paymentCollected) {
      setErro('Você precisa confirmar que recebeu o pagamento do cliente.');
      return;
    }

    setIsSubmitting(true);
    setErro('');

    try {
      await api.post('/pedidos/driver-confirm', {
        driverToken: token,
        pin: pin,
        paymentCollected: isOfflinePayment ? paymentCollected : true
      });
      setSuccesso(true);
    } catch (error: any) {
      setErro(error.response?.data?.message || 'Erro ao confirmar entrega.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  }

  if (erro && !dados) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
        <p className="text-gray-600">{erro}</p>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-white text-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-4xl font-black mb-2">Entrega Confirmada!</h2>
        <p className="text-green-100 text-lg">Bom trabalho. O pedido foi finalizado com sucesso.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-gray-900 text-white p-6 rounded-b-[2.5rem] shadow-md relative z-10">
        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Missão de Entrega</span>
        <h1 className="text-3xl font-black mt-3">Pedido #{dados.id_pedido}</h1>
        <p className="text-gray-300 mt-1 text-sm">Status: <strong className="text-white">{dados.status_entrega}</strong></p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-20">
        
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Cliente & Endereço</h3>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
              {dados.cliente.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{dados.cliente}</p>
              {dados.telefone && (
                <a href={`https://wa.me/55${dados.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 font-semibold text-sm flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.655-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chamar no WhatsApp
                </a>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
            <svg className="w-6 h-6 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <p className="text-gray-700 font-medium">{dados.endereco}</p>
          </div>

          {/* Lembrete GPS */}
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
             <span className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></span>
             Mantenha a tela aberta e o GPS ligado para o cliente ver você no mapa.
          </div>
        </div>

        {isOfflinePayment ? (
          <div className="bg-red-500 text-white p-6 rounded-3xl shadow-lg mb-4 animate-pulse">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <h3 className="text-xl font-black uppercase">Cobrar o Cliente!</h3>
            </div>
            <p className="text-red-100 font-medium mb-1">O pedido não foi pago pelo site.</p>
            <div className="bg-white text-red-600 rounded-2xl p-4 text-center mt-3">
              <span className="block text-sm font-bold uppercase mb-1">Valor a Receber</span>
              <span className="text-4xl font-black">{formatarPreco(dados.preco_total)}</span>
            </div>
            <div className="mt-4 flex items-center gap-3 bg-red-600/50 p-3 rounded-xl cursor-pointer" onClick={() => setPaymentCollected(!paymentCollected)}>
              <input type="checkbox" checked={paymentCollected} readOnly className="w-6 h-6 rounded text-red-600" />
              <span className="font-bold text-sm">Confirmo que recebi este valor</span>
            </div>
          </div>
        ) : (
          <div className="bg-green-100 text-green-800 p-5 rounded-3xl shadow-sm mb-4 border border-green-200 flex items-center gap-4">
            <div className="bg-green-500 text-white rounded-full p-2">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="font-black text-lg uppercase">Pedido já Pago!</p>
              <p className="text-sm">Basta entregar o pacote ao cliente.</p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mt-4">
          <h3 className="text-center font-bold text-gray-900 mb-4 text-lg">Informe o PIN do Cliente</h3>
          <p className="text-center text-sm text-gray-500 mb-6">Peça os 4 números de segurança para o cliente para finalizar a entrega.</p>
          
          <input
            type="number"
            placeholder="0000"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0,4))}
            className="w-full text-center text-4xl font-black tracking-widest bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 focus:border-blue-500 focus:ring-0 outline-none mb-4"
          />

          {erro && <p className="text-red-500 font-bold text-center mb-4">{erro}</p>}

          <button
            onClick={handleConfirm}
            disabled={isSubmitting || pin.length < 4 || (isOfflinePayment && !paymentCollected)}
            className="w-full bg-blue-600 text-white font-black text-xl py-5 rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {isSubmitting ? 'Confirmando...' : 'Finalizar Entrega'}
          </button>
        </div>

      </div>
    </div>
  );
};