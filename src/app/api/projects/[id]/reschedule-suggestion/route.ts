import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { addDays, dateOnly, inclusiveDays, isIsoDate, todayInGuayaquil } from "@/lib/rescheduling";

interface MilestoneRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  paymentStatus: string;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  ai_summary: string;
  status: string;
  start_date: string | Date;
  end_date: string | Date;
  milestones: MilestoneRow[];
}

const suggestionSchema = z.object({
  summary: z.string().trim().min(10).max(400),
  milestones: z.array(z.object({
    id: z.string().uuid(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().trim().min(8).max(240),
  })).min(1).max(3),
});

const responseJsonSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    milestones: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" },
          reason: { type: "STRING" },
        },
        required: ["id", "startDate", "endDate", "reason"],
      },
    },
  },
  required: ["summary", "milestones"],
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, message: "Identificador de proyecto inválido." }, { status: 400 });
    }

    const result = await pool.query<ProjectRow>(`
      SELECT p.id, p.name, p.description, p.ai_summary, p.status, p.start_date, p.end_date,
        COALESCE(
          json_agg(json_build_object(
            'id', m.id, 'name', m.name, 'startDate', m.start_date, 'endDate', m.end_date,
            'paymentStatus', m.payment_status
          ) ORDER BY m.start_date) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        ) AS milestones
      FROM projects p
      LEFT JOIN milestones m ON m.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    const project = result.rows[0];
    if (!project) {
      return NextResponse.json({ success: false, message: "No se encontró el proyecto." }, { status: 404 });
    }
    if (!["APPROVED", "IN_PROGRESS"].includes(project.status)) {
      return NextResponse.json({ success: false, message: "Solo se pueden reprogramar proyectos aprobados o en curso." }, { status: 409 });
    }

    const today = todayInGuayaquil();
    const milestones = project.milestones.map((milestone) => ({
      ...milestone,
      startDate: dateOnly(milestone.startDate),
      endDate: dateOnly(milestone.endDate),
    }));
    const overdueIndex = milestones.findIndex(
      (milestone) => milestone.endDate < today && milestone.paymentStatus !== "PAID"
    );
    if (overdueIndex < 0) {
      return NextResponse.json({ success: false, message: "Este proyecto no tiene hitos vencidos pendientes de pago." }, { status: 409 });
    }

    const targets = milestones.slice(overdueIndex).filter((milestone) => milestone.paymentStatus !== "PAID");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, message: "Falta configurar GEMINI_API_KEY." }, { status: 503 });
    }

    const targetContext = targets.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      oldStartDate: milestone.startDate,
      oldEndDate: milestone.endDate,
      durationDays: inclusiveDays(milestone.startDate, milestone.endDate),
      paymentStatus: milestone.paymentStatus,
    }));
    const fixedPaidMilestones = milestones
      .filter((milestone) => milestone.paymentStatus === "PAID")
      .map(({ id: milestoneId, name, startDate, endDate }) => ({ id: milestoneId, name, startDate, endDate }));

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Propón una reprogramación para este proyecto sin cambiar el orden de los hitos ni modificar hitos ya pagados.

Proyecto: ${project.name}
Descripción: ${project.description}
Resumen original: ${project.ai_summary}
Fecha actual en Ecuador: ${today}
Los hitos pagados son fechas fijas: ${JSON.stringify(fixedPaidMilestones)}
Hitos pendientes desde el primer vencido: ${JSON.stringify(targetContext)}

Reglas:
- Devuelve exactamente un elemento por cada hito pendiente indicado y conserva cada id.
- El nuevo inicio debe ser mañana o después; conserva la duración inclusiva exacta indicada.
- Mantén el orden cronológico original, evita solapamientos y no cruces las fechas de hitos pagados.
- Puedes extender la fecha final del proyecto si hace falta.
- No cambies nombres, importes ni estados. Explica brevemente el criterio de cada fecha.
- Usa fechas YYYY-MM-DD y responde solo con el JSON del esquema.`,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    if (!response.text) {
      return NextResponse.json({ success: false, message: "Gemini no generó una propuesta." }, { status: 502 });
    }

    let generated: unknown;
    try {
      generated = JSON.parse(response.text);
    } catch {
      return NextResponse.json({ success: false, message: "Gemini devolvió una propuesta inválida." }, { status: 502 });
    }
    const parsed = suggestionSchema.safeParse(generated);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "La propuesta generada no cumple el formato esperado." }, { status: 502 });
    }

    const proposedById = new Map(parsed.data.milestones.map((milestone) => [milestone.id, milestone]));
    const expectedIds = targets.map((milestone) => milestone.id);
    const maxDate = addDays(today, 365);
    if (
      proposedById.size !== expectedIds.length ||
      expectedIds.some((targetId) => !proposedById.has(targetId))
    ) {
      return NextResponse.json({ success: false, message: "La propuesta no incluye exactamente los hitos pendientes." }, { status: 502 });
    }

    const suggestions = targets.map((milestone) => {
      const proposal = proposedById.get(milestone.id)!;
      return {
        id: milestone.id,
        name: milestone.name,
        paymentStatus: milestone.paymentStatus,
        oldStartDate: milestone.startDate,
        oldEndDate: milestone.endDate,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        reason: proposal.reason,
      };
    });

    const scheduled = milestones.map((milestone) => {
      const proposal = proposedById.get(milestone.id);
      return proposal ? { startDate: proposal.startDate, endDate: proposal.endDate } : milestone;
    });
    const validProposal = suggestions.every((suggestion) =>
      isIsoDate(suggestion.startDate) &&
      isIsoDate(suggestion.endDate) &&
      suggestion.startDate >= addDays(today, 1) &&
      suggestion.endDate <= maxDate &&
      inclusiveDays(suggestion.startDate, suggestion.endDate) ===
        inclusiveDays(suggestion.oldStartDate, suggestion.oldEndDate)
    ) && scheduled.every((milestone, index) =>
      index === 0 || milestone.startDate > scheduled[index - 1].endDate
    );

    if (!validProposal) {
      return NextResponse.json({ success: false, message: "Gemini propuso fechas inválidas, solapadas o con duración alterada. Inténtalo nuevamente." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      proposal: {
        projectId: project.id,
        asOf: today,
        summary: parsed.data.summary,
        milestones: suggestions,
      },
    });
  } catch (error) {
    console.error("Error al proponer reprogramación:", error);
    return NextResponse.json({ success: false, message: "No se pudo generar la propuesta de reprogramación." }, { status: 500 });
  }
}
