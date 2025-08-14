import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import atletaRoutes from './routes/atletaRoutes';
import partidaRoutes from './routes/partidaRoutes';
import cardRoutes  from './routes/cardRoutes';

// Carregar variáveis de ambiente antes de tudo
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Rotas com prefixo (boa prática)
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/atleta',atletaRoutes);
app.use('/partida', partidaRoutes);
app.use('/card', cardRoutes);


// Rota raiz
app.get('/', (req, res) => {
  res.send('API Online 🚀');
});

// Tratamento de rota inexistente
app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada aqui' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});



/* import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';



const app = express();
app.use(cors());
dotenv.config();
app.use(express.json());
app.use(authRoutes);  

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API Online 🚀');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
});

 */