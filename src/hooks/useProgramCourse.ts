"use client";

import { useEffect, useState } from "react";
import { api, ProgramData, CourseData } from "@/lib/api";

export function useProgramCourse(selectedProgram: string) {
  const [programs,  setPrograms]  = useState<ProgramData[]>([]);
  const [courses,   setCourses]   = useState<CourseData[]>([]);
  const [loadingP,  setLoadingP]  = useState(true);
  const [loadingC,  setLoadingC]  = useState(false);

  useEffect(() => {
    setLoadingP(true);
    api.programs.list("", "ACTIVE", 0)
      .then((r) => setPrograms(r.content))
      .catch(() => {})
      .finally(() => setLoadingP(false));
  }, []);

  useEffect(() => {
    if (!selectedProgram) { setCourses([]); return; }
    setLoadingC(true);
    api.courses.list("", selectedProgram, "ACTIVE", 0)
      .then((r) => setCourses(r.content))
      .catch(() => setCourses([]))
      .finally(() => setLoadingC(false));
  }, [selectedProgram]);

  const programNames   = programs.map((p) => p.name);
  const programDegrees = [...new Set(programs.flatMap((p) => p.degrees ?? []))].sort();
  const programOptions = [...new Set([...programNames, ...programDegrees])].sort();

  return { programs, courses, programNames, programDegrees, programOptions, loadingPrograms: loadingP, loadingCourses: loadingC };
}
