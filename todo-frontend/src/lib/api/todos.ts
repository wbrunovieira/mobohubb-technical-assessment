// API client for the todo-backend REST API. Base URL comes from
// NEXT_PUBLIC_API_URL so it can differ between dev/staging/prod without
// code changes — see .env.local / .env.example.

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
}

// Nest's built-in exception filter shape: 404s send a single string message,
// class-validator 400s send an array (one entry per failed constraint).
interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function apiUrl(path: string): string {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local.",
    );
  }
  return `${API_URL}${path}`;
}

async function throwApiError(response: Response): Promise<never> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // Response body wasn't JSON (or was empty) — fall back below.
  }

  const message = Array.isArray(body?.message)
    ? body.message.join(" ")
    : (body?.message ?? `Request failed with status ${response.status}`);

  throw new ApiError(response.status, message);
}

export async function listTodos(): Promise<Todo[]> {
  const response = await fetch(apiUrl("/todos"));

  if (!response.ok) {
    await throwApiError(response);
  }

  return (await response.json()) as Todo[];
}

export async function getTodo(id: number): Promise<Todo> {
  const response = await fetch(apiUrl(`/todos/${id}`));

  if (!response.ok) {
    await throwApiError(response);
  }

  return (await response.json()) as Todo;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await fetch(apiUrl("/todos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  return (await response.json()) as Todo;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

export async function updateTodo(
  id: number,
  input: UpdateTodoInput,
): Promise<Todo> {
  const response = await fetch(apiUrl(`/todos/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  return (await response.json()) as Todo;
}

export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(apiUrl(`/todos/${id}`), { method: "DELETE" });

  if (!response.ok) {
    await throwApiError(response);
  }
}
