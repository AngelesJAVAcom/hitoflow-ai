import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, message: "Ruta de diagnóstico no disponible." },
      { status: 404 }
    );
  }

  try {
    const connection = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS db_user,
        NOW() AS server_time;
    `);

    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const columns = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = current_schema()
      ORDER BY table_name, ordinal_position;
    `);

    const constraints = await pool.query(`
      SELECT
        t.relname AS table_name,
        c.conname AS constraint_name,
        CASE c.contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'c' THEN 'CHECK'
          WHEN 'x' THEN 'EXCLUSION'
          ELSE c.contype::text
        END AS constraint_type,
        pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      INNER JOIN pg_class t
        ON t.oid = c.conrelid
      INNER JOIN pg_namespace n
        ON n.oid = t.relnamespace
      WHERE n.nspname = current_schema()
        AND t.relname IN (
          'projects',
          'milestones',
          'webhook_events'
        )
      ORDER BY t.relname, c.contype, c.conname;
    `);

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM projects) AS total_projects,
        (SELECT COUNT(*) FROM milestones) AS total_milestones,
        (SELECT COUNT(*) FROM webhook_events) AS total_webhook_events;
    `);

    return NextResponse.json({
      success: true,
      connection: connection.rows[0],
      tables: tables.rows,
      columns: columns.rows,
      constraints: constraints.rows,
      counts: counts.rows[0],
    });
  } catch (error) {
    console.error("Error al comprobar la base de datos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error al consultar la base de datos.",
      },
      { status: 500 }
    );
  }
}
