import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
// Importações do Mapa
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// 🎨 ÍCONES: MOTOBOY E CASINHA
// ==========================================
const motoIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Motoboy (Vista lateral)
    iconSize: [45, 45],
    iconAnchor: [22, 45]
});

const homeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1040/1040938.png', // Casinha / Local de Entrega
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

// ==========================================
// 📷 CAMERAMAN: Segue a moto suavemente
// ==========================================
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

// ==========================================
// 🚀 COMPONENTE PRINCIPAL
// ==========================================
export const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<any>(null);
  const [clientLocation, setClientLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Estados para a Rota Inteligente pelas ruas
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [eta, setEta] = useState<number>(0);

  // Busca o pedido a cada 5 segundos para ver a moto andando no banco de dados
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/pedidos/${id}`);
        setPedido(res.data);
      } catch (error) {}
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // Transforma o Endereço do Cliente em Coordenadas Gratuitamente
  useEffect(() => {
      if (pedido?.enderecos && !clientLocation) {
          const enderecoString = `${pedido.enderecos.logradouro}, ${pedido.enderecos.cidade}`;
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoString)}`)
            .then(res => res.json())
            .then(data => {
                if(data && data.length > 0) {
                    setClientLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                }
            }).catch(() => {});
      }
  }, [pedido, clientLocation]);

  // Variáveis de Posição
  const driverLat = Number(pedido?.driver_lat);
  const driverLng = Number(pedido?.driver_lng);
  const hasDriverLocation = !!(driverLat && driverLng && driverLat !== 0);
  const isOnTheWay = pedido?.status_entrega === 'Em Rota de Entrega';

  // 🟢 BUSCA A ROTA REAL PELAS RUAS (OSRM API - Gratuita)
  useEffect(() => {
      if (hasDriverLocation && clientLocation && isOnTheWay) {
          const getRealRoute = async () => {
              try {
                  // A API do OSRM exige o formato: longitude,latitude
                  const url = `https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${clientLocation.lng},${clientLocation.lat}?overview=full&geometries=geojson`;
                  const res = await fetch(url);
                  const data = await res.json();

                  if (data.routes && data.routes.length > 0) {
                      // OSRM retorna [longitude, latitude], o Leaflet usa [latitude, longitude]
                      const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                      setRoutePath(coords);

                      // OSRM retorna a duração em segundos. Convertendo para minutos:
                      const durationMinutes = Math.ceil(data.routes[0].duration / 60);
                      setEta(durationMinutes === 0 ? 1 : durationMinutes); // Mínimo de 1 min
                  }
              } catch (error) {
                  console.error("Erro ao buscar rota pelas ruas", error);
              }
          };
          getRealRoute();
      }
  }, [driverLat, driverLng, clientLocation, isOnTheWay, hasDriverLocation]);

  if (!pedido) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Carregando mapa...</div>;

  const steps = ['Pendente', 'Preparando', 'Em Rota de Entrega', 'Entregue'];
  let currentStepIndex = steps.findIndex(s => s === pedido.status_entrega);
  
  if (pedido.status_pagamento === 'PENDENTE') currentStepIndex = 0;
  if (pedido.status_entrega === 'Enviado') currentStepIndex = 2; 
  if (pedido.status_entrega === 'Entregue') currentStepIndex = 3;

  // Centro do Mapa
  const mapCenter: [number, number] = hasDriverLocation 
    ? [driverLat, driverLng] 
    : (clientLocation ? [clientLocation.lat, clientLocation.lng] : [-14.2350, -51.9253]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/perfil" className="text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Meus Pedidos
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pedido #{pedido.id_pedido}</h1>
          </div>
        </div>

        {/* PIN GIGANTE */}
        {isOnTheWay && pedido.delivery_pin && (
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                 <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                 Motorista a Caminho
              </span>
              <h2 className="text-lg font-medium text-gray-300">Passe este PIN na entrega:</h2>
            </div>
            <div className="text-5xl font-black tracking-[0.15em] bg-white/10 px-8 py-3 rounded-2xl border border-white/20">
              {pedido.delivery_pin}
            </div>
          </div>
        )}

        {/* MAPA E STATUS */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          
          {/* 🟢 MAPA MINIMALISTA (iFood Style) */}
          {currentStepIndex > 0 && currentStepIndex < 3 && (
             <div className="w-full h-[400px] bg-gray-100 relative z-0">
                 
                 {/* Card de Tempo Estimado Flutuante */}
                 {isOnTheWay && hasDriverLocation && eta > 0 && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-6 py-3 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chegada em</span>
                        <span className="text-2xl font-black text-gray-900">~{eta} <span className="text-sm font-bold text-gray-500">min</span></span>
                    </div>
                 )}

                 <MapContainer 
                    center={mapCenter} 
                    zoom={16} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false} // Esconde os botões de +/- pra ficar clean
                 >
                    <ChangeView center={mapCenter} />

                    {/* 🎨 TILE LAYER CLARO E MINIMALISTA (Voyager) */}
                    <TileLayer 
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                        attribution='&copy; <a href="https://carto.com/">Carto</a>'
                    />
                    
                    {/* 🟢 LINHA SÓLIDA DA ROTA PELAS RUAS */}
                    {routePath.length > 0 && (
                        <Polyline 
                            positions={routePath} 
                            color="#2563EB" // Azul primário bem vivo
                            weight={6} // Linha mais grossa
                            opacity={0.8} 
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}

                    {/* Ícone da Casinha (Cliente) */}
                    {clientLocation && (
                        <Marker position={[clientLocation.lat, clientLocation.lng]} icon={homeIcon} />
                    )}

                    {/* Ícone do Motoboy */}
                    {hasDriverLocation && isOnTheWay && (
                        <Marker position={[driverLat, driverLng]} icon={motoIcon} />
                    )}
                 </MapContainer>
             </div>
          )}

          {/* LINHA DO TEMPO CLEAN */}
          <div className="p-6 sm:p-8">
             <div className="space-y-6">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step} className={`flex items-start gap-4 relative ${!isCompleted && !isCurrent ? 'opacity-40' : ''}`}>
                    {/* Linha conectora fina */}
                    {index !== steps.length - 1 && (
                      <div className={`absolute top-8 left-[1.1rem] w-0.5 h-full -z-10 ${index < currentStepIndex ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
                    )}
                    
                    {/* Bolinha Minimalista */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 shrink-0 transition-all duration-300 ${
                      isCurrent ? 'bg-gray-900 text-white shadow-md scale-110' 
                      : isCompleted ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-400 border-2 border-white'
                    }`}>
                      {isCompleted ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : <div className="w-2 h-2 bg-current rounded-full"></div>}
                    </div>

                    <div className="pt-1.5">
                      <h4 className={`font-bold ${isCurrent ? 'text-gray-900 text-lg' : 'text-gray-600'}`}>{step}</h4>
                      {isCurrent && step === 'Em Rota de Entrega' && <p className="text-sm text-gray-500 font-medium">O motorista está a caminho do seu endereço.</p>}
                      {isCurrent && step === 'Preparando' && <p className="text-sm text-gray-500 font-medium">Seu pedido está sendo embalado.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};