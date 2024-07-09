import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class GitFusionPlugin {
    private gitWorkTree?: string;

    constructor(gitWorkTree?: string) {
        this.gitWorkTree = gitWorkTree;
    }

    private executeGitCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: this.gitWorkTree }, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    private async getLastCommitInfo() {
        try {
            const [hash, author, date, message] = await Promise.all([
                this.executeGitCommand('git rev-parse HEAD'),
                this.executeGitCommand('git log -1 --pretty=format:%an'),
                this.executeGitCommand('git log -1 --pretty=format:%ai'),
                this.executeGitCommand('git log -1 --pretty=format:%s'),
            ]);
            return {
                hash,
                author,
                date: new Date(date).toISOString(),
                message,
            };
        } catch (error) {
            console.error('Error getting last commit info:', error);
            throw error;
        }
    }

    private async getCurrentBranch() {
        try {
            const branch = await this.executeGitCommand('git branch --show-current');
            return branch;
        } catch (error) {
            console.error('Error getting current branch:', error);
            throw error;
        }
    }

    private async createGitFusionFile() {
        try {
            const { hash, author, date, message } = await this.getLastCommitInfo();
            const branch = await this.getCurrentBranch();

            const content = `LAST_COMMIT_ID=${hash}\nLAST_COMMIT_AUTHOR=${author}\nLAST_COMMIT_TIMESTAMP=${date}\nLAST_COMMIT_MESSAGE=${message}\nCURRENT_BRANCH=${branch}`;

            const filePath = path.resolve('.GIT_FUSION');
            await fs.promises.writeFile(filePath, content);

            console.log('[GIT FUSION] found following properties');
            console.log(content);

            console.log('.GIT_FUSION file created successfully.');
        } catch (error) {
            console.error('Error creating .GIT_FUSION file:', error);
            throw error;
        }
    }

    private async createGitFusionFileInJson() {
        try {
            const { hash, author, date, message } = await this.getLastCommitInfo();
            const branch = await this.getCurrentBranch();

            const filePath = path.resolve('.GIT_FUSION');

            const gitInfo = {
                gitLastCommit: { hash, author, date, message },
                branch,
            };

            await fs.promises.writeFile(filePath, JSON.stringify(gitInfo, null, 2));

            console.log('[GIT FUSION] found following properties');
            this.printKeyValuePairs(gitInfo);

            console.log('[GIT_FUSION] file created successfully.');
        } catch (error) {
            console.error('[GIT_FUSION] Error creating .GIT_FUSION file:', error);
            throw error;
        }
    }

    private printKeyValuePairs(obj: object, prefix: string = 'git'): void {
        for (const [key, value] of Object.entries(obj)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                this.printKeyValuePairs(value, newPrefix);
            } else {
                console.log(`${newPrefix}=${value}`);
            }
        }
    }

    public async createFile() {
        if (process.env.NODE_ENV_GIT_TRAIL_FILE_FORMAT === 'json') {
            await this.createGitFusionFileInJson();
        } else {
            await this.createGitFusionFile();
        }
    }
}
