import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : '16kb'})) //for json data
app.use(express.urlencoded({extended : true})) // for url-encoded data
app.use(express.static("public"))
app.use(cookieParser())


//route imort
import userRouter from './routes/user.routes.js'
//route declaration
app.use("/api/v1/users" , userRouter)


export {app}