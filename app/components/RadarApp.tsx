"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nicheCategoryOf } from "@/lib/radar/niche";
import { combineRounds, readStoredRounds, type ImportSummary } from "@/lib/radar/store";
import {
  CASES,
  CLASSIFICATIONS,
  MARKETS,
  MAX_VISIBLE_PER_ROUND,
  NICHE_CATEGORIES,
  type LoadedRound,
  type Opportunity,
  type Round,
} from "@/lib/radar/types";
import { ImportDialog } from "./ImportDialog";
import { ClassificationLabel, OpportunityDetail, VerificationLabel } from "./OpportunityDetail";
import { MISSING, formatDate, formatShortDate, hasText, pad } from "./format";

type VerificationFilter = "" | "conferida" | "nao-confirmada" | "nao-informada";
interface Filters {
  market: string;
  classification: string;
  case: string;
  niche: string;
  verification: VerificationFilter;
}
const EMPTY_FILTERS: Filters = { market: "", classification: "", case: "", niche: "", verification: "" };

function verificationOf(o: Opportunity): Exclude<VerificationFilter, ""> {
  if (o.sourceVerified === true) return "conferida";
  if (o.sourceVerified === false) return "nao-confirmada";
  return "nao-informada";
}

function matches(o: Opportunity, f: Filters): boolean {
  if (f.market && o.market !== f.market) return false;
  if (f.classification && o.classification !== f.classification) return false;
  if (f.case && o.case !== f.case) return false;
  if (f.niche && nicheCategoryOf(o) !== f.niche) return false;
  if (f.verification && verificationOf(o) !== f.verification) return false;
  return true;
}

const MOBILE_QUERY = "(max-width: 899px)";

interface Props {
  repositoryRounds: Round[];
  repositoryProblems: string[];
}

