TABELAS:

CREATE TABLE `defeito` (
   `ID_defeito` int NOT NULL DEFAULT '0',
   `Descrição` varchar(45) NOT NULL DEFAULT '',
   PRIMARY KEY (`ID_defeito`),
   UNIQUE KEY `ID_defeito_UNIQUE` (`ID_defeito`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3

 CREATE TABLE `faz_leitura` (
   `ID_Sensor` varchar(45) NOT NULL,
   `ID_Leitura` int NOT NULL,
   `ID_Defeito` int NOT NULL,
   `Horario` time NOT NULL,
   `data` date NOT NULL,
   PRIMARY KEY (`ID_Sensor`,`ID_Leitura`,`ID_Defeito`),
   KEY `ID_Leitura_idx` (`ID_Leitura`),
   KEY `ID_Sensor_idx` (`ID_Sensor`),
   KEY `ID_Defeito_idx` (`ID_Defeito`),
   CONSTRAINT `ID_Defeito` FOREIGN KEY (`ID_Defeito`) REFERENCES `defeito` (`ID_defeito`),
   CONSTRAINT `ID_Leitura` FOREIGN KEY (`ID_Leitura`) REFERENCES `leitura` (`ID_leitura`),
   CONSTRAINT `ID_Sensor` FOREIGN KEY (`ID_Sensor`) REFERENCES `sensor` (`ID_Sensor`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3

 CREATE TABLE `leitura` (
   `ID_leitura` int NOT NULL AUTO_INCREMENT,
   `Dado` int NOT NULL,
   `Valor` varchar(50) DEFAULT NULL,
   PRIMARY KEY (`ID_leitura`),
   UNIQUE KEY `ID_leitura_UNIQUE` (`ID_leitura`),
   KEY `Dados_idx` (`Dado`),
   CONSTRAINT `Dados` FOREIGN KEY (`Dado`) REFERENCES `tipo_de_dado` (`ID`)
 ) ENGINE=InnoDB AUTO_INCREMENT=185637 DEFAULT CHARSET=utf8mb3

 CREATE TABLE `sensor` (
   `ID_Sensor` varchar(20) NOT NULL,
   `Marca` varchar(45) DEFAULT NULL,
   `Nome` varchar(45) DEFAULT NULL,
   `Localização` varchar(45) DEFAULT NULL,
   PRIMARY KEY (`ID_Sensor`),
   UNIQUE KEY `ID_Sensor_UNIQUE` (`ID_Sensor`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3

 CREATE TABLE `tipo_de_dado` (
   `ID` int NOT NULL,
   `Descrição` varchar(150) NOT NULL,
   PRIMARY KEY (`ID`),
   UNIQUE KEY `ID_UNIQUE` (`ID`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3
