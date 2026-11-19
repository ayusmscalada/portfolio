import { useRef } from 'react'
import { Group, ImageField, Lines, List, Num, Range, ResumeManager, Row, Select, Tags, Text, Toggle, useEditor } from './fields.jsx'
import s from './Admin.module.css'

const RICH = 'Wrap a word in *asterisks* to show it in the accent colour.'
const YEARS = 'Type {years} to insert years since your first year shipping, kept up to date automatically.'
const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

let zones = []
try {
  zones = Intl.supportedValuesOf('timeZone')
} catch {
  /* older browsers: free text */
}

export function ProfileForm() {
  return (
    <>
      <Group title="Identity" hint="Your name appears in the header, footer, page title and logo.">
        <Row>
          <Text path={['profile', 'firstName']} label="First name" />
          <Text path={['profile', 'lastName']} label="Last name" />
        </Row>
        <Row>
          <Text path={['profile', 'role']} label="Role / title" placeholder="Full-stack Engineer" />
          <Text path={['profile', 'monogram']} label="Logo letters" maxLength={2} hint="Empty = your initials." />
        </Row>
        <Text path={['profile', 'tagline']} label="Tagline" multiline rows={2} hint={`Used for search engines and link previews. ${RICH}`} />
      </Group>
      <Group title="Location & time" hint="Drives the live clock in the navigation and contact section.">
        <Row>
          <Text path={['profile', 'location']} label="Location" placeholder="City, Country" />
          <Text path={['profile', 'domain']} label="Domain" placeholder="yourname.dev" hint="Shown in the hero's deploy log." />
        </Row>
        <Row>
          <Text path={['profile', 'timezone']} label="Time zone" list="tz-list" placeholder="America/New_York" />
          <Text path={['profile', 'timezoneLabel']} label="Clock label" placeholder="EST" />
        </Row>
        <datalist id="tz-list">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
        <Num path={['profile', 'since']} label="First year shipping production code" min={1970} max={2100} hint="Used to count your years of experience." />
      </Group>
    </>
  )
}

export function HeroForm() {
  return (
    <>
      <Group title="Headline" hint="The first thing visitors read.">
        <Text path={['profile', 'headline']} label="Headline" multiline rows={2} hint={RICH} />
        <Tags path={['profile', 'building']} label="“I build …” rotating phrases" hint="They cycle every few seconds." />
        <Tags path={['profile', 'focus']} label="Core stack (summary sentence)" hint="Read as “…shipping products with A, B and C.”" />
      </Group>
      <Group title="Floating chips" hint="Tech badges orbiting the particle sphere.">
        <Tags path={['profile', 'heroTags']} label="Chips" max={6} />
      </Group>
    </>
  )
}

export function AboutForm() {
  return (
    <>
      <Group title="Story">
        <Text path={['about', 'title']} label="Section title" hint={RICH} />
        <Text path={['about', 'statement']} label="Opening statement" multiline rows={3} hint={RICH} />
        <List path={['about', 'paragraphs']} label="Paragraphs" hint={YEARS} newItem="" addLabel="Add paragraph" itemTitle={(p) => p.slice(0, 60)}>
          {(base) => <Text path={base} label="Paragraph" multiline rows={5} />}
        </List>
      </Group>
      <Group title="Currently" hint="The small card under your story.">
        <List path={['about', 'now']} newItem={{ label: '', value: '' }} addLabel="Add row" itemTitle={(r) => r.label && `${r.label}: ${r.value}`} defaultOpen>
          {(base) => (
            <Row>
              <Text path={[...base, 'label']} label="Label" placeholder="Building" />
              <Text path={[...base, 'value']} label="Value" />
            </Row>
          )}
        </List>
      </Group>
      <Group title="Stats" hint="Animated counters. The first one also appears on the hero card.">
        <List path={['about', 'stats']} newItem={{ value: 0, suffix: '', label: '' }} addLabel="Add stat" itemTitle={(st) => st.label && `${st.value}${st.suffix ?? ''} ${st.label}`}>
          {(base) => (
            <>
              <Row>
                <Num path={[...base, 'value']} label="Number" allowText hint="Or {years}." />
                <Text path={[...base, 'suffix']} label="Suffix" placeholder="+, %, M+" />
                <Num path={[...base, 'decimals']} label="Decimals" min={0} max={3} />
              </Row>
              <Text path={[...base, 'label']} label="Label" />
            </>
          )}
        </List>
      </Group>
      <Group title="Principles">
        <List path={['about', 'principles']} newItem={{ title: '', body: '' }} addLabel="Add principle" itemTitle={(p) => p.title}>
          {(base) => (
            <>
              <Text path={[...base, 'title']} label="Title" />
              <Text path={[...base, 'body']} label="Text" multiline rows={2} />
            </>
          )}
        </List>
      </Group>
    </>
  )
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => [m, m])
const SKILL_ICONS = [
  ['code', 'Code (frontend)'],
  ['cpu', 'Chip (backend)'],
  ['database', 'Database'],
  ['cloud', 'Cloud'],
  ['compass', 'Compass (practices)'],
]

