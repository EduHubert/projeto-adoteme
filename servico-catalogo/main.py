from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware

# ==========================================
# 1. Configuração do Banco de Dados
# ==========================================
# Coloque sua senha do Postgres aqui
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost/db_catalogo"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Tabela de Animais no PostgreSQL
class Animal(Base):
    __tablename__ = "animais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    especie = Column(String, nullable=False)
    raca = Column(String, nullable=False)
    idade = Column(String, nullable=False)
    sexo = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    imagem_url = Column(String, nullable=True) # <--- NOVO CAMPO: Link da foto
    disponivel = Column(Boolean, default=True) 

Base.metadata.create_all(bind=engine)

# ==========================================
# 2. Esquemas de Dados (Pydantic)
# ==========================================
class AnimalCreate(BaseModel):
    nome: str
    especie: str
    raca: str
    idade: str
    sexo: str
    descricao: str
    imagem_url: str = "" # <--- NOVO CAMPO (Vazio por padrão)

# ==========================================
# 3. Inicialização e Dependências
# ==========================================
app = FastAPI(title="Serviço de Catálogo - Adote-Me")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"mensagem": "Serviço de Catálogo está rodando!"}

@app.post("/animais")
def cadastrar_animal(animal: AnimalCreate, db: Session = Depends(get_db)):
    novo_animal = Animal(
        nome=animal.nome,
        especie=animal.especie,
        raca=animal.raca,
        idade=animal.idade,
        sexo=animal.sexo,
        descricao=animal.descricao,
        imagem_url=animal.imagem_url # <--- RECEBE A FOTO AQUI
    )
    db.add(novo_animal)
    db.commit()
    db.refresh(novo_animal)
    return {"mensagem": f"{novo_animal.nome} cadastrado com sucesso!", "id": novo_animal.id}

@app.get("/animais")
def listar_animais(db: Session = Depends(get_db)):
    animais = db.query(Animal).filter(Animal.disponivel == True).all()
    return animais

@app.delete("/animais/{animal_id}")
def excluir_animal(animal_id: int, db: Session = Depends(get_db)):
    # Procura o animal no banco de dados pelo ID
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    
    if not animal:
        raise HTTPException(status_code=404, detail="Animal não encontrado.")
    
    # Se achou, deleta e salva a alteração
    db.delete(animal)
    db.commit()
    
    return {"mensagem": "Anúncio excluído com sucesso!"}