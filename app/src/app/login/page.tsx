import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const token = typeof invite === "string" && /^[a-f0-9]{32}$/.test(invite) ? invite : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <LoginForm invite={token} />
    </div>
  );
}
