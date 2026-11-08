import { api } from './client'

export const authApi = {
  register: ({ email, password, first_name, last_name }) =>
    api('/api/auth/register', {
      method: 'POST',
      auth: false,
      body: { email, password, first_name, last_name },
    }),

  login: ({ email, password }) =>
    api('/api/auth/login', { method: 'POST', auth: false, body: { email, password } }),
}

export const usersApi = {
  me: () => api('/api/users/me'),
  updateMe: (changes) => api('/api/users/me', { method: 'PUT', body: changes }),
}
