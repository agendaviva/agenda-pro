<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configurações - Agenda Lux</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-white via-green-50 to-white text-gray-900">

  <div id="menu-container"></div>

  <main class="md:ml-72 min-h-screen p-6 md:p-10">

    <h1 class="text-2xl md:text-3xl font-bold mb-8">Configurações</h1>

    <!-- DADOS -->
    <div class="bg-white border border-green-100 rounded-3xl p-6 shadow-sm mb-8">
      <h2 class="text-lg font-semibold mb-4">Dados da conta</h2>

      <div class="space-y-4">

        <div>
          <label class="text-sm text-gray-500">Nome</label>
          <input id="userName" disabled class="w-full mt-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-500 border border-gray-200">
        </div>

        <div>
          <label class="text-sm text-gray-500">Email</label>
          <input id="userEmail" disabled class="w-full mt-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-500 border border-gray-200">
        </div>

      </div>
    </div>

    <!-- SENHA -->
    <div class="bg-white border border-green-100 rounded-3xl p-6 shadow-sm">
      <h2 class="text-lg font-semibold mb-4">Alterar senha</h2>

      <form id="passwordForm" class="space-y-4">

        <div>
          <label class="text-sm text-gray-500">Nova senha</label>
          <input id="newPassword" type="password" required
            class="w-full mt-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none">
        </div>

        <div>
          <label class="text-sm text-gray-500">Confirmar nova senha</label>
          <input id="confirmPassword" type="password" required
            class="w-full mt-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none">
        </div>

        <button class="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition">
          Atualizar senha
        </button>

      </form>

      <p id="message" class="text-sm mt-4"></p>

    </div>

  </main>

  <!-- ORDEM CORRETA -->
  <script type="module" src="assets/supabase.js"></script>
  <script src="assets/menu.js"></script>
  <script type="module" src="assets/configuracoes.js"></script>

</body>
</html>
