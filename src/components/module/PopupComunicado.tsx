import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Comunicado {
  id_comunicado: number;
  titulo: string;
  imagem_url: string;
  link_url?: string;
  estilos?: string; // 🟢 Novo campo que vem do banco de dados em formato JSON
}

export const PopupComunicado = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [comunicado, setComunicado] = useState<Comunicado | null>(null);
  const [estilos, setEstilos] = useState<any>({});

  useEffect(() => {
    const fetchComunicado = async () => {
      // Verifica se o usuário já fechou o pop-up nesta sessão
      const hasSeen = sessionStorage.getItem('hasSeenPopup');
      if (hasSeen === 'true') return;

      try {
        const tenantId = localStorage.getItem('tenantId') || '1';
        const res = await api.get(`/comunicados/active/${tenantId}`);
        
        if (res.data && res.data.id_comunicado) {
          setComunicado(res.data);
          
          // 🟢 Desempacota o JSON de estilos salvo no painel admin
          if (res.data.estilos) {
            try {
              const parsedStyles = typeof res.data.estilos === 'string' ? JSON.parse(res.data.estilos) : res.data.estilos;
              setEstilos(parsedStyles);
            } catch (e) {
              console.error("Erro ao ler os estilos do pop-up", e);
            }
          }
          
          // Delay para não assustar o cliente logo no primeiro milissegundo
          setTimeout(() => {
            setIsOpen(true);
          }, 1000);
        }
      } catch (error) {
        console.error("Erro ao buscar comunicado:", error);
      }
    };

    fetchComunicado();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenPopup', 'true');
  };

  if (!isOpen || !comunicado) return null;

  const isExternal = comunicado.link_url && (comunicado.link_url.startsWith('http://') || comunicado.link_url.startsWith('https://'));

  // 🟢 Constrói o botão personalizável
  const renderBotao = () => {
    if (!estilos.BTN_TEXT) return null;

    const btnStyle = {
      backgroundColor: estilos.BTN_BG || '#2563EB',
      color: estilos.BTN_TEXT_COLOR || '#ffffff',
      borderRadius: `${estilos.BTN_RADIUS ?? 50}px`,
    };

    const btnClasses = "inline-block px-6 py-2 md:px-8 md:py-3 font-bold shadow-lg transition-transform hover:scale-105 cursor-pointer text-sm md:text-[1.1rem] whitespace-nowrap";

    if (comunicado.link_url) {
      if (isExternal) {
        return (
          <a href={comunicado.link_url} target="_blank" rel="noopener noreferrer" onClick={handleClose} className={btnClasses} style={btnStyle}>
            {estilos.BTN_TEXT}
          </a>
        );
      }
      return (
        <Link to={comunicado.link_url} onClick={handleClose} className={btnClasses} style={btnStyle}>
          {estilos.BTN_TEXT}
        </Link>
      );
    }

    // Se não tiver link, o botão apenas fecha o pop-up
    return (
      <button onClick={handleClose} className={btnClasses} style={btnStyle}>
        {estilos.BTN_TEXT}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* 🟢 O Container do Pop-up é quadrado (aspect-square) para bater com a prévia do painel */}
      <div 
        className="relative w-full max-w-md md:max-w-lg aspect-square bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500"
        style={{
          backgroundImage: `url(${comunicado.imagem_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        
        {/* Botão Fechar (X) - Fica no canto superior direito para sempre poder ser fechado */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 🟢 TÍTULO */}
        {comunicado.titulo && (
          <div 
            className="absolute z-10 w-[90%]"
            style={{
              left: `${estilos.TITLE_POS_X || 50}%`,
              top: `${estilos.TITLE_POS_Y || 20}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <h3 
              className="m-0 drop-shadow-md"
              style={{
                color: estilos.TITLE_COLOR || '#ffffff',
                fontSize: `${estilos.TITLE_SIZE || 32}px`,
                fontWeight: estilos.TITLE_BOLD ? '800' : '400',
                backgroundColor: estilos.TITLE_BG || 'transparent',
                padding: `${estilos.TITLE_PADDING || 0}px`,
                borderRadius: `${estilos.TITLE_RADIUS || 0}px`,
                display: 'inline-block',
                lineHeight: '1.2'
              }}
            >
              {comunicado.titulo}
            </h3>
          </div>
        )}

        {/* 🟢 SUBTÍTULO */}
        {estilos.SUBTITLE_TEXT && (
          <div 
            className="absolute z-10 w-[90%]"
            style={{
              left: `${estilos.SUB_POS_X || 50}%`,
              top: `${estilos.SUB_POS_Y || 40}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <p 
              className="m-0 drop-shadow-md"
              style={{
                color: estilos.SUB_COLOR || '#ffffff',
                fontSize: `${estilos.SUB_SIZE || 16}px`,
                fontWeight: estilos.SUB_BOLD ? '700' : '400',
                backgroundColor: estilos.SUB_BG || 'transparent',
                padding: `${estilos.SUB_PADDING || 0}px`,
                borderRadius: `${estilos.SUB_RADIUS || 0}px`,
                display: 'inline-block',
                lineHeight: '1.4'
              }}
            >
              {estilos.SUBTITLE_TEXT}
            </p>
          </div>
        )}

        {/* 🟢 BOTÃO DE AÇÃO */}
        <div 
          className="absolute z-10"
          style={{
            left: `${estilos.BTN_POS_X || 50}%`,
            top: `${estilos.BTN_POS_Y || 80}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {renderBotao()}
        </div>

      </div>
    </div>
  );
};