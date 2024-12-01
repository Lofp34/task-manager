// Variables Globales
let currentEditTask = null;
let currentReasonTask = null;
let timerIntervals = {}; // Pour gérer les timers de chaque tâche

// Fonction pour ouvrir la modale d'ajout
function openModal() {
    console.log('Ouverture de la modale d\'ajout');
    document.getElementById('task-modal').style.display = 'flex';
}

// Fonction pour fermer la modale d'ajout
function closeModal() {
    console.log('Fermeture de la modale d\'ajout');
    document.getElementById('task-modal').style.display = 'none';
    clearModal();
}

// Fonction pour effacer les champs de la modale d'ajout
function clearModal() {
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-hour').value = '1';
    document.getElementById('task-minute').value = '0';
    document.getElementById('task-day').value = 'lundi';
}

// Fonction pour enregistrer la tâche
function saveTask() {
    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const hour = parseInt(document.getElementById('task-hour').value) || 0;
    const minute = parseInt(document.getElementById('task-minute').value) || 0;
    const day = document.getElementById('task-day').value;

    if (title === '') {
        alert('Veuillez remplir le champ Titre.');
        return;
    }

    const task = {
        id: Date.now(), // Identifiant unique
        title: title,
        desc: desc,
        hour: hour,
        minute: minute,
        day: day,
        status: 'En attente', // Par défaut
        reason: '',
        elapsed: 0 // Temps écoulé en secondes
    };

    addTaskToContainer(task, 'day');
    saveTasksToLocalStorage();
    closeModal();
}

// Fonction pour ajouter la tâche au conteneur approprié
function addTaskToContainer(task, containerType) {
    let tasksContainerId = '';
    if (containerType === 'day') {
        tasksContainerId = `${task.day}-tasks`;
    } else if (containerType === 'well-done') {
        tasksContainerId = 'well-done-tasks';
    } else if (containerType === 'failed') {
        tasksContainerId = 'failed-tasks';
    }

    const tasksContainer = document.getElementById(tasksContainerId);

    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    if (containerType === 'well-done' || containerType === 'failed') {
        taskCard.classList.add('minimized');
    }
    taskCard.dataset.id = task.id;
    taskCard.dataset.title = task.title;
    taskCard.dataset.desc = task.desc;
    taskCard.dataset.hour = task.hour;
    taskCard.dataset.minute = task.minute;
    taskCard.dataset.day = task.day;
    taskCard.dataset.status = task.status;
    taskCard.dataset.reason = task.reason;
    taskCard.dataset.elapsed = task.elapsed;

    const taskTitle = document.createElement('div');
    taskTitle.className = 'task-title';
    taskTitle.textContent = task.title;

    // Chronomètre
    const timer = document.createElement('div');
    timer.className = 'timer';

    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'timer-display';
    timerDisplay.textContent = formatTime(task.elapsed);

    const timerBtn = document.createElement('button');
    timerBtn.className = 'timer-btn';
    timerBtn.textContent = 'Start';
    timerBtn.onclick = (e) => {
        e.stopPropagation(); // Empêche l'ouverture de la modale d'édition
        toggleTimer(taskCard, timerBtn, timerDisplay);
    };

    timer.appendChild(timerDisplay);
    timer.appendChild(timerBtn);

    // Checkmark Button
    const checkmarkBtn = document.createElement('button');
    checkmarkBtn.className = 'checkmark-btn';
    checkmarkBtn.innerHTML = '✔';
    checkmarkBtn.title = 'Marquer comme Bien Fait';
    checkmarkBtn.onclick = (e) => {
        e.stopPropagation(); // Empêche l'ouverture de la modale d'édition
        markAsWellDone(taskCard);
    };

    // Delete Button (Nouvelle Fonctionnalité)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = 'Supprimer la tâche';
    deleteBtn.onclick = (e) => {
        e.stopPropagation(); // Empêche l'ouverture de la modale d'édition
        deleteTask(taskCard);
    };

    // Détails de la tâche
    const taskDetails = document.createElement('div');
    taskDetails.className = 'task-details';

    const taskTime = document.createElement('div');
    taskTime.className = 'task-time';
    taskTime.textContent = `Durée : ${task.hour}h ${task.minute}min`;

    const taskStatus = document.createElement('div');
    taskStatus.className = 'task-status';
    taskStatus.textContent = `Statut : ${task.status}`;

    taskDetails.appendChild(taskTime);
    taskDetails.appendChild(taskStatus);

    taskCard.appendChild(checkmarkBtn);
    taskCard.appendChild(deleteBtn); // Ajout du bouton de suppression
    taskCard.appendChild(taskTitle);
    taskCard.appendChild(timer); // Ajout du chronomètre en dehors de task-details
    taskCard.appendChild(taskDetails);

    // Ajouter l'événement de clic pour modifier la tâche
    taskCard.addEventListener('click', function() {
        openEditModal(taskCard);
    });

    tasksContainer.appendChild(taskCard);
}

