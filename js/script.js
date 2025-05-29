// Dados de configuração do Firebase (COLE AQUI O QUE VOCÊ COPIOU DO CONSOLE)
const firebaseConfig = {
    apiKey: "AIzaSyCQbiD5J9vKI1TP3qYQAXYcXWKNJT02IrU",
    authDomain: "dailyhabitsapp-c6669.firebaseapp.com",
    projectId: "dailyhabitsapp-c6669",
    storageBucket: "dailyhabitsapp-c6669.firebasestorage.app",
    messagingSenderId: "1044155399824",
    appId: "1:1044155399824:web:1bd1c3a58fd0a11bc42215"
  };

// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);

// Obtenha referências para os serviços
const db = firebase.firestore();
const auth = firebase.auth();

// Nome da coleção no Firestore onde os hábitos serão armazenados
const HABITS_COLLECTION_NAME = 'habits';

// Dados iniciais dos hábitos (serão usados se o Firestore estiver vazio para um novo usuário)
const initialHabits = [
    { name: "Ler um livro", goal: 20, completions: {} },
    { name: "Comer uma fruta", goal: 20, completions: {} },
    { name: "Saúde", goal: 21, completions: {} },
    { name: "Academia", goal: 21, completions: {} },
    { name: "Estudar na Alura", goal: 21, completions: {} },
    { name: "Aprender um idioma", goal: 21, completions: {} },
    { name: "Passear com o Beethoven", goal: 16, completions: {} },
    { name: "Escovar os dentes", goal: 30, completions: {} },
    { name: "Ouvir um podcast", goal: 21, completions: {} }
];

// Estado da aplicação
let state = {
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    habits: [], // Hábitos serão carregados do Firestore
    daysInMonth: 0,
    firstDayOfMonth: 0,
    editMode: false,
    editHabitId: null,
    deleteHabitId: null,
    user: null // Armazenará o objeto do usuário logado
};

// Elementos DOM
const habitsTable = document.getElementById('habits-table');
const currentMonthElement = document.getElementById('current-month');
const prevMonthBtn = document.querySelector('.prev-month');
const nextMonthBtn = document.querySelector('.next-month');
const addHabitBtn = document.getElementById('add-habit-btn');
const habitModal = document.getElementById('habit-modal');
const closeModalBtn = document.querySelector('.close-modal');
const habitForm = document.getElementById('habit-form');
const modalTitle = document.getElementById('modal-title');
const habitSubmitBtn = document.getElementById('habit-submit-btn');
const editHabitIdInput = document.getElementById('edit-habit-id');
const deleteHabitBtn = document.getElementById('delete-habit-btn');
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

// Elementos DOM para Autenticação
const userProfile = document.querySelector('.user-profile');
const authModal = document.getElementById('auth-modal');
const authCloseModalBtn = document.querySelector('.auth-close-modal');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const authErrorMessage = document.getElementById('auth-error-message');


// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Função de inicialização
function initializeApp() {
    updateMonthInfo();
    renderCalendar();
    setupAuthListener(); // Configura o ouvinte de autenticação
}

// Configuração de event listeners
function setupEventListeners() {
    prevMonthBtn.addEventListener('click', navigateToPrevMonth);
    nextMonthBtn.addEventListener('click', navigateToNextMonth);
    addHabitBtn.addEventListener('click', () => openHabitModal());
    closeModalBtn.addEventListener('click', closeHabitModal);
    habitForm.addEventListener('submit', handleHabitFormSubmit);
    deleteHabitBtn.addEventListener('click', showDeleteConfirmation);
    confirmDeleteBtn.addEventListener('click', deleteHabit);
    cancelDeleteBtn.addEventListener('click', closeConfirmModal);
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === habitModal) {
            closeHabitModal();
        }
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
        if (e.target === authModal) { // Adicionado para o modal de autenticação
            closeAuthModal();
        }
    });

    // Event listeners para autenticação
    userProfile.addEventListener('click', showAuthModal);
    authCloseModalBtn.addEventListener('click', closeAuthModal);
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    authForm.addEventListener('submit', (e) => { e.preventDefault(); }); // Previne o recarregamento da página ao enviar o formulário de auth
}

