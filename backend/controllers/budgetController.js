const Event = require("../models/Event")

// Get event budget and analysis
exports.getEventBudget = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const event = await Event.findById(eventId).populate("accessPermissions.userId", "name email")

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    // Check if user is organizer or has access permission
    const isOrganizer = event.organizer.toString() === req.user.id
    const hasAccess = event.accessPermissions.some((perm) => perm.userId._id.toString() === req.user.id)

    if (!isOrganizer && !hasAccess && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to view budget" })
    }

    res.json({
      success: true,
      budget: event.budget,
      isOrganizer,
      accessLevel: isOrganizer
        ? "owner"
        : event.accessPermissions.find((p) => p.userId._id.toString() === req.user.id)?.permission || "view",
    })
  } catch (error) {
    next(error)
  }
}

// Add expense
exports.addExpense = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { description, amount, category } = req.body

    if (!description || !amount || amount <= 0) {
      return res.status(400).json({ error: "Description and amount (greater than 0) are required" })
    }

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only organizer or collaborators can add expenses" })
    }

    const expense = {
      description: description.trim(),
      amount: Number(amount),
      category: category || "other",
      date: new Date(),
    }

    if (!event.budget) {
      event.budget = { total: 0, income: 0, spent: 0, expenses: [] }
    }

    event.budget.expenses.push(expense)
    event.budget.spent = (event.budget.spent || 0) + Number(amount)
    await event.save()

    res.json({
      success: true,
      budget: event.budget,
    })
  } catch (error) {
    next(error)
  }
}

// Update budget total
exports.updateBudgetTotal = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { total } = req.body

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only organizer can update budget" })
    }

    event.budget.total = Number(total)
    await event.save()

    res.json({
      success: true,
      budget: event.budget,
    })
  } catch (error) {
    next(error)
  }
}

// Add task
exports.addTask = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { title, description, assignedTo, dueDate } = req.body

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only organizer can add tasks" })
    }

    const task = {
      title,
      description,
      assignedTo: assignedTo || null,
      dueDate,
      status: "pending",
      createdAt: new Date(),
    }

    event.tasks.push(task)
    await event.save()
    await event.populate("tasks")

    res.json({
      success: true,
      tasks: event.tasks,
    })
  } catch (error) {
    next(error)
  }
}

// Update task status
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { eventId, taskId } = req.params
    const { status } = req.body

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const task = event.tasks.id(taskId)

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update task" })
    }

    task.status = status
    await event.save()

    res.json({
      success: true,
      tasks: event.tasks,
    })
  } catch (error) {
    next(error)
  }
}

// Grant access permission
exports.grantAccess = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { userId, permission } = req.body

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only organizer can grant access" })
    }

    const existingAccess = event.accessPermissions.findIndex((p) => p.userId.toString() === userId)

    if (existingAccess !== -1) {
      event.accessPermissions[existingAccess].permission = permission
    } else {
      event.accessPermissions.push({ userId, permission })
    }

    await event.save()
    await event.populate("accessPermissions.userId", "name email")

    res.json({
      success: true,
      accessPermissions: event.accessPermissions,
    })
  } catch (error) {
    next(error)
  }
}

// Update spent amount directly
exports.updateBudgetSpent = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { spent } = req.body

    if (spent === undefined || spent === null) {
      return res.status(400).json({ error: "Spent amount is required" })
    }

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only organizer or collaborators can update budget" })
    }

    if (!event.budget) {
      event.budget = { total: 0, income: 0, spent: 0, expenses: [] }
    }

    event.budget.spent = Number(spent)
    await event.save()

    res.json({
      success: true,
      budget: event.budget,
    })
  } catch (error) {
    next(error)
  }
}

// Update income
exports.updateBudgetIncome = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { income } = req.body

    if (income === undefined || income === null) {
      return res.status(400).json({ error: "Income amount is required" })
    }

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only organizer or collaborators can update budget" })
    }

    if (!event.budget) {
      event.budget = { total: 0, income: 0, spent: 0, expenses: [] }
    }

    event.budget.income = Number(income)
    await event.save()

    res.json({
      success: true,
      budget: event.budget,
    })
  } catch (error) {
    next(error)
  }
}

// Get tasks
exports.getEventTasks = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const hasAccess = event.accessPermissions.some((perm) => perm.userId._id.toString() === req.user.id)

    if (!isOrganizer && !hasAccess && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to view tasks" })
    }

    res.json({
      success: true,
      tasks: event.tasks,
    })
  } catch (error) {
    next(error)
  }
}
