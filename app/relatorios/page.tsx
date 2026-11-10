import Link from "next/link";
import { formatDate, getReport, listReportDates } from "@/lib/reports";

export const metadata = { title: "Histórico · Radar de Prospecção" };

export default function ArchivePage() {
  const dates = listReportDates();
  return (
    <section className="hero">
      <p className="eyebrow">Histórico</p>
      <h1>Relatórios anteriores</h1>
      {dates.length === 0 ? <p className="lead">Ainda não há relatórios.</p> : null}
      <ul className="archive">
        {dates.map((d) => {
          const r = getReport(d);
          const n = r?.opportunities.length ?? 0;
          return (
            <li key={d}>
              <Link href={`/relatorios/${d}`}>
                <span>{formatDate(d)}</span>
                <span className="muted">
                  {n} {n === 1 ? "oportunidade" : "oportunidades"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