// NOVO: Ouvinte de estado de autenticação
function setupAuthListener() {
    auth.onAuthStateChanged(user => {
        state.user = user;
        if (user) {
            console.log("Usuário logado:", user.email, "ID:", user.uid);
            document.querySelector('.user-profile span').textContent = user.email;
            addHabitBtn.style.display = 'inline-block'; // Mostra botão de adicionar
            loadHabits(); // Carrega os hábitos do usuário logado
        } else {
            console.log("Nenhum usuário logado.");
            document.querySelector('.user-profile span').textContent = 'Convidado';
            addHabitBtn.style.display = 'none'; // Esconde botão de adicionar
            state.habits = []; // Limpa os hábitos se ninguém estiver logado
            renderHabits(); // Renderiza a tabela vazia ou com mensagem
            // Você pode optar por mostrar o modal de login automaticamente aqui
            // showAuthModal();
        }
    });
}

// Função auxiliar para obter a chave do mês atual
function getCurrentMonthKey() {
    return `${state.currentYear}-${state.currentMonth}`;
}

// Função para obter os dias completados no mês atual
function getCompletedDaysInCurrentMonth(habit) {
    const monthKey = getCurrentMonthKey();
    return habit.completions[monthKey] || [];
}

// Função para obter o número de dias completados no mês atual
function getAchievedCountInCurrentMonth(habit) {
    const completedDays = getCompletedDaysInCurrentMonth(habit);
    return completedDays.length;
}

// Atualizar informações do mês
function updateMonthInfo() {
    const date = new Date(state.currentYear, state.currentMonth, 1);
    state.daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
    state.firstDayOfMonth = date.getDay();
    
    // Atualizar texto do mês atual
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    currentMonthElement.textContent = `${monthNames[state.currentMonth]}, ${state.currentYear}`;
}

// Renderizar cabeçalho do calendário
function renderCalendar() {
    const headerRow = habitsTable.querySelector('thead tr');
    
    // Limpar cabeçalho existente, mantendo a primeira coluna (Habits)
    while (headerRow.children.length > 1) {
        headerRow.removeChild(headerRow.lastChild);
    }
    
    // Adicionar dias do mês
    for (let day = 1; day <= state.daysInMonth; day++) {
        const dayHeader = document.createElement('th');
        dayHeader.textContent = day;
        
        // Destacar o dia atual
        const today = new Date();
        if (today.getDate() === day && today.getMonth() === state.currentMonth && today.getFullYear() === state.currentYear) {
            dayHeader.classList.add('current-day');
        }
        
        // Adicionar classes para dias da semana
        const dayOfWeek = new Date(state.currentYear, state.currentMonth, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayHeader.classList.add('weekend');
        }
        
        headerRow.appendChild(dayHeader);
    }
    
    // Adicionar colunas Goal e Achieved
    const goalHeader = document.createElement('th');
    goalHeader.textContent = 'Meta';
    goalHeader.classList.add('goal-header');
    headerRow.appendChild(goalHeader);
    
    const achievedHeader = document.createElement('th');
    achievedHeader.textContent = 'Concluído';
    achievedHeader.classList.add('achieved-header');
    headerRow.appendChild(achievedHeader);
}

