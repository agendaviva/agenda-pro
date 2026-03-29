import { supabase } from './supabase.js'

// 🔐 carregar usuário
async function loadUser() {
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    window.location.href = 'login.html'
    return
  }

  document.getElementById('userName').value =
    data.user.user_metadata?.nome || ''

  document.getElementById('userEmail').value =
    data.user.email || ''
}

// 🔒 trocar senha
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault()

  const newPassword = document.getElementById('newPassword').value
  const confirmPassword = document.getElementById('confirmPassword').value
  const message = document.getElementById('message')

  if (newPassword !== confirmPassword) {
    message.textContent = 'As senhas não coincidem.'
    message.className = 'text-sm mt-4 text-red-600'
    return
  }

  if (newPassword.length < 6) {
    message.textContent = 'A senha deve ter pelo menos 6 caracteres.'
    message.className = 'text-sm mt-4 text-red-600'
    return
  }

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
