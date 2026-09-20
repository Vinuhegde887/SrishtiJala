"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveProjectCode = exports.getProjectById = exports.getPublishedProjects = exports.getProjectPreview = exports.deleteProject = exports.rollbackToVersion = exports.makeRevision = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const openai_1 = __importDefault(require("../configs/openai"));
// controller func to make revision
const makeRevision = async (req, res) => {
    const userId = req.userId;
    try {
        const { projectId } = req.params;
        const { message } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!userId || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (user.credits < 5) {
            return res.status(403).json({ message: 'add more credits to make changes' });
        }
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Please enter a valid prompt' });
        }
        const currentProject = await prisma_1.default.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: { versions: true }
        });
        if (!currentProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        await prisma_1.default.conversation.create({
            data: {
                role: 'user',
                content: message,
                projectId
            }
        });
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        });
        //Enhance user prompt
        const promptEnhanceResponse = await openai_1.default.chat.completions.create({
            model: 'nvidia/nemotron-3.5-lightning:free',
            messages: [
                {
                    role: 'system',
                    content: `
                    You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

    Enhance this by:
    1. Being specific about what elements to change
    2. Mentioning design details (colors, spacing, sizes)
    3. Clarifying the desired outcome
    4. Using clear technical terms

Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).`
                }, {
                    role: 'user',
                    content: ` User's request: "${message}"`
                }
            ]
        });
        const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;
        await prisma_1.default.conversation.create({
            data: {
                role: 'assistant',
                content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
                projectId
            }
        });
        await prisma_1.default.conversation.create({
            data: {
                role: 'assistant',
                content: 'Now making chnages to your website...',
                projectId
            }
        });
        //GENERATE website code
        const codeGenerationResponse = await openai_1.default.chat.completions.create({
            model: 'nvidia/nemotron-3.5-lightning:free',
            messages: [{
                    role: 'system',
                    content: `
                You are an expert web developer. 

    CRITICAL REQUIREMENTS:
    - Return ONLY the complete updated HTML code with the requested changes.
    - Use Tailwind CSS for ALL styling (NO custom CSS).
    - Use Tailwind utility classes for all styling changes.
    - Include all JavaScript in <script> tags before closing </body>
    - Make sure it's a complete, standalone HTML document with Tailwind CSS
    - Return the HTML Code Only, nothing else

    Apply the requested changes while maintaining the Tailwind CSS styling approach.`
                }, {
                    role: 'user',
                    content: `Here is the current website code: "${currentProject.current_code}"
                 THe user wants this change: "${enhancedPrompt}"`
                }
            ]
        });
        const code = codeGenerationResponse.choices[0].message.content || '';
        const version = await prisma_1.default.version.create({
            data: {
                code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                description: 'changes made',
                projectId
            }
        });
        await prisma_1.default.conversation.create({
            data: {
                role: 'assistant',
                content: "T've made the changes to your website! You can now preview it",
                projectId
            }
        });
        await prisma_1.default.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                current_version_index: version.id,
            }
        });
        res.json({ message: 'Changes made successfully' });
    }
    catch (error) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { credits: { increment: 5 } }
        });
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.makeRevision = makeRevision;
//controller  func to rollback to a specific version
const rollbackToVersion = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { projectId, versionId } = req.params;
        const project = await prisma_1.default.websiteProject.findUnique({
            where: { id: projectId, userId },
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const version = await prisma_1.default.version.findFirst({
            where: { id: versionId, projectId }
        });
        if (!version) {
            return res.status(404).json({ message: 'Version not found' });
        }
        await prisma_1.default.websiteProject.update({
            where: { id: projectId, userId },
            data: {
                current_code: version.code,
                current_version_index: version.id
            }
        });
        await prisma_1.default.conversation.create({
            data: {
                role: 'assistant',
                content: "I've rolled back your website to selected version. You can now preview it",
                projectId
            }
        });
        res.json({ message: 'Version rolled back' });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.rollbackToVersion = rollbackToVersion;
//  controller func to delete a project
const deleteProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        await prisma_1.default.websiteProject.delete({
            where: { id: projectId, userId }
        });
        res.json({ message: 'Project deleted succcessfully' });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.deleteProject = deleteProject;
//controller func to get code for preview
const getProjectPreview = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const project = await prisma_1.default.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: { versions: true }
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ project });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.getProjectPreview = getProjectPreview;
//get published projects
const getPublishedProjects = async (req, res) => {
    try {
        const projects = await prisma_1.default.websiteProject.findMany({
            where: { isPublished: true },
            include: { user: true }
        });
        res.json({ code: projects });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.getPublishedProjects = getPublishedProjects;
//controller get single project by id
const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma_1.default.websiteProject.findFirst({
            where: { id: projectId },
        });
        if (!project || project.isPublished === false) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ code: project.current_code });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.getProjectById = getProjectById;
//controller for save project code
const saveProjectCode = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        const { code } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }
        const project = await prisma_1.default.websiteProject.update({
            where: { id: projectId, userId },
            data: { current_code: code, current_version_index: ' ' }
            // include:{versions: true}
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project saved successfully' });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
exports.saveProjectCode = saveProjectCode;
