import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // O estado agora pode ser: 'login', 'cadastro' ou 'esqueci_senha'
  const [modoTela, setModoTela] = useState('login'); 

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');

  // ==========================================
  // FUNÇÃO 1: FAZER LOGIN
  // ==========================================
  const fazerLogin = async (e) => {
    e.preventDefault(); 
    setMensagem(''); 
    
    try {
      const resposta = await axios.post('http://127.0.0.1:8000/usuarios/login', {
        email: email,
        senha: senha
      });

      localStorage.setItem('token', resposta.data.access_token);
      setMensagem('✅ Login efetuado com sucesso!');
    } catch (erro) {
      setMensagem('❌ Erro: Email ou senha incorretos.');
    }
  };

  // ==========================================
  // FUNÇÃO 2: CADASTRAR NOVO USUÁRIO
  // ==========================================
  const fazerCadastro = async (e) => {
    e.preventDefault();
    setMensagem('');

    try {
      await axios.post('http://127.0.0.1:8000/usuarios/registrar', {
        nome: nome,
        email: email,
        senha: senha,
        papel: "Adotante"
      });

      setMensagem('✅ Conta criada com sucesso! Agora você pode entrar.');
      setNome('');
      setSenha('');
      setModoTela('login');
    } catch (erro) {
      if (erro.response && erro.response.status === 400) {
        setMensagem('❌ Erro: Este e-mail já está cadastrado.');
      } else {
        setMensagem('❌ Erro ao criar conta. Tente novamente.');
      }
    }
  };

  // ==========================================
  // FUNÇÃO 3: REDEFINIR SENHA
  // ==========================================
  const redefinirSenha = async (e) => {
    e.preventDefault();
    setMensagem('');

    try {
      await axios.put('http://127.0.0.1:8000/usuarios/redefinir-senha', {
        email: email,
        nova_senha: senha
      });

      setMensagem('✅ Senha redefinida com sucesso! Faça o login.');
      setSenha('');
      setModoTela('login');
    } catch (erro) {
      if (erro.response && erro.response.status === 404) {
        setMensagem('❌ Erro: E-mail não encontrado no sistema.');
      } else {
        setMensagem('❌ Erro ao redefinir a senha.');
      }
    }
  };

  // Função para limpar tudo ao trocar de tela
  const alternarTela = (novoModo) => {
    setModoTela(novoModo);
    setMensagem('');
    setSenha(''); 
    setNome('');
  };

  return (
    <div className="adoteme-app">
      <header className="adoteme-header">
        <div className="brand">
          <span className="brand-paws">🐾🐾</span>
          <span className="brand-text">Adote-Me</span>
        </div>
        <nav className="nav-links">
          <a href="#" className="nav-link">Animais</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('cadastro'); }} className="nav-link">Cadastrar-se</a>
        </nav>
      </header>

      <main className="main-content">
        <div className="login-card">
          <div className="login-paws">🐾🐾</div>
          
          <h2>
            {modoTela === 'login' && 'Bem-vindo de volta'}
            {modoTela === 'cadastro' && 'Crie sua conta'}
            {modoTela === 'esqueci_senha' && 'Recuperar Senha'}
          </h2>
          
          <div className="alert-box">
            <span className="alert-icon">{modoTela === 'esqueci_senha' ? '🔑' : '🔒'}</span>
            <span>
              {modoTela === 'esqueci_senha' 
                ? 'Digite seu e-mail cadastrado e a nova senha.' 
                : 'Suas credenciais são protegidas por criptografia.'}
            </span>
          </div>

          {/* RENDEREZAÇÃO CONDICIONAL DOS FORMULÁRIOS */}
          {modoTela === 'login' && (
            <form onSubmit={fazerLogin} className="login-form">
              <div className="form-group">
                <label className="form-label">E-Mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="seu@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="input-field" placeholder="........" />
              </div>
              <div className="extra-links">
                <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('esqueci_senha'); }} className="forgot-password-link">Esqueci minha senha</a>
              </div>
              <button type="submit" className="submit-button">ENTRAR</button>
            </form>
          )}

          {modoTela === 'cadastro' && (
            <form onSubmit={fazerCadastro} className="login-form">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="input-field" placeholder="Ex: Lucas Silva" />
              </div>
              <div className="form-group">
                <label className="form-label">E-Mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="seu@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Crie uma Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="input-field" placeholder="........" minLength="6" />
              </div>
              <button type="submit" className="submit-button">CRIAR CONTA</button>
            </form>
          )}

          {modoTela === 'esqueci_senha' && (
            <form onSubmit={redefinirSenha} className="login-form">
              <div className="form-group">
                <label className="form-label">E-Mail Cadastrado</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="seu@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="input-field" placeholder="Digite a nova senha" minLength="6" />
              </div>
              <button type="submit" className="submit-button">SALVAR NOVA SENHA</button>
            </form>
          )}

          <div className="signup-section">
            {modoTela === 'login' && (
              <>Novo por aqui? <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('cadastro'); }} className="signup-link">Criar conta grátis</a></>
            )}
            {(modoTela === 'cadastro' || modoTela === 'esqueci_senha') && (
              <>Lembrou a senha? <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('login'); }} className="signup-link">Fazer login</a></>
            )}
          </div>

          {mensagem && (
            <p className={`message ${mensagem.includes('Erro') ? 'error' : 'success'}`}>
              {mensagem}
            </p>
          )}
        </div>
      </main>

      <footer className="adoteme-footer">
        © 2026 Adote-Me
      </footer>
    </div>
  );
}

export default App;