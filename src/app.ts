import express from "express"
import employeeRoutes from "./routes/employeeRoutes"
import "./db/database"

const app = express()
app.use(express.json())

app.get("/", (req, res) => {
    res.send("started")
})

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})

app.use(employeeRoutes)