import express from "express"
import "./db/database"

const app = express()
app.use(express.json())

app.get("/", (req, res) => {
    res.send("started")
})

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})

