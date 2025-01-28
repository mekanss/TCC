function uploadCSV() {
    const fileInput = document.getElementById('fileToLoad');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, escolha um arquivo CSV.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        alert('Arquivo carregado com sucesso!');
        const csvData = event.target.result;
        processCSV(csvData);
    };

    reader.onerror = function(event) {
        alert('Erro ao ler o arquivo!');
    };

    console.log('Iniciando a leitura do arquivo...');
    reader.readAsText(file);
}

function processCSV(data) {
    console.log('Processando CSV...');
    const lines = data.split('\n').map(line => line.trim()).filter(line => line); // Todas as linhas
    console.log(lines);
    const infos = lines[0].split(',').map(info => info.replace(/"/g, '').trim()); // Primeira linha que contem as infos do TXT
    const headers = lines[1].split(',').map(header => header.replace(/"/g, '').trim()); // Linha que contem as variaveis, como AVG_temp etc
    console.log('Cabeçalhos:', headers);

    const readings = [];

    for (let i = 4; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.replace(/"/g, '').trim()); // Começa a separar os valores pela virgula
        const horario = values[0]; // Pega o horário e data da primeira coluna, isso vai ter um tratamento diferente depois
        console.log('Horário:', horario);
        
        for (let j = 2; j < headers.length; j++) {
            const nomeDado = headers[j];
            const valor = values[j];

            if (valor === "NAN" || valor === "") continue;

            if (valor != ",") {
                const newID = Math.abs(crc32(nomeDado)) % 1000000000;
                readings.push({ // Dando push nos dados, não sei até que ponto é redundante eu ficar mandando o Headerinfo (ID do Sensor)
                    Dado: newID, // Também nao sei se seria melhor ficar dando os fetch aqui, ao inves de mandar pra insertReadings
                    Valor: valor, 
                    Horario: horario, 
                    HeaderInfo: infos[0] // Enviando o primeiro valor do header, que é o "TOA5"
                });
            }
        }
    }
    console.log('Leituras processadas:', readings);
    insertReadings(readings);
}


function postReading(reading) {
    console.log('Dados a serem enviados:', {
        Dado: reading.Dado,
        Valor: reading.Valor,
        Horario: reading.Horario,
        HeaderInfo: reading.HeaderInfo
    });

    return fetch('/leitura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            Dado: reading.Dado,
            Valor: reading.Valor,
            Horario: reading.Horario,
            HeaderInfo: reading.HeaderInfo
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.statusText);
        }
        return response.text();  // Aqui você pode usar text() se a resposta não for JSON
    })
    .then(data => {
        console.log('Resposta da API:', data);
        return data;
    })
    .catch(error => {
        console.error('Erro ao enviar leitura:', error);
    });
}

function insertReadings(readings) {
    readings.forEach(reading => {
        postReading(reading)
            .then(response => {
                return response.text(); // Isso vai tratar qualquer tipo de resposta, seja texto ou HTML
            })
            .then(data => {
                console.log('Leitura inserida:', data); // Exibe a resposta da API
            })
            .catch(error => {
                console.error('Erro:', error); // Exibe erro caso algo dê errado
            });
    });
}


function crc32(str) {
    let crc = 0 ^ (-1);
  
    for (let i = 0; i < str.length; i++) {
      const byte = str.charCodeAt(i);
      crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
    }
  
    return (crc ^ (-1)) >>> 0;
  }
  
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

function addTipoDeDado() {
    var nomeDado = document.getElementById("nomeDado").value;
    var descricaoDado = document.getElementById("descricaoDado").value;

    fetch('/addTipoDeDado', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            nomeDado: nomeDado,
            descricaoDado: descricaoDado
        })
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
    })
    .catch(error => {
        console.error('Erro:', error);
    });
}

function addSensor() {
    var idSensor = document.getElementById("idSensor").value;
    var marca = document.getElementById("marca").value;
    var nome = document.getElementById("nome").value;
    var localizacao = document.getElementById("localizacao").value;

    fetch('/addSensor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            idSensor: idSensor,
            marca: marca,
            nome: nome,
            localizacao: localizacao
        })
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        document.getElementById("addSensorForm").reset();
    })
    .catch(error => {
        console.error('Erro:', error);
    });
}

function addDefeito() {
    var idDefeito = document.getElementById("idDefeito").value;
    var descricaoDefeito = document.getElementById("descricaoDefeito").value;

    fetch('/addDefeito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            idDefeito: idDefeito,
            descricaoDefeito: descricaoDefeito
        })
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        document.getElementById("addDefeitoForm").reset();
    })
    .catch(error => {
        console.error('Erro:', error);
    });
}