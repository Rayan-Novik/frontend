import { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { useStoreConfig } from '../../contexts/StoreConfigContext';

interface Slide {
  id_carrossel: number;
  imagem_url: string;
  link_url?: string;
  titulo?: string;
  subtitulo?: string;
  ordem: number;
}

export const Carousel = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';
  const siteTitle = appearance?.SITE_TITLE || 'Nossa Loja';

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId') || '1';
        const res = await api.get(`/carrossel/active/${tenantId}`);
        if (Array.isArray(res.data)) {
            setSlides(res.data);
        }
      } catch (error) {
        console.error("Erro ao buscar slides na API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  if (isLoading) {
    return <div className="w-full h-[400px] mb-8 bg-gray-200 animate-pulse"></div>;
  }

  if (slides.length === 0) {
    return (
      <div className="py-16 sm:py-24 mb-8 relative overflow-hidden" style={{ backgroundColor: primaryBg }}>
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-sm">
            Novidades <span className="text-white/90">{siteTitle}</span>
          </h1>
          <p className="text-white/90 text-lg sm:text-xl max-w-2xl mx-auto font-medium drop-shadow-sm">
            Aproveite as melhores ofertas com entrega rápida e segura.
          </p>
        </div>
      </div>
    );
  }

  // 🟢 CORREÇÃO 3: Container sem tamanho fixo com "truque" para não cortar a imagem
  return (
    <div className="relative w-full mb-8 overflow-hidden group bg-gray-900 flex items-center justify-center">
      
      {/* 🌟 TRUQUE MÁGICO: Essa primeira imagem fica invisível. Ela serve SOMENTE para forçar o container 
          a ter a altura perfeita do banner, garantindo que NENHUM banner seja cortado nas pontas! */}
      <img 
        src={slides[0].imagem_url} 
        alt="spacer" 
        className="w-full h-auto invisible" 
      />

      {slides.map((slide, index) => (
        <div 
          key={slide.id_carrossel || index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {slide.link_url ? (
            <a href={slide.link_url} className="block w-full h-full relative">
              <SlideContent slide={slide} />
            </a>
          ) : (
            <div className="w-full h-full relative">
              <SlideContent slide={slide} />
            </div>
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Sub-componente para organizar a Imagem e o Texto de cada Slide
const SlideContent = ({ slide }: { slide: Slide }) => (
  <>
    {/* 🟢 CORREÇÃO 4: object-cover junto com o truque garante preenchimento sem corte agressivo */}
    <img 
      src={slide.imagem_url} 
      alt={slide.titulo || 'Slide promocional'} 
      className="w-full h-full object-cover object-center"
    />
    
    {(slide.titulo || slide.subtitulo) && (
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
        <div className="max-w-7xl w-full mx-auto px-8 sm:px-12 lg:px-16 text-left">
          <div className="max-w-2xl animate-in slide-in-from-left-8 duration-700 fade-in">
            {slide.titulo && (
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight drop-shadow-md">
                {slide.titulo}
              </h2>
            )}
            {slide.subtitulo && (
              <p className="text-lg sm:text-xl text-white/90 font-medium drop-shadow-md">
                {slide.subtitulo}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);