// Data is synced from the private `resume` repo (`task site:sync` there). Never edit src/data by hand.
import yaml from "js-yaml";
import resumeRaw from "../data/resume.en.yaml?raw";
import portfolioRaw from "../data/portfolio.en.yaml?raw";

type Experience = {
  company: string;
  position: string;
  location: string;
  dates: string;
  description: string;
  highlights: string[];
};

export const resume = yaml.load(resumeRaw) as {
  name: string;
  contact: { location: string; email: string; links: { label: string; url: string }[] };
  summary: string[];
  skills: { level: string; items: string }[];
  experience: Experience[];
  education: { institution: string; qualification: string; location: string; dates: string; highlights?: string[] }[];
  certifications: { name: string; dates: string; details: string; url?: string }[];
  languages: string;
};

export const validationNumber = (details: string) => details.match(/Validation number:\s*(\w+)/)?.[1];

// "Brazilian Portuguese (native); English (fluent)." → [{ flag, name, level }]
// SVG files in public/flags/, not emoji: Windows doesn't render flag emoji (shows "BR").
const FLAGS: Record<string, string> = { portuguese: "br", english: "us", spanish: "es" };
export const languages = resume.languages
  .replace(/\.$/, "")
  .split(";")
  .map((raw) => {
    const [, name = raw, level = ""] = raw.trim().match(/^(.*?)\s*\((.*)\)$/) ?? [];
    const flag = Object.entries(FLAGS).find(([k]) => name.toLowerCase().includes(k))?.[1];
    return { flag, name: name.trim(), level };
  });

export const portfolio = yaml.load(portfolioRaw) as {
  projects: { repo: string; type: string; description: string }[];
};
