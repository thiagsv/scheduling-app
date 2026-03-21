import express from "express"
import employeeRoutes from "./routes/employeeRoutes"
import shiftRoutes from "./routes/shiftRoutes"
import commandRoutes from "./routes/commandRoutes"
import "./db/database"

const app = express()
app.use(express.json())

app.get("/", (req, res) => {
    res.send("started")
})

app.use(employeeRoutes)
app.use(shiftRoutes)
app.use(commandRoutes)

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})