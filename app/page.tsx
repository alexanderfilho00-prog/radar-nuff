import { ReportView } from "./components/ReportView";
import { getLatestReport } from "@/lib/reports";

export default function HomePage() {
  const report = getLatestReport();
  if (!report) {
    return (
      <section className="hero">
        <h1>Nenhum relatório ainda</h1>
        <p className="lead">
          Rode o workflow &quot;Radar diário&quot; no GitHub Actions ou <code>npm run radar</code> para gerar o primeiro.
        </p>
      </section>
    );
  }
  return <ReportView report={report} />;
}
