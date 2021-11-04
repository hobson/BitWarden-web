import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StorageService } from 'jslib-common/abstractions/storage.service';
import { HtmlStorageLocation } from 'jslib-common/enums/htmlStorageLocation';

import { Globals } from 'jslib-common/models/domain/globals';
import { StorageOptions } from 'jslib-common/models/domain/storageOptions';

export class HtmlStorageService implements StorageService {
    private memoryStorage = new Map<string, string>();

    get defaultOptions(): StorageOptions {
        return { htmlStorageLocation: HtmlStorageLocation.Session };
    }

    constructor(private platformUtilsService: PlatformUtilsService) { }

    async init() {
        let globals = await this.get<Globals>('globals', { htmlStorageLocation: HtmlStorageLocation.Local });
        if (globals == null) {
            globals = new Globals();
            globals.vaultTimeoutAction = 'lock';
            if (!this.platformUtilsService.isDev()) {
                globals.vaultTimeout = 15;
            }
        }
        await this.save('globals', globals, { htmlStorageLocation: HtmlStorageLocation.Local });
    }

    get<T>(key: string, options: StorageOptions = this.defaultOptions): Promise<T> {
        let json: string = null;
        switch (options.htmlStorageLocation) {
            case HtmlStorageLocation.Local:
                json = window.localStorage.getItem(key);
                break;
            case HtmlStorageLocation.Memory:
                json = this.memoryStorage.get(key);
                break;
            case HtmlStorageLocation.Session:
                 default:
                json = window.sessionStorage.getItem(key);
                break;
        }

        if (json != null) {
            const obj = JSON.parse(json);
            return Promise.resolve(obj as T);
        }
        return Promise.resolve(null);
    }

    async has(key: string, options: StorageOptions = this.defaultOptions): Promise<boolean> {
        return await this.get(key, options) != null;
    }

    save(key: string, obj: any, options: StorageOptions = this.defaultOptions): Promise<any> {
        if (obj == null) {
            return this.remove(key, options);
        }

        if (obj instanceof Set) {
            obj = Array.from(obj);
        }

        const json = JSON.stringify(obj);
        switch (options.htmlStorageLocation) {
            case HtmlStorageLocation.Local:
                window.localStorage.setItem(key, json);
                break;
            case HtmlStorageLocation.Memory:
                this.memoryStorage.set(key, json);
                break;
            case HtmlStorageLocation.Session:
                 default:
                window.sessionStorage.setItem(key, json);
                break;
        }
        return Promise.resolve();
    }

    remove(key: string, options: StorageOptions = this.defaultOptions): Promise<any> {
        switch (options.htmlStorageLocation) {
            case HtmlStorageLocation.Local:
                window.localStorage.removeItem(key);
                break;
            case HtmlStorageLocation.Memory:
                this.memoryStorage.delete(key);
                break;
            case HtmlStorageLocation.Session:
                 default:
                window.sessionStorage.removeItem(key);
                break;
        }
        return Promise.resolve();
    }
}
