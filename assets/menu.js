import { supabase } from './supabase.js'

const currentPage = window.location.pathname.split("/").pop();

function activeClass(page) {
  return currentPage === page
    ? "bg-green-600 text-white"
    : "text-gray-700 hover:bg-green-50";
}

document.getElementById("menu-container").innerHTML = `
  <!-- Overlay mobile -->
  <div id="overlay" onclick="toggleMenu()" class="fixed inset-0 bg-black/40 hidden z-40 md:hidden"></div>

  <!-- Sidebar -->
  <aside id="sidebar" class="fixed md:fixed z-50 top-0 left-0 h-full w-72 bg-white border-r border-green-100 p-6 transform -translate-x-full md:translate-x-0 transition-transform duration-300 shadow-lg flex flex-col">

    <!-- TOP -->
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

    <!-- 🔥 USER / LOGOUT -->
    <div class="mt-auto pt-6 border-t border-green-100">

      <div class="flex items-center gap-3 mb-4">
        <div id="menuUserAvatar" class="w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center font-semibold">
          U
        </div>
        <div>
          <p id="menuUserName" class="text-sm font-semibold text-gray-900">Usuário</p>
          <p class="text-xs text-gray-500">Conta ativa</p>
        </div>
      </div>

      <button id="logoutBtn" class="w-full text-left px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 text-sm font-medium transition">
        Sair
      </button>

    </div>

  </aside>
`;

function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
}

// 🔥 SETUP USER
async function setupMenuUser() {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return

  let nome = data.user.user_metadata?.nome || data.user.email || 'Usuário'
  const firstName = nome.trim().split(' ')[0]

  const avatar = document.getElementById('menuUserAvatar')
  const name = document.getElementById('menuUserName')

  if (avatar) avatar.textContent = firstName.charAt(0).toUpperCase()
  if (name) name.textContent = firstName

  const logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut()
      window.location.href = 'login.html'
    })
  }
}

window.addEventListener('DOMContentLoaded', setupMenuUser)
