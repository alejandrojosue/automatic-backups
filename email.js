import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Configuración del directorio de respaldos
const backupDirectory = './backups';
const errorLogPath = path.join(backupDirectory, 'error_log.txt');

// Función para registrar errores en el archivo de log
const logError = (message, dateValue) => {
  const errorMessage = `[${dateValue}] ${message}\n`;
  fs.appendFileSync(errorLogPath, errorMessage);
};

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'sistemaoperativoindependiente@gmail.com',
    pass: 'biyvxblpoqqutson' // Asegúrate de usar un método seguro para manejar contraseñas
  }
});

// Función para enviar el correo con el archivo adjunto
const sendEmail = (backupFilePath, dateValue) => {
  const mailOptions = {
    from: 'sistemaoperativoindependiente@gmail.com',
    to: 'josued.ad13@gmail.com', // Cambia esto por tu dirección de correo
    subject: 'Respaldo de base de datos completado',
    text: `El respaldo de la base de datos se ha completado exitosamente. Archivo de respaldo: ${backupFilePath}`,
    attachments: [
      {
        filename: `ccilp-backup-${new Date().toISOString().replace(/:/g, '-')}.sql`,
        path: backupFilePath // Ruta del archivo de respaldo
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logError('Error al enviar el correo: ' + error, dateValue);
      return;
    }
    console.log('Correo enviado:', info.response);
    
    // Cerrar el programa después de enviar el correo
    process.exit(0);
  });
};

// Obtener la fecha de los argumentos
const args = process.argv.slice(2);
const dateArg = args.find(arg => arg.startsWith('-d='));
const dateValue = dateArg ? dateArg.split('=')[1] : new Date().toISOString().replace(/:/g, '-');

// Genera la ruta del archivo de respaldo
const backupFilePath = `${backupDirectory}/ccilp-backup-${dateValue}.sql`;

// Verifica si el archivo de respaldo existe antes de enviarlo
if (fs.existsSync(backupFilePath)) {
  // Esperar 1 minuto (60000 ms) antes de enviar el correo
  setTimeout(() => {
    sendEmail(backupFilePath, dateValue);
  }, 60000); // 1 minuto
} else {
  logError('El archivo de respaldo no se encontró: ' + backupFilePath, dateValue);
  process.exit(1); // Finaliza el proceso si el archivo no se encuentra
}
