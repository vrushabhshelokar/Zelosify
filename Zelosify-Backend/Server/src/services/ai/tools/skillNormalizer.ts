/**
 * Canonical Skill Dictionary & Taxonomy Normalization
 */
const SKILL_MAP: Record<string, string> = {
  // Frontend
  react: "React",
  reactjs: "React",
  "react.js": "React",
  next: "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  vue: "Vue.js",
  vuejs: "Vue.js",
  angular: "Angular",
  angularjs: "Angular",
  typescript: "TypeScript",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  html: "HTML5",
  html5: "HTML5",
  css: "CSS3",
  css3: "CSS3",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  redux: "Redux",

  // Backend
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  express: "Express.js",
  expressjs: "Express.js",
  fastapi: "FastAPI",
  python: "Python",
  py: "Python",
  golang: "Go",
  go: "Go",
  java: "Java",
  springboot: "Spring Boot",
  "spring boot": "Spring Boot",
  csharp: "C#",
  "c#": "C#",
  dotnet: ".NET",
  ".net": ".NET",

  // Database & Storage
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  psql: "PostgreSQL",
  mongo: "MongoDB",
  mongodb: "MongoDB",
  redis: "Redis",
  prisma: "Prisma",
  mysql: "MySQL",
  kafka: "Apache Kafka",

  // Cloud & DevOps
  aws: "AWS",
  "amazon web services": "AWS",
  azure: "Azure",
  gcp: "Google Cloud",
  docker: "Docker",
  k8s: "Kubernetes",
  kubernetes: "Kubernetes",
  terraform: "Terraform",
  ci: "CI/CD",
  cd: "CI/CD",
  "ci/cd": "CI/CD",
  github: "GitHub Actions",
  "github actions": "GitHub Actions",

  // AI & ML
  llm: "LLMs",
  llms: "LLMs",
  langchain: "LangChain",
  genai: "Generative AI",
  "machine learning": "Machine Learning",
  ml: "Machine Learning",
};

export function normalizeSkill(rawSkill: string): string {
  const cleaned = rawSkill.trim().toLowerCase();
  if (SKILL_MAP[cleaned]) {
    return SKILL_MAP[cleaned];
  }
  // Title-case fallback
  return rawSkill
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
}

export function normalizeSkills(skills: string[]): string[] {
  const normalized = new Set<string>();
  for (const skill of skills) {
    if (skill && skill.trim().length > 0) {
      normalized.add(normalizeSkill(skill));
    }
  }
  return Array.from(normalized);
}
