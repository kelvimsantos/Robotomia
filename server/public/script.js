// public/script.js - VERSÃO COMPLETA E FUNCIONAL
console.log('✅ script.js carregado');

// ============ FUNÇÃO PRINCIPAL DE ENVIAR ============
window.send = async function() {
  console.log('🟡 Botão Enviar clicado!');
  
  const input = document.getElementById('input');
  const responseEl = document.getElementById('response');
  
  const message = input.value.trim();
  if (!message) {
    console.log('⚠️ Mensagem vazia');
    return;
  }
  
  console.log('📤 Enviando:', message);
  responseEl.textContent = 'Pensando... 🤖';
  
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    console.log('📥 Status:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Resposta recebida:', data);

    responseEl.textContent = data.reply || 'Sem resposta';

    // Atualiza o nome caso o perfil tenha mudado
    if (data.identity && data.identity.name) applyIdentity(data.identity.name);

    // Atualiza status emocional
    if (data.mood) {
      document.getElementById('happiness').textContent = Math.round(data.mood.happiness || 0);
      document.getElementById('energy').textContent = Math.round(data.mood.energy || 0);
      document.getElementById('stress').textContent = Math.round(data.mood.stress || 0);
      
      // Atualiza olhos
      updateEyes(data.mood);
    }
    
  } catch (err) {
    console.error('❌ ERRO:', err);
    responseEl.textContent = 'Erro ao falar com o robô 😣';
  }
  
  input.value = '';
};

// ============ CARGA EL ESTADO GUARDADO (front siempre sincronizado) ============
async function loadCurrentState() {
  try {
    const res = await fetch('/api/current-state');
    if (!res.ok) return;
    const data = await res.json();
    const mood = data.mood || data;
    if (mood.happiness !== undefined) {
      document.getElementById('happiness').textContent = Math.round(mood.happiness);
      document.getElementById('energy').textContent = Math.round(mood.energy);
      document.getElementById('stress').textContent = Math.round(mood.stress);
      updateEyes(mood);
      console.log('📊 Estado del servidor:', mood);
    }
    if (data.identity && data.identity.name) {
      applyIdentity(data.identity.name);
    }
  } catch (e) {
    console.error('❌ No pude cargar el estado:', e);
  }
}

// ============ IDENTIDADE / NOME ESCOLHIDO ============
function applyIdentity(name) {
  const idName = document.getElementById('identityName');
  if (idName && name) idName.textContent = name;
  const h1 = document.querySelector('h1');
  if (h1 && name) h1.textContent = name;
  if (name) document.title = name;
}

window.renameRobot = async function () {
  const current = (document.getElementById('identityName') || {}).textContent || 'Luna';
  const name = prompt('Escolha o nome do robô:', current);
  if (!name || !name.trim()) return;
  try {
    const res = await fetch('/api/profile/name', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    });
    const data = await res.json();
    if (data.success) {
      applyIdentity(data.identity.name);
      showNotification('✅ Nome atualizado: ' + data.identity.name, 'success');
    } else {
      showNotification('⚠️ ' + (data.error || 'Erro ao mudar o nome'), 'error');
    }
  } catch (e) {
    console.error('❌ Erro ao renomear:', e);
    showNotification('❌ Não consegui mudar o nome', 'error');
  }
};

// ============ FUNÇÃO DOS OLHOS ============
function updateEyes(mood) {
  const eyes = document.getElementById('eyes');
  
  if (!eyes) return;
  
  if (mood.stress > 60) {
    eyes.className = 'stressed';
  } else if (mood.energy < 30) {
    eyes.className = 'tired';
  } else if (mood.happiness > 60) {
    eyes.className = 'happy';
  } else {
    eyes.className = 'neutral';
  }
}

// ============ BOTÃO DE SALVAR ============
async function saveManualState() {
  try {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    
    saveBtn.textContent = 'Salvando...';
    saveBtn.disabled = true;
    
    const res = await fetch('/api/save-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await res.json();
    
    if (data.success) {
      showNotification('💾 Estado salvo com sucesso!', 'success');
      
      // Marca que próxima resposta será salva
      window.nextWillBeSaved = true;
      
      // Preenche automaticamente e envia
      setTimeout(() => {
        const input = document.getElementById('input');
        if (input) {
          input.value = 'Salve meu estado atual';
          send(); // Chama a função send() que agora existe!
        }
      }, 1000);
    }
    
  } catch (err) {
    showNotification('❌ Erro ao salvar estado', 'error');
    console.error(err);
  } finally {
    setTimeout(() => {
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) {
        saveBtn.textContent = originalText || '💾 Salvar Estado';
        saveBtn.disabled = false;
      }
    }, 2000);
  }
}

// ============ NOTIFICAÇÕES ============
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============ ADICIONA BOTÃO DE SALVAR ============
function addSaveButton() {
  // Verifica se já existe
  if (document.getElementById('saveBtn')) return;
  
  const button = document.createElement('button');
  button.id = 'saveBtn';
  button.onclick = saveManualState;
  button.innerHTML = '💾 Salvar Estado';
  button.style.cssText = `
    margin-left: 10px;
    background: #8b5cf6;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
  `;
  button.onmouseover = () => button.style.background = '#7c3aed';
  button.onmouseout = () => button.style.background = '#8b5cf6';
  
  // Adiciona após o botão de enviar
  const sendBtn = document.querySelector('button[onclick="send()"]');
  if (sendBtn) {
    sendBtn.parentNode.insertBefore(button, sendBtn.nextSibling);
  }
}

// ============ INICIALIZAÇÃO ============
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM carregado - LunaTech pronta');
  
  // Verifica elementos
  console.log('Input:', document.getElementById('input') ? '✅' : '❌');
  console.log('Botão Enviar:', document.querySelector('button[onclick="send()"]') ? '✅' : '❌');
  console.log('Response:', document.getElementById('response') ? '✅' : '❌');
  console.log('Olhos:', document.getElementById('eyes') ? '✅' : '❌');
  
  // Adiciona botão de salvar
  addSaveButton();

  // Carga o estado emocional real guardado (contexto → front) sin esperar al primer chat
  loadCurrentState();
  
  // Adiciona estilos CSS dinâmicos
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .notification.success { background: #10b981 !important; }
    .notification.error { background: #ef4444 !important; }
  `;
  document.head.appendChild(style);
  
  // Foco automático no input
  const input = document.getElementById('input');
  if (input) input.focus();
});

// ============ ENTER PARA ENVIAR ============
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = document.getElementById('input');
    if (input && document.activeElement === input) {
      send();
    }
  }
});