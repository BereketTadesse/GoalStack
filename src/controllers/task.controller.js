import Task from "../models/tasks.model.js";

const createtask = async (req, res) => {
    try {
        const { title, description } = req.body;

        // 1. DECLARE the variable here (at the top level of the function)
        // We initialize it as an empty array []
        let filePaths = [];

        // 2. FILL the variable if files exist
        if (req.files && req.files.length > 0) {
            filePaths = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
        }

        // 3. USE the variable
        const taskcreated = await Task.create({
            user: req.user._id,
            title,
            description,
            status: 'pending',
            attachment: filePaths // Matches the schema field name
        });

        res.status(201).json({ message: 'Task created successfully', taskcreated });

    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,
            errorMessage: error.message,
            stackTrace: error.stack
        });
    }
};
const getTasks = async (req, res) => {
    try {
        // 1. SEARCH LOGIC (Keep what you already have)
        const keyword = req.query.keyword ? {
            title: { $regex: req.query.keyword, $options: 'i' }
        } : {};

        // 2. PAGINATION VARIABLES
        const pageSize = 5; // How many items per page
        const page = Number(req.query.pageNumber) || 1; // Current page from URL, defaults to 1

        // 3. COUNT TOTAL TASKS
        // We need this to tell the frontend how many pages exist in total
        const count = await Task.countDocuments({ user: req.user._id, ...keyword });

        // 4. FETCH THE "PAGE"
        const tasks = await Task.find({ user: req.user._id, ...keyword })
            .populate('user', 'username email')
            .limit(pageSize)
            .skip(pageSize * (page - 1)); // The Math: Skip the previous pages' items

        // 5. SEND THE RESPONSE
        res.status(200).json({
            tasks,
            page,
            pages: Math.ceil(count / pageSize), // e.g., 12 tasks / 5 per page = 3 pages
            totalTasks: count
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const updatetasks = async (req, res) => {
    try {
        const tasks = await Task.findById(req.params.id);

        if (!tasks) {
            return res.status(404).json({ message: "task not found" });
        }
        if (tasks.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const updatedtask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "task updated successfully", updatedtask });
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,        // e.g., "ReferenceError"
            errorMessage: error.message,  // e.g., "post is not defined"            
            stackTrace: error.stack,      // This shows the exact line number in your file
            fullError: error              // Some extra details from MongoDB

        });
    }
};
const deletetasks = async (req, res) => {
    try {
        const tasks = await Task.findById(req.params.id);
        if (!tasks) {
            return res.status(400).json({ message: "task not found" });
        }
        if (tasks.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }
        await Task.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "task deleted successfully" });
    }

    catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,        // e.g., "ReferenceError"
            errorMessage: error.message,  // e.g., "post is not defined"            
            stackTrace: error.stack,      // This shows the exact line number in your file
            fullError: error              // Some extra details from MongoDB
        });
    }
};


export { createtask, getTasks, updatetasks, deletetasks };