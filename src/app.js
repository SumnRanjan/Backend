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


app.get('/' , (req , res) =>{
    res.send("At the end, I become the bad chapter of her life")
})
export {app}