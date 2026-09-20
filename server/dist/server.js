"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./lib/auth");
const prisma_1 = __importDefault(require("./lib/prisma"));
const node_1 = require("better-auth/node");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const app = (0, express_1.default)();
const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,
};
const clearInvalidSessionCookie = async (req, res, next) => {
    const cookieHeader = req.headers.cookie;
    const token = cookieHeader?.match(/(?:^|;\s*)auth_session=([^;]+)/)?.[1];
    if (!token) {
        return next();
    }
    const session = await prisma_1.default.session.findUnique({
        where: { token },
        select: { expiresAt: true },
    });
    if (!session || session.expiresAt <= new Date()) {
        res.clearCookie('auth_session', { path: '/' });
    }
    next();
};
// Middleware
app.use((0, cors_1.default)(corsOptions));
app.use('/api/auth', clearInvalidSessionCookie);
app.all('/api/auth/{*any}', (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json({ limit: '50mb' }));
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.use('/api/user', userRoutes_1.default);
app.use('/api/project', projectRoutes_1.default);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
