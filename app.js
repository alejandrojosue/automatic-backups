import { exec } from 'child_process';
import cron from 'node-cron';
import fs from 'fs';

// Configuración del directorio de respaldos y errores
const backupDirectory = './backups';
const errorsDirectory = './errors';

// Función para asegurarse de que los directorios existen
const ensureDirectoriesExist = () => {
  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory);
  }

  if (!fs.existsSync(errorsDirectory)) {
    fs.mkdirSync(errorsDirectory);
  }
};

// Comando de respaldo
const getBackupCommand = (timestamp) => {
  return `docker exec container pg_dump -U alejandro --inserts templates_projects > ${backupDirectory}/ccilp-backup-${timestamp}.sql`;
};

// Ruta del archivo de registro de errores
const getErrorLogPath = (timestamp) => {
  return `${errorsDirectory}/error_log-${timestamp}.txt`;
};

// Programa la tarea para ejecutarse cada 2 minutos
cron.schedule('0 2 * * 0', () => {
  ensureDirectoriesExist(); // Verifica y crea los directorios si es necesario
  console.log('Iniciando respaldo de la base de datos...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-'); // Genera el timestamp una sola vez
  const backupCommand = getBackupCommand(timestamp);
  const errorLogPath = getErrorLogPath(timestamp);

  exec(backupCommand, (error, stdout, stderr) => {
    if (error) {
      const errorMessage = `[${new Date().toISOString()}] Error al ejecutar el comando: ${error.message}\n`;
      console.error(errorMessage);
      fs.appendFileSync(errorLogPath, errorMessage);
      return; // Continúa la ejecución sin detener el script
    }
    if (stderr) {
      const stderrMessage = `[${new Date().toISOString()}] stderr: ${stderr}\n`;
      console.error(stderrMessage);
      fs.appendFileSync(errorLogPath, stderrMessage);
      return; // Continúa la ejecución sin detener el script
    }
    console.log('Respaldo completado:', stdout);

    // Ejecutar el comando npm run send con el timestamp como parámetro
    exec(`npm run send -- -d=${timestamp}`, (sendError, sendStdout, sendStderr) => {
      if (sendError) {
        console.error(`Error al ejecutar el comando npm run send: ${sendError.message}`);
        return;
      }
      console.log('Ejecución de email.js:', sendStdout);
      if (sendStderr) {
        console.error(`stderr de email.js: ${sendStderr}`);
      }
    });
  });
});

console.log('Tarea de respaldo semanal programada para el domingo a las 2:00 am.');
