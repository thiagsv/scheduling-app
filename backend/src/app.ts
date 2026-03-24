import path from "path"
import dotenv from "dotenv"
import express from "express"
import employeeRoutes from "./routes/employeeRoutes"
import commandRoutes from "./routes/commandRoutes"
import scheduleRoutes from "./routes/scheduleRoutes"
import "./db/database"
import { configureIntentLlmClient } from "./services/intentInterpreter"
import { GeminiIntentClient } from "./services/geminiIntentClient"

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") })

const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
if (geminiApiKey) {
    configureIntentLlmClient(
        new GeminiIntentClient(
            geminiApiKey,
            process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
        ),
    )
}

const app = express()
app.use(express.json())

app.use(employeeRoutes)
app.use(commandRoutes)
app.use(scheduleRoutes)

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})
