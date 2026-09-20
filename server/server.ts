import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import userRouter from "./routes/userRoutes";
import projectRouter from "./routes/projectRoutes";


const app = express();

const corsOptions ={
    origin:process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,

}

// Middleware
app.use(cors(corsOptions))
app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json({limit:'50mb'}));

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project',projectRouter);



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});