const currentPage = window.location.pathname.split("/").pop();

function activeClass(page) {
  return currentPage === page
    ? "bg-green-600 text-white"
    : "text-gray-700 hover:bg-green-50";
}

window.toggleMenu = function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (!sidebar || !overlay) return;

  sidebar.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
};

window.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("menu-container");
  if (!container) return;

  const supabase = window.supabase;
  let user = null;
  let projects = [];
  let activeProjectId = localStorage.getItem("activeProjectId");
  let activeProjectName = "Selecionar agenda";

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    user = userData?.user || null;

    if (user) {
      const { data: memberRows } = await supabase
        .from("project_members")
        .select(`
          project_id,
          role,
          projects:project_id (
            id,
            name
          )
        `)
        .eq("user_id", user.id);

      if (memberRows) {
        projects = memberRows.map(row => ({
          project_id: row.project_id,
          role: row.role,
          name: row.projects?.name || "Projeto"
        }));

        if (!activeProjectId && projects.length) {
          activeProjectId = projects[0].project_id;
          localStorage.setItem("activeProjectId", activeProjectId);
        }

        const active = projects.find(p => p.project_id === activeProjectId);
        if (active) activeProjectName = active.name;
      }
    }
  }

  container.innerHTML = `
    <div id="overlay" class="fixed inset-0 bg-black/40 hidden z-40 md:hidden"></div>

    <aside id="sidebar" class="fixed z-50 top-0 left-0 h-full w-72 bg-white border-r border-green-100 p-6 transform -translate-x-full md:translate-x-0 transition-transform duration-300 shadow-lg flex flex-col">

      <div>
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-green-700">Agenda Lux</h1>
          <p class="text-sm text-gray-500 mt-1">Painel do empresário</p>
        </div>

        <div class="mb-6 relative">
          <button
            id="projectSwitcherBtn"
            class="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-green-100 bg-green-50 hover:bg-green-100 transition"
            type="button"
          >
            <div class="text-left">
              <p class="text-xs text-gray-500">Agenda atual</p>
              <p class="font-semibold text-gray-900 truncate">${activeProjectName}</p>
            </div>
            <span class="text-green-700 text-lg">▾</span>
          </button>

          <div
            id="projectDropdown"
            class="hidden absolute left-0 top-full mt-2 w-full bg-white border border-green-100 rounded-2xl shadow-lg p-2 z-50"
          >
            ${projects.map(p => `
              <button
                class="project-option w-full text-left px-4 py-3 rounded-xl ${
                  p.project_id === activeProjectId
                    ? "bg-green-600 text-white"
                    : "text-gray-700 hover:bg-green-50"
                }"
                data-id="${p.project_id}"
                type="button"
              >
                ${p.name}
              </button>
            `).join("")}

            <button
              id="createProjectBtn"
              class="w-full text-left px-4 py-3 rounded-xl text-green-700 hover:bg-green-50 font-medium"
              type="button"
            >
              + Criar nova agenda
            </button>
          </div>
        </div>

        <nav class="space-y-3">
          <a href="dashboard.html" class="${activeClass("dashboard.html")} block px-4 py-3 rounded-2xl font-semibold">
            Dashboard
          </a>

          <a href="calendario.html" class="${activeClass("calendario.html")} block px-4 py-3 rounded-2xl font-semibold">
            Calendário
          </a>

          <a href="equipe.html" class="${activeClass("equipe.html")} block px-4 py-3 rounded-2xl font-semibold">
            Equipe
          </a>

          <a href="configuracoes.html" class="${activeClass("configuracoes.html")} block px-4 py-3 rounded-2xl font-semibold">
            Configurações
          </a>

          <a href="./suporte.html" class="${activeClass("suporte.html")} block px-4 py-3 rounded-2xl font-semibold">
            Suporte
          </a>
        </nav>
      </div>

      <div class="mt-auto pt-6 border-t border-green-100">
        <button id="logoutBtn" class="w-full text-left px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50">
          Sair
        </button>
      </div>
    </aside>
  `;

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const projectDropdown = document.getElementById("projectDropdown");
  const projectSwitcherBtn = document.getElementById("projectSwitcherBtn");

  overlay?.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  });

  projectSwitcherBtn?.addEventListener("click", () => {
    projectDropdown.classList.toggle("hidden");
  });

  document.querySelectorAll(".project-option").forEach(btn => {
    btn.addEventListener("click", () => {
      localStorage.setItem("activeProjectId", btn.dataset.id);
      window.location.reload();
    });
  });

  document.getElementById("createProjectBtn")?.addEventListener("click", () => {
    window.location.href = "./novo-projeto.html";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    if (window.supabase) {
      await window.supabase.auth.signOut();
    }
    localStorage.removeItem("activeProjectId");
    window.location.href = "./login.html";
  });
});
