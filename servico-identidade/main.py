from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import hashlib
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.middleware.cors import CORSMiddleware # <-- 1. IMPORT DO CORS ADICIONADO AQUI

# ==========================================
# 1. Configurações de Banco e Segurança
# ==========================================
# Troque 'sua_senha_aqui' pela sua password real do Postgres!
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost/db_identidade"

SECRET_KEY = "chave_super_secreta_adoteme"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_criptografada = Column(String, nullable=False)
    papel = Column(String, nullable=False)

Base.metadata.create_all(bind=engine)

# ==========================================
# 2. Esquemas de Dados (Pydantic)
# ==========================================
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    papel: str = "Adotante"

class UsuarioLogin(BaseModel):
    email: str
    senha: str

class UsuarioRedefinir(BaseModel):
    email: str
    nova_senha: str
# ==========================================
# 3. Inicialização e Dependências (CORS CONFIGURADO AQUI)
# ==========================================
app = FastAPI(title="Serviço de Identidade - Adote-Me")

# Configuração do CORS para liberar o acesso do React (Front-end)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite chamadas de qualquer origem (ideal para desenvolvimento)
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (GET, POST, PUT, PATCH, DELETE)
    allow_headers=["*"], # Permite todos os cabeçalhos HTTP
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 4. Rotas da API (Endpoints)
# ==========================================
@app.get("/")
def read_root():
    return {"mensagem": "Serviço de Identidade está rodando perfeitamente!"}

@app.post("/usuarios/registrar")
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado.")

    senha_hash = hashlib.sha256(usuario.senha.encode()).hexdigest()

    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_criptografada=senha_hash,
        papel=usuario.papel
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return {"mensagem": f"Usuário {novo_usuario.nome} cadastrado com sucesso!", "id": novo_usuario.id}

@app.post("/usuarios/login")
def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos.")

    senha_hash = hashlib.sha256(usuario.senha.encode()).hexdigest()
    if senha_hash != db_user.senha_criptografada:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos.")

    dados_token = {
        "sub": str(db_user.id),
        "papel": db_user.papel,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    
    token_jwt = jwt.encode(dados_token, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token_jwt, "token_type": "bearer"}

@app.put("/usuarios/redefinir-senha")
def redefinir_senha(dados: UsuarioRedefinir, db: Session = Depends(get_db)):
    # 1. Procura se o e-mail existe no banco
    db_user = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="E-mail não encontrado no sistema.")

    # 2. Se existir, criptografa a nova senha
    nova_senha_hash = hashlib.sha256(dados.nova_senha.encode()).hexdigest()
    
    # 3. Atualiza no banco de dados e salva
    db_user.senha_criptografada = nova_senha_hash
    db.commit()

    return {"mensagem": "Senha atualizada com sucesso!"}