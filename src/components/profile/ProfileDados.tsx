// src/components/profile/ProfileDados.tsx
import { useState, useEffect } from 'react';
import api from '../../services/api';

export const ProfileDados = () => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

  const formatarCpf = (valor: string) => {
    if (!valor) return '';
    const limpo = valor.replace(/\D/g, '');
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatarTelefone = (valor: string) => {
    if (!valor) return '';
    const limpo = valor.replace(/\D/g, '');
    if (limpo.length === 11) {
      return limpo.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (limpo.length === 10) {
      return limpo.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return valor;
  };

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const { data } = await api.get('/usuarios/perfil');
        setNome(data.nome_completo || data.nome || '');
        setEmail(data.email || '');
        setCpf(formatarCpf(data.cpf));
        setTelefone(formatarTelefone(data.telefone));
      } catch (error: any) {
        setMensagem({ texto: 'Não foi possível carregar seus dados.', tipo: 'erro' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    setTelefone(value);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ texto: '', tipo: '' });

    if (novaSenha && novaSenha !== confirmarSenha) {
      setMensagem({ texto: 'A nova senha e a confirmação não batem.', tipo: 'erro' });
      return;
    }

    setIsSaving(true);
    try {
      const dadosAtualizados = {
        email,
        telefone: telefone.replace(/\D/g, ''),
        ...(novaSenha && { senhaAtual, novaSenha })
      };
      await api.put('/usuarios/perfil', dadosAtualizados);
      setMensagem({ texto: 'Perfil atualizado com sucesso!', tipo: 'sucesso' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      setMensagem({ texto: error.response?.data?.message || 'Erro ao atualizar.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="overflow-hidden">
      <form onSubmit={handleSalvar} className="p-6 sm:p-8">
        {mensagem.texto && (
          <div className={`p-4 mb-6 rounded-md ${mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Dados Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input type="text" value={nome} disabled className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input type="text" value={cpf} disabled className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
            <input type="text" value={telefone} onChange={handleTelefoneChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Segurança (Opcional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
            <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" disabled={isSaving} className={`px-6 py-2.5 rounded-lg text-white font-medium transition-all ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};