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

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        phone: phone.trim() || undefined,
        password,
      });
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
        <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Create Account</h1>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              required
              placeholder="Last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={inputClass}
            />
          </div>
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />
          {error && <p className="font-mono text-xs text-clay">[ {error} ]</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-fit transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <BrushButton>
              {submitting ? "[ Creating account… ]" : "[ Create Account ]"}
            </BrushButton>
          </button>
        </form>
        <p className="mt-6 text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Log in
          </Link>
        </p>
        </Reveal>
      </Container>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
