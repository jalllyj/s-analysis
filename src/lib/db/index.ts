import { getDb } from 'coze-coding-dev-sdk';
import * as schema from '../../storage/database/shared/schema';

// 使用coze-coding-dev-sdk获取数据库实例
export const db = await getDb(schema);

export default db;