export function RadarApp({ repositoryRounds, repositoryProblems }: Props) {
  const [rounds, setRounds] = useState<LoadedRound[]>(() => combineRounds(repositoryRounds, []));
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [hasStored, setHasStored] = useState(false);
  const [roundKey, setRoundKey] = useState<string | null>(() => combineRounds(repositoryRounds, [])[0]?.key ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const listRefs = useRef(new Map<string, HTMLButtonElement>());
  const pushedDetail = useRef(false);

  const reload = useCallback(
    (preferKey?: string) => {
      const { rounds: stored, warning } = readStoredRounds();
      const combined = combineRounds(repositoryRounds, stored);
      setRounds(combined);
      setHasStored(stored.length > 0);
      setStorageWarning(warning ?? null);
      setRoundKey((current) => {
        if (preferKey && combined.some((r) => r.key === preferKey)) return preferKey;
        if (current && combined.some((r) => r.key === current)) return current;
        return combined[0]?.key ?? null;
      });
    },
    [repositoryRounds],
  );

  // Rodadas importadas só existem no navegador: carregar depois de montar.
  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Botão "voltar" do navegador fecha o detalhe no celular.
  useEffect(() => {
    const onPop = () => {
      if (pushedDetail.current) {
        pushedDetail.current = false;
        setMobileDetail(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const round = rounds.find((r) => r.key === roundKey) ?? null;

  // Limite da especificação: até 5 por rodada, na ordem do arquivo. Sem reordenar
  // nem pontuar: a precedência entre classificação e mercado ainda está pendente.
  const visible = useMemo(() => round?.opportunities.slice(0, MAX_VISIBLE_PER_ROUND) ?? [], [round]);
  const hidden = useMemo(() => round?.opportunities.slice(MAX_VISIBLE_PER_ROUND) ?? [], [round]);
  const filtered = useMemo(() => visible.filter((o) => matches(o, filters)), [visible, filters]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Mantém uma seleção válida no desktop.
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((o) => o.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((o) => o.id === selectedId) ?? null;
  const selectedPosition = selected ? visible.findIndex((o) => o.id === selected.id) + 1 : 0;

  function showToast(text: string, tone: "ok" | "error" = "ok") {
    setToast({ text, tone });
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 2600);
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Navegadores sem permissão de área de transferência: método antigo.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (!ok) {
        showToast("Não foi possível copiar. Selecione o texto do gancho e copie manualmente.", "error");
        return;
      }
    }
    setCopiedId(id);
    showToast("Gancho copiado para a área de transferência.");
    window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2200);
  }

  function select(o: Opportunity) {
    setSelectedId(o.id);
    if (isMobile) {
      setMobileDetail(true);
      if (!pushedDetail.current) {
        window.history.pushState({ radarDetail: true }, "");
        pushedDetail.current = true;
      }
      window.scrollTo({ top: 0 });
      requestAnimationFrame(() => detailHeadingRef.current?.focus());
    }
  }

  function backToList() {
    const id = selectedId;
    if (pushedDetail.current) {
      window.history.back(); // dispara popstate, que fecha o detalhe
    } else {
      setMobileDetail(false);
    }
    setMobileDetail(false);
    requestAnimationFrame(() => {
      if (id) listRefs.current.get(id)?.focus();
    });
  }

  function onListKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next = filtered[index + (e.key === "ArrowDown" ? 1 : -1)];
    if (next) {
      listRefs.current.get(next.id)?.focus();
      if (!isMobile) setSelectedId(next.id);
    }
  }

  function onImported(summaries: ImportSummary[]) {
    reload(summaries[0]?.key);
    setFilters(EMPTY_FILTERS);
    setSelectedId(null);
  }

  const counts = useMemo(() => {
    const c = (pred: (o: Opportunity) => boolean) => visible.filter(pred).length;
    return {
      market: Object.fromEntries(MARKETS.map((m) => [m, c((o) => o.market === m)])),
      classification: Object.fromEntries(CLASSIFICATIONS.map((m) => [m, c((o) => o.classification === m)])),
      case: Object.fromEntries(CASES.map((m) => [m, c((o) => o.case === m)])),
      niche: Object.fromEntries([...NICHE_CATEGORIES, "Outro"].map((m) => [m, c((o) => nicheCategoryOf(o) === m)])),
      verification: {
        conferida: c((o) => verificationOf(o) === "conferida"),
        "nao-confirmada": c((o) => verificationOf(o) === "nao-confirmada"),
        "nao-informada": c((o) => verificationOf(o) === "nao-informada"),
      } as Record<string, number>,
    };
  }, [visible]);

  const filterControls = (
    <div className="filters" id="filters-panel">
      <FilterSelect
        id="f-market"
        label="Mercado"
        value={filters.market}
        onChange={(v) => setFilters((f) => ({ ...f, market: v }))}
        options={MARKETS.map((m) => ({ value: m, label: m, count: counts.market[m] }))}
      />
      <FilterSelect
        id="f-class"
        label="Classificação"
        value={filters.classification}
        onChange={(v) => setFilters((f) => ({ ...f, classification: v }))}
        options={CLASSIFICATIONS.map((m) => ({ value: m, label: m, count: counts.classification[m] }))}
      />
      <FilterSelect
        id="f-case"
        label="Case"
        value={filters.case}
        onChange={(v) => setFilters((f) => ({ ...f, case: v }))}
        options={CASES.map((m) => ({ value: m, label: m, count: counts.case[m] }))}
      />
      <FilterSelect
        id="f-niche"
        label="Nicho"
        value={filters.niche}
        onChange={(v) => setFilters((f) => ({ ...f, niche: v }))}
        options={[...NICHE_CATEGORIES, "Outro"].map((m) => ({ value: m, label: m, count: counts.niche[m] }))}
      />
      <FilterSelect
        id="f-verify"
        label="Fonte"
        value={filters.verification}
        onChange={(v) => setFilters((f) => ({ ...f, verification: v as VerificationFilter }))}
        options={[
          { value: "conferida", label: "Conferida", count: counts.verification.conferida },
          { value: "nao-confirmada", label: "Não confirmada", count: counts.verification["nao-confirmada"] },
          { value: "nao-informada", label: "Não informada", count: counts.verification["nao-informada"] },
        ]}
      />
      <button
        type="button"
        className="btn btn-clear"
        onClick={() => setFilters(EMPTY_FILTERS)}
        disabled={activeFilterCount === 0}
      >
        Limpar filtros
      </button>
    </div>
  );

  return (
    <div className={`app ${mobileDetail ? "is-detail" : "is-list"}`}>
      <a href="#lista" className="skip-link">
        Pular para a lista de oportunidades
      </a>

      <header className="poster">
        <div className="poster-inner">
          <h1 className="poster-title">Radar de Prospecção Criativa</h1>
          <p className="signature">
            Studio Nuff<span className="asterisk" aria-hidden>*</span>
          </p>
          <div className="round-bar">
            {rounds.length > 0 ? (
              <div className="round-picker">
                <label htmlFor="round-select">Rodada</label>
                <select
                  id="round-select"
                  value={roundKey ?? ""}
                  onChange={(e) => {
                    setRoundKey(e.target.value);
                    setFilters(EMPTY_FILTERS);
                    setSelectedId(null);
                    setMobileDetail(false);
                  }}
                >
                  {rounds.map((r) => (
                    <option key={r.key} value={r.key}>
                      {formatShortDate(r.date)}, {r.origin}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {round ? (
              <>
                <p className="round-facts">
                  <span className="round-date">{formatDate(round.date)}</span>
                  <span>
                    {visible.length} {visible.length === 1 ? "oportunidade" : "oportunidades"}
                    {hidden.length > 0 ? ` (${round.opportunities.length} no arquivo)` : ""}
                  </span>
                </p>
                <p className={`stamp stamp-${round.origin === "manual" ? "manual" : "auto"}`}>
                  Rodada {round.origin}
                </p>
              </>
            ) : null}
            <button type="button" className="btn btn-ink btn-import" onClick={() => setImportOpen(true)}>
              Importar rodada
            </button>
          </div>
        </div>
      </header>

      {storageWarning || repositoryProblems.length > 0 ? (
        <div className="notice" role="alert">
          {storageWarning ? <p>{storageWarning}</p> : null}
          {repositoryProblems.map((p) => (
            <p key={p}>Arquivo do repositório ignorado: {p}</p>
          ))}
        </div>
      ) : null}

      {!round ? (
        <section className="empty-app">
          <h2>Nenhuma rodada carregada</h2>
          <p>Importe o arquivo JSON de uma rodada para começar.</p>
          <button type="button" className="btn btn-yellow" onClick={() => setImportOpen(true)}>
            Importar rodada
          </button>
        </section>
      ) : (
        <>
          <div className="toolbar">
            <button
              type="button"
              className="btn btn-filters-toggle"
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              Filtros{activeFilterCount ? ` (${activeFilterCount} ativos)` : ""}
            </button>
            <div className={`filters-wrap ${filtersOpen ? "open" : ""}`}>{filterControls}</div>
            <p className="result-count" aria-live="polite">
              {activeFilterCount
                ? `${filtered.length} de ${visible.length} oportunidades com estes filtros`
                : `${visible.length} ${visible.length === 1 ? "oportunidade" : "oportunidades"} nesta rodada`}
            </p>
          </div>

          <div className="workspace">
            <section className="list-pane" aria-label="Oportunidades da rodada" id="lista">
              {hasText(round.summary) ? <p className="round-summary">{round.summary}</p> : null}

              {filtered.length === 0 ? (
                <div className="empty-filter">
                  <p>Nenhuma oportunidade desta rodada combina com os filtros escolhidos.</p>
                  <button type="button" className="btn btn-yellow" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <ol className="opp-list">
                  {filtered.map((o, i) => {
                    const position = visible.findIndex((v) => v.id === o.id) + 1;
                    const isSelected = o.id === selectedId && (!isMobile || mobileDetail);
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          ref={(el) => {
                            if (el) listRefs.current.set(o.id, el);
                            else listRefs.current.delete(o.id);
                          }}
                          className={`opp ${o.id === selectedId && !isMobile ? "selected" : ""}`}
                          aria-current={isSelected ? "true" : undefined}
                          onClick={() => select(o)}
                          onKeyDown={(e) => onListKey(e, i)}
                        >
                          <span className="opp-number" aria-hidden>
                            {pad(position)}
                          </span>
                          <span className="opp-body">
                            <span className="opp-company">{o.company}</span>
                            <span className="opp-meta">
                              <span>{o.market ?? `Mercado: ${MISSING}`}</span>
                              <ClassificationLabel value={o.classification} />
                              {o.sourceVerified === false ? <VerificationLabel verified={false} /> : null}
                            </span>
                            <span className="opp-signal">{hasText(o.whatHappened) ? o.whatHappened : `Sinal: ${MISSING}`}</span>
                          </span>
                          {o.id === selectedId && !isMobile ? <span className="sr-only">(selecionada)</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}

              {hidden.length > 0 ? (
                <details className="limit-note">
                  <summary>
                    {hidden.length} {hidden.length === 1 ? "entrada ficou" : "entradas ficaram"} de fora do limite de{" "}
                    {MAX_VISIBLE_PER_ROUND}
                  </summary>
                  <p>
                    Esta rodada tem {round.opportunities.length} entradas. O radar mostra as {MAX_VISIBLE_PER_ROUND} primeiras na
                    ordem do arquivo, sem reordenar. Ficaram de fora:
                  </p>
                  <ol start={MAX_VISIBLE_PER_ROUND + 1}>
                    {hidden.map((o) => (
                      <li key={o.id}>{o.company}</li>
                    ))}
                  </ol>
                </details>
              ) : null}

              <RoundAppendix round={round} />
            </section>

            <section className="detail-pane" aria-label="Detalhe da oportunidade">
              {isMobile ? (
                <button type="button" className="btn btn-back" onClick={backToList}>
                  Voltar à lista
                </button>
              ) : null}
              {selected ? (
                <OpportunityDetail
                  key={selected.id}
                  opportunity={selected}
                  position={selectedPosition}
                  copied={copiedId === selected.id}
                  onCopy={(t) => copy(t, selected.id)}
                  headingRef={detailHeadingRef}
                />
              ) : (
                <div className="detail-empty">
                  <p>Escolha uma oportunidade na lista para ver a evidência e o gancho.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <footer className="foot">
        Rascunhos para revisão. O radar não envia mensagens.
      </footer>

      <div className={`toast ${toast ? "show" : ""} ${toast?.tone === "error" ? "toast-error" : ""}`} role="status" aria-live="polite">
        {toast?.text}
      </div>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        rounds={rounds}
        onImported={onImported}
        onCleared={() => {
          reload();
          setImportOpen(false);
          showToast("Importações deste navegador apagadas.");
        }}
        hasStored={hasStored}
      />
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count: number }[];
}) {
  return (
    <div className={`filter ${value ? "active" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} ({o.count})
          </option>
        ))}
      </select>
    </div>
  );
}

function RoundAppendix({ round }: { round: LoadedRound }) {
  const notes = round.marketNotes ?? [];
  const discarded = round.discarded ?? [];
  const searches = round.searches ?? [];
  return (
    <div className="appendix">
      {notes.length > 0 ? (
        <div className="market-notes">
          <h2>Mercados sem oportunidade forte</h2>
          {notes.map((n) => (
            <p key={n.market}>
              <strong>{n.market}.</strong> {n.note}
            </p>
          ))}
        </div>
      ) : null}
      {discarded.length > 0 ? (
        <details>
          <summary>Sinais descartados ({discarded.length})</summary>
          <ul>
            {discarded.map((d) => (
              <li key={d.name}>
                {hasText(d.url) ? (
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
      {searches.length > 0 ? (
        <details>
          <summary>Buscas feitas ({searches.length})</summary>
          <ul>
            {searches.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <p className="provenance">
        Origem: rodada {round.origin}.{" "}
        {round.provenance === "repositório"
          ? "Carregada do repositório."
          : `Importada neste navegador${round.importedAt ? ` em ${new Date(round.importedAt).toLocaleString("pt-BR")}` : ""}.`}
        {hasText(round.model) ? ` Gerada por: ${round.model}.` : ""}
      </p>
    </div>
  );
}
