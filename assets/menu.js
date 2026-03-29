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
      const { data: memberRows, error } = await supabase
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

      if (!error && memberRows) {
        projects = memberRows
          .map(row => ({
            project_id: row.project_id,
            role: row.role,
            name: row.projects?.name || "Projeto sem nome"
          }))
          .filter(item => item.project_id);

        if (!activeProjectId && projects.length) {
          activeProjectId = projects[0].project_id;
          localStorage.setItem("activeProjectId", activeProjectId);
        }

        const activeProject = projects.find(p => p.project_id === activeProjectId);
        if (activeProject) {
          activeProjectName = activeProject.name;
        }
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

        <!-- SELETOR DE PROJETO -->
        <div class="mb-6 relative">
          <button
            id="projectSwitcherBtn"
            class="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-green-100 bg-green-50 hover:bg-green-100 transition"
            type="button"
          >
            <div class="text-left">
              <p class="text-xs uppercase tracking-wide text-gray-500">Agenda atual</p>
              <p id="activeProjectLabel" class="font-semibold text-gray-900 truncate">
                ${activeProjectName}
              </p>
            </div>
            <span class="text-lg text-green-700">▾</span>
          </button>

          <div
            id="projectDropdown"
            class="hidden absolute left-0 top-full mt-2 w-full bg-white border border-green-100 rounded-2xl shadow-lg p-2 z-50"
          >
            <div id="projectOptions" class="space-y-1">
              ${
                projects.length
                  ? projects.map(project => `
                    <button
                      class="project-option w-full text-left px-4 py-3 rounded-xl transition ${
                        project.project_id === activeProjectId
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:bg-green-50"
                      }"
                      data-project-id="${project.project_id}"
                      data-project-name="${project.name}"
                      type="button"
                    >
                      ${project.name}
                    </button>
                  `).join("")
                  : `<div class="px-4 py-3 text-sm text-gray-400">Nenhuma agenda encontrada</div>`
              }

              <button
                id="createNewProjectBtn"
                class="w-full text-left px-4 py-3 rounded-xl text-green-700 hover:bg-green-50 font-medium"
                type="button"
              >
                + Criar nova agenda
              </button>
            </div>
          </div>
        </div>

        <nav class="space-y-3">
          <a href="dashboard.html" class="menu-link ${activeClass("dashboard.html")}">
            Dashboard
          </a>

          <a href="calendario.html" class="menu-link ${activeClass("calendario.html")}">
            Calendário
          </a>

          <a href="equipe.html" class="menu-link ${activeClass("equipe.html")}">
            Equipe
          </a>

          <a href="mensagens.html" class="menu-link ${activeClass("mensagens.html")}">
            Mensagens
          </a>

          <a href="configuracoes.html" class="menu-link ${activeClass("configuracoes.html")}">
            Configurações
          </a>
        </nav>
      </div>

      <div class="mt-auto pt-6 border-t border-green-100">
        <button id="logoutBtn" class="menu-link text-red-600 hover:bg-red-50">
          Sair
        </button>
      </div>
    </aside>
  `;

  if (!document.getElementById("menu-styles")) {
    const style = document.createElement("style");
    style.id = "menu-styles";
    style.innerHTML = `
      .menu-link {
        display: block;
        padding: 12px 16px;
        border-radius: 14px;
        font-weight: 500;
        transition: 0.2s;
      }
    `;
    document.head.appendChild(style);
  }

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const logoutBtn = document.getElementById("logoutBtn");

  const projectSwitcherBtn = document.getElementById("projectSwitcherBtn");
  const projectDropdown = document.getElementById("projectDropdown");
  const createNewProjectBtn = document.getElementById("createNewProjectBtn");
  const projectOptionButtons = document.querySelectorAll(".project-option");

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
      if (projectDropdown) projectDropdown.classList.add("hidden");
    }
  });

  if (projectSwitcherBtn && projectDropdown) {
    projectSwitcherBtn.addEventListener("click", () => {
      projectDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      const clickedInside =
        projectSwitcherBtn.contains(e.target) ||
        projectDropdown.contains(e.target);

      if (!clickedInside) {
        projectDropdown.classList.add("hidden");
      }
    });
  }

  projectOptionButtons.forEach(button => {
    button.addEventListener("click", () => {
      const projectId = button.dataset.projectId;

      if (!projectId) return;

      localStorage.setItem("activeProjectId", projectId);
      window.location.reload();
    });
  });

  if (createNewProjectBtn) {
    createNewProjectBtn.addEventListener("click", () => {
      window.location.href = "novo-projeto.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (window.supabase) {
        await window.supabase.auth.signOut();
      }
      localStorage.removeItem("activeProjectId");
      window.location.href = "login.html";
    });
  }
});
