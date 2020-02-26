const express = require('express')
const app = express()
const PORT = 5000

app.use(express.static(__dirname + "/../client"))

app.listen(PORT)