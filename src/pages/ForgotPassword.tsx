import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const ForgotPassword = () => {
  // Estado para controlar se o usuário quer recuperar por e-mail ou whatsapp
  const [metodo, setMetodo] = useState<'email' | 'whatsapp'>('email');
  
  // O valor do input (vai ser o e-mail ou o telefone, dependendo do método)
  const [contato, setContato] = useState('');
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 NOVO ESTADO: Controla se o WhatsApp da loja está ativo
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);

  // 🟢 NOVO EFFECT: Checa o status do WhatsApp assim que a tela carrega
  useEffect(() => {
    const checkWhatsappStatus = async () => {
      try {
        // 🟢 Pega o slug da loja (ajuste como você costuma pegar o tenantId no seu Front)
        const tenantSlug = localStorage.getItem('tenantSlug') || '1'; 
        
        // Bate na rota PÚBLICA de configurações
        const { data } = await api.get(`/configuracoes/public/${tenantSlug}`);
        
        // Se a API avisar que está ativo, mostra a aba!
        if (data.WHATSAPP_ATIVO === true) {
          setIsWhatsappConnected(true);
        } else {
          setIsWhatsappConnected(false);
          setMetodo('email'); // Força a ficar no e-mail se não tiver Zap
        }
      } catch (error) {
        console.error('Erro ao checar configurações públicas:', error);
        setIsWhatsappConnected(false);
      }
    };

    checkWhatsappStatus();
  }, []);

  // 🟢 FORMATADOR DE TELEFONE (Para o cliente não errar o número)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    
    let formatted = val;
    if (val.length > 2 && val.length <= 7) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 7) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    }
    setContato(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!contato) {
      return setErro('Por favor, preencha o campo de contato.');
    }

    setIsLoading(true);

    try {
      // Se for WhatsApp, envia só os números limpinhos
      const contatoLimpo = metodo === 'whatsapp' ? contato.replace(/\D/g, '') : contato;

      // Monta o objeto de acordo com o que o seu backend espera
      const payload = metodo === 'email' 
        ? { method: 'email', email: contatoLimpo }
        : { method: 'whatsapp', phone: contatoLimpo };

      // Dispara para a sua rota de recuperação
      const response = await api.post('/usuarios/forgot-password', payload);

      // Mostra a mensagem de sucesso que vem do seu backend
      setSucesso(response.data.message || 'Link de recuperação enviado com sucesso!');
      setContato(''); // Limpa o campo após o envio

    } catch (error: any) {
      const mensagemErro = error.response?.data?.message || 'Erro ao solicitar recuperação. Tente novamente.';
      setErro(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Recuperar Senha</h2>
          <p className="text-gray-500 mt-2">
            {isWhatsappConnected 
              ? "Escolha como deseja receber o link de redefinição" 
              : "Digite seu e-mail para receber o link de redefinição"}
          </p>
        </div>

        {/* 🟢 O SEGREDO: O seletor só aparece se o isWhatsappConnected for TRUE */}
        {isWhatsappConnected && (
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setMetodo('email'); setContato(''); setErro(''); setSucesso(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                metodo === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              E-mail
            </button>
            <button
              type="button"
              onClick={() => { setMetodo('whatsapp'); setContato(''); setErro(''); setSucesso(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                metodo === 'whatsapp' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              WhatsApp
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {metodo === 'email' ? (
            <Input
              label="Seu E-mail"
              type="email"
              placeholder="seu@email.com"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              required
            />
          ) : (
            <Input
              label="Seu WhatsApp"
              type="text"
              placeholder="(92) 99999-9999"
              value={contato}
              onChange={handlePhoneChange}
              maxLength={15}
              required
            />
          )}

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
              {sucesso}
            </div>
          )}

          <div className="mt-4">
            <Button type="submit" isLoading={isLoading}>
              Enviar Link de Recuperação
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center border-t border-gray-100 pt-6">
          <Link to="/login" className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
            &larr; Voltar para o Login
          </Link>
        </div>

      </div>
    </div>
  );
};