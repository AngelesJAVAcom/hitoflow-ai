# HitoFlow AI

**Gestión inteligente de proyectos y pagos por hitos con PayPal.**

HitoFlow AI es un asistente diseñado para freelancers y pequeñas agencias que transforma una descripción informal de un trabajo en un plan organizado de hitos, fechas e importes. Cada hito se relaciona con una factura de PayPal, permitiendo que el cronograma del proyecto responda al estado real de los pagos.

## Objetivo del proyecto

Facilitar la planificación y el seguimiento de proyectos, vinculando el avance de cada etapa con el cumplimiento de sus pagos.

## Funcionalidades previstas

- Generación de planes de trabajo mediante inteligencia artificial.
- Organización de proyectos en un máximo de tres hitos para el MVP.
- Asignación de fechas e importes a cada hito.
- Visualización del cronograma mediante Bryntum Gantt.
- Creación y envío de facturas mediante PayPal Sandbox.
- Actualización del estado de los hitos según los pagos recibidos.
- Propuesta de recordatorios y reprogramaciones cuando una factura esté vencida.
- Revisión y aprobación humana antes de ejecutar acciones importantes.

## Tecnologías

- **Frontend y aplicación:** Next.js, React y TypeScript.
- **Estilos:** Tailwind CSS.
- **Backend:** rutas API de Next.js y Node.js.
- **Validación:** Zod.
- **Pagos:** PayPal Invoicing API (Sandbox).
- **Cronograma:** Bryntum Gantt.
- **Base de datos prevista:** PostgreSQL.
- **Inteligencia artificial prevista:** OpenAI o Gemini.

## Estado actual del desarrollo

La primera etapa de desarrollo contempla:

- Proyecto Next.js inicializado.
- Repositorio Git y ramas de desarrollo configurados.
- Variables de entorno preparadas para PayPal Sandbox.
- Endpoint de autenticación OAuth 2.0 implementado y probado.
- Endpoint para crear facturas implementado; pendiente de validación mediante una factura de prueba en Sandbox.

Las funcionalidades de inteligencia artificial, cronograma, persistencia de datos y sincronización de estados se desarrollarán progresivamente.

## Requisitos previos

- Node.js.
- npm.
- Una cuenta de desarrollador de PayPal con credenciales Sandbox.

## Instalación

Clona el repositorio:

```bash
git clone https://github.com/AngelesJAVAcom/hitoflow-ai.git
```

Ingresa a la carpeta:

```bash
cd hitoflow-ai
```

Instala las dependencias:

```bash
npm install
```

## Configuración de variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
PAYPAL_CLIENT_ID=TU_CLIENT_ID_SANDBOX
PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET_SANDBOX
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Reemplaza los valores de ejemplo por tus credenciales Sandbox.

**Importante:** No compartas ni publiques el archivo `.env.local`, el Client Secret ni otras credenciales. Las operaciones de PayPal deben ejecutarse desde el backend.

## Ejecución local

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre en el navegador:

```text
http://localhost:3000
```

## Endpoints disponibles

| Método | Endpoint | Propósito |
|---|---|---|
| POST | `/api/paypal/token` | Obtener un token OAuth 2.0 de PayPal |
| POST | `/api/paypal/invoices` | Solicitar la creación de una factura |

## Seguridad

- Utilizar exclusivamente PayPal Sandbox durante el desarrollo.
- Mantener las credenciales en variables de entorno.
- No exponer tokens ni secretos en el frontend.
- Validar los datos recibidos desde el cliente en el servidor.
- Requerir aprobación humana para acciones relevantes del proyecto.

## Equipo de desarrollo

Proyecto desarrollado por Ángeles y Makk para la PayPal AI Hackathon 2026.

## Licencia

Pendiente de definir y agregar antes de la entrega pública del repositorio.




