import { saveProject } from "@/lib/projects";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validación de los datos que recibirá nuestro endpoint.
const projectInputSchema = z.object({
  projectName: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().min(3).max(150).optional()
  ),
  projectDescription: z.string().trim().min(20).max(3000),
  totalAmount: z.number().positive().max(100000),
  durationDays: z.number().int().min(1).max(365),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Validación de cada hito generado por Gemini.
const milestoneSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().min(10).max(500),
  percentage: z.number().positive().max(100),
  amount: z.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Validación del plan completo.
const planSchema = z.object({
  summary: z.string().min(10).max(500),
  milestones: z.array(milestoneSchema).min(1).max(3),
});

// Esquema JSON solicitado a Gemini.
const responseSchema = {
  type: "OBJECT",
  properties: {
    summary: {
      type: "STRING",
      description: "Resumen general del plan de trabajo.",
    },
    milestones: {
      type: "ARRAY",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          percentage: { type: "NUMBER" },
          amount: { type: "NUMBER" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" },
        },
        required: [
          "name",
          "description",
          "percentage",
          "amount",
          "startDate",
          "endDate",
        ],
      },
    },
  },
  required: ["summary", "milestones"],
};

// Obtener el código HTTP del error de Gemini.
function getGeminiStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const status = Number((error as { status?: unknown }).status);

  return Number.isFinite(status) ? status : undefined;
}

// Identificar errores temporales que permiten reintentos.
function isRetryableGeminiError(error: unknown): boolean {
  const status = getGeminiStatus(error);

  return [500, 502, 503, 504].includes(status ?? 0);
}

// Ejecutar una solicitud con un máximo de dos reintentos.
async function generateWithRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  const delays = [2000, 4000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // No reintentar cuando se agotó la cuota.
      if (getGeminiStatus(error) === 429) {
        throw error;
      }

      const shouldRetry =
        isRetryableGeminiError(error) && attempt < delays.length;

      if (!shouldRetry) {
        throw error;
      }

      const delay = delays[attempt];

      console.warn(
        `Gemini no está disponible. Reintento ${attempt + 1} en ${delay / 1000} segundos.`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    "No fue posible generar el plan después de los reintentos."
  );
}

export async function POST(request: Request) {
  try {
    // Comprobar que existe la clave de Gemini.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Falta configurar GEMINI_API_KEY.",
        },
        { status: 500 }
      );
    }

    // Validar los datos recibidos.
    const body = await request.json();
    const inputResult = projectInputSchema.safeParse(body);

    if (!inputResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Los datos del proyecto no son válidos.",
          errors: inputResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      projectName,
      projectDescription,
      totalAmount,
      durationDays,
      startDate,
    } = inputResult.data;

    // Calcular la fecha límite del proyecto.
    const projectStart = new Date(`${startDate}T00:00:00.000Z`);

    if (
      Number.isNaN(projectStart.getTime()) ||
      projectStart.toISOString().slice(0, 10) !== startDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "La fecha de inicio no es válida.",
        },
        { status: 400 }
      );
    }

    const projectEnd = new Date(projectStart);
    projectEnd.setUTCDate(
      projectEnd.getUTCDate() + durationDays - 1
    );

    const endDateLimit = projectEnd.toISOString().slice(0, 10);

    // Inicializar Gemini.
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Eres un asistente especializado en planificación de proyectos
para freelancers y pequeñas agencias.

Debes transformar la descripción de un proyecto en un plan
de trabajo profesional compuesto por entre 1 y 3 hitos.

DESCRIPCIÓN DEL PROYECTO:
${projectDescription}

PRESUPUESTO TOTAL: ${totalAmount} USD
DURACIÓN: ${durationDays} días
FECHA DE INICIO: ${startDate}
FECHA LÍMITE: ${endDateLimit}

INSTRUCCIONES:
1. Divide el trabajo en 1, 2 o 3 hitos.
2. Elige la cantidad de hitos según el tamaño y complejidad del proyecto.
3. Para proyectos pequeños y sencillos, prioriza 1 hito cuando sea suficiente.
4. Cada hito debe representar un entregable verificable.
5. Asigna a cada hito un porcentaje del presupuesto.
6. Los porcentajes deben sumar exactamente 100.
7. Los importes deben sumar exactamente ${totalAmount} USD.
8. Calcula los importes según los porcentajes asignados.
9. Las fechas deben estar dentro del periodo del proyecto.
10. Los hitos deben seguir un orden lógico y cronológico.
11. Utiliza fechas con formato YYYY-MM-DD.
12. No inventes actividades ajenas a la descripción.
13. Devuelve exclusivamente los datos solicitados en el esquema JSON.

