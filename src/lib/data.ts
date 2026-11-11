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
  certifications: { name: string; dates: string; details: string }[];
  languages: string;
};

export const portfolio = yaml.load(portfolioRaw) as {
  projects: { repo: string; type: string; description: string }[];
};
