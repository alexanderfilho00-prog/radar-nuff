import { notFound } from "next/navigation";
import { ReportView } from "../../components/ReportView";
import { getReport, listReportDates } from "@/lib/reports";

export const dynamicParams = false;

export function generateStaticParams() {
  return listReportDates().map((data) => ({ data }));
}

export default async function ReportPage({ params }: { params: Promise<{ data: string }> }) {
  const { data } = await params;
  const report = getReport(data);
  if (!report) notFound();
  return <ReportView report={report} />;
}
