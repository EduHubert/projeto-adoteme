import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [modoTela, setModoTela] = useState('catalogo'); 

  const [mensagem, setMensagem] = useState('');
  const [perfilAtivo, setPerfilAtivo] = useState('Adotante'); 

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [papelCadastro, setPapelCadastro] = useState('Adotante');

  const [animais, setAnimais] = useState([]);
  const [nomeAnimal, setNomeAnimal] = useState('');
  const [especie, setEspecie] = useState('Cachorro');
  const [raca, setRaca] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('Macho');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState(''); 

  // ==========================================
  // NOVO: Estados para o Filtro e Pesquisa (PBI 106)
  // ==========================================
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroEspecieTela, setFiltroEspecieTela] = useState('Todos');

  const buscarAnimais = async () => {
    try {
      const resposta = await axios.get('http://127.0.0.1:8001/animais');
      setAnimais(resposta.data);
    } catch (erro) {
      console.error("Erro ao buscar os animais", erro);
    }
  };

  useEffect(() => {
    if (modoTela === 'catalogo') {
      buscarAnimais();
    }
  }, [modoTela]);

  const cadastrarAnimal = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      await axios.post('http://127.0.0.1:8001/animais', {
        nome: nomeAnimal, especie, raca, idade, sexo, descricao, imagem_url: imagemUrl
      });
      setMensagem('✅ Animal cadastrado com sucesso! A vitrine foi atualizada.');
      setNomeAnimal(''); setRaca(''); setIdade(''); setDescricao(''); setImagemUrl('');
    } catch (erro) {
      setMensagem('❌ Erro ao cadastrar o animal. Verifique os dados.');
    }
  };

  const excluirAnimal = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir o anúncio deste animal?")) {
      setMensagem('');
      try {
        await axios.delete(`http://127.0.0.1:8001/animais/${id}`);
        setMensagem('✅ Anúncio excluído com sucesso!');
        buscarAnimais(); 
      } catch (erro) {
        setMensagem('❌ Erro ao excluir o anúncio.');
      }
    }
  };

  const fazerLogin = async (e) => {
    e.preventDefault(); 
    setMensagem(''); 
    try {
      const resposta = await axios.post('http://127.0.0.1:8000/usuarios/login', { email, senha });
      localStorage.setItem('token', resposta.data.access_token);
      
      const papelDoUsuario = resposta.data.papel;
      if (papelDoUsuario === 'ONG') {
        setPerfilAtivo('ONG');
      } else {
        setPerfilAtivo('Adotante');
      }

      setMensagem('✅ Login efetuado com sucesso!');
      setTimeout(() => alternarTela('catalogo'), 1500); 
    } catch (erro) {
      setMensagem('❌ Erro: Email ou senha incorretos.');
    }
  };

  const fazerCadastro = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      await axios.post('http://127.0.0.1:8000/usuarios/registrar', { nome, email, senha, papel: papelCadastro });
      setMensagem('✅ Conta criada com sucesso! Faça o login.');
      setNome(''); setSenha(''); alternarTela('login');
    } catch (erro) {
      setMensagem('❌ Erro ao criar conta. Tente novamente.');
    }
  };

  const redefinirSenha = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      await axios.put('http://127.0.0.1:8000/usuarios/redefinir-senha', { email, nova_senha: senha });
      setMensagem('✅ Senha redefinida! Faça o login.');
      setSenha(''); alternarTela('login');
    } catch (erro) {
      setMensagem('❌ Erro ao redefinir a senha.');
    }
  };

  const alternarTela = (novoModo) => {
    setModoTela(novoModo);
    setMensagem('');
  };

  // ==========================================
  // NOVO: Lógica de Filtragem (PBI 106)
  // ==========================================
  const animaisFiltrados = animais.filter((animal) => {
    // 1. Verifica se o nome ou a raça batem com o texto pesquisado (ignorando maiúsculas/minúsculas)
    const matchPesquisa = animal.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) || 
                          animal.raca.toLowerCase().includes(termoPesquisa.toLowerCase());
    
    // 2. Verifica se a espécie selecionada no dropdown bate com a do animal
    const matchEspecie = filtroEspecieTela === 'Todos' || animal.especie === filtroEspecieTela;
    
    // Só mostra o animal se ele passar nas duas regras
    return matchPesquisa && matchEspecie;
  });

  return (
    <div className="adoteme-app">
      <header className="adoteme-header">
        <div className="brand" onClick={() => alternarTela('catalogo')} style={{cursor: 'pointer'}}>
          <span className="brand-paws">🐾🐾</span>
          <span className="brand-text">Adote-Me</span>
        </div>
        <nav className="nav-links">
          <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('catalogo'); }} className="nav-link">Animais</a>
          {perfilAtivo === 'ONG' && (
            <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('cadastrar_animal'); }} className="nav-link" style={{color: '#ff6600'}}>+ Novo Animal</a>
          )}
          <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('login'); }} className="nav-link">Entrar</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alternarTela('cadastro'); }} className="nav-link">Cadastrar-se</a>
        </nav>
      </header>

      <main className="main-content">
        
        {/* VITRINE DE ANIMAIS */}
        {modoTela === 'catalogo' && (
          <div className="catalogo-container">
            <h2>🐾 Nossos Amigos Esperando um Lar 🐾</h2>
            
            {/* ========================================== */}
            {/* NOVO: Barra de Pesquisa e Filtros (PBI 106)*/}
            {/* ========================================== */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', justifyContent: 'center' }}>
              <input 
                type="text" 
                placeholder="🔍 Pesquisar por nome ou raça..." 
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="input-field"
                style={{ maxWidth: '400px', margin: 0 }}
              />
              <select 
                value={filtroEspecieTela} 
                onChange={(e) => setFiltroEspecieTela(e.target.value)}
                className="input-field"
                style={{ maxWidth: '200px', margin: 0, cursor: 'pointer' }}
              >
                <option value="Todos">Todas as Espécies</option>
                <option value="Cachorro">Cachorros</option>
                <option value="Gato">Gatos</option>
              </select>
            </div>

            {animaisFiltrados.length === 0 ? (
              <p style={{textAlign: 'center', fontSize: '18px'}}>Nenhum animal encontrado com estes filtros.</p>
            ) : (
              <div className="grid-animais">
                {/* Aqui mudamos de 'animais.map' para 'animaisFiltrados.map' */}
                {animaisFiltrados.map((animal) => (
                  <div key={animal.id} className="animal-card">
                    
                    {animal.imagem_url ? (
                      <img src={animal.imagem_url} alt={`Foto de ${animal.nome}`} className="animal-foto" />
                    ) : (
                      <div className="animal-foto" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '50px'}}>🐾</div>
                    )}

                    <h3>{animal.nome}</h3>
                    <p className="animal-info"><strong>Espécie:</strong> {animal.especie}</p>
                    <p className="animal-info"><strong>Raça:</strong> {animal.raca}</p>
                    <p className="animal-info"><strong>Idade:</strong> {animal.idade}</p>
                    <p className="animal-info"><strong>Sexo:</strong> {animal.sexo}</p>
                    <p className="animal-descricao">"{animal.descricao}"</p>
                    <button className="submit-button btn-adotar">Quero Adotar!</button>
                    
                    {perfilAtivo === 'ONG' && (
                      <button 
                        onClick={() => excluirAnimal(animal.id)}
                        style={{marginTop: '10px', backgroundColor: '#cc0000', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', width: '100%', fontWeight: 'bold'}}
                      >
                        🗑️ Excluir Anúncio
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CADASTRO DE ANIMAL (ONG) */}
        {modoTela === 'cadastrar_animal' && (
           <div className="login-card" style={{width: '600px'}}>
             <h2>Cadastrar Novo Animal</h2>
             <div className="alert-box" style={{backgroundColor: '#fff3e6', borderColor: '#ffcc99', color: '#cc5200'}}>
               <span className="alert-icon">📋</span>
               <span>Área restrita para voluntários da ONG.</span>
             </div>
             <form onSubmit={cadastrarAnimal} className="login-form">
               <div className="form-group"><label className="form-label">Nome do Pet</label><input type="text" value={nomeAnimal} onChange={(e) => setNomeAnimal(e.target.value)} required className="input-field" placeholder="Ex: Rex" /></div>
               <div className="form-group"><label className="form-label">Link da Foto (URL)</label><input type="url" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} className="input-field" placeholder="https://site.com/foto-do-cachorro.jpg" /></div>
               <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
                 <div style={{flex: 1}}>
                   <label className="form-label">Espécie</label>
                   <select value={especie} onChange={(e) => setEspecie(e.target.value)} className="input-field">
                     <option value="Cachorro">Cachorro</option>
                     <option value="Gato">Gato</option>
                   </select>
                 </div>
                 <div style={{flex: 1}}>
                   <label className="form-label">Sexo</label>
                   <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="input-field">
                     <option value="Macho">Macho</option>
                     <option value="Fêmea">Fêmea</option>
                   </select>
                 </div>
               </div>
               <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
                 <div style={{flex: 1}}><label className="form-label">Raça</label><input type="text" value={raca} onChange={(e) => setRaca(e.target.value)} required className="input-field" placeholder="Ex: Vira-lata" /></div>
                 <div style={{flex: 1}}><label className="form-label">Idade</label><input type="text" value={idade} onChange={(e) => setIdade(e.target.value)} required className="input-field" placeholder="Ex: 2 meses" /></div>
               </div>
               <div className="form-group"><label className="form-label">Descrição / Comportamento</label><input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className="input-field" placeholder="Ex: Muito brincalhão e amoroso." /></div>
               <button type="submit" className="submit-button">SALVAR ANIMAL</button>
             </form>
             {mensagem && <p className={`message ${mensagem.includes('Erro') ? 'error' : 'success'}`}>{mensagem}</p>}
           </div>
        )}

        {/* TELAS DE IDENTIDADE */}
        {(modoTela === 'login' || modoTela === 'cadastro' || modoTela === 'esqueci_senha') && (
          <div className="login-card">
            <div className="login-paws">🐾🐾</div>
            <h2>
              {modoTela === 'login' && 'Bem-vindo de volta'}
              {modoTela === 'cadastro' && 'Crie sua conta'}
              {modoTela === 'esqueci_senha' && 'Recuperar Senha'}
            </h2>
            <div className="alert-box"><span className="alert-icon">{modoTela === 'esqueci_senha' ? '🔑' : '🔒'}</span><span>Suas credenciais são protegidas por criptografia.</span></div>
            
            {modoTela === 'login' && (
              <form onSubmit={fazerLogin} className="login-form">
                <div className="form-group"><label className="form-label">E-Mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="seu@email.com" /></div>
                <div className="form-group"><label className="form-label">Senha</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="input-field" placeholder="........" /></div>
                <div className="extra-links"><a href="#" onClick={(e) => { e.preventDefault(); alternarTela('esqueci_senha'); }} className="forgot-password-link">Esqueci minha senha</a></div>
                <button type="submit" className="submit-button">ENTRAR</button>
              </form>
            )}

            {modoTela === 'cadastro' && (
              <form onSubmit={fazerCadastro} className="login-form">
                <div className="form-group">
                  <label className="form-label" style={{color: '#ff6600'}}>Como você quer usar o Adote-Me?</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="radio" name="papel" value="Adotante" checked={papelCadastro === 'Adotante'} onChange={(e) => setPapelCadastro(e.target.value)} style={{ accentColor: '#ff6600', transform: 'scale(1.2)' }}/>Quero Adotar</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="radio" name="papel" value="ONG" checked={papelCadastro === 'ONG'} onChange={(e) => setPapelCadastro(e.target.value)} style={{ accentColor: '#ff6600', transform: 'scale(1.2)' }}/>Sou uma ONG / Doador</label>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Nome Completo</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="input-field" placeholder="Ex: Lucas Silva" /></div>
                <div className="form-group"><label className="form-label">E-Mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="seu@email.com" /></div>
                <div className="form-group"><label className="form-label">Crie uma Senha</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="input-field" placeholder="........" minLength="6" /></div>
                <button type="submit" className="submit-button">CRIAR CONTA</button>
              </form>
            )}

            {modoTela === 'esqueci_senha' && (
              <form onSubmit={redefinirSenha} className="login-form">
                <div className="form-group"><label className="form-label">E-Mail Cadastrado</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="seu@email.com" /></div>
                <div className="form-group"><label className="form-label">Nova Senha</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="input-field" placeholder="Digite nova senha" minLength="6" /></div>
                <button type="submit" className="submit-button">SALVAR NOVA SENHA</button>
              </form>
            )}

            {mensagem && <p className={`message ${mensagem.includes('Erro') ? 'error' : 'success'}`}>{mensagem}</p>}
          </div>
        )}
      </main>

      <footer className="adoteme-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>© 2026 Adote-Me</span>
        <div style={{ fontSize: '11px', color: '#666' }}>
          Visão de Teste: 
          <button onClick={() => setPerfilAtivo('Adotante')} style={{ marginLeft: '10px', background: 'none', border: '1px solid #666', color: '#999', cursor: 'pointer' }}>Adotante</button>
          <button onClick={() => setPerfilAtivo('ONG')} style={{ marginLeft: '5px', background: 'none', border: '1px solid #666', color: '#999', cursor: 'pointer' }}>ONG</button>
        </div>
      </footer>
    </div>
  );
}

export default App;