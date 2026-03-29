import { supabase } from './supabase.js'

const userNameInput = document.getElementById('userName')
const userEmailInput = document.getElementById('userEmail')

const passwordForm = document.getElementById('passwordForm')
const currentPasswordInput = document.getElementById('currentPassword')
const newPasswordInput = document.getElementById('newPassword')
const confirmPasswordInput = document.getElementById('confirmPassword')
const messageEl = document.getElementById('message')

function showMessage(text, type = 'default') {
  if (!messageEl) return

  messageEl.textContent = text
  messageEl.className = 'text-sm mt-4'

  if (type === 'success') {
    messageEl.classList.add('text-green-600')
  } else if (type === 'error') {
    messageEl.classList.add('text-red-600')
  } else {
    messageEl.classList.add('text-gray-500')
  }
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    window.location.href = 'login.html'
    return null
  }

  return data.user
}

async function loadUserData() {
  const user = await getUser()
  if (!user) return

  const nome =
    user.user_metadata?.nome ||
    user.user_metadata?.name ||
    user.email ||
    ''

  const email = user.email || ''

  if (userNameInput) userNameInput.value = nome
  if (userEmailInput) userEmailInput.value = email
}

async function updatePassword(event) {
  event.preventDefault()

  const currentPassword = currentPasswordInput.value.trim()
  const newPassword = newPasswordInput.value.trim()
  const confirmPassword = confirmPasswordInput.value.trim()

  if (!currentPassword || !newPassword || !confirmPassword) {
    showMessage('Preencha todos os campos.', 'error')
    return
  }

  if (newPassword.length < 6) {
    showMessage('A nova senha deve ter pelo menos 6 caracteres.', 'error')
    return
  }

  if (newPassword !== confirmPassword) {
    showMessage('As novas senhas não coincidem.', 'error')
    return
  }

  if (currentPassword === newPassword) {
    showMessage('A nova senha deve ser diferente da senha atual.', 'error')
    return
  }

  showMessage('Validando senha atual...')

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    showMessage('Sessão inválida. Faça login novamente.', 'error')
    window.location.href = 'login.html'
    return
  }

  const email = userData.user.email

  if (!email) {
    showMessage('Não foi possível identificar o e-mail do usuário.', 'error')
    return
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword
  })

  if (signInError) {
    showMessage('Senha atual incorreta.', 'error')
    return
  }

  showMessage('Atualizando senha...')

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (updateError) {
    showMessage(updateError.message || 'Erro ao atualizar senha.', 'error')
    return
  }

  passwordForm.reset()
  showMessage('Senha atualizada com sucesso.', 'success')
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadUserData()

  if (passwordForm) {
    passwordForm.addEventListener('submit', updatePassword)
  }
})
