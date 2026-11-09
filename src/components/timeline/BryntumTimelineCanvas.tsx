"use client";

import { BryntumGantt, type BryntumGanttProps } from "@bryntum/gantt-react-community";

type TimelineProject = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  milestones: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    paymentStatus: string;
  }>;
};

function paymentLabel(paymentStatus: string) {
  if (paymentStatus === "PAID") return "Pagado";
  if (paymentStatus === "UNPAID") return "Pendiente";
  return "Sin factura";
}

// Bryntum treats task end dates as exclusive; the app stores user-facing finish dates inclusively.
function nextDay(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

export function BryntumTimelineCanvas({ project }: { project: TimelineProject }) {
  const timelineEndDate = nextDay(project.end_date);
  const ganttConfig: BryntumGanttProps = {
    startDate: project.start_date,
    endDate: timelineEndDate,
    visibleDate: new Date(project.start_date),
    columns: [
      { type: "name", field: "name", text: "Hito", width: 260 },
      { type: "startdate", field: "startDate", text: "Inicio", width: 142 },
      { field: "plannedEndDateLabel", text: "Fin", width: 142 },
      { field: "paymentStatusLabel", text: "Pago", width: 112 },
    ],
    project: {
      startDate: project.start_date,
      endDate: timelineEndDate,
      tasks: [
        {
          id: `project-${project.id}`,
          name: project.name,
          startDate: project.start_date,
          endDate: timelineEndDate,
          plannedEndDateLabel: displayDate(project.end_date),
          cls: "hito-gantt-parent",
          eventColor: "#0878f9",
          expanded: true,
          children: project.milestones.map((milestone) => ({
            id: milestone.id,
            name: milestone.name,
            startDate: milestone.startDate,
            endDate: nextDay(milestone.endDate),
            plannedEndDateLabel: displayDate(milestone.endDate),
            paymentStatusLabel: paymentLabel(milestone.paymentStatus),
            cls: milestone.paymentStatus === "PAID" ? "hito-gantt-paid" : "hito-gantt-pending",
            eventColor: milestone.paymentStatus === "PAID" ? "#12bacb" : "#6f39ed",
          })),
        },
      ],
    } as unknown as NonNullable<BryntumGanttProps["project"]>,
    viewPreset: "weekAndDayLetter",
    barMargin: 12,
    rowHeight: 50,
    readOnly: true,
  };

  return (
    <div className="hito-gantt-shell" aria-label={`Cronograma de ${project.name}`}>
      <BryntumGantt {...ganttConfig} />
    </div>
  );
}
