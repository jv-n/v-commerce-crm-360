import { useNavigate } from "react-router-dom";

function Logo() {
  return (
    <img
      src="/logo_login.png"
      alt="V-Commerce CRM360"
      className="h-36 w-auto drop-shadow-lg"
    />
  );
}

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#030a12]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 15% 50%, #143520 0%, #0c2418 28%, #07101e 58%, #030a12 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 w-full">
        <Logo />

        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-8 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl font-bold text-gray-200">403</span>
          <h1 className="text-xl font-bold text-gray-900">Acesso negado</h1>
          <p className="text-sm text-gray-500">
            Você não tem permissão para acessar esta página. Entre em contato com o administrador caso acredite que isso é um erro.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-2 px-8 py-2 rounded-md border border-gray-400 text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Voltar ao início
          </button>
        </div>

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