// Fonction pour formater le temps en HH:MM:SS
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Fonction pour basculer le chronomètre
function toggleTimer(taskCard, timerBtn, timerDisplay) {
    const taskId = taskCard.dataset.id;
    if (timerIntervals[taskId]) {
        // Arrêter le chronomètre
        clearInterval(timerIntervals[taskId]);
        delete timerIntervals[taskId];
        timerBtn.textContent = 'Start';
        console.log(`Chronomètre arrêté pour la tâche ID: ${taskId}`);
    } else {
        // Démarrer le chronomètre
        timerIntervals[taskId] = setInterval(() => {
            taskCard.dataset.elapsed = parseInt(taskCard.dataset.elapsed) + 1;
            timerDisplay.textContent = formatTime(taskCard.dataset.elapsed);
            // Si la modale d'édition est ouverte pour cette tâche, mettre à jour le temps
            if (currentEditTask && currentEditTask.dataset.id === taskId) {
                document.getElementById('edit-task-elapsed').textContent = formatTime(taskCard.dataset.elapsed);
            }
        }, 1000);
        timerBtn.textContent = 'Stop';
        console.log(`Chronomètre démarré pour la tâche ID: ${taskId}`);
    }
}

// Fonction pour marquer une tâche comme Bien Fait
function markAsWellDone(taskCard) {
    const taskId = taskCard.dataset.id;
    const title = taskCard.dataset.title;
    const desc = taskCard.dataset.desc;
    const hour = parseInt(taskCard.dataset.hour) || 0;
    const minute = parseInt(taskCard.dataset.minute) || 0;
    const day = taskCard.dataset.day;
    const status = 'Bien Fait';
    const reason = taskCard.dataset.reason;
    const elapsed = parseInt(taskCard.dataset.elapsed) || 0;

    // Arrêter le chronomètre si en cours
    if (timerIntervals[taskId]) {
        clearInterval(timerIntervals[taskId]);
        delete timerIntervals[taskId];
    }

    // Mettre à jour la tâche
    const updatedTask = {
        id: taskId,
        title: title,
        desc: desc,
        hour: hour + Math.floor(elapsed / 3600),
        minute: minute + Math.floor((elapsed % 3600) / 60),
        day: day,
        status: status,
        reason: reason,
        elapsed: elapsed
    };

    // Supprimer la tâche de son conteneur actuel
    taskCard.parentElement.removeChild(taskCard);

    // Ajouter la tâche mise à jour au conteneur "Bien Fait"
    addTaskToContainer(updatedTask, 'well-done');

    // Sauvegarder les changements
    saveTasksToLocalStorage();
    updateProgress(day);
    console.log(`Tâche ID: ${taskId} marquée comme Bien Fait`);
}

// Fonction pour supprimer une tâche
function deleteTask(taskCard) {
    const taskId = taskCard.dataset.id;
    const confirmation = confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?');
    if (confirmation) {
        taskCard.parentElement.removeChild(taskCard);
        delete timerIntervals[taskId]; // Arrêter le chronomètre si en cours
        saveTasksToLocalStorage();
        updateProgress(taskCard.dataset.day);
        console.log(`Tâche ID: ${taskId} supprimée`);
    }
}

