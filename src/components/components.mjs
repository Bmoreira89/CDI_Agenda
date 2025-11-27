// components/Layout.js
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Layout({ children }) {
  const [nome, setNome] = useState("Dr(a). Usuário");
  const [perfil, setPerfil] = useState("medico");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedNome = localStorage.getItem("agenda_cdi_nome");
    const storedPerfil = localStorage.getItem("agenda_cdi_perfil");
    if (storedNome) setNome(storedNome);
    if (storedPerfil) setPerfil(storedPerfil);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header
        style={{
          background: "#0f172a",
          color: "#fff",
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "14px" }}>Agenda CDI</div>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>
            Olá, {nome} 👋
          </div>
        </div>
        <nav style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
          <Link href="/">Início</Link>
          <Link href="/agenda">Agenda</Link>
          <Link href="/configuracoes">Configurações</Link>
          {perfil === "admin" && <Link href="/admin">Painel Admin</Link>}
        </nav>
      </header>
      <main style={{ padding: "24px 40px" }}>{children}</main>
    </div>
  );
}
