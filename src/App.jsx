import { useState, useSyncExternalStore } from 'react';
import { api } from './api/client';
import Login from './pages/Login/Login';
import Workspace from './pages/Workspace/Workspace';

function App({ client = api }) {
  const session = useSyncExternalStore(client.subscribe, client.getSession);
  const [notice, setNotice] = useState('');

  async function logout() {
    try {
      await client.logout();
      setNotice('');
    } catch {
      setNotice('Вы вышли на этом устройстве. Не удалось завершить сессию на сервере.');
    }
  }

  return session
    ? <Workspace client={client} onLogout={logout} />
    : <Login client={client} notice={notice} />;
}

export default App;