// Fonction pour ouvrir la modale de modification
function openEditModal(taskCard) {
    currentEditTask = taskCard;
    document.getElementById('edit-task-title').value = taskCard.dataset.title;
    document.getElementById('edit-task-desc').value = taskCard.dataset.desc;
    document.getElementById('edit-task-hour').value = taskCard.dataset.hour;
    document.getElementById('edit-task-minute').value = taskCard.dataset.minute;
    document.getElementById('edit-task-day').value = taskCard.dataset.day;
    document.getElementById('edit-task-status').value = taskCard.dataset.status;
    document.getElementById('edit-task-elapsed').textContent = formatTime(taskCard.dataset.elapsed);

    document.getElementById('edit-modal').style.display = 'flex';
    console.log(`Ouverture de la modale de modification pour la tâche ID: ${taskCard.dataset.id}`);
}

// Fonction pour fermer la modale de modification
function closeEditModal() {
    console.log('Fermeture de la modale de modification');
    document.getElementById('edit-modal').style.display = 'none';
    currentEditTask = null;
}

// Fonction pour ouvrir la modale de raison
function openReasonModal(taskCard) {
    currentReasonTask = taskCard;
    document.getElementById('reason-text').value = '';
    document.getElementById('reason-modal').style.display = 'flex';
    console.log(`Ouverture de la modale de raison pour la tâche ID: ${taskCard.dataset.id}`);
}

// Fonction pour fermer la modale de raison
function closeReasonModal() {
    console.log('Fermeture de la modale de raison');
    document.getElementById('reason-modal').style.display = 'none';
    currentReasonTask = null;
}

// Fonction pour sauvegarder la raison de la tâche ratée
function saveReason() {
    if (!currentReasonTask) {
        console.error('Aucune tâche sélectionnée pour enregistrer la raison');
        return;
    }

    const reason = document.getElementById('reason-text').value.trim();
    if (reason === '') {
        alert('Veuillez entrer une raison pour la tâche ratée.');
        return;
    }

    console.log(`Raison saisie pour la tâche ID: ${currentReasonTask.dataset.id} - ${reason}`);

    // Ajouter la raison à la description avec un saut de ligne
    let newDesc = currentReasonTask.dataset.desc;
    if (newDesc !== '') {
        newDesc += `\nLa tâche a été ratée car : ${reason}`;
    } else {
        newDesc = `La tâche a été ratée car : ${reason}`;
    }

    currentReasonTask.dataset.desc = newDesc;
    currentReasonTask.dataset.reason = reason; // Stocker la raison séparément si nécessaire

    // Mettre à jour l'affichage de la tâche
    updateTaskDisplay(currentReasonTask);

    // Fermer la modale de raison
    closeReasonModal();

    // Fermer la modale d'édition si elle est ouverte
    closeEditModal();

    // Déplacer la tâche vers la section appropriée
    moveTaskToSection(currentReasonTask);

    // Mettre à jour la progression
    updateProgress(currentReasonTask.dataset.day);

    // Sauvegarder les tâches
    saveTasksToLocalStorage();
    console.log(`Raison enregistrée et tâche déplacée pour la tâche ID: ${currentReasonTask.dataset.id}`);
}

// Fonction pour mettre à jour la tâche après modification
function updateTask() {
    if (!currentEditTask) {
        console.error('Aucune tâche sélectionnée pour la modification');
        return;
    }

    const desc = document.getElementById('edit-task-desc').value.trim();
    const hour = parseInt(document.getElementById('edit-task-hour').value) || 0;
    const minute = parseInt(document.getElementById('edit-task-minute').value) || 0;
    const day = document.getElementById('edit-task-day').value;
    const status = document.getElementById('edit-task-status').value;

    console.log(`Mise à jour de la tâche ID: ${currentEditTask.dataset.id}`);

    // Mettre à jour les données de la tâche
    currentEditTask.dataset.desc = desc;
    currentEditTask.dataset.hour = hour;
    currentEditTask.dataset.minute = minute;
    currentEditTask.dataset.day = day;
    currentEditTask.dataset.status = status;

    // Mettre à jour l'affichage de la tâche
    updateTaskDisplay(currentEditTask);

    // Gérer la raison si la tâche est ratée
    if (status === 'Ratée') {
        openReasonModal(currentEditTask);
        // Arrêter l'exécution ici pour attendre la saisie de la raison
        return;
    } else {
        // Supprimer toute raison précédemment ajoutée
        currentEditTask.dataset.reason = '';
        const taskDesc = currentEditTask.querySelector('.task-desc');
        if (taskDesc && taskDesc.textContent.includes('La tâche a été ratée car :')) {
            // Retirer la ligne de raison
            const lines = taskDesc.textContent.split('\n');
            const filteredLines = lines.filter(line => !line.startsWith('La tâche a été ratée car :'));
            taskDesc.textContent = filteredLines.join('\n');
        }
    }

    // Si le jour ou le statut a changé, déplacer la tâche
    if (currentEditTask.dataset.day !== day || status === 'Bien Fait') {
        moveTaskToSection(currentEditTask);
    } else {
        // Mettre à jour les détails affichés
        updateTaskDisplay(currentEditTask);
    }

    updateProgress(day);
    saveTasksToLocalStorage();
    closeEditModal();
}

