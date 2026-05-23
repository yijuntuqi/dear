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

// 用户操作
const userDB = {
    async createUser(email, passwordHash, username) {
		const result = await sql`
			INSERT INTO users (email, password_hash, username)
			VALUES (${email}, ${passwordHash}, ${username || email.split('@')[0]})
			RETURNING id, email, username, plan_type, created_at
		`;
		return result[0];
	},
    
    async findByEmail(email) {
        const result = await sql`
            SELECT * FROM users WHERE email = ${email}
        `;
        return result[0];
    },
    
    async getUser(userId) {
        const result = await sql`
            SELECT id, email, plan_type, created_at FROM users WHERE id = ${userId}
        `;
        return result[0];
    },
    
    async upgradePlan(userId, planType) {
        const result = await sql`
            UPDATE users SET plan_type = ${planType}, updated_at = NOW()
            WHERE id = ${userId}
            RETURNING id, email, plan_type
        `;
        return result[0];
    }
};

// 项目操作
const projectDB = {
    async create(userId, data) {
        const result = await sql`
            INSERT INTO projects (user_id, owner_name, relationship, theme, basic_info, stories, message)
            VALUES (${userId}, ${data.ownerName}, ${data.relationship}, ${data.theme},
                    ${JSON.stringify(data.basicInfo)}, ${JSON.stringify(data.stories)}, ${data.message})
            RETURNING *
        `;
        return result[0];
    },
    
    async update(projectId, data) {
        const result = await sql`
            UPDATE projects SET
                owner_name = COALESCE(${data.ownerName}, owner_name),
                relationship = COALESCE(${data.relationship}, relationship),
                theme = COALESCE(${data.theme}, theme),
                basic_info = COALESCE(${JSON.stringify(data.basicInfo)}::jsonb, basic_info),
                stories = COALESCE(${JSON.stringify(data.stories)}::jsonb, stories),
                message = COALESCE(${data.message}, message),
                color_scheme = COALESCE(${JSON.stringify(data.colorScheme)}::jsonb, color_scheme),
                uploaded_photos = COALESCE(${JSON.stringify(data.uploadedPhotos)}::jsonb, uploaded_photos),
                uploaded_audio = COALESCE(${JSON.stringify(data.uploadedAudio)}::jsonb, uploaded_audio),
                ai_conversation = COALESCE(${JSON.stringify(data.aiConversation)}::jsonb, ai_conversation),
                generated_html = COALESCE(${data.generatedHtml}, generated_html),
                status = COALESCE(${data.status}, status),
                updated_at = NOW()
            WHERE id = ${projectId}
            RETURNING *
        `;
        return result[0];
    },
    
    async getById(projectId) {
        const result = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
        return result[0];
    },
    
    async getUserProjects(userId) {
        const result = await sql`
            SELECT id, owner_name, relationship, theme, status, created_at, updated_at
            FROM projects WHERE user_id = ${userId}
            ORDER BY updated_at DESC
        `;
        return result;
    },
    
    async delete(projectId) {
        await sql`DELETE FROM projects WHERE id = ${projectId}`;
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
            VALUES (${userId}, ${projectId}, ${planType}, ${amount}, 'pending')
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
    }
};

module.exports = { testConnection, userDB, projectDB, exportDB, orderDB };