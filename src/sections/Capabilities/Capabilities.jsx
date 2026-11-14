import { Fragment, useState } from 'react'
import { capabilities } from '@/data/capabilities.js'
import { profile } from '@/data/profile.js'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import s from './Capabilities.module.css'

/** Pretty-printed, syntax-coloured JSON with hanging indents for wrapped arrays. */
function JsonBody({ data }) {
  const keys = Object.keys(data)
  return (
    <code className={s.code}>
      <span className={s.punc}>{'{'}</span>
      {keys.map((key, k) => (
        <span key={key} className={s.jline}>
          <span className={s.key}>"{key}"</span>
          <span className={s.punc}>: [</span>
          {data[key].map((value, v) => (
            <Fragment key={value}>
              <span className={s.str} data-tier={k}>
                "{value}"
              </span>
              {v < data[key].length - 1 && <span className={s.punc}>, </span>}
            </Fragment>
          ))}
          <span className={s.punc}>]{k < keys.length - 1 ? ',' : ''}</span>
        </span>
      ))}
      <span className={s.punc}>{'}'}</span>
    </code>
  )
}

export function Capabilities() {
  const [open, setOpen] = useState(0)
  const { endpoints } = capabilities

  return (
    <section id="capabilities" className={s.section} aria-labelledby="capabilities-title">
      <div className="wrap">
        <SectionHead
          id="capabilities"
          eyebrow={`$ curl -s api.${profile.domain}/v1 | jq`}
          title={capabilities.title}
          lede={capabilities.lede}
        />

        <ul className={s.list}>
          {endpoints.map((ep, i) => {
            const isOpen = open === i
            const count = Object.values(ep.response).flat().length
            return (
              <Reveal as="li" key={ep.path} className={s.item} data-open={isOpen} delay={i * 70}>
                <h3 className={s.heading}>
                  <button
                    type="button"
                    id={`ep-btn-${i}`}
                    className={s.row}
                    aria-expanded={isOpen}
                    aria-controls={`ep-panel-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span className={s.method}>{ep.method}</span>
                    <span className={s.path}>{ep.path}</span>
                    <span className={s.title}>{ep.title}</span>
                    <span className={s.status}>
                      <span className={s.ok}>200</span> · {ep.latency}ms · {count} items
                    </span>
                    <span className={s.toggle} aria-hidden="true" />
                  </button>
                </h3>

                <div
                  id={`ep-panel-${i}`}
                  role="region"
                  aria-labelledby={`ep-btn-${i}`}
                  className={s.panel}
                  inert={!isOpen}
                >
                  <div className={s.panelClip}>
                    <div className={s.panelBody}>
                      <div className={s.desc}>
                        <p>{ep.description}</p>
                        <p className={s.curl}>
                          <span className={s.dollar}>$</span> curl -X {ep.method} api.{profile.domain}
                          {ep.path}
                        </p>
                      </div>
                      <div className={s.response}>
                        <div className={s.responseHead}>
                          <span>
                            HTTP/2 <span className={s.ok}>200 OK</span>
                          </span>
                          <span>application/json · {ep.latency}ms</span>
                        </div>
                        <pre className={s.pre}>
                          <JsonBody data={ep.response} />
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
