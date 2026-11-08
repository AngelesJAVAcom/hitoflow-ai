import { NextResponse } from "next/server";
import { getProjects } from "@/lib/projects";

export async function GET() {
  try {
    const projects = await getProjects();

    return NextResponse.json({
      success: true,
      total: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Error al consultar proyectos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudieron consultar los proyectos.",
      },
      { status: 500 }
    );
  }
}