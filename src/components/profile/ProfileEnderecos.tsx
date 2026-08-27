import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../services/api';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 🟢 MÁGICA DO DESIGN: Estilos para o efeito de "Pulso" no mapa igual ao iFood/Uber
const mapStyles = `
  .custom-marker-shadow {
    position: absolute;
    width: 36px;
    height: 36px;
    background-color: rgba(37, 99, 235, 0.25);
    border-radius: 50%;
    border: 2px solid rgba(37, 99, 235, 0.5);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulseMap 2s infinite;
  }
  .custom-marker-shadow-2 {
    position: absolute;
    width: 56px;
    height: 56px;
    background-color: rgba(37, 99, 235, 0.15);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulseMap 2s infinite;
    animation-delay: 0.5s;
  }
  @keyframes pulseMap {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
  }
`;

// Injeta os estilos do mapa no cabeçalho
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = mapStyles;
  document.head.appendChild(styleSheet);
}

// 🟢 CRIANDO O PINO (MARKER) PREMIUM CUSTOMIZADO
const customMarkerIcon = new L.DivIcon({
  html: `
    <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
      <div class="custom-marker-shadow-2"></div>
      <div class="custom-marker-shadow"></div>
      <svg viewBox="0 0 24 24" width="40" height="40" fill="#111827" style="position: relative; z-index: 10; margin-bottom: 20px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
      </svg>
    </div>
  `,
  className: '', // Remove classes padrão do Leaflet para não dar conflito
  iconSize: [60, 60],
  iconAnchor: [30, 46], // Alinha perfeitamente a ponta da gota na latitude/longitude
});


interface Endereco {
  id_endereco: number;
  cep?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  is_principal: boolean;
  latitude?: number;
  longitude?: number;
}

// 🟢 COMPONENTE 1: Move a câmera do mapa suavemente (Estilo Uber)
const MapController = ({ lat, lng }: { lat?: number; lng?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
};

// 🟢 COMPONENTE 2: O Pino Arrastável e Clicável (Nível 99)
const MapInteraction = ({
  lat, lng, setCoordinates, onLocationFound
}: {
  lat?: number; lng?: number;
  setCoordinates: (lat: number, lng: number) => void;
  onLocationFound: (lat: number, lng: number) => void;
}) => {
  const map = useMapEvents({
    click(e) {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;
      setCoordinates(newLat, newLng);
      onLocationFound(newLat, newLng);
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  const markerRef = useRef<any>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const position = marker.getLatLng();
          setCoordinates(position.lat, position.lng);
          onLocationFound(position.lat, position.lng);
          map.flyTo(position, map.getZoom());
        }
      },
    }),
    [setCoordinates, onLocationFound, map],
  );

  return lat && lng ? (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[lat, lng]}
      ref={markerRef}
      icon={customMarkerIcon} // 🟢 Aplicando nosso Pino Premium!
    ></Marker>
  ) : null;
};

