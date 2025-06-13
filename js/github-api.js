class GitHubAPI {
    constructor() {
        this.token = localStorage.getItem('github_token');
        this.owner = 'rnq27gq'; // あなたのGitHubユーザー名
        this.repo = 'ff14-raid-gear-system';
        this.baseURL = `https://api.github.com/repos/${this.owner}/${this.repo}/contents`;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('github_token', token);
    }

    async getData(fileName) {
        if (!this.token) {
            throw new Error('認証が必要です');
        }

        try {
            const response = await fetch(`${this.baseURL}/data/${fileName}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                // ファイルが存在しない場合は空のデータを返す
                return { content: {}, sha: null };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                content: JSON.parse(atob(data.content)),
                sha: data.sha,
                lastUpdated: data.commit?.author?.date || new Date().toISOString()
            };
        } catch (error) {
            console.error(`データ取得エラー (${fileName}):`, error);
            throw error;
        }
    }

    async saveData(fileName, data, commitMessage, sha = null) {
        if (!this.token) {
            throw new Error('認証が必要です');
        }

        const body = {
            message: commitMessage,
            content: btoa(JSON.stringify(data, null, 2)),
            branch: 'main'
        };

        if (sha) {
            body.sha = sha;
        }

        try {
            const response = await fetch(`${this.baseURL}/data/${fileName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`保存失敗: ${errorData.message}`);
            }

            const result = await response.json();
            return {
                success: true,
                sha: result.content.sha,
                commit: result.commit
            };
        } catch (error) {
            console.error(`データ保存エラー (${fileName}):`, error);
            throw error;
        }
    }

    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async getUserInfo() {
        if (!this.token) return null;

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('ユーザー情報取得エラー:', error);
        }
        return null;
    }
}