// Fonction pour mettre à jour l'affichage de la tâche
function updateTaskDisplay(taskCard) {
    const taskTitle = taskCard.querySelector('.task-title');
    const taskDetails = taskCard.querySelector('.task-details');
    const taskTime = taskDetails.querySelector('.task-time');
    const taskStatus = taskDetails.querySelector('.task-status');
    const timerDisplay = taskCard.querySelector('.timer-display');

    taskTime.textContent = `Durée : ${taskCard.dataset.hour}h ${taskCard.dataset.minute}min`;
    taskStatus.textContent = `Statut : ${taskCard.dataset.status}`;
    timerDisplay.textContent = formatTime(taskCard.dataset.elapsed);

    // Mettre à jour la description de la tâche
    let taskDesc = taskCard.querySelector('.task-desc');
    if (taskDesc) {
        taskDesc.textContent = taskCard.dataset.desc;
    } else if (taskCard.dataset.desc !== '') {
        taskDesc = document.createElement('div');
        taskDesc.className = 'task-desc';
        taskDesc.textContent = taskCard.dataset.desc;
        taskDetails.appendChild(taskDesc);
    }
}

// Fonction pour déterminer le type de conteneur
function getContainerType(containerId) {
    if (containerId.endsWith('-tasks')) {
        if (containerId.startsWith('well-done')) return 'well-done';
        if (containerId.startsWith('failed')) return 'failed';
        return 'day';
    }
    return 'unknown';
}

// Fonction pour déplacer la tâche vers la section appropriée
function moveTaskToSection(taskCard) {
    const status = taskCard.dataset.status;
    let targetContainerId = '';

    if (status === 'Bien Fait') {
        targetContainerId = 'well-done-tasks';
    } else if (status === 'Ratée') {
        targetContainerId = 'failed-tasks';
    } else {
        // Pour les autres statuts, retourner au conteneur jour
        const day = taskCard.dataset.day;
        targetContainerId = `${day}-tasks`;
    }

    const targetContainerType = getContainerType(targetContainerId);
    const targetContainer = document.getElementById(targetContainerId);

    // Supprimer la tâche de son conteneur actuel
    taskCard.parentElement.removeChild(taskCard);

    // Ajouter la tâche au nouveau conteneur
    addTaskToContainer({
        id: taskCard.dataset.id,
        title: taskCard.dataset.title,
        desc: taskCard.dataset.desc,
        hour: taskCard.dataset.hour,
        minute: taskCard.dataset.minute,
        day: taskCard.dataset.day,
        status: taskCard.dataset.status,
        reason: taskCard.dataset.reason,
        elapsed: parseInt(taskCard.dataset.elapsed) || 0
    }, targetContainerType);

    // Mettre à jour les barres de progression pour les jours concernés
    if (targetContainerType === 'day') {
        updateProgress(taskCard.dataset.day);
    } else if (targetContainerType === 'well-done') {
        updateProgress('bien-done');
    } else if (targetContainerType === 'failed') {
        updateProgress('ratée');
    }

    console.log(`Tâche déplacée vers ${targetContainerType} pour la tâche ID: ${taskCard.dataset.id}`);
}