export const ProfileEnderecos = () => {
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [semCepEspecifico, setSemCepEspecifico] = useState(false);

  // Estados dos Campos
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [isPrincipal, setIsPrincipal] = useState(false);

  // Coordenadas do GPS
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const defaultCenter = { lat: -15.7801, lng: -47.9292 }; // Centro do Brasil (Fallback)

  const mapaEstados: Record<string, string> = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
    "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
    "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
    "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
    "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
    "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
    "Sergipe": "SE", "Tocantins": "TO"
  };

  const fetchEnderecos = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/enderecos');
      setEnderecos(data);
    } catch (error) {
      console.error("Erro ao buscar endereços", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnderecos();
  }, []);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);

    if (valor.length >= 5) {
      setCep(valor.replace(/^(\d{5})(\d)/, "$1-$2"));
    } else {
      setCep(valor);
    }

    if (valor.length === 8 && !semCepEspecifico) {
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${valor}/json/`);
        if (!response.data.erro) {
          setLogradouro(response.data.logradouro);
          setBairro(response.data.bairro);
          setCidade(response.data.localidade);
          setEstado(response.data.uf);

          const addressQuery = `${response.data.logradouro}, ${response.data.bairro}, ${response.data.localidade}, ${response.data.uf}, Brasil`;
          const coordRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);

          if (coordRes.data.length > 0) {
            setLatitude(parseFloat(coordRes.data[0].lat));
            setLongitude(parseFloat(coordRes.data[0].lon));
          }
        }
      } catch (error) { }
    }
  };

  const autoFillFromCoordinates = async (lat: number, lng: number) => {
    setIsFetchingLocation(true);
    try {
      const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);

      if (data && data.address) {
        setBairro(data.address.suburb || data.address.neighbourhood || data.address.residential || bairro);
        setCidade(data.address.city || data.address.town || data.address.village || data.address.municipality || cidade);

        const estadoCompleto = data.address.state || estado;
        setEstado(mapaEstados[estadoCompleto] || estadoCompleto.substring(0, 2).toUpperCase());

        setLogradouro(data.address.road || data.address.pedestrian || data.address.path || data.address.residential || logradouro);

        const cepEncontrado = data.address.postcode?.replace(/\D/g, '');
        if (cepEncontrado && cepEncontrado.length === 8) {
          setCep(cepEncontrado.replace(/^(\d{5})(\d{3})/, "$1-$2"));
        }

        if (data.address.house_number) setNumero(data.address.house_number);

        setMensagem({ texto: '📍 Localização atualizada! Você pode editar os campos abaixo se precisar.', tipo: 'sucesso' });
      }
    } catch (error) {
      setMensagem({ texto: 'Local salvo! Digite o nome do condomínio/rua abaixo.', tipo: 'sucesso' });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleLocalizacaoAtual = () => {
    if (!navigator.geolocation) {
      setMensagem({ texto: 'Seu navegador não suporta localização.', tipo: 'erro' });
      return;
    }

    setMensagem({ texto: 'Encontrando seu local no satélite... 🛰️', tipo: 'sucesso' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setSemCepEspecifico(true);
        autoFillFromCoordinates(lat, lng);
      },
      (error) => {
        setMensagem({ texto: 'Permissão negada. Digite seu CEP para encontrar no mapa.', tipo: 'erro' });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddNova = () => {
    setCep(''); setLogradouro(''); setNumero(''); setComplemento('');
    setBairro(''); setCidade(''); setEstado(''); setIsPrincipal(enderecos.length === 0);
    setLatitude(undefined); setLongitude(undefined); setSemCepEspecifico(false);
    setIsEditing(null); setShowForm(true); setMensagem({ texto: '', tipo: '' });
  };

  const handleEdit = (endereco: Endereco) => {
    setCep(endereco.cep || ''); setLogradouro(endereco.logradouro); setNumero(endereco.numero);
    setComplemento(endereco.complemento || ''); setBairro(endereco.bairro);
    setCidade(endereco.cidade); setEstado(endereco.estado); setIsPrincipal(endereco.is_principal);
    setLatitude(endereco.latitude); setLongitude(endereco.longitude);
    setSemCepEspecifico(!endereco.cep);
    setIsEditing(endereco.id_endereco); setShowForm(true); setMensagem({ texto: '', tipo: '' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este endereço?')) return;
    try {
      await api.delete(`/enderecos/${id}`);
      setMensagem({ texto: 'Endereço removido!', tipo: 'sucesso' });
      fetchEnderecos();
    } catch (error) {
      setMensagem({ texto: 'Erro ao remover endereço.', tipo: 'erro' });
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMensagem({ texto: '', tipo: '' });

    const payload = {
      cep: cep ? cep.replace(/\D/g, '') : null,
      logradouro, numero, complemento, bairro, cidade, estado,
      is_principal: isPrincipal,
      latitude, longitude
    };

    try {
      if (isEditing) {
        await api.put(`/enderecos/${isEditing}`, payload);
        setMensagem({ texto: 'Endereço atualizado!', tipo: 'sucesso' });
      } else {
        await api.post('/enderecos', payload);
        setMensagem({ texto: 'Endereço salvo com sucesso!', tipo: 'sucesso' });
      }
      setShowForm(false);
      fetchEnderecos();
    } catch (error: any) {
      setMensagem({ texto: error.response?.data?.message || 'Erro ao salvar endereço.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && enderecos.length === 0) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="overflow-hidden p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-800">Meus Endereços</h2>
        {!showForm && (
          <button onClick={handleAddNova} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
            + Novo Endereço
          </button>
        )}
      </div>

      {mensagem.texto && (
        <div className={`p-4 mb-6 rounded-md text-sm ${mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {mensagem.texto}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSalvar} className="bg-gray-50 p-6 rounded-xl border border-gray-200">

          <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-blue-900">Mora em Condomínio ou área sem CEP?</h4>
              <p className="text-sm text-blue-700 mt-1">Nós usamos o GPS para garantir que o motoboy chegue exatamente na sua porta.</p>
            </div>
            <button
              type="button"
              onClick={handleLocalizacaoAtual}
              className="flex-shrink-0 w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Usar meu GPS Atual
            </button>
          </div>

          {/* 🟢 MAPA INTERATIVO ESTILO UBER (Tons de Azul Claro) */}
          <div className="mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm font-semibold text-gray-700">
                <span className="text-blue-600 mr-1">📍</span>
                Clique ou arraste o pino para a sua casa exata:
              </p>
              {isFetchingLocation && <span className="text-xs text-blue-600 font-medium animate-pulse">Lendo satélite...</span>}
            </div>
            <div className="w-full rounded-lg overflow-hidden border border-gray-300" style={{ height: '250px', zIndex: 1 }}>
              <MapContainer
                center={latitude ? [latitude, longitude!] : [defaultCenter.lat, defaultCenter.lng]}
                zoom={latitude ? 17 : 4}
                style={{ height: '100%', width: '100%' }}
              >
                {/* 🟢 TILE LAYER DO CARTO_DB LIGHT (O mapa azul/cinza clarinho e limpo) */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                />
                <MapController lat={latitude} lng={longitude} />
                <MapInteraction
                  lat={latitude}
                  lng={longitude}
                  setCoordinates={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                  onLocationFound={autoFillFromCoordinates}
                />
              </MapContainer>
            </div>
          </div>

          {latitude && longitude && (
            <div className="mb-6 text-xs font-bold text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              GPS fixado! Você pode alterar os textos abaixo que o pino não sairá do lugar.
            </div>
          )}

          <div className="mb-6 bg-white border border-gray-200 p-3 rounded-lg flex items-start gap-3">
            <input
              type="checkbox"
              id="sem_cep"
              checked={semCepEspecifico}
              onChange={(e) => setSemCepEspecifico(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="sem_cep" className="text-sm text-gray-700 cursor-pointer leading-tight">
              <span className="font-semibold block text-gray-900">Preencher manualmente (Meu endereço não tem CEP exato)</span>
              Marque esta opção para o sistema não apagar a rua que você digitar.
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP (Opcional se usar GPS)</label>
              <input type="text" value={cep} onChange={handleCepChange} placeholder="00000-000" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua / Condomínio / Ramal</label>
              <input type="text" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Ex: Condomínio Novo Aleixo" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número / Bloco</label>
              <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: Bloco 14" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" required />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência (Muito importante)</label>
              <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto 101 / Ao lado do salão..." className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
              <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="AM" maxLength={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 uppercase" required />
            </div>
          </div>

          <div className="flex items-center mb-6">
            <input type="checkbox" id="is_principal" checked={isPrincipal} onChange={(e) => setIsPrincipal(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
            <label htmlFor="is_principal" className="ml-2 block text-sm text-gray-700 cursor-pointer">
              Tornar este meu endereço principal de entrega
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">Cancelar</button>
            <button type="submit" disabled={isSaving} className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSaving ? 'Salvando...' : 'Salvar Endereço'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enderecos.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p className="text-gray-500 font-medium">Você ainda não tem endereços cadastrados.</p>
            </div>
          ) : (
            enderecos.map((endereco) => (
              <div key={endereco.id_endereco} className={`relative p-5 rounded-xl border transition-all ${endereco.is_principal ? 'border-blue-400 bg-blue-50/30 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                {endereco.is_principal && <span className="absolute top-3 right-3 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">Principal</span>}

                {endereco.latitude && endereco.longitude && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    GPS Validado
                  </span>
                )}

                <h4 className="font-semibold text-gray-800 mb-1">{endereco.logradouro}, {endereco.numero}</h4>
                <p className="text-sm text-gray-500 mb-1">{endereco.bairro} {endereco.complemento && `- Ref: ${endereco.complemento}`}</p>
                <p className="text-sm text-gray-500 mb-4">{endereco.cidade} - {endereco.estado} {endereco.cep && `/ CEP: ${endereco.cep.replace(/^(\d{5})(\d{3})/, "$1-$2")}`}</p>

                <div className="flex items-center gap-3 border-t border-gray-100 pt-3 mt-auto">
                  <button onClick={() => handleEdit(endereco)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Editar</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => handleDelete(endereco.id_endereco)} className="text-sm font-medium text-red-500 hover:text-red-700">Excluir</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};