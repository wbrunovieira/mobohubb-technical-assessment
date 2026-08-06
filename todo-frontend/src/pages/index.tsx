import Head from "next/head";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  ApiError,
  createTodo,
  deleteTodo,
  listTodos,
  updateTodo,
  type Todo,
} from "@/lib/api/todos";
import { NewTodoForm } from "@/components/NewTodoForm";
import styles from "@/styles/Home.module.css";

type LoadState = "loading" | "error" | "ready";

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatCreatedAt(createdAt: string): string {
  return dateFormatter.format(new Date(createdAt));
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function Home() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(
    null,
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    listTodos()
      .then((loaded) => {
        if (cancelled) return;
        setTodos(loaded);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadErrorMessage(messageFor(error, "Ocurrió un error inesperado."));
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const markPending = (id: number, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleCreate = async (title: string, description: string) => {
    if (title.length === 0) {
      throw new ApiError(400, "El título no puede estar vacío.");
    }

    const created = await createTodo({
      title,
      description: description.length > 0 ? description : undefined,
    });

    setTodos((current) => [created, ...current]);
    setActionError(null);
    setIsFormOpen(false);
  };

  const handleToggle = async (todo: Todo) => {
    if (pendingIds.has(todo.id)) return;

    markPending(todo.id, true);
    const previous = todos;
    setTodos((current) =>
      current.map((item) =>
        item.id === todo.id ? { ...item, completed: !item.completed } : item,
      ),
    );

    try {
      const updated = await updateTodo(todo.id, {
        completed: !todo.completed,
      });
      setTodos((current) =>
        current.map((item) => (item.id === todo.id ? updated : item)),
      );
      setActionError(null);
    } catch (error) {
      setTodos(previous);
      setActionError(
        messageFor(error, "No se pudo actualizar la tarea. Intenta de nuevo."),
      );
    } finally {
      markPending(todo.id, false);
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (pendingIds.has(todo.id)) return;

    markPending(todo.id, true);
    const previous = todos;
    setTodos((current) => current.filter((item) => item.id !== todo.id));

    try {
      await deleteTodo(todo.id);
      setActionError(null);
    } catch (error) {
      setTodos(previous);
      setActionError(
        messageFor(error, "No se pudo eliminar la tarea. Intenta de nuevo."),
      );
    } finally {
      markPending(todo.id, false);
    }
  };

  return (
    <>
      <Head>
        <title>Mis tareas</title>
        <meta
          name="description"
          content="Organiza tus tareas de forma simple y clara."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.page}>
        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <ClipboardList size={28} strokeWidth={2} aria-hidden />
              <div>
                <h1>Mis tareas</h1>
                <p className={styles.subtitle}>
                  Organiza tu día, una tarea a la vez.
                </p>
              </div>
            </div>
            {!isFormOpen && (
              <button
                type="button"
                className={styles.newTaskButton}
                onClick={() => setIsFormOpen(true)}
              >
                <Plus size={18} aria-hidden />
                Nueva tarea
              </button>
            )}
          </header>

          {actionError && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={18} aria-hidden />
              <p>{actionError}</p>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setActionError(null)}
                aria-label="Cerrar aviso"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          )}

          {isFormOpen && (
            <NewTodoForm
              onSubmit={handleCreate}
              onCancel={() => setIsFormOpen(false)}
            />
          )}

          {loadState === "loading" && (
            <div className={styles.statusPanel}>
              <Loader2 size={32} className={styles.spinner} aria-hidden />
              <p>Cargando tus tareas…</p>
            </div>
          )}

          {loadState === "error" && (
            <div className={styles.statusPanel}>
              <AlertCircle size={32} className={styles.errorIcon} aria-hidden />
              <p>No pudimos conectar con el servidor.</p>
              <p className={styles.statusDetail}>{loadErrorMessage}</p>
            </div>
          )}

          {loadState === "ready" && todos.length === 0 && (
            <div className={styles.statusPanel}>
              <Sparkles size={32} className={styles.emptyIcon} aria-hidden />
              <p>¡Todo despejado! No tienes tareas pendientes.</p>
              <p className={styles.statusDetail}>
                Cuando agregues una tarea, aparecerá aquí.
              </p>
            </div>
          )}

          {loadState === "ready" && todos.length > 0 && (
            <ul className={styles.todoList}>
              {todos.map((todo) => {
                const isPending = pendingIds.has(todo.id);
                return (
                  <li
                    key={todo.id}
                    className={`${styles.todoItem} ${
                      todo.completed ? styles.todoItemCompleted : ""
                    } ${isPending ? styles.todoItemPending : ""}`}
                  >
                    <button
                      type="button"
                      className={styles.statusButton}
                      onClick={() => handleToggle(todo)}
                      disabled={isPending}
                      aria-label={
                        todo.completed
                          ? "Marcar como pendiente"
                          : "Marcar como completada"
                      }
                    >
                      {todo.completed ? (
                        <CheckCircle2
                          size={22}
                          className={styles.todoStatusIconDone}
                          aria-hidden
                        />
                      ) : (
                        <Circle
                          size={22}
                          className={styles.todoStatusIcon}
                          aria-hidden
                        />
                      )}
                    </button>
                    <div className={styles.todoContent}>
                      <p className={styles.todoTitle}>{todo.title}</p>
                      {todo.description && (
                        <p className={styles.todoDescription}>
                          {todo.description}
                        </p>
                      )}
                      <p className={styles.todoDate}>
                        Creada el {formatCreatedAt(todo.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDelete(todo)}
                      disabled={isPending}
                      aria-label="Eliminar tarea"
                      title="Eliminar tarea"
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </>
  );
}
