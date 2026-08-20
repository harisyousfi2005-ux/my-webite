"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { BrushButton } from "@/components/ui/BrushButton";
import { Reveal } from "@/components/ui/Reveal";

const inputClass =
  "w-full border border-ink/20 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-colors focus:border-clay focus:outline-none";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-16">
      <Container className="max-w-md">
        <Reveal>
          <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Log In</h1>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
            {error && <p className="font-mono text-xs text-clay">[ {error} ]</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-fit transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <BrushButton>{submitting ? "[ Logging in… ]" : "[ Log In ]"}</BrushButton>
            </button>
          </form>
          <p className="mt-6 text-sm text-ink-soft">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-ink underline underline-offset-4">
              Create one
            </Link>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
