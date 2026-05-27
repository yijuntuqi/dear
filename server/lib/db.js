const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
    try {
        const result = await sql`SELECT NOW()`;
        console.log('数据库连接成功:', result[0]);
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error);
        return false;
    }
}

// 数据库操作重试包装
async function withRetry(fn, maxRetries = 2) {
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries) throw error;
            console.log(`数据库操作失败，重试 ${i + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// 修改关键操作示例
const userDB = {
    async getUser(userId) {
        return withRetry(async () => {
            const result = await sql`
                SELECT id, nickname, phone, email, plan_type, created_at 
                FROM users WHERE id = ${userId}
            `;
            return result[0];
        });
    },
    // ... 其他方法同样包装
};

// 用户操作
const userDB = {
    async createUser(nickname, phone, email, passwordHash) {
        const result = await sql`
            INSERT INTO users (nickname, phone, email, password_hash)
            VALUES (${nickname}, ${phone}, ${email || null}, ${passwordHash})
            RETURNING id, nickname, phone, email, plan_type, created_at
        `;
        return result[0];
    },
    
    // 通过手机号查找用户（登录用）
    async findByPhone(phone) {
        const result = await sql`
            SELECT * FROM users WHERE phone = ${phone}
        `;
        return result[0];
    },
    
    // 通过昵称查找（注册时校验唯一性）
    async findByNickname(nickname) {
        const result = await sql`
            SELECT * FROM users WHERE nickname = ${nickname}
        `;
        return result[0];
    },
    
    // 通过邮箱查找（注册时校验唯一性）
    async findByEmail(email) {
        if (!email) return null;
        const result = await sql`
            SELECT * FROM users WHERE email = ${email}
        `;
        return result[0];
    },
    
    async getUser(userId) {
        return withRetry(async () => {
            const result = await sql`
                SELECT id, nickname, phone, email, plan_type, created_at 
                FROM users WHERE id = ${userId}
            `;
            return result[0];
        });
    },
    
    async upgradePlan(userId, planType) {
        const result = await sql`
            UPDATE users SET plan_type = ${planType}, updated_at = NOW()
            WHERE id = ${userId}
            RETURNING id, nickname, phone, email, plan_type
        `;
        return result[0];
    }
};

// 项目操作
const projectDB = {
    // 创建项目时记录类型
    async create(userId, data, projectType = 'free') {
        const result = await sql`
            INSERT INTO projects (user_id, owner_name, relationship, theme, basic_info, stories, message, project_type)
            VALUES (${userId}, ${data.ownerName}, ${data.relationship}, ${data.theme},
                    ${JSON.stringify(data.basicInfo)}, ${JSON.stringify(data.stories)}, ${data.message}, ${projectType})
            RETURNING *
        `;
        return result[0];
    },
    
    // 标记VIP权益已使用
    async markVipUsed(projectId) {
        const result = await sql`
            UPDATE projects SET vip_used = TRUE, status = 'completed', updated_at = NOW()
            WHERE id = ${projectId}
            RETURNING *
        `;
        return result[0];
    },
    
    // 获取用户VIP使用次数
    async getVipUsedCount(userId) {
        const result = await sql`
            SELECT COUNT(*) as count FROM projects 
            WHERE user_id = ${userId} AND project_type = 'vip' AND vip_used = TRUE
        `;
        return parseInt(result[0].count);
    },
    
    // 获取用户项目列表（含类型信息）
    async getUserProjects(userId) {
        const result = await sql`
            SELECT id, owner_name, relationship, theme, status, project_type, vip_used, created_at, updated_at
            FROM projects WHERE user_id = ${userId}
            ORDER BY updated_at DESC
        `;
        return result;
    }
};

// 导出记录操作
const exportDB = {
    async create(projectId, userId, type, fileUrl) {
        const result = await sql`
            INSERT INTO exports (project_id, user_id, type, file_url)
            VALUES (${projectId}, ${userId}, ${type}, ${fileUrl})
            RETURNING *
        `;
        return result[0];
    },
    
    async getProjectExports(projectId) {
        const result = await sql`
            SELECT * FROM exports WHERE project_id = ${projectId}
            ORDER BY created_at DESC
        `;
        return result;
    }
};

// 订单操作
const orderDB = {
    async create(userId, projectId, planType, amount) {
        const result = await sql`
            INSERT INTO orders (user_id, project_id, plan_type, amount, payment_status)
            VALUES (${userId}, ${projectId || null}, ${planType}, ${amount}, 'pending')
            RETURNING *
        `;
        return result[0];
    },
    
    async markCompleted(orderId) {
        const result = await sql`
            UPDATE orders SET payment_status = 'completed'
            WHERE id = ${orderId}
            RETURNING *
        `;
        return result[0];
    },
    
    async getUserOrders(userId) {
        const result = await sql`
            SELECT * FROM orders WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;
        return result;
    },
    
    async getPendingOrders() {
        const result = await sql`
            SELECT o.*, u.nickname, u.phone 
            FROM orders o JOIN users u ON o.user_id = u.id
            WHERE o.payment_status = 'pending'
            ORDER BY o.created_at DESC
        `;
        return result;
    }
};

module.exports = { testConnection, userDB, projectDB, exportDB, orderDB };