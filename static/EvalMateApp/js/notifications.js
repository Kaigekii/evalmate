/**
 * Modern Sidebar Notification System
 * Replaces traditional alerts and toasts with sleek sidebar notifications
 */

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.loadingId = null;
        this.init();
    }

    init() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.className = 'notification-sidebar';
        this.container.id = 'notificationSidebar';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 4000) {
        // Auto-dismiss loading notifications when showing success/error
        if ((type === 'success' || type === 'error') && this.loadingId) {
            this.hide(this.loadingId);
            this.loadingId = null;
        }
        
        const id = Date.now() + Math.random();
        const notification = this.createNotification(message, type, id);
        
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification, type });

        // Track loading notifications
        if (type === 'loading') {
            this.loadingId = id;
        }

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove if duration is set
        if (duration > 0 && type !== 'loading') {
            setTimeout(() => this.hide(id), duration);
        }

        return id;
    }

    createNotification(message, type, id) {
        const notification = document.createElement('div');
        notification.className = `notification-item notification-${type}`;
        notification.dataset.id = id;

        const icon = this.getIcon(type);
        const color = this.getColor(type);

        notification.innerHTML = `
            <div class="notification-icon" style="background: ${color};">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="notificationManager.hide(${id})">
                <i class="fas fa-times"></i>
            </button>
        `;

        return notification;
    }

    hide(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.element.classList.remove('show');
            notif.element.classList.add('hide');
            
            setTimeout(() => {
                notif.element.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    hideAll() {
        this.notifications.forEach(notif => {
            notif.element.classList.remove('show');
            notif.element.classList.add('hide');
        });

        setTimeout(() => {
            this.container.innerHTML = '';
            this.notifications = [];
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            loading: 'spinner fa-spin'
        };
        return icons[type] || 'info-circle';
    }

    getColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            info: 'linear-gradient(135deg, #37353E 0%, #44444E 100%)',
            loading: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        };
        return colors[type] || colors.info;
    }

    // Confirmation dialog
    confirm(message, onConfirm, onCancel) {
        const id = Date.now() + Math.random();
        const notification = document.createElement('div');
        notification.className = 'notification-item notification-confirm show';
        notification.dataset.id = id;

        notification.innerHTML = `
            <div class="notification-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <i class="fas fa-question-circle"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <div class="notification-actions">
                    <button class="notification-btn notification-btn--cancel" id="notif-cancel-${id}">
                        Cancel
                    </button>
                    <button class="notification-btn notification-btn--confirm" id="notif-confirm-${id}">
                        Confirm
                    </button>
                </div>
            </div>
        `;

        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // Event listeners
        document.getElementById(`notif-confirm-${id}`).addEventListener('click', () => {
            this.hide(id);
            if (onConfirm) onConfirm();
        });

        document.getElementById(`notif-cancel-${id}`).addEventListener('click', () => {
            this.hide(id);
            if (onCancel) onCancel();
        });

        return id;
    }
}

// Initialize global notification manager
const notificationManager = new NotificationManager();

// Legacy compatibility functions
function showNotification(message, type = 'info') {
    notificationManager.show(message, type);
}

function showConfirm(message, onConfirm, onCancel) {
    notificationManager.confirm(message, onConfirm, onCancel);
}
