import { supabase } from './supabase.js'

const userNameInput = document.getElementById('userName')
const userEmailInput = document.getElementById('userEmail')
const passwordForm = document.getElementById('passwordForm')
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

  const nome = user.user_metadata?.nome || ''
  const email = user.email || ''

  if (userNameInput) userNameInput.value = nome
  if (userEmailInput) userEmailInput.value = email
}

async function updatePassword(event) {
  event.preventDefault()

  const newPassword = newPasswordInput.value.trim()
  const confirmPassword = confirmPasswordInput.value.trim()

  if (!newPassword || !confirmPassword) {
    showMessage('Preencha os campos de senha.', 'error')
    return
  }

  if (newPassword.length < 6) {
    showMessage('A nova senha deve ter pelo menos 6 caracteres.', 'error')
    return
  }

  if (newPassword !== confirmPassword) {
    showMessage('As senhas não coincidem.', 'error')
    return
  }

  showMessage('Atualizando senha...')

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    showMessage(error.message || 'Erro ao atualizar senha.', 'error')
    return
  }

  passwordForm.reset()
  showMessage('Senha atualizada com sucesso.', 'success')
}

window.addEventListener('DOMContentLoaded', () => {
  loadUserData()

  if (passwordForm) {
    passwordForm.addEventListener('submit', updatePassword)
  }
})
