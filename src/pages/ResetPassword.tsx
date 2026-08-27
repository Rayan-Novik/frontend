import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const ResetPassword = () => {
  // Captura o token dinâmico da URL gerada pelo e-mail
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- LÓGICA DE FORÇA DA SENHA (Igual ao Register) ---
  const calcularForcaSenha = (pass: string) => {
    let forca = 0;
    if (pass.length >= 8) forca += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) forca += 25;
    if (/[0-9]/.test(pass)) forca += 25;
    if (/[!@#$%^&*]/.test(pass)) forca += 25;
    return forca;
  };

  const forcaSenha = calcularForcaSenha(senha);

  const getCorBarra = () => {
    if (forcaSenha <= 25) return 'bg-red-500';
    if (forcaSenha <= 50) return 'bg-orange-500';
    if (forcaSenha <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    // Validações básicas no frontend
    if (!senha || !confirmarSenha) {
      return setErro('Por favor, preencha todos os campos.');
    }

    if (senha !== confirmarSenha) {
      return setErro('As senhas digitadas não coincidem.');
    }

    // Valida se a senha atingiu pelo menos 75% (forte)
    if (forcaSenha < 75) {
      return setErro('Sua senha ainda está muito fraca. Siga as dicas de segurança abaixo.');
    }

    setIsLoading(true);

    try {
      // Dispara para a rota do backend, passando o token na URL e a senha no body
      const response = await api.post(`/usuarios/reset-password/${token}`, { senha });

      setSucesso(response.data.message || 'Senha redefinida com sucesso!');
      
      // Limpa os campos
      setSenha('');
      setConfirmarSenha('');

      // Redireciona o usuário para o login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      const mensagemErro = error.response?.data?.message || 'Erro ao redefinir a senha. O link pode ser inválido ou já ter expirado.';
      setErro(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Criar Nova Senha</h2>
          <p className="text-gray-500 mt-2">Digite sua nova senha de acesso abaixo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Input
              label="Nova Senha"
              type="password"
              placeholder="Crie uma senha forte"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            {/* 🟢 BARRA DE FORÇA DA SENHA (Padrão do Register) */}
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full transition-all duration-500 ${getCorBarra()}`} 
                style={{ width: `${forcaSenha}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 flex justify-between">
              <span>Segurança da senha</span>
              <span className="font-bold">{forcaSenha}%</span>
            </p>
          </div>

          <div>
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="Repita sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
            {/* 🟢 FEEDBACK DE CONFIRMAÇÃO (Padrão do Register) */}
            {confirmarSenha && (
              <p className={`text-[10px] mt-1 ${senha === confirmarSenha ? 'text-green-600' : 'text-red-500'}`}>
                {senha === confirmarSenha ? '✅ As senhas coincidem' : '❌ As senhas estão diferentes'}
              </p>
            )}
          </div>

          {(erro || sucesso) && (
            <div className={`p-3 border text-sm rounded-md font-medium text-center mt-4 ${
              erro ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {erro || sucesso} {sucesso && <><br/><span className="font-semibold">Redirecionando...</span></>}
            </div>
          )}

          <div className="mt-6">
            <Button 
              type="submit" 
              isLoading={isLoading} 
              disabled={forcaSenha < 75 || senha !== confirmarSenha}
              className="w-full h-12 text-lg rounded-xl"
            >
              Redefinir Senha
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center border-t border-gray-100 pt-6">
          <Link to="/login" className="text-sm text-gray-600 font-semibold hover:text-gray-900 hover:underline transition-colors">
            Cancelar e voltar para o Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;