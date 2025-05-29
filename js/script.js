// Dados iniciais dos hábitos (todos desmarcados por padrão)
const initialHabits = [
    { id: 1, name: "Ler um livro", goal: 20, completions: {} },
    { id: 2, name: "Comer uma fruta", goal: 20, completions: {} },
    { id: 3, name: "Saúde", goal: 21, completions: {} },
    { id: 4, name: "Academia", goal: 21, completions: {} },
    { id: 5, name: "Estudar na Alura", goal: 21, completions: {} },
    { id: 6, name: "Aprender um idioma", goal: 21, completions: {} },
    { id: 7, name: "Passear com o Beethoven", goal: 16, completions: {} },
    { id: 8, name: "Escovar os dentes", goal: 30, completions: {} },
    { id: 9, name: "Ouvir um podcast", goal: 21, completions: {} }
];

// Estado da aplicação
let state = {
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    habits: [...initialHabits],
    daysInMonth: 0,
    firstDayOfMonth: 0,
    editMode: false,
    editHabitId: null,
    deleteHabitId: null
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Função de inicialização
function initializeApp() {
    updateMonthInfo();
    renderCalendar();
    renderHabits();
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
    goalHeader.textContent = 'Goal';
    goalHeader.classList.add('goal-header');
    headerRow.appendChild(goalHeader);
    
    const achievedHeader = document.createElement('th');
    achievedHeader.textContent = 'Achieved';
    achievedHeader.classList.add('achieved-header');
    headerRow.appendChild(achievedHeader);
}

// Renderizar hábitos
function renderHabits() {
    const tbody = habitsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
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

// Alternar conclusão de hábito
function toggleHabitCompletion(habitId, day) {
    const habitIndex = state.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;
    
    const habit = state.habits[habitIndex];
    const monthKey = getCurrentMonthKey();
    
    // Inicializar o array de dias completados para o mês atual se não existir
    if (!habit.completions[monthKey]) {
        habit.completions[monthKey] = [];
    }
    
    const completedDays = habit.completions[monthKey];
    const dayIndex = completedDays.indexOf(day);
    
    if (dayIndex === -1) {
        // Adicionar dia à lista de dias concluídos do mês atual
        completedDays.push(day);
    } else {
        // Remover dia da lista de dias concluídos do mês atual
        completedDays.splice(dayIndex, 1);
    }
    
    // Atualizar a interface
    renderHabits();
    
    // Salvar dados
    saveData();
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

// Funções do modal
function openHabitModal(habitId = null) {
    // Resetar o formulário
    habitForm.reset();
    
    if (habitId) {
        // Modo de edição
        state.editMode = true;
        state.editHabitId = habitId;
        
        // Encontrar o hábito pelo ID
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        // Preencher o formulário com os dados do hábito
        document.getElementById('habit-name').value = habit.name;
        document.getElementById('habit-goal').value = habit.goal;
        document.getElementById('edit-habit-id').value = habitId;
        
        // Atualizar título e botão do modal
        modalTitle.textContent = 'Editar Hábito';
        habitSubmitBtn.textContent = 'Salvar';
        
        // Mostrar botão de exclusão
        deleteHabitBtn.classList.add('show');
    } else {
        // Modo de adição
        state.editMode = false;
        state.editHabitId = null;
        
        // Atualizar título e botão do modal
        modalTitle.textContent = 'Adicionar Novo Hábito';
        habitSubmitBtn.textContent = 'Adicionar';
        
        // Esconder botão de exclusão
        deleteHabitBtn.classList.remove('show');
    }
    
    // Exibir o modal
    habitModal.style.display = 'block';
}

function closeHabitModal() {
    habitModal.style.display = 'none';
    habitForm.reset();
    state.editMode = false;
    state.editHabitId = null;
}

// Manipular envio do formulário de hábito (novo ou edição)
function handleHabitFormSubmit(e) {
    e.preventDefault();
    
    const habitName = document.getElementById('habit-name').value;
    const habitGoal = parseInt(document.getElementById('habit-goal').value);
    
    if (!habitName || isNaN(habitGoal)) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    if (state.editMode && state.editHabitId) {
        // Editar hábito existente
        const habitIndex = state.habits.findIndex(h => h.id === state.editHabitId);
        if (habitIndex !== -1) {
            // Preservar completions
            const completions = state.habits[habitIndex].completions;
            
            // Atualizar nome e meta
            state.habits[habitIndex].name = habitName;
            state.habits[habitIndex].goal = habitGoal;
        }
    } else {
        // Criar novo hábito
        const newHabit = {
            id: state.habits.length > 0 ? Math.max(...state.habits.map(h => h.id)) + 1 : 1,
            name: habitName,
            goal: habitGoal,
            completions: {}
        };
        
        // Adicionar ao estado
        state.habits.push(newHabit);
    }
    
    // Atualizar interface
    renderHabits();
    
    // Salvar dados
    saveData();
    
    // Fechar modal
    closeHabitModal();
}

// Funções para exclusão de hábito
function showDeleteConfirmation() {
    // Exibir modal de confirmação
    confirmModal.style.display = 'block';
}

function closeConfirmModal() {
    confirmModal.style.display = 'none';
    
    // Se o modal foi aberto a partir do botão de exclusão no modal de edição,
    // manter o modal de edição aberto
    if (habitModal.style.display === 'block') {
        return;
    }
    
    // Limpar ID de exclusão se o modal foi fechado sem confirmar
    state.deleteHabitId = null;
}

function deleteHabit() {
    // Verificar se há um ID de hábito para excluir
    if (state.deleteHabitId === null) return;
    
    // Encontrar o índice do hábito
    const habitIndex = state.habits.findIndex(h => h.id === state.deleteHabitId);
    if (habitIndex === -1) return;
    
    // Remover o hábito do array
    state.habits.splice(habitIndex, 1);
    
    // Atualizar interface
    renderHabits();
    
    // Salvar dados
    saveData();
    
    // Fechar modais
    closeConfirmModal();
    closeHabitModal();
    
    // Limpar ID de exclusão
    state.deleteHabitId = null;
}

// Função para salvar dados no localStorage
function saveData() {
    localStorage.setItem('dailyHabitsData', JSON.stringify({
        habits: state.habits,
        lastUpdated: new Date().toISOString()
    }));
}

// Função para carregar dados do localStorage
function loadData() {
    const savedData = localStorage.getItem('dailyHabitsData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Verificar se os dados salvos usam o formato antigo (com days em vez de completions)
        const needsMigration = parsedData.habits.some(habit => habit.days !== undefined);
        
        if (needsMigration) {
            // Migrar dados do formato antigo para o novo
            parsedData.habits.forEach(habit => {
                // Inicializar completions como objeto vazio
                habit.completions = {};
                
                // Se houver dias marcados, colocá-los no mês atual
                if (habit.days && habit.days.length > 0) {
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const monthKey = `${currentYear}-${currentMonth}`;
                    
                    habit.completions[monthKey] = [...habit.days];
                }
                
                // Remover a propriedade days
                delete habit.days;
                delete habit.achieved;
            });
        }
        
        state.habits = parsedData.habits;
    }
}

// Tentar carregar dados salvos
try {
    loadData();
} catch (error) {
    console.error('Erro ao carregar dados:', error);
    // Usar dados iniciais em caso de erro
    state.habits = [...initialHabits];
}