export function SkillsForm() {
  return (
    <>
      <Group title="Section">
        <Text path={['capabilities', 'title']} label="Title" hint={RICH} />
        <Text path={['capabilities', 'lede']} label="Intro" multiline rows={2} />
      </Group>
      <Group title="Skill cards" hint="Each card has a proficiency bar and skills grouped by depth (first group = 5 dots, then 4, 3…).">
        <List
          path={['capabilities', 'endpoints']}
          newItem={{ method: 'GET', path: '/new', icon: 'code', level: 75, title: 'New skill area', description: '', tiers: [{ name: 'core', items: [] }, { name: 'fluent', items: [] }, { name: 'exploring', items: [] }] }}
          addLabel="Add skill card"
          itemTitle={(ep) => ep.title}
        >
          {(base) => (
            <>
              <Text path={[...base, 'title']} label="Title" />
              <Row>
                <Select path={[...base, 'method']} label="Method" options={METHODS} />
                <Text path={[...base, 'path']} label="Path label" placeholder="/frontend" />
                <Select path={[...base, 'icon']} label="Icon" options={SKILL_ICONS} />
              </Row>
              <Range path={[...base, 'level']} label="Proficiency" />
              <Text path={[...base, 'description']} label="Description" multiline rows={3} />
              <List path={[...base, 'tiers']} label="Skill groups" newItem={{ name: '', items: [] }} addLabel="Add group" itemTitle={(t) => t.name && `${t.name} · ${t.items?.length ?? 0}`} defaultOpen>
                {(tb) => (
                  <>
                    <Text path={[...tb, 'name']} label="Group name" placeholder="core / fluent / exploring" />
                    <Tags path={[...tb, 'items']} label="Skills" />
                  </>
                )}
              </List>
            </>
          )}
        </List>
      </Group>
    </>
  )
}

const STATUS = [
  ['', 'Automatic (from links)'],
  ['live', 'Live'],
  ['github', 'GitHub'],
  ['private', 'Private'],
]

export function ProjectsForm() {
  const { draft } = useEditor()
  const projectsRef = useRef(draft.projects)
  projectsRef.current = draft.projects
  const uniqueId = (title) => {
    const base = slug(title) || 'project'
    let id = base
    for (let n = 2; projectsRef.current.some((p) => p.id === id); n++) id = `${base}-${n}`
    return id
  }
  return (
    <>
      <Group title="Section">
        <Text path={['projectsIntro', 'title']} label="Title" hint={RICH} />
        <Text path={['projectsIntro', 'lede']} label="Intro" multiline rows={2} />
      </Group>
      <Group title="Projects" hint="Use the eye button to show or hide a project from visitors (hidden projects stay here). Use the arrows to reorder.">
        <List
          path={['projects']}
          newItem={() => ({
            id: uniqueId('new project'),
            title: 'New project',
            kicker: '',
            year: new Date().getFullYear(),
            role: '',
            stack: [],
            summary: '',
            metrics: [],
            caseStudy: [
              { heading: 'Problem', body: '' },
              { heading: 'Approach', body: '' },
              { heading: 'Outcome', body: '' },
            ],
            links: { live: '', repo: '' },
            image: '',
            hidden: true,
          })}
          addLabel="Add project"
          hideable
          itemTitle={(p) => p.title && `${p.title}${p.year ? ` · ${p.year}` : ''}`}
        >
          {(base) => (
            <>
              <Toggle path={[...base, 'hidden']} label="Show this project on the site" invert />
              <Row>
                <Text path={[...base, 'title']} label="Name" />
                <Num path={[...base, 'year']} label="Year" min={1990} max={2100} />
              </Row>
              <Row>
                <Text path={[...base, 'kicker']} label="One-line category" placeholder="Realtime logistics platform" />
                <Text path={[...base, 'role']} label="Your role" placeholder="Lead engineer" />
              </Row>
              <Text path={[...base, 'summary']} label="Summary" multiline rows={3} />
              <ImageField path={[...base, 'image']} label="Cover image" hint="Screenshots look best at 16:10. Uploads are resized and converted to WebP." />
              <Tags path={[...base, 'stack']} label="Tech stack" hint="The first six show on the card." />
              <Row>
                <Text path={[...base, 'links', 'live']} label="Live URL" type="url" placeholder="https://…" />
                <Text path={[...base, 'links', 'repo']} label="Source code URL" type="url" placeholder="https://github.com/…" />
              </Row>
              <Select path={[...base, 'status']} label="Badge" options={STATUS} />
              <List path={[...base, 'metrics']} label="Key metrics (first 3 on the card)" newItem={{ value: '', label: '' }} addLabel="Add metric" itemTitle={(m) => m.value && `${m.value} ${m.label}`} defaultOpen>
                {(mb) => (
                  <Row>
                    <Text path={[...mb, 'value']} label="Value" placeholder="−63%" />
                    <Text path={[...mb, 'label']} label="Label" placeholder="p95 latency" />
                  </Row>
                )}
              </List>
              <List path={[...base, 'caseStudy']} label="Case study" newItem={{ heading: '', body: '' }} addLabel="Add section" itemTitle={(c) => c.heading}>
                {(cb) => (
                  <>
                    <Text path={[...cb, 'heading']} label="Heading" />
                    <Text path={[...cb, 'body']} label="Text" multiline rows={4} />
                  </>
                )}
              </List>
              <Text path={[...base, 'id']} label="ID" hint="Used internally and for the generated cover pattern. Must be unique." />
            </>
          )}
        </List>
      </Group>
    </>
  )
}

