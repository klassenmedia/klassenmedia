import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const token = typeof invite === "string" && /^[a-f0-9]{32}$/.test(invite) ? invite : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <RegisterForm invite={token} />
    </div>
  );
}
