import { useState, useEffect } from 'react';
import api from '../../services/api';
import axios from 'axios';
import { Button } from '../ui/Button';

// 🟢 Adicionado 'logradouro' na interface para o TypeScript não reclamar ao ler do banco
interface Endereco {
    id_endereco: number;
    rua?: string;
    logradouro?: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

interface FreteOption {
    tipo: string;
    custo: number;
    prazo: string;
}

interface Loja {
    id_loja: number;
    nome: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    latitude: number | null;
    longitude: number | null;
}

type TipoEntrega = 'ENTREGA' | 'RETIRADA' | 'LOCAL';

const calcularDistanciaKM = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};

export const AddressStep = ({ onNext, onPrev, onSetFrete }: any) => {
    const [opcoesEntrega, setOpcoesEntrega] = useState({ retirada: false, local: false });
    const mostrarOpcoes = opcoesEntrega.retirada || opcoesEntrega.local;

    const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('ENTREGA');
    const [infoMesa, setInfoMesa] = useState(''); 

    const [lojas, setLojas] = useState<Loja[]>([]);
    const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [enderecos, setEnderecos] = useState<Endereco[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [selectedEnderecoId, setSelectedEnderecoId] = useState<number | null>(null);

    const [salvarEndereco, setSalvarEndereco] = useState(true);

    const [fretes, setFretes] = useState<FreteOption[]>([]);
    const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null);
    const [loadingFrete, setLoadingFrete] = useState(false);
    const [erroFrete, setErroFrete] = useState('');

    const [formData, setFormData] = useState({
        cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP'
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const tenantId = localStorage.getItem('tenantId') || '1';
                try {
                    const configRes = await api.get(`/configuracoes/public/${tenantId}`);
                    if (configRes.data) {
                        setOpcoesEntrega({
                            retirada: configRes.data.RETIRADA_ATIVA === true || configRes.data.RETIRADA_ATIVA === 'true',
                            local: configRes.data.CONSUMO_LOCAL_ATIVO === true || configRes.data.CONSUMO_LOCAL_ATIVO === 'true'
                        });
                    }
                } catch (configErr) {
                    console.error("Erro ao buscar configurações de entrega:", configErr);
                }

                try {
                    const lojasRes = await api.get('/lojas');
                    setLojas(lojasRes.data);
                    if (lojasRes.data.length > 0) {
                        setSelectedLojaId(lojasRes.data[0].id_loja);
                    }
                } catch (e) {
                    console.error("Erro ao buscar lojas:", e);
                }

                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                        (error) => console.log("Geolocalização indisponível:", error.message)
                    );
                }
                
                const res = await api.get('/enderecos');
                setEnderecos(res.data);
                if (res.data.length > 0) {
                    selecionarEnderecoExistente(res.data[0]);
                } else {
                    setIsAddingNew(true);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                setIsAddingNew(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMudarTipoEntrega = (tipo: TipoEntrega) => {
        setTipoEntrega(tipo);
        if (tipo !== 'ENTREGA') {
            if (typeof onSetFrete === 'function') onSetFrete(0);
        } else {
            if (selectedFrete) {
                if (typeof onSetFrete === 'function') onSetFrete(selectedFrete.custo);
            } else if (selectedEnderecoId) {
                const end = enderecos.find(e => e.id_endereco === selectedEnderecoId);
                if (end) calcularFrete(end.cep);
            }
        }
    };

    const calcularFrete = async (cepDestino: string) => {
        setLoadingFrete(true);
        setFretes([]);
        setSelectedFrete(null);
        setErroFrete('');

        if (typeof onSetFrete === 'function') onSetFrete(0);

        try {
            const res = await api.post('/frete/calcular', { cepDestino });
            setFretes(res.data);

            if (res.data.length > 0) {
                const maisBarato = res.data.reduce((prev: any, curr: any) => prev.custo < curr.custo ? prev : curr);
                setSelectedFrete(maisBarato);
                if (typeof onSetFrete === 'function') onSetFrete(maisBarato.custo);
            }
        } catch (error: any) {
            console.error("Erro ao calcular frete", error);
            setErroFrete(error.response?.data?.message || 'Erro ao calcular frete. Verifique o CEP ou se você está logado.');
        } finally {
            setLoadingFrete(false);
        }
    };

    const selecionarEnderecoExistente = (endereco: Endereco) => {
        setSelectedEnderecoId(endereco.id_endereco);
        setIsAddingNew(false);
        calcularFrete(endereco.cep);
    };

    const handleCepBlur = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length === 8) {
            try {
                const res = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                if (!res.data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        rua: res.data.logradouro,
                        bairro: res.data.bairro,
                        cidade: res.data.localidade,
                        estado: res.data.uf
                    }));
                    calcularFrete(cepLimpo);
                }
            } catch (error) {
                console.error("Erro no ViaCEP", error);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContinuar = async () => {
        if (tipoEntrega === 'RETIRADA' || tipoEntrega === 'LOCAL') {
            if (!selectedLojaId && lojas.length > 0) {
                alert("Por favor, selecione um estabelecimento para prosseguir.");
                return;
            }

            if (tipoEntrega === 'LOCAL') {
                if (!infoMesa.trim()) {
                    alert("Por favor, informe o número da mesa ou um nome para identificarmos você.");
                    return;
                }
                onNext(null, { tipo_entrega: 'LOCAL', info_local: infoMesa, id_loja: selectedLojaId, frete_custo: 0 });
                return;
            }

            if (tipoEntrega === 'RETIRADA') {
                onNext(null, { tipo_entrega: 'RETIRADA', id_loja: selectedLojaId, frete_custo: 0 });
                return;
            }
        }

        let idParaPassarFrente = selectedEnderecoId;
        let dadosCompletos = null;

        if (isAddingNew) {
            if (!formData.rua || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado || !formData.cep) {
                alert("Atenção: CEP, Rua, Número, Bairro, Cidade e Estado são obrigatórios.");
                return;
            }

            // 🟢 MÁGICA AQUI: Clonamos a "rua" para "logradouro", resolvendo a exigência do backend!
            const payloadSeguro = {
                ...formData,
                logradouro: formData.rua,
                rua: formData.rua
            };

            if (salvarEndereco) {
                try {
                    const res = await api.post('/enderecos', payloadSeguro);
                    if (res.data && (res.data.id_endereco || res.data.id)) {
                        idParaPassarFrente = res.data.id_endereco || res.data.id;
                    } else {
                        const getRes = await api.get('/enderecos');
                        if (getRes.data.length > 0) {
                            idParaPassarFrente = getRes.data[getRes.data.length - 1].id_endereco;
                        }
                    }
                } catch (error) {
                    console.error("Erro API Endereços:", error);
                    alert("Erro ao salvar endereço na sua conta. Verifique se todos os campos estão corretos.");
                    return;
                }
            } else {
                idParaPassarFrente = null; 
            }
            dadosCompletos = { ...payloadSeguro, tipo_entrega: 'ENTREGA' };
        } else {
            const endExistente = enderecos.find(e => e.id_endereco === selectedEnderecoId);
            if (endExistente) dadosCompletos = { ...endExistente, tipo_entrega: 'ENTREGA' };
        }

        if (!selectedFrete && fretes.length > 0) {
            alert("Por favor, selecione um método de entrega.");
            return;
        }

        onNext(idParaPassarFrente, dadosCompletos);
    };

    if (isLoading) {
        return <div className="text-center py-10 text-gray-500 animate-pulse">Carregando informações...</div>;
    }

    const formatarPreco = (valor: number) => {
        return valor === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    const renderListaLojas = () => {
        if (lojas.length === 0) {
            return (
                <div className="text-sm text-red-500 mb-6 p-4 bg-red-50 rounded-xl font-medium border border-red-100">
                    Nenhuma loja configurada no momento.
                </div>
            );
        }

        return (
            <div className="space-y-3 mb-6 text-left">
                <h3 className="font-bold text-gray-800 mb-3">Selecione o Estabelecimento</h3>
                {lojas.map(loja => {
                    const distanciaKm = calcularDistanciaKM(
                        userLocation?.lat, 
                        userLocation?.lng, 
                        loja.latitude || undefined, 
                        loja.longitude || undefined
                    );
                    
                    return (
                        <label
                            key={loja.id_loja}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedLojaId === loja.id_loja ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    name="loja_selecionada"
                                    className="mt-1 w-4 h-4 text-blue-600"
                                    checked={selectedLojaId === loja.id_loja}
                                    onChange={() => setSelectedLojaId(loja.id_loja)}
                                />
                                <div>
                                    <p className="font-bold text-gray-900">{loja.nome}</p>
                                    <p className="text-sm text-gray-500">{loja.logradouro}, {loja.numero} - {loja.bairro}</p>
                                    <p className="text-xs text-gray-400 mt-1">{loja.cidade} / {loja.estado}</p>
                                </div>
                            </div>

                            {distanciaKm !== null && (
                                <div className="flex-shrink-0 text-right">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                        {distanciaKm.toFixed(1)} km
                                    </span>
                                </div>
                            )}
                        </label>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
                {mostrarOpcoes ? 'Como você quer receber?' : 'Endereço de Entrega'}
            </h2>

            {mostrarOpcoes && (
                <div className="flex flex-col sm:flex-row gap-2 p-1 bg-gray-100 rounded-2xl mb-8">
                    <button 
                        onClick={() => handleMudarTipoEntrega('ENTREGA')} 
                        className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tipoEntrega === 'ENTREGA' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        Receber em casa
                    </button>
                    
                    {opcoesEntrega.retirada && (
                        <button 
                            onClick={() => handleMudarTipoEntrega('RETIRADA')} 
                            className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tipoEntrega === 'RETIRADA' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            Vou Retirar
                        </button>
                    )}
                    
                    {opcoesEntrega.local && (
                        <button 
                            onClick={() => handleMudarTipoEntrega('LOCAL')} 
                            className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tipoEntrega === 'LOCAL' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                            Consumir no Local
                        </button>
                    )}
                </div>
            )}

            {tipoEntrega === 'RETIRADA' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Retirada no Balcão</h3>
                        <p className="text-blue-700 text-sm">Selecione o estabelecimento abaixo. Assim que o pagamento for confirmado, seu pedido será preparado.</p>
                    </div>

                    {renderListaLojas()}
                </div>
            )}

            {tipoEntrega === 'LOCAL' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl mb-6">
                        <h3 className="text-lg font-bold text-orange-900 mb-2">Consumir no Local</h3>
                        <p className="text-orange-800 text-sm mb-4">Informe o número da sua mesa ou o seu nome para que possamos levar o pedido até você.</p>
                        
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                            <label className="block text-xs font-bold text-gray-700 mb-2">Número da Mesa ou Nome Completo</label>
                            <input
                                type="text" 
                                placeholder="Ex: Mesa 04 ou João Silva"
                                value={infoMesa}
                                onChange={(e) => setInfoMesa(e.target.value)}
                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm py-3"
                            />
                        </div>
                    </div>

                    {renderListaLojas()}
                </div>
            )}

            {tipoEntrega === 'ENTREGA' && (
                <div className="animate-in fade-in duration-300">
                    {enderecos.length > 0 && !isAddingNew && (
                        <div className="space-y-3 mb-6">
                            <h3 className="font-bold text-gray-800 mb-3">Seus Endereços</h3>
                            {enderecos.map(end => (
                                <label
                                    key={end.id_endereco}
                                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedEnderecoId === end.id_endereco ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                >
                                    <input
                                        type="radio"
                                        name="endereco"
                                        className="mt-1 w-4 h-4 text-blue-600"
                                        checked={selectedEnderecoId === end.id_endereco}
                                        onChange={() => selecionarEnderecoExistente(end)}
                                    />
                                    <div>
                                        {/* 🟢 Leitura segura para exibir a rua ou o logradouro vindo do BD */}
                                        <p className="font-bold text-gray-900">{end.rua || end.logradouro}, {end.numero} {end.complemento && `- ${end.complemento}`}</p>
                                        <p className="text-sm text-gray-500">{end.bairro}, {end.cidade} - {end.estado}</p>
                                        <p className="text-xs text-gray-400 mt-1">CEP: {end.cep}</p>
                                    </div>
                                </label>
                            ))}
                            <button onClick={() => setIsAddingNew(true)} className="text-sm text-blue-600 font-bold hover:underline mt-2 flex items-center gap-1">
                                + Adicionar novo endereço
                            </button>
                        </div>
                    )}

                    {isAddingNew && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800">Novo Endereço</h3>
                                {enderecos.length > 0 && (
                                    <button type="button" onClick={() => setIsAddingNew(false)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
                                )}
                            </div>

                            <form className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">CEP</label>
                                        <input
                                            type="text" name="cep" placeholder="00000-000" maxLength={9}
                                            value={formData.cep}
                                            onChange={handleInputChange}
                                            onBlur={(e) => handleCepBlur(e.target.value)}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Rua / Avenida</label>
                                        <input
                                            type="text" name="rua" placeholder="Rua das Araras"
                                            value={formData.rua} onChange={handleInputChange}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Número</label>
                                        <input
                                            type="text" name="numero" placeholder="123"
                                            value={formData.numero} onChange={handleInputChange}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Complemento (Opcional)</label>
                                        <input
                                            type="text" name="complemento" placeholder="Apto 42, etc"
                                            value={formData.complemento} onChange={handleInputChange}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label>
                                        <input
                                            type="text" name="bairro"
                                            value={formData.bairro} onChange={handleInputChange}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Cidade</label>
                                        <input
                                            type="text" name="cidade"
                                            value={formData.cidade} onChange={handleInputChange}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
                                        <input
                                            type="text" name="estado" maxLength={2} placeholder="SP"
                                            value={formData.estado} onChange={handleInputChange}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm uppercase"
                                        />
                                    </div>
                                </div>
                            </form>

                            {/* CHECKBOX PARA SALVAR O ENDEREÇO NA CONTA */}
                            <div className="mt-5 pt-4 border-t border-gray-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={salvarEndereco}
                                        onChange={(e) => setSalvarEndereco(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-gray-700">
                                        Salvar este endereço para minhas próximas compras
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* OPÇÕES DE FRETE */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            Opções de Entrega
                        </h3>

                        {loadingFrete ? (
                            <div className="flex items-center gap-2 text-blue-600 font-medium">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Calculando as melhores opções para você...
                            </div>
                        ) : erroFrete ? (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                                {erroFrete}
                            </div>
                        ) : fretes.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {fretes.map((frete, index) => (
                                    <label
                                        key={index}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedFrete?.tipo === frete.tipo ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio" name="frete"
                                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                checked={selectedFrete?.tipo === frete.tipo}
                                                onChange={() => {
                                                    setSelectedFrete(frete);
                                                    if (typeof onSetFrete === 'function') onSetFrete(frete.custo);
                                                }}
                                            />
                                            <div>
                                                <p className="font-bold text-gray-900">{frete.tipo}</p>
                                                <p className="text-xs text-gray-500">Receba em até {frete.prazo}</p>
                                            </div>
                                        </div>
                                        <div className="font-black text-green-700">
                                            {formatarPreco(frete.custo)}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Digite um CEP válido para ver as opções de entrega.</p>
                        )}
                    </div>
                </div>
            )}

            {/* BOTÕES NAVEGAÇÃO */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-8 mt-8 border-t border-gray-100">
                <button type="button" onClick={onPrev} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors">
                    Voltar para Carrinho
                </button>
                <Button 
                    onClick={handleContinuar} 
                    disabled={tipoEntrega === 'ENTREGA' && (!selectedFrete && fretes.length > 0)} 
                    className="w-full sm:w-auto px-10 h-12 text-lg rounded-xl"
                >
                    Ir para Pagamento
                </Button>
            </div>
        </div>
    );
};