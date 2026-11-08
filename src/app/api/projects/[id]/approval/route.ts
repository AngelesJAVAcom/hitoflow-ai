import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { z } from "zod";

const approvalSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const client = await pool.connect();

  try {
    const { id } = await context.params;

    const uuidSchema = z.string().uuid();

    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, message: "Identificador de proyecto inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = approvalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Acción inválida. Utiliza APPROVE o REJECT.",
        },
        { status: 400 }
      );
    }

    const newStatus =
      validation.data.action === "APPROVE"
        ? "APPROVED"
        : "CANCELLED";

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE projects
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
         AND status = 'PENDING_APPROVAL'
       RETURNING id, name, status`,
      [newStatus, id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message:
            "Proyecto no encontrado o ya no está pendiente de aprobación.",
        },
        { status: 409 }
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message:
        validation.data.action === "APPROVE"
          ? "Proyecto aprobado correctamente."
          : "Proyecto rechazado correctamente.",
      project: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar aprobación:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo actualizar la aprobación del proyecto.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}