// Fonction pour basculer l'ouverture/fermeture d'une carte
function toggleCard(cardId) {
    const card = document.getElementById(cardId);
    card.classList.toggle('closed');
    console.log(`Carte ${cardId} ${card.classList.contains('closed') ? 'fermée' : 'ouverte'}`);
}

// Fonction pour mettre à jour les barres de progression
function updateProgress(day) {
    const tasksContainerId = `${day}-tasks`;
    const dayTasks = document.querySelectorAll(`#${tasksContainerId} .task-card`);
    let totalMinutes = 0;
    dayTasks.forEach(task => {
        totalMinutes += parseInt(task.dataset.hour) * 60 + parseInt(task.dataset.minute);
    });
    const totalHours = (totalMinutes / 60).toFixed(2);
    document.getElementById(`${day}-hours`).textContent = totalHours;

    const workTime = parseInt(document.getElementById('work-time').value);
    const progressPercent = workTime > 0 ? Math.min((totalHours / workTime) * 100, 100) : 0;

    const progressBar = document.getElementById(`${day}-bar`);
    progressBar.style.width = `${progressPercent}%`;

    updateProgressBarColor(progressBar, progressPercent);
    console.log(`Mise à jour de la progression pour ${day}: ${progressPercent}%`);
}

// Fonction pour mettre à jour la couleur de la barre de progression
function updateProgressBarColor(bar, percent) {
    // Utilisation de HSL pour changer la teinte en fonction du pourcentage
    // Vert (120) -> Rouge (0)
    const hue = (120 - (120 * percent / 100)).toFixed(0);
    bar.style.background = `hsl(${hue}, 100%, 50%)`;
    console.log(`Couleur de la barre de progression mise à jour à ${hue} degrés`);
}

// Fonction pour mettre à jour toutes les barres de progression
function updateProgressBars() {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    days.forEach(day => {
        updateProgress(day);
    });
    console.log('Toutes les barres de progression ont été mises à jour');
}

// Fonction pour sauvegarder les tâches dans le localStorage
function saveTasksToLocalStorage() {
    const tasks = [];

    // Récupérer les tâches des jours
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    days.forEach(day => {
        const dayTasks = document.querySelectorAll(`#${day}-tasks .task-card`);
        dayTasks.forEach(task => {
            tasks.push({
                id: task.dataset.id,
                title: task.dataset.title,
                desc: task.dataset.desc,
                hour: task.dataset.hour,
                minute: task.dataset.minute,
                day: task.dataset.day,
                status: task.dataset.status,
                reason: task.dataset.reason,
                elapsed: task.dataset.elapsed
            });
        });
    });

    // Récupérer les tâches "Bien Fait"
    const wellDoneTasks = document.querySelectorAll(`#well-done-tasks .task-card`);
    wellDoneTasks.forEach(task => {
        tasks.push({
            id: task.dataset.id,
            title: task.dataset.title,
            desc: task.dataset.desc,
            hour: task.dataset.hour,
            minute: task.dataset.minute,
            day: task.dataset.day,
            status: task.dataset.status,
            reason: task.dataset.reason,
            elapsed: task.dataset.elapsed
        });
    });

    // Récupérer les tâches "Ratée"
    const failedTasks = document.querySelectorAll(`#failed-tasks .task-card`);
    failedTasks.forEach(task => {
        tasks.push({
            id: task.dataset.id,
            title: task.dataset.title,
            desc: task.dataset.desc,
            hour: task.dataset.hour,
            minute: task.dataset.minute,
            day: task.dataset.day,
            status: task.dataset.status,
            reason: task.dataset.reason,
            elapsed: task.dataset.elapsed
        });
    });

    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log('Tâches sauvegardées dans le localStorage');
}

// Fonction pour charger les tâches depuis le localStorage
function loadTasksFromLocalStorage() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        let containerType = 'day';
        if (task.status === 'Bien Fait') {
            containerType = 'well-done';
        } else if (task.status === 'Ratée') {
            containerType = 'failed';
        }
        addTaskToContainer(task, containerType);
    });
    updateProgressBars();
    console.log('Tâches chargées depuis le localStorage');
}

