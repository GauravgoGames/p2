import fs from 'fs';
import path from 'path';
import { pool } from './db';

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  tables: string[];
  recordCount: number;
}

const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export class SimpleBackupManager {
  static async createBackup(): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    const client = await pool.connect();
    let totalRecords = 0;
    let sqlContent = '-- Database Backup\n-- Created: ' + new Date().toISOString() + '\n\n';
    
    try {
      // Get all table names
      const tableResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const tables = tableResult.rows.map(row => row.table_name);
      
      for (const tableName of tables) {
        try {
          // Get row count
          const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          const rowCount = parseInt(countResult.rows[0].count);
          totalRecords += rowCount;
          
          if (rowCount > 0) {
            // Get table data
            const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
            
            sqlContent += `\n-- Table: ${tableName} (${rowCount} records)\n`;
            sqlContent += `DELETE FROM "${tableName}";\n`;
            
            for (const row of dataResult.rows) {
              const columns = Object.keys(row);
              const values = columns.map(col => {
                const val = row[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (val instanceof Date) return `'${val.toISOString()}'`;
                return val.toString();
              });
              
              sqlContent += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
            }
          }
        } catch (error) {
          console.warn(`Skipping table ${tableName}:`, error);
        }
      }
      
      fs.writeFileSync(filePath, sqlContent);
      const stats = fs.statSync(filePath);
      
      return {
        id: timestamp,
        filename,
        size: stats.size,
        createdAt: new Date().toISOString(),
        tables,
        recordCount: totalRecords
      };
    } finally {
      client.release();
    }
  }

  static async listBackups(): Promise<BackupInfo[]> {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(filename => {
        const filePath = path.join(BACKUP_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          id: filename.replace('.sql', ''),
          filename,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          tables: [],
          recordCount: 0
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return files;
  }

  static async downloadBackup(backupId: string): Promise<Buffer> {
    const filename = backupId.endsWith('.sql') ? backupId : `${backupId}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }
    
    return fs.readFileSync(filePath);
  }

  static async restoreBackup(sqlContent: string): Promise<{ recordCount: number }> {
    const client = await pool.connect();
    let recordCount = 0;
    
    try {
      // Clean the SQL content and split properly
      const cleanContent = sqlContent
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\r/g, '\n')    // Handle old Mac line endings
        .trim();
      
      // Split SQL content into individual statements more carefully
      const statements = cleanContent
        .split(';\n')  // Split on semicolon followed by newline
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'DELETE' && stmt !== 'INSERT');
      
      for (const statement of statements) {
        if (statement.trim() && !statement.startsWith('--')) {
          try {
            // Add semicolon back if missing
            const finalStatement = statement.endsWith(';') ? statement : statement + ';';
            await client.query(finalStatement);
            
            if (finalStatement.toUpperCase().includes('INSERT INTO')) {
              recordCount++;
            }
          } catch (error) {
            console.warn(`Skipping problematic statement: ${statement.substring(0, 100)}...`);
            console.warn('Error:', error);
          }
        }
      }
      
      return { recordCount };
    } finally {
      client.release();
    }
  }

  static async deleteBackup(backupId: string): Promise<void> {
    const filename = backupId.endsWith('.sql') ? backupId : `${backupId}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}