No crees facturas ni ejecutes pagos. Solo genera una propuesta
de planificación que deberá ser revisada y aprobada por una persona.
`;

    // Solicitar el plan estructurado a Gemini.
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      })
    );

    if (!response.text) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini no generó una respuesta.",
        },
        { status: 502 }
      );
    }

    // Convertir y validar el JSON generado.
    let generatedData: unknown;

    try {
      generatedData = JSON.parse(response.text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini devolvió un JSON inválido.",
        },
        { status: 502 }
      );
    }

    const planResult = planSchema.safeParse(generatedData);

    if (!planResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "El plan generado no cumple el formato requerido.",
          errors: planResult.error.flatten(),
        },
        { status: 502 }
      );
    }

    const plan = planResult.data;

    // Verificar que los porcentajes sumen 100.
    const percentageTotal = plan.milestones.reduce(
      (sum, milestone) => sum + milestone.percentage,
      0
    );

    if (Math.abs(percentageTotal - 100) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          message: "Los porcentajes no suman 100%.",
        },
        { status: 502 }
      );
    }

    // Verificar que los importes coincidan con el presupuesto.
    const amountTotal = plan.milestones.reduce(
      (sum, milestone) => sum + milestone.amount,
      0
    );

    if (Math.abs(amountTotal - totalAmount) > 0.02) {
      return NextResponse.json(
        {
          success: false,
          message: "Los importes no coinciden con el presupuesto.",
        },
        { status: 502 }
      );
    }

    // Verificar que las fechas respeten el periodo del proyecto.
    let previousStartDate = "";

    for (const milestone of plan.milestones) {
      const validDates =
        !Number.isNaN(
          Date.parse(`${milestone.startDate}T00:00:00.000Z`)
        ) &&
        !Number.isNaN(
          Date.parse(`${milestone.endDate}T00:00:00.000Z`)
        ) &&
        milestone.startDate >= startDate &&
        milestone.endDate <= endDateLimit &&
        milestone.endDate >= milestone.startDate &&
        milestone.startDate >= previousStartDate;

      if (!validDates) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Uno o más hitos tienen fechas fuera del periodo permitido.",
          },
          { status: 502 }
        );
      }

      previousStartDate = milestone.startDate;
    }

    // Guardar el proyecto y sus hitos en PostgreSQL.
    let saved;

    try {
      saved = await saveProject({
        projectName,
        projectDescription,
        totalAmount,
        durationDays,
        startDate,
        endDate: endDateLimit,
        summary: plan.summary,
        milestones: plan.milestones,
      });
    } catch (error) {
      console.error("Error al guardar el plan en PostgreSQL:", error);

      return NextResponse.json(
        {
          success: false,
          message:
            "El plan se generó correctamente, pero no se pudo guardar en la base de datos.",
          errorCode: "DATABASE_SAVE_ERROR",
        },
        { status: 500 }
      );
    }

    // Devolver el proyecto guardado, pendiente de aprobación humana.
    return NextResponse.json({
      success: true,
      message: "Plan generado y guardado correctamente.",
      approved: false,
      project: {
        id: saved.project.id,
        name: saved.project.name,
        status: saved.project.status,
        totalAmount,
        durationDays,
        startDate,
        endDate: endDateLimit,
      },
      plan,
      milestonesSaved: saved.milestonesSaved,
    });
  } catch (error) {
    console.error("Error al generar el plan con Gemini:", error);

    const status = getGeminiStatus(error);

    // Cuota de Gemini agotada.
    if (status === 429) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Se alcanzó el límite de solicitudes de IA. Inténtalo nuevamente cuando se restablezca la cuota de Gemini.",
          errorCode: "GEMINI_QUOTA_EXCEEDED",
          retryable: false,
        },
        { status: 429 }
      );
    }

    // Errores temporales del proveedor.
    if ([500, 502, 503, 504].includes(status ?? 0)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gemini está temporalmente saturado. Inténtalo nuevamente en unos minutos.",
          errorCode: "GEMINI_TEMPORARILY_UNAVAILABLE",
          retryable: true,
        },
        { status: 503 }
      );
    }

    // Otros errores.
    return NextResponse.json(
      {
        success: false,
        message: "No se pudo generar el plan de trabajo.",
        errorCode: "GEMINI_INTERNAL_ERROR",
        retryable: false,
      },
      { status: 500 }
    );
  }
}
