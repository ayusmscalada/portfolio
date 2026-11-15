import {
  Cloud,
  Code,
  Compass,
  Cpu,
  Database,
  EnvelopeSimple,
  GitBranch,
  GithubLogo,
  House,
  LinkedinLogo,
  PenNib,
  Sparkle,
  SquaresFour,
  User,
  XLogo,
} from '@/components/ph.jsx'

/** Named icon lookups so data files can stay plain strings. */
export const navIcons = {
  home: House,
  about: User,
  skills: Sparkle,
  work: SquaresFour,
  journey: GitBranch,
  contact: EnvelopeSimple,
}

export const skillIcons = { code: Code, cpu: Cpu, database: Database, cloud: Cloud, compass: Compass }

export const socialIcons = { github: GithubLogo, linkedin: LinkedinLogo, x: XLogo, writing: PenNib, email: EnvelopeSimple }
