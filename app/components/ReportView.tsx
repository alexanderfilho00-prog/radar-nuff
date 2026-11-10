import { MARKETS, type Opportunity, type Report } from "@/lib/schema";
import { formatDate, formatShortDate } from "@/lib/reports";
import { CopyButton } from "./CopyButton";

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function OpportunityCard({ o, index }: { o: Opportunity; index: number }) {
  const explicit = o.classification === "Demanda explícita";
  return (
    <article className="card">
      <div className="card-top">
        <span className="card-index">{index}</span>
        <div className="card-title">
          <h3>{o.company}</h3>
          <p className="muted">
            {o.niche} · {o.country}
            {o.website ? (
              <>
                {" · "}
                <a href={o.website} target="_blank" rel="noreferrer">
                  {hostOf(o.website)}
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="tags">
          <span className={`tag ${explicit ? "tag-explicit" : "tag-inferred"}`}>{o.classification}</span>
          <span className="tag tag-case">{o.case}</span>
        </div>
      </div>

      <dl className="facts">
        <div>
          <dt>O que aconteceu</dt>
          <dd>
            {o.whatHappened}{" "}
            <span className="muted">({formatShortDate(o.eventDate)})</span>
          </dd>
        </div>
        <div>
          <dt>Fonte</dt>
          <dd>
            <a href={o.sourceUrl} target="_blank" rel="noreferrer">
              {hostOf(o.sourceUrl)}
            </a>
            {o.extraSourceUrls.map((u) => (
              <span key={u}>
                {" · "}
                <a href={u} target="_blank" rel="noreferrer">
                  {hostOf(u)}
                </a>
              </span>
            ))}
            {!o.sourceVerified ? <span className="warn"> · fonte não confirmada, revisar</span> : null}
          </dd>
        </div>
        <div>
          <dt>Serviço agora</dt>
          <dd>
            <strong>{o.service}.</strong> {o.serviceWhy}
          </dd>
        </div>
        <div>
          <dt>Quem abordar</dt>
          <dd>
            {o.contactName ? (
              <>
                <strong>{o.contactName}</strong>, {o.contactRole}
                {o.contactSourceUrl ? (
                  <>
                    {" "}
                    <a href={o.contactSourceUrl} target="_blank" rel="noreferrer" className="muted">
                      (verificado)
                    </a>
                  </>
                ) : null}
              </>
            ) : (
              <>
                {o.contactRole} <span className="muted">(nome não verificado)</span>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Case</dt>
          <dd>
            <strong>{o.case}</strong>: {o.caseWhy}
          </dd>
        </div>
      </dl>

      <div className="opener">
        <div className="opener-head">
          <span>Abertura ({o.openerLanguage.toUpperCase()})</span>
          <CopyButton text={o.opener} />
        </div>
        <blockquote lang={o.openerLanguage}>{o.opener}</blockquote>
      </div>
    </article>
  );
}

export function ReportView({ report }: { report: Report }) {
  const explicitCount = report.opportunities.filter((o) => o.classification === "Demanda explícita").length;
  let counter = 0;

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{formatDate(report.date)}</p>
        <h1>
          {report.opportunities.length === 0
            ? "Nenhuma oportunidade forte hoje"
            : `${report.opportunities.length} ${report.opportunities.length === 1 ? "oportunidade" : "oportunidades"}`}
        </h1>
        <p className="lead">{report.summary}</p>
        <div className="stats">
          <span>
            <strong>{explicitCount}</strong> demanda{explicitCount === 1 ? "" : "s"} explícita{explicitCount === 1 ? "" : "s"}
          </span>
          {MARKETS.map((m) => (
            <span key={m}>
              <strong>{report.opportunities.filter((o) => o.market === m).length}</strong> {m}
            </span>
          ))}
        </div>
      </section>

      {MARKETS.map((market) => {
        const items = report.opportunities.filter((o) => o.market === market);
        const notes = report.marketNotes.filter((n) => n.market === market);
        if (items.length === 0 && notes.length === 0) return null;
        return (
          <section key={market} className="market">
            <h2>
              {market}
              {market === "Reino Unido" ? <span className="muted"> · GBP</span> : null}
            </h2>
            {notes.map((n, i) => (
              <p key={i} className="note">
                {n.note}
              </p>
            ))}
            {items.map((o) => (
              <OpportunityCard key={o.company} o={o} index={++counter} />
            ))}
          </section>
        );
      })}

      {report.discarded.length > 0 ? (
        <details className="extra">
          <summary>Sinais descartados ({report.discarded.length})</summary>
          <ul>
            {report.discarded.map((d) => (
              <li key={d.name}>
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noreferrer">
                    {d.name}
                  </a>
                ) : (
                  d.name
                )}
                : {d.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {report.searches.length > 0 ? (
        <details className="extra">
          <summary>Buscas realizadas ({report.searches.length})</summary>
          <ul>
            {report.searches.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="meta muted">
        Gerado em {new Date(report.generatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} ·{" "}
        {report.model}
      </p>
    </>
  );
}
