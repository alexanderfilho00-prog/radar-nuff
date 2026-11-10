"use client";

import { CASE_PURPOSE, type Opportunity } from "@/lib/radar/types";
import { MISSING, formatShortDate, hasText, hostOf, languageName, pad } from "./format";

function Value({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Missing() {
  return <span className="missing">{MISSING}</span>;
}

function TextOrMissing({ value }: { value: string | null | undefined }) {
  return hasText(value) ? <Value>{value}</Value> : <Missing />;
}

export function VerificationLabel({ verified }: { verified: boolean | null | undefined }) {
  if (verified === true) return <span className="verify verify-ok">Fonte conferida</span>;
  if (verified === false) return <span className="verify verify-no">Fonte não confirmada</span>;
  return <span className="verify verify-unknown">Verificação não informada</span>;
}

export function ClassificationLabel({ value }: { value: Opportunity["classification"] }) {
  if (value === "Demanda explícita") return <span className="class class-explicit">Demanda explícita</span>;
  if (value === "Oportunidade inferida") return <span className="class class-inferred">Oportunidade inferida</span>;
  return <span className="class class-unknown">Classificação não informada</span>;
}

interface Props {
  opportunity: Opportunity;
  position: number;
  onCopy: (text: string) => void;
  copied: boolean;
  headingRef?: React.Ref<HTMLHeadingElement>;
}

export function OpportunityDetail({ opportunity: o, position, onCopy, copied, headingRef }: Props) {
  const hasSource = hasText(o.sourceUrl);
  const hasOpener = hasText(o.opener);

  return (
    <article className="detail" aria-labelledby="detail-title" key={o.id}>
      <header className="detail-head">
        <p className="detail-number" aria-hidden>
          {pad(position)}
        </p>
        <div className="detail-titles">
          <h2 id="detail-title" ref={headingRef} tabIndex={-1}>
            {o.company}
          </h2>
          <p className="detail-sub">
            <TextOrMissing value={o.niche} />
            <span className="sep" aria-hidden>
              /
            </span>
            <TextOrMissing value={o.country} />
            <span className="sep" aria-hidden>
              /
            </span>
            {hasText(o.website) ? (
              <a href={o.website} target="_blank" rel="noreferrer">
                {hostOf(o.website)}
              </a>
            ) : (
              <span>
                Site: <Missing />
              </span>
            )}
          </p>
          <div className="detail-labels">
            <ClassificationLabel value={o.classification} />
            <span className="plain-label">{o.market ?? "Mercado não informado"}</span>
            <VerificationLabel verified={o.sourceVerified} />
          </div>
        </div>
      </header>

      <div className="detail-actions">
        {hasSource ? (
          <a className="btn btn-ink" href={o.sourceUrl!} target="_blank" rel="noreferrer">
            Abrir fonte original
          </a>
        ) : (
          <span className="btn btn-disabled" aria-disabled="true">
            Fonte sem link
          </span>
        )}
        <button
          type="button"
          className="btn btn-yellow"
          onClick={() => hasOpener && onCopy(o.opener!)}
          disabled={!hasOpener}
        >
          {copied ? "Gancho copiado" : hasOpener ? "Copiar gancho" : "Sem gancho para copiar"}
        </button>
      </div>

      <section className="panel panel-observed" aria-labelledby="observed-title">
        <h3 id="observed-title">
          O que foi observado <span className="panel-note">dados da fonte</span>
        </h3>
        <dl className="fields">
          <div>
            <dt>Sinal</dt>
            <dd>
              <TextOrMissing value={o.whatHappened} />
            </dd>
          </div>
          <div>
            <dt>Trecho da fonte</dt>
            <dd>
              {hasText(o.evidenceQuote) ? (
                <blockquote className="quote" cite={o.sourceUrl ?? undefined}>
                  {o.evidenceQuote}
                </blockquote>
              ) : (
                <Missing />
              )}
            </dd>
          </div>
          <div>
            <dt>Data do sinal</dt>
            <dd>{hasText(o.eventDate) ? formatShortDate(o.eventDate) : <Missing />}</dd>
          </div>
          <div>
            <dt>Fonte</dt>
            <dd>
              {hasSource ? (
                <a href={o.sourceUrl!} target="_blank" rel="noreferrer" className="source-link">
                  {hostOf(o.sourceUrl!)}
                </a>
              ) : (
                <Missing />
              )}
              <span className="source-state">
                <VerificationLabel verified={o.sourceVerified} />
              </span>
              {o.sourceVerified === false ? (
                <p className="hint">O link não apareceu nos resultados conferidos pelo radar. Abra e confirme antes de usar.</p>
              ) : null}
              {o.extraSourceUrls && o.extraSourceUrls.length > 0 ? (
                <ul className="extra-sources">
                  {o.extraSourceUrls.map((u) => (
                    <li key={u}>
                      <a href={u} target="_blank" rel="noreferrer">
                        {hostOf(u)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel panel-nuff" aria-labelledby="nuff-title">
        <h3 id="nuff-title">
          O que o Nuff interpretou <span className="panel-note">leitura do estúdio</span>
        </h3>
        <dl className="fields">
          <div>
            <dt>Serviço para oferecer</dt>
            <dd>
              {hasText(o.service) ? <strong>{o.service}</strong> : <Missing />}
              {hasText(o.serviceWhy) ? <p>{o.serviceWhy}</p> : null}
            </dd>
          </div>
          <div>
            <dt>Quem abordar</dt>
            <dd>
              {hasText(o.contactName) ? (
                <>
                  <strong>{o.contactName}</strong>
                  {hasText(o.contactRole) ? `, ${o.contactRole}` : null}
                  <p className="hint">
                    {hasText(o.contactSourceUrl) ? (
                      <>
                        Nome conferido em{" "}
                        <a href={o.contactSourceUrl} target="_blank" rel="noreferrer">
                          {hostOf(o.contactSourceUrl)}
                        </a>
                      </>
                    ) : (
                      "Fonte do nome: não informada"
                    )}
                  </p>
                </>
              ) : (
                <>
                  <TextOrMissing value={o.contactRole} />
                  <p className="hint">Nome não verificado. Use só o cargo.</p>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Case</dt>
            <dd>
              {o.case ? (
                <>
                  <strong className="case-name">{o.case}</strong>
                  <span className="case-purpose">{CASE_PURPOSE[o.case]}</span>
                  {hasText(o.caseWhy) ? <p>{o.caseWhy}</p> : null}
                  <p className="hint">
                    Portfólio do case: <Missing />
                  </p>
                </>
              ) : (
                <Missing />
              )}
            </dd>
          </div>
          <div>
            <dt>Gancho de abordagem</dt>
            <dd>
              {hasOpener ? (
                <>
                  <blockquote className="opener" lang={o.openerLanguage ?? undefined}>
                    {o.opener}
                  </blockquote>
                  <p className="hint">Idioma: {languageName(o.openerLanguage)}. Rascunho para revisar antes de enviar.</p>
                </>
              ) : (
                <Missing />
              )}
            </dd>
          </div>
        </dl>
      </section>
    </article>
  );
}
