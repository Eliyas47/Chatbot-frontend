// Minimal mock API so the frontend renders without a backend.
// Functions return simple promises and use localStorage to persist conversations.

const DELAY_MS = 300;

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('users') || '[]');
  } catch (e) {
    return [];
  }
}

function saveUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
}

function findUser(usernameOrEmail) {
  const users = getUsers();
  return users.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);
}

function checkCredentials(email, password) {
  const users = getUsers();
  // Find strictly by email now, or keep username support for legacy/demo purposes
  const user = users.find(u => u.email === email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

export async function login(email, password) {
  await delay(DELAY_MS);

  const user = checkCredentials(email, password);
  if (user) {
    const token = 'demo-token-' + Date.now();
    localStorage.setItem('currentUser', JSON.stringify(user));
    return { token, user };
  } else {
    // Demo backdoor
    if (email === 'demo@example.com' && password === 'demo') {
      const demoUser = { username: 'demo', email: 'demo@example.com', password: 'demo' };
      // Only save if not exists
      if (!findUser('demo@example.com')) saveUser(demoUser);
      const token = 'demo-token-' + Date.now();
      return { token, user: demoUser };
    }
    throw new Error("Invalid credentials");
  }
}

export async function register(username, email, password) {
  // Supports (username, email, password) signatures
  // If only 2 args, assume (email, password)
  if (!password && email) {
    password = email;
    email = username;
    username = email.split('@')[0];
  }

  await delay(DELAY_MS);

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    throw new Error("Email already registered");
  }

  // Ensure username uniqueness (append random if needed, though unlikely for demo)
  let finalUsername = username;
  if (users.find(u => u.username === finalUsername)) {
    finalUsername = `${username}${Math.floor(Math.random() * 1000)}`;
  }

  const newUser = { username: finalUsername, email, password };
  saveUser(newUser);

  const token = 'demo-token-' + Date.now();
  return { token, user: newUser };
}

export async function getUser() {
  await delay(100);
  const userRaw = localStorage.getItem('user');
  if (userRaw) {
    try { return JSON.parse(userRaw); } catch (e) { return null; }
  }
  return null;
}

export async function updateUser(userData) {
  await delay(200);
  const current = await getUser() || {};
  const updated = { ...current, ...userData };
  localStorage.setItem('user', JSON.stringify(updated));

  const users = getUsers();
  const index = users.findIndex(u => u.email === current.email);
  if (index !== -1) {
    users[index] = { ...users[index], ...userData };
    localStorage.setItem('users', JSON.stringify(users));
  }

  return updated;
}

export async function listConversations(token) {
  await delay(150);
  const raw = localStorage.getItem('convos') || '[]';
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export async function sendMessage(token, text, convoId = null) {
  await delay(300);
  return { reply: `Assistant (mock): I received "${text}"` };
}

export async function uploadFile(token, file) {
  await delay(400);
  return { summary: `Mocked analysis of ${file.name}` };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export default {
  login,
  register,
  getUser,
  updateUser,
  listConversations,
  sendMessage,
  uploadFile,
};
