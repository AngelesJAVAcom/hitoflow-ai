import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { dateOnly, inclusiveDays, isIsoDate, todayInGuayaquil } from "@/lib/rescheduling";

const applySchema = z.object({
  milestones: z.array(z.object({
    id: z.string().uuid(),
    oldStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    oldEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })).min(1).max(3),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, message: "Identificador de proyecto inválido." }, { status: 400 });
    }

    const parsed = applySchema.safeParse(await request.json());
    if (!parsed.success || new Set(parsed.data?.milestones.map((milestone) => milestone.id)).size !== parsed.data?.milestones.length) {
      return NextResponse.json({ success: false, message: "La propuesta de fechas no es válida." }, { status: 400 });
    }

    const proposal = parsed.data.milestones;
    if (proposal.some((milestone) =>
      !isIsoDate(milestone.oldStartDate) ||
      !isIsoDate(milestone.oldEndDate) ||
      !isIsoDate(milestone.startDate) ||
      !isIsoDate(milestone.endDate) ||
      milestone.startDate < todayInGuayaquil() ||
      inclusiveDays(milestone.oldStartDate, milestone.oldEndDate) !== inclusiveDays(milestone.startDate, milestone.endDate)
    )) {
      return NextResponse.json({ success: false, message: "Las fechas deben ser válidas, no estar vencidas y conservar la duración de cada hito." }, { status: 400 });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const projectResult = await client.query(
      "SELECT id, status, start_date, end_date, duration_days FROM projects WHERE id = $1 FOR UPDATE",
      [id]
    );
    const project = projectResult.rows[0];
    if (!project || !["APPROVED", "IN_PROGRESS"].includes(project.status)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return NextResponse.json({ success: false, message: "El proyecto ya no se puede reprogramar." }, { status: 409 });
    }

    const milestoneResult = await client.query(
      `SELECT id, start_date, end_date, payment_status
       FROM milestones WHERE project_id = $1 ORDER BY start_date FOR UPDATE`,
      [id]
    );
    const rows = milestoneResult.rows.map((row) => ({ ...row, start_date: dateOnly(row.start_date), end_date: dateOnly(row.end_date) }));
    const today = todayInGuayaquil();
    const overdueIndex = rows.findIndex((row) => row.end_date < today && row.payment_status !== "PAID");
    const expectedIds = overdueIndex < 0
      ? []
      : rows.slice(overdueIndex).filter((row) => row.payment_status !== "PAID").map((row) => row.id);
    const proposalById = new Map(proposal.map((item) => [item.id, item]));

    if (expectedIds.length !== proposal.length || expectedIds.some((expectedId) => !proposalById.has(expectedId))) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return NextResponse.json({ success: false, message: "La lista de hitos vencidos cambió. Actualiza el cronograma y genera otra propuesta." }, { status: 409 });
    }

    for (const item of proposal) {
      const current = rows.find((row) => row.id === item.id);
      if (!current || current.payment_status === "PAID" || current.start_date !== item.oldStartDate || current.end_date !== item.oldEndDate) {
        await client.query("ROLLBACK");
        transactionStarted = false;
        return NextResponse.json({ success: false, message: "El estado o las fechas de un hito cambiaron. Genera una propuesta actualizada." }, { status: 409 });
      }
    }

    const revised = rows.map((row) => {
      const item = proposalById.get(row.id);
      return item ? { startDate: item.startDate, endDate: item.endDate } : { startDate: row.start_date, endDate: row.end_date };
    });
    if (revised.some((item, index) => index > 0 && item.startDate <= revised[index - 1].endDate)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return NextResponse.json({ success: false, message: "La propuesta se cruza con otro hito del proyecto." }, { status: 409 });
    }

    for (const item of proposal) {
      const updated = await client.query(
        `UPDATE milestones
         SET start_date = $1, end_date = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND project_id = $4 AND payment_status <> 'PAID'
         RETURNING id`,
        [item.startDate, item.endDate, item.id, id]
      );
      if (updated.rowCount !== 1) throw new Error("No se pudo actualizar un hito pendiente.");
    }

    const newProjectEnd = revised.reduce((latest, item) => item.endDate > latest ? item.endDate : latest, dateOnly(project.end_date));
    const startDate = dateOnly(project.start_date);
    const durationDays = inclusiveDays(startDate, newProjectEnd);
    await client.query(
      `UPDATE projects
       SET end_date = $1, duration_days = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newProjectEnd, durationDays, id]
    );

    await client.query("COMMIT");
    transactionStarted = false;
    return NextResponse.json({ success: true, message: "Se aplicó la reprogramación aprobada.", projectId: id, endDate: newProjectEnd });
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    console.error("Error al aplicar reprogramación:", error);
    return NextResponse.json({ success: false, message: "No se pudieron actualizar las fechas del proyecto." }, { status: 500 });
  } finally {
    client.release();
  }
}
