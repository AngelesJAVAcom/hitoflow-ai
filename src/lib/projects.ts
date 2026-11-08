import { pool } from "@/lib/db";

interface MilestoneInput {
  name: string;
  description: string;
  percentage: number;
  amount: number;
  startDate: string;
  endDate: string;
}

interface SaveProjectInput {
  projectName?: string;
  projectDescription: string;
  totalAmount: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  summary: string;
  milestones: MilestoneInput[];
}

export async function saveProject(input: SaveProjectInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectName =
      input.projectName?.trim() ||
      input.projectDescription
        .trim()
        .split(/\s+/)
        .slice(0, 8)
        .join(" ")
        .slice(0, 150);

    const projectResult = await client.query(
      `INSERT INTO projects (
        name,
        description,
        total_amount,
        duration_days,
        start_date,
        end_date,
        ai_summary,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_APPROVAL')
      RETURNING id, name, status`,
      [
        projectName,
        input.projectDescription,
        input.totalAmount,
        input.durationDays,
        input.startDate,
        input.endDate,
        input.summary,
      ]
    );

    const project = projectResult.rows[0];

    for (const milestone of input.milestones) {
      await client.query(
        `INSERT INTO milestones (
          project_id,
          name,
          description,
          percentage,
          amount,
          start_date,
          end_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          project.id,
          milestone.name,
          milestone.description,
          milestone.percentage,
          milestone.amount,
          milestone.startDate,
          milestone.endDate,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      project,
      milestonesSaved: input.milestones.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getProjects() {
  const result = await pool.query(`
    SELECT
      p.id,
      p.name,
      p.description,
      p.total_amount,
      p.duration_days,
      p.start_date,
      p.end_date,
      p.ai_summary,
      p.status,
      p.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'name', m.name,
            'description', m.description,
            'percentage', m.percentage,
            'amount', m.amount,
            'startDate', m.start_date,
            'endDate', m.end_date,
            'status', m.status,
            'paymentStatus', m.payment_status,
            'paypalInvoiceId', m.paypal_invoice_id,
            'paypalInvoiceUrl', m.paypal_invoice_url
          )
          ORDER BY m.start_date
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'::json
      ) AS milestones
    FROM projects p
    LEFT JOIN milestones m ON m.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  return result.rows;
}