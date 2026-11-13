import { z } from "zod";

// CV answers. Never contains date of birth, gender, nationality or photo.
const s = (max = 200) => z.string().trim().max(max).default("");

export const educationItem = z.object({
  level: s(40),
  school: s(),
  field: s(),
  start_year: s(4),
  end_year: s(4),
});
export const experienceItem = z.object({
  title: s(),
  company: s(),
  start_month: s(7),
  end_month: s(7),
  description: s(600),
});
export const skillItem = z.object({ name: s(60), level: s(20) });
export const languageItem = z.object({ language: s(60), level: s(10) });
export const certificateItem = z.object({ name: s(), issuer: s(), year: s(4) });

export const cvSchema = z.object({
  education: z.array(educationItem).max(10).default([]),
  experience: z
    .object({ none: z.boolean().default(false), items: z.array(experienceItem).max(15).default([]) })
    .default({ none: false, items: [] }),
  skills: z.array(skillItem).max(40).default([]),
  languages: z.array(languageItem).max(15).default([]),
  certificates: z.array(certificateItem).max(20).default([]),
  preferences: z
    .object({
      roles: z.array(s(80)).max(10).default([]),
      cities: z.array(s(80)).max(10).default([]),
      contract_types: z.array(z.enum(["internship", "part-time", "full-time"])).max(3).default([]),
      min_pay: s(20),
      work_modes: z.array(z.enum(["remote", "hybrid", "on-site"])).max(3).default([]),
      earliest_start: s(10),
    })
    .default({}),
});
export type CV = z.infer<typeof cvSchema>;

export const emptyCv = (): CV => cvSchema.parse({});

export const EDU_LEVELS = ["high school", "bachelor's", "master's", "other"];
export const SKILL_LEVELS = ["basic", "good", "advanced"];
export const LANG_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "native"];
export const SUGGESTED_SKILLS = [
  "Excel", "SQL", "Python", "Communication", "Canva", "Figma", "JavaScript",
  "Customer service", "Social media", "Writing", "Teamwork", "Accounting",
];

export const STEP_TITLES = [
  "Education",
  "Experience",
  "Skills",
  "Languages",
  "Certificates & courses",
  "Job preferences",
];

export function ageFrom(dob: string, now = new Date()): number {
  const d = new Date(dob + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return -1;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}