// Renderizar hábitos
function renderHabits() {
    const tbody = habitsTable.querySelector('tbody');
    tbody.innerHTML = ''; // Limpa a tabela

    if (state.habits.length === 0) {
        const noHabitsRow = document.createElement('tr');
        const noHabitsCell = document.createElement('td');
        noHabitsCell.setAttribute('colspan', state.daysInMonth + 3); // Cobre todas as colunas
        noHabitsCell.style.textAlign = 'center';
        noHabitsCell.style.padding = '20px';
        noHabitsCell.textContent = state.user ? 'Nenhum hábito cadastrado. Adicione um novo!' : 'Faça login para ver seus hábitos.';
        noHabitsRow.appendChild(noHabitsCell);
        tbody.appendChild(noHabitsRow);
        return;
    }
    
    state.habits.forEach(habit => {
        const row = document.createElement('tr');
        row.classList.add('habit-row');
        row.dataset.habitId = habit.id;
        
        // Coluna do nome do hábito com botões de edição e exclusão
        const habitNameCell = document.createElement('td');
        
        const habitNameContainer = document.createElement('div');
        habitNameContainer.classList.add('habit-name-container');
        
        const habitNameSpan = document.createElement('span');
        habitNameSpan.textContent = habit.name;
        
        const habitActions = document.createElement('div');
        habitActions.classList.add('habit-actions');
        
        const editButton = document.createElement('button');
        editButton.classList.add('edit-habit-btn');
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = 'Editar hábito';
        editButton.addEventListener('click', () => openHabitModal(habit.id));
        
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-habit-btn');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'Excluir hábito';
        deleteButton.addEventListener('click', () => {
            state.deleteHabitId = habit.id;
            showDeleteConfirmation();
        });
        
        habitActions.appendChild(editButton);
        habitActions.appendChild(deleteButton);
        
        habitNameContainer.appendChild(habitNameSpan);
        habitNameContainer.appendChild(habitActions);
        habitNameCell.appendChild(habitNameContainer);
        
        row.appendChild(habitNameCell);
        
        // Obter dias completados no mês atual
        const completedDays = getCompletedDaysInCurrentMonth(habit);
        
        // Células para cada dia do mês
        for (let day = 1; day <= state.daysInMonth; day++) {
            const dayCell = document.createElement('td');
            dayCell.classList.add('day-cell');
            
            // Verificar se o hábito foi completado neste dia
            if (completedDays.includes(day)) {
                dayCell.classList.add('completed');
            }
            
            // Destacar o dia atual
            const today = new Date();
            if (today.getDate() === day && today.getMonth() === state.currentMonth && today.getFullYear() === state.currentYear) {
                dayCell.classList.add('today');
            }
            
            // Adicionar evento de clique para marcar/desmarcar
            dayCell.addEventListener('click', () => toggleHabitCompletion(habit.id, day));
            
            row.appendChild(dayCell);
        }
        
        // Coluna Goal
        const goalCell = document.createElement('td');
        goalCell.textContent = habit.goal;
        goalCell.classList.add('goal-cell');
        row.appendChild(goalCell);
        
        // Coluna Achieved - usar contagem do mês atual
        const achieved = getAchievedCountInCurrentMonth(habit);
        
        const achievedCell = document.createElement('td');
        achievedCell.textContent = achieved;
        achievedCell.classList.add('achieved-cell');
        
        // Adicionar classes baseadas no progresso
        const progress = (achieved / habit.goal) * 100;
        if (progress >= 100) {
            achievedCell.classList.add('success');
        } else if (progress >= 50) {
            achievedCell.classList.add('warning');
            achievedCell.style.backgroundColor = '#fdcb6e25';
        } else {
            achievedCell.classList.add('danger');
            achievedCell.style.backgroundColor = '#ff767525';
        }
        
        // Definir cor de fundo baseada no progresso
        if (achieved === 0) {
            achievedCell.style.backgroundColor = '#ffdd57';
            achievedCell.classList.remove('success');
        }
        
        row.appendChild(achievedCell);
        
        tbody.appendChild(row);
    });
}

