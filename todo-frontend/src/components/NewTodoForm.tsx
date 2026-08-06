import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import styles from "@/styles/Home.module.css";

interface NewTodoFormProps {
  onSubmit: (title: string, description: string) => Promise<void>;
  onCancel: () => void;
}

export function NewTodoForm({ onSubmit, onCancel }: NewTodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(title.trim(), description.trim());
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear la tarea.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.newTodoForm} onSubmit={handleSubmit}>
      <div className={styles.newTodoFormHeader}>
        <h2>Nueva tarea</h2>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onCancel}
          aria-label="Cancelar"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <label className={styles.formField}>
        <span>Título</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="¿Qué necesitas hacer?"
          autoFocus
          required
        />
      </label>

      <label className={styles.formField}>
        <span>Descripción (opcional)</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Agrega más detalles si quieres…"
          rows={2}
        />
      </label>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSubmitting || title.trim().length === 0}
        >
          {isSubmitting ? "Guardando…" : "Guardar tarea"}
        </button>
      </div>
    </form>
  );
}
