import { RadarApp } from "./components/RadarApp";
import { loadRepositoryRounds } from "@/lib/reports";

export default function Page() {
  const { rounds, problems } = loadRepositoryRounds();
  return <RadarApp repositoryRounds={rounds} repositoryProblems={problems} />;
}