// Carregar dados do Firestore (filtrando pelo ID do usuário)
async function loadHabits() {
    if (!state.user) {
        state.habits = [];
        renderHabits();
        return;
    }
    try {
        const userId = state.user.uid;
        const habitsSnapshot = await db.collection(HABITS_COLLECTION_NAME)
                                        .where('userId', '==', userId)
                                        .get();
        const loadedHabits = [];
        habitsSnapshot.forEach(doc => {
            loadedHabits.push({ id: doc.id, ...doc.data() });
        });
        state.habits = loadedHabits;
        
        // Se não houver hábitos para este usuário, adicione os iniciais
        if (state.habits.length === 0 && initialHabits.length > 0) {
            console.log("Nenhum hábito encontrado para este usuário. Adicionando hábitos iniciais...");
            const newHabitsForUser = [];
            for (const habit of initialHabits) {
                const docRef = await db.collection(HABITS_COLLECTION_NAME).add({
                    name: habit.name,
                    goal: habit.goal,
                    completions: habit.completions || {},
                    userId: userId // ASSOCIA O HÁBITO AO ID DO USUÁRIO
                });
                newHabitsForUser.push({ id: docRef.id, name: habit.name, goal: habit.goal, completions: habit.completions || {}, userId: userId });
            }
            state.habits = newHabitsForUser;
        }
        
        renderHabits();
    } catch (error) {
        console.error("Erro ao carregar hábitos do Firestore:", error);
        alert("Ocorreu um erro ao carregar seus hábitos. Tente novamente.");
        state.habits = [];
        renderHabits();
    }
}

// Alternar conclusão de hábito no Firestore
async function toggleHabitCompletion(habitId, day) {
    if (!state.user) {
        alert("Você precisa estar logado para marcar hábitos.");
        showAuthModal();
        return;
    }

    const habitIndex = state.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;
    
    const habit = state.habits[habitIndex];
    const monthKey = getCurrentMonthKey();
    
    const currentCompletions = { ...habit.completions };
    if (!currentCompletions[monthKey]) {
        currentCompletions[monthKey] = [];
    }
    
    const completedDays = [...currentCompletions[monthKey]];
    const dayIndex = completedDays.indexOf(day);
    
    if (dayIndex === -1) {
        completedDays.push(day);
    } else {
        completedDays.splice(dayIndex, 1);
    }
    
    currentCompletions[monthKey] = completedDays;

    try {
        const habitRef = db.collection(HABITS_COLLECTION_NAME).doc(habitId);
        await habitRef.update({
            [`completions.${monthKey}`]: completedDays
        });
        
        // Atualiza o estado local APENAS SE a atualização no Firestore for bem-sucedida
        habit.completions = currentCompletions;
        renderHabits();
    } catch (error) {
        console.error("Erro ao alternar conclusão do hábito no Firestore:", error);
        alert("Ocorreu um erro ao atualizar o hábito. Tente novamente.");
    }
}

// Navegação de mês
function navigateToPrevMonth() {
    state.currentMonth--;
    if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
    }
    updateMonthInfo();
    renderCalendar();
    renderHabits();
}

function navigateToNextMonth() {
    state.currentMonth++;
    if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
    }
    updateMonthInfo();
    renderCalendar();
    renderHabits();
}

// Funções do modal de hábito
function openHabitModal(habitId = null) {
    if (!state.user) {
        alert("Você precisa estar logado para adicionar ou editar hábitos.");
        showAuthModal();
        return;
    }
    habitForm.reset();
    
    if (habitId) {
        state.editMode = true;
        state.editHabitId = habitId;
        
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit) {
            alert("Hábito não encontrado para edição.");
            return;
        }
        
        document.getElementById('habit-name').value = habit.name;
        document.getElementById('habit-goal').value = habit.goal;
        document.getElementById('edit-habit-id').value = habitId;
        
        modalTitle.textContent = 'Editar Hábito';
        habitSubmitBtn.textContent = 'Salvar';
        
        deleteHabitBtn.classList.add('show');
    } else {
        state.editMode = false;
        state.editHabitId = null;
        
        modalTitle.textContent = 'Adicionar Novo Hábito';
        habitSubmitBtn.textContent = 'Adicionar';
        
        deleteHabitBtn.classList.remove('show');
    }
    
    habitModal.style.display = 'block';
}

function closeHabitModal() {
    habitModal.style.display = 'none';
    habitForm.reset();
    state.editMode = false;
    state.editHabitId = null;
}

