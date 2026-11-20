import { NextResponse, type NextRequest } from "next/server";
import { ValidationError, type AnySchema, type InferType } from "yup";
import mongoose from "mongoose";
import { connectDB } from "@/server/db";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, message: string, fields?: Record<string, string>) {
  return NextResponse.json({ ok: false, error: message, fields }, { status });
}

/** Validates a JSON body with a Yup schema; strips unknown keys. */
export async function parseBody<S extends AnySchema>(req: Request, schema: S): Promise<InferType<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  return schema.validate(raw, { abortEarly: false, stripUnknown: true }) as Promise<InferType<S>>;
}

export function parseQuery<S extends AnySchema>(req: NextRequest, schema: S): Promise<InferType<S>> {
  const obj = Object.fromEntries(req.nextUrl.searchParams.entries());
  return schema.validate(obj, { abortEarly: false, stripUnknown: true }) as Promise<InferType<S>>;
}

export function assertObjectId(id: string, what = "resource") {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, `That ${what} doesn't exist.`);
}

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, ctx: Ctx<P>) => Promise<Response>;

/**
 * Wraps a route handler: connects to the DB and converts thrown errors into
 * consistent JSON responses so handlers can just `throw`.
 */
export function route<P = Record<string, string>>(handler: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    try {
      await connectDB();
      return await handler(req, ctx);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export function toErrorResponse(err: unknown) {
  if (err instanceof ApiError) return fail(err.status, err.message, err.fields);
  if (err instanceof ValidationError) {
    const fields: Record<string, string> = {};
    for (const e of err.inner.length ? err.inner : [err]) if (e.path && !fields[e.path]) fields[e.path] = e.message;
    return fail(422, err.inner[0]?.message ?? err.message, fields);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(err.errors)) fields[k] = v.message;
    return fail(422, Object.values(fields)[0] ?? "Invalid data.", fields);
  }
  if (err instanceof mongoose.Error.CastError) return fail(400, `Invalid value for ${err.path}.`);
  if (typeof err === "object" && err && "code" in err && (err as { code: number }).code === 11000) {
    const key = Object.keys((err as { keyValue?: object }).keyValue ?? {})[0];
    return fail(409, key ? `That ${key} is already in use.` : "That record already exists.");
  }
  console.error("[api] unhandled error", err);
  return fail(500, "Something went wrong on our side. Please try again.");
}
