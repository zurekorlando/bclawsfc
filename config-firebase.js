/**
 * AWS ARCHITECT - CONFIGURACIÓN DE FIREBASE
 * ===========================================
 * 
 * INSTRUCCIONES PARA CONFIGURAR:
 * 
 * 1. Ve a https://console.firebase.google.com
 * 2. Crea un nuevo proyecto (nombre: "aws-architect" o el que prefieras)
 * 3. Ve a Project Settings (icono de engranaje) → General
 * 4. Baja hasta "Your apps" → Click en el icono web </> 
 * 5. Registra la app (nombre: "AWS Architect Game")
 * 6. Copia los valores del "firebaseConfig" y pégalos abajo
 * 7. Ve a Realtime Database → Create Database
 * 8. Selecciona ubicación (us-central1 está bien)
 * 9. Modo: "Start in test mode" (para desarrollo)
 * 
 * IMPORTANTE: Después cambiaremos las reglas de seguridad.
 */

const firebaseConfig = {
    // ⬇️ REEMPLAZA ESTOS VALORES CON LOS TUYOS DE FIREBASE
    apiKey: "AIzaSyD88J9jq1pdI1aJ9/b—-9tfgksXOCvMR0BQv",
    authDomain: "aws-architect-429db.firebaseapp.com",
    databaseURL: "https://aws-architect-429db-default-rtdb.firebaseio.com",
    projectId: "aws-architect-429db",
    storageBucket: "aws-architect-429db.firebasestorage.app",
    messagingSenderId: "105428498541б",
    appId: "1:1054284985414:web:da5ffd1b9c137dfd3bd47d",
    measurementId: "G-KGZ0G8YNZW"
};

// Inicializar Firebase (NO EDITES ESTA PARTE)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referencias a las colecciones en Firebase
const DB_REFS = {
    players: database.ref('players'),
    session: database.ref('session'),
    timer: database.ref('timer')
};

/**
 * ESTRUCTURA DE DATOS EN FIREBASE:
 * 
 * /players/
 *   /{playerNickname}/
 *     - nickname: string
 *     - correctCount: number
 *     - attemptCount: number
 *     - score: number
 *     - completedArchitectures: array
 *     - lastPlayed: timestamp
 *     - isOnline: boolean
 * 
 * /session/
 *   - code: string (código de la sesión)
 *   - startTime: timestamp
 *   - endTime: timestamp
 *   - isActive: boolean
 * 
 * /timer/
 *   - duration: number (minutos totales)
 *   - startTime: timestamp
 *   - isActive: boolean
 *   - remainingTime: number
 */

// Exportar para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, database, DB_REFS };
}