// Manipular envio do formulário de hábito (novo ou edição) no Firestore
async function handleHabitFormSubmit(e) {
    e.preventDefault();
    
    if (!state.user) {
        alert("Você precisa estar logado para adicionar ou editar hábitos.");
        showAuthModal();
        return;
    }

    const habitName = document.getElementById('habit-name').value;
    const habitGoal = parseInt(document.getElementById('habit-goal').value);
    
    if (!habitName || isNaN(habitGoal) || habitGoal < 1 || habitGoal > 31) {
        alert('Por favor, preencha todos os campos corretamente (Meta entre 1 e 31).');
        return;
    }
    
    try {
        if (state.editMode && state.editHabitId) {
            const habitToUpdateRef = db.collection(HABITS_COLLECTION_NAME).doc(state.editHabitId);
            await habitToUpdateRef.update({
                name: habitName,
                goal: habitGoal
            });
            const habitIndex = state.habits.findIndex(h => h.id === state.editHabitId);
            if (habitIndex !== -1) {
                state.habits[habitIndex].name = habitName;
                state.habits[habitIndex].goal = habitGoal;
            }
        } else {
            const newHabitData = {
                name: habitName,
                goal: habitGoal,
                completions: {},
                userId: state.user.uid // ASSOCIA O HÁBITO AO ID DO USUÁRIO
            };
            const docRef = await db.collection(HABITS_COLLECTION_NAME).add(newHabitData);
            state.habits.push({ id: docRef.id, ...newHabitData });
        }
        
        renderHabits();
        closeHabitModal();
    } catch (error) {
        console.error("Erro ao salvar hábito no Firestore:", error);
        alert("Ocorreu um erro ao salvar o hábito. Tente novamente.");
    }
}

// Funções para exclusão de hábito
function showDeleteConfirmation() {
    if (!state.user) {
        alert("Você precisa estar logado para excluir hábitos.");
        showAuthModal();
        return;
    }
    confirmModal.style.display = 'block';
}

function closeConfirmModal() {
    confirmModal.style.display = 'none';
    
    if (habitModal.style.display === 'block') {
        return;
    }
    
    state.deleteHabitId = null;
}

// Excluir hábito do Firestore
async function deleteHabit() {
    if (!state.user) {
        alert("Você precisa estar logado para excluir hábitos.");
        closeConfirmModal();
        showAuthModal();
        return;
    }
    if (state.deleteHabitId === null) return;
    
    try {
        await db.collection(HABITS_COLLECTION_NAME).doc(state.deleteHabitId).delete();
        
        state.habits = state.habits.filter(h => h.id !== state.deleteHabitId);
        
        renderHabits();
        closeConfirmModal();
        closeHabitModal();
        state.deleteHabitId = null;
    } catch (error) {
        console.error("Erro ao excluir hábito do Firestore:", error);
        alert("Ocorreu um erro ao excluir o hábito. Tente novamente.");
    }
}

// --- Funções de Autenticação ---

function showAuthModal() {
    authModal.style.display = 'block';
    authErrorMessage.textContent = ''; // Limpa mensagens de erro
    authForm.reset();
    // Ajusta visibilidade dos botões baseado no estado de login
    if (state.user) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

function closeAuthModal() {
    authModal.style.display = 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    authErrorMessage.textContent = '';

    if (!email || !password) {
        authErrorMessage.textContent = 'Por favor, preencha todos os campos.';
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        let message = 'Erro ao fazer login. Verifique seu e-mail e senha.';
        if (error.code === 'auth/user-not-found') {
            message = 'Usuário não encontrado. Registre-se primeiro.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Senha incorreta.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Formato de e-mail inválido.';
        }
        authErrorMessage.textContent = message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    authErrorMessage.textContent = '';

    if (!email || !password) {
        authErrorMessage.textContent = 'Por favor, preencha todos os campos.';
        return;
    }
    if (password.length < 6) {
        authErrorMessage.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        closeAuthModal();
    } catch (error) {
        console.error("Erro ao registrar:", error);
        let message = 'Erro ao registrar. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            message = 'Este e-mail já está em uso.';
        } else if (error.code === 'auth/weak-password') {
            message = 'A senha é muito fraca.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Formato de e-mail inválido.';
        }
        authErrorMessage.textContent = message;
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        closeAuthModal();
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Ocorreu um erro ao sair. Tente novamente.");
    }
}