import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { Pool } = pg;
const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({ ...connectionConfig, max: 1, connectionTimeoutMillis: 10000 });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Setting up demo projects according to HitoFlow AI plan...");

    // Delete existing demo projects if any to allow idempotent re-seeding
    await client.query("DELETE FROM projects WHERE name IN ('Tienda Aurora', 'Identidad Café Norte')");

    // 1. Proyecto 1: Tienda Aurora (Recorrido Feliz)
    const auroraResult = await client.query(`
      INSERT INTO projects (
        name,
        description,
        total_amount,
        duration_days,
        start_date,
        end_date,
        ai_summary,
        status
      ) VALUES (
        'Tienda Aurora',
        'Desarrollo de tienda en línea para repostería y café con catálogo interactivo y pasarela de pago PayPal.',
        1200.00,
        30,
        '2026-11-09',
        '2026-12-08',
        'Plan integral de 3 entregables para la tienda Aurora: estructura base y catálogo, pasarela de pago, y puesta en marcha final.',
        'APPROVED'
      ) RETURNING id
    `);
    const auroraId = auroraResult.rows[0].id;

    await client.query(`
      INSERT INTO milestones (
        project_id,
        name,
        description,
        percentage,
        amount,
        start_date,
        end_date,
        status,
        payment_status
      ) VALUES
        ($1, 'Arquitectura base y catálogo de productos', 'Estructura inicial, catálogo de productos y carrito de compras.', 30.00, 360.00, '2026-11-09', '2026-11-18', 'PENDING', 'NOT_INVOICED'),
        ($1, 'Integración de pasarela de pago y pedidos', 'Módulo de checkout con PayPal y gestión de pedidos.', 40.00, 480.00, '2026-11-19', '2026-11-28', 'PENDING', 'NOT_INVOICED'),
        ($1, 'Pruebas finales y despliegue', 'Control de calidad, pruebas de usuario y puesta en producción.', 30.00, 360.00, '2026-11-29', '2026-12-08', 'PENDING', 'NOT_INVOICED')
    `, [auroraId]);

    console.log("✓ Project 'Tienda Aurora' created (Ready for invoice creation & payment walkthrough).");

    // 2. Proyecto 2: Identidad Café Norte (Caso de Hito Vencido y Reprogramación con IA)
    const cafeResult = await client.query(`
      INSERT INTO projects (
        name,
        description,
        total_amount,
        duration_days,
        start_date,
        end_date,
        ai_summary,
        status
      ) VALUES (
        'Identidad Café Norte',
        'Creación de identidad visual completa, empaques y manual de marca para cafetería de especialidad.',
        800.00,
        25,
        '2026-10-18',
        '2026-11-11',
        'Propuesta estructurada en 3 hitos: concepto e investigación (pagado), diseño de identidad y packaging (vencido pendiente de pago), y entrega de manual final.',
        'APPROVED'
      ) RETURNING id
    `);
    const cafeId = cafeResult.rows[0].id;

    await client.query(`
      INSERT INTO milestones (
        project_id,
        name,
        description,
        percentage,
        amount,
        start_date,
        end_date,
        status,
        payment_status,
        paypal_invoice_id
      ) VALUES
        ($1, 'Investigación y concepto de marca', 'Benchmark, arquetipo de marca y moodboard conceptual.', 30.00, 240.00, '2026-10-18', '2026-10-26', 'COMPLETED', 'PAID', NULL),
        ($1, 'Diseño de identidad visual y empaques', 'Logotipo, paleta cromática, tipografías y diseño de empaques para café en grano.', 40.00, 320.00, '2026-10-27', '2026-11-04', 'IN_PROGRESS', 'UNPAID', NULL),
        ($1, 'Manual de marca y entrega de recursos', 'Guía de uso normativo y exportación de piezas finales en alta resolución.', 30.00, 240.00, '2026-11-05', '2026-11-11', 'PENDING', 'NOT_INVOICED', NULL)
    `, [cafeId]);

    console.log("✓ Project 'Identidad Café Norte' created (With milestone 2 overdue & unpaid, ready for AI rescheduling demo).");

    await client.query("COMMIT");
    console.log("Seeding completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
