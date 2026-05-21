import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";

function Logo() {
  return (
    <img
      src="/logo_login.png"
      alt="V-Commerce CRM360"
      className="h-36 w-auto drop-shadow-lg"
    />
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    try {
      await login(email, password);
      navigate("/")
    } catch (err){
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    }
  }

  const inputCls = (hasError: boolean) =>
    `h-10 w-full rounded-md border px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-400 focus:ring-red-300/50 focus:border-red-500 bg-red-50"
        : "border-gray-300 focus:ring-[#74FF60]/60 focus:border-[#74FF60]"
    }`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#030a12]">
      {/* background — dark forest-green → near-black, matching reference */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 15% 50%, #143520 0%, #0c2418 28%, #07101e 58%, #030a12 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 w-full">
        <Logo />

        {/* card */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Login</h1>
          <p className="text-sm text-gray-500 mb-6">
            Utilize as credenciais da empresa para acesso.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-800">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="example"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                className={inputCls(!!error)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-800">
                Senha
              </label>
              <div className="relative pb-5">
                <input
                  id="password"
                  type="password"
                  placeholder="example"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                  className={inputCls(!!error)}
                />
                <button
                  type="button"
                  className="absolute right-0 bottom-0 text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  Recuperar senha
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <svg
                  className="mt-0.5 shrink-0 text-red-500"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-red-600 leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 self-center px-10 py-2 rounded-md border border-[#D1B1E5] text-sm font-medium text-gray-800 bg-[#F7EBFF] hover:bg-[#F0DDFD] transition-colors"
            >
              Acessar
            </button>
          </form>
        </div>

        {/* footer */}
        <p className="text-xs text-white/40 text-center">
          @2026 V-Commerce, Inc. Todos os direitos reservados.{" "}
          <button className="underline hover:text-white/60 transition-colors">
            Política de Privacidade
          </button>
        </p>
      </div>
    </div>
  );
}
