document.getElementById("menu-container").innerHTML = `
  <!-- Overlay mobile -->
  <div id="overlay" onclick="toggleMenu()" class="fixed inset-0 bg-black/40 hidden z-40 md:hidden"></div>

  <!-- Sidebar -->
  <aside id="sidebar" class="fixed md:fixed z-50 top-0 left-0 h-full w-72 bg-white border-r border-green-100 p-6 transform -translate-x-full md:translate-x-0 transition-transform duration-300 shadow-lg">

    <div class="mb-10">
      <h1 class="text-2xl font-bold text-green-700">Agenda Lux</h1>
      <p class="text-sm text-gray-500 mt-1">Painel do empresário</p>
    </div>

    <nav class="space-y-3">

      <a href="dashboard.html" class="block px-4 py-3 rounded-2xl font-semibold hover:bg-green-50 transition">
        Dashboard
      </a>

      <a href="calendario.html" class="block px-4 py-3 rounded-2xl font-semibold hover:bg-green-50 transition">
        Calendário
      </a>

      <a href="shows.html" class="block px-4 py-3 rounded-2xl font-semibold hover:bg-green-50 transition">
        Shows
      </a>

      <a href="equipe.html" class="block px-4 py-3 rounded-2xl font-semibold hover:bg-green-50 transition">
        Equipe
      </a>

      <a href="mensagens.html" class="block px-4 py-3 rounded-2xl font-semibold hover:bg-green-50 transition">
        Mensagens
      </a>

      <a href="configuracoes.html" class="block px-4 py-3 rounded-2xl font-semibold hover:bg-green-50 transition">
        Configurações
      </a>

    </nav>

  </aside>
`;

function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
}
