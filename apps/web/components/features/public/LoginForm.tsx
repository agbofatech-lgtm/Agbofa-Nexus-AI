"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button, Input } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  loginSchema,
  type LoginFormData,
} from "@/lib/validations/login.schema";
import type { AuthErrorCode } from "@/types/auth";

const demoCredentials: LoginFormData = {
  tenant: "agbofa",
  admin: "admin@agbofa.ai",
  password: "nexus-demo",
};

interface LoginFormProps {
  nextPath?: string;
  sessionExpired?: boolean;
}

export function LoginForm({
  nextPath = "/dashboard",
  sessionExpired = false,
}: LoginFormProps) {
  const router = useRouter();
  const { signIn, status } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tenant: "", admin: "", password: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (status === "authenticated" && !success) router.replace(nextPath);
  }, [nextPath, router, status, success]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    setErrorCode(null);
    setSuccess(false);

    const result = await signIn(data);
    if (!result.success) {
      setErrorCode(result.code);
      setFormError(result.message);
      return;
    }

    setSuccess(true);
    window.setTimeout(() => router.replace(nextPath), 450);
  };

  const useDemoAccess = () => {
    setValue("tenant", demoCredentials.tenant, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("admin", demoCredentials.admin, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("password", demoCredentials.password, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setFormError(null);
    setErrorCode(null);
  };

  return (
    <div className="login-form-wrap">
      <div className="login-form__heading">
        <span className="section-kicker">
          <ShieldCheck size={13} /> Frontend access preview
        </span>
        <h1>Enter the demo workspace.</h1>
        <p>
          Use the published demonstration credentials. This creates a
          browser-local session, not a production-authenticated account.
        </p>
      </div>

      <form
        className={formError ? "login-form login-form--error" : "login-form"}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        {sessionExpired && !formError && !success ? (
          <div className="auth-toast auth-toast--notice" role="status">
            <Clock3 size={17} />
            <div>
              <strong>Demo session expired</strong>
              <span>Use the demonstration credentials to reopen the workspace.</span>
            </div>
          </div>
        ) : null}

        {formError ? (
          <div className="auth-toast auth-toast--error" role="alert">
            <AlertCircle size={17} />
            <div>
              <strong>
                {errorCode === "network_error"
                  ? "Connection interrupted"
                  : "Sign-in failed"}
              </strong>
              <span>{formError}</span>
            </div>
            {errorCode === "network_error" ? (
              <button
                disabled={isSubmitting}
                onClick={() => void handleSubmit(onSubmit)()}
                type="button"
              >
                <RefreshCw size={13} /> Retry
              </button>
            ) : null}
          </div>
        ) : null}

        {success ? (
          <div className="auth-toast auth-toast--success" role="status">
            <CheckCircle2 size={17} />
            <div>
              <strong>Demo session created locally</strong>
              <span>Opening the frontend workspace preview…</span>
            </div>
          </div>
        ) : null}

        <Controller
          control={control}
          name="tenant"
          render={({ field }) => (
            <Input
              {...field}
              autoCapitalize="none"
              autoComplete="organization"
              disabled={isSubmitting || success}
              error={errors.tenant?.message}
              icon={<Sparkles size={17} />}
              label="Tenant"
              placeholder="Your organization tenant"
              required
            />
          )}
        />

        <Controller
          control={control}
          name="admin"
          render={({ field }) => (
            <Input
              {...field}
              autoCapitalize="none"
              autoComplete="username"
              disabled={isSubmitting || success}
              error={errors.admin?.message}
              label="Admin"
              placeholder="admin@organization.com"
              required
              type="email"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input
              {...field}
              autoComplete="current-password"
              disabled={isSubmitting || success}
              error={errors.password?.message}
              icon={<KeyRound size={17} />}
              label="Password"
              placeholder="Enter your password"
              required
              type="password"
            />
          )}
        />

        <div className="login-form__options">
          <span>Frontend role preview · not a security boundary</span>
          <a href="mailto:support@agbofa.ai?subject=Nexus%20password%20recovery">
            Forgot password?
          </a>
        </div>

        <Button
          className="login-form__submit"
          disabled={success}
          loading={isSubmitting}
          size="lg"
          type="submit"
        >
          {success
            ? "Opening workspace"
            : isSubmitting
              ? "Verifying access"
              : "Sign in"}
          {!isSubmitting && !success ? <ArrowRight size={17} /> : null}
        </Button>
      </form>

      <div className="demo-access glass">
        <div>
          <span>Demo access</span>
          <code>agbofa · admin@agbofa.ai · nexus-demo</code>
        </div>
        <button onClick={useDemoAccess} type="button">
          Use credentials
        </button>
      </div>

      <p className="login-form__legal">
        Demonstration access is stored only in this browser session.{" "}
        <Link href="/">Return to public site</Link>
      </p>
    </div>
  );
}
