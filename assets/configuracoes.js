import { supabase } from './supabase.js'

// 🔐 carregar dados do usuário
async function loadUser() {
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    window.location.href = 'login.html'
    return
  }

  const nome = data.user.user_metadata?.nome || ''
  const email = data.user.email || ''

  document.getElementById('userName').value = nome
  document.getElementById('userEmail').value = email
}

// 🔒 trocar senha
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault()

  const newPassword = document.getElementById('newPassword').value
  const message = document.getElementById('message')

  message.textContent = 'Atualizando...'
  message.className = 'text-sm mt-4 text-gray-500'

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    message.textContent = error.message
    message.className = 'text-sm mt-4 text-red-600'
    return
  }

  message.textContent = 'Senha atualizada com sucesso!'
  message.className = 'text-sm mt-4 text-green-600'
})

loadUser()
