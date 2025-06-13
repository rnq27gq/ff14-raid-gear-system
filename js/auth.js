class AuthManager {
    constructor(githubAPI) {
        this.githubAPI = githubAPI;
        this.isLoggedIn = false;
        this.currentUser = null;
    }

    async initialize() {
        const token = localStorage.getItem('github_token');
        if (token) {
            this.githubAPI.setToken(token);
            const isValid = await this.githubAPI.validateToken();
            if (isValid) {
                this.isLoggedIn = true;
                this.currentUser = await this.githubAPI.getUserInfo();
                this.updateLoginUI();
                return true;
            } else {
                this.logout();
            }
        }
        return false;
    }

    async login(token) {
        this.githubAPI.setToken(token);
        const isValid = await this.githubAPI.validateToken();
        
        if (isValid) {
            this.isLoggedIn = true;
            this.currentUser = await this.githubAPI.getUserInfo();
            this.updateLoginUI();
            return true;
        } else {
            this.githubAPI.setToken('');
            throw new Error('無効なトークンです');
        }
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.githubAPI.setToken('');
        localStorage.removeItem('github_token');
        this.updateLoginUI();
    }

    updateLoginUI() {
        const loginSection = document.getElementById('login-section');
        const mainApp = document.getElementById('main-app');
        const userInfo = document.getElementById('user-info');

        if (this.isLoggedIn && this.currentUser) {
            loginSection.style.display = 'none';
            mainApp.style.display = 'block';
            userInfo.innerHTML = `
                <span>ログイン中: ${this.currentUser.login}</span>
                <button onclick="authManager.logout()" class="logout-btn">ログアウト</button>
            `;
        } else {
            loginSection.style.display = 'block';
            mainApp.style.display = 'none';
            userInfo.innerHTML = '';
        }
    }

    isAuthenticated() {
        return this.isLoggedIn;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}