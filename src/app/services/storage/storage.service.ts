import { Injectable, signal } from '@angular/core';
import initSqlJs, { Database } from 'sql.js';

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private db: Database | null = null;
  private queryQueue: Array<() => void> = [];
  private isProcessing = false;
  private initialized = signal(false);
  private storage: Map<string, any> = new Map();
  private SQL: any = null;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    try {
      // Initialize sql.js
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `/${file}`
      });

      // Try to load existing database from IndexedDB
      const savedDb = await this.loadDatabaseFromIndexedDB();
      
      if (savedDb) {
        this.db = new this.SQL.Database(new Uint8Array(savedDb));
        console.log('Loaded existing database from IndexedDB');
      } else {
        // Create new database
        this.db = new this.SQL.Database();
        console.log('Created new database');
        
        // Create tables
        this.createTables();
      }

      this.initialized.set(true);
      
      // Set up auto-save every 30 seconds
      setInterval(() => this.saveDatabaseToIndexedDB(), 30000);
      
      // Save on page unload
      window.addEventListener('beforeunload', () => {
        this.saveDatabaseToIndexedDB();
      });
      
    } catch (error) {
      console.error('Error initializing sql.js:', error);
      // Fallback to creating new db
      if (this.SQL) {
        this.db = new this.SQL.Database();
        this.createTables();
        this.initialized.set(true);
      }
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Create requests table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS requests (
        request_id INTEGER PRIMARY KEY AUTOINCREMENT,
        duplicate_id TEXT,
        request TEXT,
        failed INTEGER DEFAULT 0
      );
    `);

    // Create responses table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS responses (
        data_key TEXT PRIMARY KEY,
        controller TEXT,
        action TEXT,
        request_data TEXT,
        response_data TEXT,
        last_accessed INTEGER DEFAULT 0
      );
    `);

    // Create index for better performance
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_responses_accessed 
      ON responses(last_accessed);
    `);

    console.log('Database tables created');
  }

  private async loadDatabaseFromIndexedDB(): Promise<ArrayBuffer | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('IntensityDB', 1);

      request.onerror = () => {
        console.log('IndexedDB not available');
        resolve(null);
      };

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('sqljs')) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(['sqljs'], 'readonly');
        const store = transaction.objectStore('sqljs');
        const getRequest = store.get('database');

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };

        getRequest.onerror = () => {
          resolve(null);
        };
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('sqljs')) {
          db.createObjectStore('sqljs');
        }
      };
    });
  }

  private async saveDatabaseToIndexedDB(): Promise<void> {
    if (!this.db) return;

    try {
      const data = this.db.export();
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('IntensityDB', 1);

        request.onerror = () => reject(new Error('Failed to open IndexedDB'));

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['sqljs'], 'readwrite');
          const store = transaction.objectStore('sqljs');
          const putRequest = store.put(data, 'database');

          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to save to IndexedDB'));
        };

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('sqljs')) {
            db.createObjectStore('sqljs');
          }
        };
      });
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  public async executeSQL(query: string): Promise<SqlQueryResult> {
    return this.enqueueQuery(async () => {
      if (!this.db) {
        return { columns: [], values: [] };
      }

      try {
        // Execute the query using sql.js
        const results = this.db.exec(query);
        
        if (results.length === 0) {
          return { columns: [], values: [] };
        }

        const result = results[0];
        return {
          columns: result.columns,
          values: result.values
        };
      } catch (error) {
        console.error('SQL execution error:', error, query);
        return { columns: [], values: [] };
      }
    });
  }

  public async set(key: string, value: any): Promise<void> {
    return this.enqueueQuery(async () => {
      this.storage.set(key, value);
      
      // Also store in localStorage as backup
      try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
      } catch (e) {
        console.warn('LocalStorage full, but using IndexedDB so continuing');
      }
    });
  }

  public async get(key: string): Promise<any> {
    return this.enqueueQuery(async () => {
      // First check in-memory storage
      if (this.storage.has(key)) {
        return this.storage.get(key);
      }
      
      // Then check localStorage - return raw value
      try {
        const item = localStorage.getItem(key);
        if (item !== null) {
          // Cache in memory and return as-is
          this.storage.set(key, item);
          return item;
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
      
      return null;
    });
  }

  public async remove(key: string): Promise<void> {
    return this.enqueueQuery(async () => {
      this.storage.delete(key);
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing from localStorage:', e);
      }
    });
  }

  public async clear(): Promise<void> {
    return this.enqueueQuery(async () => {
      this.storage.clear();
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    });
  }

  public async clearResponseCache(): Promise<void> {
    if (!this.db) return;
    
    return this.enqueueQuery(async () => {
      try {
        this.db!.run('DELETE FROM responses;');
        await this.saveDatabaseToIndexedDB();
        console.log('Response cache cleared');
      } catch (e) {
        console.error('Error clearing response cache:', e);
      }
    });
  }

  public async clearAllUserData(): Promise<void> {
    return this.enqueueQuery(async () => {
      // Clear in-memory storage
      this.storage.clear();

      // Clear all intensity-related localStorage keys
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('intensity__')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }

      // Clear SQL database tables
      if (this.db) {
        try {
          this.db.run('DELETE FROM responses;');
          this.db.run('DELETE FROM requests;');
          await this.saveDatabaseToIndexedDB();
        } catch (e) {
          console.error('Error clearing database tables:', e);
        }
      }

      // Clear IndexedDB entirely
      try {
        await this.clearIndexedDB();
      } catch (e) {
        console.error('Error clearing IndexedDB:', e);
      }

      console.log('All user data cleared');
    });
  }

  private clearIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('IntensityDB');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }

  public getCacheStats(): { responseCount: number; requestCount: number } {
    if (!this.db) return { responseCount: 0, requestCount: 0 };

    try {
      const responseResult = this.db.exec('SELECT COUNT(*) FROM responses;');
      const requestResult = this.db.exec('SELECT COUNT(*) FROM requests;');

      return {
        responseCount: Number(responseResult[0]?.values[0]?.[0] || 0),
        requestCount: Number(requestResult[0]?.values[0]?.[0] || 0)
      };
    } catch {
      return { responseCount: 0, requestCount: 0 };
    }
  }

  private enqueueQuery<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queryQueue.push(() => {
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.processQueue();
          });
      });
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private processQueue(): void {
    if (this.queryQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const next = this.queryQueue.shift();
    if (next) next();
  }

  public isInitialized(): boolean {
    return this.initialized();
  }
}
