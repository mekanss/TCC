const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));



// Rota para a raiz, aqui eu penso que minha pagina provavelmente não será a principal no produto finalizado, então deixo ela como file ao inves de index.
app.get('/', (req, res) => {
    res.send('Esta é a pagina root.');
  });
  

// Configurações do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'meteorologia_dados'
};

app.post('/addTipoDeDado', async (req, res) => {
  const { nomeDado, descricaoDado } = req.body;
  const connection = mysql.createConnection(dbConfig);

  // Função de conexão e consulta
  const connectToDatabase = () => {
    return new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  };

  try {
    await connectToDatabase();

    // Verificar se o nome do dado já existe
    const checkResults = await queryDatabase('SELECT ID FROM tipo_de_dado WHERE ID = ?', [nomeDado]);
    if (checkResults.length > 0) {
      return res.status(400).send('Erro: O ID do dado já existe.');
    }

    // Gerar um novo ID baseado no nome
    const newID = Math.abs(crc32(nomeDado)).toString() % 1000000000;

    // Inserir o novo tipo de dado
    await queryDatabase('INSERT INTO tipo_de_dado (ID, Descrição) VALUES (?, ?)', [newID, descricaoDado]);

    console.log(`Tipo de dado adicionado com sucesso: ${nomeDado}`);
    res.send('Tipo de dado adicionado com sucesso.');
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro ao processar a solicitação.');
  } finally {
    connection.end();
  }
});

// So preciso ver precisao de numeros inteiros? Por exemplo o 2015
app.post('/leitura', async (req, res) => {
  const { Dado, Valor, HeaderInfo, Horario } = req.body;
  const [data, time] = Horario.split(' '); // Dividindo data e hora

  const connection = mysql.createConnection(dbConfig);

  const connectToDatabase = () => {
    return new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  };

  try {
    await connectToDatabase();

    // Verificando se o sensor existe
    const sensorResults = await queryDatabase('SELECT * FROM sensor WHERE ID_Sensor = ?', [HeaderInfo]);
    if (sensorResults.length === 0) {
      return res.status(400).send('Sensor não existe');
    }

    // Verificando se o tipo de dado existe
    const dadoResults = await queryDatabase('SELECT * FROM tipo_de_dado WHERE ID = ?', [Dado]);
    if (dadoResults.length === 0) {
      return res.status(400).send('Tipo de dado não existe');
    }

    // Converter e arredondar o valor para 4 casas decimais
    const roundedValor = parseFloat(Valor).toFixed(4);

    // Verificar se já existe uma leitura com o mesmo Dado e Valor (arredondado)
    const leituraCheck = await queryDatabase(
      'SELECT ID_leitura FROM leitura WHERE Dado = ? AND ROUND(Valor, 4) = ?',
      [Dado, roundedValor]
    );

    const leituraCheck2 = await queryDatabase(
      'SELECT ID_leitura FROM leitura WHERE Dado = ? AND Valor = ?',
      [Dado, Valor]
    );

    if (leituraCheck.length > 0 || leituraCheck2.length > 0) {
      let existingLeituraId = null;

      // Verifica se encontrou um resultado em leituraCheck
      if (leituraCheck.length > 0) {
        existingLeituraId = leituraCheck[0].ID_leitura;
      }
    
      // Verifica se encontrou um resultado em leituraCheck2
      if (leituraCheck2.length > 0) {
        existingLeituraId = leituraCheck2[0].ID_leitura;
      }

      // Verificar se já existe uma entrada em faz_leitura com o mesmo ID_Sensor, ID_Leitura, Horario e data
      const duplicateCheck = await queryDatabase(
        'SELECT * FROM faz_leitura WHERE ID_Sensor = ? AND ID_Leitura = ? AND Horario = ? AND data = ?',
        [HeaderInfo, existingLeituraId, time, data]
      );

      if (duplicateCheck.length > 0) {
        //console.log(`Leitura duplicada encontrada: ID_leitura = ${existingLeituraId}, Dado = ${Dado}, Valor = ${roundedValor}`);
        return res.status(400).send('Leitura duplicada encontrada');
      }
    }

    // Inserir na tabela leitura se não houver duplicata
    const leituraResults = await queryDatabase(
      'INSERT INTO leitura (ID_leitura, Dado, Valor) VALUES (NULL, ?, ?)',
      [Dado, Valor]
    );

    const lastInsertId = leituraResults.insertId;

    // Inserir na tabela faz_leitura
    await queryDatabase(
      'INSERT INTO faz_leitura (ID_Sensor, ID_Leitura, ID_Defeito, Horario, data) VALUES (?, ?, 0, ?, ?)',
      [HeaderInfo, lastInsertId, time, data]
    );

    console.log(`Faz_leitura inserido com sucesso Valor = ${Valor}, Dado = ${Dado}`);
    res.send('Leitura e faz_leitura inseridos com sucesso.');

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro ao processar a solicitação.');
  } finally {
    connection.end();
  }
});





// Rota para adicionar sensor
app.post('/addSensor', async (req, res) => {
  const { idSensor, marca, nome, localizacao } = req.body;
  const connection = mysql.createConnection(dbConfig);

  const connectToDatabase = () => {
    return new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  };

  try {
    await connectToDatabase();

    // Verificar se o ID do sensor já existe
    const checkResults = await queryDatabase('SELECT ID_Sensor FROM sensor WHERE ID_Sensor = ?', [idSensor]);
    if (checkResults.length > 0) {
      return res.status(400).send('Erro: O ID do sensor já existe.');
    }

    // Inserir o novo sensor
    await queryDatabase('INSERT INTO sensor (ID_Sensor, Marca, Nome, Localização) VALUES (?, ?, ?, ?)', [idSensor, marca, nome, localizacao]);

    console.log(`Sensor adicionado com sucesso: ${idSensor}`);
    res.send('Sensor adicionado com sucesso.');
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro ao processar a solicitação.');
  } finally {
    connection.end();
  }
});


// Rota para adicionar defeito
app.post('/addDefeito', async (req, res) => {
  const { idDefeito, descricaoDefeito } = req.body;
  const connection = mysql.createConnection(dbConfig);

  const connectToDatabase = () => {
    return new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const queryDatabase = (query, params) => {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  };

  try {
    await connectToDatabase();

    // Verificar se o ID do defeito já existe
    const checkResults = await queryDatabase('SELECT ID_defeito FROM defeito WHERE ID_defeito = ?', [idDefeito]);
    if (checkResults.length > 0) {
      return res.status(400).send('Erro: O ID do defeito já existe.');
    }

    // Inserir o novo defeito
    await queryDatabase('INSERT INTO defeito (ID_defeito, Descrição) VALUES (?, ?)', [idDefeito, descricaoDefeito]);

    console.log(`Defeito adicionado com sucesso: ${idDefeito}`);
    res.send('Defeito adicionado com sucesso.');
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro ao processar a solicitação.');
  } finally {
    connection.end();
  }
});

// Função para calcular o CRC32
function crc32(str) {
  let crc = 0 ^ (-1);

  for (let i = 0; i < str.length; i++) {
    const byte = str.charCodeAt(i);
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
  }

  return (crc ^ (-1)) >>> 0;
}

// Tabela CRC32
const table = (() => {
  let c;
  const crcTable = [];

  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  return crcTable;
})();

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});