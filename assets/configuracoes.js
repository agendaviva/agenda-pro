const currentPage = window.location.pathname.split("/").pop();

function activeClass(page) {
  return currentPage === page
    ? "bg-green-600 text-white"
    : "text-gray-700 hover:bg-green-50";
}

// 🔥 ESPERA O HTML EXISTIR
window.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("menu-container");
  if (!container) return;

  container.innerHTML = `
    <!-- Overlay -->
    <div id="overlay" class="fixed inset-0 bg-black/40 hidden z-40 md:hidden"></div>

    <!-- Sidebar -->
    <aside id="sidebar" class="fixed z-50 top-0 left-0 h-full w-72 bg-white border-r border-green-100 p-6 transform -translate-x-full md:translate-x-0 transition-transform duration-300 shadow-lg flex flex-col">

      <div>
        <div class="mb-10">
          <h1 class="text-2xl font-bold text-green-700">Agenda Lux</h1>
          <p class="text-sm text-gray-500 mt-1">Painel do empresário</p>
        </div>

        <nav class="space-y-3">

          <a href="dashboard.html" class="block px-4 py-3 rounded-2xl font-semibold ${activeClass("dashboard.html")}">
            Dashboard
          </a>

          <a href="calendario.html" class="block px-4 py-3 rounded-2xl font-semibold ${activeClass("calendario.html")}">
            Calendário
          </a>

          <a href="equipe.html" class="block px-4 py-3 rounded-2xl font-semibold ${activeClass("equipe.html")}">
            Equipe
          </a>

          <a href="mensagens.html" class="block px-4 py-3 rounded-2xl font-semibold ${activeClass("mensagens.html")}">
            Mensagens
          </a>

          <a href="configuracoes.html" class="block px-4 py-3 rounded-2xl font-semibold ${activeClass("configuracoes.html")}">
            Configurações
          </a>

        </nav>
      </div>

      <!-- 🔥 LOGOUT -->
      <div class="mt-auto pt-6 border-t border-green-100">
        <button id="logoutBtn" class="w-full text-left px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 text-sm font-medium transition">
          Sair
        </button>
      </div>

    </aside>
  `;

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  // 🔥 toggle menu
  window.toggleMenu = function () {
    sidebar.classList.toggle("-translate-x-full");
    overlay.classList.toggle("hidden");
  };

  overlay.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  });

  // 🔥 logout
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (window.supabase) {
        await window.supabase.auth.signOut();
      }
      window.location.href = "login.html";
    });
  }

});
