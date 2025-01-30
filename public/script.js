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
    const lines = data.split('\n').map(line => line.trim()).filter(line => line);
    const infos = lines[0].split(',').map(info => info.replace(/"/g, '').trim());
    const headers = lines[1].split(',').map(header => header.replace(/"/g, '').trim());

    const readings = [];

    for (let i = 4; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.replace(/"/g, '').trim());
        const horario = values[0];
        
        // Ajuste no índice das colunas de valores
        for (let j = 2; j < headers.length; j++) {
          const nomeDado = headers[j];
          const valor = values[j];
    
          // Validação numérica no frontend
          if (valor === "NAN" || valor === "" || isNaN(valor)) continue;
    
          const newID = Math.abs(crc32(nomeDado)) % 1000000000;
          readings.push({
            Dado: newID,
            Valor: parseFloat(valor), // Conversão explícita
            Horario: horario,
            HeaderInfo: infos[0]
          });
        }
    }
    console.log('Leituras processadas:', readings);
    insertReadings(readings);
}

function postReading(reading) {
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
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro desconhecido');
        }
        return data;
    })
    .then(data => {
        console.log('Resposta da API:', data.message);
        return data;
    })
    .catch(error => {
        console.error('Erro ao enviar leitura:', error.message);
        throw error;
    });
}

async function insertReadings(readings) {
    try {
        const results = await Promise.allSettled(
            readings.map(reading => postReading(reading))
        );
        
        const errors = results.filter(r => r.status === 'rejected');
        const successCount = results.length - errors.length;

        if (errors.length > 0) {
            console.error('Erros ocorridos:', errors);
            alert(`${successCount} leituras inseridas com sucesso\n` +
                  `${errors.length} erros ocorreram. Verifique o console para detalhes.`);
        } else {
            alert(`${successCount} leituras inseridas com sucesso`);
        }
    } catch (error) {
        console.error('Erro geral:', error);
    }
}

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

function addTipoDeDado() {
    const nomeDado = document.getElementById("nomeDado").value;
    const descricaoDado = document.getElementById("descricaoDado").value;

    fetch('/addTipoDeDado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            nomeDado: nomeDado,
            descricaoDado: descricaoDado
        })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        return data;
    })
    .then(data => {
        alert(data.message);
        document.getElementById("addTipoDeDadoForm").reset();
    })
    .catch(error => {
        alert(error.message);
        console.error('Erro:', error);
    });
}

function addSensor() {
    const idSensor = document.getElementById("idSensor").value;
    const marca = document.getElementById("marca").value;
    const nome = document.getElementById("nome").value;
    const localizacao = document.getElementById("localizacao").value;

    fetch('/addSensor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            idSensor: idSensor,
            marca: marca,
            nome: nome,
            localizacao: localizacao
        })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        return data;
    })
    .then(data => {
        alert(data.message);
        document.getElementById("addSensorForm").reset();
    })
    .catch(error => {
        alert(error.message);
        console.error('Erro:', error);
    });
}

function addDefeito() {
    const idDefeito = document.getElementById("idDefeito").value;
    const descricaoDefeito = document.getElementById("descricaoDefeito").value;

    fetch('/addDefeito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            idDefeito: idDefeito,
            descricaoDefeito: descricaoDefeito
        })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        return data;
    })
    .then(data => {
        alert(data.message);
        document.getElementById("addDefeitoForm").reset();
    })
    .catch(error => {
        alert(error.message);
        console.error('Erro:', error);
    });
}
