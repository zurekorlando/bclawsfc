/**
 * AWS ARCHITECT - ARCHIVO DE CONFIGURACIÓN
 * ===========================================
 * Aquí puedes editar todas las URLs, arquitecturas, componentes y textos del juego
 * sin necesidad de tocar el código principal.
 */

const CONFIG = {
    // ==========================================
    // ARQUITECTURAS DE REFERENCIA
    // ==========================================
    architectures: [
        {
            name: "Serverless Web App",
            icon: "🚀",
            // ⬇️ EDITA AQUÍ LA URL DE REFERENCIA
            referenceUrl: "https://aws.amazon.com/architecture/reference-architecture-diagrams/?solutions-all.sort-by=item.additionalFields.sortDate&solutions-all.sort-order=desc&whitepapers-main.sort-by=item.additionalFields.sortDate&whitepapers-main.sort-order=desc&awsf.whitepapers-tech-category=tech-category%23serverless",
            description: "Arquitectura serverless usando API Gateway, Lambda y DynamoDB",
            useCase: {
                title: "Sistema de Reservas Online",
                scenario: "Nury tiene una cadena hotelera y necesita un sistema de reservas que escale automáticamente durante temporada alta, sin pagar por servidores ociosos en temporada baja. La solución debe ser de bajo costo operacional y alta disponibilidad.",
                benefits: "✓ Pago por uso ✓ Escalabilidad automática ✓ Zero mantenimiento de servidores ✓ Alta disponibilidad"
            },
            slots: [
                { id: "api", label: "API Layer", correct: "API Gateway" },
                { id: "compute", label: "Compute", correct: "Lambda" },
                { id: "database", label: "Database", correct: "DynamoDB" }
            ]
        },
        {
            name: "Microservices Platform",
            icon: "🔧",
            // ⬇️ EDITA AQUÍ LA URL DE REFERENCIA
            referenceUrl: "https://aws.amazon.com/architecture/microservices/",
            description: "Plataforma de microservicios con containers y balanceo de carga",
            useCase: {
                title: "Plataforma de E-commerce",
                scenario: "Mario tiene una empresa de aguacate Hass y la promociona en una plataforma de comercio electrónico, pero Mario necesita separar sus servicios (catálogo, carrito, pagos, inventario) para que equipos independientes puedan desarrollar y desplegar sin afectar a otros. Requiere alta disponibilidad y capacidad de escalar servicios específicos según demanda.",
                benefits: "✓ Despliegue independiente ✓ Escalabilidad por servicio ✓ Resiliencia ✓ Tecnologías heterogéneas"
            },
            slots: [
                { id: "loadbalancer", label: "Load Balancer", correct: "ALB" },
                { id: "container", label: "Container Service", correct: "ECS" },
                { id: "database", label: "Database", correct: "RDS" },
                { id: "cache", label: "Cache", correct: "ElastiCache" }
            ]
        },
        {
            name: "Static Website",
            icon: "📱",
            // ⬇️ EDITA AQUÍ LA URL DE REFERENCIA
            referenceUrl: "https://aws.amazon.com/getting-started/hands-on/host-static-website/",
            description: "Sitio web estático con CDN y almacenamiento en S3",
            useCase: {
                title: "Portal Corporativo Global",
                scenario: "Cristian necesita publicar su sitio web corporativo (HTML, CSS, JS) con presencia en múltiples regiones del Oriente medio, entrega ultra-rápida de contenido, certificado SSL y costos mínimos de hosting. El contenido es principalmente estático con actualizaciones ocasionales.",
                benefits: "✓ Distribución global ✓ Ultra bajo costo ✓ Alta velocidad ✓ HTTPS incluido"
            },
            slots: [
                { id: "dns", label: "DNS", correct: "Route 53" },
                { id: "cdn", label: "CDN", correct: "CloudFront" },
                { id: "storage", label: "Storage", correct: "S3" }
            ]
        },
        {
            name: "Data Pipeline",
            icon: "📊",
            // ⬇️ EDITA AQUÍ LA URL DE REFERENCIA
            referenceUrl: "https://aws.amazon.com/architecture/analytics-big-data/",
            description: "Pipeline de datos con procesamiento serverless y streaming",
            useCase: {
                title: "Analytics de IoT en Tiempo Real",
                scenario: "Una empresa de logística tiene 10,000 sensores en camiones cargados con el Café de Origen de Aleja, estos envian datos cada segundo (temperatura, ubicación, combustible). Necesitan procesar este streaming de datos en tiempo real, almacenarlos para análisis histórico y generar reportes ejecutivos.",
                benefits: "✓ Procesamiento en tiempo real ✓ Almacenamiento escalable ✓ Analytics avanzados ✓ Bajo costo"
            },
            slots: [
                { id: "source", label: "Data Source", correct: "S3" },
                { id: "processing", label: "Processing", correct: "Lambda" },
                { id: "streaming", label: "Streaming", correct: "Kinesis" },
                { id: "warehouse", label: "Data Warehouse", correct: "Redshift" }
            ]
        },
        {
            name: "Three-Tier Application",
            icon: "🏗️",
            // ⬇️ EDITA AQUÍ LA URL DE REFERENCIA
            referenceUrl: "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/three-tier-architecture.html",
            description: "Aplicación de tres capas clásica con balanceador, compute y base de datos",
            useCase: {
                title: "Sistema ERP Empresarial",
                scenario: "Una empresa manufacturera necesita migrar su sistema ERP legacy a la nube, y sabe que hay una experta en SAP en el equipo de arquitectura de funciones corporativas. La aplicación requiere alta disponibilidad, balanceo de carga entre múltiples servidores, base de datos relacional con backups automáticos y capacidad de crecer conforme aumenten los usuarios.",
                benefits: "✓ Alta disponibilidad ✓ Separación de capas ✓ Escalabilidad controlada ✓ Backups automáticos"
            },
            slots: [
                { id: "loadbalancer", label: "Load Balancer", correct: "ELB" },
                { id: "compute", label: "Compute", correct: "EC2" },
                { id: "database", label: "Database", correct: "RDS" }
            ]
        }
    ],

    // ==========================================
    // COMPONENTES AWS DISPONIBLES
    // ==========================================
    awsComponents: [
        { name: "API Gateway", icon: "🔌" },
        { name: "Lambda", icon: "λ" },
        { name: "DynamoDB", icon: "🗄️" },
        { name: "ALB", icon: "⚖️" },
        { name: "ECS", icon: "🐳" },
        { name: "RDS", icon: "🗃️" },
        { name: "ElastiCache", icon: "⚡" },
        { name: "Route 53", icon: "🌐" },
        { name: "CloudFront", icon: "☁️" },
        { name: "S3", icon: "🪣" },
        { name: "Kinesis", icon: "🌊" },
        { name: "Redshift", icon: "📊" },
        { name: "ELB", icon: "🔀" },
        { name: "EC2", icon: "💻" }
    ],

    // ==========================================
    // TEXTOS DE LA INTERFAZ
    // ==========================================
    texts: {
        mainTitle: "AWS ARCHITECT",
        subtitle: "Construye la arquitectura correcta",
        componentsTitle: "⚡ Componentes AWS",
        loginTitle: "🎮 BIENVENIDO",
        loginSubtitle: "Ingresa tu nickname para comenzar",
        loginPlaceholder: "Tu nickname aquí...",
        startButtonText: "🚀 COMENZAR A JUGAR",
        verifyButton: "🎯 Verificar",
        resetButton: "🔄 Reset",
        leaderboardTitle: "🏆 RANKING",
        adminTitle: "🎯 PANEL DE ADMINISTRACIÓN",
        
        // Mensajes de feedback
        correctMessage: "¡CORRECTO! 🎉",
        incorrectMessage: "Incorrecto. Intenta de nuevo",
        missingComponentsMessage: "¡Faltan componentes!",
        allCompletedMessage: "¡Completaste todas las arquitecturas! 🏆",
        
        // Instrucciones
        instructions: [
            "📦 Arrastra componentes a los slots",
            "✕ Click en un componente para quitarlo",
            "🎯 Verifica tu arquitectura"
        ],
        
        // Admin panel
        adminStats: {
            totalPlayers: "Jugadores",
            totalAttempts: "Intentos Totales",
            avgScore: "Score Promedio",
            completions: "Arquitecturas Completadas"
        }
    },

    // ==========================================
    // CONFIGURACIÓN DE COLORES (CSS Variables)
    // ==========================================
    colors: {
        awsOrange: "#FF9900",
        awsDark: "#232F3E",
        neonGreen: "#00ff41",
        neonRed: "#ff0040",
        electricBlue: "#00d4ff",
        gridColor: "rgba(255, 153, 0, 0.1)"
    },

    // ==========================================
    // CONFIGURACIÓN DEL JUEGO
    // ==========================================
    gameSettings: {
        minNicknameLength: 2,
        maxNicknameLength: 20,
        correctFeedbackDuration: 4000, // milisegundos
        incorrectFeedbackDuration: 2000, // milisegundos
        autoScrollThreshold: 100, // píxeles desde el borde
        autoScrollSpeed: 10,
        nextArchitectureDelay: 4000 // milisegundos después de respuesta correcta
    },

    // ==========================================
    // STORAGE KEYS (LocalStorage)
    // ==========================================
    storageKeys: {
        players: "awsArchitectPlayers",
        sessionCode: "awsArchitectSessionCode"
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
