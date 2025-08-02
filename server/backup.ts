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

// Ensure backup directory exists
const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Get list of all tables to backup
const TABLES_TO_BACKUP = [
  'users',
  'teams', 
  'tournaments',
  'matches',
  'predictions',
  'points_ledger',
  'support_tickets',
  'ticket_messages',
  'site_settings'
];

export class BackupManager {
  // Create a new backup
  static async createBackup(): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    let sqlContent = '';
    let totalRecords = 0;
    const existingTables: string[] = [];
    
    // Add header
    sqlContent += `-- CricProAce Database Backup\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Tables: ${TABLES_TO_BACKUP.join(', ')}\n\n`;
    
    // Disable foreign key checks
    sqlContent += `SET foreign_key_checks = 0;\n\n`;
    
    for (const tableName of TABLES_TO_BACKUP) {
      try {
        // Check if table exists
        const tableExists = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name = ${tableName}
        `);
        
        if (!tableExists[0] || tableExists[0].count === 0) {
          console.warn(`Table ${tableName} does not exist, skipping...`);
          continue;
        }
        
        existingTables.push(tableName);
        
        // Get table structure
        const createTableResult = await db.execute(sql`SHOW CREATE TABLE ${sql.identifier(tableName)}`);
        const createTableSql = createTableResult[0]['Create Table'];
        
        sqlContent += `-- Table: ${tableName}\n`;
        sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sqlContent += `${createTableSql};\n\n`;
        
        // Get table data
        const rows = await db.execute(sql`SELECT * FROM ${sql.identifier(tableName)}`);
        
        if (rows.length > 0) {
          // Get column names
          const columns = Object.keys(rows[0]);
          const columnList = columns.map(col => `\`${col}\``).join(', ');
          
          sqlContent += `-- Data for table: ${tableName}\n`;
          sqlContent += `LOCK TABLES \`${tableName}\` WRITE;\n`;
          sqlContent += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;
          
          const values = rows.map((row, index) => {
            const rowValues = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              }
              if (typeof value === 'boolean') return value ? '1' : '0';
              if (value instanceof Date) return `'${value.toISOString()}'`;
              return value;
            }).join(', ');
            
            return `(${rowValues})${index === rows.length - 1 ? ';' : ','}`;
          }).join('\n');
          
          sqlContent += values + '\n';
          sqlContent += `UNLOCK TABLES;\n\n`;
          totalRecords += rows.length;
        }
        
      } catch (error) {
        console.error(`Error backing up table ${tableName}:`, error);
        sqlContent += `-- Error backing up table ${tableName}: ${error}\n\n`;
      }
    }
    
    // Re-enable foreign key checks
    sqlContent += `SET foreign_key_checks = 1;\n\n`;
    sqlContent += `-- Backup completed: ${totalRecords} total records\n`;
    
    // Write to file
    fs.writeFileSync(filePath, sqlContent, 'utf8');
    
    const stats = fs.statSync(filePath);
    const backupId = timestamp;
    
    return {
      id: backupId,
      filename,
      size: stats.size,
      createdAt: new Date().toISOString(),
      tables: existingTables,
      recordCount: totalRecords
    };
  }
  
  // Get all available backups
  static async getBackupList(): Promise<BackupInfo[]> {
    try {
      const files = fs.readdirSync(BACKUP_DIR);
      const backups: BackupInfo[] = [];
      
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          
          // Parse backup info from file
          const content = fs.readFileSync(filePath, 'utf8');
          const tablesMatch = content.match(/-- Tables: (.+)/);
          const tables = tablesMatch ? tablesMatch[1].split(', ') : [];
          
          const recordsMatch = content.match(/-- Backup completed: (\d+) total records/);
          const recordCount = recordsMatch ? parseInt(recordsMatch[1], 10) : 0;
          
          const id = file.replace('.sql', '').replace('backup-', '');
          
          backups.push({
            id,
            filename: file,
            size: stats.size,
            createdAt: stats.mtime.toISOString(),
            tables,
            recordCount
          });
        }
      }
      
      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    } catch (error) {
      console.error('Error getting backup list:', error);
      return [];
    }
  }
  
  // Download a backup file
  static getBackupPath(backupId: string): string {
    const filename = `backup-${backupId}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }
    
    return filePath;
  }
  
  // Delete a backup
  static async deleteBackup(backupId: string): Promise<void> {
    const filename = `backup-${backupId}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found');
    }
    
    fs.unlinkSync(filePath);
  }
  
  // Restore from backup
  static async restoreFromBackup(sqlContent: string): Promise<{ recordCount: number }> {
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let recordCount = 0;
    
    try {
      // Execute each statement
      for (const statement of statements) {
        if (statement.toLowerCase().includes('insert into')) {
          recordCount++;
        }
        
        await db.execute(sql.raw(statement + ';'));
      }
      
      return { recordCount };
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}