import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../src/lib/db';

async function main() {
  console.log('开始数据库迁移...');
  
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

main();
