import express from "express"
import employeeRoutes from "./routes/employeeRoutes"
import commandRoutes from "./routes/commandRoutes"
import scheduleRoutes from "./routes/scheduleRoutes"
import "./db/database"

const app = express()
app.use(express.json())

app.use(employeeRoutes)
app.use(commandRoutes)
app.use(scheduleRoutes)

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})