// Fonction pour fermer les modales si l'utilisateur clique en dehors de celles-ci
window.onclick = function(event) {
    const modals = ['task-modal', 'edit-modal', 'reason-modal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target == modal) {
            if (modalId === 'task-modal') {
                closeModal();
            } else if (modalId === 'edit-modal') {
                closeEditModal();
            } else if (modalId === 'reason-modal') {
                closeReasonModal();
            }
        }
    });
    console.log('Vérification des clics en dehors des modales');
}

// Charger les tâches dès que le contenu est chargé
document.addEventListener('DOMContentLoaded', () => {
    loadTasksFromLocalStorage();
});

// Fonction pour sauvegarder la raison de la tâche ratée
function saveReason() {
    if (!currentReasonTask) {
        console.error('Aucune tâche sélectionnée pour enregistrer la raison');
        return;
    }

    const reason = document.getElementById('reason-text').value.trim();
    if (reason === '') {
        alert('Veuillez entrer une raison pour la tâche ratée.');
        return;
    }

    console.log(`Raison saisie pour la tâche ID: ${currentReasonTask.dataset.id} - ${reason}`);

    // Ajouter la raison à la description avec un saut de ligne
    let newDesc = currentReasonTask.dataset.desc;
    if (newDesc !== '') {
        newDesc += `\nLa tâche a été ratée car : ${reason}`;
    } else {
        newDesc = `La tâche a été ratée car : ${reason}`;
    }

    currentReasonTask.dataset.desc = newDesc;
    currentReasonTask.dataset.reason = reason; // Stocker la raison séparément si nécessaire

    // Mettre à jour l'affichage de la tâche
    updateTaskDisplay(currentReasonTask);

    // Fermer la modale de raison
    closeReasonModal();

    // Fermer la modale d'édition si elle est ouverte
    closeEditModal();

    // Déplacer la tâche vers la section appropriée
    moveTaskToSection(currentReasonTask);

    // Mettre à jour la progression
    updateProgress(currentReasonTask.dataset.day);

    // Sauvegarder les tâches
    saveTasksToLocalStorage();
    console.log(`Raison enregistrée et tâche déplacée pour la tâche ID: ${currentReasonTask.dataset.id}`);
}

// Fonction pour mettre à jour la tâche après modification
function updateTask() {
    if (!currentEditTask) {
        console.error('Aucune tâche sélectionnée pour la modification');
        return;
    }

    const desc = document.getElementById('edit-task-desc').value.trim();
    const hour = parseInt(document.getElementById('edit-task-hour').value) || 0;
    const minute = parseInt(document.getElementById('edit-task-minute').value) || 0;
    const day = document.getElementById('edit-task-day').value;
    const status = document.getElementById('edit-task-status').value;

    console.log(`Mise à jour de la tâche ID: ${currentEditTask.dataset.id}`);

    // Mettre à jour les données de la tâche
    currentEditTask.dataset.desc = desc;
    currentEditTask.dataset.hour = hour;
    currentEditTask.dataset.minute = minute;
    currentEditTask.dataset.day = day;
    currentEditTask.dataset.status = status;

    // Mettre à jour l'affichage de la tâche
    updateTaskDisplay(currentEditTask);

    // Gérer la raison si la tâche est ratée
    if (status === 'Ratée') {
        openReasonModal(currentEditTask);
        // Arrêter l'exécution ici pour attendre la saisie de la raison
        return;
    } else {
        // Supprimer toute raison précédemment ajoutée
        currentEditTask.dataset.reason = '';
        const taskDesc = currentEditTask.querySelector('.task-desc');
        if (taskDesc && taskDesc.textContent.includes('La tâche a été ratée car :')) {
            // Retirer la ligne de raison
            const lines = taskDesc.textContent.split('\n');
            const filteredLines = lines.filter(line => !line.startsWith('La tâche a été ratée car :'));
            taskDesc.textContent = filteredLines.join('\n');
        }
    }

    // Si le jour ou le statut a changé, déplacer la tâche
    if (currentEditTask.dataset.day !== day || status === 'Bien Fait') {
        moveTaskToSection(currentEditTask);
    } else {
        // Mettre à jour les détails affichés
        updateTaskDisplay(currentEditTask);
    }

    updateProgress(day);
    saveTasksToLocalStorage();
    closeEditModal();
}