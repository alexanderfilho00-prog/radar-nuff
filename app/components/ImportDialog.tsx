"use client";

import { useEffect, useRef, useState } from "react";
import { importRounds, clearStoredRounds, type ImportSummary } from "@/lib/radar/store";
import type { LoadedRound } from "@/lib/radar/types";
import { formatShortDate } from "./format";

interface Props {
  open: boolean;
  onClose: () => void;
  rounds: LoadedRound[];
  onImported: (summaries: ImportSummary[]) => void;
  onCleared: () => void;
  hasStored: boolean;
}

type Feedback =
  | { kind: "idle" }
  | { kind: "error"; issues: { where: string; message: string }[] }
  | { kind: "success"; summaries: ImportSummary[] };

export function ImportDialog({ open, onClose, rounds, onImported, onCleared, hasStored }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFeedback({ kind: "idle" });
      setConfirmClear(false);
    }
  }, [open]);

  async function readFile(file: File) {
    setFileName(file.name);
    setText(await file.text());
    setFeedback({ kind: "idle" });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setFeedback({ kind: "error", issues: [{ where: "Arquivo", message: "escolha um arquivo .json ou cole o conteúdo da rodada" }] });
      return;
    }
    const result = importRounds(text, rounds);
    if (!result.ok) {
      setFeedback({ kind: "error", issues: result.issues });
      return;
    }
    setFeedback({ kind: "success", summaries: result.summaries });
    setText("");
    setFileName(null);
    onImported(result.summaries);
  }

  return (
    <dialog ref={ref} className="import" aria-labelledby="import-title" onClose={onClose} onCancel={onClose}>
      <form onSubmit={submit} className="import-body">
        <div className="import-head">
          <h2 id="import-title">Importar rodada</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>

        <p className="import-intro">
          Envie um arquivo JSON no formato do radar. A importação fica salva neste navegador. Se a rodada já existir
          (mesma data e origem), as oportunidades com o mesmo nome são atualizadas, sem duplicar.
        </p>
        <p className="import-intro">
          <a href="/exemplos/rodada-exemplo.json" download>
            Baixar o exemplo (rodada manual de 10/11/2026)
          </a>
        </p>

        <label className="field-label" htmlFor="import-file">
          Arquivo da rodada
        </label>
        <input
          id="import-file"
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void readFile(f);
          }}
        />
        {fileName ? <p className="hint">Arquivo carregado: {fileName}</p> : null}

        <label className="field-label" htmlFor="import-text">
          Ou cole o conteúdo
        </label>
        <textarea
          id="import-text"
          rows={7}
          spellCheck={false}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setFileName(null);
            setFeedback({ kind: "idle" });
          }}
          placeholder='{ "date": "2026-11-11", "origin": "manual", "opportunities": [ … ] }'
        />

        <div role="status" aria-live="polite" className="import-feedback">
          {feedback.kind === "error" ? (
            <div className="feedback feedback-error">
              <p>
                <strong>Nada foi importado.</strong> Corrija {feedback.issues.length === 1 ? "o ponto abaixo" : `os ${feedback.issues.length} pontos abaixo`} e
                tente de novo. Os dados atuais continuam iguais.
              </p>
              <ul>
                {feedback.issues.slice(0, 12).map((i, idx) => (
                  <li key={idx}>
                    <strong>{i.where}</strong>: {i.message}
                  </li>
                ))}
              </ul>
              {feedback.issues.length > 12 ? <p>E mais {feedback.issues.length - 12} pontos.</p> : null}
            </div>
          ) : null}
          {feedback.kind === "success" ? (
            <div className="feedback feedback-success">
              <p>
                <strong>Rodada importada.</strong>
              </p>
              <ul>
                {feedback.summaries.map((s) => (
                  <li key={s.key}>
                    {formatShortDate(s.date)} ({s.origin}): {s.added} {s.added === 1 ? "nova" : "novas"}, {s.updated}{" "}
                    {s.updated === 1 ? "atualizada" : "atualizadas"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="import-actions">
          <button type="submit" className="btn btn-ink">
            Validar e importar
          </button>
          {hasStored ? (
            confirmClear ? (
              <span className="confirm-clear">
                Apagar as importações deste navegador?{" "}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    clearStoredRounds();
                    setConfirmClear(false);
                    onCleared();
                  }}
                >
                  Apagar importações
                </button>{" "}
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(false)}>
                  Manter
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(true)}>
                Apagar importações deste navegador
              </button>
            )
          ) : null}
        </div>
      </form>
    </dialog>
  );
}