export function ExperienceForm() {
  return (
    <>
      <Group title="Section">
        <Text path={['experience', 'title']} label="Title" hint={RICH} />
        <Text path={['experience', 'lede']} label="Intro" multiline rows={2} />
      </Group>
      <Group title="Roles" hint="Newest first. Leave the end year empty (Current role) for your present job.">
        <List
          path={['experience', 'roles']}
          newItem={{ company: '', role: '', start: String(new Date().getFullYear()), end: null, location: '', summary: '', highlights: [], stack: [] }}
          addLabel="Add role"
          itemTitle={(r) => r.role && `${r.role} @ ${r.company} · ${r.start}–${r.end ?? 'now'}`}
        >
          {(base) => <RoleFields base={base} />}
        </List>
      </Group>
    </>
  )
}

function RoleFields({ base }) {
  const { draft, set } = useEditor()
  const role = base.reduce((o, k) => o?.[k], draft)
  const current = role?.end == null
  return (
    <>
      <Row>
        <Text path={[...base, 'role']} label="Job title" />
        <Text path={[...base, 'company']} label="Company" />
      </Row>
      <Row>
        <Text path={[...base, 'start']} label="Start" placeholder="2021" />
        {!current && <Text path={[...base, 'end']} label="End" placeholder="2023" />}
        <Text path={[...base, 'location']} label="Location" placeholder="Remote" />
      </Row>
      <div className={s.field}>
        <label className={s.toggle}>
          <input type="checkbox" role="switch" checked={current} onChange={(e) => set([...base, 'end'], e.target.checked ? null : String(new Date().getFullYear()))} />
          <span className={s.switch} aria-hidden="true" />
          <span>Current role</span>
        </label>
      </div>
      <Text path={[...base, 'summary']} label="Summary" multiline rows={2} />
      <Lines path={[...base, 'highlights']} label="Highlights" hint="One achievement per line. Lead with the impact." rows={5} />
      <Tags path={[...base, 'stack']} label="Stack" />
    </>
  )
}

const SOCIAL_ICONS = [
  ['github', 'GitHub'],
  ['linkedin', 'LinkedIn'],
  ['x', 'X / Twitter'],
  ['writing', 'Blog / writing'],
  ['email', 'Email'],
]

export function ContactForm() {
  return (
    <>
      <Group title="Contact">
        <Text path={['profile', 'email']} label="Email" type="email" />
        <Text path={['contact', 'title']} label="Section title" hint={RICH} />
        <Text path={['contact', 'lede']} label="Intro" multiline rows={2} />
      </Group>
      <Group title="Résumé" hint="Upload résumés to Supabase and pick the one visitors can open. Your choice goes live when you save. Deleting a file removes it from Supabase.">
        <ResumeManager />
      </Group>
      <Group title="Availability">
        <Toggle path={['profile', 'availability', 'open']} label="Open to new work" />
        <Text path={['profile', 'availability', 'label']} label="Availability message" placeholder="Open to senior roles from Q1" />
      </Group>
      <Group title="Social links" hint="Shown in the left rail, contact section and command menu.">
        <List path={['profile', 'socials']} newItem={{ label: '', icon: 'github', handle: '', url: '' }} addLabel="Add link" itemTitle={(so) => so.label && `${so.label} · ${so.handle}`}>
          {(base) => (
            <>
              <Row>
                <Text path={[...base, 'label']} label="Name" placeholder="GitHub" />
                <Select path={[...base, 'icon']} label="Icon" options={SOCIAL_ICONS} />
              </Row>
              <Row>
                <Text path={[...base, 'handle']} label="Handle" placeholder="@yourhandle" />
                <Text path={[...base, 'url']} label="URL" type="url" placeholder="https://…" />
              </Row>
            </>
          )}
        </List>
      </Group>
    </>
  )
}
