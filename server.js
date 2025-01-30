const express = require('express');
const mysql = require('mysql2/promise'); // Usando a versão com promises

const app = express();
const port = 3000;
const Decimal = require('decimal.js');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuração do pool de conexões
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'meteorologia_dados',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function para execução de queries
const query = async (sql, params) => {
  const [results] = await pool.query(sql, params);
  return results;
};

// Middleware para tratamento de erros
const errorHandler = (res, error) => {
  console.error('Erro:', error);
  res.status(500).json({ success: false, message: 'Erro ao processar a solicitação' });
};

// Rotas
app.get('/', (req, res) => {
  res.send('Esta é a pagina root.');
});

app.post('/addTipoDeDado', async (req, res) => {
  try {
    const { nomeDado, descricaoDado } = req.body;
    
    // Verificar existência
    const existing = await query('SELECT ID FROM tipo_de_dado WHERE ID = ?', [nomeDado]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Erro: O ID do dado já existe' });
    }

    // Gerar novo ID
    const newID = Math.abs(crc32(nomeDado)).toString() % 1000000000;

    // Inserir dados
    await query('INSERT INTO tipo_de_dado (ID, Descrição) VALUES (?, ?)', [newID, descricaoDado]);
    
    console.log(`Tipo de dado adicionado: ${nomeDado}`);
    res.json({ success: true, message: 'Tipo de dado adicionado com sucesso' });
  } catch (error) {
    errorHandler(res, error);
  }
});

app.post('/leitura', async (req, res) => {
  try {
    const { Dado, Valor, HeaderInfo, Horario } = req.body;
    const [data, time] = Horario.split(' ');

    // 1. Verificar existência do sensor
    const [sensor] = await query(
      'SELECT 1 FROM sensor WHERE ID_Sensor = ? LIMIT 1', 
      [HeaderInfo]
    );
    
    if (!sensor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sensor não existe' 
      });
    }

    // 2. Verificar existência do tipo de dado
    const [dado] = await query(
      'SELECT 1 FROM tipo_de_dado WHERE ID = ? LIMIT 1', 
      [Dado]
    );
    
    if (!dado) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de dado não existe' 
      });
    }

    // 3. Precisão decimal rigorosa
    const valorDecimal = new Decimal(Valor).toDecimalPlaces(4);

    // 4. Verificação de duplicata aprimorada
    const [existing] = await query(
      `SELECT l.ID_leitura 
       FROM leitura l
       INNER JOIN faz_leitura fl ON l.ID_leitura = fl.ID_Leitura
       WHERE l.Dado = ? 
         AND (l.Valor = ? OR ROUND(l.Valor, 4) = ?)
         AND fl.ID_Sensor = ?
         AND fl.data = ?
         AND fl.Horario = ?
       LIMIT 1`,
      [Dado, Valor, valorDecimal.toNumber(), HeaderInfo, data, time]
    );

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Leitura duplicada encontrada' 
      });
    }

    // 5. Inserção da leitura
    const { insertId } = await query(
      'INSERT INTO leitura (Dado, Valor) VALUES (?, ?)',
      [Dado, valorDecimal.toNumber()]
    );

    // 6. Vincular ao sensor
    await query(
      `INSERT INTO faz_leitura 
        (ID_Sensor, ID_Leitura, ID_Defeito, Horario, data) 
       VALUES (?, ?, 0, ?, ?)`,
      [HeaderInfo, insertId, time, data]
    );

    console.log(`Leitura registrada: ${Valor} (${Dado})`);
    res.json({ 
      success: true, 
      message: 'Leitura registrada com sucesso' 
    });

  } catch (error) {
    errorHandler(res, error);
  }
});

app.post('/addSensor', async (req, res) => {
  try {
    const { idSensor, marca, nome, localizacao } = req.body;

    // Verificar existência
    const existing = await query('SELECT 1 FROM sensor WHERE ID_Sensor = ? LIMIT 1', [idSensor]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'ID do sensor já existe' });
    }

    // Inserir sensor
    await query(
      'INSERT INTO sensor (ID_Sensor, Marca, Nome, Localização) VALUES (?, ?, ?, ?)',
      [idSensor, marca, nome, localizacao]
    );

    console.log(`Sensor adicionado: ${idSensor}`);
    res.json({ success: true, message: 'Sensor adicionado com sucesso' });
  } catch (error) {
    errorHandler(res, error);
  }
});

app.post('/addDefeito', async (req, res) => {
  try {
    const { idDefeito, descricaoDefeito } = req.body;

    // Verificar existência
    const existing = await query('SELECT 1 FROM defeito WHERE ID_defeito = ? LIMIT 1', [idDefeito]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'ID do defeito já existe' });
    }

    // Inserir defeito
    await query(
      'INSERT INTO defeito (ID_defeito, Descrição) VALUES (?, ?)',
      [idDefeito, descricaoDefeito]
    );

    console.log(`Defeito registrado: ${idDefeito}`);
    res.json({ success: true, message: 'Defeito registrado com sucesso' });
  } catch (error) {
    errorHandler(res, error);
  }
});

// Funções CRC32 (mantidas da versão original)
function crc32(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    const byte = str.charCodeAt(i);
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return c;
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
